import { modelRegistry } from '../../modelRegistry';
import { logInfo, logWarn, logError, Component } from '../../logger';

export interface FaceDetectorLike {
  detect(image: any): Promise<Array<{ x: number; y: number; width: number; height: number; confidence: number }>>;
}

async function loadBlazeFaceAdapter(): Promise<FaceDetectorLike> {
  try {
    // Dynamic imports to avoid hard dependency where not installed
    const blazeface = await import('@tensorflow-models/blazeface');
    // Some TFJS envs require explicit backend initialization which we leave to host app
    const model = await blazeface.load();

    const adapter: FaceDetectorLike = {
      async detect(image: any) {
        const preds: any[] = await model.estimateFaces(image, false);
        return (preds || []).map((p) => {
          // p.topLeft / p.bottomRight may be arrays [x,y]
          const tl = Array.isArray(p.topLeft) ? p.topLeft : (p.topLeft?.arraySync ? p.topLeft.arraySync() : [0, 0]);
          const br = Array.isArray(p.bottomRight) ? p.bottomRight : (p.bottomRight?.arraySync ? p.bottomRight.arraySync() : [0, 0]);
          const x = Number(tl[0]) || 0;
          const y = Number(tl[1]) || 0;
          const width = Math.max(0, Number(br[0]) - x) || 0;
          const height = Math.max(0, Number(br[1]) - y) || 0;
          const confidence = typeof p.probability === 'number' ? p.probability : (Array.isArray(p.probability) ? Number(p.probability[0]) : 0);
          return { x, y, width, height, confidence: isFinite(confidence) ? confidence : 0 };
        });
      },
    };
    logInfo(Component.APP, 'Loaded BlazeFace face-detector adapter');
    return adapter;
  } catch (e) {
    logWarn(Component.APP, 'BlazeFace not available; will try MediaPipe', { error: e instanceof Error ? e.message : String(e) });
    throw e;
  }
}

async function loadMediaPipeAdapter(): Promise<FaceDetectorLike> {
  try {
    const mp = await import('@mediapipe/face_detection');
    // MediaPipe Face Detection config and instance
    const detector = new mp.FaceDetection({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}` });
    detector.setOptions({ model: 'short', minDetectionConfidence: 0.5 });

    const adapter: FaceDetectorLike = {
      async detect(image: any): Promise<Array<{ x: number; y: number; width: number; height: number; confidence: number }>> {
        return await new Promise((resolve) => {
          detector.onResults((results: any) => {
            const dims = { w: (image as any).videoWidth || (image as any).naturalWidth || (image as any).width || 0, h: (image as any).videoHeight || (image as any).naturalHeight || (image as any).height || 0 };
            const out = (results.detections || []).map((d: any) => {
              const bb = d.locationData?.relativeBoundingBox || {};
              const x = Number(bb.xMin || 0) * dims.w;
              const y = Number(bb.yMin || 0) * dims.h;
              const width = Number(bb.width || 0) * dims.w;
              const height = Number(bb.height || 0) * dims.h;
              const confidence = Array.isArray(d.score) ? Number(d.score[0]) : Number(d.score || 0);
              return { x, y, width, height, confidence: isFinite(confidence) ? confidence : 0 };
            });
            resolve(out);
          });
          detector.send({ image });
        });
      },
    };
    logInfo(Component.APP, 'Loaded MediaPipe face-detector adapter');
    return adapter;
  } catch (e) {
    logWarn(Component.APP, 'MediaPipe not available for face detection', { error: e instanceof Error ? e.message : String(e) });
    throw e;
  }
}

export function registerFaceDetectorLoaders(): void {
  modelRegistry.register('face-detector', async () => {
    try {
      return await loadBlazeFaceAdapter();
    } catch {
      // Try mediapipe as a fallback
      try {
        return await loadMediaPipeAdapter();
      } catch (finalError) {
        const message = 'No face detection backend available. Install @tensorflow-models/blazeface (+ @tensorflow/tfjs) or @mediapipe/face_detection.';
        logError(Component.APP, 'Face-detector loader failed', { error: finalError instanceof Error ? finalError.message : String(finalError) });
        throw new Error(message);
      }
    }
  });

  logInfo(Component.APP, 'Registered face-detector loader with dynamic backends');
} 