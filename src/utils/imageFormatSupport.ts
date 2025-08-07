import { Platform } from 'react-native';
import { logInfo, logError, Component } from '../core/logger';

export interface ImageFormatInfo {
  format: string;
  mimeType: string;
  extensions: string[];
  supported: boolean;
  features: {
    transparency: boolean;
    animation: boolean;
    compression: boolean;
    exif: boolean;
  };
}

export interface ConversionOptions {
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  width?: number;
  height?: number;
  preserveExif?: boolean;
}

export interface ConversionResult {
  success: boolean;
  data?: ArrayBuffer;
  format?: string;
  size?: number;
  error?: string;
}

/**
 * Image format support detection and conversion
 */
export class ImageFormatSupport {
  private static readonly SUPPORTED_FORMATS: Record<string, ImageFormatInfo> = {
    jpeg: {
      format: 'JPEG',
      mimeType: 'image/jpeg',
      extensions: ['.jpg', '.jpeg'],
      supported: true,
      features: {
        transparency: false,
        animation: false,
        compression: true,
        exif: true,
      },
    },
    png: {
      format: 'PNG',
      mimeType: 'image/png',
      extensions: ['.png'],
      supported: true,
      features: {
        transparency: true,
        animation: false,
        compression: true,
        exif: false,
      },
    },
    webp: {
      format: 'WebP',
      mimeType: 'image/webp',
      extensions: ['.webp'],
      supported: this.isWebPSupported(),
      features: {
        transparency: true,
        animation: true,
        compression: true,
        exif: false,
      },
    },
    heic: {
      format: 'HEIC',
      mimeType: 'image/heic',
      extensions: ['.heic', '.heif'],
      supported: this.isHEICSupported(),
      features: {
        transparency: false,
        animation: false,
        compression: true,
        exif: true,
      },
    },
  };

  /**
   * Check WebP support
   */
  private static isWebPSupported(): boolean {
    if (Platform.OS === 'web') {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    return true; // Assume supported on mobile
  }

  /**
   * Check HEIC support
   */
  private static isHEICSupported(): boolean {
    if (Platform.OS === 'web') {
      return false; // Limited HEIC support on web
    }
    return true; // Assume supported on mobile
  }

  /**
   * Get format info by file extension
   */
  static getFormatByExtension(filename: string): ImageFormatInfo | null {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    for (const format of Object.values(this.SUPPORTED_FORMATS)) {
      if (format.extensions.includes(extension)) {
        return format;
      }
    }
    
    return null;
  }

  /**
   * Get format info by MIME type
   */
  static getFormatByMimeType(mimeType: string): ImageFormatInfo | null {
    for (const format of Object.values(this.SUPPORTED_FORMATS)) {
      if (format.mimeType === mimeType) {
        return format;
      }
    }
    
    return null;
  }

  /**
   * Check if format supports EXIF
   */
  static supportsExif(format: string): boolean {
    const formatInfo = this.SUPPORTED_FORMATS[format.toLowerCase()];
    return formatInfo?.features.exif || false;
  }

  /**
   * Convert image to JPEG for steganography
   */
  static async convertToJpeg(
    imageData: ArrayBuffer,
    originalFormat: string,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    try {
      const { quality = 0.9, preserveExif = true } = options;
      
      if (originalFormat.toLowerCase() === 'jpeg') {
        // Already JPEG, return as-is
        return {
          success: true,
          data: imageData,
          format: 'jpeg',
          size: imageData.byteLength,
        };
      }

      if (Platform.OS === 'web') {
        return this.convertToJpegWeb(imageData, originalFormat, quality);
      } else {
        return this.convertToJpegMobile(imageData, originalFormat, quality);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError(Component.FILE_SYSTEM, 'Image conversion failed', { 
        originalFormat, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Convert to JPEG on web platform
   */
  private static async convertToJpegWeb(
    imageData: ArrayBuffer,
    originalFormat: string,
    quality: number
  ): Promise<ConversionResult> {
    return new Promise((resolve) => {
      const blob = new Blob([imageData], { type: `image/${originalFormat}` });
      const url = URL.createObjectURL(blob);
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ success: false, error: 'Failed to get canvas context' });
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              blob.arrayBuffer().then((arrayBuffer) => {
                URL.revokeObjectURL(url);
                resolve({
                  success: true,
                  data: arrayBuffer,
                  format: 'jpeg',
                  size: arrayBuffer.byteLength,
                });
              });
            } else {
              URL.revokeObjectURL(url);
              resolve({ success: false, error: 'Failed to convert image' });
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ success: false, error: 'Failed to load image' });
      };
      
      img.src = url;
    });
  }

  /**
   * Convert to JPEG on mobile platform
   */
  private static async convertToJpegMobile(
    imageData: ArrayBuffer,
    originalFormat: string,
    quality: number
  ): Promise<ConversionResult> {
    // For mobile, we'll use a simplified approach
    // In a real implementation, you'd use native image processing libraries
    
    logInfo(Component.FILE_SYSTEM, 'Mobile image conversion', {
      originalFormat,
      quality,
      size: imageData.byteLength,
    });

    // Placeholder: return original data for now
    // In production, implement native image conversion
    return {
      success: true,
      data: imageData,
      format: 'jpeg',
      size: imageData.byteLength,
    };
  }

  /**
   * Get all supported formats
   */
  static getSupportedFormats(): ImageFormatInfo[] {
    return Object.values(this.SUPPORTED_FORMATS).filter(format => format.supported);
  }

  /**
   * Validate image format for steganography
   */
  static validateForSteganography(format: string): { valid: boolean; error?: string } {
    const formatInfo = this.SUPPORTED_FORMATS[format.toLowerCase()];
    
    if (!formatInfo) {
      return { valid: false, error: `Unsupported format: ${format}` };
    }
    
    if (!formatInfo.supported) {
      return { valid: false, error: `Format not supported on this platform: ${format}` };
    }
    
    if (!formatInfo.features.exif) {
      return { 
        valid: false, 
        error: `Format ${format} does not support EXIF data required for steganography` 
      };
    }
    
    return { valid: true };
  }
} 