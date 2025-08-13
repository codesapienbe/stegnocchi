# Vector API Reference

Concise reference for vector-related APIs across core modules. For in-depth explanations, see other docs in the `docs/` directory.

Note: Type names are simplified for readability. Consult source files for full types.

## Module: core/vectorMetadata.ts

- validateVectorMetadata(input: unknown): ValidationResult
  - Validate a candidate VectorMetadata object; returns errors/warnings.

- serializeVectorMetadata(metadata: VectorMetadata): { success: boolean; json?: string; errors?: string[] }
  - Validate and JSON-serialize vector metadata.

- deserializeVectorMetadata(json: string): { success: boolean; data?: VectorMetadata; errors?: string[] }
  - Parse and validate JSON into VectorMetadata.

- getVectorPayloadSizeInfo(metadata: VectorMetadata): { estimatedBytes: number; fitsInExif: boolean; fitsInSingleField: boolean }
  - Estimate serialized size and EXIF capacity fit.

- prepareVectorPayload(metadata: VectorMetadata, options?: { compress?: boolean }): Promise<{ payloadBase64: string; isCompressed: boolean; sizeBytes: number }>
  - Serialize (and optionally GZIP) metadata and return Base64 payload.

- encryptVectorMetadata(metadata: VectorMetadata, password: string, options?: { compress?: boolean; chunkThresholdBytes?: number; onProgress?: (p0to1: number) => void }): Promise<VectorEncryptionResult>
  - Encrypt metadata; chooses single or chunked mode based on size.

- decryptVectorMetadata(input: VectorDecryptionInput, password: string): Promise<DeserializationResult>
  - Decrypt (single or chunked) and parse vector payload to VectorMetadata.

- recommendVectorFormat(bytesLength: number): { compress: boolean; chunk: boolean }
  - Recommend compression and chunking based on payload size.

## Module: core/jpgv.ts

- detectImageContainer(bytes: Uint8Array): 'jpgv' | 'jpeg' | 'unknown'
  - Identify image container.

- validateJpgv(bytes: Uint8Array): ValidationResult
  - Validate JPGV header/trailer integrity.

- encodeJpgv(jpegBytes: Uint8Array, vectorPayloadBase64: string, options?: { isCompressed?: boolean; isEncrypted?: boolean }): Uint8Array
  - Append JPGV header and payload to JPEG bytes.

- decodeJpgv(bytes: Uint8Array): { jpegBytes: Uint8Array; vectorPayloadBase64: string; header: JpgvHeaderInfo }
  - Extract JPEG bytes and payload from a JPGV container.

- stripJpgv(bytes: Uint8Array): Uint8Array
  - Remove JPGV trailer and return original JPEG bytes.

- isBackwardCompatibleJpeg(bytes: Uint8Array): boolean
  - Check EOI position for viewer compatibility.

## Module: core/exif.ts (selected)

- injectPayload(file: File, field: string, payload: string): Promise<File>
  - Inject a payload into an EXIF text field (e.g., UserComment).

- extractPayload(file: File, field: string): Promise<string | null>
  - Extract payload from an EXIF text field.

- readExifData(file: File): Promise<ExifData>
  - Read EXIF data from a file.

- getAvailableFields(): ExifField[]
  - List supported EXIF fields for injection/extraction.

## Module: core/vectorSearch.ts (selected)

- cosineSimilarity(a: number[], b: number[]): number
  - Compute cosine similarity between two vectors.

## Types (selected)

- VectorMetadata: { version: string; createdAt: string; faces?: FaceEmbedding[]; objects?: ObjectDetection[]; scene?: SceneEmbedding; custom?: Record<string, unknown> }
- FaceEmbedding: { boundingBox: { x: number; y: number; width: number; height: number }; embedding: number[]; confidence: number; landmarks?: { x: number; y: number; type?: string }[]; id?: string }
- ObjectDetection: { label: string; boundingBox: { x: number; y: number; width: number; height: number }; confidence: number; embedding?: number[]; id?: string }
- SceneEmbedding: { embedding: number[]; tags?: string[]; description?: string }
- JpgvHeaderInfo: { magic: 'JPGV'; version: number; isCompressed: boolean; isEncrypted: boolean; payloadLength: number; headerOffset: number }

## Notes

- Do not log raw embeddings or sensitive payloads.
- For large payloads, prefer `.jpgv` and enable compression.
- Ensure password handling and memory clearing per security guidelines. 