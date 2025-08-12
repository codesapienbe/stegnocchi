import { modelRegistry } from '../../modelRegistry';
import { logInfo, logWarn, logError, Component } from '../../logger';

export interface ObjectDetectorLike {
  detect(image: any): Promise<Array<{ label: string; confidence: number; x: number; y: number; width: number; height: number; embedding?: number[] }>>;
  embed?(image: any, box: { x: number; y: number; width: number; height: number }): Promise<number[]>;
}

async function loadYoloTfjsAdapter(): Promise<ObjectDetectorLike> {
  try {
    // Use COCO-SSD as a widely-available alternative to YOLO for object detection
    const coco = await import('@tensorflow-models/coco-ssd');
    const model = await coco.load();
    const adapter: ObjectDetectorLike = {
      async detect(image: any) {
        const preds: any[] = await model.detect(image);
        return (preds || []).map((p) => ({
          label: String(p.class || p.label || ''),
          confidence: Number(p.score || p.confidence || 0),
          x: Number(p.bbox?.[0] || p.x || 0),
          y: Number(p.bbox?.[1] || p.y || 0),
          width: Number(p.bbox?.[2] || p.width || 0),
          height: Number(p.bbox?.[3] || p.height || 0),
        }));
      },
    };
    logInfo(Component.APP, 'Loaded COCO-SSD object-detector adapter');
    return adapter;
  } catch (e) {
    logWarn(Component.APP, 'Object detection adapter not available (install @tensorflow-models/coco-ssd with @tensorflow/tfjs)', { error: e instanceof Error ? e.message : String(e) });
    throw e;
  }
}

export function registerObjectDetectorLoaders(): void {
  modelRegistry.register('object-detector', async () => {
    try {
      return await loadYoloTfjsAdapter();
    } catch (finalError) {
      const message = 'No object detection backend available. Install a TFJS YOLO model wrapper and wire the adapter.';
      logError(Component.APP, 'Object-detector loader failed', { error: finalError instanceof Error ? finalError.message : String(finalError) });
      throw new Error(message);
    }
  });

  logInfo(Component.APP, 'Registered object-detector loader with dynamic backend placeholder');
} 