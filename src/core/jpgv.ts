import { ValidationResult } from '../types';
import { logError, logInfo, Component } from './logger';

export interface JpgvHeaderInfo {
  magic: 'JPGV';
  version: number;
  isCompressed: boolean;
  isEncrypted: boolean;
  payloadLength: number;
  headerOffset: number;
}

const MAGIC_BYTES = new Uint8Array([0x4a, 0x50, 0x47, 0x56]); // 'JPGV'
const HEADER_SIZE = 10; // 4 magic + 1 version + 1 flags + 4 length (BE)
const VERSION = 1;

function writeHeader(flags: number, length: number): Uint8Array {
  const header = new Uint8Array(HEADER_SIZE);
  header.set(MAGIC_BYTES, 0);
  header[4] = VERSION;
  header[5] = flags & 0xff;
  // big-endian uint32
  header[6] = (length >>> 24) & 0xff;
  header[7] = (length >>> 16) & 0xff;
  header[8] = (length >>> 8) & 0xff;
  header[9] = length & 0xff;
  return header;
}

function readHeader(bytes: Uint8Array, offset: number): JpgvHeaderInfo | null {
  if (offset < 0 || offset + HEADER_SIZE > bytes.length) return null;
  if (
    bytes[offset] !== MAGIC_BYTES[0] ||
    bytes[offset + 1] !== MAGIC_BYTES[1] ||
    bytes[offset + 2] !== MAGIC_BYTES[2] ||
    bytes[offset + 3] !== MAGIC_BYTES[3]
  ) {
    return null;
  }
  const version = bytes[offset + 4];
  const flags = bytes[offset + 5];
  const length =
    (bytes[offset + 6] << 24) |
    (bytes[offset + 7] << 16) |
    (bytes[offset + 8] << 8) |
    bytes[offset + 9];

  return {
    magic: 'JPGV',
    version,
    isCompressed: (flags & 0x01) === 0x01,
    isEncrypted: (flags & 0x02) === 0x02,
    payloadLength: length >>> 0,
    headerOffset: offset,
  };
}

function findTrailerHeaderOffset(bytes: Uint8Array): number {
  // Scan backwards for 'JPGV'
  for (let i = bytes.length - HEADER_SIZE; i >= 0; i--) {
    if (
      bytes[i] === MAGIC_BYTES[0] &&
      bytes[i + 1] === MAGIC_BYTES[1] &&
      bytes[i + 2] === MAGIC_BYTES[2] &&
      bytes[i + 3] === MAGIC_BYTES[3]
    ) {
      // Candidate
      const info = readHeader(bytes, i);
      if (info && i + HEADER_SIZE + info.payloadLength <= bytes.length) {
        return i;
      }
    }
  }
  return -1;
}

function hasJpegEOI(bytes: Uint8Array): boolean {
  // JPEG End Of Image marker 0xFF,0xD9 appears at the end of image data
  for (let i = 0; i < bytes.length - 1; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xd9) return true;
  }
  return false;
}

export function validateJpgv(bytes: Uint8Array): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const offset = findTrailerHeaderOffset(bytes);
  if (offset < 0) {
    errors.push('No JPGV header found');
    return { isValid: false, errors, warnings };
  }
  const info = readHeader(bytes, offset);
  if (!info) {
    errors.push('Invalid JPGV header');
    return { isValid: false, errors, warnings };
  }
  if (info.version !== VERSION) {
    warnings.push(`Unexpected JPGV version ${info.version}`);
  }
  if (info.payloadLength <= 0) {
    errors.push('Invalid payload length');
  }
  if (!hasJpegEOI(bytes.subarray(0, offset))) {
    warnings.push('JPEG EOI marker not detected before JPGV trailer');
  }
  return { isValid: errors.length === 0, errors, warnings };
}

export function encodeJpgv(
  jpegBytes: Uint8Array,
  vectorPayloadBase64: string,
  options?: { isCompressed?: boolean; isEncrypted?: boolean }
): Uint8Array {
  try {
    const payloadBytes = new TextEncoder().encode(vectorPayloadBase64);
    const flags = (options?.isCompressed ? 0x01 : 0x00) | (options?.isEncrypted ? 0x02 : 0x00);
    const header = writeHeader(flags, payloadBytes.byteLength);

    const out = new Uint8Array(jpegBytes.byteLength + header.byteLength + payloadBytes.byteLength);
    out.set(jpegBytes, 0);
    out.set(header, jpegBytes.byteLength);
    out.set(payloadBytes, jpegBytes.byteLength + header.byteLength);

    logInfo(Component.EXIF, 'Encoded JPGV file', {
      jpegBytes: jpegBytes.byteLength,
      payloadBytes: payloadBytes.byteLength,
      flags,
    });
    return out;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'JPGV encode error';
    logError(Component.EXIF, 'JPGV encode exception', { error: message });
    throw new Error(message);
  }
}

export function isJpgv(bytes: Uint8Array): boolean {
  return findTrailerHeaderOffset(bytes) >= 0;
}

export function isJpeg(bytes: Uint8Array): boolean {
  return bytes && bytes.length > 2 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

export function detectImageContainer(bytes: Uint8Array): 'jpgv' | 'jpeg' | 'unknown' {
  if (isJpgv(bytes)) return 'jpgv';
  if (isJpeg(bytes)) return 'jpeg';
  return 'unknown';
}

export function decodeJpgv(bytes: Uint8Array): {
  jpegBytes: Uint8Array;
  vectorPayloadBase64: string;
  header: JpgvHeaderInfo;
} {
  try {
    const offset = findTrailerHeaderOffset(bytes);
    if (offset < 0) throw new Error('JPGV header not found');
    const info = readHeader(bytes, offset);
    if (!info) throw new Error('Invalid JPGV header');

    const start = offset + HEADER_SIZE;
    const end = start + info.payloadLength;
    const payloadBytes = bytes.subarray(start, end);
    const vectorPayloadBase64 = new TextDecoder().decode(payloadBytes);
    const jpegBytes = bytes.subarray(0, offset);

    logInfo(Component.EXIF, 'Decoded JPGV file', {
      jpegBytes: jpegBytes.byteLength,
      payloadBytes: payloadBytes.byteLength,
      version: info.version,
      isCompressed: info.isCompressed,
      isEncrypted: info.isEncrypted,
    });

    return { jpegBytes, vectorPayloadBase64, header: info };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'JPGV decode error';
    logError(Component.EXIF, 'JPGV decode exception', { error: message });
    throw new Error(message);
  }
}

export function stripJpgv(bytes: Uint8Array): Uint8Array {
  const offset = findTrailerHeaderOffset(bytes);
  if (offset < 0) return bytes;
  const jpeg = bytes.subarray(0, offset);
  logInfo(Component.EXIF, 'Stripped JPGV trailer', { originalBytes: bytes.byteLength, jpegBytes: jpeg.byteLength });
  return jpeg;
}

export function isBackwardCompatibleJpeg(bytes: Uint8Array): boolean {
  // Backward compatibility strategy: we append only after EOI, so standard viewers stop at EOI
  // This check ensures EOI exists before our trailer
  const offset = findTrailerHeaderOffset(bytes);
  if (offset < 0) return hasJpegEOI(bytes);
  return hasJpegEOI(bytes.subarray(0, offset));
} 