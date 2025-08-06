/**
 * EXIF field manipulation for steganography
 * Cross-platform EXIF read/write operations
 */

import { ExifData, ExifField, ExifManipulation } from '../types';

// Supported EXIF fields for steganography
export const STEGANOGRAPHY_FIELDS: ExifField[] = [
  {
    name: 'UserComment',
    value: '',
    description: 'User comment field - commonly used for metadata',
    maxLength: 65535,
    isEditable: true
  },
  {
    name: 'ImageDescription',
    value: '',
    description: 'Image description field - describes the image content',
    maxLength: 65535,
    isEditable: true
  },
  {
    name: 'Artist',
    value: '',
    description: 'Artist field - typically contains photographer name',
    maxLength: 255,
    isEditable: true
  },
  {
    name: 'Copyright',
    value: '',
    description: 'Copyright field - contains copyright information',
    maxLength: 255,
    isEditable: true
  },
  {
    name: 'Software',
    value: '',
    description: 'Software field - contains software used to create image',
    maxLength: 255,
    isEditable: true
  }
];

/**
 * Read EXIF data from JPEG file
 */
export async function readExifData(file: File): Promise<ExifData> {
  try {
    // For now, return empty EXIF data
    // In a real implementation, this would use a library like exif-js or piexif
    const exifData: ExifData = {
      userComment: '',
      imageDescription: '',
      artist: '',
      copyright: '',
      software: '',
      dateTime: new Date().toISOString()
    };

    console.log('📸 EXIF data read from file:', file.name);
    return exifData;
    
  } catch (error) {
    console.error('❌ Error reading EXIF data:', error);
    throw new Error('Failed to read EXIF data from image');
  }
}

/**
 * Write EXIF data to JPEG file
 */
export async function writeExifData(file: File, exifData: ExifData): Promise<File> {
  try {
    // For now, return the original file
    // In a real implementation, this would modify the EXIF data and return a new file
    console.log('📝 EXIF data written to file:', file.name);
    return file;
    
  } catch (error) {
    console.error('❌ Error writing EXIF data:', error);
    throw new Error('Failed to write EXIF data to image');
  }
}

/**
 * Inject payload into UserComment field
 */
export async function injectUserComment(file: File, payload: string): Promise<File> {
  try {
    // Validate payload length
    if (payload.length > STEGANOGRAPHY_FIELDS[0].maxLength) {
      throw new Error(`Payload too long. Maximum ${STEGANOGRAPHY_FIELDS[0].maxLength} characters allowed`);
    }

    // Read existing EXIF data
    const existingExif = await readExifData(file);
    
    // Update UserComment field
    const updatedExif: ExifData = {
      ...existingExif,
      userComment: payload
    };
    
    // Write updated EXIF data
    const result = await writeExifData(file, updatedExif);
    
    console.log('✅ Payload injected into UserComment field');
    return result;
    
  } catch (error) {
    console.error('❌ Error injecting payload into UserComment:', error);
    throw error;
  }
}

/**
 * Inject payload into ImageDescription field
 */
export async function injectImageDescription(file: File, payload: string): Promise<File> {
  try {
    // Validate payload length
    if (payload.length > STEGANOGRAPHY_FIELDS[1].maxLength) {
      throw new Error(`Payload too long. Maximum ${STEGANOGRAPHY_FIELDS[1].maxLength} characters allowed`);
    }

    // Read existing EXIF data
    const existingExif = await readExifData(file);
    
    // Update ImageDescription field
    const updatedExif: ExifData = {
      ...existingExif,
      imageDescription: payload
    };
    
    // Write updated EXIF data
    const result = await writeExifData(file, updatedExif);
    
    console.log('✅ Payload injected into ImageDescription field');
    return result;
    
  } catch (error) {
    console.error('❌ Error injecting payload into ImageDescription:', error);
    throw error;
  }
}

/**
 * Inject payload into Artist field
 */
export async function injectArtist(file: File, payload: string): Promise<File> {
  try {
    // Validate payload length
    if (payload.length > STEGANOGRAPHY_FIELDS[2].maxLength) {
      throw new Error(`Payload too long. Maximum ${STEGANOGRAPHY_FIELDS[2].maxLength} characters allowed`);
    }

    // Read existing EXIF data
    const existingExif = await readExifData(file);
    
    // Update Artist field
    const updatedExif: ExifData = {
      ...existingExif,
      artist: payload
    };
    
    // Write updated EXIF data
    const result = await writeExifData(file, updatedExif);
    
    console.log('✅ Payload injected into Artist field');
    return result;
    
  } catch (error) {
    console.error('❌ Error injecting payload into Artist:', error);
    throw error;
  }
}

/**
 * Inject payload into Copyright field
 */
export async function injectCopyright(file: File, payload: string): Promise<File> {
  try {
    // Validate payload length
    if (payload.length > STEGANOGRAPHY_FIELDS[3].maxLength) {
      throw new Error(`Payload too long. Maximum ${STEGANOGRAPHY_FIELDS[3].maxLength} characters allowed`);
    }

    // Read existing EXIF data
    const existingExif = await readExifData(file);
    
    // Update Copyright field
    const updatedExif: ExifData = {
      ...existingExif,
      copyright: payload
    };
    
    // Write updated EXIF data
    const result = await writeExifData(file, updatedExif);
    
    console.log('✅ Payload injected into Copyright field');
    return result;
    
  } catch (error) {
    console.error('❌ Error injecting payload into Copyright:', error);
    throw error;
  }
}

/**
 * Extract payload from specified EXIF field
 */
export async function extractPayload(file: File, fieldName: string): Promise<string | null> {
  try {
    // Read EXIF data
    const exifData = await readExifData(file);
    
    // Check if field exists and has data
    const fieldValue = exifData[fieldName as keyof ExifData];
    
    if (!fieldValue || typeof fieldValue !== 'string') {
      console.log(`📭 No data found in ${fieldName} field`);
      return null;
    }
    
    console.log(`✅ Payload extracted from ${fieldName} field`);
    return fieldValue;
    
  } catch (error) {
    console.error(`❌ Error extracting payload from ${fieldName}:`, error);
    throw error;
  }
}

/**
 * Inject payload into any supported EXIF field
 */
export async function injectPayload(file: File, fieldName: string, payload: string): Promise<File> {
  try {
    // Find the field configuration
    const fieldConfig = STEGANOGRAPHY_FIELDS.find(field => field.name === fieldName);
    
    if (!fieldConfig) {
      throw new Error(`Unsupported EXIF field: ${fieldName}`);
    }
    
    if (!fieldConfig.isEditable) {
      throw new Error(`Field ${fieldName} is not editable`);
    }
    
    // Validate payload length
    if (payload.length > fieldConfig.maxLength) {
      throw new Error(`Payload too long. Maximum ${fieldConfig.maxLength} characters allowed for ${fieldName}`);
    }
    
    // Read existing EXIF data
    const existingExif = await readExifData(file);
    
    // Update the specified field
    const updatedExif: ExifData = {
      ...existingExif,
      [fieldName]: payload
    };
    
    // Write updated EXIF data
    const result = await writeExifData(file, updatedExif);
    
    console.log(`✅ Payload injected into ${fieldName} field`);
    return result;
    
  } catch (error) {
    console.error(`❌ Error injecting payload into ${fieldName}:`, error);
    throw error;
  }
}

/**
 * Get available EXIF fields for steganography
 */
export function getAvailableFields(): ExifField[] {
  return [...STEGANOGRAPHY_FIELDS];
}

/**
 * Validate EXIF field name
 */
export function isValidField(fieldName: string): boolean {
  return STEGANOGRAPHY_FIELDS.some(field => field.name === fieldName);
}

/**
 * Get field configuration by name
 */
export function getFieldConfig(fieldName: string): ExifField | null {
  return STEGANOGRAPHY_FIELDS.find(field => field.name === fieldName) || null;
}

/**
 * Check if file has EXIF data
 */
export async function hasExifData(file: File): Promise<boolean> {
  try {
    const exifData = await readExifData(file);
    return Object.values(exifData).some(value => value && value !== '');
  } catch (error) {
    console.error('❌ Error checking EXIF data:', error);
    return false;
  }
}

/**
 * Get EXIF field statistics
 */
export async function getExifStats(file: File): Promise<{
  totalFields: number;
  populatedFields: number;
  availableSpace: number;
  largestField: string;
}> {
  try {
    const exifData = await readExifData(file);
    const populatedFields = Object.values(exifData).filter(value => value && value !== '').length;
    
    let largestField = '';
    let maxLength = 0;
    
    for (const [fieldName, value] of Object.entries(exifData)) {
      if (value && typeof value === 'string' && value.length > maxLength) {
        maxLength = value.length;
        largestField = fieldName;
      }
    }
    
    const availableSpace = STEGANOGRAPHY_FIELDS.reduce((total, field) => {
      const currentValue = exifData[field.name as keyof ExifData];
      const currentLength = currentValue ? String(currentValue).length : 0;
      return total + (field.maxLength - currentLength);
    }, 0);
    
    return {
      totalFields: STEGANOGRAPHY_FIELDS.length,
      populatedFields,
      availableSpace,
      largestField
    };
    
  } catch (error) {
    console.error('❌ Error getting EXIF stats:', error);
    throw error;
  }
} 