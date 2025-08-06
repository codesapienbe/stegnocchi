/**
 * Web Module Index
 * Web-specific implementations and dependencies
 */

// Web-specific file picker
export { pickFiles as pickFilesWeb } from '../utils/filePicker';
export { downloadFile as downloadFileWeb } from '../utils/fileSharing';

// Web-specific animations (Framer Motion, Lottie)
export { default as WebAnimations } from './animations/WebAnimations';

// Web-specific UI components
export { default as WebFileUpload } from './components/WebFileUpload';
export { default as WebModal } from './components/WebModal';
export { default as WebScrollView } from './components/WebScrollView';

// Web-specific utilities
export { initializeWebAPIs } from './utils/webAPIs';
export { setupWebEventListeners } from './utils/webEvents';

// Web-specific hooks
export { useWebFilePicker } from './hooks/useWebFilePicker';
export { useWebDownload } from './hooks/useWebDownload';
export { useWebAnimations } from './hooks/useWebAnimations';

// Web-specific types
export type {
  WebFilePickerOptions,
  WebDownloadOptions,
  WebAnimationConfig,
} from './types'; 