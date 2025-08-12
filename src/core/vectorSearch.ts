import { logInfo, logError, Component } from './logger';
import { VectorMetadata, FaceEmbedding, ObjectDetection, SceneEmbedding } from './vectorMetadata';
import { getSimilarityThresholds } from './similarityConfig';

export interface SimilarityResult<T> {
  item: T;
  similarity: number; // 0..1
  index: number;
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

function norm(a: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * a[i];
  return Math.sqrt(s);
}

function normalize(a: number[]): number[] {
  const n = norm(a) || 1;
  return a.map((x) => x / n);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const an = normalize(a);
  const bn = normalize(b);
  return Math.max(-1, Math.min(1, dot(an, bn)));
}

export class VectorIndex<T extends { embedding: number[] }> {
  private readonly items: T[];
  private readonly normalized: number[][];

  constructor(items: T[]) {
    this.items = items;
    this.normalized = items.map((it) => normalize(it.embedding));
  }

  search(query: number[], topK: number = 5, minSimilarity: number = 0): SimilarityResult<T>[] {
    const qn = normalize(query);
    const results: SimilarityResult<T>[] = [];

    for (let i = 0; i < this.items.length; i++) {
      const sim = Math.max(-1, Math.min(1, dot(qn, this.normalized[i])));
      if (sim >= minSimilarity) {
        results.push({ item: this.items[i], similarity: sim, index: i });
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, Math.max(1, topK));
  }
}

export interface SearchOptions {
  topK?: number;
  minSimilarity?: number; // 0..1
}

export function searchSimilarFaces(
  queryEmbedding: number[],
  faces: FaceEmbedding[],
  options: SearchOptions = {}
): SimilarityResult<FaceEmbedding>[] {
  try {
    const defaults = getSimilarityThresholds();
    const { topK = 5, minSimilarity = defaults.face } = options;
    const index = new VectorIndex<FaceEmbedding>(faces);
    const results = index.search(queryEmbedding, topK, minSimilarity);
    logInfo(Component.APP, 'Face similarity search completed', { topK, minSimilarity, resultCount: results.length });
    return results;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Face similarity search failed';
    logError(Component.APP, 'Face similarity search exception', { error: message });
    return [];
  }
}

export function searchSimilarObjects(
  queryEmbedding: number[],
  objects: ObjectDetection[],
  options: SearchOptions = {}
): SimilarityResult<ObjectDetection>[] {
  try {
    const defaults = getSimilarityThresholds();
    const { topK = 5, minSimilarity = defaults.object } = options;
    const withEmb = objects.filter((o) => Array.isArray(o.embedding));
    const index = new VectorIndex<ObjectDetection>(withEmb as Required<ObjectDetection>[] as any);
    const results = index.search(queryEmbedding, topK, minSimilarity);
    logInfo(Component.APP, 'Object similarity search completed', { topK, minSimilarity, resultCount: results.length });
    return results;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Object similarity search failed';
    logError(Component.APP, 'Object similarity search exception', { error: message });
    return [];
  }
}

export function searchSimilarScenes(
  queryEmbedding: number[],
  scenes: SceneEmbedding[],
  options: SearchOptions = {}
): SimilarityResult<SceneEmbedding>[] {
  try {
    const defaults = getSimilarityThresholds();
    const { topK = 5, minSimilarity = defaults.scene } = options;
    const index = new VectorIndex<SceneEmbedding>(scenes);
    const results = index.search(queryEmbedding, topK, minSimilarity);
    logInfo(Component.APP, 'Scene similarity search completed', { topK, minSimilarity, resultCount: results.length });
    return results;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scene similarity search failed';
    logError(Component.APP, 'Scene similarity search exception', { error: message });
    return [];
  }
} 