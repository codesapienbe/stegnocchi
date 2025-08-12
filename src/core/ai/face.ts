import { logInfo, logWarn, logError, Component } from '../logger';
import { FaceEmbedding } from '../vectorMetadata';

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceDetectionResult {
  box: FaceBox;
  confidence: number; // 0..1
}

export async function detectFaces(model: any, image: any): Promise<FaceDetectionResult[]> {
  try {
    if (!model || typeof model.detect !== 'function') {
      throw new Error('Face model must expose a detect(image) method');
    }
    const detections = await model.detect(image);
    const results: FaceDetectionResult[] = (detections || []).map((d: any) => ({
      box: {
        x: d.x ?? d.box?.x ?? 0,
        y: d.y ?? d.box?.y ?? 0,
        width: d.width ?? d.box?.width ?? 0,
        height: d.height ?? d.box?.height ?? 0,
      },
      confidence: typeof d.confidence === 'number' ? d.confidence : (typeof d.score === 'number' ? d.score : 0),
    }));
    logInfo(Component.APP, 'Face detection completed', { count: results.length });
    return results;
  } catch (error) {
    logError(Component.APP, 'Face detection exception', { error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

export async function extractFaceEmbeddings(
  model: any,
  image: any,
  detections: FaceDetectionResult[]
): Promise<FaceEmbedding[]> {
  try {
    if (!model || typeof model.embed !== 'function') {
      throw new Error('Face embedder must expose an embed(image, box) method');
    }
    const embeddings: FaceEmbedding[] = [];
    for (const d of detections) {
      const vec: number[] = await model.embed(image, d.box);
      embeddings.push({
        boundingBox: { ...d.box },
        embedding: Array.isArray(vec) ? vec : [],
        confidence: d.confidence,
        landmarks: undefined,
      });
    }
    logInfo(Component.APP, 'Face embedding extraction completed', { count: embeddings.length });
    return embeddings;
  } catch (error) {
    logError(Component.APP, 'Face embedding extraction exception', { error: error instanceof Error ? error.message : String(error) });
    return [];
  }
} 