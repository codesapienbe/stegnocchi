# Vector Metadata: Usage Examples

This guide provides simple examples for working with vector metadata in Stegnocchi: extracting metadata from images and running basic similarity/search flows with the existing core APIs.

Note: Code below is illustrative TypeScript. Adapt module paths based on your app structure.

## Extract vector metadata from EXIF

```ts
import { readExifData } from '@/core/exif';
import type { ExifData } from '@/types';

async function extractVectorFromExif(file: File): Promise<ExifData> {
  const exif: ExifData = await readExifData(file);
  // exif.userComment and other fields may contain payload fragments
  return exif;
}
```

## Parse vector payload from .jpgv

```ts
import { decodeJpgv, detectImageContainer } from '@/core/jpgv';
import { parseVectorPayload } from '@/core/vectorMetadata';

async function parseJpgv(bytes: Uint8Array) {
  const container = detectImageContainer(bytes);
  if (container !== 'jpgv') throw new Error('Not a .jpgv container');

  const { vectorPayloadBase64, header } = decodeJpgv(bytes);
  const parsed = await parseVectorPayload(vectorPayloadBase64, header.isCompressed);
  if (!parsed.success || !parsed.data) throw new Error(parsed.errors?.join(',') || 'Parse error');
  return parsed.data; // VectorMetadata
}
```

## Prepare and encrypt vector metadata

```ts
import { prepareVectorPayload, encryptVectorMetadata, recommendVectorFormat } from '@/core/vectorMetadata';

async function prepareAndEncrypt(metadata: any, password: string) {
  const json = JSON.stringify(metadata);
  const { estimatedBytes } = { estimatedBytes: new TextEncoder().encode(json).byteLength };
  const { compress, chunk } = recommendVectorFormat(estimatedBytes);

  const enc = await encryptVectorMetadata(metadata, password, {
    compress,
    chunkThresholdBytes: 65535,
    onProgress: (p) => console.info('Encrypt progress', p),
  });
  if (!enc.success) throw new Error((enc as any).error || 'Encryption failed');
  return enc;
}
```

## Similarity search (faces/objects/scenes)

```ts
import { cosineSimilarity } from '@/core/vectorSearch';

function bestMatch(query: number[], candidates: number[][]) {
  let bestIdx = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < candidates.length; i++) {
    const score = cosineSimilarity(query, candidates[i]);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return { index: bestIdx, score: bestScore };
}
```

## Filtering by label/tags

```ts
function filterObjects(objects: Array<{ label: string; confidence: number }>, allowed: string[]) {
  return objects.filter((o) => allowed.includes(o.label));
}

function filterScenesByTag(tags: string[], have: string[]) {
  return have.some((t) => tags.includes(t));
}
```

## Putting it together

```ts
async function searchByFaceEmbedding(queryFace: number[], dataset: any[]) {
  // dataset items contain { metadata: VectorMetadata }
  const scores = dataset.map(({ metadata }) => {
    const faceVectors = (metadata.faces || []).map((f: any) => f.embedding);
    if (faceVectors.length === 0) return { score: -Infinity };
    const { score } = bestMatch(queryFace, faceVectors);
    return { score };
  });
  return dataset
    .map((item, i) => ({ item, score: scores[i].score }))
    .sort((a, b) => b.score - a.score);
}
```

## Security & Privacy Notes

- Do not log raw embeddings or PII in application logs.
- Clear large arrays from memory after use when feasible.
- Prefer on-device inference to avoid transmitting sensitive content. 