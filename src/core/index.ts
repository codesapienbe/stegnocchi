/**
 * Core Module Index
 * Exports all core functionality with no DOM/node dependencies
 */

// Crypto module exports
export {
  encryptMessage,
  decryptMessage,
  validatePasswordStrength,
  clearSensitiveData,
  generateSalt,
  generateIV,
  stringToArrayBuffer,
  arrayBufferToString,
  getSecurityConfig,
} from './crypto';

// Rate limiter exports
export {
  cryptoRateLimiter,
  RateLimiter,
  RateLimitConfig,
  RateLimitResult,
  RateLimitEntry,
} from './rateLimiter';

// Secure storage exports
export {
  secureStorage,
  SecureStorage,
  SecureStorageConfig,
  SecureStorageResult,
  SecureStorageItem,
} from './secureStorage';

// Enhanced file validation exports
export {
  validateFile,
  validateFileForProcessing,
  FileValidationConfig,
  FileValidationResult,
  FileMetadata,
} from './fileValidation';

// Internationalization exports
export {
  i18n,
  I18nConfig,
  TranslationData,
  I18nInstance,
} from './i18n';

// Accessibility exports
export {
  accessibilityManager,
  AccessibilityConfig,
  AccessibilityFeatures,
  AccessibilityAction,
  AccessibilityProps,
} from './accessibility';

// Theme exports
export {
  themeManager,
  ColorPalette,
  Typography,
  Spacing,
  BorderRadius,
  Theme,
  ThemeMode,
} from './theme';

// Platform optimizations exports
export {
  platformOptimizations,
  DeviceCapabilities,
  PerformanceConfig,
  FoldableDeviceInfo,
} from './platformOptimizations';

// Hardware acceleration exports
export {
  hardwareAcceleration,
  HardwareAccelerationConfig,
  WebGLContext,
  WebGPUContext,
  WorkerPool,
} from './hardwareAcceleration';

// Foldable support exports
export {
  foldableSupport,
  FoldableConfig,
  ScreenInfo,
  FoldableState,
  LayoutConfig,
} from './foldableSupport';

// Testing framework exports
export {
  testingFramework,
  TestConfig,
  TestResult,
  CoverageReport,
  PerformanceMetrics,
  SecurityReport,
  LoadTestResult,
} from './testingFramework';

// Performance testing exports
export {
  performanceTesting,
  PerformanceTestConfig,
  BenchmarkResult,
  MemoryProfile,
  CPUProfile,
  NetworkProfile,
  RenderingProfile,
  BundleProfile,
} from './performanceTesting';

// Security testing exports
export {
  securityTesting,
  SecurityTestConfig,
  VulnerabilityReport,
  DependencyVulnerability,
  CodeSecurityIssue,
  RuntimeSecurityEvent,
  ComplianceReport,
  PenetrationTestResult,
} from './securityTesting';

// Security compliance exports
export {
  securityCompliance,
  ComplianceConfig,
  ComplianceAudit,
  ComplianceFinding,
  DataProcessingRecord,
  DataSubjectRequest,
  BreachNotification,
  PrivacyImpactAssessment,
} from './securityCompliance';

// Zero-knowledge exports
export {
  zeroKnowledge,
  ZeroKnowledgeConfig,
  ZeroKnowledgeProof,
  PrivacyPreservingData,
  VerifiableComputation,
  RingSignature,
  HomomorphicOperation,
} from './zeroKnowledge';

// Hardware security exports
export {
  hardwareSecurity,
  HardwareSecurityConfig,
  SecureKey,
  BiometricCredential,
  SecureAttestation,
  SecureBoot,
  TamperDetection,
  SecureOperation,
} from './hardwareSecurity';

// Performance optimization exports
export {
  performanceOptimization,
  PerformanceOptimizationConfig,
  CacheEntry,
  CompressionResult,
  LazyLoadResult,
  CDNResult,
  BundleAnalysis,
  PerformanceMetrics,
} from './performanceOptimization';

// CDN integration exports
export {
  cdnIntegration,
  CDNConfig,
  CDNProvider,
  CDNEndpoint,
  CDNRequest,
  CDNAnalytics,
  EdgeFunction,
  CDNCache,
} from './cdnIntegration';

// Application monitoring exports
export {
  applicationMonitoring,
  APMConfig,
  APMMetric,
  APMError,
  APMTrace,
  APMAlert,
  APMDashboard,
  UserExperienceMetric,
  BusinessMetric,
} from './applicationMonitoring';

// Real-time analytics exports
export {
  realTimeAnalytics,
  RealTimeAnalyticsConfig,
  AnalyticsEvent,
  UserBehavior,
  RealTimeDashboard,
  AnomalyDetection,
  UserSegment,
  Prediction,
} from './realTimeAnalytics';

// CI/CD pipeline exports
export {
  ciCdPipeline,
  CICDConfig,
  PipelineStage,
  PipelineStep,
  PipelineArtifact,
  PipelineLog,
  BuildResult,
  TestResult,
  DeploymentResult,
  HealthCheck,
  QualityGate,
} from './ciCdPipeline';

// Infrastructure as code exports
export {
  infrastructureAsCode,
  InfrastructureConfig,
  InfrastructureResource,
  InfrastructureTemplate,
  DeploymentEnvironment,
  ScalingPolicy,
  BackupPolicy,
  SecurityGroup,
  CostAnalysis,
} from './infrastructureAsCode';

// EXIF module exports
export {
  readExifData,
  writeExifData,
  injectPayload,
  extractPayload,
  getAvailableFields,
  STEGANOGRAPHY_FIELDS,
} from './exif';

// Validation module exports
export {
  validateFile,
  validatePassword,
  validateMessage,
  validateJpegIntegrity,
  validateExifData,
  validateDecryptionAttempt,
  validateSteganographyOperation,
} from './validation';

// Logger module exports
export {
  setCorrelationContext,
  logError,
  logWarn,
  logInfo,
  logDebug,
  logAppStartup,
  logAppShutdown,
  logUserInteraction,
  logCryptoOperation,
  logExifOperation,
  logFileOperation,
  logValidation,
  LogLevel,
  Component,
} from './logger';

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