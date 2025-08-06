/**
 * Core TypeScript interfaces for EXIF Steganography App
 * Cross-platform compatible for React Native and Web
 */

// App State Interface
export interface AppState {
  mode: 'idle' | 'hide' | 'extract';
  phase: 'waiting' | 'input' | 'processing' | 'complete' | 'error';
  file: File | null;
  message: string;
  password: string;
  processedData: ProcessedData | null;
  extractedMessage: string;
  error: string | null;
}

// Cryptographic Operations Interface
export interface CryptoResult {
  success: boolean;
  data?: string;
  error?: string;
  metadata?: CryptoMetadata;
}

export interface CryptoMetadata {
  algorithm: 'AES-256-GCM';
  keyDerivation: 'PBKDF2';
  iterations: number;
  salt: string;
  iv: string;
  authTag: string;
  version: string;
  timestamp: string;
}

export interface EncryptionParams {
  message: string;
  password: string;
  salt?: string;
  iv?: string;
}

export interface DecryptionParams {
  encryptedData: string;
  password: string;
}

// EXIF Field Manipulation Interface
export interface ExifField {
  name: string;
  value: string;
  description: string;
  maxLength: number;
  isEditable: boolean;
}

export interface ExifManipulation {
  field: ExifField;
  operation: 'inject' | 'extract' | 'read';
  data?: string;
  success: boolean;
  error?: string;
}

export interface ExifData {
  userComment?: string;
  imageDescription?: string;
  artist?: string;
  copyright?: string;
  software?: string;
  dateTime?: string;
  [key: string]: string | undefined;
}

// Animation Variants Interface
export interface AnimationVariant {
  name: string;
  duration: number;
  easing: string;
  properties: Record<string, any>;
}

export interface AnimationConfig {
  entrance: AnimationVariant;
  exit: AnimationVariant;
  transition: AnimationVariant;
}

export interface AnimationState {
  isAnimating: boolean;
  currentAnimation: string | null;
  reducedMotion: boolean;
}

// File Processing Interface
export interface ProcessedData {
  imageData: string | ArrayBuffer;
  filename: string;
  metadata: {
    stegoData?: string;
    timestamp: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
  };
}

// Error Handling Interface
export interface AppError {
  code: string;
  message: string;
  details?: string;
  recoverable: boolean;
}

// Platform Abstraction Interface
export interface PlatformAdapter {
  fileSystem: {
    pickImage(): Promise<File | null>;
    saveImage(data: ProcessedData): Promise<boolean>;
    shareImage(data: ProcessedData): Promise<boolean>;
  };
  crypto: {
    encrypt(params: EncryptionParams): Promise<CryptoResult>;
    decrypt(params: DecryptionParams): Promise<CryptoResult>;
    generateSalt(): string;
    generateIV(): string;
  };
  exif: {
    readExif(file: File): Promise<ExifData>;
    writeExif(file: File, data: ExifData): Promise<File>;
    injectPayload(file: File, field: string, payload: string): Promise<File>;
    extractPayload(file: File, field: string): Promise<string | null>;
  };
  ui: {
    showToast(message: string, type: 'success' | 'error' | 'info'): void;
    showHapticFeedback(): void;
    showLoading(show: boolean): void;
  };
}

// Validation Interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PasswordStrength {
  score: number;
  level: 'weak' | 'medium' | 'strong';
  feedback: string[];
}

// Logging Interface
export interface LogEntry {
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  component: string;
  message: string;
  correlationId?: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

// Security Interface
export interface SecurityConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  maxMessageLength: number;
  minPasswordLength: number;
  maxPasswordLength: number;
  encryptionIterations: number;
  keySize: number;
} 