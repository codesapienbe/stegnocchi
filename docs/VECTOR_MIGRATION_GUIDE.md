# Migration Guide: Simple Text → Vector Metadata

This guide explains how to migrate from simple text payloads to vector metadata (faces/objects/scenes) while preserving security, performance, and backward compatibility.

## 1) Why migrate?

- Richer search and analytics: faces, objects, scene semantics
- Better compression potential and flexible storage (.jpgv trailer)
- Backward compatibility with standard JPEG viewers

## 2) Storage options

1. EXIF fields (UserComment, ImageDescription, Artist)
   - Pros: Native to JPEG; simple read/write
   - Cons: Capacity limits (~65KB per field); fragmentation across fields
2. .jpgv trailer (recommended for larger payloads)
   - Pros: Larger capacity; single contiguous block; preserves JPEG bytes
   - Cons: Requires .jpgv-aware tooling for extraction

Use `getVectorPayloadSizeInfo` and `recommendVectorFormat` to decide EXIF vs .jpgv.

## 3) Serialization and size

- Serialize `VectorMetadata` to JSON and validate via `validateVectorMetadata`
- Estimate size with `getVectorPayloadSizeInfo`
- Consider GZIP compression for payloads > 4KB

## 4) Encryption

- Use `encryptVectorMetadata(metadata, password, { compress, chunkThresholdBytes })`
- Automatically selects single vs chunked mode based on threshold
- Always avoid logging sensitive data; rely on `core/logger.ts` sanitization

## 5) Write path overview

1. Build `VectorMetadata` from AI outputs (faces/objects/scenes)
2. Validate and serialize (optionally compress)
3. Encrypt (single or chunked)
4. Store:
   - EXIF: inject into one or multiple fields (small payloads)
   - .jpgv: `encodeJpgv(jpegBytes, payloadBase64, { isCompressed, isEncrypted })`

## 6) Read path overview

1. Detect container via `detectImageContainer`
2. If EXIF-only: read fields and reconstruct payload
3. If `.jpgv`: `decodeJpgv(bytes)` to obtain payload + header flags
4. Decrypt (single/chunked) and parse via `parseVectorPayload`

## 7) UI considerations

- Encoding interface: add a toggle (already implemented) to include vector metadata
- Decoding/Results: preview faces, objects, and scene data (already implemented)
- Batch: enable multi-file operations for vector extraction/injection (already integrated)

## 8) Backward compatibility

- `.jpgv` appends a small trailer after JPEG EOI; standard viewers ignore it
- `isBackwardCompatibleJpeg` ensures EOI appears before trailer
- Provide a “strip to JPEG” option using `stripJpgv` when needed

## 9) Security & compliance

- Enforce `AES-256-GCM` + `PBKDF2` per existing crypto module
- Clear sensitive data from memory post-use; do not log embeddings/PII
- For remote inference (if enabled), use TLS + cert pinning, rate limits, and least-privilege

## 10) Rollout strategy

- Start with `.jpgv` for large payloads; fall back to EXIF for small payloads
- A/B test compression toggles on low-end devices
- Monitor payload sizes and error rates via structured logs

## 11) Troubleshooting

- Validation errors: ensure embeddings are finite numbers and arrays within limits
- Decode failures: confirm magic bytes, header bounds, and flags
- Oversized payloads: enable compression and prefer `.jpgv`

## References

- `src/core/vectorMetadata.ts`
- `src/core/jpgv.ts`
- `docs/VECTOR_METADATA_SCHEMA.md`
- `docs/JPGV_FORMAT_GUIDE.md` 