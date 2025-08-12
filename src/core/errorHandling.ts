import { logError, Component } from './logger';

export interface UserErrorResponse {
  code: string;
  message: string;
  errorId: string;
  timestamp: string;
}

function generateErrorId(): string {
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeDetails(details: any): Record<string, any> {
  try {
    if (details == null) return {};
    // Shallow clone and remove common sensitive fields
    const clone: Record<string, any> = { ...(typeof details === 'object' ? details : { details }) };
    for (const key of Object.keys(clone)) {
      const low = key.toLowerCase();
      if (low.includes('password') || low.includes('token') || low.includes('secret') || low.includes('key') || low.includes('auth')) {
        clone[key] = '[REDACTED]';
      }
    }
    return clone;
  } catch {
    return {};
  }
}

export function buildUserError(
  code: string,
  userMessage: string,
  error: unknown,
  component: Component = Component.APP,
  details?: Record<string, any>
): UserErrorResponse {
  const errorId = generateErrorId();
  const timestamp = new Date().toISOString();

  const internalMessage = error instanceof Error ? error.message : String(error);
  const internalStack = error instanceof Error && error.stack ? error.stack.split('\n').slice(0, 5).join('\n') : undefined;

  logError(component, `Error (${code})`, {
    errorId,
    message: internalMessage,
    stack: internalStack,
    ...sanitizeDetails(details),
  });

  return {
    code,
    message: userMessage,
    errorId,
    timestamp,
  };
}

export function toUserErrorResponse(error: unknown, fallbackMessage = 'An unexpected error occurred. Please try again.'): UserErrorResponse {
  return buildUserError('UNEXPECTED_ERROR', fallbackMessage, error);
} 