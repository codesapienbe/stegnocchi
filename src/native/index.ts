/**
 * Native Module Index
 * React Native-specific implementations and dependencies
 */

// Native-specific utilities (use cross-platform implementations that rely on Expo APIs)
export { pickFiles as pickFilesNative, takePhoto as takePhotoNative } from '@/utils/filePicker';
export { shareFile as shareFileNative } from '@/utils/fileSharing';

// Native does not support download like web; provide a no-op or share fallback
export async function downloadFileNative(): Promise<false> {
  return false;
}

// Native-specific animations (bundle shared animation components)
import * as Animations from '@/components/animations';
export const NativeAnimations = Animations;

// Native-specific UI components mapped to shared components
export { DragDropZone as NativeFileUpload } from '@/components/DragDropZone';
export { MobileModal as NativeModal } from '@/components/layout/MobileModal';
export { MobileScrollView as NativeScrollView } from '@/components/layout/MobileScrollView';

// Minimal native utilities for setup (no-op placeholders to preserve API)
export async function initializeNativeAPIs(): Promise<void> {
  return;
}

export function setupNativeEventListeners(): void {
  return;
}

// Native-specific hooks
import { useCallback } from 'react';
import type { FilePickerOptions, FilePickerResult } from '@/utils/filePicker';

export function useNativeFilePicker() {
  return useCallback((options?: FilePickerOptions): Promise<FilePickerResult> => pickFilesNative(options), []);
}

export function useNativeSharing() {
  return useCallback(() => shareFileNative, []);
}

export function useNativeAnimations() {
  return Animations;
}

export function useNativeDownload() {
  return useCallback(() => downloadFileNative, []);
}

// Native-specific types
export type { FilePickerOptions as NativeFilePickerOptions, FilePickerResult as NativeFilePickerResult } from '@/utils/filePicker';
export type NativeSharingOptions = Record<string, unknown>;
export type NativeAnimationConfig = Record<string, unknown>; 