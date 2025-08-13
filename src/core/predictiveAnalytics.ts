import { logInfo, logWarn, Component } from './logger';
import { registerInfraSink, InfraMetricsSnapshot } from './infrastructureMonitoring';
import { registerSyntheticSink, SyntheticResult } from './syntheticMonitoring';

export interface ForecastPoint {
	timestamp: string;
	name: string;
	current: number;
	forecastShort: number; // near-term (e.g., next 5-10 mins)
	forecastLong: number;  // longer window (e.g., next 30-60 mins)
	anomalyScore: number;  // 0..1 (higher means more anomalous)
	unit?: string;
}

export interface PredictiveReport {
	timestamp: string;
	points: ForecastPoint[];
}

type PredictiveSink = (report: PredictiveReport) => void | Promise<void>;

const sinks: PredictiveSink[] = [];
let started = false;

// Rolling series
const memSeries: number[] = [];     // memory ratio 0..1
const netSeries: number[] = [];     // network latency in ms
const upSeries: number[] = [];      // success ratio 0..1 derived from synthetic success
let synSuccess = 0;
let synTotal = 0;

const MAX_POINTS = 600;

export function registerPredictiveSink(sink: PredictiveSink): void { sinks.push(sink); }
export function unregisterPredictiveSink(sink: PredictiveSink): void { const i = sinks.indexOf(sink); if (i >= 0) sinks.splice(i, 1); }

function emit(report: PredictiveReport): void {
	for (const s of sinks) {
		try {
			const r = s(report);
			if (r && typeof (r as any).then === 'function') (r as Promise<void>).catch(() => {});
		} catch {}
	}
}

function ewma(values: number[], alpha: number): number {
	if (values.length === 0) return 0;
	let s = values[0];
	for (let i = 1; i < values.length; i++) s = alpha * values[i] + (1 - alpha) * s;
	return s;
}

function linearForecast(values: number[], steps: number): number {
	const n = values.length;
	if (n === 0) return 0;
	if (n === 1) return values[0];
	let sumT = 0, sumY = 0, sumTT = 0, sumTY = 0;
	for (let t = 0; t < n; t++) {
		const y = values[t];
		sumT += t; sumY += y; sumTT += t * t; sumTY += t * y;
	}
	const denom = n * sumTT - sumT * sumT;
	if (denom === 0) return values[n - 1];
	const b = (n * sumTY - sumT * sumY) / denom;
	const a = (sumY - b * sumT) / n;
	const tFuture = n - 1 + steps;
	return a + b * tFuture;
}

function anomalyScore(values: number[], current: number): number {
	if (values.length < 5) return 0;
	const mean = values.reduce((s, v) => s + v, 0) / values.length;
	const varSum = values.reduce((s, v) => s + (v - mean) * (v - mean), 0);
	const sd = Math.sqrt(varSum / Math.max(1, values.length - 1));
	if (sd === 0) return 0;
	const z = Math.abs((current - mean) / sd);
	// Map z-score into 0..1 via 1 - exp(-z)
	const score = 1 - Math.exp(-Math.min(5, z));
	return Math.max(0, Math.min(1, score));
}

function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }

function buildReport(): PredictiveReport {
	const now = new Date().toISOString();
	const memCur = memSeries.length > 0 ? memSeries[memSeries.length - 1] : 0;
	const netCur = netSeries.length > 0 ? netSeries[netSeries.length - 1] : 0;
	const upCur = synTotal > 0 ? synSuccess / synTotal : 1;

	const memShort = clamp01(ewma(memSeries, 0.4));
	const memLong = clamp01(ewma(memSeries, 0.1));
	const memLinS = clamp01(linearForecast(memSeries, Math.min(20, Math.floor(memSeries.length * 0.1))));
	const memLinL = clamp01(linearForecast(memSeries, Math.min(60, Math.floor(memSeries.length * 0.3))));
	const memForecastShort = clamp01((memShort + memLinS) / 2);
	const memForecastLong = clamp01((memLong + memLinL) / 2);
	const memAnom = anomalyScore(memSeries, memCur);

	const netShort = Math.max(0, ewma(netSeries, 0.4));
	const netLong = Math.max(0, ewma(netSeries, 0.1));
	const netLinS = Math.max(0, linearForecast(netSeries, Math.min(20, Math.floor(netSeries.length * 0.1))));
	const netLinL = Math.max(0, linearForecast(netSeries, Math.min(60, Math.floor(netSeries.length * 0.3))));
	const netForecastShort = Math.max(0, Math.round((netShort + netLinS) / 2));
	const netForecastLong = Math.max(0, Math.round((netLong + netLinL) / 2));
	const netAnom = anomalyScore(netSeries, netCur);

	const upVals = upSeries.length > 0 ? upSeries : [upCur];
	const upShort = clamp01(ewma(upVals, 0.5));
	const upLong = clamp01(ewma(upVals, 0.2));
	const upLinS = clamp01(linearForecast(upVals, Math.min(20, Math.floor(upVals.length * 0.1))));
	const upLinL = clamp01(linearForecast(upVals, Math.min(60, Math.floor(upVals.length * 0.3))));
	const upForecastShort = clamp01((upShort + upLinS) / 2);
	const upForecastLong = clamp01((upLong + upLinL) / 2);
	const upAnom = anomalyScore(upVals, upCur);

	const points: ForecastPoint[] = [
		{ timestamp: now, name: 'memory_ratio', current: memCur, forecastShort: memForecastShort, forecastLong: memForecastLong, anomalyScore: memAnom, unit: 'ratio' },
		{ timestamp: now, name: 'network_latency_ms', current: netCur, forecastShort: netForecastShort, forecastLong: netForecastLong, anomalyScore: netAnom, unit: 'ms' },
		{ timestamp: now, name: 'synthetic_uptime_ratio', current: upCur, forecastShort: upForecastShort, forecastLong: upForecastLong, anomalyScore: upAnom, unit: 'ratio' },
	];
	return { timestamp: now, points };
}

function onInfra(snap: InfraMetricsSnapshot): void {
	const used = snap.memory?.jsHeapUsedBytes || 0;
	const total = snap.memory?.jsHeapTotalBytes || 0;
	if (total > 0) memSeries.push(Math.min(1, used / total));
	while (memSeries.length > MAX_POINTS) memSeries.shift();
	emit(buildReport());
}

function onSynthetic(res: SyntheticResult): void {
	if (typeof res.latencyMs === 'number') {
		netSeries.push(Math.max(0, res.latencyMs));
		while (netSeries.length > MAX_POINTS) netSeries.shift();
	}
	synTotal++;
	if (res.success) synSuccess++;
	upSeries.push(synTotal > 0 ? synSuccess / synTotal : 1);
	while (upSeries.length > MAX_POINTS) upSeries.shift();
	emit(buildReport());
}

export function getPredictiveReport(): PredictiveReport { return buildReport(); }

export function startPredictiveAnalytics(): void {
	if (started) { logWarn(Component.APP, 'Predictive analytics already started'); return; }
	registerInfraSink(onInfra);
	registerSyntheticSink(onSynthetic);
	started = true;
	logInfo(Component.APP, 'Predictive analytics started');
}

export function stopPredictiveAnalytics(): void {
	started = false;
	logInfo(Component.APP, 'Predictive analytics stopped');
} 