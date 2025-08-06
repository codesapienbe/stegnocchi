/**
 * Internationalization (i18n) System
 * Multi-language support for the Stegnocchi application
 */

export interface I18nConfig {
  defaultLocale: string;
  fallbackLocale: string;
  supportedLocales: string[];
  loadPath: string;
}

export interface TranslationData {
  [key: string]: string | TranslationData;
}

export interface I18nInstance {
  t: (key: string, params?: Record<string, any>) => string;
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  getSupportedLocales: () => string[];
  isRTL: () => boolean;
}

// Supported languages and their configurations
const SUPPORTED_LOCALES = {
  'en': {
    name: 'English',
    nativeName: 'English',
    rtl: false,
  },
  'es': {
    name: 'Spanish',
    nativeName: 'Español',
    rtl: false,
  },
  'fr': {
    name: 'French',
    nativeName: 'Français',
    rtl: false,
  },
  'de': {
    name: 'German',
    nativeName: 'Deutsch',
    rtl: false,
  },
  'it': {
    name: 'Italian',
    nativeName: 'Italiano',
    rtl: false,
  },
  'pt': {
    name: 'Portuguese',
    nativeName: 'Português',
    rtl: false,
  },
  'ru': {
    name: 'Russian',
    nativeName: 'Русский',
    rtl: false,
  },
  'zh': {
    name: 'Chinese (Simplified)',
    nativeName: '中文 (简体)',
    rtl: false,
  },
  'ja': {
    name: 'Japanese',
    nativeName: '日本語',
    rtl: false,
  },
  'ko': {
    name: 'Korean',
    nativeName: '한국어',
    rtl: false,
  },
  'ar': {
    name: 'Arabic',
    nativeName: 'العربية',
    rtl: true,
  },
  'he': {
    name: 'Hebrew',
    nativeName: 'עברית',
    rtl: true,
  },
};

// Default translations (English)
const DEFAULT_TRANSLATIONS: TranslationData = {
  common: {
    appName: 'Stegnocchi',
    appSubtitle: 'EXIF Steganography',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    retry: 'Retry',
    reset: 'Reset',
    clear: 'Clear',
    copy: 'Copy',
    paste: 'Paste',
    share: 'Share',
    download: 'Download',
    upload: 'Upload',
    select: 'Select',
    choose: 'Choose',
    browse: 'Browse',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    refresh: 'Refresh',
    settings: 'Settings',
    help: 'Help',
    about: 'About',
    version: 'Version',
    language: 'Language',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    autoMode: 'Auto',
    accessibility: 'Accessibility',
    privacy: 'Privacy',
    security: 'Security',
    terms: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
    contact: 'Contact',
    feedback: 'Feedback',
    rate: 'Rate App',
    support: 'Support',
  },
  navigation: {
    home: 'Home',
    main: 'Main',
    result: 'Result',
    settings: 'Settings',
    help: 'Help',
    about: 'About',
  },
  main: {
    title: 'Hide or Extract Secret Messages',
    subtitle: 'Use EXIF steganography to conceal data in images',
    hideMode: 'Hide Message',
    extractMode: 'Extract Message',
    selectImage: 'Select Image',
    takePhoto: 'Take Photo',
    dragDropText: 'Drag and drop an image here, or click to browse',
    supportedFormats: 'Supported formats: JPEG, PNG, HEIC, WebP',
    maxFileSize: 'Maximum file size: {size}',
    processing: 'Processing...',
    processingImage: 'Processing image...',
    encrypting: 'Encrypting message...',
    injecting: 'Injecting into EXIF...',
    extracting: 'Extracting from EXIF...',
    decrypting: 'Decrypting message...',
    success: 'Operation completed successfully!',
    error: 'An error occurred',
    tryAgain: 'Please try again',
  },
  message: {
    title: 'Secret Message',
    placeholder: 'Enter your secret message here...',
    maxLength: 'Maximum {length} characters',
    currentLength: '{current} of {max} characters',
    password: 'Password',
    passwordPlaceholder: 'Enter a strong password',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Confirm your password',
    passwordMismatch: 'Passwords do not match',
    passwordStrength: 'Password Strength',
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
    veryStrong: 'Very Strong',
    passwordRequirements: 'Password must be at least 8 characters long',
    passwordFeedback: {
      length: 'At least 8 characters',
      lowercase: 'Include lowercase letters',
      uppercase: 'Include uppercase letters',
      numbers: 'Include numbers',
      symbols: 'Include symbols',
      common: 'Avoid common passwords',
      repeated: 'Avoid repeated characters',
      patterns: 'Avoid keyboard patterns',
    },
  },
  result: {
    title: 'Operation Result',
    success: 'Success!',
    error: 'Error',
    messageHidden: 'Message successfully hidden in image',
    messageExtracted: 'Message successfully extracted',
    downloadImage: 'Download Image',
    shareImage: 'Share Image',
    copyMessage: 'Copy Message',
    messageCopied: 'Message copied to clipboard',
    newOperation: 'Start New Operation',
    viewDetails: 'View Details',
    hideDetails: 'Hide Details',
    technicalDetails: 'Technical Details',
    encryptionAlgorithm: 'Encryption Algorithm',
    keySize: 'Key Size',
    iterations: 'Iterations',
    salt: 'Salt',
    iv: 'Initialization Vector',
    timestamp: 'Timestamp',
    fileSize: 'File Size',
    originalSize: 'Original Size',
    processedSize: 'Processed Size',
    compressionRatio: 'Compression Ratio',
  },
  settings: {
    title: 'Settings',
    general: 'General',
    security: 'Security',
    accessibility: 'Accessibility',
    about: 'About',
    language: 'Language',
    theme: 'Theme',
    autoTheme: 'Auto (System)',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    biometricAuth: 'Biometric Authentication',
    biometricEnabled: 'Enable biometric authentication',
    biometricUnavailable: 'Biometric authentication not available',
    autoLock: 'Auto Lock',
    autoLockTimeout: 'Auto lock timeout',
    never: 'Never',
    oneMinute: '1 minute',
    fiveMinutes: '5 minutes',
    fifteenMinutes: '15 minutes',
    thirtyMinutes: '30 minutes',
    oneHour: '1 hour',
    reduceMotion: 'Reduce Motion',
    reduceMotionDescription: 'Reduce animations for accessibility',
    highContrast: 'High Contrast',
    highContrastDescription: 'Increase contrast for better visibility',
    largeText: 'Large Text',
    largeTextDescription: 'Increase text size for better readability',
    screenReader: 'Screen Reader',
    screenReaderDescription: 'Optimize for screen readers',
    hapticFeedback: 'Haptic Feedback',
    hapticFeedbackDescription: 'Provide tactile feedback for interactions',
    soundEffects: 'Sound Effects',
    soundEffectsDescription: 'Play sound effects for interactions',
    privacy: 'Privacy',
    analytics: 'Analytics',
    analyticsDescription: 'Help improve the app by sharing usage data',
    crashReports: 'Crash Reports',
    crashReportsDescription: 'Send crash reports to help fix issues',
    clearData: 'Clear All Data',
    clearDataDescription: 'Remove all stored data and settings',
    clearDataConfirm: 'Are you sure you want to clear all data? This action cannot be undone.',
    version: 'Version {version}',
    buildNumber: 'Build {build}',
    copyright: '© 2024 Stegnocchi. All rights reserved.',
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
    acknowledgments: 'Acknowledgments',
    licenses: 'Licenses',
  },
  errors: {
    general: 'Something went wrong',
    network: 'Network error. Please check your connection.',
    timeout: 'Request timed out. Please try again.',
    fileTooLarge: 'File is too large. Maximum size is {size}.',
    unsupportedFormat: 'Unsupported file format. Please use JPEG, PNG, HEIC, or WebP.',
    corruptedFile: 'File appears to be corrupted.',
    noMessageFound: 'No hidden message found in this image.',
    wrongPassword: 'Incorrect password. Please try again.',
    encryptionFailed: 'Encryption failed. Please try again.',
    decryptionFailed: 'Decryption failed. Please try again.',
    exifInjectionFailed: 'Failed to inject data into EXIF.',
    exifExtractionFailed: 'Failed to extract data from EXIF.',
    rateLimitExceeded: 'Too many requests. Please wait {time} seconds.',
    biometricNotAvailable: 'Biometric authentication is not available.',
    biometricFailed: 'Biometric authentication failed.',
    storageError: 'Failed to save data.',
    permissionDenied: 'Permission denied.',
    cameraUnavailable: 'Camera is not available.',
    galleryUnavailable: 'Gallery is not available.',
    shareUnavailable: 'Sharing is not available.',
    downloadUnavailable: 'Download is not available.',
  },
  accessibility: {
    hideMessageButton: 'Hide message in image',
    extractMessageButton: 'Extract message from image',
    selectImageButton: 'Select image from gallery',
    takePhotoButton: 'Take photo with camera',
    passwordInput: 'Enter password for encryption',
    messageInput: 'Enter secret message to hide',
    downloadButton: 'Download processed image',
    shareButton: 'Share image',
    copyButton: 'Copy message to clipboard',
    settingsButton: 'Open settings',
    helpButton: 'Open help',
    aboutButton: 'Open about page',
    closeButton: 'Close dialog',
    confirmButton: 'Confirm action',
    cancelButton: 'Cancel action',
    loadingIndicator: 'Loading, please wait',
    successIndicator: 'Operation completed successfully',
    errorIndicator: 'An error occurred',
    passwordStrengthIndicator: 'Password strength indicator',
    fileSizeIndicator: 'File size indicator',
    progressIndicator: 'Progress indicator',
  },
};

class I18n implements I18nInstance {
  private locale: string;
  private fallbackLocale: string;
  private translations: Map<string, TranslationData>;
  private config: I18nConfig;

  constructor(config: I18nConfig) {
    this.config = config;
    this.locale = config.defaultLocale;
    this.fallbackLocale = config.fallbackLocale;
    this.translations = new Map();
    
    // Load default translations
    this.translations.set('en', DEFAULT_TRANSLATIONS);
  }

  /**
   * Get translation for a key
   */
  t(key: string, params?: Record<string, any>): string {
    const translation = this.getTranslation(key);
    if (!translation) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    return this.interpolate(translation, params);
  }

  /**
   * Set locale and load translations
   */
  async setLocale(locale: string): Promise<void> {
    if (!this.config.supportedLocales.includes(locale)) {
      console.warn(`Unsupported locale: ${locale}`);
      return;
    }

    this.locale = locale;
    
    // Load translations if not already loaded
    if (!this.translations.has(locale)) {
      await this.loadTranslations(locale);
    }
  }

  /**
   * Get current locale
   */
  getLocale(): string {
    return this.locale;
  }

  /**
   * Get supported locales
   */
  getSupportedLocales(): string[] {
    return this.config.supportedLocales;
  }

  /**
   * Check if current locale is RTL
   */
  isRTL(): boolean {
    const localeConfig = SUPPORTED_LOCALES[this.locale as keyof typeof SUPPORTED_LOCALES];
    return localeConfig?.rtl || false;
  }

  /**
   * Get locale information
   */
  getLocaleInfo(locale: string) {
    return SUPPORTED_LOCALES[locale as keyof typeof SUPPORTED_LOCALES];
  }

  /**
   * Get all locale information
   */
  getAllLocaleInfo() {
    return SUPPORTED_LOCALES;
  }

  /**
   * Get translation for a key
   */
  private getTranslation(key: string): string | undefined {
    const keys = key.split('.');
    let current: any = this.translations.get(this.locale) || this.translations.get(this.fallbackLocale);

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return undefined;
      }
    }

    return typeof current === 'string' ? current : undefined;
  }

  /**
   * Interpolate parameters into translation string
   */
  private interpolate(text: string, params?: Record<string, any>): string {
    if (!params) return text;

    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match;
    });
  }

  /**
   * Load translations for a locale
   */
  private async loadTranslations(locale: string): Promise<void> {
    try {
      // In a real app, this would load from a file or API
      // For now, we'll use a simple approach
      if (locale === 'en') {
        this.translations.set(locale, DEFAULT_TRANSLATIONS);
      } else {
        // Load from dynamic import or API
        const translations = await this.fetchTranslations(locale);
        this.translations.set(locale, translations);
      }
    } catch (error) {
      console.error(`Failed to load translations for ${locale}:`, error);
      // Fallback to default locale
      this.translations.set(locale, DEFAULT_TRANSLATIONS);
    }
  }

  /**
   * Fetch translations from API or file
   */
  private async fetchTranslations(locale: string): Promise<TranslationData> {
    // In a real implementation, this would fetch from an API or load from a file
    // For now, return empty object to fallback to default
    return {};
  }
}

// Global i18n instance
export const i18n = new I18n({
  defaultLocale: 'en',
  fallbackLocale: 'en',
  supportedLocales: Object.keys(SUPPORTED_LOCALES),
  loadPath: '/locales',
});

export default i18n; 