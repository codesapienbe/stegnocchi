/**
 * Cross-Platform File Sharing Utility
 * Abstraction for downloading/sharing files on web and mobile
 */

import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Platform, Alert } from 'react-native';
import { ProcessedData } from '@/types';
import { logInfo, logWarn, logError, Component } from '@/core/logger';

export interface ShareOptions {
  title?: string;
  message?: string;
  url?: string;
  mimeType?: string;
}

export interface DownloadOptions {
  fileName?: string;
  mimeType?: string;
  showAlert?: boolean;
}

function bytesToBase64(bytes: Uint8Array): string {
  try {
    // Prefer Buffer when available (metro/node polyfill)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const B: any = (global as any).Buffer || (window as any)?.Buffer;
    if (B) return B.from(bytes).toString('base64');
  } catch {}
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk) as any);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const btoaFn: any = (typeof btoa !== 'undefined' ? btoa : (s: string) => (global as any).Buffer.from(s, 'binary').toString('base64'));
  return btoaFn(binary);
}

async function ensureBase64(data: unknown): Promise<string> {
  // Accepts data URL, base64 string, file URI, Uint8Array, ArrayBuffer
  if (typeof data === 'string') {
    if (data.startsWith('data:')) {
      // data URL -> extract base64
      const idx = data.indexOf('base64,');
      return idx >= 0 ? data.slice(idx + 7) : '';
    }
    // Assume file URI or already-base64
    // Heuristic: if contains non-base64 chars, read file as base64
    const looksBase64 = /^[A-Za-z0-9+/=\n\r]+$/.test(data.replace(/\s+/g, '')) && data.length > 0;
    if (looksBase64) return data;
    try {
      const content = await FileSystem.readAsStringAsync(data, { encoding: FileSystem.EncodingType.Base64 });
      return content;
    } catch {
      return '';
    }
  }
  if (data instanceof Uint8Array) {
    return bytesToBase64(data);
  }
  if (data instanceof ArrayBuffer) {
    return bytesToBase64(new Uint8Array(data));
  }
  // Blob (web)
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    const arrBuf = await data.arrayBuffer();
    return bytesToBase64(new Uint8Array(arrBuf));
  }
  return '';
}

async function dataToBlob(data: unknown, mimeType: string): Promise<Blob> {
  if (typeof Blob === 'undefined') {
    // Fallback: create minimal polyfill via bytes and return any
    const base64 = await ensureBase64(data);
    const binary = typeof atob === 'function' ? atob(base64) : '';
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (global as any).Blob([bytes], { type: mimeType });
  }

  if (typeof data === 'string' && data.startsWith('data:')) {
    const res = await fetch(data);
    return await res.blob();
  }
  if (data instanceof Uint8Array) return new Blob([data], { type: mimeType });
  if (data instanceof ArrayBuffer) return new Blob([new Uint8Array(data)], { type: mimeType });
  if (data instanceof Blob) return data;

  // Assume base64 string or file path
  const base64 = await ensureBase64(data);
  const binary = typeof atob === 'function' ? atob(base64) : '';
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

/**
 * Share file on mobile platforms
 */
export async function shareFile(
  data: ProcessedData,
  options: ShareOptions = {}
): Promise<boolean> {
  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      logWarn(Component.FILE_SYSTEM, 'Sharing not available on this platform');
      return false;
    }

    const { title = 'Share Image' } = options;

    // For mobile, we need to save the file first
    const fileUri = await saveFileToDevice(data);

    if (!fileUri) {
      logError(Component.FILE_SYSTEM, 'Failed to save file for sharing');
      return false;
    }

    const result = await Sharing.shareAsync(fileUri, {
      mimeType: data.metadata?.mimeType || 'image/jpeg',
      dialogTitle: title,
      UTI: 'public.jpeg', // iOS specific
    });

    logInfo(Component.FILE_SYSTEM, 'Share invoked', { fileUri, shared: !!(result as any)?.shared });
    // @ts-expect-error expo-sharing types may vary
    return !!result?.shared;
  } catch (error) {
    logError(Component.FILE_SYSTEM, 'Share file error', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

/**
 * Download file on web platforms
 */
export async function downloadFile(
  data: ProcessedData,
  options: DownloadOptions = {}
): Promise<boolean> {
  try {
    const { fileName, mimeType = 'image/jpeg', showAlert = true } = options;

    if (Platform.OS === 'web') {
      // Web download implementation
      return await downloadFileWeb(data, fileName, mimeType);
    } else {
      // Mobile download implementation
      return await downloadFileMobile(data, fileName, mimeType, showAlert);
    }
  } catch (error) {
    logError(Component.FILE_SYSTEM, 'Download file error', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

/**
 * Web-specific file download
 */
async function downloadFileWeb(
  data: ProcessedData,
  fileName?: string,
  mimeType: string = 'image/jpeg'
): Promise<boolean> {
  try {
    const blob = await dataToBlob(data.imageData, mimeType);

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || data.filename || 'download';
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    logInfo(Component.FILE_SYSTEM, 'Web file downloaded', { fileName: link.download, bytes: blob.size, mimeType });
    return true;
  } catch (error) {
    logError(Component.FILE_SYSTEM, 'Web download error', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

/**
 * Mobile-specific file download
 */
async function downloadFileMobile(
  data: ProcessedData,
  fileName?: string,
  mimeType: string = 'image/jpeg',
  showAlert: boolean = true
): Promise<boolean> {
  try {
    const fileUri = await saveFileToDevice(data, fileName);

    if (!fileUri) {
      logError(Component.FILE_SYSTEM, 'Failed to save file for mobile download');
      return false;
    }

    if (showAlert) {
      Alert.alert(
        'Download Complete',
        `File saved as: ${fileName || data.filename}`,
        [{ text: 'OK' }]
      );
    }

    logInfo(Component.FILE_SYSTEM, 'Mobile file saved', { fileUri, mimeType });
    return true;
  } catch (error) {
    logError(Component.FILE_SYSTEM, 'Mobile download error', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

/**
 * Save file to device storage
 */
async function saveFileToDevice(
  data: ProcessedData,
  fileName?: string
): Promise<string | null> {
  try {
    const targetFileName = fileName || data.filename || 'download.jpg';
    const fileUri = `${FileSystem.documentDirectory}${targetFileName}`;

    const base64 = await ensureBase64(data.imageData);
    if (!base64) {
      logError(Component.FILE_SYSTEM, 'Could not derive base64 for file save', { fileName: targetFileName });
      return null;
    }

    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    logInfo(Component.FILE_SYSTEM, 'File saved to device', { fileUri, bytes: Math.floor(base64.length * 0.75) });
    return fileUri;
  } catch (error) {
    logError(Component.FILE_SYSTEM, 'Save file error', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Check if sharing is available
 */
export async function isSharingAvailable(): Promise<boolean> {
  try {
    return await Sharing.isAvailableAsync();
  } catch (error) {
    logError(Component.FILE_SYSTEM, 'Check sharing availability error', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

/**
 * Check if downloading is available
 */
export function isDownloadAvailable(): boolean {
  return Platform.OS === 'web' || Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Get platform-specific file operations
 */
export function getPlatformFileOperations() {
  return {
    share: shareFile,
    download: downloadFile,
    isSharingAvailable,
    isDownloadAvailable,
  };
}

export async function shareJpgvBytes(bytes: Uint8Array, filename: string = 'image.jpgv'): Promise<boolean> {
  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      logWarn(Component.FILE_SYSTEM, 'Sharing not available for .jpgv');
      return false;
    }
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    const base64 = bytesToBase64(bytes);
    await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
    const result = await Sharing.shareAsync(fileUri, {
      mimeType: 'application/octet-stream',
      dialogTitle: 'Share .jpgv file',
      UTI: 'public.data',
    });
    logInfo(Component.FILE_SYSTEM, '.jpgv share invoked', { fileUri, shared: !!(result as any)?.shared });
    // @ts-expect-error expo-sharing types may vary
    return !!result?.shared;
  } catch (error) {
    logError(Component.FILE_SYSTEM, 'Share .jpgv error', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
} 