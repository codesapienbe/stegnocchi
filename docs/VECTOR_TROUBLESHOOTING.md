# Troubleshooting: Vector Data Issues

This guide lists common problems encountered when working with vector metadata, along with probable causes and recommended resolutions.

## Validation errors

- Symptom: `validateVectorMetadata` returns `isValid=false` with errors
- Causes:
  - Missing `version` or `createdAt`
  - Invalid `boundingBox` values (negative, NaN)
  - `embedding` arrays empty or exceeding 4096 dims
  - Non-finite numbers (NaN/Infinity) in embeddings/landmarks
  - `objects[].label` empty or not a string
  - `scene.tags` not an array of strings
- Resolution:
  - Ensure `createdAt` is a valid ISO timestamp
  - Clamp/round bounding box values to non-negative integers
  - Enforce embedding dimension caps and sanitize numeric inputs
  - Filter `tags` to strings only

## Oversized payloads

- Symptom: Payload cannot fit EXIF fields or exceeds expected size limits
- Causes:
  - Large embeddings or many detections
  - Missing compression step
- Resolution:
  - Use `getVectorPayloadSizeInfo` and `recommendVectorFormat`
  - Enable compression and prefer `.jpgv` trailer for large payloads

## Decryption/parse failures

- Symptom: Errors when decrypting or parsing payload
- Causes:
  - Wrong password
  - Mismatched compression flag
  - Corrupted chunk manifests or truncated data
- Resolution:
  - Verify password and retry
  - Use `decryptVectorMetadata` and pass correct `isCompressed`
  - Re-encode to `.jpgv` and validate with `validateJpgv`

## Missing data after decode

- Symptom: Faces/objects/scene missing after extraction
- Causes:
  - Validation dropped invalid entries
  - Partial EXIF field reconstruction
- Resolution:
  - Validate source metadata before encryption
  - Prefer `.jpgv` to avoid multi-field fragmentation

## Performance bottlenecks

- Symptom: Slow encode/decode or app UI stalls
- Causes:
  - Large JSON serialization or many small EXIF writes
  - Running inference on full-resolution images
- Resolution:
  - Switch to `.jpgv`; batch operations where possible
  - Downscale inputs; use quantized/tiny models
  - Offload heavy work off the UI thread

## Logging and observability

- Symptom: Hard to diagnose production issues
- Causes:
  - Missing structured logs or redaction
- Resolution:
  - Use `core/logger.ts` and include: `operation`, `durationMs`, `bytes`
  - Never log embeddings, keys, passwords, or PII

## Backward compatibility

- Symptom: Some viewers reject images with appended data
- Causes:
  - Trailer placed before JPEG EOI
- Resolution:
  - Ensure `.jpgv` trailer is appended after EOI
  - Validate with `isBackwardCompatibleJpeg`

## Data integrity checks

- Recommendation:
  - Track digests/checksums of plaintext bytes pre-encryption
  - On decode (offline), re-compute for integrity comparison where feasible

## Support checklist

- Validate metadata before encrypt/store
- Prefer `.jpgv` for large payloads; compress >4KB
- Add progress UI for long operations
- Sanitize logs and clear memory of large arrays 