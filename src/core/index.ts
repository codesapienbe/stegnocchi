/**
 * Core Module Index
 * Exports all core functionality with no DOM/node dependencies
 */

// Core functionality
export * from './crypto';
export * from './exif';
export * from './logger';
export * from './validation';

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