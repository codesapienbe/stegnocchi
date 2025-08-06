/**
 * Native Module Index
 * React Native-specific implementations and dependencies
 */

// Native-specific file picker
export { pickFiles as pickFilesNative } from '../utils/filePicker';
export { takePhoto as takePhotoNative } from '../utils/filePicker';
export { shareFile as shareFileNative } from '../utils/fileSharing';

// Native-specific animations (React Native Animated, Lottie)
export { default as NativeAnimations } from './animations/NativeAnimations';

// Native-specific UI components
export { default as NativeFileUpload } from './components/NativeFileUpload';
export { default as NativeModal } from './components/NativeModal';
export { default as NativeScrollView } from './components/NativeScrollView';

// Native-specific utilities
export { initializeNativeAPIs } from './utils/nativeAPIs';
export { setupNativeEventListeners } from './utils/nativeEvents';

// Native-specific hooks
export { useNativeFilePicker } from './hooks/useNativeFilePicker';
export { useNativeSharing } from './hooks/useNativeSharing';
export { useNativeAnimations } from './hooks/useNativeAnimations';

// Native-specific types
export type {
  NativeFilePickerOptions,
  NativeSharingOptions,
  NativeAnimationConfig,
} from './types'; 