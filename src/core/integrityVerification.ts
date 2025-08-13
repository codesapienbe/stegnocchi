import { logInfo, logWarn, logError, Component } from './logger';

export type SupportedHash = 'SHA-256';
export type PublicKeyType = 'rsa' | 'ecdsa';

function getSubtleCrypto(): SubtleCrypto | null {
	try {
		if (typeof crypto !== 'undefined' && crypto?.subtle) return crypto.subtle;
		// @ts-ignore: React Native polyfills may expose subtle via globalThis
		if (typeof globalThis !== 'undefined' && (globalThis as any)?.crypto?.subtle) return (globalThis as any).crypto.subtle;
	} catch {}
	return null;
}

function decodeBase64(input: string): Uint8Array {
	try {
		if (typeof atob === 'function') {
			const bin = atob(input);
			const out = new Uint8Array(bin.length);
			for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
			return out;
		}
	} catch {}
	// Fallback for environments without atob
	const buffer = Buffer.from(input, 'base64');
	return new Uint8Array(buffer);
}

function pemToBinary(pem: string): ArrayBuffer {
	const cleaned = pem
		.replace(/-----BEGIN [^-]+-----/g, '')
		.replace(/-----END [^-]+-----/g, '')
		.replace(/\s+/g, '');
	return decodeBase64(cleaned).buffer;
}

export async function importRsaPublicKey(pem: string, hash: SupportedHash = 'SHA-256'): Promise<CryptoKey | null> {
	const subtle = getSubtleCrypto();
	if (!subtle) {
		logWarn(Component.APP, 'WebCrypto Subtle API not available for RSA import');
		return null;
	}
	try {
		const spki = pemToBinary(pem);
		const key = await subtle.importKey(
			'spki',
			spki,
			{
				name: 'RSASSA-PKCS1-v1_5',
				hash: { name: hash },
			},
			true,
			['verify']
		);
		logInfo(Component.APP, 'RSA public key imported for verification');
		return key;
	} catch (e) {
		logError(Component.APP, 'RSA public key import failed', { message: e instanceof Error ? e.message : String(e) });
		return null;
	}
}

export async function importEcdsaPublicKey(pem: string, hash: SupportedHash = 'SHA-256'): Promise<CryptoKey | null> {
	const subtle = getSubtleCrypto();
	if (!subtle) {
		logWarn(Component.APP, 'WebCrypto Subtle API not available for ECDSA import');
		return null;
	}
	try {
		const spki = pemToBinary(pem);
		const key = await subtle.importKey(
			'spki',
			spki,
			{
				name: 'ECDSA',
				namedCurve: 'P-256',
			},
			true,
			['verify']
		);
		logInfo(Component.APP, 'ECDSA public key imported for verification', { curve: 'P-256' });
		return key;
	} catch (e) {
		logError(Component.APP, 'ECDSA public key import failed', { message: e instanceof Error ? e.message : String(e) });
		return null;
	}
}

export async function verifySignature(
	payload: string | ArrayBuffer | Uint8Array,
	signatureBase64: string,
	publicKeyPem: string,
	keyType: PublicKeyType = 'rsa',
	hash: SupportedHash = 'SHA-256'
): Promise<boolean> {
	const subtle = getSubtleCrypto();
	if (!subtle) {
		logWarn(Component.APP, 'WebCrypto Subtle API not available for signature verification');
		return false;
	}
	try {
		const key = keyType === 'rsa' ? await importRsaPublicKey(publicKeyPem, hash) : await importEcdsaPublicKey(publicKeyPem, hash);
		if (!key) return false;

		let data: ArrayBuffer;
		if (typeof payload === 'string') {
			data = new TextEncoder().encode(payload).buffer;
		} else if (payload instanceof Uint8Array) {
			data = payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength);
		} else {
			data = payload;
		}

		const sig = decodeBase64(signatureBase64);
		const algorithm: AlgorithmIdentifier | EcKeyImportParams | RsaHashedImportParams =
			keyType === 'rsa'
				? { name: 'RSASSA-PKCS1-v1_5' }
				: { name: 'ECDSA', hash: { name: hash } };

		const verified = await subtle.verify(algorithm as any, key, sig, data);
		logInfo(Component.APP, 'Signature verification completed', { keyType, verified });
		return !!verified;
	} catch (e) {
		logError(Component.APP, 'Signature verification error', { message: e instanceof Error ? e.message : String(e) });
		return false;
	}
}

export async function calculateSha256Base64(input: string | ArrayBuffer | Uint8Array): Promise<string | null> {
	const subtle = getSubtleCrypto();
	if (!subtle) {
		logWarn(Component.APP, 'WebCrypto Subtle API not available for hashing');
		return null;
	}
	try {
		let data: ArrayBuffer;
		if (typeof input === 'string') {
			data = new TextEncoder().encode(input).buffer;
		} else if (input instanceof Uint8Array) {
			data = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
		} else {
			data = input;
		}
		const digest = await subtle.digest('SHA-256', data);
		const bytes = new Uint8Array(digest);
		let bin = '';
		for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
		const b64 = typeof btoa === 'function' ? btoa(bin) : Buffer.from(bytes).toString('base64');
		logInfo(Component.APP, 'SHA-256 digest computed');
		return b64;
	} catch (e) {
		logError(Component.APP, 'Hash computation failed', { message: e instanceof Error ? e.message : String(e) });
		return null;
	}
} 