import { getSecurityConfig, generateSalt, generateIV, clearSensitiveData } from './crypto';
import { logError, logInfo, Component } from './logger';

export interface ChunkedEncryptionOptions {
  chunkSizeBytes?: number;
  onProgress?: (progress0to1: number) => void;
  aadPrefix?: string; // optional additional authenticated data prefix
}

export interface ChunkedManifest {
  version: string;
  algorithm: 'AES-256-GCM';
  keyDerivation: 'PBKDF2';
  iterations: number;
  keySize: number;
  salt: string; // base64
  totalChunks: number;
  chunkSizeBytes: number;
  createdAt: string; // ISO
}

export interface ChunkedEncryptionResult {
  success: boolean;
  chunks?: string[]; // base64 ciphertext (includes GCM tag)
  manifest?: ChunkedManifest;
  error?: string;
}

export interface ChunkedDecryptionResult {
  success: boolean;
  data?: Uint8Array;
  error?: string;
}

function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

async function deriveKey(password: string, saltBase64: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = base64ToBytes(saltBase64);
  const config = getSecurityConfig();

  const key = await crypto.subtle.importKey('raw', passwordBuffer, { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: config.encryptionIterations,
      hash: 'SHA-256',
    },
    key,
    { name: 'AES-GCM', length: config.keySize },
    false,
    ['encrypt', 'decrypt']
  );
}

function getAAD(prefix: string | undefined, index: number, total: number): Uint8Array {
  const aadString = `${prefix || 'CHUNK'}|${index}|${total}`;
  return stringToBytes(aadString);
}

function chunkUint8Array(input: Uint8Array, size: number): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < input.length; i += size) {
    chunks.push(input.subarray(i, Math.min(i + size, input.length)));
  }
  return chunks;
}

export async function encryptChunked(
  data: Uint8Array,
  password: string,
  options?: ChunkedEncryptionOptions
): Promise<ChunkedEncryptionResult> {
  try {
    if (!(data instanceof Uint8Array)) {
      return { success: false, error: 'Input must be a Uint8Array' };
    }
    if (!password || typeof password !== 'string') {
      return { success: false, error: 'Password is required' };
    }

    const config = getSecurityConfig();
    const chunkSize = Math.max(16 * 1024, options?.chunkSizeBytes || 48 * 1024);
    const salt = generateSalt();
    const key = await deriveKey(password, salt);

    const parts = chunkUint8Array(data, chunkSize);
    const totalChunks = parts.length;
    const chunksBase64: string[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const ivBase64 = generateIV();
      const iv = base64ToBytes(ivBase64);
      const aad = getAAD(options?.aadPrefix, i, totalChunks);

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, additionalData: aad },
        key,
        parts[i]
      );

      const outBase64 = bytesToBase64(new Uint8Array(encrypted));
      chunksBase64.push(`${ivBase64}.${outBase64}`); // prefix IV for each chunk

      if (options?.onProgress) {
        options.onProgress((i + 1) / totalChunks);
      }
    }

    clearSensitiveData(password);

    const manifest: ChunkedManifest = {
      version: '1.0',
      algorithm: 'AES-256-GCM',
      keyDerivation: 'PBKDF2',
      iterations: config.encryptionIterations,
      keySize: config.keySize,
      salt,
      totalChunks,
      chunkSizeBytes: chunkSize,
      createdAt: new Date().toISOString(),
    };

    logInfo(Component.CRYPTO, 'Chunked encryption completed', {
      totalChunks,
      chunkSizeBytes: chunkSize,
      totalBytes: data.byteLength,
    });

    return { success: true, chunks: chunksBase64, manifest };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chunked encryption failed';
    logError(Component.CRYPTO, 'Chunked encryption exception', { error: message });
    return { success: false, error: message };
  }
}

export async function decryptChunked(
  chunksBase64: string[],
  manifest: ChunkedManifest,
  password: string,
  options?: { onProgress?: (progress0to1: number) => void; aadPrefix?: string }
): Promise<ChunkedDecryptionResult> {
  try {
    if (!Array.isArray(chunksBase64) || chunksBase64.length === 0) {
      return { success: false, error: 'No chunks provided' };
    }
    if (!manifest || manifest.algorithm !== 'AES-256-GCM' || manifest.keyDerivation !== 'PBKDF2') {
      return { success: false, error: 'Invalid manifest' };
    }
    if (manifest.totalChunks !== chunksBase64.length) {
      return { success: false, error: 'Manifest does not match chunks length' };
    }

    const key = await deriveKey(password, manifest.salt);
    const outputs: Uint8Array[] = [];

    for (let i = 0; i < chunksBase64.length; i++) {
      const [ivBase64, cipherBase64] = chunksBase64[i].split('.', 2);
      if (!ivBase64 || !cipherBase64) {
        return { success: false, error: `Chunk ${i} format invalid` };
      }
      const iv = base64ToBytes(ivBase64);
      const cipher = base64ToBytes(cipherBase64);
      const aad = getAAD(options?.aadPrefix, i, chunksBase64.length);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, additionalData: aad },
        key,
        cipher
      );
      outputs.push(new Uint8Array(decrypted));

      if (options?.onProgress) {
        options.onProgress((i + 1) / chunksBase64.length);
      }
    }

    clearSensitiveData(password);

    const totalLength = outputs.reduce((acc, u8) => acc + u8.byteLength, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of outputs) {
      result.set(part, offset);
      offset += part.byteLength;
    }

    logInfo(Component.CRYPTO, 'Chunked decryption completed', {
      totalChunks: chunksBase64.length,
      outputBytes: totalLength,
    });

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chunked decryption failed';
    logError(Component.CRYPTO, 'Chunked decryption exception', { error: message });
    return { success: false, error: message };
  }
} 