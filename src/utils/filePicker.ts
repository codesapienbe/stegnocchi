/**
 * Cross-Platform File Picker Utility
 * Abstraction for file picking on web and mobile platforms
 */

import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { detectImageContainer } from '@/core/jpgv';

export interface FilePickerResult {
  file: File | null;
  uri?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  cancelled: boolean;
}

export interface FilePickerOptions {
  mediaTypes?: 'images' | 'videos' | 'all';
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  allowsMultipleSelection?: boolean;
  maxFiles?: number;
}

export interface DualUploadResult {
  container: 'jpeg' | 'jpgv' | 'unknown';
  jpegBytes?: Uint8Array;
  jpgvBytes?: Uint8Array;
  fileName?: string;
  mimeType?: string;
}

export interface MultiFilePickerResult {
  files: File[];
  assets: Array<{
    uri: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;
  cancelled: boolean;
}

/**
 * Pick files from device gallery or camera
 */
export async function pickFiles(options: FilePickerOptions = {}): Promise<FilePickerResult> {
  const {
    mediaTypes = 'images',
    allowsEditing = false,
    aspect = [1, 1],
    quality = 1,
    allowsMultipleSelection = false,
    maxFiles = 1,
  } = options;

  try {
    // Request permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.status !== 'granted') {
      return {
        file: null,
        cancelled: true,
      };
    }

    // Configure picker options
    const pickerOptions: ImagePicker.ImagePickerOptions = {
      mediaTypes: mediaTypes === 'images' 
        ? ImagePicker.MediaTypeOptions.Images 
        : mediaTypes === 'videos'
        ? ImagePicker.MediaTypeOptions.Videos
        : ImagePicker.MediaTypeOptions.All,
      allowsEditing,
      aspect,
      quality,
      allowsMultipleSelection,
    };

    // Launch picker
    const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return {
        file: null,
        cancelled: true,
      };
    }

    const asset = result.assets[0];
    
    // Convert asset to File-like object
    const file = await createFileFromAsset(asset);

    return {
      file,
      uri: asset.uri,
      fileName: asset.fileName || 'image.jpg',
      fileSize: asset.fileSize || 0,
      mimeType: asset.type || 'image/jpeg',
      cancelled: false,
    };

  } catch (error) {
    console.error('File picker error:', error);
    return {
      file: null,
      cancelled: true,
    };
  }
}

/**
 * Take photo using camera
 */
export async function takePhoto(options: FilePickerOptions = {}): Promise<FilePickerResult> {
  const {
    allowsEditing = false,
    aspect = [1, 1],
    quality = 1,
  } = options;

  try {
    // Request camera permissions
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.status !== 'granted') {
      return {
        file: null,
        cancelled: true,
      };
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing,
      aspect,
      quality,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return {
        file: null,
        cancelled: true,
      };
    }

    const asset = result.assets[0];
    
    // Convert asset to File-like object
    const file = await createFileFromAsset(asset);

    return {
      file,
      uri: asset.uri,
      fileName: asset.fileName || 'photo.jpg',
      fileSize: asset.fileSize || 0,
      mimeType: asset.type || 'image/jpeg',
      cancelled: false,
    };

  } catch (error) {
    console.error('Camera error:', error);
    return {
      file: null,
      cancelled: true,
    };
  }
}

/**
 * Create File object from Expo asset
 */
async function createFileFromAsset(asset: ImagePicker.ImagePickerAsset): Promise<File> {
  // For React Native, we need to create a File-like object
  // since File API is not available
  const fileLike = {
    name: asset.fileName || 'image.jpg',
    type: asset.type || 'image/jpeg',
    size: asset.fileSize || 0,
    uri: asset.uri,
    lastModified: Date.now(),
  } as any;

  // Add File API methods for compatibility
  fileLike.arrayBuffer = async () => {
    const response = await fetch(asset.uri);
    return response.arrayBuffer();
  };

  fileLike.stream = () => {
    return fetch(asset.uri).then(response => response.body);
  };

  fileLike.text = async () => {
    const response = await fetch(asset.uri);
    return response.text();
  };

  fileLike.slice = (start?: number, end?: number, contentType?: string) => {
    // Basic slice implementation
    return fileLike;
  };

  return fileLike as File;
}

/**
 * Check if platform supports File API
 */
export function supportsFileAPI(): boolean {
  return Platform.OS === 'web' && typeof File !== 'undefined';
}

/**
 * Get platform-specific file picker
 */
export function getPlatformFilePicker() {
  if (Platform.OS === 'web') {
    // Web implementation would use input[type="file"]
    return pickFiles;
  } else {
    // Mobile implementation uses Expo ImagePicker
    return pickFiles;
  }
} 

export async function loadBytesFromUri(uri: string): Promise<Uint8Array> {
  const res = await fetch(uri);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

export async function detectAndLoadContainerFromUri(uri: string, fileName?: string): Promise<DualUploadResult> {
  const bytes = await loadBytesFromUri(uri);
  const container = detectImageContainer(bytes);
  if (container === 'jpgv') {
    return { container, jpgvBytes: bytes, fileName, mimeType: 'application/octet-stream' };
  } else if (container === 'jpeg') {
    return { container, jpegBytes: bytes, fileName, mimeType: 'image/jpeg' };
  }
  return { container: 'unknown', fileName };
} 

export async function pickMultipleFiles(options: FilePickerOptions = {}): Promise<MultiFilePickerResult> {
  const {
    mediaTypes = 'images',
    allowsEditing = false,
    aspect = [1, 1],
    quality = 1,
    maxFiles = 10,
  } = options;

  try {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.status !== 'granted') {
      return { files: [], assets: [], cancelled: true };
    }

    const pickerOptions: ImagePicker.ImagePickerOptions = {
      mediaTypes: mediaTypes === 'images'
        ? ImagePicker.MediaTypeOptions.Images
        : mediaTypes === 'videos'
        ? ImagePicker.MediaTypeOptions.Videos
        : ImagePicker.MediaTypeOptions.All,
      allowsEditing,
      aspect,
      quality,
      allowsMultipleSelection: true,
      selectionLimit: maxFiles as any,
    } as any;

    const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { files: [], assets: [], cancelled: true };
    }

    const assets = result.assets.slice(0, maxFiles);
    const files: File[] = [];
    const meta: MultiFilePickerResult['assets'] = [];

    for (const asset of assets) {
      const f = await createFileFromAsset(asset);
      files.push(f);
      meta.push({
        uri: asset.uri,
        fileName: asset.fileName || 'image.jpg',
        fileSize: asset.fileSize || 0,
        mimeType: asset.type || 'image/jpeg',
      });
    }

    return { files, assets: meta, cancelled: false };
  } catch (error) {
    console.error('Multi-file picker error:', error);
    return { files: [], assets: [], cancelled: true };
  }
} 