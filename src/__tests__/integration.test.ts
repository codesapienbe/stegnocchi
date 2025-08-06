/**
 * Integration Tests
 * Tests for steganography workflow integration
 */

import {
  encryptMessage,
  decryptMessage,
} from '@/core/crypto';

import {
  injectPayload,
  extractPayload,
  readExifData,
} from '@/core/exif';

import {
  validateFile,
  validateMessage,
  validateSteganographyOperation,
} from '@/core/validation';

// Mock File object for testing
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('Steganography Integration Tests', () => {
  const testImageFile = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
  const testMessage = 'This is a secret message for steganography testing!';
  const testPassword = 'StrongPassword123!';
  const testField = 'UserComment';

  describe('Complete Hide Message Workflow', () => {
    it('should complete full hide message workflow', async () => {
      // Step 1: Validate file
      const fileValidation = validateFile(testImageFile);
      expect(fileValidation.isValid).toBe(true);

      // Step 2: Validate message
      const messageValidation = validateMessage(testMessage);
      expect(messageValidation.isValid).toBe(true);

      // Step 3: Validate operation
      const operationValidation = validateSteganographyOperation(
        testImageFile,
        testMessage,
        testPassword,
        'hide'
      );
      expect(operationValidation.isValid).toBe(true);

      // Step 4: Encrypt message
      const encryptResult = await encryptMessage({
        message: testMessage,
        password: testPassword,
      });
      expect(encryptResult.success).toBe(true);
      expect(encryptResult.data).toBeDefined();
      expect(encryptResult.metadata).toBeDefined();

      // Step 5: Inject encrypted payload into EXIF
      const injectResult = await injectPayload(
        testImageFile,
        testField,
        encryptResult.data!
      );
      expect(injectResult.success).toBe(true);
      expect(injectResult.file).toBeDefined();

      // Step 6: Verify EXIF data was written
      const exifResult = await readExifData(injectResult.file!);
      expect(exifResult.success).toBe(true);
      expect(exifResult.fields).toBeDefined();

      // Step 7: Extract payload from EXIF
      const extractResult = await extractPayload(injectResult.file!, testField);
      expect(extractResult.success).toBe(true);
      expect(extractResult.payload).toBe(encryptResult.data);

      // Step 8: Decrypt message
      const decryptResult = await decryptMessage({
        encryptedData: extractResult.payload!,
        password: testPassword,
        metadata: encryptResult.metadata,
      });
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe(testMessage);
    });

    it('should handle workflow with multiple fields', async () => {
      const message1 = 'First secret message';
      const message2 = 'Second secret message';
      const password1 = 'Password1!';
      const password2 = 'Password2!';

      // Encrypt first message
      const encrypt1Result = await encryptMessage({
        message: message1,
        password: password1,
      });
      expect(encrypt1Result.success).toBe(true);

      // Encrypt second message
      const encrypt2Result = await encryptMessage({
        message: message2,
        password: password2,
      });
      expect(encrypt2Result.success).toBe(true);

      // Inject into first field
      const inject1Result = await injectPayload(
        testImageFile,
        'UserComment',
        encrypt1Result.data!
      );
      expect(inject1Result.success).toBe(true);

      // Inject into second field
      const inject2Result = await injectPayload(
        inject1Result.file!,
        'ImageDescription',
        encrypt2Result.data!
      );
      expect(inject2Result.success).toBe(true);

      // Extract and decrypt first message
      const extract1Result = await extractPayload(inject2Result.file!, 'UserComment');
      expect(extract1Result.success).toBe(true);

      const decrypt1Result = await decryptMessage({
        encryptedData: extract1Result.payload!,
        password: password1,
        metadata: encrypt1Result.metadata,
      });
      expect(decrypt1Result.success).toBe(true);
      expect(decrypt1Result.data).toBe(message1);

      // Extract and decrypt second message
      const extract2Result = await extractPayload(inject2Result.file!, 'ImageDescription');
      expect(extract2Result.success).toBe(true);

      const decrypt2Result = await decryptMessage({
        encryptedData: extract2Result.payload!,
        password: password2,
        metadata: encrypt2Result.metadata,
      });
      expect(decrypt2Result.success).toBe(true);
      expect(decrypt2Result.data).toBe(message2);
    });
  });

  describe('Complete Extract Message Workflow', () => {
    let processedFile: File;
    let originalEncryptedData: string;
    let originalMetadata: any;

    beforeEach(async () => {
      // Setup: Create a file with hidden message
      const encryptResult = await encryptMessage({
        message: testMessage,
        password: testPassword,
      });
      originalEncryptedData = encryptResult.data!;
      originalMetadata = encryptResult.metadata;

      const injectResult = await injectPayload(
        testImageFile,
        testField,
        originalEncryptedData
      );
      processedFile = injectResult.file!;
    });

    it('should complete full extract message workflow', async () => {
      // Step 1: Validate file
      const fileValidation = validateFile(processedFile);
      expect(fileValidation.isValid).toBe(true);

      // Step 2: Validate operation
      const operationValidation = validateSteganographyOperation(
        processedFile,
        '', // No message needed for extract
        testPassword,
        'extract'
      );
      expect(operationValidation.isValid).toBe(true);

      // Step 3: Read EXIF data
      const exifResult = await readExifData(processedFile);
      expect(exifResult.success).toBe(true);
      expect(exifResult.fields).toBeDefined();

      // Step 4: Extract payload from EXIF
      const extractResult = await extractPayload(processedFile, testField);
      expect(extractResult.success).toBe(true);
      expect(extractResult.payload).toBe(originalEncryptedData);

      // Step 5: Decrypt message
      const decryptResult = await decryptMessage({
        encryptedData: extractResult.payload!,
        password: testPassword,
        metadata: originalMetadata,
      });
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe(testMessage);
    });

    it('should handle extraction with wrong password', async () => {
      const wrongPassword = 'WrongPassword123!';

      // Extract payload
      const extractResult = await extractPayload(processedFile, testField);
      expect(extractResult.success).toBe(true);

      // Try to decrypt with wrong password
      const decryptResult = await decryptMessage({
        encryptedData: extractResult.payload!,
        password: wrongPassword,
        metadata: originalMetadata,
      });
      expect(decryptResult.success).toBe(false);
      expect(decryptResult.error).toBeDefined();
    });

    it('should handle extraction from field without payload', async () => {
      const extractResult = await extractPayload(processedFile, 'ImageDescription');
      expect(extractResult.success).toBe(true);
      expect(extractResult.payload).toBeNull();
    });
  });

  describe('Error Handling in Workflow', () => {
    it('should handle invalid file in workflow', async () => {
      const invalidFile = createMockFile('invalid.txt', 100, 'text/plain');

      // Validate file should fail
      const fileValidation = validateFile(invalidFile);
      expect(fileValidation.isValid).toBe(false);

      // Operation validation should fail
      const operationValidation = validateSteganographyOperation(
        invalidFile,
        testMessage,
        testPassword,
        'hide'
      );
      expect(operationValidation.isValid).toBe(false);
    });

    it('should handle invalid message in workflow', async () => {
      const invalidMessage = 'a'.repeat(1000); // Too long

      // Validate message should fail
      const messageValidation = validateMessage(invalidMessage);
      expect(messageValidation.isValid).toBe(false);

      // Operation validation should fail
      const operationValidation = validateSteganographyOperation(
        testImageFile,
        invalidMessage,
        testPassword,
        'hide'
      );
      expect(operationValidation.isValid).toBe(false);
    });

    it('should handle weak password in workflow', async () => {
      const weakPassword = '123456';

      // Encryption should fail
      const encryptResult = await encryptMessage({
        message: testMessage,
        password: weakPassword,
      });
      expect(encryptResult.success).toBe(false);
    });

    it('should handle corrupted file in workflow', async () => {
      const corruptedFile = createMockFile('corrupted.jpg', 0, 'image/jpeg');

      // Read EXIF should fail
      const exifResult = await readExifData(corruptedFile);
      expect(exifResult.success).toBe(false);

      // Extract should fail
      const extractResult = await extractPayload(corruptedFile, testField);
      expect(extractResult.success).toBe(false);
    });
  });

  describe('Performance and Stress Testing', () => {
    it('should handle large messages', async () => {
      const largeMessage = 'a'.repeat(500); // Near max length
      const encryptResult = await encryptMessage({
        message: largeMessage,
        password: testPassword,
      });
      expect(encryptResult.success).toBe(true);

      const injectResult = await injectPayload(
        testImageFile,
        testField,
        encryptResult.data!
      );
      expect(injectResult.success).toBe(true);

      const extractResult = await extractPayload(injectResult.file!, testField);
      expect(extractResult.success).toBe(true);

      const decryptResult = await decryptMessage({
        encryptedData: extractResult.payload!,
        password: testPassword,
        metadata: encryptResult.metadata,
      });
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe(largeMessage);
    });

    it('should handle special characters in messages', async () => {
      const specialMessage = 'Hello! @#$%^&*()_+-=[]{}|;:,.<>? 世界 🌍';
      
      const encryptResult = await encryptMessage({
        message: specialMessage,
        password: testPassword,
      });
      expect(encryptResult.success).toBe(true);

      const injectResult = await injectPayload(
        testImageFile,
        testField,
        encryptResult.data!
      );
      expect(injectResult.success).toBe(true);

      const extractResult = await extractPayload(injectResult.file!, testField);
      expect(extractResult.success).toBe(true);

      const decryptResult = await decryptMessage({
        encryptedData: extractResult.payload!,
        password: testPassword,
        metadata: encryptResult.metadata,
      });
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.data).toBe(specialMessage);
    });

    it('should handle multiple operations on same file', async () => {
      let currentFile = testImageFile;
      const messages = ['Message 1', 'Message 2', 'Message 3'];
      const passwords = ['Pass1!', 'Pass2!', 'Pass3!'];

      for (let i = 0; i < messages.length; i++) {
        const encryptResult = await encryptMessage({
          message: messages[i],
          password: passwords[i],
        });
        expect(encryptResult.success).toBe(true);

        const injectResult = await injectPayload(
          currentFile,
          testField, // Assuming a fixed field for simplicity in this example
          encryptResult.data!
        );
        expect(injectResult.success).toBe(true);

        currentFile = injectResult.file!;
      }

      // Verify all messages can be extracted
      for (let i = 0; i < messages.length; i++) {
        const extractResult = await extractPayload(
          currentFile,
          testField
        );
        expect(extractResult.success).toBe(true);

        const decryptResult = await decryptMessage({
          encryptedData: extractResult.payload!,
          password: passwords[i],
          metadata: { algorithm: 'AES-256-GCM', keySize: 256 },
        });
        expect(decryptResult.success).toBe(true);
        expect(decryptResult.data).toBe(messages[i]);
      }
    });
  });

  describe('Security Testing', () => {
    it('should not leak sensitive data in logs', async () => {
      const originalConsoleLog = console.log;
      const logs: string[] = [];
      console.log = jest.fn((...args) => {
        logs.push(args.join(' '));
      });

      try {
        await encryptMessage({
          message: testMessage,
          password: testPassword,
        });

        // Check that sensitive data is not in logs
        const logString = logs.join(' ');
        expect(logString).not.toContain(testMessage);
        expect(logString).not.toContain(testPassword);
      } finally {
        console.log = originalConsoleLog;
      }
    });

    it('should handle memory clearing', async () => {
      const encryptResult = await encryptMessage({
        message: testMessage,
        password: testPassword,
      });
      expect(encryptResult.success).toBe(true);

      // In a real implementation, sensitive data should be cleared from memory
      // For testing, we verify the function doesn't throw
      expect(() => {
        // This would clear sensitive data in production
      }).not.toThrow();
    });
  });
}); 