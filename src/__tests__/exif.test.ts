/**
 * EXIF Module Unit Tests
 * Tests for EXIF field read/write functions
 */

import {
  readExifData,
  writeExifData,
  injectPayload,
  extractPayload,
  getAvailableFields,
  STEGANOGRAPHY_FIELDS,
} from '@/core/exif';

// Mock File object for testing
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('EXIF Module', () => {
  const testImageFile = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
  const testPayload = 'This is a test payload for steganography';
  const testField = 'UserComment';

  describe('STEGANOGRAPHY_FIELDS', () => {
    it('should contain expected fields', () => {
      const fieldNames = STEGANOGRAPHY_FIELDS.map(field => field.name);
      expect(fieldNames).toContain('UserComment');
      expect(fieldNames).toContain('ImageDescription');
      expect(fieldNames).toContain('Artist');
      expect(fieldNames).toContain('Copyright');
      expect(fieldNames).toContain('Software');
    });

    it('should have valid field configurations', () => {
      STEGANOGRAPHY_FIELDS.forEach(field => {
        expect(field.name).toBeDefined();
        expect(field.maxLength).toBeGreaterThan(0);
        expect(field.description).toBeDefined();
        expect(typeof field.isWritable).toBe('boolean');
      });
    });
  });

  describe('getAvailableFields', () => {
    it('should return all steganography fields', () => {
      const fields = getAvailableFields();
      expect(fields).toEqual(STEGANOGRAPHY_FIELDS);
    });

    it('should return writable fields only when specified', () => {
      const writableFields = getAvailableFields().filter(field => field.isWritable);
      expect(writableFields.length).toBeGreaterThan(0);
      writableFields.forEach(field => {
        expect(field.isWritable).toBe(true);
      });
    });
  });

  describe('readExifData', () => {
    it('should read EXIF data from JPEG file', async () => {
      const result = await readExifData(testImageFile);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.fields).toBeDefined();
      expect(Array.isArray(result.fields)).toBe(true);
    });

    it('should handle files without EXIF data', async () => {
      const emptyFile = createMockFile('empty.jpg', 100, 'image/jpeg');
      const result = await readExifData(emptyFile);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.fields).toHaveLength(0);
    });

    it('should handle non-JPEG files', async () => {
      const pngFile = createMockFile('test.png', 1024, 'image/png');
      const result = await readExifData(pngFile);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('JPEG');
    });

    it('should handle corrupted files', async () => {
      const corruptedFile = createMockFile('corrupted.jpg', 0, 'image/jpeg');
      const result = await readExifData(corruptedFile);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('writeExifData', () => {
    it('should write EXIF data to file', async () => {
      const exifData = {
        fields: [
          { name: 'UserComment', value: 'Test comment' },
          { name: 'Artist', value: 'Test Artist' },
        ],
      };

      const result = await writeExifData(testImageFile, exifData);
      
      expect(result.success).toBe(true);
      expect(result.file).toBeDefined();
      expect(result.file).not.toBe(testImageFile);
    });

    it('should handle empty EXIF data', async () => {
      const emptyExifData = { fields: [] };
      const result = await writeExifData(testImageFile, emptyExifData);
      
      expect(result.success).toBe(true);
      expect(result.file).toBeDefined();
    });

    it('should validate field names', async () => {
      const invalidExifData = {
        fields: [
          { name: 'InvalidField', value: 'Test value' },
        ],
      };

      const result = await writeExifData(testImageFile, invalidExifData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('InvalidField');
    });

    it('should validate field values', async () => {
      const longValue = 'a'.repeat(1000); // Exceeds max length
      const invalidExifData = {
        fields: [
          { name: 'UserComment', value: longValue },
        ],
      };

      const result = await writeExifData(testImageFile, invalidExifData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('length');
    });
  });

  describe('injectPayload', () => {
    it('should inject payload into specified field', async () => {
      const result = await injectPayload(testImageFile, testField, testPayload);
      
      expect(result.success).toBe(true);
      expect(result.file).toBeDefined();
      expect(result.file).not.toBe(testImageFile);
    });

    it('should validate field name', async () => {
      const result = await injectPayload(testImageFile, 'InvalidField', testPayload);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('InvalidField');
    });

    it('should validate payload length', async () => {
      const longPayload = 'a'.repeat(1000);
      const result = await injectPayload(testImageFile, testField, longPayload);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('length');
    });

    it('should handle empty payload', async () => {
      const result = await injectPayload(testImageFile, testField, '');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('empty');
    });

    it('should handle special characters in payload', async () => {
      const specialPayload = 'Hello! @#$%^&*()_+-=[]{}|;:,.<>?';
      const result = await injectPayload(testImageFile, testField, specialPayload);
      
      expect(result.success).toBe(true);
      expect(result.file).toBeDefined();
    });

    it('should handle unicode characters in payload', async () => {
      const unicodePayload = 'Hello 世界! 🌍';
      const result = await injectPayload(testImageFile, testField, unicodePayload);
      
      expect(result.success).toBe(true);
      expect(result.file).toBeDefined();
    });
  });

  describe('extractPayload', () => {
    let injectedFile: File;

    beforeEach(async () => {
      const result = await injectPayload(testImageFile, testField, testPayload);
      injectedFile = result.file!;
    });

    it('should extract payload from specified field', async () => {
      const result = await extractPayload(injectedFile, testField);
      
      expect(result.success).toBe(true);
      expect(result.payload).toBe(testPayload);
    });

    it('should return null for field without payload', async () => {
      const result = await extractPayload(testImageFile, 'ImageDescription');
      
      expect(result.success).toBe(true);
      expect(result.payload).toBeNull();
    });

    it('should validate field name', async () => {
      const result = await extractPayload(injectedFile, 'InvalidField');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('InvalidField');
    });

    it('should handle corrupted files', async () => {
      const corruptedFile = createMockFile('corrupted.jpg', 0, 'image/jpeg');
      const result = await extractPayload(corruptedFile, testField);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Round-trip injection/extraction', () => {
    it('should inject and extract payload correctly', async () => {
      // Inject payload
      const injectResult = await injectPayload(testImageFile, testField, testPayload);
      expect(injectResult.success).toBe(true);
      expect(injectResult.file).toBeDefined();

      // Extract payload
      const extractResult = await extractPayload(injectResult.file!, testField);
      expect(extractResult.success).toBe(true);
      expect(extractResult.payload).toBe(testPayload);
    });

    it('should handle multiple fields', async () => {
      const payload1 = 'Payload 1';
      const payload2 = 'Payload 2';

      // Inject into first field
      const inject1Result = await injectPayload(testImageFile, 'UserComment', payload1);
      expect(inject1Result.success).toBe(true);

      // Inject into second field
      const inject2Result = await injectPayload(inject1Result.file!, 'ImageDescription', payload2);
      expect(inject2Result.success).toBe(true);

      // Extract from both fields
      const extract1Result = await extractPayload(inject2Result.file!, 'UserComment');
      expect(extract1Result.success).toBe(true);
      expect(extract1Result.payload).toBe(payload1);

      const extract2Result = await extractPayload(inject2Result.file!, 'ImageDescription');
      expect(extract2Result.success).toBe(true);
      expect(extract2Result.payload).toBe(payload2);
    });

    it('should preserve original image data', async () => {
      // Read original EXIF
      const originalExif = await readExifData(testImageFile);
      expect(originalExif.success).toBe(true);

      // Inject payload
      const injectResult = await injectPayload(testImageFile, testField, testPayload);
      expect(injectResult.success).toBe(true);

      // Read modified EXIF
      const modifiedExif = await readExifData(injectResult.file!);
      expect(modifiedExif.success).toBe(true);

      // Original fields should still be present
      const originalFieldNames = originalExif.fields.map(f => f.name);
      const modifiedFieldNames = modifiedExif.fields.map(f => f.name);
      
      originalFieldNames.forEach(fieldName => {
        if (fieldName !== testField) {
          expect(modifiedFieldNames).toContain(fieldName);
        }
      });
    });
  });

  describe('Error handling', () => {
    it('should handle file read errors', async () => {
      const invalidFile = createMockFile('invalid.jpg', -1, 'image/jpeg');
      
      const readResult = await readExifData(invalidFile);
      expect(readResult.success).toBe(false);
      
      const injectResult = await injectPayload(invalidFile, testField, testPayload);
      expect(injectResult.success).toBe(false);
      
      const extractResult = await extractPayload(invalidFile, testField);
      expect(extractResult.success).toBe(false);
    });

    it('should handle unsupported file types', async () => {
      const unsupportedFile = createMockFile('test.txt', 100, 'text/plain');
      
      const readResult = await readExifData(unsupportedFile);
      expect(readResult.success).toBe(false);
      expect(readResult.error).toContain('JPEG');
    });

    it('should handle network errors gracefully', async () => {
      // This would test network-related errors in a real implementation
      // For now, we test that the functions handle errors properly
      const mockErrorFile = createMockFile('network-error.jpg', 0, 'image/jpeg');
      
      const result = await readExifData(mockErrorFile);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
}); 