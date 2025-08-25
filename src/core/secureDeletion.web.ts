import { logInfo, logWarn, logError, Component } from './logger';

export function purgeMemoryBuffer(buffer: ArrayBuffer | Uint8Array): void {
  try {
    const view = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    view.fill(0);
  } catch {}
}

export async function overwriteAndDeleteFile(fileUri: string, passes: number = 2): Promise<boolean> {
  try {
    // On web we cannot overwrite arbitrary URIs; best-effort cleanup
    if (typeof URL !== 'undefined' && fileUri.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(fileUri);
        logInfo(Component.FILE_SYSTEM, 'Revoked blob URL on web during delete', { fileUri });
      } catch (e) {
        logWarn(Component.FILE_SYSTEM, 'Failed to revoke blob URL during delete', { fileUri, error: e instanceof Error ? e.message : String(e) });
      }
    }
    // If localStorage was used as pseudo storage, remove key
    if (typeof window !== 'undefined' && fileUri.startsWith('ps://')) {
      try {
        window.localStorage.removeItem(fileUri);
        logInfo(Component.FILE_SYSTEM, 'Removed pseudo storage key on web', { fileUri });
      } catch (e) {
        logWarn(Component.FILE_SYSTEM, 'Failed to remove pseudo storage key on web', { fileUri, error: e instanceof Error ? e.message : String(e) });
      }
    }
    logWarn(Component.FILE_SYSTEM, 'Secure overwrite not supported on web; performed best-effort cleanup', { fileUri, passes });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Secure deletion failed (web)';
    logError(Component.FILE_SYSTEM, 'Secure deletion exception (web)', { fileUri, error: message });
    return false;
  }
}

export function secureRevokeObjectUrl(url: string): void {
  try {
    if (typeof URL !== 'undefined') {
      URL.revokeObjectURL(url);
      logInfo(Component.FILE_SYSTEM, 'Revoked object URL (web)', { url });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Revoke object URL failed (web)';
    logError(Component.FILE_SYSTEM, 'Revoke object URL exception (web)', { url, error: message });
  }
} 