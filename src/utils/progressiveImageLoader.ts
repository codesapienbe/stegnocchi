import { Platform } from 'react-native';
import { logInfo, logError, Component } from '../core/logger';

export interface ProgressiveLoadOptions {
  chunkSize?: number;
  onProgress?: (progress: number) => void;
  onChunk?: (chunk: ArrayBuffer, offset: number) => void;
  onComplete?: (data: ArrayBuffer) => void;
  onError?: (error: Error) => void;
}

export interface ImageLoadResult {
  success: boolean;
  data?: ArrayBuffer;
  error?: string;
  size?: number;
  duration?: number;
}

/**
 * Progressive image loader for large files
 */
export class ProgressiveImageLoader {
  private chunkSize: number;
  private onProgress?: (progress: number) => void;
  private onChunk?: (chunk: ArrayBuffer, offset: number) => void;
  private onComplete?: (data: ArrayBuffer) => void;
  private onError?: (error: Error) => void;

  constructor(options: ProgressiveLoadOptions = {}) {
    this.chunkSize = options.chunkSize || 1024 * 1024; // 1MB chunks
    this.onProgress = options.onProgress;
    this.onChunk = options.onChunk;
    this.onComplete = options.onComplete;
    this.onError = options.onError;
  }

  /**
   * Load image progressively on web
   */
  private async loadProgressiveWeb(file: File): Promise<ImageLoadResult> {
    const startTime = Date.now();
    
    try {
      const chunks: ArrayBuffer[] = [];
      const totalSize = file.size;
      let loadedSize = 0;

      // Read file in chunks
      for (let offset = 0; offset < totalSize; offset += this.chunkSize) {
        const chunk = file.slice(offset, offset + this.chunkSize);
        const arrayBuffer = await chunk.arrayBuffer();
        
        chunks.push(arrayBuffer);
        loadedSize += arrayBuffer.byteLength;
        
        // Report progress
        const progress = (loadedSize / totalSize) * 100;
        this.onProgress?.(progress);
        this.onChunk?.(arrayBuffer, offset);

        logInfo(Component.FILE_SYSTEM, 'Image chunk loaded', {
          offset,
          chunkSize: arrayBuffer.byteLength,
          progress: `${progress.toFixed(1)}%`,
        });
      }

      // Combine all chunks
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
      const result = new ArrayBuffer(totalLength);
      const uint8Array = new Uint8Array(result);
      
      let offset = 0;
      for (const chunk of chunks) {
        uint8Array.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }

      const duration = Date.now() - startTime;
      
      logInfo(Component.FILE_SYSTEM, 'Progressive image load completed', {
        totalSize,
        duration,
        chunks: chunks.length,
      });

      this.onComplete?.(result);
      return {
        success: true,
        data: result,
        size: totalSize,
        duration,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError(Component.FILE_SYSTEM, 'Progressive image load failed', { error: errorMessage });
      this.onError?.(error instanceof Error ? error : new Error(errorMessage));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Load image progressively on mobile
   */
  private async loadProgressiveMobile(file: any): Promise<ImageLoadResult> {
    const startTime = Date.now();
    
    try {
      // For mobile, we'll use a simpler approach since file reading is different
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      const duration = Date.now() - startTime;
      
      logInfo(Component.FILE_SYSTEM, 'Mobile image load completed', {
        size: arrayBuffer.byteLength,
        duration,
      });

      this.onProgress?.(100);
      this.onComplete?.(arrayBuffer);
      
      return {
        success: true,
        data: arrayBuffer,
        size: arrayBuffer.byteLength,
        duration,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError(Component.FILE_SYSTEM, 'Mobile image load failed', { error: errorMessage });
      this.onError?.(error instanceof Error ? error : new Error(errorMessage));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Read file as ArrayBuffer (mobile helper)
   */
  private async readFileAsArrayBuffer(file: any): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Load image progressively
   */
  async loadImage(file: File | any): Promise<ImageLoadResult> {
    if (Platform.OS === 'web') {
      return this.loadProgressiveWeb(file as File);
    } else {
      return this.loadProgressiveMobile(file);
    }
  }

  /**
   * Create image preview from loaded data
   */
  static createImagePreview(data: ArrayBuffer, mimeType: string = 'image/jpeg'): string {
    const blob = new Blob([data], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  /**
   * Validate image format and size
   */
  static validateImage(file: File, maxSize: number = 50 * 1024 * 1024): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size (${maxSize / 1024 / 1024}MB)`,
      };
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported file type: ${file.type}. Supported types: ${validTypes.join(', ')}`,
      };
    }

    return { valid: true };
  }
}

/**
 * Convenience function for progressive image loading
 */
export async function loadImageProgressively(
  file: File | any,
  options: ProgressiveLoadOptions = {}
): Promise<ImageLoadResult> {
  const loader = new ProgressiveImageLoader(options);
  return loader.loadImage(file);
} 