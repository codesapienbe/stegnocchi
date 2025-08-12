import { downloadJsonFile, DownloadResult } from './fileDownload';
import { logInfo, logError, Component } from '@/core/logger';
import { VectorMetadata } from '@/core/vectorMetadata';
import { serializeVectorMetadata, deserializeVectorMetadata, validateVectorMetadata } from '@/core/vectorMetadata';

export async function exportVectorMetadata(
  metadata: VectorMetadata,
  filename: string = 'vector-metadata.json'
): Promise<DownloadResult> {
  try {
    const validation = validateVectorMetadata(metadata);
    if (!validation.isValid) {
      const err = validation.errors.join('; ');
      logError(Component.APP, 'Vector metadata export failed: validation errors', { error: err });
      return { success: false, error: err };
    }
    const res = await downloadJsonFile(metadata, filename);
    if (res.success) {
      logInfo(Component.APP, 'Vector metadata exported', { filename });
    }
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Export failed';
    logError(Component.APP, 'Vector metadata export exception', { error: message });
    return { success: false, error: message };
  }
}

export async function importVectorMetadata(
  source: File | Blob | string
): Promise<{ success: boolean; data?: VectorMetadata; errors?: string[] }> {
  try {
    let jsonText: string;
    if (typeof source === 'string') {
      jsonText = source;
    } else if (typeof (source as any).text === 'function') {
      jsonText = await (source as any).text();
    } else if (typeof (source as any).arrayBuffer === 'function') {
      const buf = await (source as any).arrayBuffer();
      jsonText = new TextDecoder().decode(buf);
    } else {
      return { success: false, errors: ['Unsupported source type'] };
    }

    const des = deserializeVectorMetadata(jsonText);
    if (!des.success || !des.data) {
      const errs = des.errors || ['Invalid vector metadata JSON'];
      logError(Component.APP, 'Vector metadata import failed', { errors: errs });
      return { success: false, errors: errs };
    }

    logInfo(Component.APP, 'Vector metadata imported', { keys: Object.keys(des.data) });
    return { success: true, data: des.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Import failed';
    logError(Component.APP, 'Vector metadata import exception', { error: message });
    return { success: false, errors: [message] };
  }
} 