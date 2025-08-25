import { logInfo, logWarn, logError, Component } from '@/core/logger';

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
    
    // Web cannot perform file overwrite; return true to indicate best-effort completion
    return true;
  } catch (error) {
    logError(Component.FILE_SYSTEM, 'Web secure deletion failed', {
      fileUri,
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

export async function secureDeleteDirectory(dirPath: string, recursive: boolean = true): Promise<boolean> {
  try {
    logWarn(Component.FILE_SYSTEM, 'Web cannot securely delete directories', { dirPath, recursive });
    // Web cannot delete arbitrary directories; return true as no-op
    return true;
  } catch (error) {
    logError(Component.FILE_SYSTEM, 'Web directory deletion failed', {
      dirPath,
      recursive,
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

export function secureClearString(str: string): void {
  // Web cannot securely clear strings from memory; this is a no-op
  logWarn(Component.CRYPTO, 'Web cannot securely clear strings from memory');
}

export async function getSecureDeletionCapabilities(): Promise<{
  canOverwriteFiles: boolean;
  canDeleteDirectories: boolean;
  canClearMemory: boolean;
}> {
  return {
    canOverwriteFiles: false, // Web cannot overwrite files
    canDeleteDirectories: false, // Web cannot delete directories
    canClearMemory: false // Web cannot securely clear memory
  };
} 