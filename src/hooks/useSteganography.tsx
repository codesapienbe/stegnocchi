/**
 * Steganography Context and Hook
 * Manages steganography operations and cryptographic functions
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { 
  encryptMessage, 
  decryptMessage, 
  validatePasswordStrength,
  clearSensitiveData as clearCryptoData 
} from '@/core/crypto';
import { 
  injectPayload, 
  extractPayload, 
  readExifData,
  getAvailableFields 
} from '@/core/exif';
import { 
  validateFile, 
  validateMessage, 
  validateSteganographyOperation,
  validateJpegIntegrity 
} from '@/core/validation';
import { 
  logCryptoOperation, 
  logExifOperation, 
  logFileOperation,
  logValidation,
  Component 
} from '@/core/logger';
import { 
  CryptoResult, 
  ProcessedData, 
  ExifData, 
  ExifField,
  ValidationResult,
  PasswordStrength 
} from '@/types';

// Steganography context type
interface SteganographyContextType {
  // Cryptographic operations
  encrypt: (message: string, password: string) => Promise<CryptoResult>;
  decrypt: (encryptedData: string, password: string) => Promise<CryptoResult>;
  validatePassword: (password: string) => PasswordStrength;
  
  // EXIF operations
  injectIntoExif: (file: File, field: string, payload: string) => Promise<File>;
  extractFromExif: (file: File, field: string) => Promise<string | null>;
  readExif: (file: File) => Promise<ExifData>;
  getFields: () => ExifField[];
  
  // Validation operations
  validateFile: (file: File) => ValidationResult;
  validateMessage: (message: string) => ValidationResult;
  validateOperation: (file: File, message: string, password: string, operation: 'hide' | 'extract') => ValidationResult;
  validateJpeg: (file: File) => Promise<ValidationResult>;
  
  // Utility operations
  clearSensitiveData: () => void;
  createProcessedData: (file: File, stegoData: string) => ProcessedData;
}

// Create context
const SteganographyContext = createContext<SteganographyContextType | undefined>(undefined);

// Provider component
interface SteganographyProviderProps {
  children: ReactNode;
}

export const SteganographyProvider: React.FC<SteganographyProviderProps> = ({ children }) => {
  
  // Cryptographic operations
  const encrypt = async (message: string, password: string): Promise<CryptoResult> => {
    try {
      const startTime = Date.now();
      const result = await encryptMessage({ message, password });
      const duration = Date.now() - startTime;
      
      logCryptoOperation('encrypt', result.success, {
        messageLength: message.length,
        duration,
        hasError: !!result.error
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown encryption error';
      logCryptoOperation('encrypt', false, { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const decrypt = async (encryptedData: string, password: string): Promise<CryptoResult> => {
    try {
      const startTime = Date.now();
      const result = await decryptMessage({ encryptedData, password });
      const duration = Date.now() - startTime;
      
      logCryptoOperation('decrypt', result.success, {
        encryptedDataLength: encryptedData.length,
        duration,
        hasError: !!result.error
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown decryption error';
      logCryptoOperation('decrypt', false, { error: errorMessage });
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const validatePassword = (password: string): PasswordStrength => {
    return validatePasswordStrength(password);
  };

  // EXIF operations
  const injectIntoExif = async (file: File, field: string, payload: string): Promise<File> => {
    try {
      const startTime = Date.now();
      const result = await injectPayload(file, field, payload);
      const duration = Date.now() - startTime;
      
      logExifOperation('inject', field, true, {
        fileName: file.name,
        payloadLength: payload.length,
        duration
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown injection error';
      logExifOperation('inject', field, false, {
        fileName: file.name,
        error: errorMessage
      });
      throw error;
    }
  };

  const extractFromExif = async (file: File, field: string): Promise<string | null> => {
    try {
      const startTime = Date.now();
      const result = await extractPayload(file, field);
      const duration = Date.now() - startTime;
      
      logExifOperation('extract', field, true, {
        fileName: file.name,
        hasData: !!result,
        dataLength: result?.length || 0,
        duration
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown extraction error';
      logExifOperation('extract', field, false, {
        fileName: file.name,
        error: errorMessage
      });
      throw error;
    }
  };

  const readExif = async (file: File): Promise<ExifData> => {
    try {
      const startTime = Date.now();
      const result = await readExifData(file);
      const duration = Date.now() - startTime;
      
      logExifOperation('read', 'all', true, {
        fileName: file.name,
        duration,
        fieldCount: Object.keys(result).length
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown EXIF read error';
      logExifOperation('read', 'all', false, {
        fileName: file.name,
        error: errorMessage
      });
      throw error;
    }
  };

  const getFields = (): ExifField[] => {
    return getAvailableFields();
  };

  // Validation operations
  const validateFileOperation = (file: File): ValidationResult => {
    const result = validateFile(file);
    
    logValidation(Component.VALIDATION, result.isValid, result.errors, result.warnings, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    return result;
  };

  const validateMessageOperation = (message: string): ValidationResult => {
    const result = validateMessage(message);
    
    logValidation(Component.VALIDATION, result.isValid, result.errors, result.warnings, {
      messageLength: message.length
    });
    
    return result;
  };

  const validateOperation = (
    file: File, 
    message: string, 
    password: string, 
    operation: 'hide' | 'extract'
  ): ValidationResult => {
    const result = validateSteganographyOperation(file, message, password, operation);
    
    logValidation(Component.VALIDATION, result.isValid, result.errors, result.warnings, {
      operation,
      fileName: file.name,
      messageLength: message.length,
      passwordLength: password.length
    });
    
    return result;
  };

  const validateJpeg = async (file: File): Promise<ValidationResult> => {
    const result = await validateJpegIntegrity(file);
    
    logValidation(Component.VALIDATION, result.isValid, result.errors, result.warnings, {
      fileName: file.name,
      fileSize: file.size
    });
    
    return result;
  };

  // Utility operations
  const clearSensitiveData = (): void => {
    clearCryptoData('');
    logInfo(Component.CRYPTO, 'Sensitive data cleared from memory');
  };

  const createProcessedData = (file: File, stegoData: string): ProcessedData => {
    return {
      imageData: '', // Will be set when file is processed
      filename: file.name.replace(/\.(jpg|jpeg)$/i, '_stego.jpg'),
      metadata: {
        stegoData,
        timestamp: new Date().toISOString(),
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type
      }
    };
  };

  const value: SteganographyContextType = {
    // Cryptographic operations
    encrypt,
    decrypt,
    validatePassword,
    
    // EXIF operations
    injectIntoExif,
    extractFromExif,
    readExif,
    getFields,
    
    // Validation operations
    validateFile: validateFileOperation,
    validateMessage: validateMessageOperation,
    validateOperation,
    validateJpeg,
    
    // Utility operations
    clearSensitiveData,
    createProcessedData
  };

  return (
    <SteganographyContext.Provider value={value}>
      {children}
    </SteganographyContext.Provider>
  );
};

// Custom hook
export const useSteganography = (): SteganographyContextType => {
  const context = useContext(SteganographyContext);
  
  if (context === undefined) {
    throw new Error('useSteganography must be used within a SteganographyProvider');
  }
  
  return context;
}; 