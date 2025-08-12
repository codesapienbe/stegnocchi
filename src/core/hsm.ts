import { logInfo, logWarn, logError, Component } from './logger';
import { recordAuditEvent } from './auditLog';

export type HsmKeyType = 'symmetric' | 'asymmetric';
export type HsmAlgorithm = 'AES-256' | 'RSA-2048' | 'RSA-4096' | 'ECC-P256' | 'ECC-P384';

export interface HsmGenerateKeyParams {
	type: HsmKeyType;
	algorithm: HsmAlgorithm;
	extractable?: boolean;
}

export interface HsmAttestation {
	certificateChain: string[];
	attestation?: string;
}

export interface HsmProvider {
	name: string;
	generateKey(params: HsmGenerateKeyParams): Promise<{ keyId: string; publicKeyPem?: string; }>;
	encrypt(keyId: string, data: Uint8Array, options?: Record<string, any>): Promise<Uint8Array>;
	decrypt(keyId: string, data: Uint8Array, options?: Record<string, any>): Promise<Uint8Array>;
	sign(keyId: string, data: Uint8Array, options?: Record<string, any>): Promise<Uint8Array>;
	verify(keyId: string, data: Uint8Array, signature: Uint8Array, options?: Record<string, any>): Promise<boolean>;
	exportPublicKey?(keyId: string): Promise<string>;
	getAttestation?(keyId: string): Promise<HsmAttestation>;
	destroyKey?(keyId: string): Promise<boolean>;
}

class HsmRegistry {
	private providers: Map<string, HsmProvider> = new Map();
	private currentName: string | null = null;

	registerProvider(name: string, provider: HsmProvider): void {
		this.providers.set(name, provider);
		logInfo(Component.APP, 'Registered HSM provider', { name: provider.name });
		recordAuditEvent({ type: 'hsm_provider_registered', actor: 'system', severity: 'INFO', details: { name: provider.name } });
	}

	useProvider(name: string): void {
		if (!this.providers.has(name)) {
			throw new Error(`HSM provider not found: ${name}`);
		}
		this.currentName = name;
		logInfo(Component.APP, 'Selected HSM provider', { name });
	}

	getProvider(): HsmProvider {
		if (!this.currentName) {
			throw new Error('No HSM provider selected');
		}
		const p = this.providers.get(this.currentName);
		if (!p) throw new Error(`Selected HSM provider missing: ${this.currentName}`);
		return p;
	}

	listProviders(): string[] {
		return Array.from(this.providers.keys());
	}
}

export const hsm = new HsmRegistry();

// Local WebCrypto-backed provider (for development / fallback)
class LocalHsmProvider implements HsmProvider {
	name = 'local-webcrypto';
	private keys: Map<string, { type: HsmKeyType; algorithm: HsmAlgorithm; key?: CryptoKey; keyPair?: CryptoKeyPair }> = new Map();

	async generateKey(params: HsmGenerateKeyParams): Promise<{ keyId: string; publicKeyPem?: string; }> {
		const keyId = `hsm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
		let publicKeyPem: string | undefined;
		try {
			switch (params.algorithm) {
				case 'AES-256': {
					const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
					this.keys.set(keyId, { type: 'symmetric', algorithm: params.algorithm, key });
					break;
				}
				case 'RSA-2048':
				case 'RSA-4096': {
					const modulusLength = params.algorithm === 'RSA-2048' ? 2048 : 4096;
					const keyPair = await crypto.subtle.generateKey(
						{ name: 'RSASSA-PKCS1-v1_5', modulusLength, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
						false,
						['sign', 'verify']
					);
					this.keys.set(keyId, { type: 'asymmetric', algorithm: params.algorithm, keyPair });
					publicKeyPem = await this.exportPublicKey(keyPair.publicKey);
					break;
				}
				case 'ECC-P256':
				case 'ECC-P384': {
					const namedCurve = params.algorithm === 'ECC-P256' ? 'P-256' : 'P-384';
					const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve }, false, ['sign', 'verify']);
					this.keys.set(keyId, { type: 'asymmetric', algorithm: params.algorithm, keyPair });
					publicKeyPem = await this.exportPublicKey(keyPair.publicKey);
					break;
				}
				default:
					throw new Error(`Unsupported algorithm: ${params.algorithm}`);
			}
			logInfo(Component.APP, 'HSM key generated', { keyId, algorithm: params.algorithm, type: params.type });
			recordAuditEvent({ type: 'hsm_key_generated', actor: 'system', severity: 'INFO', details: { keyId, algorithm: params.algorithm, type: params.type } });
			return { keyId, publicKeyPem };
		} catch (e) {
			logError(Component.CRYPTO, 'HSM key generation failed', { error: e instanceof Error ? e.message : String(e), algorithm: params.algorithm });
			throw e;
		}
	}

	async encrypt(keyId: string, data: Uint8Array): Promise<Uint8Array> {
		const entry = this.keys.get(keyId);
		if (!entry || entry.algorithm !== 'AES-256' || !entry.key) {
			throw new Error('Encrypt requires AES-256 symmetric key');
		}
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, entry.key, data);
		const out = new Uint8Array(iv.byteLength + (cipher as ArrayBuffer).byteLength);
		out.set(iv, 0);
		out.set(new Uint8Array(cipher as ArrayBuffer), iv.byteLength);
		return out;
	}

	async decrypt(keyId: string, data: Uint8Array): Promise<Uint8Array> {
		const entry = this.keys.get(keyId);
		if (!entry || entry.algorithm !== 'AES-256' || !entry.key) {
			throw new Error('Decrypt requires AES-256 symmetric key');
		}
		const iv = data.subarray(0, 12);
		const ct = data.subarray(12);
		const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, entry.key, ct);
		return new Uint8Array(plain as ArrayBuffer);
	}

	async sign(keyId: string, data: Uint8Array): Promise<Uint8Array> {
		const entry = this.keys.get(keyId);
		if (!entry || entry.type !== 'asymmetric' || !entry.keyPair) {
			throw new Error('Sign requires asymmetric key');
		}
		if (entry.algorithm.startsWith('RSA')) {
			const sig = await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, entry.keyPair.privateKey, data);
			return new Uint8Array(sig as ArrayBuffer);
		}
		const hash = entry.algorithm === 'ECC-P384' ? 'SHA-384' : 'SHA-256';
		const sig = await crypto.subtle.sign({ name: 'ECDSA', hash }, entry.keyPair.privateKey, data);
		return new Uint8Array(sig as ArrayBuffer);
	}

	async verify(keyId: string, data: Uint8Array, signature: Uint8Array): Promise<boolean> {
		const entry = this.keys.get(keyId);
		if (!entry || entry.type !== 'asymmetric' || !entry.keyPair) {
			throw new Error('Verify requires asymmetric key');
		}
		if (entry.algorithm.startsWith('RSA')) {
			return crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, entry.keyPair.publicKey, signature, data);
		}
		const hash = entry.algorithm === 'ECC-P384' ? 'SHA-384' : 'SHA-256';
		return crypto.subtle.verify({ name: 'ECDSA', hash }, entry.keyPair.publicKey, signature, data);
	}

	async exportPublicKey(key: CryptoKey): Promise<string> {
		const spki = await crypto.subtle.exportKey('spki', key);
		const bytes = new Uint8Array(spki);
		let binary = '';
		for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
		const b64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(bytes).toString('base64');
		const pem = `-----BEGIN PUBLIC KEY-----\n${b64.match(/.{1,64}/g)?.join('\n') || b64}\n-----END PUBLIC KEY-----`;
		return pem;
	}

	async getAttestation(): Promise<HsmAttestation> {
		return { certificateChain: [], attestation: undefined };
	}

	async destroyKey(keyId: string): Promise<boolean> {
		return this.keys.delete(keyId);
	}
}

export function registerDefaultHsmProvider(): void {
	const provider = new LocalHsmProvider();
	hsm.registerProvider(provider.name, provider);
	hsm.useProvider(provider.name);
} 