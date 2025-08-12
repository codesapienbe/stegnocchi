import { ValidationResult } from '../types';
import { logInfo, logError, logValidation, Component } from './logger';

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