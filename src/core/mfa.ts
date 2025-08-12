import { logInfo, logWarn, logError, Component } from './logger';
import { recordAuditEvent } from './auditLog';
import { secureStorage } from './secureStorage';
import { cryptoRateLimiter } from './rateLimiter';

export interface TotpOptions {
  period?: number; // seconds
  digits?: number; // 6-8
  algorithm?: 'SHA-1' | 'SHA-256' | 'SHA-512';
}

export interface EnrollResult {
  userId: string;
  secretBase32: string;
  otpauthUrl: string;
  backupCodes: string[];
}

const DEFAULT_TOTP: Required<TotpOptions> = { period: 30, digits: 6, algorithm: 'SHA-1' };
const MFA_STORAGE_PREFIX = 'mfa:'; // keys: mfa:<userId>:secret, mfa:<userId>:backup

function clampDigits(d: number | undefined): number {
  if (!d) return 6;
  return Math.max(6, Math.min(8, Math.floor(d)));
}

function randomBytes(len: number): Uint8Array {
  const a = new Uint8Array(len);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(a);
  else for (let i = 0; i < len; i++) a[i] = Math.floor(Math.random() * 256);
  return a;
}

// Crockford-like Base32 alphabet
const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function bytesToBase32(bytes: Uint8Array): string {
  let out = '';
  let bits = 0;
  let value = 0;
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 31];
  // No padding to keep simpler QR payloads
  return out;
}

function base32ToBytes(b32: string): Uint8Array {
  const clean = b32.replace(/=+$/g, '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = B32_ALPHABET.indexOf(clean[i]);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

function uintToBytesBE(value: number): Uint8Array {
  const bytes = new Uint8Array(8);
  let v = Math.floor(value);
  for (let i = 7; i >= 0; i--) {
    bytes[i] = v & 0xff;
    v = Math.floor(v / 256);
  }
  return bytes;
}

async function hmac(algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512', key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: { name: algorithm } }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, data);
  return new Uint8Array(sig as ArrayBuffer);
}

export function buildOtpAuthUrl(label: string, secretBase32: string, issuer?: string, options?: TotpOptions): string {
  const o = { ...DEFAULT_TOTP, ...(options || {}) };
  const params = new URLSearchParams({ secret: secretBase32, period: String(o.period), digits: String(o.digits), algorithm: o.algorithm });
  if (issuer) params.set('issuer', issuer);
  const encLabel = encodeURIComponent(label);
  return `otpauth://totp/${encLabel}?${params.toString()}`;
}

export async function generateTotp(secretBase32: string, options?: TotpOptions, timestampMs?: number): Promise<string> {
  const o = { ...DEFAULT_TOTP, ...(options || {}) };
  const secret = base32ToBytes(secretBase32);
  const time = Math.floor((timestampMs ?? Date.now()) / 1000);
  const counter = Math.floor(time / o.period);
  const msg = uintToBytesBE(counter);
  const mac = await hmac(o.algorithm, secret, msg);
  const offset = mac[mac.length - 1] & 0x0f;
  const binCode = ((mac[offset] & 0x7f) << 24) | ((mac[offset + 1] & 0xff) << 16) | ((mac[offset + 2] & 0xff) << 8) | (mac[offset + 3] & 0xff);
  const mod = 10 ** clampDigits(o.digits);
  const code = (binCode % mod).toString().padStart(clampDigits(o.digits), '0');
  return code;
}

export async function verifyTotp(secretBase32: string, code: string, options?: TotpOptions, windowSkewSteps: number = 1): Promise<boolean> {
  const o = { ...DEFAULT_TOTP, ...(options || {}) };
  const now = Date.now();
  const stepMs = o.period * 1000;
  const codesToCheck: string[] = [];
  for (let i = -windowSkewSteps; i <= windowSkewSteps; i++) {
    const t = now + i * stepMs;
    codesToCheck.push(await generateTotp(secretBase32, o, t));
  }
  return codesToCheck.includes(code.trim());
}

function mask(str: string, visible: number = 4): string {
  if (!str) return '';
  const v = Math.max(0, visible);
  if (str.length <= v) return str.replace(/./g, '*');
  return '*'.repeat(str.length - v) + str.slice(-v);
}

function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(5);
    const value = Array.from(bytes).reduce((acc, b) => (acc * 256 + b) >>> 0, 0);
    codes.push((value % 1_000_00000).toString().padStart(8, '0'));
  }
  return codes;
}

export async function enrollMfaTotp(userId: string, issuer: string = 'Stegnocchi', options?: TotpOptions): Promise<EnrollResult> {
  const secret = bytesToBase32(randomBytes(20));
  const backupCodes = generateBackupCodes(8);
  const otpauthUrl = buildOtpAuthUrl(`${issuer}:${userId}`, secret, issuer, options);
  await secureStorage.setItem(`${MFA_STORAGE_PREFIX}${userId}:secret`, JSON.stringify({ secret, options: { ...DEFAULT_TOTP, ...(options || {}) } }));
  await secureStorage.setItem(`${MFA_STORAGE_PREFIX}${userId}:backup`, JSON.stringify({ codes: backupCodes }));
  logInfo(Component.APP, 'MFA TOTP enrolled', { userId, secret: mask(secret) });
  recordAuditEvent({ type: 'mfa_enrolled', actor: userId, severity: 'INFO', details: { method: 'totp' } });
  return { userId, secretBase32: secret, otpauthUrl, backupCodes };
}

export async function isMfaEnrolled(userId: string): Promise<boolean> {
  const res = await secureStorage.getItem(`${MFA_STORAGE_PREFIX}${userId}:secret`);
  return !!res.success && !!res.value;
}

export async function verifyMfa(userId: string, code: string): Promise<{ success: boolean; method?: 'totp' | 'backup'; error?: string }> {
  const rate = cryptoRateLimiter.checkLimit('mfa-verify');
  if (!rate.allowed) return { success: false, error: `Rate limit exceeded. Retry in ${Math.ceil((rate.retryAfter || 0) / 1000)}s` };

  const secretRes = await secureStorage.getItem(`${MFA_STORAGE_PREFIX}${userId}:secret`);
  if (!secretRes.success || !secretRes.value) return { success: false, error: 'MFA not enrolled' };
  const parsed = JSON.parse(secretRes.value);
  const secret = parsed.secret as string;
  const options = parsed.options as TotpOptions | undefined;

  try {
    const ok = await verifyTotp(secret, code, options);
    if (ok) {
      logInfo(Component.APP, 'MFA TOTP verified', { userId });
      recordAuditEvent({ type: 'mfa_verified', actor: userId, severity: 'INFO', details: { method: 'totp' } });
      return { success: true, method: 'totp' };
    }
  } catch (e) {
    logWarn(Component.APP, 'MFA TOTP verification error', { userId, error: e instanceof Error ? e.message : String(e) });
  }

  // fallback to backup codes
  const backupRes = await secureStorage.getItem(`${MFA_STORAGE_PREFIX}${userId}:backup`);
  if (backupRes.success && backupRes.value) {
    try {
      const parsedBackup = JSON.parse(backupRes.value) as { codes: string[] };
      const idx = parsedBackup.codes.findIndex((c) => c === code);
      if (idx >= 0) {
        parsedBackup.codes.splice(idx, 1); // one-time use
        await secureStorage.setItem(`${MFA_STORAGE_PREFIX}${userId}:backup`, JSON.stringify(parsedBackup));
        logInfo(Component.APP, 'MFA backup code used', { userId });
        recordAuditEvent({ type: 'mfa_backup_used', actor: userId, severity: 'WARN', details: {} });
        return { success: true, method: 'backup' };
      }
    } catch {}
  }

  logWarn(Component.APP, 'MFA verification failed', { userId });
  recordAuditEvent({ type: 'mfa_failed', actor: userId, severity: 'WARN', details: {} });
  return { success: false, error: 'Invalid MFA code' };
}

export async function disableMfa(userId: string): Promise<boolean> {
  await secureStorage.removeItem(`${MFA_STORAGE_PREFIX}${userId}:secret`);
  await secureStorage.removeItem(`${MFA_STORAGE_PREFIX}${userId}:backup`);
  logInfo(Component.APP, 'MFA disabled', { userId });
  recordAuditEvent({ type: 'mfa_disabled', actor: userId, severity: 'INFO', details: {} });
  return true;
}

export async function withMfa<T>(userId: string, code: string, action: () => Promise<T>): Promise<{ success: boolean; result?: T; error?: string }> {
  const verified = await verifyMfa(userId, code);
  if (!verified.success) return { success: false, error: verified.error || 'MFA verification failed' };
  try {
    const result = await action();
    return { success: true, result };
  } catch (e) {
    logError(Component.APP, 'MFA-guarded action failed', { userId, error: e instanceof Error ? e.message : String(e) });
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
} 