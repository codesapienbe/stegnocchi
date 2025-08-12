import { VectorMetadata, FaceEmbedding, ObjectDetection, SceneEmbedding } from './vectorMetadata';
import { logInfo, Component } from './logger';

export function extractFacesOnly(metadata: VectorMetadata): FaceEmbedding[] {
  const faces = Array.isArray(metadata.faces) ? metadata.faces : [];
  logInfo(Component.APP, 'Extracted faces only', { count: faces.length });
  return faces;
}

export function extractObjectsOnly(metadata: VectorMetadata): ObjectDetection[] {
  const objs = Array.isArray(metadata.objects) ? metadata.objects : [];
  logInfo(Component.APP, 'Extracted objects only', { count: objs.length });
  return objs;
}

export function extractSceneOnly(metadata: VectorMetadata): SceneEmbedding | null {
  const scene = metadata.scene || null;
  logInfo(Component.APP, 'Extracted scene only', { present: !!scene });
  return scene;
}

export function extractObjectsByLabel(
  metadata: VectorMetadata,
  labels: string[],
  minConfidence: number = 0
): ObjectDetection[] {
  const labelSet = new Set(labels.map((l) => l.toLowerCase()));
  const objs = (metadata.objects || []).filter((o) => {
    const labelOk = labelSet.size === 0 || labelSet.has(o.label.toLowerCase());
    const confOk = typeof o.confidence === 'number' ? o.confidence >= minConfidence : true;
    return labelOk && confOk;
  });
  logInfo(Component.APP, 'Extracted objects by label', { labels: Array.from(labelSet), minConfidence, count: objs.length });
  return objs;
}

export function extractFacesByBoxArea(
  metadata: VectorMetadata,
  minArea: number = 0,
  maxArea: number = Number.POSITIVE_INFINITY
): FaceEmbedding[] {
  const faces = (metadata.faces || []).filter((f) => {
    const area = f.boundingBox.width * f.boundingBox.height;
    return area >= minArea && area <= maxArea;
  });
  logInfo(Component.APP, 'Extracted faces by area', { minArea, maxArea: isFinite(maxArea) ? maxArea : 'inf', count: faces.length });
  return faces;
} 