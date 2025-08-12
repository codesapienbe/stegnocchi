import { logInfo, logWarn, Component } from './logger';
import { FaceEmbedding, ObjectDetection, SceneEmbedding } from './vectorMetadata';
import { VectorIndex } from './vectorSearch';

export interface CachedVectorIndex<T> {
  key: string;
  index: VectorIndex<T>;
  size: number;
  createdAt: string;
  lastUsedAt: string;
}

class LruCache<V> {
  private readonly capacity: number;
  private readonly map: Map<string, V> = new Map();

  constructor(capacity: number) {
    this.capacity = Math.max(1, capacity);
  }

  get(key: string): V | undefined {
    const value = this.map.get(key);
    if (value !== undefined) {
      this.map.delete(key);
      this.map.set(key, value);
    }
    return value;
  }

  set(key: string, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      const firstKey = this.map.keys().next().value as string | undefined;
      if (firstKey !== undefined) this.map.delete(firstKey);
    }
  }
}

const faceIndexCache = new LruCache<CachedVectorIndex<FaceEmbedding>>(8);
const objectIndexCache = new LruCache<CachedVectorIndex<ObjectDetection>>(8);
const sceneIndexCache = new LruCache<CachedVectorIndex<SceneEmbedding>>(8);

export function buildFaceIndex(key: string, faces: FaceEmbedding[]): CachedVectorIndex<FaceEmbedding> {
  const cached = faceIndexCache.get(key);
  if (cached) {
    cached.lastUsedAt = new Date().toISOString();
    logInfo(Component.APP, 'Reusing cached face index', { key, size: cached.size });
    return cached;
  }
  const index = new VectorIndex<FaceEmbedding>(faces);
  const entry: CachedVectorIndex<FaceEmbedding> = {
    key,
    index,
    size: faces.length,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
  };
  faceIndexCache.set(key, entry);
  logInfo(Component.APP, 'Built face index', { key, size: faces.length });
  return entry;
}

export function buildObjectIndex(key: string, objects: ObjectDetection[]): CachedVectorIndex<ObjectDetection> {
  const cached = objectIndexCache.get(key);
  if (cached) {
    cached.lastUsedAt = new Date().toISOString();
    logInfo(Component.APP, 'Reusing cached object index', { key, size: cached.size });
    return cached;
  }
  const withEmb = objects.filter((o) => Array.isArray(o.embedding)) as ObjectDetection[];
  const index = new VectorIndex<ObjectDetection>(withEmb as any);
  const entry: CachedVectorIndex<ObjectDetection> = {
    key,
    index,
    size: withEmb.length,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
  };
  objectIndexCache.set(key, entry);
  logInfo(Component.APP, 'Built object index', { key, size: withEmb.length });
  return entry;
}

export function buildSceneIndex(key: string, scenes: SceneEmbedding[]): CachedVectorIndex<SceneEmbedding> {
  const cached = sceneIndexCache.get(key);
  if (cached) {
    cached.lastUsedAt = new Date().toISOString();
    logInfo(Component.APP, 'Reusing cached scene index', { key, size: cached.size });
    return cached;
  }
  const index = new VectorIndex<SceneEmbedding>(scenes);
  const entry: CachedVectorIndex<SceneEmbedding> = {
    key,
    index,
    size: scenes.length,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
  };
  sceneIndexCache.set(key, entry);
  logInfo(Component.APP, 'Built scene index', { key, size: scenes.length });
  return entry;
} 