/**
 * Cross-Platform File Sharing Utility
 * Abstraction for downloading/sharing files on web and mobile
 */

import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Platform, Alert } from 'react-native';
import { ProcessedData } from '@/types';

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

/**
 * Share file on mobile platforms
 */
export async function shareFile(
  data: ProcessedData,
  options: ShareOptions = {}
): Promise<boolean> {
  try {
    if (!Sharing.isAvailableAsync()) {
      console.warn('Sharing is not available on this platform');
      return false;
    }

    const { title = 'Share Image', message = 'Check out this image!' } = options;

    // For mobile, we need to save the file first
    const fileUri = await saveFileToDevice(data);
    
    if (!fileUri) {
      console.error('Failed to save file for sharing');
      return false;
    }

    const result = await Sharing.shareAsync(fileUri, {
      mimeType: data.metadata.mimeType || 'image/jpeg',
      dialogTitle: title,
      UTI: 'public.jpeg', // iOS specific
    });

    return result.shared;
  } catch (error) {
    console.error('Share file error:', error);
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
      return downloadFileWeb(data, fileName, mimeType);
    } else {
      // Mobile download implementation
      return downloadFileMobile(data, fileName, mimeType, showAlert);
    }
  } catch (error) {
    console.error('Download file error:', error);
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
    // Create blob from data
    const blob = new Blob([data.imageData], { type: mimeType });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || data.filename;
    link.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Web download error:', error);
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
      console.error('Failed to save file');
      return false;
    }

    if (showAlert) {
      Alert.alert(
        'Download Complete',
        `File saved as: ${fileName || data.filename}`,
        [{ text: 'OK' }]
      );
    }

    return true;
  } catch (error) {
    console.error('Mobile download error:', error);
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
    const targetFileName = fileName || data.filename;
    const fileUri = `${FileSystem.documentDirectory}${targetFileName}`;

    // Convert data to base64 if needed
    let fileData = data.imageData;
    if (typeof fileData === 'string' && !fileData.startsWith('data:')) {
      // Assume it's a file path or URI
      fileData = await FileSystem.readAsStringAsync(fileData, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    // Save file
    await FileSystem.writeAsStringAsync(fileUri, fileData as string, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return fileUri;
  } catch (error) {
    console.error('Save file error:', error);
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
    console.error('Check sharing availability error:', error);
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