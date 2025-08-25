import { logInfo, logError, Component } from '@/core/logger';

export interface DownloadOptions {
  filename?: string;
  mimeType?: string;
  onProgress?: (progress: number) => void;
  onComplete?: (url: string) => void;
  onError?: (error: Error) => void;
}

export interface DownloadResult {
  success: boolean;
  url?: string;
  error?: string;
}

async function downloadOnWeb(
  data: Blob | ArrayBuffer | string,
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  try {
    const { filename = 'download', mimeType = 'application/octet-stream' } = options;

    let blob: Blob;
    if (typeof data === 'string') {
      blob = new Blob([data], { type: mimeType });
    } else if (data instanceof ArrayBuffer) {
      blob = new Blob([data], { type: mimeType });
    } else {
      blob = data;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    logInfo(Component.FILE_SYSTEM, 'File downloaded successfully on web', {
      filename,
      size: blob.size,
      mimeType,
    });

    options.onComplete?.(url);
    return { success: true, url };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError(Component.FILE_SYSTEM, 'Web download failed', { error: errorMessage });
    options.onError?.(error instanceof Error ? error : new Error(errorMessage));
    return { success: false, error: errorMessage };
  }
}

export async function downloadFile(
  data: Blob | ArrayBuffer | string,
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  return downloadOnWeb(data, options);
}

export async function downloadProcessedImage(
  imageBlob: Blob,
  filename: string = 'steganography-image.jpg',
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  return downloadFile(imageBlob, { filename, mimeType: 'image/jpeg', ...options });
}

export async function downloadTextFile(
  content: string,
  filename: string = 'extracted-message.txt',
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  const blob = new Blob([content], { type: 'text/plain' });
  return downloadFile(blob, { filename, mimeType: 'text/plain', ...options });
}

export async function downloadJsonFile(
  data: any,
  filename: string = 'data.json',
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  const content = JSON.stringify(data, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  return downloadFile(blob, { filename, mimeType: 'application/json', ...options });
}

export async function downloadJpgv(
  bytes: Uint8Array,
  filename: string = 'image.jpgv',
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return downloadFile(arrayBuffer, { filename, mimeType: 'application/octet-stream', ...options });
} 