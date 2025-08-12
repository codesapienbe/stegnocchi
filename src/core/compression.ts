import { logError, logInfo, Component } from './logger';

export interface CompressionResult {
  success: boolean;
  data?: Uint8Array;
  error?: string;
  metadata?: Record<string, any>;
}

export interface DecompressionResult {
  success: boolean;
  data?: Uint8Array;
  error?: string;
  metadata?: Record<string, any>;
}

const MAX_COMPRESS_INPUT_BYTES = 8 * 1024 * 1024; // 8MB safety limit
const MAX_DECOMPRESS_OUTPUT_BYTES = 64 * 1024 * 1024; // 64MB safety cap

function hasCompressionStream(): boolean {
  // @ts-expect-error runtime feature detect
  return typeof CompressionStream !== 'undefined';
}

async function compressWithCompressionStream(data: Uint8Array): Promise<Uint8Array> {
  // @ts-expect-error runtime feature
  const cs = new CompressionStream('gzip');
  const blob = new Blob([data]);
  const stream = blob.stream().pipeThrough(cs);
  const compressed = await new Response(stream).arrayBuffer();
  return new Uint8Array(compressed);
}

async function decompressWithDecompressionStream(data: Uint8Array): Promise<Uint8Array> {
  // @ts-expect-error runtime feature
  const ds = new DecompressionStream('gzip');
  const blob = new Blob([data]);
  const stream = blob.stream().pipeThrough(ds);
  const decompressed = await new Response(stream).arrayBuffer();
  return new Uint8Array(decompressed);
}

async function compressWithPako(data: Uint8Array): Promise<Uint8Array> {
  try {
    const mod: any = await import('pako');
    const out: Uint8Array = mod.gzip(data);
    return out;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown pako import error';
    throw new Error(`Pako gzip unavailable: ${message}`);
  }
}

async function decompressWithPako(data: Uint8Array): Promise<Uint8Array> {
  try {
    const mod: any = await import('pako');
    const out: Uint8Array = mod.ungzip(data);
    return out;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown pako import error';
    throw new Error(`Pako ungzip unavailable: ${message}`);
  }
}

export async function gzipCompress(data: Uint8Array): Promise<CompressionResult> {
  try {
    if (!(data instanceof Uint8Array)) {
      return { success: false, error: 'Input must be a Uint8Array' };
    }
    if (data.byteLength > MAX_COMPRESS_INPUT_BYTES) {
      return { success: false, error: `Input exceeds max size of ${MAX_COMPRESS_INPUT_BYTES} bytes` };
    }

    let compressed: Uint8Array;
    try {
      if (hasCompressionStream()) {
        compressed = await compressWithCompressionStream(data);
      } else {
        compressed = await compressWithPako(data);
      }
    } catch (primaryError) {
      // Fallback attempt if first strategy failed
      try {
        if (hasCompressionStream()) {
          compressed = await compressWithPako(data);
        } else {
          compressed = await compressWithCompressionStream(data);
        }
      } catch (fallbackError) {
        const message = fallbackError instanceof Error ? fallbackError.message : 'Compression failed';
        logError(Component.APP, 'GZIP compression failed', {
          inputBytes: data.byteLength,
          error: message,
        });
        return { success: false, error: message };
      }
    }

    logInfo(Component.APP, 'GZIP compression succeeded', {
      inputBytes: data.byteLength,
      outputBytes: compressed.byteLength,
      ratio: data.byteLength > 0 ? +(compressed.byteLength / data.byteLength).toFixed(3) : null,
    });

    return { success: true, data: compressed, metadata: { inputBytes: data.byteLength, outputBytes: compressed.byteLength } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown compression error';
    logError(Component.APP, 'GZIP compression exception', { error: message });
    return { success: false, error: message };
  }
}

export async function gzipDecompress(data: Uint8Array): Promise<DecompressionResult> {
  try {
    if (!(data instanceof Uint8Array)) {
      return { success: false, error: 'Input must be a Uint8Array' };
    }

    let decompressed: Uint8Array;
    try {
      if (hasCompressionStream()) {
        decompressed = await decompressWithDecompressionStream(data);
      } else {
        decompressed = await decompressWithPako(data);
      }
    } catch (primaryError) {
      // Fallback attempt if first strategy failed
      try {
        if (hasCompressionStream()) {
          decompressed = await decompressWithPako(data);
        } else {
          decompressed = await decompressWithDecompressionStream(data);
        }
      } catch (fallbackError) {
        const message = fallbackError instanceof Error ? fallbackError.message : 'Decompression failed';
        logError(Component.APP, 'GZIP decompression failed', {
          inputBytes: data.byteLength,
          error: message,
        });
        return { success: false, error: message };
      }
    }

    if (decompressed.byteLength > MAX_DECOMPRESS_OUTPUT_BYTES) {
      const msg = `Decompressed output exceeds limit of ${MAX_DECOMPRESS_OUTPUT_BYTES} bytes`;
      logError(Component.APP, 'GZIP decompression exceeded output limit', {
        inputBytes: data.byteLength,
        outputBytes: decompressed.byteLength,
      });
      return { success: false, error: msg };
    }

    logInfo(Component.APP, 'GZIP decompression succeeded', {
      inputBytes: data.byteLength,
      outputBytes: decompressed.byteLength,
    });

    return { success: true, data: decompressed, metadata: { inputBytes: data.byteLength, outputBytes: decompressed.byteLength } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown decompression error';
    logError(Component.APP, 'GZIP decompression exception', { error: message });
    return { success: false, error: message };
  }
}

export async function gzipCompressString(input: string): Promise<CompressionResult> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  return gzipCompress(bytes);
}

export async function gzipDecompressToString(input: Uint8Array): Promise<DecompressionResult> {
  const result = await gzipDecompress(input);
  if (!result.success || !result.data) return result;
  const decoder = new TextDecoder();
  const text = decoder.decode(result.data);
  return { success: true, data: result.data, metadata: { text } };
} 