import { Platform } from 'react-native';
import { logInfo, logError, Component } from '../core/logger';

export interface PWAConfig {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  orientation: 'portrait' | 'landscape' | 'any';
  scope: string;
  startUrl: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
    purpose?: 'maskable' | 'any';
  }>;
}

export interface PWAFeatures {
  installable: boolean;
  offline: boolean;
  pushNotifications: boolean;
  backgroundSync: boolean;
  shareTarget: boolean;
  fileHandler: boolean;
}

/**
 * PWA features utility for progressive web app functionality
 */
export class PWAFeatures {
  private config: PWAConfig;
  private features: PWAFeatures;

  constructor(config?: Partial<PWAConfig>) {
    this.config = {
      name: 'Stegnocchi',
      shortName: 'Stegnocchi',
      description: 'Advanced EXIF Steganography Application',
      themeColor: '#007AFF',
      backgroundColor: '#FFFFFF',
      display: 'standalone',
      orientation: 'any',
      scope: '/',
      startUrl: '/',
      icons: [
        {
          src: '/assets/logo-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/assets/logo-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
      ...config,
    };

    this.features = this.detectFeatures();
  }

  /**
   * Detect PWA features support
   */
  private detectFeatures(): PWAFeatures {
    if (Platform.OS !== 'web') {
      return {
        installable: false,
        offline: false,
        pushNotifications: false,
        backgroundSync: false,
        shareTarget: false,
        fileHandler: false,
      };
    }

    return {
      installable: this.isInstallable(),
      offline: this.isOfflineSupported(),
      pushNotifications: this.isPushNotificationsSupported(),
      backgroundSync: this.isBackgroundSyncSupported(),
      shareTarget: this.isShareTargetSupported(),
      fileHandler: this.isFileHandlerSupported(),
    };
  }

  /**
   * Check if app is installable
   */
  private isInstallable(): boolean {
    return 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window;
  }

  /**
   * Check if offline functionality is supported
   */
  private isOfflineSupported(): boolean {
    return 'serviceWorker' in navigator && 'caches' in window;
  }

  /**
   * Check if push notifications are supported
   */
  private isPushNotificationsSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Check if background sync is supported
   */
  private isBackgroundSyncSupported(): boolean {
    return 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
  }

  /**
   * Check if share target is supported
   */
  private isShareTargetSupported(): boolean {
    return 'share' in navigator;
  }

  /**
   * Check if file handler is supported
   */
  private isFileHandlerSupported(): boolean {
    return 'launchQueue' in window;
  }

  /**
   * Register service worker
   */
  async registerServiceWorker(): Promise<boolean> {
    if (Platform.OS !== 'web' || !('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      logInfo(Component.UI, 'Service worker registered', {
        scope: registration.scope,
        updateViaCache: registration.updateViaCache,
      });

      return true;
    } catch (error) {
      logError(Component.UI, 'Service worker registration failed', { error });
      return false;
    }
  }

  /**
   * Install PWA
   */
  async installPWA(): Promise<boolean> {
    if (Platform.OS !== 'web' || !this.features.installable) {
      return false;
    }

    try {
      // Trigger install prompt
      const promptEvent = new Event('beforeinstallprompt');
      window.dispatchEvent(promptEvent);
      
      logInfo(Component.UI, 'PWA install prompt triggered', {});
      return true;
    } catch (error) {
      logError(Component.UI, 'PWA install failed', { error });
      return false;
    }
  }

  /**
   * Share content
   */
  async shareContent(data: {
    title?: string;
    text?: string;
    url?: string;
    files?: File[];
  }): Promise<boolean> {
    if (Platform.OS !== 'web' || !this.features.shareTarget) {
      return false;
    }

    try {
      await navigator.share(data);
      
      logInfo(Component.UI, 'Content shared successfully', {
        title: data.title,
        hasFiles: !!data.files?.length,
      });
      
      return true;
    } catch (error) {
      logError(Component.UI, 'Content sharing failed', { error });
      return false;
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (Platform.OS !== 'web' || !this.features.pushNotifications) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      logInfo(Component.UI, 'Notification permission requested', {
        permission,
        granted,
      });
      
      return granted;
    } catch (error) {
      logError(Component.UI, 'Notification permission request failed', { error });
      return false;
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(title: string, options?: NotificationOptions): Promise<boolean> {
    if (Platform.OS !== 'web' || !this.features.pushNotifications) {
      return false;
    }

    try {
      const notification = new Notification(title, options);
      
      logInfo(Component.UI, 'Push notification sent', {
        title,
        hasIcon: !!options?.icon,
        hasBadge: !!options?.badge,
      });
      
      return true;
    } catch (error) {
      logError(Component.UI, 'Push notification failed', { error });
      return false;
    }
  }

  /**
   * Cache resources for offline use
   */
  async cacheResources(urls: string[]): Promise<boolean> {
    if (Platform.OS !== 'web' || !this.features.offline) {
      return false;
    }

    try {
      const cache = await caches.open('stegnocchi-v1');
      await cache.addAll(urls);
      
      logInfo(Component.UI, 'Resources cached for offline use', {
        count: urls.length,
        urls,
      });
      
      return true;
    } catch (error) {
      logError(Component.UI, 'Resource caching failed', { error });
      return false;
    }
  }

  /**
   * Generate manifest.json content
   */
  generateManifest(): string {
    const manifest = {
      name: this.config.name,
      short_name: this.config.shortName,
      description: this.config.description,
      theme_color: this.config.themeColor,
      background_color: this.config.backgroundColor,
      display: this.config.display,
      orientation: this.config.orientation,
      scope: this.config.scope,
      start_url: this.config.startUrl,
      icons: this.config.icons,
    };

    return JSON.stringify(manifest, null, 2);
  }

  /**
   * Get current features
   */
  getFeatures(): PWAFeatures {
    return { ...this.features };
  }

  /**
   * Get current configuration
   */
  getConfig(): PWAConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PWAConfig>): void {
    this.config = { ...this.config, ...config };
    
    logInfo(Component.UI, 'PWA configuration updated', {
      updatedFields: Object.keys(config),
    });
  }
}

// Export singleton instance
export const pwaFeatures = new PWAFeatures(); 