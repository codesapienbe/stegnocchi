import { cryptoRateLimiter } from '@/core/rateLimiter';
import { logInfo, logWarn, logError, Component } from '@/core/logger';

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
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    outputLength * 8 // bits
  );

  return new Uint8Array(derived);
}

export async function deriveKeyKdf(params: KdfParams): Promise<Uint8Array> {
  const rate = cryptoRateLimiter.checkLimit('kdf');
  if (!rate.allowed) throw new Error(`Rate limit exceeded. Retry in ${Math.ceil((rate.retryAfter || 0) / 1000)}s`);

  const start = Date.now();
  try {
    // Web fallback: use PBKDF2 regardless of requested algorithm
    const iterations = params.timeCost ?? 100000;
    const outputLength = params.outputLength ?? 32;
    
    logInfo(Component.CRYPTO, 'Starting web KDF derivation (PBKDF2 fallback)', {
      algorithm: params.algorithm,
      actualAlgorithm: 'PBKDF2',
      iterations,
      outputLength
    });

    const result = await deriveWithPbkdf2(params.password, params.salt, iterations, outputLength);
    
    logInfo(Component.CRYPTO, 'Web KDF derivation completed', {
      algorithm: params.algorithm,
      actualAlgorithm: 'PBKDF2',
      duration: Date.now() - start
    });

    return result;
  } catch (error) {
    logError(Component.CRYPTO, 'Web KDF derivation failed', {
      algorithm: params.algorithm,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

export async function benchmarkKdf(algorithm: KdfAlgorithm = 'argon2id', targetMs: number = 500): Promise<KdfParams> {
  logInfo(Component.CRYPTO, 'Starting web KDF benchmark (PBKDF2)', { algorithm, targetMs });
  
  const testPassword = 'benchmark-password';
  const testSalt = crypto.getRandomValues(new Uint8Array(32));
  
  // Binary search for optimal iterations
  let low = 1000;
  let high = 1000000;
  let bestIterations = 10000;
  
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const start = Date.now();
    
    await deriveWithPbkdf2(testPassword, testSalt, mid, 32);
    const duration = Date.now() - start;
    
    if (duration < targetMs) {
      bestIterations = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
    
    if (Math.abs(duration - targetMs) < 50) break; // Close enough
  }
  
  const result: KdfParams = {
    algorithm,
    password: '',
    salt: new Uint8Array(32),
    timeCost: bestIterations,
    outputLength: 32
  };
  
  logInfo(Component.CRYPTO, 'Web KDF benchmark completed', {
    algorithm,
    optimalIterations: bestIterations,
    targetMs
  });
  
  return result;
} 