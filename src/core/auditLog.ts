import { logInfo, logWarn, logError, Component } from './logger';

export type AuditEventType =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'ENCRYPT_START'
  | 'ENCRYPT_SUCCESS'
  | 'ENCRYPT_FAILURE'
  | 'DECRYPT_START'
  | 'DECRYPT_SUCCESS'
  | 'DECRYPT_FAILURE'
  | 'VECTOR_INJECT'
  | 'VECTOR_EXTRACT'
  | 'CONFIG_CHANGE'
  | 'SECURITY_ALERT';

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  timestamp: string;
  actor?: string; // user id or device id
  requestId?: string;
  correlationId?: string;
  details?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

const inMemoryAudit: AuditEvent[] = [];
const MAX_EVENTS = 1000;

export function recordAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
  const full: AuditEvent = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...event,
  };

  inMemoryAudit.push(full);
  if (inMemoryAudit.length > MAX_EVENTS) inMemoryAudit.shift();

  // Mirror to structured logger (sanitization already handled there)
  logInfo(Component.AUDIT, `Audit event: ${full.type}`, {
    id: full.id,
    type: full.type,
    actor: full.actor,
    requestId: full.requestId,
    correlationId: full.correlationId,
    severity: full.severity,
  });

  return full;
}

export function getRecentAuditEvents(limit: number = 100): AuditEvent[] {
  const n = Math.max(1, Math.min(limit, MAX_EVENTS));
  return inMemoryAudit.slice(-n);
}

export function startAuditSpan(spanType: string, context?: Record<string, any>): string {
  const spanId = `span_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  logInfo(Component.AUDIT, `Audit span started: ${spanType}`, { spanId, ...context });
  return spanId;
}

export function endAuditSpan(spanId: string, spanType: string, success: boolean, context?: Record<string, any>): void {
  const level = success ? logInfo : logWarn;
  level(Component.AUDIT, `Audit span ended: ${spanType}`, { spanId, success, ...context });
} 