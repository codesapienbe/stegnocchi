import { logInfo, logWarn, logError, Component } from './logger';
import { startIncidentResponse, ingestCustomIncident } from './incidentResponse';
import { getLastInfraSnapshot } from './infrastructureMonitoring';
import { vectorDb } from './vectorDB';
import { modelRegistry } from './modelRegistry';
import { backgroundTasks } from './taskQueue';
import { isPinningActive, pinnedFetch } from './certPinning';

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';

export interface HealthReport {
  id: string;
  name: string;
  status: HealthStatus;
  timestamp: string;
  message?: string;
  metrics?: Record<string, any>;
}

export interface HealthCheck {
  id: string;
  name: string;
  intervalMs?: number; // default 60s
  run: () => Promise<HealthReport>;
}

type ReportSink = (report: HealthReport) => void | Promise<void>;

type Timer = any;

const checks: Map<string, HealthCheck> = new Map();
const timers: Map<string, Timer> = new Map();
const lastReports: Map<string, HealthReport> = new Map();
const sinks: ReportSink[] = [];

const DEFAULT_INTERVAL = 60_000;

export function registerHealthCheck(check: HealthCheck): void {
  if (!check || !check.id) throw new Error('Invalid health check');
  checks.set(check.id, { ...check, intervalMs: Math.max(5_000, check.intervalMs || DEFAULT_INTERVAL) });
  logInfo(Component.APP, 'Health check registered', { id: check.id, name: check.name, intervalMs: check.intervalMs || DEFAULT_INTERVAL });
}

export function unregisterHealthCheck(id: string): void {
  stopHealthCheck(id);
  checks.delete(id);
  lastReports.delete(id);
  logInfo(Component.APP, 'Health check unregistered', { id });
}

export function registerHealthSink(sink: ReportSink): void { sinks.push(sink); }
export function unregisterHealthSink(sink: ReportSink): void { const i = sinks.indexOf(sink); if (i >= 0) sinks.splice(i, 1); }

async function emit(report: HealthReport): Promise<void> {
  lastReports.set(report.id, report);
  for (const sink of sinks) {
    try {
      const r = sink(report);
      if (r && typeof (r as any).then === 'function') (r as Promise<void>).catch(() => {});
    } catch {}
  }
}

export function getHealthReport(id: string): HealthReport | null { return lastReports.get(id) || null; }
export function listHealthReports(): HealthReport[] { return Array.from(lastReports.values()); }

async function runOnce(id: string): Promise<void> {
  const check = checks.get(id);
  if (!check) return;
  try {
    const rep = await check.run();
    await emit(rep);
    if (rep.status === 'UNHEALTHY') {
      logWarn(Component.APP, 'Health check detected UNHEALTHY', { id: check.id, name: check.name, message: rep.message });
      ingestCustomIncident('ERROR', `Health check failed: ${check.name}`, { id: check.id, ...rep.metrics });
      scheduleSelfHealing(check, rep);
    } else if (rep.status === 'DEGRADED') {
      logWarn(Component.APP, 'Health check detected DEGRADED', { id: check.id, name: check.name, message: rep.message });
    } else {
      logInfo(Component.APP, 'Health check OK', { id: check.id, name: check.name });
    }
  } catch (e) {
    logError(Component.APP, 'Health check run error', { id, error: e instanceof Error ? e.message : String(e) });
  }
}

function startTimerForCheck(id: string, intervalMs: number): void {
  if (timers.has(id)) return;
  const t = setInterval(() => { runOnce(id).catch(() => {}); }, Math.max(5_000, intervalMs));
  timers.set(id, t);
}

function stopHealthCheck(id: string): void {
  const t = timers.get(id);
  if (t) clearInterval(t);
  timers.delete(id);
}

export function startHealthMonitoring(): void {
  startIncidentResponse();
  for (const c of checks.values()) startTimerForCheck(c.id, c.intervalMs || DEFAULT_INTERVAL);
  logInfo(Component.APP, 'Health monitoring started', { checks: checks.size });
}

export function stopHealthMonitoring(): void {
  for (const id of timers.keys()) stopHealthCheck(id);
  logInfo(Component.APP, 'Health monitoring stopped');
}

function scheduleSelfHealing(check: HealthCheck, report: HealthReport): void {
  try {
    backgroundTasks.enqueue({
      id: `heal_${check.id}_${Date.now()}`,
      priority: 'high',
      run: async () => {
        // Minimal self-healing: reload models and nudge vector DB cache; add more as needed
        try {
          await safeReloadModels();
        } catch {}
        try {
          await vectorDb.getProvider().count();
        } catch {}
      },
    });
    logInfo(Component.APP, 'Self-healing task scheduled', { checkId: check.id });
  } catch {}
}

async function safeReloadModels(): Promise<void> {
  const status = modelRegistry.status();
  for (const s of status) {
    if (s.cached) {
      try { (modelRegistry as any).unload(s.name); } catch {}
    }
    try {
      await modelRegistry.get(s.name);
    } catch {}
  }
}

// Default built-in checks
registerHealthCheck({
  id: 'infra-memory',
  name: 'Memory usage',
  intervalMs: 45_000,
  run: async () => {
    const snap = getLastInfraSnapshot();
    const used = snap?.memory?.jsHeapUsedBytes || 0;
    const total = snap?.memory?.jsHeapTotalBytes || 0;
    const ratio = total > 0 ? used / total : 0;
    const status: HealthStatus = ratio > 0.9 ? 'UNHEALTHY' : ratio > 0.75 ? 'DEGRADED' : 'HEALTHY';
    return { id: 'infra-memory', name: 'Memory usage', status, timestamp: new Date().toISOString(), metrics: { used, total, ratio } };
  },
});

registerHealthCheck({
  id: 'vector-db',
  name: 'Vector DB availability',
  intervalMs: 60_000,
  run: async () => {
    try {
      const count = await vectorDb.getProvider().count();
      return { id: 'vector-db', name: 'Vector DB availability', status: 'HEALTHY', timestamp: new Date().toISOString(), metrics: { count } };
    } catch (e) {
      return { id: 'vector-db', name: 'Vector DB availability', status: 'UNHEALTHY', timestamp: new Date().toISOString(), message: e instanceof Error ? e.message : String(e) };
    }
  },
});

registerHealthCheck({
  id: 'network',
  name: 'Outbound network',
  intervalMs: 120_000,
  run: async () => {
    if (typeof fetch !== 'function') return { id: 'network', name: 'Outbound network', status: 'DEGRADED', timestamp: new Date().toISOString(), message: 'fetch unavailable' };
    const url = 'https://example.com/';
    const started = Date.now();
    try {
      const doFetch = isPinningActive() ? pinnedFetch : (fetch as any);
      const res: Response = await doFetch(url, { method: 'HEAD' });
      const latency = Date.now() - started;
      const ok = res.status >= 200 && res.status <= 399;
      const status: HealthStatus = ok ? (latency > 2000 ? 'DEGRADED' : 'HEALTHY') : 'UNHEALTHY';
      return { id: 'network', name: 'Outbound network', status, timestamp: new Date().toISOString(), metrics: { statusCode: res.status, latency } };
    } catch (e) {
      return { id: 'network', name: 'Outbound network', status: 'UNHEALTHY', timestamp: new Date().toISOString(), message: e instanceof Error ? e.message : String(e) };
    }
  },
}); 