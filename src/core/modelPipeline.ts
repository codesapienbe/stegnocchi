import { logInfo, logWarn, logError, Component } from './logger';
import { modelRegistry, ModelName } from './modelRegistry';
import { VectorMetadata, FaceEmbedding, ObjectDetection, SceneEmbedding } from './vectorMetadata';

export interface ModelProcessor {
  name: ModelName;
  process: (model: any, image: any) => Promise<Partial<VectorMetadata>>;
  warmup?: (model: any) => Promise<void> | void;
}

export interface PipelineOptions {
  preload?: boolean;
  warmup?: boolean;
  onProgress?: (currentIndex: number, total: number, stepName: string) => void;
}

export interface PipelineResult {
  metadata: VectorMetadata;
  steps: Array<{ name: string; durationMs: number; success: boolean }>;
}

export async function runModelPipeline(
  image: any,
  processors: ModelProcessor[],
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  const total = processors.length;
  const steps: Array<{ name: string; durationMs: number; success: boolean }> = [];

  try {
    if (options.preload) {
      for (const p of processors) {
        try {
          await modelRegistry.get(p.name, { warmup: options.warmup ? p.warmup : undefined });
        } catch (e) {
          // already logged in registry
        }
      }
      logInfo(Component.APP, 'Pipeline preload completed', { models: processors.map((p) => p.name) });
    }

    const aggregated: VectorMetadata = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      faces: [],
      objects: [],
      scene: undefined,
      custom: {},
    };

    for (let i = 0; i < processors.length; i++) {
      const p = processors[i];
      options.onProgress?.(i, total, p.name);
      const start = Date.now();
      try {
        const handle = await modelRegistry.get(p.name, { warmup: options.warmup ? p.warmup : undefined });
        const partial = await p.process(handle.instance, image);

        if (Array.isArray(partial.faces)) {
          aggregated.faces = (aggregated.faces || []).concat(partial.faces as FaceEmbedding[]);
        }
        if (Array.isArray(partial.objects)) {
          aggregated.objects = (aggregated.objects || []).concat(partial.objects as ObjectDetection[]);
        }
        if (partial.scene) {
          aggregated.scene = partial.scene as SceneEmbedding;
        }
        aggregated.custom = { ...(aggregated.custom || {}), ...(partial.custom || {}) };

        const durationMs = Date.now() - start;
        steps.push({ name: p.name, durationMs, success: true });
        logInfo(Component.APP, 'Pipeline step completed', { step: p.name, durationMs });
      } catch (error) {
        const durationMs = Date.now() - start;
        steps.push({ name: p.name, durationMs, success: false });
        logWarn(Component.APP, 'Pipeline step failed', {
          step: p.name,
          durationMs,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    options.onProgress?.(total, total, 'done');
    logInfo(Component.APP, 'Pipeline completed', { steps: steps.length });

    return { metadata: aggregated, steps };
  } catch (error) {
    logError(Component.APP, 'Pipeline exception', { error: error instanceof Error ? error.message : String(error) });
    return { metadata: { version: '1.0', createdAt: new Date().toISOString() }, steps };
  }
} 