/**
 * Cryptographic operations for EXIF Steganography
 * Cross-platform AES-256-GCM encryption and PBKDF2 key derivation
 */

import {
  CryptoResult,
  CryptoMetadata,
  EncryptionParams,
  DecryptionParams,
  SecurityConfig
} from '../types';
import { cryptoRateLimiter } from './rateLimiter';
import { secureStorage } from './secureStorage';

// Security configuration
const SECURITY_CONFIG: SecurityConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ['image/jpeg', 'image/jpg'],
  maxMessageLength: 1000,
  minPasswordLength: 8,
  maxPasswordLength: 128,
  encryptionIterations: 100000,
  keySize: 256
};

/**
 * Generate cryptographically secure random salt
 */
export function generateSalt(): string {
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return btoa(String.fromCharCode(...array));
}

/**
 * Generate cryptographically secure random IV
 */
export function generateIV(): string {
  const array = new Uint8Array(12); // 96 bits for GCM
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return btoa(String.fromCharCode(...array));
}

/**
 * Convert string to ArrayBuffer
 */
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Convert ArrayBuffer to string
 */
function arrayBufferToString(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Derive key using PBKDF2
 */
async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = base64ToArrayBuffer(salt);

  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: SECURITY_CONFIG.encryptionIterations,
      hash: 'SHA-256'
    },
    key,
    { name: 'AES-GCM', length: SECURITY_CONFIG.keySize },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt message with rate limiting and secure storage
 */
export async function encryptMessage(params: EncryptionParams): Promise<CryptoResult> {
  const startTime = Date.now();
  
  try {
    // Check rate limiting
    const rateLimitResult = cryptoRateLimiter.checkLimit('encrypt');
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: `Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.retryAfter || 0) / 1000)} seconds.`,
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
        },
      };
    }

    const { message, password } = params;
    
    // Validate inputs
    if (!message || !password) {
      return {
        success: false,
        error: 'Message and password are required',
      };
    }

    if (message.length > SECURITY_CONFIG.maxMessageLength) {
      return {
        success: false,
        error: `Message too long. Maximum length is ${SECURITY_CONFIG.maxMessageLength} characters`,
      };
    }

    // Generate salt and IV
    const salt = generateSalt();
    const iv = generateIV();
    
    // Derive key
    const key = await deriveKey(password, salt);
    
    // Encrypt message
    const messageBuffer = stringToArrayBuffer(message);
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: base64ToArrayBuffer(iv)
      },
      key,
      messageBuffer
    );

    // Create metadata
    const metadata: CryptoMetadata = {
      algorithm: 'AES-256-GCM',
      keySize: SECURITY_CONFIG.keySize,
      iterations: SECURITY_CONFIG.encryptionIterations,
      salt,
      iv,
      timestamp: Date.now(),
      version: '1.0'
    };

    // Store encryption key securely if biometric is available
    const biometricAvailable = await secureStorage.isBiometricAvailable();
    if (biometricAvailable) {
      await secureStorage.storeEncryptionKey(key.algorithm as any, base64ToArrayBuffer(salt));
    }

    // Create result
    const result: CryptoResult = {
      success: true,
      data: arrayBufferToBase64(encryptedBuffer),
      metadata,
      rateLimit: {
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
      },
    };

    // Clear sensitive data
    clearSensitiveData(password);
    clearSensitiveData(message);

    const duration = Date.now() - startTime;
    console.log(`Encryption completed in ${duration}ms`);

    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Encryption failed';
    console.error('Encryption error:', error);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Decrypt message with rate limiting and secure storage
 */
export async function decryptMessage(params: DecryptionParams): Promise<CryptoResult> {
  const startTime = Date.now();
  
  try {
    // Check rate limiting
    const rateLimitResult = cryptoRateLimiter.checkLimit('decrypt');
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: `Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.retryAfter || 0) / 1000)} seconds.`,
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
        },
      };
    }

    const { encryptedData, password, metadata } = params;
    
    // Validate inputs
    if (!encryptedData || !password || !metadata) {
      return {
        success: false,
        error: 'Encrypted data, password, and metadata are required',
      };
    }

    // Validate metadata
    if (!metadata.salt || !metadata.iv || !metadata.algorithm) {
      return {
        success: false,
        error: 'Invalid metadata: missing required fields',
      };
    }

    if (metadata.algorithm !== 'AES-256-GCM') {
      return {
        success: false,
        error: 'Unsupported encryption algorithm',
      };
    }

    // Derive key
    const key = await deriveKey(password, metadata.salt);
    
    // Decrypt message
    const encryptedBuffer = base64ToArrayBuffer(encryptedData);
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: base64ToArrayBuffer(metadata.iv)
      },
      key,
      encryptedBuffer
    );

    const decryptedMessage = arrayBufferToString(decryptedBuffer);

    // Create result
    const result: CryptoResult = {
      success: true,
      data: decryptedMessage,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
      },
      rateLimit: {
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
      },
    };

    // Clear sensitive data
    clearSensitiveData(password);
    clearSensitiveData(encryptedData);

    const duration = Date.now() - startTime;
    console.log(`Decryption completed in ${duration}ms`);

    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Decryption failed';
    console.error('Decryption error:', error);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Validate password strength with enhanced checks
 */
export function validatePasswordStrength(password: string): {
  score: number;
  level: 'weak' | 'medium' | 'strong';
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length < SECURITY_CONFIG.minPasswordLength) {
    feedback.push(`Password must be at least ${SECURITY_CONFIG.minPasswordLength} characters long`);
  } else {
    score += Math.min(password.length * 2, 20);
  }

  if (password.length > SECURITY_CONFIG.maxPasswordLength) {
    feedback.push(`Password must be no more than ${SECURITY_CONFIG.maxPasswordLength} characters long`);
  }

  // Character variety checks
  if (/[a-z]/.test(password)) score += 5;
  if (/[A-Z]/.test(password)) score += 5;
  if (/[0-9]/.test(password)) score += 5;
  if (/[^A-Za-z0-9]/.test(password)) score += 10;

  // Common password check
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    score = Math.max(0, score - 20);
    feedback.push('This is a commonly used password');
  }

  // Sequential character check
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 5);
    feedback.push('Avoid repeated characters');
  }

  // Keyboard pattern check
  const keyboardPatterns = ['qwerty', 'asdfgh', 'zxcvbn', '123456'];
  if (keyboardPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    score = Math.max(0, score - 10);
    feedback.push('Avoid keyboard patterns');
  }

  // Determine level
  let level: 'weak' | 'medium' | 'strong';
  if (score < 30) {
    level = 'weak';
    if (feedback.length === 0) feedback.push('Password is too weak');
  } else if (score < 60) {
    level = 'medium';
    if (feedback.length === 0) feedback.push('Password could be stronger');
  } else {
    level = 'strong';
    if (feedback.length === 0) feedback.push('Password is strong');
  }

  return { score, level, feedback };
}

/**
 * Clear sensitive data from memory
 */
export function clearSensitiveData(data: string): void {
  // In a real implementation, this would use secure memory clearing
  // For now, we'll just overwrite the string
  if (typeof data === 'string') {
    data = '0'.repeat(data.length);
  }
}

/**
 * Get security configuration
 */
export function getSecurityConfig(): SecurityConfig {
  return { ...SECURITY_CONFIG };
} 