import { logInfo, logWarn, logError, Component, setCorrelationContext, clearCorrelationContext } from './logger';

export interface TraceContext {
  traceId: string;
  userId?: string;
  requestId?: string;
}

export interface SpanHandle {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
}

let currentTrace: TraceContext | null = null;
let currentSpanStack: SpanHandle[] = [];

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function startTrace(userId?: string, requestId?: string): TraceContext {
  const traceId = generateId('trace');
  currentTrace = { traceId, userId, requestId };
  setCorrelationContext(traceId, userId, requestId);
  logInfo(Component.APP, 'Trace started', { traceId, userId, requestId });
  return { traceId, userId, requestId };
}

export function endTrace(reason?: string): void {
  if (!currentTrace) {
    logWarn(Component.APP, 'endTrace called without active trace', {});
    return;
  }
  const traceId = currentTrace.traceId;
  // Close any lingering spans
  while (currentSpanStack.length > 0) {
    const span = currentSpanStack.pop()!;
    logWarn(Component.APP, 'Span auto-closed at trace end', { traceId, spanId: span.spanId, name: span.name });
  }
  logInfo(Component.APP, 'Trace ended', { traceId, reason });
  currentTrace = null;
  clearCorrelationContext();
}

export function startSpan(name: string): SpanHandle {
  if (!currentTrace) startTrace();
  const span: SpanHandle = {
    traceId: currentTrace!.traceId,
    spanId: generateId('span'),
    parentSpanId: currentSpanStack.length > 0 ? currentSpanStack[currentSpanStack.length - 1].spanId : undefined,
    name,
    startTime: Date.now(),
  };
  currentSpanStack.push(span);
  logInfo(Component.APP, 'Span started', { traceId: span.traceId, spanId: span.spanId, parentSpanId: span.parentSpanId, name });
  return span;
}

export function endSpan(span: SpanHandle, success: boolean = true, metadata?: Record<string, any>): void {
  const idx = currentSpanStack.findIndex((s) => s.spanId === span.spanId);
  if (idx === -1) {
    logWarn(Component.APP, 'endSpan called for unknown span', { spanId: span.spanId, name: span.name });
    return;
  }
  // Remove this span and any nested spans above it (should not happen in well-formed usage)
  currentSpanStack = currentSpanStack.slice(0, idx);
  const durationMs = Date.now() - span.startTime;
  const base = { traceId: span.traceId, spanId: span.spanId, name: span.name, durationMs, ...metadata };
  if (success) logInfo(Component.APP, 'Span ended', base);
  else logWarn(Component.APP, 'Span ended with failure', base);
}

export async function withSpan<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
  const span = startSpan(name);
  try {
    const result = await fn();
    endSpan(span, true, metadata);
    return result;
  } catch (error) {
    endSpan(span, false, { ...(metadata || {}), error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
} 