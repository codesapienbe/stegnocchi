import { logInfo, logWarn, logError, Component } from './logger';

export interface EncryptionOutput {
  ciphertext: Uint8Array;
  metadata: Record<string, any>;
}

export interface DecryptionOutput {
  plaintext: Uint8Array;
}

export interface CryptoAlgorithmPlugin {
  name: string;
  encrypt(input: Uint8Array, password: string, options?: Record<string, any>): Promise<EncryptionOutput>;
  decrypt(ciphertext: Uint8Array, password: string, metadata: Record<string, any>): Promise<DecryptionOutput>;
}

class CryptoPluginRegistry {
  private readonly plugins: Map<string, CryptoAlgorithmPlugin> = new Map();

  register(plugin: CryptoAlgorithmPlugin): void {
    if (!plugin || !plugin.name) {
      throw new Error('Invalid crypto plugin');
    }
    this.plugins.set(plugin.name, plugin);
    logInfo(Component.APP, 'Registered crypto plugin', { plugin: plugin.name });
  }

  unregister(name: string): boolean {
    const existed = this.plugins.delete(name);
    if (existed) logInfo(Component.APP, 'Unregistered crypto plugin', { plugin: name });
    return existed;
  }

  get(name: string): CryptoAlgorithmPlugin | undefined {
    return this.plugins.get(name);
  }

  list(): string[] {
    return Array.from(this.plugins.keys());
  }
}

export const cryptoPlugins = new CryptoPluginRegistry();

// Utility helpers (scoped to this module)
function b64ToBytes(base64: string): Uint8Array {
  const binaryString = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

function bytesToB64(bytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  return Buffer.from(bytes).toString('base64');
}

function randomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(out);
  } else {
    for (let i = 0; i < out.length; i++) out[i] = Math.floor(Math.random() * 256);
  }
  return out;
}

async function importPasswordKey(password: string): Promise<CryptoKey> {
  const pwBytes = new TextEncoder().encode(password);
  return crypto.subtle.importKey('raw', pwBytes, 'PBKDF2', false, ['deriveBits', 'deriveKey']);
}

async function deriveAesGcmKey(password: string, saltB64: string, iterations: number, keySizeBits: number): Promise<CryptoKey> {
  const baseKey = await importPasswordKey(password);
  const salt = b64ToBytes(saltB64);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: keySizeBits },
    false,
    ['encrypt', 'decrypt']
  );
}

export function registerDefaultCryptoPlugins(options?: { iterations?: number; keySizeBits?: number }): void {
  const iterations = options?.iterations ?? 100_000;
  const keySizeBits = options?.keySizeBits ?? 256;

  const aesGcm: CryptoAlgorithmPlugin = {
    name: 'aes-256-gcm',
    async encrypt(input: Uint8Array, password: string, encOptions?: Record<string, any>): Promise<EncryptionOutput> {
      try {
        const salt = bytesToB64(randomBytes(16));
        const iv = bytesToB64(randomBytes(12));
        const key = await deriveAesGcmKey(password, salt, iterations, keySizeBits);
        const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: b64ToBytes(iv) }, key, input);
        const ciphertext = new Uint8Array(cipherBuf);
        const metadata = {
          algorithm: 'AES-256-GCM',
          keySize: keySizeBits,
          iterations,
          salt,
          iv,
          timestamp: Date.now(),
          mode: encOptions?.mode || 'default',
          version: '1.0',
        };
        logInfo(Component.APP, 'AES-GCM encryption complete', { bytes: input.byteLength });
        return { ciphertext, metadata };
      } catch (e) {
        logError(Component.APP, 'AES-GCM encryption failed', { error: e instanceof Error ? e.message : String(e) });
        throw e;
      }
    },
    async decrypt(ciphertext: Uint8Array, password: string, metadata: Record<string, any>): Promise<DecryptionOutput> {
      try {
        const salt: string = metadata?.salt;
        const iv: string = metadata?.iv;
        if (!salt || !iv) {
          throw new Error('Missing salt/iv in metadata');
        }
        const key = await deriveAesGcmKey(password, salt, iterations, keySizeBits);
        const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(iv) }, key, ciphertext);
        logInfo(Component.APP, 'AES-GCM decryption complete', { bytes: ciphertext.byteLength });
        return { plaintext: new Uint8Array(plainBuf) };
      } catch (e) {
        logError(Component.APP, 'AES-GCM decryption failed', { error: e instanceof Error ? e.message : String(e) });
        throw e;
      }
    },
  };

  // Idempotent register: overwrite to ensure defaults up-to-date
  cryptoPlugins.register(aesGcm);
}

export async function encryptWithPlugin(algorithm: string, input: Uint8Array, password: string, options?: Record<string, any>): Promise<EncryptionOutput> {
  const plugin = cryptoPlugins.get(algorithm);
  if (!plugin) {
    logWarn(Component.APP, 'Requested crypto plugin not found', { algorithm });
    throw new Error(`Crypto plugin not found: ${algorithm}`);
  }
  return plugin.encrypt(input, password, options);
}

export async function decryptWithPlugin(algorithm: string, ciphertext: Uint8Array, password: string, metadata: Record<string, any>): Promise<DecryptionOutput> {
  const plugin = cryptoPlugins.get(algorithm);
  if (!plugin) {
    logWarn(Component.APP, 'Requested crypto plugin not found', { algorithm });
    throw new Error(`Crypto plugin not found: ${algorithm}`);
  }
  return plugin.decrypt(ciphertext, password, metadata);
} 