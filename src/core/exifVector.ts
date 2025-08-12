import { readExifData, writeExifData, STEGANOGRAPHY_FIELDS } from './exif';
import { VectorMetadata, prepareVectorPayload, parseVectorPayload } from './vectorMetadata';
import { ValidationResult } from '../types';
import { logExifOperation, Component, logError, logInfo } from './logger';

const VECTOR_PREFIX = 'JPGV;v=1;';

function getFieldMaxLength(fieldName: string): number {
  const field = STEGANOGRAPHY_FIELDS.find((f) => f.name === fieldName);
  return field ? field.maxLength : 0;
}

async function sha256Base64(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function buildChunkHeader(index: number, total: number, isCompressed: boolean, hashBase64?: string): string {
  const parts = [VECTOR_PREFIX, `i=${index};`, `n=${total};`, `gz=${isCompressed ? 1 : 0};`];
  if (index === 0 && hashBase64) parts.push(`h=${hashBase64};`);
  return parts.join('');
}

function parseHeader(value: string): { valid: boolean; index: number; total: number; isCompressed: boolean; hash?: string } {
  if (!value || typeof value !== 'string' || !value.startsWith(VECTOR_PREFIX)) return { valid: false, index: -1, total: 0, isCompressed: false };
  const headerEnd = value.indexOf('||');
  const header = headerEnd >= 0 ? value.slice(0, headerEnd) : value;
  const tokens = header.split(';');
  let index = -1;
  let total = 0;
  let gz = 0;
  let hash: string | undefined;
  for (const t of tokens) {
    if (t.startsWith('i=')) index = parseInt(t.slice(2), 10);
    if (t.startsWith('n=')) total = parseInt(t.slice(2), 10);
    if (t.startsWith('gz=')) gz = parseInt(t.slice(3), 10);
    if (t.startsWith('h=')) hash = t.slice(2);
  }
  const base: { valid: boolean; index: number; total: number; isCompressed: boolean; hash?: string } = {
    valid: index >= 0 && total > 0,
    index,
    total,
    isCompressed: gz === 1,
  };
  if (hash !== undefined) {
    base.hash = hash;
  }
  return base;
}

function stripHeader(value: string): string {
  const pos = value.indexOf('||');
  return pos >= 0 ? value.slice(pos + 2) : '';
}

function joinBase64(chunks: string[]): string {
  return chunks.join('');
}

function splitAcrossFields(payload: string, isCompressed: boolean, fieldNames: string[], hashBase64: string): { fieldToValue: Record<string, string> } | null {
  const fieldToValue: Record<string, string> = {};
  const total = fieldNames.length;

  let offset = 0;
  for (let i = 0; i < fieldNames.length; i++) {
    const field = fieldNames[i]!;
    const maxLen = getFieldMaxLength(field);
    const header = buildChunkHeader(i, total, isCompressed, i === 0 ? hashBase64 : undefined) + '||';
    const available = Math.max(0, maxLen - header.length);
    if (available <= 0) return null;
    const slice = payload.slice(offset, offset + available);
    fieldToValue[field] = header + slice;
    offset += slice.length;
  }

  if (offset < payload.length) return null;
  return { fieldToValue };
}

function applyExifUpdatesPreserving(
  existingExif: Record<string, any>,
  updates: Record<string, string>
): { updated: Record<string, any>; preservedCount: number; overwrittenFields: string[] } {
  const updated = { ...existingExif };
  const overwrittenFields: string[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (existingExif[key] && existingExif[key] !== '') {
      overwrittenFields.push(key);
    }
    (updated as any)[key] = value;
  }
  const preservedCount = Object.keys(existingExif).filter((k) => !(k in updates)).length;
  return { updated, preservedCount, overwrittenFields };
}

export async function detectVectorDataFields(exifData: Record<string, any>): Promise<{
  present: boolean;
  fields: string[];
  totalChunks: number;
  isCompressed: boolean;
}> {
  const candidates = ['UserComment', 'ImageDescription', 'Artist'];
  const found: { field: string; index: number; total: number; isCompressed: boolean }[] = [];

  for (const field of candidates) {
    const value = exifData[field];
    if (!value || typeof value !== 'string') continue;
    const meta = parseHeader(value);
    if (meta.valid) {
      found.push({ field, index: meta.index, total: meta.total, isCompressed: meta.isCompressed });
    }
  }

  if (found.length === 0) {
    return { present: false, fields: [], totalChunks: 0, isCompressed: false };
  }

  const total = found[0]!.total;
  const isCompressed = found[0]!.isCompressed;
  const fields = found.sort((a, b) => a.index - b.index).map((x) => x.field);
  return { present: true, fields, totalChunks: total, isCompressed };
}

export async function validateExifVectorData(exifData: Record<string, any>): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const detection = await detectVectorDataFields(exifData);
  if (!detection.present) {
    return { isValid: true, errors, warnings };
  }
  if (detection.fields.length !== detection.totalChunks) {
    errors.push('Vector EXIF chunks missing or inconsistent');
  }
  return { isValid: errors.length === 0, errors, warnings };
}

export async function injectVectorIntoField(
  file: File,
  metadata: VectorMetadata,
  fieldName: 'UserComment' | 'ImageDescription' | 'Artist',
  options?: { compress?: boolean }
): Promise<File> {
  const prep = await prepareVectorPayload(metadata, { compress: options?.compress === true });
  const header = buildChunkHeader(0, 1, prep.isCompressed, await sha256Base64(prep.payloadBase64)) + '||';
  const maxLen = getFieldMaxLength(fieldName);
  const full = header + prep.payloadBase64;
  if (full.length > maxLen) {
    logError(Component.EXIF, 'Vector payload exceeds single field capacity', { fieldName, needed: full.length, max: maxLen });
    throw new Error(`Payload too large for ${fieldName}`);
  }
  const exif = await readExifData(file);
  const { updated, preservedCount, overwrittenFields } = applyExifUpdatesPreserving(exif as any, { [fieldName]: full });
  const out = await writeExifData(file, updated as any);
  logExifOperation('inject', fieldName, true, {
    compressed: prep.isCompressed,
    bytes: prep.sizeBytes,
    preservedCount,
    overwrittenFields: overwrittenFields.length > 0 ? overwrittenFields : undefined,
  });
  return out;
}

export async function injectVectorMultiField(
  file: File,
  metadata: VectorMetadata,
  options?: { compress?: boolean; fieldsOrder?: Array<'UserComment' | 'ImageDescription' | 'Artist'> }
): Promise<File> {
  const fields = options?.fieldsOrder || ['UserComment', 'ImageDescription', 'Artist'];
  const prep = await prepareVectorPayload(metadata, { compress: options?.compress === true });
  const hash = await sha256Base64(prep.payloadBase64);

  const split = splitAcrossFields(prep.payloadBase64, prep.isCompressed, fields, hash);
  if (!split) {
    logError(Component.EXIF, 'Vector payload does not fit across provided EXIF fields', { fields });
    throw new Error('Payload too large for available EXIF fields');
  }

  const exif = await readExifData(file);
  const { updated, preservedCount, overwrittenFields } = applyExifUpdatesPreserving(exif as any, split.fieldToValue);
  const out = await writeExifData(file, updated as any);
  logExifOperation('inject', 'multi', true, {
    fields,
    compressed: prep.isCompressed,
    preservedCount,
    overwrittenFields: overwrittenFields.length > 0 ? overwrittenFields : undefined,
  });
  return out;
}

export async function extractVectorFromFile(file: File): Promise<ReturnType<typeof parseVectorPayload>> {
  const exif = await readExifData(file);
  const candidates = ['UserComment', 'ImageDescription', 'Artist'];
  const parts: { index: number; total: number; isCompressed: boolean; hash?: string; data: string }[] = [];

  for (const field of candidates) {
    const value = (exif as any)[field];
    if (!value || typeof value !== 'string') continue;
    const meta = parseHeader(value);
    if (!meta.valid) continue;
    const data = stripHeader(value);
    const entry: { index: number; total: number; isCompressed: boolean; hash?: string; data: string } = {
      index: meta.index,
      total: meta.total,
      isCompressed: meta.isCompressed,
      data,
    };
    if (meta.hash !== undefined) {
      entry.hash = meta.hash;
    }
    parts.push(entry);
  }

  if (parts.length === 0) {
    logInfo(Component.EXIF, 'No vector data detected in EXIF', {});
    return { success: false, errors: ['No vector data detected'] } as any;
  }

  const total = parts[0]!.total;
  const isCompressed = parts[0]!.isCompressed;
  const hash = parts[0]!.hash;
  parts.sort((a, b) => a.index - b.index);
  if (parts.length !== total) {
    logError(Component.EXIF, 'Missing vector EXIF chunks', { expected: total, found: parts.length });
    return { success: false, errors: ['Missing vector EXIF chunks'] } as any;
  }

  const base64 = joinBase64(parts.map((p) => p.data));
  if (hash) {
    const actual = await sha256Base64(base64);
    if (actual !== hash) {
      logError(Component.EXIF, 'Vector EXIF digest mismatch', {});
      return { success: false, errors: ['Vector EXIF digest mismatch'] } as any;
    }
  }

  return parseVectorPayload(base64, isCompressed);
} 