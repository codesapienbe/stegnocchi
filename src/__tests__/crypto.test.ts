/**
 * Crypto Module Unit Tests
 * Tests for encryption and decryption functions
 */

import {
  encryptMessage,
  decryptMessage,
  validatePasswordStrength,
  clearSensitiveData,
  generateSalt,
  generateIV,
  stringToArrayBuffer,
  arrayBufferToString,
} from '@/core/crypto';

describe('Crypto Module', () => {
  const testMessage = 'Hello, this is a test message!';
  const testPassword = 'StrongPassword123!';
  const weakPassword = '123456';

  describe('generateSalt', () => {
    it('should generate a salt of correct length', () => {
      const salt = generateSalt();
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(32); // 256 bits
    });

    it('should generate unique salts', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1).not.toEqual(salt2);
    });
  });

  describe('generateIV', () => {
    it('should generate an IV of correct length', () => {
      const iv = generateIV();
      expect(iv).toBeInstanceOf(Uint8Array);
      expect(iv.length).toBe(12); // 96 bits for GCM
    });

    it('should generate unique IVs', () => {
      const iv1 = generateIV();
      const iv2 = generateIV();
      expect(iv1).not.toEqual(iv2);
    });
  });

  describe('stringToArrayBuffer', () => {
    it('should convert string to ArrayBuffer', () => {
      const buffer = stringToArrayBuffer(testMessage);
      expect(buffer).toBeInstanceOf(ArrayBuffer);
      expect(buffer.byteLength).toBe(testMessage.length);
    });

    it('should handle empty string', () => {
      const buffer = stringToArrayBuffer('');
      expect(buffer).toBeInstanceOf(ArrayBuffer);
      expect(buffer.byteLength).toBe(0);
    });
  });

  describe('arrayBufferToString', () => {
    it('should convert ArrayBuffer to string', () => {
      const buffer = stringToArrayBuffer(testMessage);
      const result = arrayBufferToString(buffer);
      expect(result).toBe(testMessage);
    });

    it('should handle empty ArrayBuffer', () => {
      const buffer = new ArrayBuffer(0);
      const result = arrayBufferToString(buffer);
      expect(result).toBe('');
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const result = validatePasswordStrength(testPassword);
      expect(result.isStrong).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak password', () => {
      const result = validatePasswordStrength(weakPassword);
      expect(result.isStrong).toBe(false);
      expect(result.score).toBeLessThan(3);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject empty password', () => {
      const result = validatePasswordStrength('');
      expect(result.isStrong).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('should reject short password', () => {
      const result = validatePasswordStrength('123');
      expect(result.isStrong).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should reject common password', () => {
      const result = validatePasswordStrength('password123');
      expect(result.isStrong).toBe(false);
      expect(result.errors).toContain('Password is too common');
    });
  });

  describe('encryptMessage', () => {
    it('should encrypt message successfully', async () => {
      const result = await encryptMessage({
        message: testMessage,
        password: testPassword,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).not.toBe(testMessage);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.algorithm).toBe('AES-256-GCM');
      expect(result.metadata?.keySize).toBe(256);
    });

    it('should fail with weak password', async () => {
      const result = await encryptMessage({
        message: testMessage,
        password: weakPassword,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('weak');
    });

    it('should fail with empty message', async () => {
      const result = await encryptMessage({
        message: '',
        password: testPassword,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail with empty password', async () => {
      const result = await encryptMessage({
        message: testMessage,
        password: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('decryptMessage', () => {
    let encryptedData: string;
    let metadata: any;

    beforeEach(async () => {
      const result = await encryptMessage({
        message: testMessage,
        password: testPassword,
      });
      encryptedData = result.data!;
      metadata = result.metadata;
    });

    it('should decrypt message successfully', async () => {
      const result = await decryptMessage({
        encryptedData,
        password: testPassword,
        metadata,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe(testMessage);
    });

    it('should fail with wrong password', async () => {
      const result = await decryptMessage({
        encryptedData,
        password: 'WrongPassword123!',
        metadata,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('decrypt');
    });

    it('should fail with corrupted data', async () => {
      const corruptedData = encryptedData.slice(0, -10) + 'corrupted';
      const result = await decryptMessage({
        encryptedData: corruptedData,
        password: testPassword,
        metadata,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail with missing metadata', async () => {
      const result = await decryptMessage({
        encryptedData,
        password: testPassword,
        metadata: undefined,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('clearSensitiveData', () => {
    it('should clear sensitive data from memory', () => {
      const sensitiveData = 'sensitive information';
      clearSensitiveData(sensitiveData);
      // Note: In a real implementation, this would clear the memory
      // For testing, we just verify the function doesn't throw
      expect(() => clearSensitiveData(sensitiveData)).not.toThrow();
    });
  });

  describe('Round-trip encryption/decryption', () => {
    it('should encrypt and decrypt message correctly', async () => {
      // Encrypt
      const encryptResult = await encryptMessage({
        message: testMessage,
        password: testPassword,
      });

      expect(encryptResult.success).toBe(true);
      expect(encryptResult.data).toBeDefined();
      expect(encryptResult.metadata).toBeDefined();

      // Decrypt
      const decryptResult = await decryptMessage({
        encryptedData: encryptResult.data!,
        password: testPassword,
        metadata: encryptResult.metadata,
      });

      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe(testMessage);
    });

    it('should handle special characters', async () => {
      const specialMessage = 'Hello! @#$%^&*()_+-=[]{}|;:,.<>?';
      
      const encryptResult = await encryptMessage({
        message: specialMessage,
        password: testPassword,
      });

      expect(encryptResult.success).toBe(true);

      const decryptResult = await decryptMessage({
        encryptedData: encryptResult.data!,
        password: testPassword,
        metadata: encryptResult.metadata,
      });

      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe(specialMessage);
    });

    it('should handle unicode characters', async () => {
      const unicodeMessage = 'Hello 世界! 🌍';
      
      const encryptResult = await encryptMessage({
        message: unicodeMessage,
        password: testPassword,
      });

      expect(encryptResult.success).toBe(true);

      const decryptResult = await decryptMessage({
        encryptedData: encryptResult.data!,
        password: testPassword,
        metadata: encryptResult.metadata,
      });

      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe(unicodeMessage);
    });
  });
}); 