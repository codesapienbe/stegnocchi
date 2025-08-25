/**
 * Core Configuration
 * Central configuration for core module functionality
 */

export interface CoreConfig {
  // Cryptography settings
  crypto: {
    defaultKdfAlgorithm: 'argon2id' | 'scrypt';
    defaultKdfIterations: number;
    defaultMemoryCostKB: number;
    defaultSaltLength: number;
    defaultKeyLength: number;
  };
  
  // Vector processing settings
  vectors: {
    defaultDimensions: number;
    maxVectorSize: number;
    defaultSimilarityThreshold: number;
    compressionLevel: number;
  };
  
  // Image processing settings
  images: {
    maxFileSize: number;
    supportedFormats: string[];
    defaultQuality: number;
    maxDimensions: { width: number; height: number };
  };
  
  // AI model settings
  ai: {
    defaultModelPath: string;
    maxModelSize: number;
    inferenceTimeout: number;
    batchSize: number;
  };
  
  // Security settings
  security: {
    rateLimitRequests: number;
    rateLimitWindow: number;
    auditLogLevel: 'minimal' | 'standard' | 'verbose';
    encryptionAtRest: boolean;
  };
  
  // Performance settings
  performance: {
    maxConcurrentTasks: number;
    taskTimeout: number;
    memoryThreshold: number;
    enableCaching: boolean;
  };
}

export const DEFAULT_CORE_CONFIG: CoreConfig = {
  crypto: {
    defaultKdfAlgorithm: 'argon2id',
    defaultKdfIterations: 100000,
    defaultMemoryCostKB: 65536, // 64MB
    defaultSaltLength: 32,
    defaultKeyLength: 32,
  },
  
  vectors: {
    defaultDimensions: 512,
    maxVectorSize: 10485760, // 10MB
    defaultSimilarityThreshold: 0.8,
    compressionLevel: 6,
  },
  
  images: {
    maxFileSize: 52428800, // 50MB
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    defaultQuality: 0.9,
    maxDimensions: { width: 8192, height: 8192 },
  },
  
  ai: {
    defaultModelPath: '/models/',
    maxModelSize: 104857600, // 100MB
    inferenceTimeout: 30000, // 30 seconds
    batchSize: 32,
  },
  
  security: {
    rateLimitRequests: 100,
    rateLimitWindow: 60000, // 1 minute
    auditLogLevel: 'standard',
    encryptionAtRest: true,
  },
  
  performance: {
    maxConcurrentTasks: 8,
    taskTimeout: 60000, // 1 minute
    memoryThreshold: 536870912, // 512MB
    enableCaching: true,
  },
};

let currentConfig: CoreConfig = { ...DEFAULT_CORE_CONFIG };

export function getCoreConfig(): CoreConfig {
  return currentConfig;
}

export function updateCoreConfig(updates: Partial<CoreConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...updates,
    crypto: { ...currentConfig.crypto, ...updates.crypto },
    vectors: { ...currentConfig.vectors, ...updates.vectors },
    images: { ...currentConfig.images, ...updates.images },
    ai: { ...currentConfig.ai, ...updates.ai },
    security: { ...currentConfig.security, ...updates.security },
    performance: { ...currentConfig.performance, ...updates.performance },
  };
}

export function resetCoreConfig(): void {
  currentConfig = { ...DEFAULT_CORE_CONFIG };
}

// Environment-specific configurations
export function getEnvironmentConfig(env: 'development' | 'production' | 'test'): Partial<CoreConfig> {
  switch (env) {
    case 'development':
      return {
        security: { auditLogLevel: 'verbose' },
        performance: { enableCaching: false },
        crypto: { defaultKdfIterations: 10000 }, // Faster for dev
      };
    case 'production':
      return {
        security: { auditLogLevel: 'minimal', encryptionAtRest: true },
        performance: { enableCaching: true },
        crypto: { defaultKdfIterations: 200000 }, // More secure for prod
      };
    case 'test':
      return {
        security: { auditLogLevel: 'verbose', rateLimitRequests: 1000 },
        performance: { enableCaching: false, maxConcurrentTasks: 1 },
        crypto: { defaultKdfIterations: 1000 }, // Fast for testing
      };
    default:
      return {};
  }
} 