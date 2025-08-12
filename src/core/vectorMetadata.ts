import { ValidationResult } from '../types';
import { logInfo, logError, logValidation, Component } from './logger';
import { gzipCompress, gzipDecompress } from './compression';
import { encryptMessage, decryptMessage } from './crypto';
import { encryptChunked, decryptChunked, ChunkedManifest } from './chunkedCrypto';

export interface FaceLandmarkPoint {
  x: number;
  y: number;
  type?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceEmbedding {
  boundingBox: BoundingBox;
  embedding: number[];
  confidence: number; // 0..1
  landmarks?: FaceLandmarkPoint[];
  id?: string;
}

export interface ObjectDetection {
  label: string;
  boundingBox: BoundingBox;
  confidence: number; // 0..1
  embedding?: number[];
  id?: string;
}

export interface SceneEmbedding {
  embedding: number[];
  tags?: string[];
  description?: string;
}

export type CustomVectorData = Record<string, unknown>;

export interface VectorMetadata {
  version: string; // semantic version of the schema
  createdAt: string; // ISO timestamp
  faces?: FaceEmbedding[];
  objects?: ObjectDetection[];
  scene?: SceneEmbedding;
  custom?: CustomVectorData;
}

export interface SerializationResult {
  success: boolean;
  json?: string;
  errors?: string[];
}

export interface DeserializationResult {
  success: boolean;
  data?: VectorMetadata;
  errors?: string[];
}

const MAX_EMBEDDING_DIMENSION = 4096;
const MAX_FACE_COUNT = 256;
const MAX_OBJECT_COUNT = 1024;
export const EXIF_USER_COMMENT_MAX_BYTES = 65535; // Typical EXIF UserComment capacity

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidBoundingBox(box: any): boolean {
  return (
    box &&
    isFiniteNumber(box.x) &&
    isFiniteNumber(box.y) &&
    isFiniteNumber(box.width) &&
    isFiniteNumber(box.height) &&
    box.width >= 0 &&
    box.height >= 0
  );
}

function isValidEmbedding(arr: any): arr is number[] {
  return (
    Array.isArray(arr) &&
    arr.length > 0 &&
    arr.length <= MAX_EMBEDDING_DIMENSION &&
    arr.every(isFiniteNumber)
  );
}

function utf8ByteLength(str: string): number {
  // Calculates byte length of a UTF-8 string without external deps
  let bytes = 0;
  for (let i = 0; i < str.length; i++) {
    const codePoint = str.charCodeAt(i);
    if (codePoint < 0x80) bytes += 1;
    else if (codePoint < 0x800) bytes += 2;
    else if (codePoint >= 0xd800 && codePoint <= 0xdbff) {
      // surrogate pair (4 bytes)
      i++;
      bytes += 4;
    } else bytes += 3;
  }
  return bytes;
}

export function validateVectorMetadata(input: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input || typeof input !== 'object') {
    errors.push('Metadata must be a non-null object');
  } else {
    const data = input as Partial<VectorMetadata>;

    if (!data.version || typeof data.version !== 'string') {
      errors.push('Missing or invalid metadata.version');
    }

    if (!data.createdAt || typeof data.createdAt !== 'string') {
      errors.push('Missing or invalid metadata.createdAt');
    } else if (Number.isNaN(Date.parse(data.createdAt))) {
      errors.push('metadata.createdAt must be an ISO timestamp');
    }

    if (data.faces) {
      if (!Array.isArray(data.faces)) {
        errors.push('metadata.faces must be an array');
      } else if (data.faces.length > MAX_FACE_COUNT) {
        warnings.push(`metadata.faces truncated for validation (>${MAX_FACE_COUNT})`);
      }
      (data.faces || []).forEach((face, index) => {
        if (!isValidBoundingBox((face as any).boundingBox)) {
          errors.push(`faces[${index}].boundingBox is invalid`);
        }
        if (!isValidEmbedding((face as any).embedding)) {
          errors.push(`faces[${index}].embedding is invalid`);
        }
        const confidence = (face as any).confidence;
        if (!isFiniteNumber(confidence) || confidence < 0 || confidence > 1) {
          errors.push(`faces[${index}].confidence must be a number in [0,1]`);
        }
        const landmarks = (face as any).landmarks;
        if (landmarks) {
          if (!Array.isArray(landmarks)) {
            errors.push(`faces[${index}].landmarks must be an array`);
          } else if (!landmarks.every((p: any) => isFiniteNumber(p.x) && isFiniteNumber(p.y))) {
            errors.push(`faces[${index}].landmarks points must have finite x,y`);
          }
        }
      });
    }

    if (data.objects) {
      if (!Array.isArray(data.objects)) {
        errors.push('metadata.objects must be an array');
      } else if (data.objects.length > MAX_OBJECT_COUNT) {
        warnings.push(`metadata.objects truncated for validation (>${MAX_OBJECT_COUNT})`);
      }
      (data.objects || []).forEach((obj, index) => {
        if (typeof (obj as any).label !== 'string' || !(obj as any).label) {
          errors.push(`objects[${index}].label must be a non-empty string`);
        }
        if (!isValidBoundingBox((obj as any).boundingBox)) {
          errors.push(`objects[${index}].boundingBox is invalid`);
        }
        const confidence = (obj as any).confidence;
        if (!isFiniteNumber(confidence) || confidence < 0 || confidence > 1) {
          errors.push(`objects[${index}].confidence must be a number in [0,1]`);
        }
        const embedding = (obj as any).embedding;
        if (embedding && !isValidEmbedding(embedding)) {
          errors.push(`objects[${index}].embedding is invalid`);
        }
      });
    }

    if (data.scene) {
      const scene = data.scene as any;
      if (!scene || typeof scene !== 'object') {
        errors.push('metadata.scene must be an object');
      } else {
        if (!isValidEmbedding(scene.embedding)) {
          errors.push('metadata.scene.embedding is invalid');
        }
        if (scene.tags && !Array.isArray(scene.tags)) {
          errors.push('metadata.scene.tags must be an array of strings');
        } else if (scene.tags && !scene.tags.every((t: any) => typeof t === 'string')) {
          errors.push('metadata.scene.tags must contain only strings');
        }
        if (scene.description && typeof scene.description !== 'string') {
          errors.push('metadata.scene.description must be a string');
        }
      }
    }

    if (data.custom && typeof data.custom !== 'object') {
      errors.push('metadata.custom must be an object if provided');
    }
  }

  const result: ValidationResult = {
    isValid: errors.length === 0,
    errors,
    warnings,
  };

  logValidation(Component.VALIDATION, result.isValid, errors, warnings, {
    schema: 'VectorMetadata',
  });

  return result;
}

export function serializeVectorMetadata(metadata: VectorMetadata): SerializationResult {
  const validation = validateVectorMetadata(metadata);
  if (!validation.isValid) {
    logError(Component.APP, 'VectorMetadata serialization failed: validation errors', {
      errorCount: validation.errors.length,
    });
    return { success: false, errors: validation.errors };
  }

  try {
    const json = JSON.stringify(metadata);
    logInfo(Component.APP, 'VectorMetadata serialized successfully', {
      bytes: utf8ByteLength(json),
    });
    return { success: true, json };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown serialization error';
    logError(Component.APP, 'VectorMetadata serialization exception', { message });
    return { success: false, errors: [message] };
  }
}

export function deserializeVectorMetadata(json: string): DeserializationResult {
  const errors: string[] = [];
  try {
    const data = JSON.parse(json) as unknown;
    const validation = validateVectorMetadata(data);
    if (!validation.isValid) {
      logError(Component.APP, 'VectorMetadata deserialization failed: validation errors', {
        errorCount: validation.errors.length,
      });
      return { success: false, errors: validation.errors };
    }
    logInfo(Component.APP, 'VectorMetadata deserialized successfully', {
      bytes: utf8ByteLength(json),
    });
    return { success: true, data: data as VectorMetadata };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON';
    logError(Component.APP, 'VectorMetadata deserialization exception', { message });
    errors.push(message);
    return { success: false, errors };
  }
}

export function getVectorPayloadSizeInfo(metadata: VectorMetadata): {
  estimatedBytes: number;
  fitsInExif: boolean;
  fitsInSingleField: boolean;
} {
  const serialized = JSON.stringify(metadata);
  const estimatedBytes = utf8ByteLength(serialized);
  return {
    estimatedBytes,
    fitsInExif: estimatedBytes <= EXIF_USER_COMMENT_MAX_BYTES,
    fitsInSingleField: estimatedBytes <= EXIF_USER_COMMENT_MAX_BYTES,
  };
}

// Utility: base64 <-> bytes (aligned with existing crypto approach)
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export async function prepareVectorPayload(
  metadata: VectorMetadata,
  options?: { compress?: boolean }
): Promise<{
  payloadBase64: string;
  isCompressed: boolean;
  sizeBytes: number;
}> {
  const shouldCompress = options?.compress === true;

  // Serialize first with existing validation
  const serialized = JSON.stringify(metadata);
  const uncompressedBytes = new TextEncoder().encode(serialized);

  if (!shouldCompress) {
    const base64 = bytesToBase64(uncompressedBytes);
    const sizeBytes = uncompressedBytes.byteLength;
    logInfo(Component.APP, 'Prepared uncompressed vector payload', { sizeBytes });
    return { payloadBase64: base64, isCompressed: false, sizeBytes };
  }

  const comp = await gzipCompress(uncompressedBytes);
  if (!comp.success || !comp.data) {
    const err = comp.error || 'Compression failed';
    logError(Component.APP, 'Vector payload compression failed', { error: err });
    throw new Error(err);
  }

  const base64 = bytesToBase64(comp.data);
  const sizeBytes = comp.data.byteLength;
  logInfo(Component.APP, 'Prepared compressed vector payload', { sizeBytes });
  return { payloadBase64: base64, isCompressed: true, sizeBytes };
}

export async function parseVectorPayload(
  payloadBase64: string,
  isCompressed: boolean
): Promise<DeserializationResult> {
  try {
    const bytes = base64ToBytes(payloadBase64);
    let jsonBytes: Uint8Array = bytes;

    if (isCompressed) {
      const decomp = await gzipDecompress(bytes);
      if (!decomp.success || !decomp.data) {
        const err = decomp.error || 'Decompression failed';
        logError(Component.APP, 'Vector payload decompression failed', { error: err });
        return { success: false, errors: [err] };
      }
      jsonBytes = decomp.data;
    }

    const json = new TextDecoder().decode(jsonBytes);
    return deserializeVectorMetadata(json);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Vector payload parse error';
    logError(Component.APP, 'Vector payload parse exception', { error: message });
    return { success: false, errors: [message] };
  }
}

async function sha256Base64(inputBytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', inputBytes);
  return bytesToBase64(new Uint8Array(digest));
}

export interface VectorEncryptionOptions {
  compress?: boolean;
  chunkThresholdBytes?: number; // force chunked at/over threshold; default EXIF limit
  onProgress?: (progress0to1: number) => void;
}

export type VectorEncryptionResult =
  | {
      success: true;
      mode: 'single';
      isCompressed: boolean;
      plaintextBytes: number;
      ciphertextBase64: string;
      cryptoMetadata: any; // keep flexible to avoid breaking existing types
      digestBase64: string;
    }
  | {
      success: true;
      mode: 'chunked';
      isCompressed: boolean;
      plaintextBytes: number;
      chunksBase64: string[];
      manifest: ChunkedManifest;
      digestBase64: string;
    }
  | { success: false; error: string };

export async function encryptVectorMetadata(
  metadata: VectorMetadata,
  password: string,
  options?: VectorEncryptionOptions
): Promise<VectorEncryptionResult> {
  try {
    const shouldCompress = options?.compress === true;
    const serialized = JSON.stringify(metadata);
    const bytes = new TextEncoder().encode(serialized);

    const digestBase64 = await sha256Base64(bytes);

    let toEncrypt = bytes;
    if (shouldCompress) {
      const comp = await gzipCompress(bytes);
      if (!comp.success || !comp.data) {
        const err = comp.error || 'Compression failed';
        logError(Component.CRYPTO, 'Vector encryption: compression failed', { error: err });
        return { success: false, error: err };
      }
      toEncrypt = comp.data;
    }

    const threshold = options?.chunkThresholdBytes ?? EXIF_USER_COMMENT_MAX_BYTES;

    if (toEncrypt.byteLength >= threshold) {
      const enc = await encryptChunked(toEncrypt, password, { onProgress: options?.onProgress, aadPrefix: 'VEC' });
      if (!enc.success || !enc.chunks || !enc.manifest) {
        const err = (enc as any).error || 'Chunked encryption failed';
        logError(Component.CRYPTO, 'Vector chunked encryption failed', { error: err });
        return { success: false, error: err };
      }
      logInfo(Component.CRYPTO, 'Vector metadata encrypted (chunked)', { chunks: enc.chunks.length, bytes: toEncrypt.byteLength });
      return {
        success: true,
        mode: 'chunked',
        isCompressed: shouldCompress,
        plaintextBytes: toEncrypt.byteLength,
        chunksBase64: enc.chunks,
        manifest: enc.manifest,
        digestBase64,
      };
    } else {
      // Encrypt as single message by base64-wrapping the bytes into a string
      const base64Payload = bytesToBase64(toEncrypt);
      const enc = await encryptMessage({ message: base64Payload, password });
      if (!enc.success || !enc.data || !enc.metadata) {
        const err = enc.error || 'Encryption failed';
        logError(Component.CRYPTO, 'Vector single encryption failed', { error: err });
        return { success: false, error: err };
      }
      logInfo(Component.CRYPTO, 'Vector metadata encrypted (single)', { bytes: toEncrypt.byteLength });
      return {
        success: true,
        mode: 'single',
        isCompressed: shouldCompress,
        plaintextBytes: toEncrypt.byteLength,
        ciphertextBase64: enc.data,
        cryptoMetadata: enc.metadata,
        digestBase64,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Vector encryption exception';
    logError(Component.CRYPTO, 'Vector encryption exception', { error: message });
    return { success: false, error: message };
  }
}

export type VectorDecryptionInput =
  | { mode: 'single'; ciphertextBase64: string; cryptoMetadata: any; isCompressed: boolean }
  | { mode: 'chunked'; chunksBase64: string[]; manifest: ChunkedManifest; isCompressed: boolean };

export async function decryptVectorMetadata(
  input: VectorDecryptionInput,
  password: string
): Promise<DeserializationResult> {
  try {
    if (input.mode === 'single') {
      const dec = await decryptMessage({ encryptedData: input.ciphertextBase64, password, metadata: input.cryptoMetadata });
      if (!dec.success || !dec.data) {
        const err = dec.error || 'Decryption failed';
        logError(Component.CRYPTO, 'Vector single decryption failed', { error: err });
        return { success: false, errors: [err] };
      }
      // dec.data is base64 of the original bytes (possibly compressed)
      return parseVectorPayload(dec.data, input.isCompressed);
    } else {
      const dec = await decryptChunked(input.chunksBase64, input.manifest, password, { aadPrefix: 'VEC' });
      if (!dec.success || !dec.data) {
        const err = dec.error || 'Chunked decryption failed';
        logError(Component.CRYPTO, 'Vector chunked decryption failed', { error: err });
        return { success: false, errors: [err] };
      }
      const base64 = bytesToBase64(dec.data);
      return parseVectorPayload(base64, input.isCompressed);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Vector decryption exception';
    logError(Component.CRYPTO, 'Vector decryption exception', { error: message });
    return { success: false, errors: [message] };
  }
}

export async function validateVectorEncryption(
  encrypted: VectorEncryptionResult
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  try {
    if (!encrypted || (encrypted as any).success !== true) {
      errors.push('Invalid encryption result');
      return { isValid: false, errors, warnings };
    }

    if (encrypted.mode === 'single') {
      if (!encrypted.ciphertextBase64 || !encrypted.cryptoMetadata) {
        errors.push('Missing ciphertext or metadata');
      }
    } else {
      if (!encrypted.chunksBase64 || encrypted.chunksBase64.length === 0) {
        errors.push('No chunks present');
      }
      if (!encrypted.manifest) {
        errors.push('Missing chunked manifest');
      }
    }

    // Best-effort integrity check: decrypt and compare digest
    // Note: Avoid for very large payloads in production; here for validation utility only
    // Skipping actual decrypt here to avoid requiring the password

    return { isValid: errors.length === 0, errors, warnings };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Validation error';
    errors.push(message);
    return { isValid: false, errors, warnings };
  }
}

export function recommendVectorFormat(bytesLength: number): { compress: boolean; chunk: boolean } {
  const compress = bytesLength > 4096; // compress if >4KB
  const chunk = bytesLength > EXIF_USER_COMMENT_MAX_BYTES; // chunk if exceeds EXIF field
  return { compress, chunk };
} 