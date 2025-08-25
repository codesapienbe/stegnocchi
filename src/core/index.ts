/**
 * Core Module Index
 * Exports all core functionality with no DOM/node dependencies
 */

// ===== CORE CONFIGURATION =====
export * from './config';

// ===== CORE CRYPTOGRAPHY =====
export * from './crypto';
export * from './chunkedCrypto';
export * from './kdf';
export * from './secureDeletion';
export * from './secureClipboard';
export * from './secureMetadata';
export * from './secureConfig';
export * from './secureStorage';
export * from './secureEnclave';
export * from './mfa';
export * from './zeroKnowledge';
export * from './hardwareSecurity';
export * from './hsm';
export * from './cryptoPlugins';

// ===== IMAGE PROCESSING & STEGANOGRAPHY =====
export * from './exif';
export * from './exifConfig';
export * from './exifVector';
export * from './jpgv';
export * from './compression';

// ===== VECTOR OPERATIONS =====
export * from './vectorMetadata';
export * from './vectorSearch';
export * from './vectorIndexing';
export * from './vectorFilters';
export * from './vectorPrivacy';
export * from './vectorExtraction';
export * from './vectorVersioning';
export * from './vectorMerging';
export * from './vectorTemplates';
export * from './vectorFormatValidation';
export * from './vectorCompression';
export * from './vectorStats';
export * from './vectorDB';
export * from './similarityConfig';

// ===== AI & MACHINE LEARNING =====
export * from './ai/face';
export * from './ai/object';
export * from './ai/scene';
export * from './ai/loaders/face';
export * from './ai/loaders/object';
export * from './ai/loaders/scene';
export * from './ai/init';
export * from './ai/tfBackend';
export * from './modelRegistry';
export * from './modelPipeline';

// ===== SYSTEM & INFRASTRUCTURE =====
export * from './logger';
export * from './validation';
export * from './errorHandling';
export * from './auditLog';
export * from './tracing';
export * from './rateLimiter';
export * from './taskQueue';
export * from './platformStorage';
export * from './storageStrategy';
export * from './fileValidation';
export * from './integrityVerification';

// ===== MONITORING & ANALYTICS =====
export * from './applicationMonitoring';
export * from './performanceOptimization';
export * from './performanceTesting';
export * from './performanceBottleneck';
export * from './healthChecks';
export * from './slaMonitoring';
export * from './infrastructureMonitoring';
export * from './userExperienceMonitoring';
export * from './realTimeAnalytics';
export * from './predictiveAnalytics';
export * from './insightsEngine';
export * from './reportingSystem';
export * from './syntheticMonitoring';

// ===== SECURITY & COMPLIANCE =====
export * from './securityTesting';
export * from './securityCompliance';
export * from './certPinning';
export * from './incidentResponse';

// ===== DEVELOPMENT & TESTING =====
export * from './testingFramework';
export * from './documentationSystem';

// ===== PLATFORM OPTIMIZATION =====
export * from './platformOptimizations';
export * from './hardwareAcceleration';
export * from './foldableSupport';

// ===== BUSINESS FEATURES =====
export * from './i18n';
export * from './theme';
export * from './accessibility';
export * from './helpSystem';

// ===== DEVOPS & INFRASTRUCTURE =====
export * from './ciCdPipeline';
export * from './infrastructureAsCode';
export * from './backup';
export * from './capacityPlanning';
export * from './costOptimization';
export * from './cdnIntegration';

// Types exports
export type { ProcessedData, ImageMetadata } from '../types';

// ===== SUB-MODULE EXPORTS =====
// Alternative way to import grouped functionality
import * as CoreCrypto from './crypto';
import * as CoreVectors from './vectors';

export { CoreCrypto, CoreVectors }; 