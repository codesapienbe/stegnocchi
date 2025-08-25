import { logInfo, logWarn, Component } from './logger';
import type { ValidationResult } from '../types';

export function validateVectorFormat(input: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const isObject = typeof input === 'object' && input !== null;
  if (!isObject) {
    errors.push('Input must be a non-null object');
  }

  // Best-effort basic checks without enforcing business rules
  if (isObject && typeof (input as any).version !== 'string') {
    warnings.push('Missing or non-string version field');
  }

  const result: ValidationResult = {
    isValid: errors.length === 0,
    errors,
    warnings,
  };

  if (result.isValid) {
    logInfo(Component.VALIDATION, 'Vector format validation passed', { warningCount: warnings.length });
  } else {
    logWarn(Component.VALIDATION, 'Vector format validation failed', { errorCount: errors.length, warningCount: warnings.length });
  }

  return result;
} 