import { logInfo, logWarn, Component } from './logger';
import { registerSyntheticSink, SyntheticResult } from './syntheticMonitoring';
import { registerHealthSink, HealthReport } from './healthChecks';

export type SlaStatus = 'COMPLIANT' | 'AT_RISK' | 'BREACHED';

export interface SlaDefinition {
	id: string;
	name: string;
	targetUptimePercent: number; // e.g., 99.9
	windowDays: number; // rolling window size
	trackedSyntheticIds?: string[];
	trackedHealthIds?: string[];
}

export interface SlaReport {
	id: string;
	name: string;
	timestamp: string;
	windowDays: number;
	targetUptimePercent: number;
	uptimePercent: number;
	successCount: number;
	failureCount: number;
	burnRate?: number;
	status: SlaStatus;
	details?: Record<string, any>;
}

type SlaSink = (report: SlaReport) => void | Promise<void>;

interface RollingCounts {
	events: Array<{ t: number; ok: boolean }>;
	maxAgeMs: number;
}

function newRolling(maxAgeMs: number): RollingCounts { return { events: [], maxAgeMs }; }
function pushEvent(rc: RollingCounts, ok: boolean, now: number): void {
	rc.events.push({ t: now, ok });
	const cutoff = now - rc.maxAgeMs;
	while (rc.events.length > 0 && rc.events[0].t < cutoff) rc.events.shift();
}
function summarize(rc: RollingCounts): { success: number; failure: number } {
	let success = 0; let failure = 0;
	for (const e of rc.events) { if (e.ok) success++; else failure++; }
	return { success, failure };
}

interface InternalSla {
	def: SlaDefinition;
	counts: RollingCounts;
}

let started = false;
const slaMap: Map<string, InternalSla> = new Map();
const sinks: SlaSink[] = [];

export function registerSla(def: SlaDefinition): void {
	if (!def || !def.id) throw new Error('Invalid SLA definition');
	const maxAgeMs = Math.max(1, def.windowDays) * 24 * 60 * 60 * 1000;
	slaMap.set(def.id, { def, counts: newRolling(maxAgeMs) });
	logInfo(Component.APP, 'SLA registered', { id: def.id, name: def.name, target: def.targetUptimePercent, windowDays: def.windowDays });
}

export function unregisterSla(id: string): void {
	slaMap.delete(id);
	logInfo(Component.APP, 'SLA unregistered', { id });
}

export function registerSlaSink(sink: SlaSink): void { sinks.push(sink); }
export function unregisterSlaSink(sink: SlaSink): void { const i = sinks.indexOf(sink); if (i >= 0) sinks.splice(i, 1); }

function emit(report: SlaReport): void {
	for (const s of sinks) {
		try {
			const r = s(report);
			if (r && typeof (r as any).then === 'function') (r as Promise<void>).catch(() => {});
		} catch {}
	}
}

function toStatus(uptime: number, target: number): SlaStatus {
	if (uptime >= target) return 'COMPLIANT';
	if (uptime >= Math.max(0, target - 0.1)) return 'AT_RISK';
	return 'BREACHED';
}

function buildReport(now: number, ins: InternalSla): SlaReport {
	const sum = summarize(ins.counts);
	const total = sum.success + sum.failure;
	const uptime = total > 0 ? (sum.success / total) * 100 : 100;
	const burnRate = 100 - ins.def.targetUptimePercent <= 0 ? undefined : (100 - uptime) / (100 - ins.def.targetUptimePercent);
	const status = toStatus(uptime, ins.def.targetUptimePercent);
	return {
		id: ins.def.id,
		name: ins.def.name,
		timestamp: new Date(now).toISOString(),
		windowDays: ins.def.windowDays,
		targetUptimePercent: ins.def.targetUptimePercent,
		uptimePercent: Math.round(uptime * 1000) / 1000,
		successCount: sum.success,
		failureCount: sum.failure,
		burnRate: typeof burnRate === 'number' ? Math.round(burnRate * 1000) / 1000 : undefined,
		status,
	};
}

function acceptSynthetic(def: SlaDefinition, r: SyntheticResult): boolean {
	if (!def.trackedSyntheticIds || def.trackedSyntheticIds.length === 0) return true;
	return def.trackedSyntheticIds.includes(r.id);
}
function acceptHealth(def: SlaDefinition, rep: HealthReport): boolean {
	if (!def.trackedHealthIds || def.trackedHealthIds.length === 0) return true;
	return def.trackedHealthIds.includes(rep.id);
}

function onSynthetic(res: SyntheticResult): void {
	const now = Date.now();
	for (const ins of slaMap.values()) {
		if (!acceptSynthetic(ins.def, res)) continue;
		pushEvent(ins.counts, !!res.success, now);
		const report = buildReport(now, ins);
		emit(report);
	}
}

function onHealth(rep: HealthReport): void {
	const now = Date.now();
	for (const ins of slaMap.values()) {
		if (!acceptHealth(ins.def, rep)) continue;
		const ok = rep.status !== 'UNHEALTHY';
		pushEvent(ins.counts, ok, now);
		const report = buildReport(now, ins);
		emit(report);
	}
}

export function startSlaMonitoring(): void {
	if (started) { logWarn(Component.APP, 'SLA monitoring already started'); return; }
	registerSyntheticSink(onSynthetic);
	registerHealthSink(onHealth);
	started = true;
	logInfo(Component.APP, 'SLA monitoring started', { slas: slaMap.size });
}

export function stopSlaMonitoring(): void {
	started = false;
	logInfo(Component.APP, 'SLA monitoring stopped');
}

export function getSlaReport(id: string): SlaReport | null {
	const ins = slaMap.get(id);
	if (!ins) return null;
	return buildReport(Date.now(), ins);
}

export function listSlaReports(): SlaReport[] {
	const now = Date.now();
	const out: SlaReport[] = [];
	for (const ins of slaMap.values()) out.push(buildReport(now, ins));
	return out;
} 