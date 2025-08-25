import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { logInfo, logWarn, logError, Component } from './logger';

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < (bytes.byteLength ?? bytes.length); i++) binary += String.fromCharCode(bytes[i]);
  // @ts-ignore atob/btoa available on supported targets
  return btoa(binary);
}

function randomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(out);
  } else {
    for (let i = 0; i < length; i++) out[i] = Math.floor(Math.random() * 256);
  }
  return out;
}

export function purgeMemoryBuffer(buffer: ArrayBuffer | Uint8Array): void {
  try {
    const view = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    view.fill(0);
  } catch {
    // no-op
  }
}

export async function overwriteAndDeleteFile(fileUri: string, passes: number = 2): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      logWarn(Component.FILE_SYSTEM, 'Secure file overwrite not supported on web; deleting reference only', { fileUri });
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      return true;
    }
    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists || (info.size ?? 0) === 0) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      logInfo(Component.FILE_SYSTEM, 'File not found; ensured deletion', { fileUri });
      return true;
    }

    const size = info.size;
    for (let i = 0; i < Math.max(1, passes); i++) {
      const chunk = randomBytes(size);
      const base64 = toBase64(chunk);
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      purgeMemoryBuffer(chunk);
    }

    await FileSystem.deleteAsync(fileUri, { idempotent: true });
    logInfo(Component.FILE_SYSTEM, 'Securely overwrote and deleted file', { fileUri, passes, size });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Secure deletion failed';
    logError(Component.FILE_SYSTEM, 'Secure deletion exception', { fileUri, error: message });
    return false;
  }
}

export function secureRevokeObjectUrl(url: string): void {
  try {
    if (Platform.OS === 'web' && typeof URL !== 'undefined') {
      URL.revokeObjectURL(url);
      logInfo(Component.FILE_SYSTEM, 'Revoked object URL', { url });
    } else {
      logWarn(Component.FILE_SYSTEM, 'Attempted to revoke object URL on non-web platform', { url });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Revoke object URL failed';
    logError(Component.FILE_SYSTEM, 'Revoke object URL exception', { url, error: message });
  }
} 