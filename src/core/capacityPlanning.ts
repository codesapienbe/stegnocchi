import { logInfo, logWarn, Component } from './logger';
import { registerInfraSink, InfraMetricsSnapshot } from './infrastructureMonitoring';
import { registerSyntheticSink, SyntheticResult } from './syntheticMonitoring';

export interface MemoryForecast {
	ratioNow: number;
	ratioP95?: number;
	ratioForecast: number;
	risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface NetworkLatencySummary {
	avgMs?: number;
	p95Ms?: number;
	maxMs?: number;
	sampleCount: number;
}

export interface UptimeSummary {
	uptimePercent?: number;
	success: number;
	failure: number;
}

export interface CapacityReport {
	timestamp: string;
	horizonMinutes: number;
	memory: MemoryForecast;
	network: NetworkLatencySummary;
	uptime: UptimeSummary;
}

type CapacitySink = (report: CapacityReport) => void | Promise<void>;

const MAX_POINTS = 300;
const HORIZON_MINUTES = 60;

const sinks: CapacitySink[] = [];
let started = false;

const memRatios: number[] = [];
const netLatencies: number[] = [];
let successCount = 0;
let failureCount = 0;

export function registerCapacitySink(sink: CapacitySink): void { sinks.push(sink); }
export function unregisterCapacitySink(sink: CapacitySink): void { const i = sinks.indexOf(sink); if (i >= 0) sinks.splice(i, 1); }

function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }

function p95(values: number[]): number | undefined {
	if (values.length === 0) return undefined;
	const arr = values.slice().sort((a, b) => a - b);
	const idx = Math.min(arr.length - 1, Math.floor(0.95 * arr.length));
	return arr[idx];
}

function linearForecast(values: number[], stepsAhead: number): number | undefined {
	const n = values.length;
	if (n < 3) return undefined;
	let sumT = 0, sumY = 0, sumTT = 0, sumTY = 0;
	for (let t = 0; t < n; t++) {
		const y = values[t];
		sumT += t;
		sumY += y;
		sumTT += t * t;
		sumTY += t * y;
	}
	const denom = (n * sumTT - sumT * sumT);
	if (denom === 0) return undefined;
	const b = (n * sumTY - sumT * sumY) / denom;
	const a = (sumY - b * sumT) / n;
	const tFuture = n - 1 + stepsAhead;
	return a + b * tFuture;
}

function summarizeNetwork(latencies: number[]): NetworkLatencySummary {
	if (latencies.length === 0) return { sampleCount: 0 };
	const sorted = latencies.slice().sort((a, b) => a - b);
	const sum = sorted.reduce((s, v) => s + v, 0);
	const avg = Math.round(sum / sorted.length);
	const p = sorted[Math.min(sorted.length - 1, Math.floor(0.95 * sorted.length))];
	const max = sorted[sorted.length - 1];
	return { avgMs: avg, p95Ms: p, maxMs: max, sampleCount: sorted.length };
}

function memoryRisk(ratioNow: number, ratioForecast: number, ratioP95?: number): 'LOW' | 'MEDIUM' | 'HIGH' {
	const peak = Math.max(ratioNow, ratioForecast, typeof ratioP95 === 'number' ? ratioP95 : 0);
	if (peak >= 0.9) return 'HIGH';
	if (peak >= 0.75) return 'MEDIUM';
	return 'LOW';
}

function buildReport(): CapacityReport {
	const now = new Date();
	const ratioNow = memRatios.length > 0 ? memRatios[memRatios.length - 1] : 0;
	const ratioP = p95(memRatios);
	const pointsPerMinute = 2;
	const stepsAhead = Math.max(1, Math.round(pointsPerMinute * HORIZON_MINUTES));
	const lf = linearForecast(memRatios, stepsAhead);
	const ratioForecast = clamp01(typeof lf === 'number' ? lf : ratioNow);
	const risk = memoryRisk(ratioNow, ratioForecast, ratioP);

	const network = summarizeNetwork(netLatencies);
	const total = successCount + failureCount;
	const uptimePercent = total > 0 ? Math.round((successCount / total) * 100000) / 1000 : undefined;

	return {
		timestamp: now.toISOString(),
		horizonMinutes: HORIZON_MINUTES,
		memory: {
			ratioNow: clamp01(ratioNow),
			ratioP95: typeof ratioP === 'number' ? clamp01(ratioP) : undefined,
			ratioForecast,
			risk,
		},
		network,
		uptime: {
			uptimePercent,
			success: successCount,
			failure: failureCount,
		},
	};
}

function emit(report: CapacityReport): void {
	for (const s of sinks) {
		try {
			const r = s(report);
			if (r && typeof (r as any).then === 'function') (r as Promise<void>).catch(() => {});
		} catch {}
	}
}

function onInfra(snap: InfraMetricsSnapshot): void {
	const used = snap.memory?.jsHeapUsedBytes || 0;
	const total = snap.memory?.jsHeapTotalBytes || 0;
	if (total > 0) {
		memRatios.push(used / total);
		if (memRatios.length > MAX_POINTS) memRatios.shift();
	}
	const report = buildReport();
	emit(report);
}

function onSynthetic(res: SyntheticResult): void {
	if (typeof res.latencyMs === 'number') {
		netLatencies.push(Math.max(0, res.latencyMs));
		if (netLatencies.length > MAX_POINTS) netLatencies.shift();
	}
	if (res.success) successCount++; else failureCount++;
	if (successCount + failureCount > MAX_POINTS) {
		successCount = Math.round(successCount * 0.9);
		failureCount = Math.round(failureCount * 0.9);
	}
	const report = buildReport();
	emit(report);
}

export function getCapacityReport(): CapacityReport { return buildReport(); }

export function startCapacityPlanning(): void {
	if (started) { logWarn(Component.APP, 'Capacity planning already started'); return; }
	registerInfraSink(onInfra);
	registerSyntheticSink(onSynthetic);
	started = true;
	logInfo(Component.APP, 'Capacity planning started', { horizonMinutes: HORIZON_MINUTES });
}

export function stopCapacityPlanning(): void {
	started = false;
	logInfo(Component.APP, 'Capacity planning stopped');
} 