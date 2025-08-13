import { logInfo, logWarn, logError, Component } from './logger';
import { recordAuditEvent } from './auditLog';

export interface PinPolicyEntry {
	hostPattern: string; // e.g., "api.example.com" or "*.example.com"
	pinsSha256?: string[]; // base64-encoded SHA-256 SPKI pins
	pinsCertHash?: string[]; // base64-encoded full cert hashes
	enforce: boolean; // if true, block on mismatch; otherwise report-only
	reportOnly?: boolean; // legacy alias, if true treat as non-blocking
}

export interface PinningConfigOptions {
	strictMode?: boolean; // if true, unknown hosts are blocked when any policy exists
	requireCertificateTransparency?: boolean; // if true, require CT presence (platform transport must enforce)
}

export interface PinnedFetchOptions {
	correlationId?: string;
	requestId?: string;
	userId?: string;
}

export type PinnedTransport = (
	input: RequestInfo | URL,
	init?: RequestInit,
	ctx?: { policy?: PinPolicyEntry; options?: PinnedFetchOptions }
) => Promise<Response>;

let pinPolicy: PinPolicyEntry[] = [];
let pinningOptions: PinningConfigOptions = {};
let transport: PinnedTransport | null = null;

export function configureCertPinning(policy: PinPolicyEntry[], options?: PinningConfigOptions): void {
	pinPolicy = Array.isArray(policy) ? policy.slice() : [];
	pinningOptions = { ...(options || {}) };
	logInfo(Component.APP, 'Certificate pinning configured', { entries: pinPolicy.length, strictMode: !!pinningOptions.strictMode, requireCT: !!pinningOptions.requireCertificateTransparency });
	recordAuditEvent({ type: 'cert_pinning_configured', actor: 'system', severity: 'INFO', details: { entries: pinPolicy.length, strictMode: !!pinningOptions.strictMode, requireCT: !!pinningOptions.requireCertificateTransparency } });
}

export function getCertPinningPolicy(): PinPolicyEntry[] {
	return pinPolicy.slice();
}

export function registerPinnedTransport(t: PinnedTransport): void {
	transport = t;
	logInfo(Component.APP, 'Pinned transport registered');
}

export function clearPinnedTransport(): void {
	transport = null;
	logInfo(Component.APP, 'Pinned transport cleared');
}

export function isPinningActive(): boolean {
	return !!transport && pinPolicy.length > 0;
}

export function isCTRequired(): boolean {
	return !!pinningOptions.requireCertificateTransparency;
}

export function reportCTStatus(host: string, present: boolean, compliant: boolean): void {
	if (!host) return;
	const level = present && compliant ? 'INFO' : 'WARN';
	const message = present && compliant ? 'Certificate Transparency verified' : present ? 'Certificate Transparency present but non-compliant' : 'Certificate Transparency not present';
	logInfo(Component.APP, `CT status: ${message}`, { host, present, compliant });
	recordAuditEvent({ type: 'cert_transparency', actor: 'system', severity: level as any, details: { host, present, compliant, required: !!pinningOptions.requireCertificateTransparency } });
}

function matchHost(host: string): PinPolicyEntry | undefined {
	for (const entry of pinPolicy) {
		const pattern = entry.hostPattern.trim().toLowerCase();
		if (!pattern) continue;
		if (pattern.startsWith('*.')) {
			const suffix = pattern.slice(1); // ".example.com"
			if (host.toLowerCase().endsWith(suffix)) return entry;
		} else if (host.toLowerCase() === pattern) {
			return entry;
		}
	}
	return undefined;
}

function withTracingHeaders(init: RequestInit | undefined, opts?: PinnedFetchOptions): RequestInit {
	const headers = new Headers(init?.headers as any);
	if (opts?.correlationId) headers.set('X-Correlation-ID', opts.correlationId);
	if (opts?.requestId) headers.set('X-Request-ID', opts.requestId);
	return { ...(init || {}), headers };
}

export async function pinnedFetch(input: RequestInfo | URL, init?: RequestInit, opts?: PinnedFetchOptions): Promise<Response> {
	const url = typeof input === 'string' ? input : (input as URL).toString();
	let host: string | null = null;
	try {
		host = new URL(url).host;
	} catch {
		// Keep host null on invalid URL
	}
	const policy = host ? matchHost(host) : undefined;
	const effectiveInit = withTracingHeaders(init, opts);

	if (transport) {
		// Delegate to platform transport that must enforce pinning
		return transport(input, effectiveInit, { policy, options: opts });
	}

	if (policy) {
		const nonBlocking = policy.reportOnly || !policy.enforce;
		const note = nonBlocking ? 'report-only policy; not enforced on this platform' : 'enforced policy but no transport; cannot enforce on this platform';
		logWarn(Component.APP, 'Certificate pinning policy matched but no pinned transport is registered', { host, note });
		recordAuditEvent({ type: 'cert_pinning_not_enforced', actor: 'system', severity: 'WARN', details: { host, note } });
		if (!nonBlocking && pinningOptions.strictMode) {
			logError(Component.APP, 'Blocking request due to strictMode without transport', { host });
			throw new Error('Blocked by certificate pinning (no transport)');
		}
	}

	// Fallback to global fetch (web: no certificate pinning possible)
	if (typeof fetch !== 'function') {
		throw new Error('Global fetch is not available');
	}
	return fetch(input as any, effectiveInit);
} 