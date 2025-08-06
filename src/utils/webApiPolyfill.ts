/**
 * Web API Polyfills
 * Polyfills for web APIs to ensure cross-platform compatibility
 */

import { Platform } from 'react-native';

// Check if we're on web platform
const isWeb = Platform.OS === 'web';

/**
 * Blob polyfill for React Native
 */
export class BlobPolyfill {
  private data: ArrayBuffer | string;
  private type: string;

  constructor(data: ArrayBuffer | string, options?: { type?: string }) {
    this.data = data;
    this.type = options?.type || 'application/octet-stream';
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    if (this.data instanceof ArrayBuffer) {
      return this.data;
    }
    // Convert string to ArrayBuffer
    const encoder = new TextEncoder();
    return encoder.encode(this.data).buffer;
  }

  async text(): Promise<string> {
    if (typeof this.data === 'string') {
      return this.data;
    }
    // Convert ArrayBuffer to string
    const decoder = new TextDecoder();
    return decoder.decode(this.data);
  }

  slice(start?: number, end?: number, contentType?: string): BlobPolyfill {
    // Basic slice implementation
    return new BlobPolyfill(this.data, { type: contentType || this.type });
  }

  get size(): number {
    if (this.data instanceof ArrayBuffer) {
      return this.data.byteLength;
    }
    return this.data.length;
  }

  get type(): string {
    return this.type;
  }
}

/**
 * URL polyfill for React Native
 */
export class URLPolyfill {
  private url: string;

  constructor(url: string, base?: string) {
    this.url = base ? new URL(url, base).href : url;
  }

  static createObjectURL(blob: Blob | BlobPolyfill): string {
    // For React Native, return a data URL
    if (blob instanceof BlobPolyfill) {
      return `data:${blob.type};base64,${btoa(blob.data as string)}`;
    }
    // For web, use native URL.createObjectURL
    if (isWeb && typeof URL !== 'undefined') {
      return URL.createObjectURL(blob);
    }
    return '';
  }

  static revokeObjectURL(url: string): void {
    // For web, use native URL.revokeObjectURL
    if (isWeb && typeof URL !== 'undefined') {
      URL.revokeObjectURL(url);
    }
  }

  get href(): string {
    return this.url;
  }
}

/**
 * Document polyfill for React Native
 */
export const DocumentPolyfill = {
  createElement: (tagName: string): any => {
    if (isWeb && typeof document !== 'undefined') {
      return document.createElement(tagName);
    }
    // Return a mock element for React Native
    return {
      href: '',
      download: '',
      style: {},
      click: () => {},
      appendChild: () => {},
      removeChild: () => {},
    };
  },

  body: isWeb && typeof document !== 'undefined' ? document.body : {
    appendChild: () => {},
    removeChild: () => {},
  },
};

/**
 * Window polyfill for React Native
 */
export const WindowPolyfill = {
  URL: isWeb && typeof window !== 'undefined' ? window.URL : URLPolyfill,
  document: isWeb && typeof window !== 'undefined' ? window.document : DocumentPolyfill,
  Blob: isWeb && typeof window !== 'undefined' ? window.Blob : BlobPolyfill,
};

/**
 * File polyfill for React Native
 */
export class FilePolyfill extends BlobPolyfill {
  name: string;
  lastModified: number;

  constructor(
    data: ArrayBuffer | string,
    name: string,
    options?: { type?: string; lastModified?: number }
  ) {
    super(data, options);
    this.name = name;
    this.lastModified = options?.lastModified || Date.now();
  }
}

/**
 * FileReader polyfill for React Native
 */
export class FileReaderPolyfill {
  private result: string | ArrayBuffer | null = null;
  private error: Error | null = null;
  private readyState: number = 0; // EMPTY
  private onload: ((event: any) => void) | null = null;
  private onerror: ((event: any) => void) | null = null;

  readAsText(blob: Blob | BlobPolyfill, encoding?: string): void {
    this.readyState = 1; // LOADING
    setTimeout(async () => {
      try {
        if (blob instanceof BlobPolyfill) {
          this.result = await blob.text();
        } else if (isWeb && typeof FileReader !== 'undefined') {
          // Use native FileReader on web
          const reader = new FileReader();
          reader.onload = (e) => {
            this.result = e.target?.result || null;
            this.readyState = 2; // DONE
            this.onload?.(e);
          };
          reader.onerror = (e) => {
            this.error = new Error('File read error');
            this.readyState = 2; // DONE
            this.onerror?.(e);
          };
          reader.readAsText(blob, encoding);
          return;
        }
        this.readyState = 2; // DONE
        this.onload?.({ target: { result: this.result } });
      } catch (error) {
        this.error = error as Error;
        this.readyState = 2; // DONE
        this.onerror?.({ target: { error: this.error } });
      }
    }, 0);
  }

  readAsArrayBuffer(blob: Blob | BlobPolyfill): void {
    this.readyState = 1; // LOADING
    setTimeout(async () => {
      try {
        if (blob instanceof BlobPolyfill) {
          this.result = await blob.arrayBuffer();
        } else if (isWeb && typeof FileReader !== 'undefined') {
          // Use native FileReader on web
          const reader = new FileReader();
          reader.onload = (e) => {
            this.result = e.target?.result || null;
            this.readyState = 2; // DONE
            this.onload?.(e);
          };
          reader.onerror = (e) => {
            this.error = new Error('File read error');
            this.readyState = 2; // DONE
            this.onerror?.(e);
          };
          reader.readAsArrayBuffer(blob);
          return;
        }
        this.readyState = 2; // DONE
        this.onload?.({ target: { result: this.result } });
      } catch (error) {
        this.error = error as Error;
        this.readyState = 2; // DONE
        this.onerror?.({ target: { error: this.error } });
      }
    }, 0);
  }
}

/**
 * Initialize polyfills
 */
export function initializePolyfills(): void {
  if (!isWeb) {
    // Only polyfill on non-web platforms
    if (typeof global !== 'undefined') {
      global.Blob = BlobPolyfill;
      global.File = FilePolyfill;
      global.FileReader = FileReaderPolyfill;
      global.URL = URLPolyfill;
    }
  }
}

/**
 * Check if native APIs are available
 */
export function hasNativeAPIs(): boolean {
  return isWeb && typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Get appropriate API implementation
 */
export function getAPI(name: 'Blob' | 'File' | 'FileReader' | 'URL' | 'document' | 'window'): any {
  if (isWeb && typeof window !== 'undefined') {
    switch (name) {
      case 'Blob':
        return window.Blob;
      case 'File':
        return window.File;
      case 'FileReader':
        return window.FileReader;
      case 'URL':
        return window.URL;
      case 'document':
        return window.document;
      case 'window':
        return window;
    }
  }
  
  // Return polyfills for React Native
  switch (name) {
    case 'Blob':
      return BlobPolyfill;
    case 'File':
      return FilePolyfill;
    case 'FileReader':
      return FileReaderPolyfill;
    case 'URL':
      return URLPolyfill;
    case 'document':
      return DocumentPolyfill;
    case 'window':
      return WindowPolyfill;
  }
} 