import { logInfo, logWarn, logError, Component } from './logger';
import { recordAuditEvent } from './auditLog';
import { secureStorage } from './secureStorage';

let NativeModules: any = undefined;
try {
	// Optional to avoid hard RN dependency on web
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	NativeModules = require('react-native').NativeModules;
} catch {}

export interface SecureEnclaveAccessControl {
	biometricRequired?: boolean;
	devicePasscodeRequired?: boolean;
	userPresenceRequired?: boolean;
}

export interface SecureEnclaveProvider {
	isAvailable(): Promise<boolean>;
	generateKeyPair(label: string, access?: SecureEnclaveAccessControl): Promise<{ publicKeyPem: string }>;
	sign(label: string, data: Uint8Array): Promise<Uint8Array>;
	getPublicKey(label: string): Promise<string | null>;
	deleteKey(label: string): Promise<boolean>;
}

const STORAGE_PREFIX = 'se:'; // se:<label> -> { alg, jwkPrivate?, publicKeyPem }

function toPemSpki(spki: ArrayBuffer): string {
	const bytes = new Uint8Array(spki);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
	const b64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(bytes).toString('base64');
	return `-----BEGIN PUBLIC KEY-----\n${b64.match(/.{1,64}/g)?.join('\n') || b64}\n-----END PUBLIC KEY-----`;
}

async function exportPublicKeyPem(key: CryptoKey): Promise<string> {
	const spki = await crypto.subtle.exportKey('spki', key);
	return toPemSpki(spki);
}

class IOSNativeSecureEnclave implements SecureEnclaveProvider {
	async isAvailable(): Promise<boolean> {
		return !!(NativeModules && NativeModules.SecureEnclave && typeof NativeModules.SecureEnclave.isAvailable === 'function');
	}

	async generateKeyPair(label: string, access?: SecureEnclaveAccessControl): Promise<{ publicKeyPem: string }> {
		if (!(await this.isAvailable())) throw new Error('Secure Enclave (iOS) not available');
		const res = await NativeModules.SecureEnclave.generateKeyPair(label, access || {});
		logInfo(Component.APP, 'SecureEnclave(iOS) key generated', { label });
		recordAuditEvent({ type: 'secure_enclave_key_generated', actor: 'system', severity: 'INFO', details: { label } });
		return { publicKeyPem: String(res.publicKeyPem) };
	}

	async sign(label: string, data: Uint8Array): Promise<Uint8Array> {
		if (!(await this.isAvailable())) throw new Error('Secure Enclave (iOS) not available');
		const sigB64: string = await NativeModules.SecureEnclave.sign(label, Array.from(data));
		const bin = typeof atob === 'function' ? atob(sigB64) : Buffer.from(sigB64, 'base64').toString('binary');
		const out = new Uint8Array(bin.length);
		for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
		return out;
	}

	async getPublicKey(label: string): Promise<string | null> {
		if (!(await this.isAvailable())) return null;
		const pem: string | null = await NativeModules.SecureEnclave.getPublicKey(label);
		return pem;
	}

	async deleteKey(label: string): Promise<boolean> {
		if (!(await this.isAvailable())) return false;
		try {
			await NativeModules.SecureEnclave.deleteKey(label);
			logInfo(Component.APP, 'SecureEnclave(iOS) key deleted', { label });
			return true;
		} catch (e) {
			logWarn(Component.APP, 'SecureEnclave(iOS) key deletion failed', { label, error: e instanceof Error ? e.message : String(e) });
			return false;
		}
	}
}

class WebFallbackSecureEnclave implements SecureEnclaveProvider {
	async isAvailable(): Promise<boolean> {
		return false; // Not a real enclave
	}

	async generateKeyPair(label: string): Promise<{ publicKeyPem: string }> {
		try {
			const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
			const publicKeyPem = await exportPublicKeyPem(keyPair.publicKey);
			const jwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
			await secureStorage.setItem(`${STORAGE_PREFIX}${label}`, JSON.stringify({ alg: 'ECDSA_P256', jwkPrivate: jwk, publicKeyPem }));
			logWarn(Component.APP, 'Using WebCrypto fallback for secure enclave', { label });
			return { publicKeyPem };
		} catch (e) {
			logError(Component.APP, 'Fallback key generation failed', { error: e instanceof Error ? e.message : String(e) });
			throw e;
		}
	}

	async sign(label: string, data: Uint8Array): Promise<Uint8Array> {
		const rec = await secureStorage.getItem(`${STORAGE_PREFIX}${label}`);
		if (!rec.success || !rec.value) throw new Error('Key not found');
		const parsed = JSON.parse(rec.value);
		const priv = await crypto.subtle.importKey('jwk', parsed.jwkPrivate, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
		const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, priv, data);
		return new Uint8Array(sig as ArrayBuffer);
	}

	async getPublicKey(label: string): Promise<string | null> {
		const rec = await secureStorage.getItem(`${STORAGE_PREFIX}${label}`);
		if (!rec.success || !rec.value) return null;
		try {
			const parsed = JSON.parse(rec.value);
			return String(parsed.publicKeyPem || '') || null;
		} catch {
			return null;
		}
	}

	async deleteKey(label: string): Promise<boolean> {
		await secureStorage.removeItem(`${STORAGE_PREFIX}${label}`);
		return true;
	}
}

class SecureEnclaveFacade implements SecureEnclaveProvider {
	private readonly ios = new IOSNativeSecureEnclave();
	private readonly web = new WebFallbackSecureEnclave();

	async isAvailable(): Promise<boolean> {
		return this.ios.isAvailable();
	}

	async generateKeyPair(label: string, access?: SecureEnclaveAccessControl): Promise<{ publicKeyPem: string }> {
		if (await this.ios.isAvailable()) {
			return this.ios.generateKeyPair(label, access);
		}
		return this.web.generateKeyPair(label);
	}

	async sign(label: string, data: Uint8Array): Promise<Uint8Array> {
		if (await this.ios.isAvailable()) return this.ios.sign(label, data);
		return this.web.sign(label, data);
	}

	async getPublicKey(label: string): Promise<string | null> {
		if (await this.ios.isAvailable()) return this.ios.getPublicKey(label);
		return this.web.getPublicKey(label);
	}

	async deleteKey(label: string): Promise<boolean> {
		if (await this.ios.isAvailable()) return this.ios.deleteKey(label);
		return this.web.deleteKey(label);
	}
}

export const secureEnclave: SecureEnclaveProvider = new SecureEnclaveFacade(); 