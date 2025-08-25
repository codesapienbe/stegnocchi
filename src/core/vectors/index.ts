/**
 * Core Vector Processing Sub-module
 * Centralized exports for all vector operations
 */

// Core vector operations
export * from '../vectorMetadata';
export * from '../vectorSearch';
export * from '../vectorIndexing';
export * from '../vectorFilters';
export * from '../vectorExtraction';
export * from '../vectorDB';

// Vector processing
export * from '../vectorPrivacy';
export * from '../vectorVersioning';
export * from '../vectorMerging';
export * from '../vectorTemplates';
export * from '../vectorFormatValidation';
export * from '../vectorCompression';
export * from '../vectorStats';

// Configuration
export * from '../similarityConfig';

// Re-export key types for convenience
export type { VectorMetadata, VectorSearchResult, SimilarityConfig } from '../vectorMetadata'; 