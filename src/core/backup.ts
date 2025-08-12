import { logInfo, logWarn, logError, Component } from './logger';
import { secureStorage } from './secureStorage';
import { VectorMetadata } from './vectorMetadata';
import { encryptVectorMetadata, decryptVectorMetadata, VectorEncryptionResult } from './vectorMetadata';

const BACKUP_INDEX_KEY = 'backup:index';

export interface BackupEntry {
  id: string;
  type: 'vector';
  createdAt: string;
}

export interface BackupResult {
  success: boolean;
  error?: string;
}

async function loadIndex(): Promise<BackupEntry[]> {
  const res = await secureStorage.getItem(BACKUP_INDEX_KEY);
  if (!res.success || !res.data) return [];
  try {
    const parsed = JSON.parse(res.data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveIndex(entries: BackupEntry[]): Promise<void> {
  await secureStorage.setItem(BACKUP_INDEX_KEY, JSON.stringify(entries));
}

export async function backupVectorMetadata(
  id: string,
  metadata: VectorMetadata,
  password: string,
  options?: { compress?: boolean }
): Promise<BackupResult> {
  try {
    const enc = await encryptVectorMetadata(metadata, password, { compress: options?.compress ?? true });
    if (!enc.success) return { success: false, error: (enc as any).error || 'Encryption failed' };

    const payload = JSON.stringify({ t: 'vector', v: enc });
    const key = `backup:vector:${id}`;
    const write = await secureStorage.setItem(key, payload);
    if (!write.success) return { success: false, error: write.error || 'Storage failed' };

    const index = await loadIndex();
    const exists = index.find((e) => e.id === id && e.type === 'vector');
    if (!exists) {
      index.push({ id, type: 'vector', createdAt: new Date().toISOString() });
      await saveIndex(index);
    }

    logInfo(Component.APP, 'Vector metadata backup saved', { id });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Backup failed';
    logError(Component.APP, 'Vector backup exception', { id, error: message });
    return { success: false, error: message };
  }
}

export async function restoreVectorMetadataBackup(
  id: string,
  password: string
): Promise<{ success: boolean; data?: VectorMetadata; error?: string }> {
  try {
    const key = `backup:vector:${id}`;
    const res = await secureStorage.getItem(key);
    if (!res.success || !res.data) {
      return { success: false, error: 'Backup not found' };
    }
    const parsed = JSON.parse(res.data);
    const enc: VectorEncryptionResult = parsed.v;

    let out;
    if (enc.mode === 'single') {
      out = await decryptVectorMetadata({ mode: 'single', ciphertextBase64: enc.ciphertextBase64, cryptoMetadata: enc.cryptoMetadata, isCompressed: enc.isCompressed }, password);
    } else {
      out = await decryptVectorMetadata({ mode: 'chunked', chunksBase64: enc.chunksBase64, manifest: enc.manifest, isCompressed: enc.isCompressed }, password);
    }

    if (!out.success || !out.data) {
      const err = (out as any).errors?.join('; ') || 'Decrypt failed';
      logWarn(Component.APP, 'Vector metadata restore failed', { id, error: err });
      return { success: false, error: err };
    }

    logInfo(Component.APP, 'Vector metadata backup restored', { id });
    return { success: true, data: out.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Restore failed';
    logError(Component.APP, 'Vector restore exception', { id, error: message });
    return { success: false, error: message };
  }
}

export async function listBackups(): Promise<BackupEntry[]> {
  const index = await loadIndex();
  return index.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteBackup(id: string): Promise<BackupResult> {
  try {
    const key = `backup:vector:${id}`;
    await secureStorage.removeItem(key);
    const index = await loadIndex();
    const next = index.filter((e) => e.id !== id);
    await saveIndex(next);
    logInfo(Component.APP, 'Backup deleted', { id });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed';
    logError(Component.APP, 'Backup deletion exception', { id, error: message });
    return { success: false, error: message };
  }
}

export async function clearAllBackups(): Promise<BackupResult> {
  try {
    const index = await loadIndex();
    for (const e of index) {
      await secureStorage.removeItem(`backup:vector:${e.id}`);
    }
    await saveIndex([]);
    logInfo(Component.APP, 'All backups cleared', {});
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Clear backups failed';
    logError(Component.APP, 'Backup clear exception', { error: message });
    return { success: false, error: message };
  }
} 