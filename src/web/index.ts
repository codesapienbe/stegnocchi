/**
 * Web Module Index
 * Web-specific implementations and dependencies
 */

// Web-specific utilities
import { pickFiles as pickFilesWeb, takePhoto as takePhotoWeb } from '@/web/utils/filePicker';
import { shareFile as shareFileWeb } from '@/web/utils/fileSharing';
import { downloadFile as downloadFileWeb } from '@/web/utils/fileDownload';
import { deriveKeyKdf as deriveKeyKdfWeb, benchmarkKdf as benchmarkKdfWeb } from '@/web/utils/kdf';
import { overwriteAndDeleteFile as overwriteAndDeleteFileWeb, purgeMemoryBuffer as purgeMemoryBufferWeb, getSecureDeletionCapabilities as getSecureDeletionCapabilitiesWeb } from '@/web/utils/secureDeletion';
export { pickFilesWeb, takePhotoWeb, shareFileWeb, downloadFileWeb };
export { deriveKeyKdfWeb, benchmarkKdfWeb, overwriteAndDeleteFileWeb, purgeMemoryBufferWeb, getSecureDeletionCapabilitiesWeb };

// Web-specific animations (bundle shared animation components)
import * as Animations from '@/components/animations';
export const WebAnimations = Animations;

// Web-specific UI components mapped to shared components
export { DragDropZone as WebFileUpload } from '@/components/DragDropZone';
export { MobileModal as WebModal } from '@/components/layout/MobileModal';
export { MobileScrollView as WebScrollView } from '@/components/layout/MobileScrollView';

// Minimal web utilities for setup (no-op placeholders to preserve API)
export async function initializeWebAPIs(): Promise<void> {
  return;
}

export function setupWebEventListeners(): void {
  return;
}

// Web-specific hooks
import { useCallback } from 'react';
import type { FilePickerOptions, FilePickerResult } from '@/web/utils/filePicker';
import type { DownloadOptions } from '@/web/utils/fileDownload';

export function useWebFilePicker() {
  return useCallback((options?: FilePickerOptions): Promise<FilePickerResult> => pickFilesWeb(options), []);
}

export function useWebDownload() {
  return useCallback((data: Blob | ArrayBuffer | string, options?: DownloadOptions) => downloadFileWeb(data, options), []);
}

export function useWebAnimations() {
  return Animations;
}

export function useWebSharing() {
  return useCallback(() => shareFileWeb, []);
}

// Web-specific types
export type { FilePickerOptions as WebFilePickerOptions, FilePickerResult as WebFilePickerResult } from '@/web/utils/filePicker';
export type { DownloadOptions as WebDownloadOptions } from '@/web/utils/fileDownload';
export type WebAnimationConfig = Record<string, unknown>;
export type { KdfParams as WebKdfParams, KdfAlgorithm as WebKdfAlgorithm } from '@/web/utils/kdf'; 