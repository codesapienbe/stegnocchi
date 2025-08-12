import { logInfo, logWarn, logError, Component } from './logger';

export type ModelName = 'face-detector' | 'face-embedder' | 'object-detector' | 'scene-embedder' | string;

export interface ModelHandle<T = any> {
  name: ModelName;
  instance: T;
  loadedAt: string;
  warm?: boolean;
}

type LoaderFn<T = any> = () => Promise<T>;

class ModelRegistry {
  private loaders: Map<ModelName, LoaderFn<any>> = new Map();
  private cache: Map<ModelName, ModelHandle<any>> = new Map();

  register<T>(name: ModelName, loader: LoaderFn<T>): void {
    this.loaders.set(name, loader);
    logInfo(Component.APP, 'Registered model loader', { name });
  }

  async get<T>(name: ModelName, options?: { warmup?: (model: T) => Promise<void> | void }): Promise<ModelHandle<T>> {
    const cached = this.cache.get(name) as ModelHandle<T> | undefined;
    if (cached) {
      logInfo(Component.APP, 'Using cached model', { name });
      return cached;
    }

    const loader = this.loaders.get(name) as LoaderFn<T> | undefined;
    if (!loader) {
      logWarn(Component.APP, 'Requested model has no registered loader', { name });
      throw new Error(`No loader for model: ${name}`);
    }

    try {
      const instance = await loader();
      const handle: ModelHandle<T> = { name, instance, loadedAt: new Date().toISOString(), warm: false };

      if (options?.warmup) {
        try {
          await options.warmup(instance);
          handle.warm = true;
          logInfo(Component.APP, 'Model warm-up completed', { name });
        } catch (e) {
          logWarn(Component.APP, 'Model warm-up failed', { name, error: e instanceof Error ? e.message : String(e) });
        }
      }

      this.cache.set(name, handle);
      logInfo(Component.APP, 'Model loaded and cached', { name });
      return handle;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Model load failed';
      logError(Component.APP, 'Model load exception', { name, error: message });
      throw new Error(message);
    }
  }

  unload(name: ModelName): boolean {
    const existed = this.cache.delete(name);
    if (existed) {
      logInfo(Component.APP, 'Model unloaded from cache', { name });
    }
    return existed;
  }

  async preload(names: ModelName[], options?: { warmup?: (name: ModelName, model: any) => Promise<void> | void }): Promise<void> {
    for (const name of names) {
      try {
        await this.get(name, { warmup: options?.warmup ? (m) => options!.warmup!(name, m) : undefined });
      } catch (e) {
        // Already logged
      }
    }
  }

  status(): Array<{ name: ModelName; cached: boolean; warm: boolean; loadedAt?: string }> {
    const out: Array<{ name: ModelName; cached: boolean; warm: boolean; loadedAt?: string }> = [];
    // loaders known
    for (const name of this.loaders.keys()) {
      const h = this.cache.get(name);
      out.push({ name, cached: !!h, warm: !!h?.warm, loadedAt: h?.loadedAt });
    }
    return out;
  }
}

export const modelRegistry = new ModelRegistry(); 