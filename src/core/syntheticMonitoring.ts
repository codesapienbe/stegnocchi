import { logInfo, logWarn, logError, Component } from './logger';
import { pinnedFetch, isPinningActive } from './certPinning';

export interface SyntheticCheck {
	id: string;
	url: string;
	method?: 'GET' | 'HEAD';
	intervalMs?: number; // default 60s
	timeoutMs?: number; // default 10s
	expectedStatusMin?: number; // default 200
	expectedStatusMax?: number; // default 299
}

export interface SyntheticResult {
	id: string;
	timestamp: string;
	success: boolean;
	status?: number;
	latencyMs?: number;
	error?: string;
}

export interface UptimeSummary {
	id: string;
	windowSize: number;
	successCount: number;
	failureCount: number;
	uptimePercent: number; // 0..100
	avgLatencyMs?: number;
}

type ResultSink = (res: SyntheticResult) => void | Promise<void>;

type Timer = any;

const checks: Map<string, SyntheticCheck> = new Map();
const resultsWindow: Map<string, SyntheticResult[]> = new Map();
const timers: Map<string, Timer> = new Map();
const sinks: ResultSink[] = [];

const DEFAULT_INTERVAL = 60_000;
const DEFAULT_TIMEOUT = 10_000;
const WINDOW_SIZE = 100; // rolling window per check

export function registerSyntheticCheck(check: SyntheticCheck): void {
	if (!check || !check.id || !check.url) {
		throw new Error('Invalid synthetic check');
	}
	const normalized: SyntheticCheck = {
		...check,
		method: check.method || 'GET',
		intervalMs: Math.max(5_000, check.intervalMs || DEFAULT_INTERVAL),
		timeoutMs: Math.max(1_000, check.timeoutMs || DEFAULT_TIMEOUT),
		expectedStatusMin: typeof check.expectedStatusMin === 'number' ? check.expectedStatusMin : 200,
		expectedStatusMax: typeof check.expectedStatusMax === 'number' ? check.expectedStatusMax : 299,
	};
	checks.set(normalized.id, normalized);
	logInfo(Component.APP, 'Synthetic check registered', { id: normalized.id, url: normalized.url, intervalMs: normalized.intervalMs });
}

export function unregisterSyntheticCheck(id: string): void {
	stopCheck(id);
	checks.delete(id);
	resultsWindow.delete(id);
	logInfo(Component.APP, 'Synthetic check unregistered', { id });
}

export function registerSyntheticSink(sink: ResultSink): void {
	sinks.push(sink);
}

export function unregisterSyntheticSink(sink: ResultSink): void {
	const i = sinks.indexOf(sink);
	if (i >= 0) sinks.splice(i, 1);
}

function pushResult(id: string, res: SyntheticResult): void {
	let arr = resultsWindow.get(id);
	if (!arr) {
		arr = [];
		resultsWindow.set(id, arr);
	}
	arr.push(res);
	if (arr.length > WINDOW_SIZE) arr.shift();
	for (const sink of sinks) {
		try {
			const r = sink(res);
			if (r && typeof (r as any).then === 'function') (r as Promise<void>).catch(() => {});
		} catch {}
	}
}

export function getUptimeSummary(id: string): UptimeSummary | null {
	const arr = resultsWindow.get(id);
	if (!arr || arr.length === 0) return null;
	let successCount = 0;
	let failureCount = 0;
	let latencySum = 0;
	let latencyCount = 0;
	for (const r of arr) {
		if (r.success) successCount++; else failureCount++;
		if (typeof r.latencyMs === 'number') { latencySum += r.latencyMs; latencyCount++; }
	}
	const uptimePercent = (successCount / arr.length) * 100;
	return { id, windowSize: arr.length, successCount, failureCount, uptimePercent, avgLatencyMs: latencyCount > 0 ? Math.round(latencySum / latencyCount) : undefined };
}

export function listChecks(): SyntheticCheck[] {
	return Array.from(checks.values());
}

export async function runCheckNow(id: string): Promise<SyntheticResult> {
	const check = checks.get(id);
	if (!check) throw new Error(`Unknown check id: ${id}`);
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), check.timeoutMs);
	const started = Date.now();
	try {
		const requestInit: RequestInit = { method: check.method, signal: controller.signal };
		const doFetch = isPinningActive() ? pinnedFetch : (fetch as any);
		const response: Response = await doFetch(check.url, requestInit);
		const latencyMs = Date.now() - started;
		const ok = response.status >= (check.expectedStatusMin as number) && response.status <= (check.expectedStatusMax as number);
		const res: SyntheticResult = { id, timestamp: new Date().toISOString(), success: ok, status: response.status, latencyMs };
		pushResult(id, res);
		if (!ok) logWarn(Component.APP, 'Synthetic check failed', { id, status: response.status, latencyMs });
		else logInfo(Component.APP, 'Synthetic check ok', { id, status: response.status, latencyMs });
		return res;
	} catch (e) {
		const latencyMs = Date.now() - started;
		const res: SyntheticResult = { id, timestamp: new Date().toISOString(), success: false, error: e instanceof Error ? e.message : String(e), latencyMs };
		pushResult(id, res);
		logError(Component.APP, 'Synthetic check exception', { id, error: res.error, latencyMs });
		return res;
	} finally {
		clearTimeout(timeout);
	}
}

function startTimerForCheck(id: string, intervalMs: number): void {
	if (timers.has(id)) return;
	const handle = setInterval(() => {
		runCheckNow(id).catch(() => {});
	}, Math.max(5_000, intervalMs));
	timers.set(id, handle);
}

function stopCheck(id: string): void {
	const t = timers.get(id);
	if (t) clearInterval(t);
	timers.delete(id);
}

export function startSyntheticMonitoring(): void {
	for (const c of checks.values()) startTimerForCheck(c.id, c.intervalMs as number);
	logInfo(Component.APP, 'Synthetic monitoring started', { checks: checks.size });
}

export function stopSyntheticMonitoring(): void {
	for (const id of timers.keys()) stopCheck(id);
	logInfo(Component.APP, 'Synthetic monitoring stopped');
} 