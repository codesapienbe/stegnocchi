import { Platform } from 'react-native';
import { logInfo, logError, Component } from '../core/logger';

export interface CompressionOptions {
  quality: number; // 0-1
  maxWidth?: number;
  maxHeight?: number;
  format: 'jpeg' | 'png' | 'webp';
  progressive?: boolean;
  optimize?: boolean;
}

export interface CompressionResult {
  success: boolean;
  data?: ArrayBuffer;
  originalSize: number;
  compressedSize?: number;
  compressionRatio?: number;
  error?: string;
}

/**
 * Image compression utility
 */
export class ImageCompression {
  /**
   * Compress image on web platform
   */
  static async compressWeb(
    imageData: ArrayBuffer,
    options: CompressionOptions
  ): Promise<CompressionResult> {
    try {
      const { quality, maxWidth, maxHeight, format, progressive = true } = options;
      const originalSize = imageData.byteLength;

      const blob = new Blob([imageData], { type: `image/${format}` });
      const url = URL.createObjectURL(blob);

      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Resize if needed
          if (maxWidth && width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (maxHeight && height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            resolve({
              success: false,
              originalSize,
              error: 'Failed to get canvas context',
            });
            return;
          }

          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                blob.arrayBuffer().then((arrayBuffer) => {
                  URL.revokeObjectURL(url);
                  const compressedSize = arrayBuffer.byteLength;
                  const compressionRatio = originalSize > 0 ? compressedSize / originalSize : 1;

                  logInfo(Component.FILE_SYSTEM, 'Image compressed successfully', {
                    originalSize,
                    compressedSize,
                    compressionRatio: `${(compressionRatio * 100).toFixed(1)}%`,
                    quality,
                    format,
                  });

                  resolve({
                    success: true,
                    data: arrayBuffer,
                    originalSize,
                    compressedSize,
                    compressionRatio,
                  });
                });
              } else {
                URL.revokeObjectURL(url);
                resolve({
                  success: false,
                  originalSize,
                  error: 'Failed to compress image',
                });
              }
            },
            `image/${format}`,
            quality
          );
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve({
            success: false,
            originalSize,
            error: 'Failed to load image',
          });
        };

        img.src = url;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError(Component.FILE_SYSTEM, 'Web image compression failed', { error: errorMessage });
      return {
        success: false,
        originalSize: imageData.byteLength,
        error: errorMessage,
      };
    }
  }

  /**
   * Compress image on mobile platform
   */
  static async compressMobile(
    imageData: ArrayBuffer,
    options: CompressionOptions
  ): Promise<CompressionResult> {
    try {
      const { quality, maxWidth, maxHeight, format } = options;
      const originalSize = imageData.byteLength;

      // For mobile, we'll use a simplified approach
      // In a real implementation, you'd use native image compression libraries
      
      logInfo(Component.FILE_SYSTEM, 'Mobile image compression', {
        originalSize,
        quality,
        format,
        maxWidth,
        maxHeight,
      });

      // Placeholder: return original data for now
      // In production, implement native image compression
      return {
        success: true,
        data: imageData,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError(Component.FILE_SYSTEM, 'Mobile image compression failed', { error: errorMessage });
      return {
        success: false,
        originalSize: imageData.byteLength,
        error: errorMessage,
      };
    }
  }

  /**
   * Compress image with platform-specific handling
   */
  static async compress(
    imageData: ArrayBuffer,
    options: CompressionOptions
  ): Promise<CompressionResult> {
    if (Platform.OS === 'web') {
      return this.compressWeb(imageData, options);
    } else {
      return this.compressMobile(imageData, options);
    }
  }

  /**
   * Get recommended compression settings based on image size
   */
  static getRecommendedSettings(imageSize: number): CompressionOptions {
    if (imageSize > 10 * 1024 * 1024) { // > 10MB
      return {
        quality: 0.7,
        maxWidth: 1920,
        maxHeight: 1080,
        format: 'jpeg',
        progressive: true,
        optimize: true,
      };
    } else if (imageSize > 5 * 1024 * 1024) { // > 5MB
      return {
        quality: 0.8,
        maxWidth: 2560,
        maxHeight: 1440,
        format: 'jpeg',
        progressive: true,
        optimize: true,
      };
    } else if (imageSize > 1 * 1024 * 1024) { // > 1MB
      return {
        quality: 0.85,
        format: 'jpeg',
        progressive: true,
        optimize: true,
      };
    } else {
      return {
        quality: 0.9,
        format: 'jpeg',
        progressive: false,
        optimize: false,
      };
    }
  }

  /**
   * Validate compression options
   */
  static validateOptions(options: CompressionOptions): { valid: boolean; error?: string } {
    if (options.quality < 0 || options.quality > 1) {
      return { valid: false, error: 'Quality must be between 0 and 1' };
    }

    if (options.maxWidth && options.maxWidth <= 0) {
      return { valid: false, error: 'Max width must be positive' };
    }

    if (options.maxHeight && options.maxHeight <= 0) {
      return { valid: false, error: 'Max height must be positive' };
    }

    const validFormats = ['jpeg', 'png', 'webp'];
    if (!validFormats.includes(options.format)) {
      return { valid: false, error: `Invalid format. Must be one of: ${validFormats.join(', ')}` };
    }

    return { valid: true };
  }
} 