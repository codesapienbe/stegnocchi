import { cryptoRateLimiter } from './rateLimiter';
import { logInfo, logWarn, logError, Component } from './logger';

export type KdfAlgorithm = 'argon2id' | 'scrypt';

export interface KdfParams {
  algorithm: KdfAlgorithm;
  password: string;
  salt: Uint8Array;
  timeCost?: number; // iterations (used to map to PBKDF2 iterations)
  memoryCostKB?: number; // ignored on web fallback
  parallelism?: number; // ignored on web fallback
  outputLength?: number; // bytes
  N?: number; // scrypt param - ignored on web fallback
  r?: number; // scrypt param - ignored on web fallback
  p?: number; // scrypt param - ignored on web fallback
}

async function deriveWithPbkdf2(password: string, salt: Uint8Array, iterations: number, outputLength: number): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations,
    },
    passwordKey,
    outputLength * 8
  );
  return new Uint8Array(bits);
}

export async function deriveKeyKdf(params: KdfParams): Promise<Uint8Array> {
  const rate = cryptoRateLimiter.checkLimit('kdf');
  if (!rate.allowed) throw new Error(`Rate limit exceeded. Retry in ${Math.ceil((rate.retryAfter || 0) / 1000)}s`);

  const start = Date.now();
  try {
    // Map provided params to PBKDF2 for web fallback
    const outputLength = params.outputLength ?? 32;
    // Heuristic mapping: Argon2 timeCost -> PBKDF2 iterations (multiply to keep cost reasonable)
    const iterationsFromTimeCost = (params.timeCost && params.timeCost > 0) ? params.timeCost * 50000 : undefined;
    const iterationsFromScrypt = (params.N && params.N > 0) ? Math.min(600000, Math.max(100000, Math.floor(params.N / 2))) : undefined;
    const iterations = iterationsFromTimeCost ?? iterationsFromScrypt ?? 200000;

    const key = await deriveWithPbkdf2(params.password, params.salt, iterations, outputLength);

    logInfo(Component.CRYPTO, 'Derived key with PBKDF2 (web fallback)', {
      timeMs: Date.now() - start,
      iterations,
      outputLength,
      requestedAlgorithm: params.algorithm,
    });

    if (params.algorithm !== 'argon2id' && params.algorithm !== 'scrypt') {
      logWarn(Component.CRYPTO, 'Unknown KDF algorithm requested on web; used PBKDF2 fallback', { algorithm: params.algorithm });
    } else {
      logWarn(Component.CRYPTO, 'KDF algorithm not available on web; used PBKDF2 fallback', { requestedAlgorithm: params.algorithm });
    }

    return key;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'KDF derivation failed (web)';
    logError(Component.CRYPTO, 'KDF derivation exception (web)', { error: message });
    throw new Error(message);
  }
} 