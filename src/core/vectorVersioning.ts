import { logInfo, logWarn, Component } from './logger';

export const CURRENT_VECTOR_VERSION = '1.0.0';

export interface VectorVersionInfo {
  current: string;
  supported: string[];
}

export function getVectorVersionInfo(): VectorVersionInfo {
  const info: VectorVersionInfo = {
    current: CURRENT_VECTOR_VERSION,
    supported: [CURRENT_VECTOR_VERSION],
  };
  logInfo(Component.APP, 'Vector version info queried', { current: info.current, supportedCount: info.supported.length });
  return info;
}

export function isVectorVersionSupported(version: string): boolean {
  const supported = version === CURRENT_VECTOR_VERSION;
  if (!supported) {
    logWarn(Component.APP, 'Unsupported vector version encountered', { version, current: CURRENT_VECTOR_VERSION });
  }
  return supported;
}

export function migrateVectorMetadata<T extends Record<string, unknown>>(
  metadata: T,
  fromVersion?: string
): { metadata: T; migrated: boolean } {
  if (!fromVersion || fromVersion === CURRENT_VECTOR_VERSION) {
    return { metadata, migrated: false };
  }
  // No-op migration for now to preserve behavior; real rules can be added safely later
  logInfo(Component.APP, 'Vector metadata migration evaluated', { fromVersion, toVersion: CURRENT_VECTOR_VERSION, action: 'noop' });
  return { metadata, migrated: false };
} 