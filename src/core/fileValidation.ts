/**
 * Enhanced File Validation with Platform-Specific Limits
 * Comprehensive file validation for production use
 */

import { Platform } from 'react-native';

export interface FileValidationConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  maxDimensions?: {
    width: number;
    height: number;
  };
  minDimensions?: {
    width: number;
    height: number;
  };
  maxAspectRatio?: number;
  minAspectRatio?: number;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: {
    size: number;
    type: string;
    dimensions?: {
      width: number;
      height: number;
    };
    aspectRatio?: number;
  };
}

export interface FileMetadata {
  size: number;
  type: string;
  name: string;
  lastModified?: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

// Platform-specific validation configurations
const getPlatformConfig = (): FileValidationConfig => {
  switch (Platform.OS) {
    case 'web':
      return {
        maxFileSize: 50 * 1024 * 1024, // 50MB for web
        allowedMimeTypes: [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'image/heic',
          'image/heif',
        ],
        maxDimensions: {
          width: 8192,
          height: 8192,
        },
        minDimensions: {
          width: 64,
          height: 64,
        },
        maxAspectRatio: 10, // 10:1 max aspect ratio
        minAspectRatio: 0.1, // 1:10 min aspect ratio
      };
    case 'ios':
      return {
        maxFileSize: 100 * 1024 * 1024, // 100MB for iOS
        allowedMimeTypes: [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/heic',
          'image/heif',
        ],
        maxDimensions: {
          width: 16384,
          height: 16384,
        },
        minDimensions: {
          width: 32,
          height: 32,
        },
        maxAspectRatio: 20, // 20:1 max aspect ratio
        minAspectRatio: 0.05, // 1:20 min aspect ratio
      };
    case 'android':
      return {
        maxFileSize: 100 * 1024 * 1024, // 100MB for Android
        allowedMimeTypes: [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
        ],
        maxDimensions: {
          width: 16384,
          height: 16384,
        },
        minDimensions: {
          width: 32,
          height: 32,
        },
        maxAspectRatio: 20, // 20:1 max aspect ratio
        minAspectRatio: 0.05, // 1:20 min aspect ratio
      };
    default:
      return {
        maxFileSize: 75 * 1024 * 1024, // 75MB default
        allowedMimeTypes: [
          'image/jpeg',
          'image/jpg',
          'image/png',
        ],
        maxDimensions: {
          width: 8192,
          height: 8192,
        },
        minDimensions: {
          width: 64,
          height: 64,
        },
        maxAspectRatio: 10,
        minAspectRatio: 0.1,
      };
  }
};

/**
 * Validate file with comprehensive checks
 */
export const validateFile = async (
  file: File | any,
  config?: Partial<FileValidationConfig>
): Promise<FileValidationResult> => {
  const validationConfig = { ...getPlatformConfig(), ...config };
  const errors: string[] = [];
  const warnings: string[] = [];
  const metadata: FileMetadata = {
    size: file.size || 0,
    type: file.type || '',
    name: file.name || '',
    lastModified: file.lastModified,
  };

  // Check file size
  if (metadata.size > validationConfig.maxFileSize) {
    errors.push(
      `File size (${formatFileSize(metadata.size)}) exceeds maximum allowed size (${formatFileSize(validationConfig.maxFileSize)})`
    );
  }

  // Check if file is too small (potential corruption)
  if (metadata.size < 1024) {
    warnings.push('File size is very small, may be corrupted');
  }

  // Check MIME type
  if (!validationConfig.allowedMimeTypes.includes(metadata.type.toLowerCase())) {
    errors.push(
      `File type "${metadata.type}" is not supported. Allowed types: ${validationConfig.allowedMimeTypes.join(', ')}`
    );
  }

  // Check file extension
  const extension = metadata.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = validationConfig.allowedMimeTypes.map(type => 
    type.split('/')[1]
  );
  
  if (extension && !allowedExtensions.includes(extension)) {
    warnings.push(`File extension ".${extension}" doesn't match MIME type "${metadata.type}"`);
  }

  // Validate image dimensions if possible
  try {
    const dimensions = await getImageDimensions(file);
    if (dimensions) {
      metadata.dimensions = dimensions;
      const aspectRatio = dimensions.width / dimensions.height;

      // Check minimum dimensions
      if (validationConfig.minDimensions) {
        if (dimensions.width < validationConfig.minDimensions.width) {
          errors.push(
            `Image width (${dimensions.width}px) is below minimum (${validationConfig.minDimensions.width}px)`
          );
        }
        if (dimensions.height < validationConfig.minDimensions.height) {
          errors.push(
            `Image height (${dimensions.height}px) is below minimum (${validationConfig.minDimensions.height}px)`
          );
        }
      }

      // Check maximum dimensions
      if (validationConfig.maxDimensions) {
        if (dimensions.width > validationConfig.maxDimensions.width) {
          errors.push(
            `Image width (${dimensions.width}px) exceeds maximum (${validationConfig.maxDimensions.width}px)`
          );
        }
        if (dimensions.height > validationConfig.maxDimensions.height) {
          errors.push(
            `Image height (${dimensions.height}px) exceeds maximum (${validationConfig.maxDimensions.height}px)`
          );
        }
      }

      // Check aspect ratio
      if (validationConfig.maxAspectRatio && aspectRatio > validationConfig.maxAspectRatio) {
        warnings.push(
          `Image aspect ratio (${aspectRatio.toFixed(2)}:1) is very wide, may not display well`
        );
      }
      if (validationConfig.minAspectRatio && aspectRatio < validationConfig.minAspectRatio) {
        warnings.push(
          `Image aspect ratio (${aspectRatio.toFixed(2)}:1) is very tall, may not display well`
        );
      }

      metadata.aspectRatio = aspectRatio;
    }
  } catch (error) {
    warnings.push('Could not validate image dimensions');
  }

  // Check for suspicious file characteristics
  if (metadata.size > 0 && metadata.size < 100) {
    errors.push('File appears to be corrupted or empty');
  }

  // Check file name for security
  if (metadata.name.includes('..') || metadata.name.includes('/') || metadata.name.includes('\\')) {
    errors.push('Invalid file name detected');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata,
  };
};

/**
 * Get image dimensions from file
 */
const getImageDimensions = (file: File | any): Promise<{ width: number; height: number } | null> => {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = URL.createObjectURL(file);
    } else {
      // For React Native, we'll need to use a library like react-native-image-size
      // For now, return null
      resolve(null);
    }
  });
};

/**
 * Format file size for display
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate file before processing
 */
export const validateFileForProcessing = async (
  file: File | any,
  operation: 'encrypt' | 'decrypt'
): Promise<FileValidationResult> => {
  const baseConfig = getPlatformConfig();
  
  // Stricter limits for encryption operations
  if (operation === 'encrypt') {
    baseConfig.maxFileSize = Math.min(baseConfig.maxFileSize, 25 * 1024 * 1024); // 25MB max for encryption
  }

  return validateFile(file, baseConfig);
};

export default validateFile; 