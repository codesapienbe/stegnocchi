/**
 * Platform Abstraction Layer
 * Provides unified access to platform-specific implementations
 * while maintaining clean separation from core business logic
 */

import { Platform } from 'react-native';
import { getCoreConfig } from '@/core/config';
import { logInfo, Component } from '@/core/logger';

// Dynamic platform module loading
const platformModule = Platform.OS === 'web' 
  ? require('@/web')
  : require('@/native');

// Log platform initialization
logInfo(Component.PLATFORM, 'Platform abstraction initialized', { 
  platform: Platform.OS,
  config: getCoreConfig().performance 
});

export const PlatformAPI = {
  // File operations
  pickFiles: platformModule.pickFilesWeb || platformModule.pickFilesNative,
  takePhoto: platformModule.takePhotoWeb || platformModule.takePhotoNative,
  shareFile: platformModule.shareFileWeb || platformModule.shareFileNative,
  downloadFile: platformModule.downloadFileWeb || platformModule.downloadFileNative,

  // Animations
  animations: platformModule.WebAnimations || platformModule.NativeAnimations,

  // UI Components
  FileUpload: platformModule.WebFileUpload || platformModule.NativeFileUpload,
  Modal: platformModule.WebModal || platformModule.NativeModal,
  ScrollView: platformModule.WebScrollView || platformModule.NativeScrollView,

  // Utilities
  initializeAPIs: platformModule.initializeWebAPIs || platformModule.initializeNativeAPIs,
  setupEventListeners: platformModule.setupWebEventListeners || platformModule.setupNativeEventListeners,

  // Hooks
  useFilePicker: platformModule.useWebFilePicker || platformModule.useNativeFilePicker,
  useSharing: platformModule.useWebSharing || platformModule.useNativeSharing,
  useDownload: platformModule.useWebDownload || platformModule.useNativeDownload,
  useAnimations: platformModule.useWebAnimations || platformModule.useNativeAnimations,

  // Platform information
  getPlatformInfo: () => ({
    os: Platform.OS,
    version: Platform.Version,
    isWeb: Platform.OS === 'web',
    isNative: Platform.OS !== 'web',
  }),

  // Configuration access
  getConfig: getCoreConfig,
} as const;

// Export platform-specific types
export type { WebFilePickerOptions, WebDownloadOptions, WebAnimationConfig } from '@/web';
export type { NativeFilePickerOptions, NativeSharingOptions, NativeAnimationConfig } from '@/native';

// Export core configuration types for platform use
export type { CoreConfig } from '@/core/config';

// Re-export core sub-modules for platform-specific extensions
export { CoreCrypto, CoreVectors } from '@/core'; 