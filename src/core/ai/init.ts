import { modelRegistry, ModelName } from '../modelRegistry';
import { logInfo, logWarn, logError, Component } from '../logger';

export interface AIInitOptions {
  preload?: boolean;
  warmup?: boolean;
  timeoutMs?: number;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

export async function initializeAIModels(options?: AIInitOptions): Promise<void> {
  const { preload = true, warmup = false, timeoutMs = 5000 } = options || {};
  const modelNames: ModelName[] = ['face-detector', 'object-detector', 'scene-embedder'];

  try {
    logInfo(Component.APP, 'AI model initialization started', { preload, warmup, timeoutMs });

    if (preload) {
      try {
        await modelRegistry.preload(modelNames, {
          warmup: warmup
            ? async (name: ModelName, model: any) => {
                try {
                  // Best-effort warmup that does not require actual image tensors
                  if (typeof model?.estimateFaces === 'function') {
                    await withTimeout(Promise.resolve(), timeoutMs, `${String(name)} warmup`);
                  } else if (typeof model?.detect === 'function') {
                    await withTimeout(Promise.resolve(), timeoutMs, `${String(name)} warmup`);
                  } else if (typeof model?.embed === 'function') {
                    await withTimeout(Promise.resolve(), timeoutMs, `${String(name)} warmup`);
                  }
                } catch (e) {
                  logWarn(Component.APP, 'AI model warmup failed', { name, error: e instanceof Error ? e.message : String(e) });
                }
              }
            : undefined,
        });
        logInfo(Component.APP, 'AI model preload completed');
      } catch (e) {
        logWarn(Component.APP, 'AI model preload encountered issues', { error: e instanceof Error ? e.message : String(e) });
      }
    }

    const status = modelRegistry.status();
    logInfo(Component.APP, 'AI model registry status', { status });
  } catch (e) {
    logError(Component.APP, 'AI model initialization failed', { error: e instanceof Error ? e.message : String(e) });
  }
} 