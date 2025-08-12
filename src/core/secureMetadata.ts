import { secureStorage } from './secureStorage';
import { logInfo, logError, Component } from './logger';
import { VectorMetadata, serializeVectorMetadata } from './vectorMetadata';
import { encryptVectorMetadata, decryptVectorMetadata, VectorEncryptionResult } from './vectorMetadata';

export interface SecureMetadataRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  storage: 'single' | 'chunked';
}

export type StoreResult = { success: true; id: string } | { success: false; error: string };

const KEY_PREFIX = 'vecmeta:';

export async function storeEncryptedVectorMetadata(
  id: string,
  metadata: VectorMetadata,
  password: string,
  options?: { compress?: boolean }
): Promise<StoreResult> {
  try {
    const enc = await encryptVectorMetadata(metadata, password, { compress: options?.compress === true });
    if (!enc.success) return { success: false, error: (enc as any).error || 'Encryption failed' };

    const record: any = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      storage: enc.mode,
    } as SecureMetadataRecord;

    const payload = JSON.stringify({ record, data: enc });
    const res = await secureStorage.setItem(KEY_PREFIX + id, payload);
    if (!res.success) return { success: false, error: res.error || 'Storage failed' };

    logInfo(Component.CRYPTO, 'Stored encrypted vector metadata', { id, mode: enc.mode });
    return { success: true, id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Store error';
    logError(Component.CRYPTO, 'Secure vector metadata store exception', { error: message });
    return { success: false, error: message };
  }
}

export async function loadEncryptedVectorMetadata(
  id: string,
  password: string
): Promise<ReturnType<typeof decryptVectorMetadata>> {
  try {
    const res = await secureStorage.getItem(KEY_PREFIX + id);
    if (!res.success || !res.data) {
      return { success: false, errors: ['Not found'] } as any;
    }
    const parsed = JSON.parse(res.data);
    const enc: VectorEncryptionResult = parsed.data;

    if (enc.success !== true) {
      return { success: false, errors: ['Corrupted record'] } as any;
    }

    if (enc.mode === 'single') {
      return decryptVectorMetadata({ mode: 'single', ciphertextBase64: enc.ciphertextBase64, cryptoMetadata: enc.cryptoMetadata, isCompressed: enc.isCompressed }, password);
    } else {
      return decryptVectorMetadata({ mode: 'chunked', chunksBase64: enc.chunksBase64, manifest: enc.manifest, isCompressed: enc.isCompressed }, password);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Load error';
    logError(Component.CRYPTO, 'Secure vector metadata load exception', { error: message });
    return { success: false, errors: [message] } as any;
  }
} 