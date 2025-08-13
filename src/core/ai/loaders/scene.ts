import { modelRegistry } from '../../modelRegistry';
import { logInfo, logWarn, logError, Component } from '../../logger';

export interface SceneEmbedderLike {
  embed(image: any): Promise<number[]>;
  describe?(image: any): Promise<string> | string;
  tags?: string[];
}

async function loadClipOnnxAdapter(): Promise<SceneEmbedderLike> {
  try {
    const ort = await import('onnxruntime-web');

    // Allow host to override model URL via global or environment
    const globalAny = typeof window !== 'undefined' ? (window as any) : {};
    const modelUrl: string = globalAny.CLIP_VISUAL_MODEL_URL || '/models/clip-visual.onnx';

    const session = await ort.InferenceSession.create(modelUrl);

    async function preprocessToCHW(image: any, size: number = 224): Promise<Float32Array> {
      // Create an offscreen canvas for preprocessing on web
      if (typeof document === 'undefined') {
        // Non-web environments are not supported in this adapter
        throw new Error('CLIP preprocessing requires a DOM canvas (web environment)');
      }
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get 2D context for preprocessing');

      // Draw image resized into canvas
      const w = (image as any).videoWidth || (image as any).naturalWidth || (image as any).width || size;
      const h = (image as any).videoHeight || (image as any).naturalHeight || (image as any).height || size;
      ctx.drawImage(image, 0, 0, w, h, 0, 0, size, size);

      const { data } = ctx.getImageData(0, 0, size, size);
      const floatData = new Float32Array(3 * size * size);
      const mean = [0.48145466, 0.4578275, 0.40821073];
      const std = [0.26862954, 0.26130258, 0.27577711];

      // Convert RGBA HWC to CHW normalized
      let px = 0;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const r = data[px] / 255; // R
          const g = data[px + 1] / 255; // G
          const b = data[px + 2] / 255; // B
          const i = y * size + x;
          floatData[i] = (r - mean[0]) / std[0]; // C0
          floatData[size * size + i] = (g - mean[1]) / std[1]; // C1
          floatData[2 * size * size + i] = (b - mean[2]) / std[2]; // C2
          px += 4;
        }
      }
      return floatData;
    }

    async function infer(image: any): Promise<number[]> {
      try {
        // Prepare input tensor
        const inputData = await preprocessToCHW(image, 224);
        const inputTensor = new ort.Tensor('float32', inputData, [1, 3, 224, 224]);

        // Determine input/output names dynamically
        const inputName = session.inputNames[0];
        const outputName = session.outputNames[0];

        const results = await session.run({ [inputName]: inputTensor });
        const output = results[outputName];
        if (!output || !output.data) {
          logWarn(Component.APP, 'CLIP inference returned empty output');
          return [];
        }
        const arr = Array.from(output.data as Float32Array | Float64Array | number[]);
        // Optional: L2 normalize for cosine similarity use cases
        const norm = Math.sqrt(arr.reduce((sum, v) => sum + v * v, 0)) || 1;
        const normalized = arr.map((v) => v / norm);
        return normalized;
      } catch (e) {
        logError(Component.APP, 'CLIP inference failed', { error: e instanceof Error ? e.message : String(e) });
        return [];
      }
    }

    const adapter: SceneEmbedderLike = {
      async embed(image: any): Promise<number[]> {
        return await infer(image);
      },
      async describe(): Promise<string> {
        return '';
      },
      tags: [],
    };
    logInfo(Component.APP, 'Loaded CLIP (ONNX) scene-embedder');
    return adapter;
  } catch (e) {
    logWarn(Component.APP, 'CLIP ONNX adapter not available', { error: e instanceof Error ? e.message : String(e) });
    throw e;
  }
}

export function registerSceneEmbedderLoaders(): void {
  modelRegistry.register('scene-embedder', async () => {
    try {
      return await loadClipOnnxAdapter();
    } catch (finalError) {
      const message = 'No scene embedding backend available. Install CLIP (onnxruntime-web or TFJS) and wire preprocessing.';
      logError(Component.APP, 'Scene-embedder loader failed', { error: finalError instanceof Error ? finalError.message : String(finalError) });
      throw new Error(message);
    }
  });

  logInfo(Component.APP, 'Registered scene-embedder loader with dynamic backend');
} 