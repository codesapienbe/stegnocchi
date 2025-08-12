import { logInfo, logError, Component } from '../logger';
import { ObjectDetection } from '../vectorMetadata';

export interface RawObjectDet {
  label: string;
  confidence: number;
  x: number; y: number; width: number; height: number;
  embedding?: number[];
}

export async function detectObjects(model: any, image: any): Promise<ObjectDetection[]> {
  try {
    if (!model || typeof model.detect !== 'function') {
      throw new Error('Object model must expose a detect(image) method');
    }
    const detections: RawObjectDet[] = await model.detect(image);
    const results: ObjectDetection[] = (detections || []).map((d) => ({
      label: d.label || '',
      confidence: d.confidence ?? 0,
      boundingBox: { x: d.x ?? 0, y: d.y ?? 0, width: d.width ?? 0, height: d.height ?? 0 },
      embedding: Array.isArray(d.embedding) ? d.embedding : undefined,
    }));
    logInfo(Component.APP, 'Object detection completed', { count: results.length });
    return results;
  } catch (error) {
    logError(Component.APP, 'Object detection exception', { error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

export async function extractObjectEmbeddings(model: any, image: any, detections: ObjectDetection[]): Promise<ObjectDetection[]> {
  try {
    if (!model || typeof model.embed !== 'function') {
      throw new Error('Object embedder must expose an embed(image, box) method');
    }
    const results: ObjectDetection[] = [];
    for (const d of detections) {
      const emb: number[] = await model.embed(image, d.boundingBox);
      results.push({ ...d, embedding: Array.isArray(emb) ? emb : undefined });
    }
    logInfo(Component.APP, 'Object embedding extraction completed', { count: results.length });
    return results;
  } catch (error) {
    logError(Component.APP, 'Object embedding extraction exception', { error: error instanceof Error ? error.message : String(error) });
    return detections;
  }
} 