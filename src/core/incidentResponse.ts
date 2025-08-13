import { registerLogSink, unregisterLogSink, logInfo, logWarn, logError, Component, LogLevel } from './logger';

export type IncidentSeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface IncidentEvent {
	id: string;
	timestamp: string;
	severity: IncidentSeverity;
	component?: string;
	message: string;
	metadata?: Record<string, any> | undefined;
	source: 'log' | 'custom';
}

export interface IncidentRule {
	name: string;
	match: (entry: any) => boolean;
	severity: IncidentSeverity;
	cooldownMs?: number; // throttle repeated firings
	maxPerMinute?: number; // rate-limit
	actions?: ((incident: IncidentEvent) => void | Promise<void>)[];
}

type IncidentSink = (incident: IncidentEvent) => void | Promise<void>;

let started = false;
const rules: IncidentRule[] = [];
const sinks: IncidentSink[] = [];
const lastFiredAt: Map<string, number> = new Map();
const perMinuteCounts: Map<string, { count: number; windowStart: number }> = new Map();

function newIncident(partial: Omit<IncidentEvent, 'id' | 'timestamp'> & { metadata?: Record<string, any> }): IncidentEvent {
	return { id: `inc_${Date.now()}_${Math.random().toString(36).slice(2,8)}`, timestamp: new Date().toISOString(), ...partial };
}

function passRateLimits(rule: IncidentRule): boolean {
	const now = Date.now();
	if (rule.cooldownMs) {
		const last = lastFiredAt.get(rule.name) || 0;
		if (now - last < rule.cooldownMs) return false;
	}
	if (rule.maxPerMinute && rule.maxPerMinute > 0) {
		const rec = perMinuteCounts.get(rule.name) || { count: 0, windowStart: now };
		if (now - rec.windowStart >= 60_000) {
			rec.count = 0;
			rec.windowStart = now;
		}
		rec.count += 1;
		perMinuteCounts.set(rule.name, rec);
		if (rec.count > rule.maxPerMinute) return false;
	}
	return true;
}

async function emitIncident(incident: IncidentEvent, rule?: IncidentRule): Promise<void> {
	if (rule) lastFiredAt.set(rule.name, Date.now());
	for (const sink of sinks) {
		try {
			const r = sink(incident);
			if (r && typeof (r as any).then === 'function') (r as Promise<void>).catch(() => {});
		} catch {}
	}
	if (rule?.actions) {
		for (const act of rule.actions) {
			try {
				const r = act(incident);
				if (r && typeof (r as any).then === 'function') (r as Promise<void>).catch(() => {});
			} catch {}
		}
	}
}

function defaultLogListener(entry: any): void {
	try {
		for (const rule of rules) {
			if (!rule.match(entry)) continue;
			if (!passRateLimits(rule)) continue;
			const incident = newIncident({
				severity: rule.severity,
				component: String(entry.component || ''),
				message: String(entry.message || 'incident'),
				metadata: entry.metadata || undefined,
				source: 'log',
			});
			emitIncident(incident, rule).catch(() => {});
		}
	} catch {}
}

export function registerIncidentRule(rule: IncidentRule): void {
	rules.push(rule);
	logInfo(Component.APP, 'Incident rule registered', { name: rule.name, severity: rule.severity });
}

export function registerIncidentSink(sink: IncidentSink): void { sinks.push(sink); }
export function unregisterIncidentSink(sink: IncidentSink): void { const i = sinks.indexOf(sink); if (i >= 0) sinks.splice(i, 1); }

export function ingestCustomIncident(severity: IncidentSeverity, message: string, metadata?: Record<string, any>): void {
	const partial = (metadata
		? { severity, message, source: 'custom' as const, metadata }
		: { severity, message, source: 'custom' as const }
	);
	const incident = newIncident(partial);
	emitIncident(incident).catch(() => {});
}

let boundListener: ((entry: any) => void) | null = null;

export function startIncidentResponse(): void {
	if (started) { logWarn(Component.APP, 'Incident response already started'); return; }
	boundListener = defaultLogListener;
	registerLogSink(boundListener);
	started = true;
	logInfo(Component.APP, 'Incident response started');

	// Register two sensible defaults
	registerIncidentRule({
		name: 'crypto_errors',
		match: (e) => e && e.level === LogLevel.ERROR && String(e.component || '').toLowerCase() === Component.CRYPTO,
		severity: 'ERROR',
		cooldownMs: 5000,
		maxPerMinute: 6,
	});
	registerIncidentRule({
		name: 'exif_warnings',
		match: (e) => e && (e.level === LogLevel.WARN) && String(e.component || '').toLowerCase() === Component.EXIF,
		severity: 'WARN',
		cooldownMs: 2000,
		maxPerMinute: 12,
	});
}

export function stopIncidentResponse(): void {
	if (!started) return;
	if (boundListener) unregisterLogSink(boundListener);
	boundListener = null;
	started = false;
	logInfo(Component.APP, 'Incident response stopped');
} 