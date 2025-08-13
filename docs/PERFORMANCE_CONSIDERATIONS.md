# Performance Considerations for Vector Sizes

This guide provides practical guidance for handling vector metadata of varying sizes across devices and storage formats.

## Payload sizing

- Small (< 4KB):
  - EXIF storage is typically sufficient (single field)
  - Compression often not necessary
- Medium (4KB – 64KB):
  - Consider compression to reduce size
  - May still fit in EXIF with multi-field strategy, but .jpgv is cleaner
- Large (> 64KB):
  - Prefer `.jpgv` trailer for contiguous payload and better I/O characteristics
  - Use compression and chunked encryption paths

## CPU and memory

- Downscale inputs used for model inference to a maximum resolution (e.g., 1024 px on long side)
- Use quantized/tiny model variants on lower-end devices to reduce inference time and memory footprint
- Clear large arrays (embeddings) from memory after use; avoid retaining intermediate tensors

## I/O and serialization

- For large metadata, JSON serialization/deserialization can be costly—prefer `.jpgv` to avoid EXIF multi-field overhead
- GZIP compression reduces transfer and storage size but adds CPU overhead—benchmark on target devices
- Use streaming APIs where feasible when handling files, and avoid copying large buffers repeatedly

## Encryption strategies

- Set chunk threshold at or below EXIF limits to prevent field overflows
- Monitor encryption progress for large payloads; surface user feedback in UI
- Avoid logging raw payloads; rely on structured logs for durations and sizes only

## Caching and reuse

- Cache model instances to avoid repeated cold starts
- Memoize repeated computations (e.g., similarity comparisons across the same dataset)

## Platform-specific guidance

- Web (desktop): larger payloads generally acceptable; ensure WebGL backend for ML
- Mobile (mid/low-end): prefer smaller embeddings, fewer faces/objects per image, and aggressive compression
- WebView/hybrid: test memory limits; avoid large synchronous operations on UI thread

## Monitoring & thresholds

- Track key metrics: inference time, payload size bytes, compression ratio, encryption time, read/write throughput
- Set thresholds and warn when exceeding (e.g., > 64KB -> recommend `.jpgv`)

## Recommendations summary

- Compress when payload > 4KB
- Prefer `.jpgv` for anything above a single EXIF field
- Use tiny/quantized models on low-end devices
- Downscale inputs; limit number of embeddings stored per image if needed
- Never log embeddings or PII; log sizes and durations only 