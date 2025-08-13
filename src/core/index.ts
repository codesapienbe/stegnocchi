/**
 * Core Module Index
 * Exports all core functionality with no DOM/node dependencies
 */

// Core functionality
export * from './crypto';
export * from './exif';
export * from './logger';
export * from './validation';
export * from './vectorMetadata';
export * from './compression';
export * from './chunkedCrypto';
export * from './exifVector';
export * from './jpgv';
export * from './storageStrategy';
export * from './exifConfig';
export * from './secureMetadata';
export * from './secureDeletion';
export * from './secureClipboard';
export * from './kdf';
export * from './auditLog';
export * from './vectorSearch';
export * from './similarityConfig';
export * from './vectorIndexing';
export * from './vectorFilters';
export * from './vectorPrivacy';
export * from './vectorExtraction';
export * from './vectorVersioning';
export * from './vectorMerging';
export * from './vectorTemplates';
export * from './vectorFormatValidation';
export * from './modelRegistry';
export * from './vectorCompression';
export * from './vectorStats';
export * from './vectorDB';
export * from './taskQueue';
export * from './modelPipeline';
export * from './ai/face';
export * from './ai/object';
export * from './ai/scene';
export * from './ai/loaders/face';
export * from './ai/loaders/object';
export * from './ai/loaders/scene';
export * from './tracing';
export * from './secureConfig';
export * from './errorHandling';
export * from './backup';
export * from './cryptoPlugins';
export * from './hsm';
export * from './certPinning';
export * from './mfa';
export * from './secureEnclave';
export * from './infrastructureMonitoring';
export * from './syntheticMonitoring';
export * from './performanceBottleneck';
export * from './userExperienceMonitoring';
export * from './incidentResponse';
export * from './healthChecks';
export * from './capacityPlanning';
export * from './slaMonitoring';
export * from './costOptimization';

// Production-ready features
export * from './rateLimiter';
export * from './secureStorage';
export * from './fileValidation';
export * from './i18n';
export * from './accessibility';
export * from './theme';
export * from './platformOptimizations';
export * from './hardwareAcceleration';
export * from './foldableSupport';
export * from './testingFramework';
export * from './performanceTesting';
export * from './securityTesting';
export * from './securityCompliance';
export * from './zeroKnowledge';
export * from './hardwareSecurity';
export * from './performanceOptimization';
export * from './cdnIntegration';
export * from './applicationMonitoring';
export * from './realTimeAnalytics';
export * from './ciCdPipeline';
export * from './infrastructureAsCode';
export * from './documentationSystem';
export * from './helpSystem';
export * from './reportingSystem';
export * from './insightsEngine';

// Types exports
export type {
  AppState,
  CryptoResult,
  CryptoMetadata,
  EncryptionParams,
  DecryptionParams,
  ExifField,
  ExifManipulation,
  ExifData,
  AnimationVariant,
  AnimationConfig,
  AnimationState,
  ProcessedData,
  AppError,
  PlatformAdapter,
  ValidationResult,
  PasswordStrength,
  LogEntry,
  SecurityConfig,
} from '../types'; 