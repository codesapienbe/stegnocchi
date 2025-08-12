import { cryptoRateLimiter } from './rateLimiter';
import { logInfo, logError, Component } from './logger';

export type KdfAlgorithm = 'argon2id' | 'scrypt';

export interface KdfParams {
  algorithm: KdfAlgorithm;
  password: string;
  salt: Uint8Array;
  // Argon2 params
  timeCost?: number; // iterations
  memoryCostKB?: number; // memory in KiB
  parallelism?: number; // lanes
  outputLength?: number; // bytes
  // scrypt params
  N?: number;
  r?: number;
  p?: number;
}

export async function deriveKeyKdf(params: KdfParams): Promise<Uint8Array> {
  const rate = cryptoRateLimiter.checkLimit('kdf');
  if (!rate.allowed) throw new Error(`Rate limit exceeded. Retry in ${Math.ceil((rate.retryAfter || 0) / 1000)}s`);

  const start = Date.now();
  try {
    if (params.algorithm === 'argon2id') {
      const mod: any = await import('@node-rs/argon2');
      const timeCost = params.timeCost ?? 3;
      const memoryCostKB = params.memoryCostKB ?? 64 * 1024; // 64 MiB
      const parallelism = params.parallelism ?? 1;
      const outputLength = params.outputLength ?? 32;
      const hash = await mod.hashRaw(params.password, params.salt, {
        algorithm: mod.Algorithm.Argon2id,
        version: 0x13,
        timeCost,
        memoryCost: memoryCostKB,
        parallelism,
        outputLen: outputLength,
      });
      logInfo(Component.CRYPTO, 'Derived key with Argon2id', { timeMs: Date.now() - start, memoryCostKB, parallelism });
      return new Uint8Array(hash);
    } else {
      const mod: any = await import('scrypt-js');
      const N = params.N ?? 2 ** 15;
      const r = params.r ?? 8;
      const p = params.p ?? 1;
      const outputLength = params.outputLength ?? 32;
      const passwordBytes = new TextEncoder().encode(params.password);
      const out = await mod.scrypt(passwordBytes, params.salt, N, r, p, outputLength);
      logInfo(Component.CRYPTO, 'Derived key with scrypt', { timeMs: Date.now() - start, N, r, p });
      return new Uint8Array(out);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'KDF derivation failed';
    logError(Component.CRYPTO, 'KDF derivation exception', { error: message });
    throw new Error(message);
  }
} 