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

async function ensureBlob(data: unknown, mimeType: string): Promise<Blob> {
  if (typeof Blob === 'undefined') {
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
  if (typeof Blob !== 'undefined' && data instanceof Blob) return data;
  const base64 = await ensureBase64(data);
  const binary = typeof atob === 'function' ? atob(base64) : '';
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

async function ensureBase64(data: unknown): Promise<string> {
  if (typeof data === 'string') {
    if (data.startsWith('data:')) {
      const idx = data.indexOf('base64,');
      return idx >= 0 ? data.slice(idx + 7) : '';
    }
    // Assume base64
    return data;
  }
  if (data instanceof Uint8Array) return bytesToBase64(data);
  if (data instanceof ArrayBuffer) return bytesToBase64(new Uint8Array(data));
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    const arrBuf = await data.arrayBuffer();
    return bytesToBase64(new Uint8Array(arrBuf));
  }
  return '';
}

async function downloadFileWeb(data: ProcessedData, fileName?: string, mimeType: string = 'image/jpeg'): Promise<boolean> {
  try {
    const blob = await ensureBlob(data.imageData, mimeType);
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

export async function shareFile(data: ProcessedData, options: ShareOptions = {}): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav: any = typeof navigator !== 'undefined' ? navigator : {};
    const mimeType = options.mimeType || data.metadata?.mimeType || 'image/jpeg';
    const fileName = data.filename || 'image.jpg';
    const blob = await ensureBlob(data.imageData, mimeType);

    if (nav?.canShare && nav?.share) {
      if (typeof File !== 'undefined' && nav.canShare({ files: [new File([blob], fileName, { type: mimeType })] })) {
        const webFile = new File([blob], fileName, { type: mimeType });
        await nav.share({ files: [webFile], title: options.title || 'Share Image' });
        logInfo(Component.FILE_SYSTEM, 'Web share invoked (files)', { fileName, bytes: blob.size, mimeType });
        return true;
      }
      const url = URL.createObjectURL(blob);
      await nav.share({ title: options.title || 'Share Image', url });
      URL.revokeObjectURL(url);
      logInfo(Component.FILE_SYSTEM, 'Web share invoked (url)', { fileName, bytes: blob.size, mimeType });
      return true;
    }

    logWarn(Component.FILE_SYSTEM, 'Web Share API not available; using download fallback');
    return downloadFileWeb(data, fileName, mimeType);
  } catch (error) {
    logError(Component.FILE_SYSTEM, 'Share file error (web)', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

export async function downloadFile(data: ProcessedData, options: DownloadOptions = {}): Promise<boolean> {
  const { fileName, mimeType = 'image/jpeg' } = options;
  return downloadFileWeb(data, fileName, mimeType);
}

export async function isSharingAvailable(): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav: any = typeof navigator !== 'undefined' ? navigator : {};
    return !!(nav?.share);
  } catch {
    return false;
  }
}

export function isDownloadAvailable(): boolean {
  return true;
}

export function getPlatformFileOperations() {
  return { share: shareFile, download: downloadFile, isSharingAvailable, isDownloadAvailable };
}

export async function shareJpgvBytes(bytes: Uint8Array, filename: string = 'image.jpgv'): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav: any = typeof navigator !== 'undefined' ? navigator : {};
    const blob = await ensureBlob(bytes, 'application/octet-stream');
    if (nav?.canShare && nav?.share && typeof File !== 'undefined') {
      const webFile = new File([blob], filename, { type: 'application/octet-stream' });
      await nav.share({ files: [webFile], title: 'Share .jpgv file' });
      logInfo(Component.FILE_SYSTEM, '.jpgv share invoked (web)', { filename, bytes: blob.size });
      return true;
    }
    // fallback to download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    logInfo(Component.FILE_SYSTEM, '.jpgv downloaded (web fallback)', { filename, bytes: blob.size });
    return true;
  } catch (error) {
    logError(Component.FILE_SYSTEM, 'Share .jpgv error (web)', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
} 