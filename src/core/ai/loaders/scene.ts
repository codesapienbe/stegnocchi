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
    // Expect host app to provide model URL via global or config; we keep a lightweight placeholder
    const session = await ort.InferenceSession.create('/models/clip-visual.onnx');
    const adapter: SceneEmbedderLike = {
      async embed(image: any): Promise<number[]> {
        // Placeholder: requires preprocessing to tensor which is out of scope here
        logWarn(Component.APP, 'CLIP ONNX adapter embed called without preprocessing; returning empty vector');
        return [];
      },
      async describe(): Promise<string> {
        return '';
      },
      tags: [],
    };
    logInfo(Component.APP, 'Loaded CLIP (ONNX) scene-embedder placeholder');
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

  logInfo(Component.APP, 'Registered scene-embedder loader with dynamic backend placeholder');
} 