import { VectorMetadata, FaceEmbedding, ObjectDetection, SceneEmbedding } from './vectorMetadata';
import { logInfo, Component } from './logger';

export interface AnonymizeOptions {
  stripIds?: boolean; // remove id fields from faces/objects
  removeLandmarks?: boolean; // drop face landmarks
  removeLabels?: boolean; // drop object labels
  removeTags?: boolean; // drop scene tags
  quantizeEmbeddings?: number; // number of decimal places to keep
}

function quantizeArray(values: number[], decimals: number): number[] {
  const factor = Math.pow(10, Math.max(0, decimals | 0));
  return values.map((v) => Math.round(v * factor) / factor);
}

export function anonymizeVectorMetadata(metadata: VectorMetadata, options: AnonymizeOptions = {}): VectorMetadata {
  const {
    stripIds = true,
    removeLandmarks = true,
    removeLabels = false,
    removeTags = false,
    quantizeEmbeddings = 3,
  } = options;

  const clone: VectorMetadata = JSON.parse(JSON.stringify(metadata));

  if (Array.isArray(clone.faces)) {
    clone.faces = clone.faces.map((f: FaceEmbedding) => {
      const nf: FaceEmbedding = {
        boundingBox: { ...f.boundingBox },
        embedding: Array.isArray(f.embedding) && typeof quantizeEmbeddings === 'number'
          ? quantizeArray(f.embedding, quantizeEmbeddings)
          : f.embedding,
        confidence: f.confidence,
        landmarks: removeLandmarks ? undefined : f.landmarks,
        id: stripIds ? undefined : f.id,
      };
      return nf;
    });
  }

  if (Array.isArray(clone.objects)) {
    clone.objects = clone.objects.map((o: ObjectDetection) => {
      const no: ObjectDetection = {
        label: removeLabels ? '' : o.label,
        boundingBox: { ...o.boundingBox },
        confidence: o.confidence,
        embedding: Array.isArray(o.embedding) && typeof quantizeEmbeddings === 'number'
          ? quantizeArray(o.embedding, quantizeEmbeddings)
          : o.embedding,
        id: stripIds ? undefined : o.id,
      };
      return no;
    });
  }

  if (clone.scene) {
    const s: SceneEmbedding = {
      embedding: Array.isArray(clone.scene.embedding) && typeof quantizeEmbeddings === 'number'
        ? quantizeArray(clone.scene.embedding, quantizeEmbeddings)
        : clone.scene.embedding,
      tags: removeTags ? undefined : clone.scene.tags,
      description: clone.scene.description,
    };
    clone.scene = s;
  }

  logInfo(Component.APP, 'Anonymized vector metadata', {
    faces: clone.faces?.length || 0,
    objects: clone.objects?.length || 0,
    hasScene: !!clone.scene,
    stripIds,
    removeLandmarks,
    removeLabels,
    removeTags,
    quantizeEmbeddings,
  });

  return clone;
} 