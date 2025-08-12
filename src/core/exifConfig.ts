import { logInfo, logWarn, Component } from './logger';

export type ExifFieldName = 'UserComment' | 'ImageDescription' | 'Artist' | 'Copyright' | string;

let exifStorageFields: ExifFieldName[] = ['UserComment', 'ImageDescription', 'Artist'];

export function setExifStorageFields(fields: ExifFieldName[]): void {
  const cleaned = Array.from(new Set((fields || []).map((f) => String(f).trim()).filter((f) => f.length > 0)));
  if (cleaned.length === 0) {
    logWarn(Component.EXIF, 'Attempted to set empty EXIF storage fields; keeping previous configuration');
    return;
  }
  exifStorageFields = cleaned;
  logInfo(Component.EXIF, 'Updated EXIF storage fields', { fields: exifStorageFields });
}

export function getExifStorageFields(): ExifFieldName[] {
  return [...exifStorageFields];
}

export function resetExifStorageFields(): void {
  exifStorageFields = ['UserComment', 'ImageDescription', 'Artist'];
  logInfo(Component.EXIF, 'Reset EXIF storage fields to defaults', { fields: exifStorageFields });
} 