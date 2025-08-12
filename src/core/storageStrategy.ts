import { STEGANOGRAPHY_FIELDS } from './exif';
import { VectorMetadata, serializeVectorMetadata, EXIF_USER_COMMENT_MAX_BYTES, recommendVectorFormat } from './vectorMetadata';
import { gzipCompress } from './compression';
import { logInfo, logWarn, logError, Component } from './logger';

export type StorageStrategy = 'exif_single' | 'exif_multi' | 'jpgv';

export interface StrategyDecision {
  strategy: StorageStrategy;
  compress: boolean;
  estimatedPayloadBytes: number;
  fieldsNeeded?: string[];
}

function utf8ByteLength(str: string): number {
  let bytes = 0;
  for (let i = 0; i < str.length; i++) {
    const codePoint = str.charCodeAt(i);
    if (codePoint < 0x80) bytes += 1;
    else if (codePoint < 0x800) bytes += 2;
    else if (codePoint >= 0xd800 && codePoint <= 0xdbff) {
      i++;
      bytes += 4;
    } else bytes += 3;
  }
  return bytes;
}

function getCombinedExifCapacity(fields: Array<'UserComment' | 'ImageDescription' | 'Artist'>): number {
  return fields.reduce((sum, f) => {
    const field = STEGANOGRAPHY_FIELDS.find((x) => x.name === f);
    return sum + (field ? field.maxLength : 0);
  }, 0);
}

export async function chooseVectorStorageStrategy(
  metadata: VectorMetadata,
  preferredFields: Array<'UserComment' | 'ImageDescription' | 'Artist'> = ['UserComment', 'ImageDescription', 'Artist']
): Promise<StrategyDecision> {
  try {
    const serialized = JSON.stringify(metadata);
    const rawBytes = utf8ByteLength(serialized);
    const { compress, chunk } = recommendVectorFormat(rawBytes);

    let toStoreBytes = rawBytes;
    if (compress) {
      const comp = await gzipCompress(new TextEncoder().encode(serialized));
      if (comp.success && comp.data) {
        toStoreBytes = comp.data.byteLength;
      } else {
        logWarn(Component.EXIF, 'Compression failed during strategy selection; proceeding uncompressed', {
          error: comp.error,
        } as any);
      }
    }

    if (!chunk && toStoreBytes <= EXIF_USER_COMMENT_MAX_BYTES) {
      logInfo(Component.EXIF, 'Selected EXIF single-field strategy', { bytes: toStoreBytes });
      return { strategy: 'exif_single', compress, estimatedPayloadBytes: toStoreBytes };
    }

    const combined = getCombinedExifCapacity(preferredFields);
    if (toStoreBytes <= combined) {
      logInfo(Component.EXIF, 'Selected EXIF multi-field strategy', { bytes: toStoreBytes, fields: preferredFields });
      return { strategy: 'exif_multi', compress, estimatedPayloadBytes: toStoreBytes, fieldsNeeded: preferredFields };
    }

    logInfo(Component.EXIF, 'Selected JPGV trailer strategy', { bytes: toStoreBytes });
    return { strategy: 'jpgv', compress, estimatedPayloadBytes: toStoreBytes };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Strategy selection error';
    logError(Component.EXIF, 'Vector storage strategy selection failed', { error: message });
    // Safe fallback: use JPGV
    return { strategy: 'jpgv', compress: true, estimatedPayloadBytes: 0 };
  }
} 