/**
 * Validation utilities for EXIF Steganography App
 * File validation, password strength, and error handling
 */

import { ValidationResult, PasswordStrength, SecurityConfig } from '../types';
import { getSecurityConfig } from './crypto';
import { logValidation, Component } from './logger';

/**
 * Validate uploaded file
 */
export function validateFile(file: File): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config = getSecurityConfig();
  
  try {
    // Check if file exists
    if (!file) {
      errors.push('No file selected');
      return { isValid: false, errors, warnings };
    }
    
    // Check file type
    const validTypes = config.allowedMimeTypes;
    const isValidType = validTypes.includes(file.type) || 
                       file.name.toLowerCase().match(/\.(jpg|jpeg)$/);
    
    if (!isValidType) {
      errors.push(`Invalid file type. Only JPEG images are supported. Got: ${file.type || 'unknown'}`);
    }
    
    // Check file size
    if (file.size > config.maxFileSize) {
      errors.push(`File too large. Maximum size is ${config.maxFileSize / (1024 * 1024)}MB. Got: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
    }
    
    // Check if file is empty
    if (file.size === 0) {
      errors.push('File is empty');
    }
    
    // Check file name
    if (!file.name || file.name.trim() === '') {
      warnings.push('File has no name');
    }
    
    // Check for suspicious file extensions
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.pif'];
    const hasSuspiciousExtension = suspiciousExtensions.some(ext => 
      file.name.toLowerCase().includes(ext)
    );
    
    if (hasSuspiciousExtension) {
      warnings.push('File has suspicious extension');
    }
    
    logValidation(Component.VALIDATION, errors.length === 0, errors, warnings, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    errors.push(`File validation failed: ${errorMessage}`);
    
    logValidation(Component.VALIDATION, false, errors, warnings, {
      fileName: file?.name,
      error: errorMessage
    });
    
    return {
      isValid: false,
      errors,
      warnings
    };
  }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): PasswordStrength {
  const config = getSecurityConfig();
  const feedback: string[] = [];
  let score = 0;
  
  // Length checks
  if (password.length >= config.minPasswordLength) {
    score += 1;
  } else {
    feedback.push(`Password must be at least ${config.minPasswordLength} characters long`);
  }
  
  if (password.length >= 12) {
    score += 1;
  }
  
  if (password.length >= 16) {
    score += 1;
  }
  
  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add lowercase letters');
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add uppercase letters');
  }
  
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add numbers');
  }
  
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add special characters');
  }
  
  // Check for common patterns
  const commonPatterns = [
    'password', '123456', 'qwerty', 'admin', 'letmein',
    'welcome', 'monkey', 'dragon', 'master', 'football'
  ];
  
  const hasCommonPattern = commonPatterns.some(pattern => 
    password.toLowerCase().includes(pattern)
  );
  
  if (hasCommonPattern) {
    score -= 1;
    feedback.push('Avoid common password patterns');
  }
  
  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeated characters');
  }
  
  // Check for sequential characters
  if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
    score -= 1;
    feedback.push('Avoid sequential characters');
  }
  
  // Determine level
  let level: 'weak' | 'medium' | 'strong';
  if (score < 4) {
    level = 'weak';
  } else if (score < 6) {
    level = 'medium';
  } else {
    level = 'strong';
  }
  
  // Ensure score is not negative
  score = Math.max(0, score);
  
  return { score, level, feedback };
}

/**
 * Validate message content
 */
export function validateMessage(message: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config = getSecurityConfig();
  
  // Check if message is empty
  if (!message || message.trim().length === 0) {
    errors.push('Message cannot be empty');
  }
  
  // Check message length
  if (message.length > config.maxMessageLength) {
    errors.push(`Message too long. Maximum ${config.maxMessageLength} characters allowed`);
  }
  
  // Check for suspicious content
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i
  ];
  
  const hasSuspiciousContent = suspiciousPatterns.some(pattern => 
    pattern.test(message)
  );
  
  if (hasSuspiciousContent) {
    warnings.push('Message contains potentially suspicious content');
  }
  
  // Check for very short messages
  if (message.length < 3) {
    warnings.push('Message is very short');
  }
  
  logValidation(Component.VALIDATION, errors.length === 0, errors, warnings, {
    messageLength: message.length,
    hasSuspiciousContent
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Handle corrupted or malformed JPEG files
 */
export function validateJpegIntegrity(file: File): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Check JPEG file signature (SOI marker)
          if (uint8Array.length < 2 || uint8Array[0] !== 0xFF || uint8Array[1] !== 0xD8) {
            errors.push('Invalid JPEG file signature');
          }
          
          // Check for JPEG end marker
          let hasEndMarker = false;
          for (let i = uint8Array.length - 2; i >= 0; i--) {
            if (uint8Array[i] === 0xFF && uint8Array[i + 1] === 0xD9) {
              hasEndMarker = true;
              break;
            }
          }
          
          if (!hasEndMarker) {
            warnings.push('JPEG file may be truncated (missing end marker)');
          }
          
          // Check for minimum file size
          if (uint8Array.length < 100) {
            warnings.push('JPEG file is unusually small');
          }
          
          // Check for common JPEG markers
          const markers = [0xFF, 0xD8, 0xD9, 0xE0, 0xE1, 0xDB, 0xC0, 0xC4];
          let foundMarkers = 0;
          
          for (let i = 0; i < uint8Array.length - 1; i++) {
            if (uint8Array[i] === 0xFF && markers.includes(uint8Array[i + 1])) {
              foundMarkers++;
            }
          }
          
          if (foundMarkers < 2) {
            warnings.push('JPEG file has few markers');
          }
          
          logValidation(Component.VALIDATION, errors.length === 0, errors, warnings, {
            fileName: file.name,
            fileSize: file.size,
            hasEndMarker,
            foundMarkers
          });
          
          resolve({
            isValid: errors.length === 0,
            errors,
            warnings
          });
          
        } catch (error) {
          errors.push('Failed to analyze JPEG file structure');
          resolve({
            isValid: false,
            errors,
            warnings
          });
        }
      };
      
      reader.onerror = () => {
        errors.push('Failed to read file');
        resolve({
          isValid: false,
          errors,
          warnings
        });
      };
      
      reader.readAsArrayBuffer(file);
      
    } catch (error) {
      errors.push('File validation failed');
      resolve({
        isValid: false,
        errors,
        warnings
      });
    }
  });
}

/**
 * Handle missing EXIF data
 */
export function validateExifData(exifData: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Check if EXIF data exists
    if (!exifData) {
      warnings.push('No EXIF data found in image');
      return { isValid: true, errors, warnings }; // Not an error, just a warning
    }
    
    // Check if EXIF data is an object
    if (typeof exifData !== 'object') {
      errors.push('Invalid EXIF data format');
      return { isValid: false, errors, warnings };
    }
    
    // Check for required EXIF fields (if any are required)
    const requiredFields: string[] = []; // Currently no required fields
    const missingFields = requiredFields.filter(field => !exifData[field]);
    
    if (missingFields.length > 0) {
      warnings.push(`Missing EXIF fields: ${missingFields.join(', ')}`);
    }
    
    // Check for corrupted EXIF data
    const hasValidStructure = Object.keys(exifData).length > 0;
    
    if (!hasValidStructure) {
      warnings.push('EXIF data appears to be empty');
    }
    
    logValidation(Component.VALIDATION, errors.length === 0, errors, warnings, {
      hasExifData: !!exifData,
      exifFieldCount: Object.keys(exifData || {}).length
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown EXIF validation error';
    errors.push(`EXIF validation failed: ${errorMessage}`);
    
    logValidation(Component.VALIDATION, false, errors, warnings, {
      error: errorMessage
    });
    
    return {
      isValid: false,
      errors,
      warnings
    };
  }
}

/**
 * Handle incorrect password decryption attempts
 */
export function validateDecryptionAttempt(
  password: string,
  attemptCount: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check password length
  if (password.length < 8) {
    errors.push('Password too short for decryption');
  }
  
  // Check for too many attempts
  if (attemptCount > 5) {
    warnings.push('Multiple decryption attempts detected');
  }
  
  // Check for suspicious password patterns
  const suspiciousPatterns = [
    /^[0-9]+$/, // Only numbers
    /^[a-zA-Z]+$/, // Only letters
    /^(.)\1*$/, // All same character
    /^1234567890$/, // Sequential numbers
    /^qwertyuiop$/, // Keyboard pattern
  ];
  
  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
    pattern.test(password)
  );
  
  if (hasSuspiciousPattern) {
    warnings.push('Password appears to be too simple');
  }
  
  logValidation(Component.VALIDATION, errors.length === 0, errors, warnings, {
    passwordLength: password.length,
    attemptCount,
    hasSuspiciousPattern
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Comprehensive validation for steganography operations
 */
export function validateSteganographyOperation(
  file: File,
  message: string,
  password: string,
  operation: 'hide' | 'extract'
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate file
  const fileValidation = validateFile(file);
  errors.push(...fileValidation.errors);
  warnings.push(...fileValidation.warnings);
  
  // Validate password
  const passwordValidation = validatePassword(password);
  if (passwordValidation.level === 'weak') {
    warnings.push('Password strength is weak');
  }
  
  // Validate message (only for hide operations)
  if (operation === 'hide') {
    const messageValidation = validateMessage(message);
    errors.push(...messageValidation.errors);
    warnings.push(...messageValidation.warnings);
  }
  
  // Additional validation for extract operations
  if (operation === 'extract') {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters for extraction');
    }
  }
  
  logValidation(Component.VALIDATION, errors.length === 0, errors, warnings, {
    operation,
    fileName: file.name,
    messageLength: message.length,
    passwordStrength: passwordValidation.level
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
} 