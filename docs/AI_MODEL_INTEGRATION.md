# AI Model Integration and Configuration

This guide outlines supported AI model types (faces, objects, scenes), recommended libraries, configuration options, and performance/privacy considerations for Stegnocchi.

The implementation entry points live under `src/core/ai` and related loaders. This document focuses on integration strategy rather than specific model weights.

## Model Types

- Face Detection/Embedding
  - Options: MediaPipe Face Detection, TensorFlow.js face detectors, FaceNet-style embeddings
  - Outputs: bounding boxes, confidence, optional landmarks, `embedding: number[]`
- Object Detection/Embedding
  - Options: YOLO family (tiny variants for mobile), TensorFlow.js COCO pre-trained models
  - Outputs: label, bounding box, confidence, optional `embedding: number[]`
- Scene Embeddings
  - Options: CLIP-like models (text-image embeddings) via TF.js or on-device optimized variants
  - Outputs: `embedding: number[]`, tags (optional), description (optional)

## Configuration

Centralize AI configuration via environment and app config, without hard-coding secrets:

- Model selection: `AI_FACE_MODEL`, `AI_OBJECT_MODEL`, `AI_SCENE_MODEL`
- Precision & size: `AI_MODEL_VARIANT` (e.g., `tiny`, `base`)
- Performance: `AI_MAX_RESOLUTION`, `AI_BATCH_SIZE`
- Privacy: `AI_ON_DEVICE_ONLY=true` to disable any remote inference
- Timeouts: `AI_INFERENCE_TIMEOUT_MS`

Example (pseudo-env):

```
AI_FACE_MODEL=mediapipe
AI_OBJECT_MODEL=yolov5-tiny
AI_SCENE_MODEL=clip-tfjs
AI_MODEL_VARIANT=tiny
AI_MAX_RESOLUTION=1024
AI_BATCH_SIZE=1
AI_ON_DEVICE_ONLY=true
AI_INFERENCE_TIMEOUT_MS=5000
```

## Loading Strategy

- Lazy-load per feature (faces/objects/scenes) to minimize cold start
- Cache model instances across requests where memory allows
- Pre-warm critical models on app start if target devices have capacity
- Use loaders in `src/core/ai/loaders/*` to encapsulate fetching/initialization logic

## Performance Considerations

- Prefer low-parameter variants for mobile (e.g., `tiny`, int8 quantized)
- Downscale inputs to `AI_MAX_RESOLUTION` with aspect ratio preserved
- Batch where possible, but keep `AI_BATCH_SIZE` conservative on low-end devices
- Offload to WebGL / GPU backends when available (TF.js backends)

## Privacy and Security

- Default to on-device inference (`AI_ON_DEVICE_ONLY=true`)
- If remote inference is enabled, enforce TLS, certificate pinning (see `core/certPinning.ts`), and strict rate limits
- Never log raw embeddings or PII in `application.log`; redact sensitive fields
- Memory hygiene: clear intermediate tensors/arrays after use

## Error Handling & Observability

- Wrap inference with timeouts; surface actionable messages to users
- Log structured entries via `core/logger.ts` (`component: 'ai' | 'steganography' | 'exif'` as applicable)
- Track basic metrics: load time, inference time, model cache hits

## Model Updates & Versioning

- Track model version/config in outputs to keep provenance (`metadata.version` fields)
- Validate embeddings against expected dimensions and ranges

## Testing Notes

- Use synthetic images for smoke checks without shipping large test assets
- Validate shapes, ranges, and basic accuracy thresholds where feasible (avoid large fixtures)

## Integration Steps (High-Level)

1. Select model family/variant per platform constraints
2. Implement loader under `src/core/ai/loaders/<type>.ts`
3. Initialize model lazily at first call; cache instance
4. Run inference on downscaled inputs; capture outputs to `VectorMetadata`
5. Validate and serialize vector metadata; apply compression/encryption if needed 