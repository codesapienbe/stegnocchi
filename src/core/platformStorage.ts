import { logInfo, logWarn, logError, Component } from './logger';

export interface WriteResult {
  uri: string;
}

export interface PlatformFileSystem {
  getCacheDir(): Promise<string>;
  getDocumentDir(): Promise<string>;
  exists(path: string): Promise<boolean>;
  writeBytes(path: string, data: Uint8Array): Promise<WriteResult>;
  readBytes(path: string): Promise<Uint8Array | null>;
  delete(path: string): Promise<boolean>;
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    // Node/metro polyfill
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk) as any);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importExpoFileSystem(): Promise<any | null> {
  try {
    // Dynamic import to avoid hard dependency in non-expo environments
    const fs = await import('expo-file-system');
    return fs?.default ?? fs;
  } catch (e) {
    logWarn(Component.FILE_SYSTEM, 'expo-file-system not available; using fallback storage', {
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

function joinUri(dir: string | null | undefined, path: string): string {
  const base = (dir || '').endsWith('/') ? (dir || '') : `${dir || ''}/`;
  if (path.startsWith('file://')) return path;
  return `${base}${path.replace(/^\/+/, '')}`;
}

export async function getPlatformFileSystem(): Promise<PlatformFileSystem> {
  const FileSystem = await importExpoFileSystem();
  const isExpoFs = !!FileSystem && typeof FileSystem.writeAsStringAsync === 'function';

  if (isExpoFs) {
    const cacheDir: string = FileSystem.cacheDirectory || FileSystem.documentDirectory || 'file:///';
    const docDir: string = FileSystem.documentDirectory || FileSystem.cacheDirectory || 'file:///';

    const impl: PlatformFileSystem = {
      async getCacheDir(): Promise<string> { return cacheDir; },
      async getDocumentDir(): Promise<string> { return docDir; },
      async exists(path: string): Promise<boolean> {
        try {
          const uri = joinUri(cacheDir, path);
          const info = await FileSystem.getInfoAsync(uri);
          return !!info?.exists;
        } catch (e) {
          logWarn(Component.FILE_SYSTEM, 'exists() failed', { path, error: e instanceof Error ? e.message : String(e) });
          return false;
        }
      },
      async writeBytes(path: string, data: Uint8Array): Promise<WriteResult> {
        try {
          const uri = joinUri(cacheDir, path);
          const base64 = bytesToBase64(data);
          await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
          logInfo(Component.FILE_SYSTEM, 'File written', { path: uri, bytes: data.byteLength });
          return { uri };
        } catch (e) {
          logError(Component.FILE_SYSTEM, 'writeBytes() failed', { path, error: e instanceof Error ? e.message : String(e) });
          throw e;
        }
      },
      async readBytes(path: string): Promise<Uint8Array | null> {
        try {
          const uri = joinUri(cacheDir, path);
          const exists = await FileSystem.getInfoAsync(uri);
          if (!exists?.exists) return null;
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          const bytes = base64ToBytes(base64);
          logInfo(Component.FILE_SYSTEM, 'File read', { path: uri, bytes: bytes.byteLength });
          return bytes;
        } catch (e) {
          logError(Component.FILE_SYSTEM, 'readBytes() failed', { path, error: e instanceof Error ? e.message : String(e) });
          return null;
        }
      },
      async delete(path: string): Promise<boolean> {
        try {
          const uri = joinUri(cacheDir, path);
          await FileSystem.deleteAsync(uri, { idempotent: true });
          logInfo(Component.FILE_SYSTEM, 'File deleted', { path: uri });
          return true;
        } catch (e) {
          logWarn(Component.FILE_SYSTEM, 'delete() failed', { path, error: e instanceof Error ? e.message : String(e) });
          return false;
        }
      },
    };
    return impl;
  }

  // Fallback implementation using localStorage (web-only scenario)
  const STORAGE_PREFIX = 'ps://';
  const hasLocalStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

  const impl: PlatformFileSystem = {
    async getCacheDir(): Promise<string> { return STORAGE_PREFIX; },
    async getDocumentDir(): Promise<string> { return STORAGE_PREFIX; },
    async exists(path: string): Promise<boolean> {
      if (!hasLocalStorage) return false;
      const key = STORAGE_PREFIX + path;
      return window.localStorage.getItem(key) != null;
    },
    async writeBytes(path: string, data: Uint8Array): Promise<WriteResult> {
      if (!hasLocalStorage) throw new Error('No storage backend available');
      const key = STORAGE_PREFIX + path;
      const base64 = bytesToBase64(data);
      window.localStorage.setItem(key, base64);
      logInfo(Component.FILE_SYSTEM, 'File written (fallback storage)', { path: key, bytes: data.byteLength });
      return { uri: key };
    },
    async readBytes(path: string): Promise<Uint8Array | null> {
      if (!hasLocalStorage) return null;
      const key = STORAGE_PREFIX + path;
      const base64 = window.localStorage.getItem(key);
      if (!base64) return null;
      const bytes = base64ToBytes(base64);
      logInfo(Component.FILE_SYSTEM, 'File read (fallback storage)', { path: key, bytes: bytes.byteLength });
      return bytes;
    },
    async delete(path: string): Promise<boolean> {
      if (!hasLocalStorage) return false;
      const key = STORAGE_PREFIX + path;
      window.localStorage.removeItem(key);
      logInfo(Component.FILE_SYSTEM, 'File deleted (fallback storage)', { path: key });
      return true;
    },
  };
  return impl;
} 