# Vector Metadata Schema

This document describes the vector metadata schema used by Stegnocchi for representing face embeddings, object detections, and scene embeddings.

The schema is implemented in `src/core/vectorMetadata.ts` and designed to be compact, validated, and suitable for EXIF and .jpgv storage.

## Types

### BoundingBox
- x: number (>= 0)
- y: number (>= 0)
- width: number (>= 0)
- height: number (>= 0)

Represents a rectangle in pixel coordinates.

### FaceLandmarkPoint
- x: number
- y: number
- type: string (optional)

Represents a facial landmark point.

### FaceEmbedding
- boundingBox: BoundingBox
- embedding: number[] (length > 0, length <= 4096)
- confidence: number (0..1)
- landmarks: FaceLandmarkPoint[] (optional)
- id: string (optional)

Represents a single detected face and its vector representation.

### ObjectDetection
- label: string (non-empty)
- boundingBox: BoundingBox
- confidence: number (0..1)
- embedding: number[] (optional, length > 0, length <= 4096)
- id: string (optional)

Represents a single detected object and optional vector representation.

### SceneEmbedding
- embedding: number[] (length > 0, length <= 4096)
- tags: string[] (optional)
- description: string (optional)

Represents a holistic scene vector and metadata.

### CustomVectorData
- Record<string, unknown>

Allows arbitrary custom metadata extensions.

### VectorMetadata
- version: string (semantic version, e.g. "1.0.0")
- createdAt: string (ISO-8601 timestamp)
- faces: FaceEmbedding[] (optional; max count internally validated)
- objects: ObjectDetection[] (optional; max count internally validated)
- scene: SceneEmbedding (optional)
- custom: CustomVectorData (optional)

Container for vector metadata associated with an image.

## Validation Rules

Validation is performed by `validateVectorMetadata(input: unknown)` and enforces:
- `version` present and string
- `createdAt` present, string, and valid ISO timestamp
- `faces` (when present):
  - Array type
  - Each face has valid `boundingBox`, `embedding`, and `confidence` in [0,1]
  - Optional `landmarks` array with finite numeric coordinates
  - Excess faces may be warned and truncated during validation (internal max applied)
- `objects` (when present):
  - Array type
  - Each object has non-empty `label`, valid `boundingBox`, and `confidence` in [0,1]
  - Optional `embedding` must satisfy embedding rules
  - Excess objects may be warned and truncated during validation (internal max applied)
- `scene` (when present):
  - Object type
  - Valid `embedding`
  - Optional `tags` must be array of strings
  - Optional `description` must be string
- `custom` (when present): object type

Embedding arrays must contain finite numbers (no NaN/Infinity), with a maximum length of 4096.

## Serialization & Size Considerations

- `serializeVectorMetadata(metadata)` validates and JSON-serializes metadata
- `deserializeVectorMetadata(json)` validates and returns typed data
- `getVectorPayloadSizeInfo(metadata)` estimates byte size and EXIF fitness
- `EXIF_USER_COMMENT_MAX_BYTES = 65535` (typical capacity per field)
- For large payloads, consider compression and/or .jpgv storage

## Compression & Encryption

- `prepareVectorPayload(metadata, { compress })` returns Base64 payload and compression flag
- `encryptVectorMetadata(metadata, password, options)` supports:
  - Optional GZIP compression
  - Automatic switch to chunked encryption when above EXIF threshold
- `decryptVectorMetadata(input, password)` reconstructs metadata from single or chunked payloads

## Recommendations

- Use compression for payloads > 4KB
- Switch to chunked storage if size exceeds EXIF field capacity
- Avoid logging raw embeddings or PII in structured logs (see `src/core/logger.ts`)
- Apply least-privilege when handling vector data (e.g., memory clearing post-use)

## Example

```
{
  "version": "1.0.0",
  "createdAt": "2024-03-15T12:34:56.000Z",
  "faces": [
    {
      "boundingBox": { "x": 120, "y": 80, "width": 64, "height": 64 },
      "embedding": [0.012, -0.034, 0.987, ...],
      "confidence": 0.93,
      "landmarks": [{ "x": 132, "y": 92, "type": "left_eye" }]
    }
  ],
  "objects": [
    {
      "label": "person",
      "boundingBox": { "x": 10, "y": 20, "width": 200, "height": 400 },
      "confidence": 0.88
    }
  ],
  "scene": {
    "embedding": [0.101, 0.202, 0.303, ...],
    "tags": ["outdoor", "city"],
    "description": "A city street scene"
  }
}
``` 