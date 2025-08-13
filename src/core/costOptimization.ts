import { logInfo, logWarn, Component } from './logger';
import { registerInfraSink, InfraMetricsSnapshot } from './infrastructureMonitoring';
import { registerSyntheticSink, SyntheticResult } from './syntheticMonitoring';
import { backgroundTasks } from './taskQueue';

export interface OptimizationRecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  action?: () => Promise<void> | void;
}

export interface CostSummary {
  timestamp: string;
  estNetworkCostPerHourUsd?: number;
  estCpuCostPerHourUsd?: number;
  estTotalPerHourUsd?: number;
  recommendations: OptimizationRecommendation[];
}

type CostSink = (summary: CostSummary) => void | Promise<void>;

const sinks: CostSink[] = [];
let started = false;

// Rolling aggregates
const networkLatencies: number[] = [];
let requestCount = 0;
let longLatencyCount = 0;
const memRatios: number[] = [];

export function registerCostSink(sink: CostSink): void { sinks.push(sink); }
export function unregisterCostSink(sink: CostSink): void { const i = sinks.indexOf(sink); if (i >= 0) sinks.splice(i, 1); }

function p95(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const arr = values.slice().sort((a, b) => a - b);
  const idx = Math.min(arr.length - 1, Math.floor(0.95 * arr.length));
  return arr[idx];
}

function emit(summary: CostSummary): void {
  for (const s of sinks) {
    try {
      const r = s(summary);
      if (r && typeof (r as any).then === 'function') (r as Promise<void>).catch(() => {});
    } catch {}
  }
}

function estimateCosts(): { netUsd?: number; cpuUsd?: number; totalUsd?: number } {
  // Heuristics: assume each outbound request costs negligible but reflects egress (0.000001 USD/request)
  // CPU proxy via memory ratio average (rough): 0.01 USD/hour at low usage scaling up linearly
  const requestsPerHour = requestCount * 60; // if synthetic roughly once per minute; adjust heuristically
  const netUsd = Math.round(requestsPerHour * 0.000001 * 1000000) / 1000000;
  const avgMem = memRatios.length > 0 ? memRatios.reduce((a, b) => a + b, 0) / memRatios.length : 0;
  const cpuUsd = Math.round((0.01 + 0.09 * avgMem) * 1000) / 1000;
  const totalUsd = Math.round(((netUsd || 0) + (cpuUsd || 0)) * 1000) / 1000;
  return { netUsd, cpuUsd, totalUsd };
}

function buildRecommendations(): OptimizationRecommendation[] {
  const recs: OptimizationRecommendation[] = [];
  const p95Latency = p95(networkLatencies) || 0;
  const avgMem = memRatios.length > 0 ? memRatios.reduce((a, b) => a + b, 0) / memRatios.length : 0;

  if (p95Latency > 1500 || longLatencyCount > 5) {
    recs.push({
      id: 'enable_pinning_and_retry',
      title: 'Enable request pinning and backoff/retry',
      description: 'High network latency detected. Ensure certificate pinning uses efficient endpoints and add exponential backoff to reduce wasted retries.',
      impact: 'MEDIUM',
    });
  }

  if (avgMem > 0.75) {
    recs.push({
      id: 'reduce_concurrency',
      title: 'Reduce background task concurrency',
      description: 'High memory pressure observed. Lower TaskQueue concurrency and batch image processing to reduce peak memory and CPU.',
      impact: 'HIGH',
      action: async () => {
        try { backgroundTasks.pause(); } catch {}
      },
    });
  }

  if ((p95Latency > 800 && avgMem > 0.6) || (networkLatencies.length > 100 && p95Latency > 1200)) {
    recs.push({
      id: 'enable_vector_compression',
      title: 'Enable vector compression and payload gzip',
      description: 'Network and memory pressure indicate large payloads. Turn on vector compression and gzip to reduce egress and processing time.',
      impact: 'MEDIUM',
    });
  }

  if (networkLatencies.length > 200 && p95Latency < 300 && avgMem < 0.5) {
    recs.push({
      id: 'increase_batching',
      title: 'Increase batching to improve efficiency',
      description: 'System headroom available. Increase batch sizes or prefetching to improve throughput per cost unit.',
      impact: 'LOW',
    });
  }

  return recs;
}

function onInfra(snap: InfraMetricsSnapshot): void {
  const used = snap.memory?.jsHeapUsedBytes || 0;
  const total = snap.memory?.jsHeapTotalBytes || 0;
  if (total > 0) memRatios.push(Math.min(1, used / total));
  while (memRatios.length > 600) memRatios.shift();
  computeAndEmit();
}

function onSynthetic(res: SyntheticResult): void {
  if (typeof res.latencyMs === 'number') {
    networkLatencies.push(Math.max(0, res.latencyMs));
    if (res.latencyMs > 1500) longLatencyCount++;
  }
  requestCount++;
  while (networkLatencies.length > 600) networkLatencies.shift();
  computeAndEmit();
}

function computeAndEmit(): void {
  const costs = estimateCosts();
  const recs = buildRecommendations();
  const summary: CostSummary = {
    timestamp: new Date().toISOString(),
    estNetworkCostPerHourUsd: costs.netUsd,
    estCpuCostPerHourUsd: costs.cpuUsd,
    estTotalPerHourUsd: costs.totalUsd,
    recommendations: recs,
  };
  emit(summary);
}

export function getCostSummary(): CostSummary {
  const costs = estimateCosts();
  return {
    timestamp: new Date().toISOString(),
    estNetworkCostPerHourUsd: costs.netUsd,
    estCpuCostPerHourUsd: costs.cpuUsd,
    estTotalPerHourUsd: costs.totalUsd,
    recommendations: buildRecommendations(),
  };
}

export function startCostOptimization(): void {
  if (started) {
    logWarn(Component.APP, 'Cost optimization already started');
    return;
  }
  registerInfraSink(onInfra);
  registerSyntheticSink(onSynthetic);
  started = true;
  logInfo(Component.APP, 'Cost optimization started');
}

export function stopCostOptimization(): void {
  started = false;
  logInfo(Component.APP, 'Cost optimization stopped');
} 