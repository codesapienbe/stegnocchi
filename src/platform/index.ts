/**
 * Platform Abstraction Layer
 * Unified APIs for web and native platforms
 */

import { Platform } from 'react-native';

// Core functionality (platform-agnostic)
export * from '../core';

// Platform-specific implementations
let platformModule: any;

if (Platform.OS === 'web') {
  platformModule = require('../web');
} else {
  platformModule = require('../native');
}

// Unified platform APIs
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
};

// Platform detection
export const isWeb = Platform.OS === 'web';
export const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// Platform capabilities
export const PlatformCapabilities = {
  hasFileAPI: isWeb,
  hasCamera: isNative,
  hasSharing: isNative,
  hasBiometrics: isNative,
  hasHapticFeedback: isNative,
  hasClipboard: true,
  hasGeolocation: true,
};

// Platform-specific configuration
export const PlatformConfig = {
  maxFileSize: isWeb ? 50 * 1024 * 1024 : 100 * 1024 * 1024, // 50MB web, 100MB native
  supportedImageFormats: isWeb ? ['image/jpeg', 'image/png'] : ['image/jpeg', 'image/png', 'image/heic'],
  animationLibrary: isWeb ? 'framer-motion' : 'react-native-animated',
  filePickerType: isWeb ? 'input' : 'expo-image-picker',
};

// Platform-specific error messages
export const PlatformErrors = {
  filePickerCancelled: isWeb ? 'File selection was cancelled' : 'Image selection was cancelled',
  fileTooLarge: isWeb ? 'File is too large for web upload' : 'File is too large for mobile processing',
  unsupportedFormat: isWeb ? 'Unsupported file format for web' : 'Unsupported image format for mobile',
  permissionDenied: isWeb ? 'File access permission denied' : 'Camera/photo library permission denied',
  networkError: isWeb ? 'Network error during file upload' : 'Network error during file processing',
};

// Platform-specific success messages
export const PlatformSuccess = {
  fileUploaded: isWeb ? 'File uploaded successfully' : 'Image selected successfully',
  fileDownloaded: isWeb ? 'File downloaded successfully' : 'File saved to device',
  fileShared: isWeb ? 'File shared successfully' : 'File shared via native sharing',
  messageHidden: isWeb ? 'Message hidden in image' : 'Message hidden in image',
  messageExtracted: isWeb ? 'Message extracted from image' : 'Message extracted from image',
};

// Platform-specific validation
export const PlatformValidation = {
  validateFileSize: (size: number): boolean => {
    return size <= PlatformConfig.maxFileSize;
  },

  validateFileType: (type: string): boolean => {
    return PlatformConfig.supportedImageFormats.includes(type);
  },

  validatePlatformSupport: (feature: string): boolean => {
    const featureMap: Record<string, boolean> = {
      'file-picker': true,
      'camera': isNative,
      'sharing': isNative,
      'biometrics': isNative,
      'haptic-feedback': isNative,
      'clipboard': true,
      'geolocation': true,
    };
    return featureMap[feature] || false;
  },
};

// Platform-specific initialization
export const PlatformInit = {
  async initialize(): Promise<void> {
    try {
      // Initialize platform-specific APIs
      await PlatformAPI.initializeAPIs();
      
      // Setup platform-specific event listeners
      PlatformAPI.setupEventListeners();
      
      console.log(`Platform initialized: ${Platform.OS}`);
    } catch (error) {
      console.error('Platform initialization failed:', error);
      throw error;
    }
  },

  async checkPermissions(): Promise<Record<string, boolean>> {
    const permissions: Record<string, boolean> = {};
    
    if (isNative) {
      // Check native permissions
      permissions.camera = await this.checkCameraPermission();
      permissions.photoLibrary = await this.checkPhotoLibraryPermission();
      permissions.storage = await this.checkStoragePermission();
    } else {
      // Web permissions are typically handled by the browser
      permissions.fileAccess = true;
    }
    
    return permissions;
  },

  private async checkCameraPermission(): Promise<boolean> {
    if (!isNative) return false;
    // Implementation would use expo-camera or similar
    return true;
  },

  private async checkPhotoLibraryPermission(): Promise<boolean> {
    if (!isNative) return false;
    // Implementation would use expo-image-picker
    return true;
  },

  private async checkStoragePermission(): Promise<boolean> {
    if (!isNative) return false;
    // Implementation would use expo-file-system
    return true;
  },
};

// Export platform-specific types
export type { WebFilePickerOptions, WebDownloadOptions, WebAnimationConfig } from '@/web';
export type { NativeFilePickerOptions, NativeSharingOptions, NativeAnimationConfig } from '@/native'; 