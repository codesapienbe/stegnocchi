import { Platform, Dimensions, PixelRatio } from 'react-native';
import { logInfo, Component } from '../core/logger';

export interface DeviceCapabilities {
  screenSize: 'small' | 'medium' | 'large' | 'xlarge';
  pixelDensity: 'low' | 'medium' | 'high' | 'ultra';
  memory: 'low' | 'medium' | 'high';
  cpu: 'low' | 'medium' | 'high';
  network: 'slow' | 'medium' | 'fast';
  storage: 'low' | 'medium' | 'high';
  battery: 'low' | 'medium' | 'high';
}

export interface AdaptiveConfig {
  enableAnimations: boolean;
  enableComplexEffects: boolean;
  enableHighResImages: boolean;
  enableAdvancedFeatures: boolean;
  enableRealTimeUpdates: boolean;
  enableBackgroundProcessing: boolean;
  enableOfflineMode: boolean;
  enablePushNotifications: boolean;
}

/**
 * Adaptive UI utility for device capability detection and optimization
 */
export class AdaptiveUI {
  private capabilities: DeviceCapabilities;
  private config: AdaptiveConfig;

  constructor() {
    this.capabilities = this.detectCapabilities();
    this.config = this.generateAdaptiveConfig();
    
    logInfo(Component.UI, 'Adaptive UI initialized', {
      capabilities: this.capabilities,
      config: this.config,
    });
  }

  /**
   * Detect device capabilities
   */
  private detectCapabilities(): DeviceCapabilities {
    const { width, height } = Dimensions.get('window');
    const pixelRatio = PixelRatio.get();
    const screenArea = width * height;

    // Screen size detection
    let screenSize: DeviceCapabilities['screenSize'];
    if (screenArea < 200000) screenSize = 'small'; // < 200k pixels
    else if (screenArea < 500000) screenSize = 'medium'; // < 500k pixels
    else if (screenArea < 1000000) screenSize = 'large'; // < 1M pixels
    else screenSize = 'xlarge'; // >= 1M pixels

    // Pixel density detection
    let pixelDensity: DeviceCapabilities['pixelDensity'];
    if (pixelRatio < 1.5) pixelDensity = 'low';
    else if (pixelRatio < 2.5) pixelDensity = 'medium';
    else if (pixelRatio < 3.5) pixelDensity = 'high';
    else pixelDensity = 'ultra';

    // Memory estimation (rough heuristic)
    let memory: DeviceCapabilities['memory'] = 'medium';
    if (Platform.OS === 'web') {
      // Web memory detection
      if ('memory' in performance) {
        const mem = (performance as any).memory;
        if (mem.jsHeapSizeLimit < 100 * 1024 * 1024) memory = 'low';
        else if (mem.jsHeapSizeLimit > 500 * 1024 * 1024) memory = 'high';
      }
    }

    // CPU estimation
    let cpu: DeviceCapabilities['cpu'] = 'medium';
    if (Platform.OS === 'web') {
      // Web CPU detection
      const cores = navigator.hardwareConcurrency || 4;
      if (cores < 2) cpu = 'low';
      else if (cores > 6) cpu = 'high';
    }

    // Network estimation
    let network: DeviceCapabilities['network'] = 'medium';
    if (Platform.OS === 'web' && 'connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') network = 'slow';
      else if (conn.effectiveType === '4g') network = 'fast';
    }

    // Storage estimation
    let storage: DeviceCapabilities['storage'] = 'medium';
    if (Platform.OS === 'web' && 'storage' in navigator) {
      const storageEstimate = (navigator as any).storage?.estimate();
      if (storageEstimate) {
        const usageRatio = storageEstimate.usage / storageEstimate.quota;
        if (usageRatio > 0.8) storage = 'low';
        else if (usageRatio < 0.3) storage = 'high';
      }
    }

    // Battery estimation
    let battery: DeviceCapabilities['battery'] = 'medium';
    if (Platform.OS === 'web' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        if (battery.level < 0.2) battery = 'low';
        else if (battery.level > 0.8) battery = 'high';
      });
    }

    return {
      screenSize,
      pixelDensity,
      memory,
      cpu,
      network,
      storage,
      battery,
    };
  }

  /**
   * Generate adaptive configuration based on capabilities
   */
  private generateAdaptiveConfig(): AdaptiveConfig {
    const { capabilities } = this;

    return {
      enableAnimations: capabilities.cpu !== 'low' && capabilities.memory !== 'low',
      enableComplexEffects: capabilities.cpu === 'high' && capabilities.memory === 'high',
      enableHighResImages: capabilities.pixelDensity === 'high' || capabilities.pixelDensity === 'ultra',
      enableAdvancedFeatures: capabilities.cpu === 'high' && capabilities.memory === 'high',
      enableRealTimeUpdates: capabilities.network === 'fast' && capabilities.cpu !== 'low',
      enableBackgroundProcessing: capabilities.cpu === 'high' && capabilities.battery !== 'low',
      enableOfflineMode: capabilities.storage === 'high' || capabilities.storage === 'medium',
      enablePushNotifications: capabilities.network !== 'slow' && capabilities.battery !== 'low',
    };
  }

  /**
   * Get current device capabilities
   */
  getCapabilities(): DeviceCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Get current adaptive configuration
   */
  getConfig(): AdaptiveConfig {
    return { ...this.config };
  }

  /**
   * Check if animations should be enabled
   */
  shouldEnableAnimations(): boolean {
    return this.config.enableAnimations;
  }

  /**
   * Check if complex effects should be enabled
   */
  shouldEnableComplexEffects(): boolean {
    return this.config.enableComplexEffects;
  }

  /**
   * Check if high-res images should be loaded
   */
  shouldLoadHighResImages(): boolean {
    return this.config.enableHighResImages;
  }

  /**
   * Get recommended image quality based on device
   */
  getRecommendedImageQuality(): number {
    if (this.capabilities.pixelDensity === 'ultra') return 1.0;
    if (this.capabilities.pixelDensity === 'high') return 0.9;
    if (this.capabilities.pixelDensity === 'medium') return 0.8;
    return 0.7; // low density
  }

  /**
   * Get recommended animation duration based on device
   */
  getRecommendedAnimationDuration(): number {
    if (this.capabilities.cpu === 'low') return 0.3; // Faster for low-end devices
    if (this.capabilities.cpu === 'high') return 0.5; // Slower for high-end devices
    return 0.4; // Default
  }

  /**
   * Check if offline mode should be enabled
   */
  shouldEnableOfflineMode(): boolean {
    return this.config.enableOfflineMode;
  }

  /**
   * Check if real-time updates should be enabled
   */
  shouldEnableRealTimeUpdates(): boolean {
    return this.config.enableRealTimeUpdates;
  }

  /**
   * Update configuration based on new capabilities
   */
  updateCapabilities(newCapabilities: Partial<DeviceCapabilities>): void {
    this.capabilities = { ...this.capabilities, ...newCapabilities };
    this.config = this.generateAdaptiveConfig();
    
    logInfo(Component.UI, 'Adaptive UI capabilities updated', {
      capabilities: this.capabilities,
      config: this.config,
    });
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.capabilities.memory === 'low') {
      recommendations.push('Consider closing other apps to free up memory');
    }

    if (this.capabilities.battery === 'low') {
      recommendations.push('Enable battery saver mode for longer usage');
    }

    if (this.capabilities.network === 'slow') {
      recommendations.push('Use offline mode for better performance');
    }

    if (this.capabilities.storage === 'low') {
      recommendations.push('Clear cache to free up storage space');
    }

    return recommendations;
  }
}

// Export singleton instance
export const adaptiveUI = new AdaptiveUI(); 