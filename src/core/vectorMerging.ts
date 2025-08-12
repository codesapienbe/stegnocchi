import { VectorMetadata, FaceEmbedding, ObjectDetection, SceneEmbedding } from './vectorMetadata';
import { logInfo, logWarn, Component } from './logger';
import { cosineSimilarity } from './vectorSearch';

export interface MergeOptions {
  faceSimilarityThreshold?: number; // 0..1 (higher = stricter dedupe)
  objectIoUThreshold?: number; // 0..1 (higher = stricter dedupe)
  preferDescription?: 'a' | 'b';
  mergeSceneEmbeddings?: 'average' | 'a' | 'b';
}

function iou(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): number {
  const ax2 = a.x + a.width;
  const ay2 = a.y + a.height;
  const bx2 = b.x + b.width;
  const by2 = b.y + b.height;
  const ix1 = Math.max(a.x, b.x);
  const iy1 = Math.max(a.y, b.y);
  const ix2 = Math.min(ax2, bx2);
  const iy2 = Math.min(ay2, by2);
  const iw = Math.max(0, ix2 - ix1);
  const ih = Math.max(0, iy2 - iy1);
  const inter = iw * ih;
  const areaA = a.width * a.height;
  const areaB = b.width * b.height;
  const union = areaA + areaB - inter;
  return union > 0 ? inter / union : 0;
}

function dedupeFaces(a: FaceEmbedding[], b: FaceEmbedding[], simThreshold: number): FaceEmbedding[] {
  const out: FaceEmbedding[] = [...a];
  for (const fb of b) {
    const hasDuplicate = out.some((fa) => cosineSimilarity(fa.embedding, fb.embedding) >= simThreshold);
    if (!hasDuplicate) out.push(fb);
  }
  return out;
}

function dedupeObjects(a: ObjectDetection[], b: ObjectDetection[], iouThreshold: number): ObjectDetection[] {
  const out: ObjectDetection[] = [...a];
  for (const ob of b) {
    const hasDuplicate = out.some((oa) => oa.label.toLowerCase() === ob.label.toLowerCase() && iou(oa.boundingBox, ob.boundingBox) >= iouThreshold);
    if (!hasDuplicate) out.push(ob);
  }
  return out;
}

function mergeScene(a?: SceneEmbedding, b?: SceneEmbedding, mode: 'average' | 'a' | 'b' = 'average'): SceneEmbedding | undefined {
  if (!a && !b) return undefined;
  if (a && !b) return a;
  if (!a && b) return b;
  // both present
  if (mode === 'a') return a!;
  if (mode === 'b') return b!;
  const ea = a!.embedding;
  const eb = b!.embedding;
  const len = Math.min(ea.length, eb.length);
  const merged: number[] = new Array(len);
  for (let i = 0; i < len; i++) merged[i] = (ea[i] + eb[i]) / 2;
  const tags = Array.from(new Set([...(a!.tags || []), ...(b!.tags || [])]));
  const description = a!.description || b!.description;
  return { embedding: merged, tags: tags.length > 0 ? tags : undefined, description };
}

export function mergeVectorMetadata(a: VectorMetadata, b: VectorMetadata, options: MergeOptions = {}): VectorMetadata {
  const faceSimilarityThreshold = options.faceSimilarityThreshold ?? 0.9;
  const objectIoUThreshold = options.objectIoUThreshold ?? 0.5;

  const merged: VectorMetadata = {
    version: a.version || b.version || '1.0',
    createdAt: a.createdAt || b.createdAt || new Date().toISOString(),
    faces: dedupeFaces(a.faces || [], b.faces || [], faceSimilarityThreshold),
    objects: dedupeObjects(a.objects || [], b.objects || [], objectIoUThreshold),
    scene: mergeScene(a.scene, b.scene, options.mergeSceneEmbeddings || 'average'),
    custom: { ...(a.custom || {}), ...(b.custom || {}) },
  };

  // Prefer description selection if both provide different non-empty values and scene merge mode is not averaging descriptions
  if (a.scene?.description && b.scene?.description && a.scene.description !== b.scene.description) {
    const prefer = options.preferDescription || 'a';
    if (merged.scene) merged.scene.description = prefer === 'a' ? a.scene.description : b.scene.description;
  }

  logInfo(Component.APP, 'Merged vector metadata', {
    facesA: a.faces?.length || 0,
    facesB: b.faces?.length || 0,
    facesMerged: merged.faces?.length || 0,
    objectsA: a.objects?.length || 0,
    objectsB: b.objects?.length || 0,
    objectsMerged: merged.objects?.length || 0,
    sceneA: !!a.scene,
    sceneB: !!b.scene,
    sceneMerged: !!merged.scene,
    faceSimilarityThreshold,
    objectIoUThreshold,
  });

  return merged;
} 