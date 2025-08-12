import { logInfo, logWarn, Component } from './logger';

export interface AppConfigSchema {
  apiBaseUrl: string;
  enableTelemetry: boolean;
  maxUploadMb: number;
  // Secrets
  apiKey?: string; // masked in logs
  authToken?: string; // masked in logs
}

const DEFAULT_CONFIG: AppConfigSchema = {
  apiBaseUrl: '',
  enableTelemetry: false,
  maxUploadMb: 10,
};

let currentConfig: AppConfigSchema = { ...DEFAULT_CONFIG };

function isNonEmptyString(v: any): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export function validateConfig(cfg: Partial<AppConfigSchema>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (cfg.apiBaseUrl !== undefined && !isNonEmptyString(cfg.apiBaseUrl)) errors.push('apiBaseUrl must be a non-empty string');
  if (cfg.enableTelemetry !== undefined && typeof cfg.enableTelemetry !== 'boolean') errors.push('enableTelemetry must be boolean');
  if (cfg.maxUploadMb !== undefined && (typeof cfg.maxUploadMb !== 'number' || cfg.maxUploadMb <= 0)) errors.push('maxUploadMb must be positive number');
  if (cfg.apiKey !== undefined && !isNonEmptyString(cfg.apiKey)) errors.push('apiKey must be non-empty string when provided');
  if (cfg.authToken !== undefined && !isNonEmptyString(cfg.authToken)) errors.push('authToken must be non-empty string when provided');
  return { valid: errors.length === 0, errors };
}

function maskSecrets(cfg: Partial<AppConfigSchema>): Record<string, any> {
  const masked: Record<string, any> = { ...cfg };
  if (masked.apiKey) masked.apiKey = '***';
  if (masked.authToken) masked.authToken = '***';
  return masked;
}

export function loadConfig(cfg: Partial<AppConfigSchema>): { success: boolean; errors?: string[] } {
  const { valid, errors } = validateConfig(cfg);
  if (!valid) {
    logWarn(Component.APP, 'Config validation failed', { errors });
    return { success: false, errors };
  }
  currentConfig = { ...currentConfig, ...cfg } as AppConfigSchema;
  logInfo(Component.APP, 'Configuration loaded', { config: maskSecrets(currentConfig) });
  return { success: true };
}

export function getConfig(): AppConfigSchema {
  return { ...currentConfig };
}

export function resetConfig(): void {
  currentConfig = { ...DEFAULT_CONFIG };
  logInfo(Component.APP, 'Configuration reset to defaults', { config: maskSecrets(currentConfig) });
} 