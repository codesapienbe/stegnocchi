import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { logInfo, logError, Component } from '../core/logger';

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

/**
 * Download file on web platform
 */
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
    
    // Clean up the object URL
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

/**
 * Download file on mobile platform
 */
async function downloadOnMobile(
  data: Blob | ArrayBuffer | string,
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  try {
    const { filename = 'download', mimeType = 'application/octet-stream' } = options;
    
    // Convert data to base64 if needed
    let base64Data: string;
    if (typeof data === 'string') {
      base64Data = data;
    } else if (data instanceof ArrayBuffer) {
      const uint8Array = new Uint8Array(data);
      base64Data = Buffer.from(uint8Array).toString('base64');
    } else {
      // Convert Blob to base64
      const arrayBuffer = await data.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      base64Data = Buffer.from(uint8Array).toString('base64');
    }

    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    
    // Write file to local storage
    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: `Download ${filename}`,
      });
    }

    logInfo(Component.FILE_SYSTEM, 'File downloaded successfully on mobile', {
      filename,
      fileUri,
      mimeType,
    });

    options.onComplete?.(fileUri);
    return { success: true, url: fileUri };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError(Component.FILE_SYSTEM, 'Mobile download failed', { error: errorMessage });
    options.onError?.(error instanceof Error ? error : new Error(errorMessage));
    return { success: false, error: errorMessage };
  }
}

/**
 * Download file with platform-specific handling
 */
export async function downloadFile(
  data: Blob | ArrayBuffer | string,
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  if (Platform.OS === 'web') {
    return downloadOnWeb(data, options);
  } else {
    return downloadOnMobile(data, options);
  }
}

/**
 * Download image with injected steganography data
 */
export async function downloadProcessedImage(
  imageBlob: Blob,
  filename: string = 'steganography-image.jpg',
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  return downloadFile(imageBlob, {
    filename,
    mimeType: 'image/jpeg',
    ...options,
  });
}

/**
 * Download text file (e.g., extracted message)
 */
export async function downloadTextFile(
  content: string,
  filename: string = 'extracted-message.txt',
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  const blob = new Blob([content], { type: 'text/plain' });
  return downloadFile(blob, {
    filename,
    mimeType: 'text/plain',
    ...options,
  });
}

/**
 * Download JSON file (e.g., configuration, logs)
 */
export async function downloadJsonFile(
  data: any,
  filename: string = 'data.json',
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  const content = JSON.stringify(data, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  return downloadFile(blob, {
    filename,
    mimeType: 'application/json',
    ...options,
  });
} 