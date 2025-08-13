import { logInfo, logWarn, logError, Component } from './logger';

export interface OperationConfig {
	name: string;
	thresholdMs: number; // alert if p95 exceeds this
	windowSize?: number; // default 200
}

export interface OperationStats {
	name: string;
	count: number;
	avgMs: number;
	p95Ms: number;
	maxMs: number;
	lastMs?: number;
	lastUpdated: string;
}

type StatsSink = (stats: OperationStats) => void | Promise<void>;

const DEFAULT_WINDOW = 200;

class RollingWindow {
	private readonly window: number[] = [];
	private readonly maxSize: number;

	constructor(maxSize: number) { this.maxSize = Math.max(10, maxSize); }

	push(value: number): void {
		this.window.push(value);
		if (this.window.length > this.maxSize) this.window.shift();
	}

	toArray(): number[] { return this.window.slice(); }
}

interface InternalOp {
	conf: OperationConfig;
	durations: RollingWindow;
	lastMs?: number;
	lastUpdated: string;
}

const ops: Map<string, InternalOp> = new Map();
const sinks: StatsSink[] = [];
let sweepTimer: any = null;

function ensureOp(conf: OperationConfig): InternalOp {
	const existing = ops.get(conf.name);
	if (existing) return existing;
	const created: InternalOp = {
		conf: { ...conf, windowSize: conf.windowSize || DEFAULT_WINDOW },
		durations: new RollingWindow(conf.windowSize || DEFAULT_WINDOW),
		lastUpdated: new Date().toISOString(),
	};
	ops.set(conf.name, created);
	logInfo(Component.APP, 'Perf op registered', { name: conf.name, thresholdMs: conf.thresholdMs });
	return created;
}

function computeStats(op: InternalOp): OperationStats {
	const arr = op.durations.toArray();
	if (arr.length === 0) {
		return { name: op.conf.name, count: 0, avgMs: 0, p95Ms: 0, maxMs: 0, lastMs: op.lastMs, lastUpdated: op.lastUpdated };
	}
	const sorted = arr.slice().sort((a, b) => a - b);
	const count = sorted.length;
	const sum = sorted.reduce((s, v) => s + v, 0);
	const avg = sum / count;
	const p95Idx = Math.min(count - 1, Math.floor(0.95 * count));
	const p95 = sorted[p95Idx];
	const max = sorted[count - 1];
	return { name: op.conf.name, count, avgMs: Math.round(avg), p95Ms: Math.round(p95), maxMs: Math.round(max), lastMs: op.lastMs, lastUpdated: op.lastUpdated };
}

async function emit(stats: OperationStats): Promise<void> {
	for (const sink of sinks) {
		try {
			const r = sink(stats);
			if (r && typeof (r as any).then === 'function') (r as Promise<void>).catch(() => {});
		} catch {}
	}
}

export function registerPerfOperation(conf: OperationConfig): void {
	ensureOp(conf);
}

export function unregisterPerfOperation(name: string): void {
	ops.delete(name);
	logInfo(Component.APP, 'Perf op unregistered', { name });
}

export function registerPerfSink(sink: StatsSink): void {
	sinks.push(sink);
}

export function unregisterPerfSink(sink: StatsSink): void {
	const i = sinks.indexOf(sink);
	if (i >= 0) sinks.splice(i, 1);
}

export function recordPerfDuration(name: string, durationMs: number): OperationStats | null {
	const op = ops.get(name);
	if (!op) return null;
	op.durations.push(durationMs);
	op.lastMs = durationMs;
	op.lastUpdated = new Date().toISOString();
	const stats = computeStats(op);
	if (stats.p95Ms > (op.conf.thresholdMs || 0)) {
		logWarn(Component.APP, 'Performance bottleneck detected', { name, p95Ms: stats.p95Ms, thresholdMs: op.conf.thresholdMs, count: stats.count });
		emit(stats).catch(() => {});
	}
	return stats;
}

export async function withMonitoredAsync<T>(name: string, conf: OperationConfig | undefined, fn: () => Promise<T>): Promise<T> {
	if (conf) ensureOp(conf);
	const start = Date.now();
	try {
		const result = await fn();
		const dur = Date.now() - start;
		recordPerfDuration(name, dur);
		return result;
	} catch (e) {
		const dur = Date.now() - start;
		recordPerfDuration(name, dur);
		logError(Component.APP, 'Monitored async operation failed', { name, durationMs: dur, error: e instanceof Error ? e.message : String(e) });
		throw e;
	}
}

export function getPerfStats(name: string): OperationStats | null {
	const op = ops.get(name);
	return op ? computeStats(op) : null;
}

export function listPerfOps(): string[] {
	return Array.from(ops.keys());
}

export function startPerfSweeper(intervalMs: number = 60000): void {
	if (sweepTimer) return;
	sweepTimer = setInterval(() => {
		for (const op of ops.values()) {
			const stats = computeStats(op);
			if (stats.p95Ms > (op.conf.thresholdMs || 0)) emit(stats).catch(() => {});
		}
	}, Math.max(5000, intervalMs));
	logInfo(Component.APP, 'Performance bottleneck sweeper started', { intervalMs: Math.max(5000, intervalMs) });
}

export function stopPerfSweeper(): void {
	if (sweepTimer) {
		clearInterval(sweepTimer);
		sweepTimer = null;
		logInfo(Component.APP, 'Performance bottleneck sweeper stopped');
	}
} 