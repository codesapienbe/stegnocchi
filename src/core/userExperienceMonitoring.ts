import { logInfo, logWarn, Component } from './logger';

export type UxEventType = 'route_change' | 'interaction' | 'long_task' | 'layout_shift' | 'custom';

export interface UxEvent {
	id: string;
	type: UxEventType;
	name?: string;
	timestamp: string;
	durationMs?: number;
	metadata?: Record<string, any>;
}

type UxSink = (ev: UxEvent) => void | Promise<void>;

let started = false;
let longTaskObserver: any = null;
const sinks: UxSink[] = [];
const buffer: UxEvent[] = [];
const MAX_BUFFER = 200;

function emit(event: UxEvent): void {
	buffer.push(event);
	if (buffer.length > MAX_BUFFER) buffer.shift();
	for (const sink of sinks) {
		try {
			const r = sink(event);
			if (r && typeof (r as any).then === 'function') (r as Promise<void>).catch(() => {});
		} catch {}
	}
}

function newEvent(partial: Omit<UxEvent, 'id' | 'timestamp'>): UxEvent {
	return { id: `ux_${Date.now()}_${Math.random().toString(36).slice(2,8)}`, timestamp: new Date().toISOString(), ...partial };
}

export function registerUxSink(sink: UxSink): void { sinks.push(sink); }
export function unregisterUxSink(sink: UxSink): void { const i = sinks.indexOf(sink); if (i >= 0) sinks.splice(i, 1); }

export function getRecentUxEvents(): UxEvent[] { return buffer.slice(); }

export function recordRouteChange(routeName: string, metadata?: Record<string, any>): void {
	const ev = newEvent({ type: 'route_change', name: routeName, metadata });
	emit(ev);
	logInfo(Component.APP, 'UX route change', { routeName });
}

export function recordInteraction(name: string, durationMs?: number, metadata?: Record<string, any>): void {
	const ev = newEvent({ type: 'interaction', name, durationMs, metadata });
	emit(ev);
	logInfo(Component.APP, 'UX interaction', { name, durationMs });
}

export function recordCustomUxEvent(name: string, metadata?: Record<string, any>): void {
	const ev = newEvent({ type: 'custom', name, metadata });
	emit(ev);
}

function startLongTaskObserver(): void {
	try {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes && PerformanceObserver.supportedEntryTypes.includes('longtask')) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			longTaskObserver = new PerformanceObserver((list: any) => {
				const entries = list.getEntries();
				for (const e of entries) {
					const ev = newEvent({ type: 'long_task', name: 'long_task', durationMs: Math.round(e.duration || 0), metadata: { name: e.name, startTime: e.startTime } });
					emit(ev);
				}
			});
			longTaskObserver.observe({ entryTypes: ['longtask'] });
			logInfo(Component.APP, 'UX long task observer started');
		} else {
			logWarn(Component.APP, 'UX long task observer not supported');
		}
	} catch {
		// ignore
	}
}

export function startUxMonitoring(): void {
	if (started) { logWarn(Component.APP, 'UX monitoring already started'); return; }
	started = true;
	startLongTaskObserver();
	logInfo(Component.APP, 'UX monitoring started');
}

export function stopUxMonitoring(): void {
	if (!started) return;
	started = false;
	try { if (longTaskObserver && typeof longTaskObserver.disconnect === 'function') longTaskObserver.disconnect(); } catch {}
	longTaskObserver = null;
	logInfo(Component.APP, 'UX monitoring stopped');
} 