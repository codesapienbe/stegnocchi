/**
 * Structured logging utility for EXIF Steganography App
 * JSON format with consistent fields for monitoring/alerting systems
 */

import { LogEntry } from '../types';

// Log levels
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

// Component names for consistent logging
export enum Component {
  CRYPTO = 'crypto',
  EXIF = 'exif',
  FILE_SYSTEM = 'file_system',
  UI = 'ui',
  VALIDATION = 'validation',
  STEGANOGRAPHY = 'steganography',
  APP = 'app'
}

// Global correlation ID for request tracking
let currentCorrelationId: string | null = null;
let currentUserId: string | null = null;
let currentRequestId: string | null = null;

/**
 * Generate a unique correlation ID
 */
function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize sensitive data from log entries
 */
function sanitizeData(data: any): any {
  if (typeof data === 'string') {
    // Remove common sensitive patterns
    return data
      .replace(/password["\s]*[:=]["\s]*[^"\s,}]+/gi, 'password: "[REDACTED]"')
      .replace(/token["\s]*[:=]["\s]*[^"\s,}]+/gi, 'token: "[REDACTED]"')
      .replace(/key["\s]*[:=]["\s]*[^"\s,}]+/gi, 'key: "[REDACTED]"')
      .replace(/secret["\s]*[:=]["\s]*[^"\s,}]+/gi, 'secret: "[REDACTED]"')
      .replace(/salt["\s]*[:=]["\s]*[^"\s,}]+/gi, 'salt: "[REDACTED]"')
      .replace(/iv["\s]*[:=]["\s]*[^"\s,}]+/gi, 'iv: "[REDACTED]"');
  }
  return data;
}

/**
 * Create a structured log entry
 */
function createLogEntry(
  level: LogLevel,
  component: Component,
  message: string,
  metadata?: Record<string, any>
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    component,
    message: sanitizeData(message),
    correlationId: currentCorrelationId,
    userId: currentUserId,
    requestId: currentRequestId,
    metadata: metadata ? sanitizeData(metadata) : undefined
  };
}

/**
 * Write log entry to application.log
 */
function writeToLog(entry: LogEntry): void {
  try {
    // In a real implementation, this would write to application.log
    // For now, we'll use console.log with JSON formatting
    const logString = JSON.stringify(entry, null, 2);
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.INFO:
        console.info(logString);
        break;
      case LogLevel.DEBUG:
        console.debug(logString);
        break;
    }
  } catch (error) {
    // Fallback logging if JSON serialization fails
    console.error('Logging error:', error);
    console.log(`[${entry.level}] ${entry.component}: ${entry.message}`);
  }
}

/**
 * Set correlation context for request tracking
 */
export function setCorrelationContext(
  correlationId?: string,
  userId?: string,
  requestId?: string
): void {
  currentCorrelationId = correlationId || generateCorrelationId();
  currentUserId = userId || null;
  currentRequestId = requestId || generateRequestId();
}

/**
 * Clear correlation context
 */
export function clearCorrelationContext(): void {
  currentCorrelationId = null;
  currentUserId = null;
  currentRequestId = null;
}

/**
 * Log error level message
 */
export function logError(
  component: Component,
  message: string,
  metadata?: Record<string, any>
): void {
  const entry = createLogEntry(LogLevel.ERROR, component, message, metadata);
  writeToLog(entry);
}

/**
 * Log warning level message
 */
export function logWarn(
  component: Component,
  message: string,
  metadata?: Record<string, any>
): void {
  const entry = createLogEntry(LogLevel.WARN, component, message, metadata);
  writeToLog(entry);
}

/**
 * Log info level message
 */
export function logInfo(
  component: Component,
  message: string,
  metadata?: Record<string, any>
): void {
  const entry = createLogEntry(LogLevel.INFO, component, message, metadata);
  writeToLog(entry);
}

/**
 * Log debug level message
 */
export function logDebug(
  component: Component,
  message: string,
  metadata?: Record<string, any>
): void {
  const entry = createLogEntry(LogLevel.DEBUG, component, message, metadata);
  writeToLog(entry);
}

/**
 * Log application startup
 */
export function logAppStartup(version: string, environment: string): void {
  logInfo(Component.APP, 'Application startup initiated', {
    version,
    environment,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log application shutdown
 */
export function logAppShutdown(reason: string): void {
  logInfo(Component.APP, 'Application shutdown initiated', {
    reason,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log cryptographic operation
 */
export function logCryptoOperation(
  operation: 'encrypt' | 'decrypt',
  success: boolean,
  metadata?: Record<string, any>
): void {
  const message = `Cryptographic ${operation} operation ${success ? 'completed successfully' : 'failed'}`;
  const level = success ? LogLevel.INFO : LogLevel.ERROR;
  
  const entry = createLogEntry(level, Component.CRYPTO, message, {
    operation,
    success,
    ...metadata
  });
  writeToLog(entry);
}

/**
 * Log EXIF operation
 */
export function logExifOperation(
  operation: 'read' | 'write' | 'inject' | 'extract',
  fieldName: string,
  success: boolean,
  metadata?: Record<string, any>
): void {
  const message = `EXIF ${operation} operation on field '${fieldName}' ${success ? 'completed successfully' : 'failed'}`;
  const level = success ? LogLevel.INFO : LogLevel.ERROR;
  
  const entry = createLogEntry(level, Component.EXIF, message, {
    operation,
    fieldName,
    success,
    ...metadata
  });
  writeToLog(entry);
}

/**
 * Log file operation
 */
export function logFileOperation(
  operation: 'upload' | 'download' | 'save' | 'share',
  fileName: string,
  success: boolean,
  metadata?: Record<string, any>
): void {
  const message = `File ${operation} operation for '${fileName}' ${success ? 'completed successfully' : 'failed'}`;
  const level = success ? LogLevel.INFO : LogLevel.ERROR;
  
  const entry = createLogEntry(level, Component.FILE_SYSTEM, message, {
    operation,
    fileName,
    success,
    ...metadata
  });
  writeToLog(entry);
}

/**
 * Log validation result
 */
export function logValidation(
  component: Component,
  isValid: boolean,
  errors: string[],
  warnings: string[],
  metadata?: Record<string, any>
): void {
  const message = `Validation ${isValid ? 'passed' : 'failed'} with ${errors.length} errors and ${warnings.length} warnings`;
  const level = isValid ? LogLevel.INFO : LogLevel.WARN;
  
  const entry = createLogEntry(level, component, message, {
    isValid,
    errorCount: errors.length,
    warningCount: warnings.length,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
    ...metadata
  });
  writeToLog(entry);
}

/**
 * Log user interaction
 */
export function logUserInteraction(
  action: string,
  success: boolean,
  metadata?: Record<string, any>
): void {
  const message = `User interaction '${action}' ${success ? 'completed successfully' : 'failed'}`;
  const level = success ? LogLevel.INFO : LogLevel.WARN;
  
  const entry = createLogEntry(level, Component.UI, message, {
    action,
    success,
    ...metadata
  });
  writeToLog(entry);
}

/**
 * Log performance metric
 */
export function logPerformance(
  operation: string,
  durationMs: number,
  metadata?: Record<string, any>
): void {
  const message = `Performance metric for operation '${operation}': ${durationMs}ms`;
  
  const entry = createLogEntry(LogLevel.INFO, Component.APP, message, {
    operation,
    durationMs,
    ...metadata
  });
  writeToLog(entry);
}

/**
 * Log security event
 */
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  metadata?: Record<string, any>
): void {
  const message = `Security event: ${event}`;
  const level = severity === 'critical' || severity === 'high' ? LogLevel.ERROR : LogLevel.WARN;
  
  const entry = createLogEntry(level, Component.APP, message, {
    securityEvent: event,
    severity,
    ...metadata
  });
  writeToLog(entry);
}

/**
 * Log business KPI
 */
export function logBusinessKPI(
  kpi: string,
  value: number,
  unit: string,
  metadata?: Record<string, any>
): void {
  const message = `Business KPI '${kpi}': ${value} ${unit}`;
  
  const entry = createLogEntry(LogLevel.INFO, Component.APP, message, {
    kpi,
    value,
    unit,
    ...metadata
  });
  writeToLog(entry);
} 