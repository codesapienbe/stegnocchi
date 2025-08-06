/**
 * Platform Optimizations
 * Platform-specific performance optimizations and device capabilities
 */

import { Platform, Dimensions, PixelRatio } from 'react-native';

export interface DeviceCapabilities {
  isHighPerformance: boolean;
  hasHardwareAcceleration: boolean;
  supportsWebGL: boolean;
  supportsWebAssembly: boolean;
  memorySize: number;
  cpuCores: number;
  gpuType: string;
  storageType: 'ssd' | 'hdd' | 'emmc' | 'unknown';
  networkType: 'wifi' | '4g' | '5g' | '3g' | '2g' | 'unknown';
  batteryLevel: number;
  isCharging: boolean;
  isLowPowerMode: boolean;
}

export interface PerformanceConfig {
  enableHardwareAcceleration: boolean;
  enableWebGL: boolean;
  enableWebAssembly: boolean;
  enableCompression: boolean;
  enableCaching: boolean;
  enableLazyLoading: boolean;
  enableCodeSplitting: boolean;
  enableServiceWorker: boolean;
  enableBackgroundSync: boolean;
  enablePushNotifications: boolean;
  maxConcurrentOperations: number;
  memoryLimit: number;
  cacheSize: number;
}

export interface FoldableDeviceInfo {
  isFoldable: boolean;
  isDualScreen: boolean;
  isTablet: boolean;
  screenOrientation: 'portrait' | 'landscape' | 'auto';
  hingeAngle?: number;
  activeScreen: 'primary' | 'secondary' | 'both';
  screenLayout: 'single' | 'dual' | 'folded' | 'unfolded';
  displayMode: 'mirror' | 'extend' | 'single';
}

class PlatformOptimizations {
  private deviceCapabilities: DeviceCapabilities;
  private performanceConfig: PerformanceConfig;
  private foldableInfo: FoldableDeviceInfo;

  constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.performanceConfig = this.getDefaultPerformanceConfig();
    this.foldableInfo = this.detectFoldableDevice();
    this.initializeOptimizations();
  }

  /**
   * Detect device capabilities
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    const { width, height } = Dimensions.get('window');
    const pixelRatio = PixelRatio.get();
    const isHighPerformance = this.isHighPerformanceDevice();

    return {
      isHighPerformance,
      hasHardwareAcceleration: this.hasHardwareAcceleration(),
      supportsWebGL: this.supportsWebGL(),
      supportsWebAssembly: this.supportsWebAssembly(),
      memorySize: this.getMemorySize(),
      cpuCores: this.getCPUCores(),
      gpuType: this.getGPUType(),
      storageType: this.getStorageType(),
      networkType: this.getNetworkType(),
      batteryLevel: this.getBatteryLevel(),
      isCharging: this.isCharging(),
      isLowPowerMode: this.isLowPowerMode(),
    };
  }

  /**
   * Get default performance configuration
   */
  private getDefaultPerformanceConfig(): PerformanceConfig {
    const isHighPerformance = this.deviceCapabilities.isHighPerformance;

    return {
      enableHardwareAcceleration: this.deviceCapabilities.hasHardwareAcceleration,
      enableWebGL: this.deviceCapabilities.supportsWebGL,
      enableWebAssembly: this.deviceCapabilities.supportsWebAssembly,
      enableCompression: true,
      enableCaching: true,
      enableLazyLoading: true,
      enableCodeSplitting: true,
      enableServiceWorker: Platform.OS === 'web',
      enableBackgroundSync: Platform.OS === 'web',
      enablePushNotifications: Platform.OS !== 'web',
      maxConcurrentOperations: isHighPerformance ? 8 : 4,
      memoryLimit: isHighPerformance ? 512 * 1024 * 1024 : 256 * 1024 * 1024, // MB
      cacheSize: isHighPerformance ? 100 * 1024 * 1024 : 50 * 1024 * 1024, // MB
    };
  }

  /**
   * Detect foldable device capabilities
   */
  private detectFoldableDevice(): FoldableDeviceInfo {
    const { width, height } = Dimensions.get('window');
    const isTablet = this.isTablet();
    const isFoldable = this.isFoldableDevice();
    const isDualScreen = this.isDualScreenDevice();

    return {
      isFoldable,
      isDualScreen,
      isTablet,
      screenOrientation: this.getScreenOrientation(),
      hingeAngle: isFoldable ? this.getHingeAngle() : undefined,
      activeScreen: this.getActiveScreen(),
      screenLayout: this.getScreenLayout(),
      displayMode: this.getDisplayMode(),
    };
  }

  /**
   * Initialize platform optimizations
   */
  private initializeOptimizations(): void {
    this.setupHardwareAcceleration();
    this.setupCaching();
    this.setupServiceWorker();
    this.setupBackgroundSync();
    this.setupPushNotifications();
    this.setupFoldableOptimizations();
  }

  /**
   * Check if device is high performance
   */
  private isHighPerformanceDevice(): boolean {
    if (Platform.OS === 'web') {
      // Check for high-end browser capabilities
      return this.hasHardwareAcceleration() && this.supportsWebGL() && this.supportsWebAssembly();
    } else {
      // Check for high-end mobile device capabilities
      const memorySize = this.getMemorySize();
      const cpuCores = this.getCPUCores();
      return memorySize >= 4 * 1024 * 1024 * 1024 && cpuCores >= 4; // 4GB RAM, 4+ cores
    }
  }

  /**
   * Check hardware acceleration support
   */
  private hasHardwareAcceleration(): boolean {
    if (Platform.OS === 'web') {
      return 'WebGLRenderingContext' in window || 'WebGL2RenderingContext' in window;
    } else {
      // React Native has hardware acceleration by default
      return true;
    }
  }

  /**
   * Check WebGL support
   */
  private supportsWebGL(): boolean {
    if (Platform.OS !== 'web') return false;
    
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('webgl2'));
    } catch {
      return false;
    }
  }

  /**
   * Check WebAssembly support
   */
  private supportsWebAssembly(): boolean {
    if (Platform.OS !== 'web') return false;
    return typeof WebAssembly === 'object';
  }

  /**
   * Get device memory size
   */
  private getMemorySize(): number {
    if (Platform.OS === 'web') {
      // Use navigator.deviceMemory if available
      return (navigator as any).deviceMemory ? (navigator as any).deviceMemory * 1024 * 1024 * 1024 : 4 * 1024 * 1024 * 1024;
    } else {
      // For React Native, we'll estimate based on device type
      return 4 * 1024 * 1024 * 1024; // Default to 4GB
    }
  }

  /**
   * Get CPU core count
   */
  private getCPUCores(): number {
    if (Platform.OS === 'web') {
      return navigator.hardwareConcurrency || 4;
    } else {
      // For React Native, we'll estimate based on device type
      return 4; // Default to 4 cores
    }
  }

  /**
   * Get GPU type
   */
  private getGPUType(): string {
    if (Platform.OS === 'web') {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
      }
    }
    return 'unknown';
  }

  /**
   * Get storage type
   */
  private getStorageType(): 'ssd' | 'hdd' | 'emmc' | 'unknown' {
    if (Platform.OS === 'web') {
      // Web doesn't have direct access to storage type
      return 'unknown';
    } else {
      // For mobile, most modern devices use SSD or eMMC
      return 'ssd';
    }
  }

  /**
   * Get network type
   */
  private getNetworkType(): 'wifi' | '4g' | '5g' | '3g' | '2g' | 'unknown' {
    if (Platform.OS === 'web') {
      // Use Network Information API if available
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        return connection.effectiveType || 'unknown';
      }
      return 'unknown';
    } else {
      // For React Native, would need to use a library
      return 'unknown';
    }
  }

  /**
   * Get battery level
   */
  private getBatteryLevel(): number {
    if (Platform.OS === 'web') {
      // Use Battery API if available
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          return battery.level;
        });
      }
      return 1.0; // Default to 100%
    } else {
      // For React Native, would need to use a library
      return 1.0;
    }
  }

  /**
   * Check if device is charging
   */
  private isCharging(): boolean {
    if (Platform.OS === 'web') {
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          return battery.charging;
        });
      }
      return false;
    } else {
      return false;
    }
  }

  /**
   * Check if low power mode is enabled
   */
  private isLowPowerMode(): boolean {
    if (Platform.OS === 'web') {
      // Web doesn't have direct access to low power mode
      return false;
    } else {
      // For React Native, would need to use a library
      return false;
    }
  }

  /**
   * Check if device is a tablet
   */
  private isTablet(): boolean {
    const { width, height } = Dimensions.get('window');
    const aspectRatio = width / height;
    return aspectRatio >= 0.75 && aspectRatio <= 1.33 && Math.min(width, height) >= 600;
  }

  /**
   * Check if device is foldable
   */
  private isFoldableDevice(): boolean {
    if (Platform.OS === 'web') {
      // Check for foldable device APIs
      return 'getScreenDetails' in window || 'fold' in window;
    } else {
      // For React Native, would need to use a library
      return false;
    }
  }

  /**
   * Check if device has dual screens
   */
  private isDualScreenDevice(): boolean {
    if (Platform.OS === 'web') {
      // Check for dual screen APIs
      return 'getScreenDetails' in window;
    } else {
      return false;
    }
  }

  /**
   * Get screen orientation
   */
  private getScreenOrientation(): 'portrait' | 'landscape' | 'auto' {
    const { width, height } = Dimensions.get('window');
    if (width > height) {
      return 'landscape';
    } else if (height > width) {
      return 'portrait';
    } else {
      return 'auto';
    }
  }

  /**
   * Get hinge angle (for foldable devices)
   */
  private getHingeAngle(): number {
    if (Platform.OS === 'web' && 'getScreenDetails' in window) {
      // This would use the Screen Fold API
      return 180; // Default to unfolded
    }
    return 180;
  }

  /**
   * Get active screen
   */
  private getActiveScreen(): 'primary' | 'secondary' | 'both' {
    if (this.foldableInfo.isDualScreen) {
      return 'both';
    }
    return 'primary';
  }

  /**
   * Get screen layout
   */
  private getScreenLayout(): 'single' | 'dual' | 'folded' | 'unfolded' {
    if (!this.foldableInfo.isFoldable) {
      return 'single';
    }
    
    const hingeAngle = this.getHingeAngle();
    if (hingeAngle < 30) {
      return 'folded';
    } else if (hingeAngle > 150) {
      return 'unfolded';
    } else {
      return 'dual';
    }
  }

  /**
   * Get display mode
   */
  private getDisplayMode(): 'mirror' | 'extend' | 'single' {
    if (!this.foldableInfo.isDualScreen) {
      return 'single';
    }
    
    // This would be determined by user settings or app configuration
    return 'extend';
  }

  /**
   * Setup hardware acceleration
   */
  private setupHardwareAcceleration(): void {
    if (this.performanceConfig.enableHardwareAcceleration) {
      if (Platform.OS === 'web') {
        // Enable WebGL context
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl', { 
          antialias: true,
          alpha: false,
          depth: true,
          stencil: false,
          powerPreference: 'high-performance'
        });
        
        if (gl) {
          // Configure WebGL for optimal performance
          gl.enable(gl.DEPTH_TEST);
          gl.depthFunc(gl.LEQUAL);
          gl.clearColor(0.0, 0.0, 0.0, 1.0);
        }
      }
    }
  }

  /**
   * Setup caching
   */
  private setupCaching(): void {
    if (this.performanceConfig.enableCaching && Platform.OS === 'web') {
      // Setup service worker for caching
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('Service Worker registered:', registration);
          })
          .catch(error => {
            console.log('Service Worker registration failed:', error);
          });
      }
    }
  }

  /**
   * Setup service worker
   */
  private setupServiceWorker(): void {
    if (this.performanceConfig.enableServiceWorker && Platform.OS === 'web') {
      // Service worker setup is handled in setupCaching
    }
  }

  /**
   * Setup background sync
   */
  private setupBackgroundSync(): void {
    if (this.performanceConfig.enableBackgroundSync && Platform.OS === 'web') {
      // Background sync would be configured here
    }
  }

  /**
   * Setup push notifications
   */
  private setupPushNotifications(): void {
    if (this.performanceConfig.enablePushNotifications && Platform.OS !== 'web') {
      // Push notification setup for mobile platforms
    }
  }

  /**
   * Setup foldable optimizations
   */
  private setupFoldableOptimizations(): void {
    if (this.foldableInfo.isFoldable) {
      // Setup foldable-specific optimizations
      this.setupFoldableLayout();
      this.setupHingeDetection();
      this.setupDualScreenSupport();
    }
  }

  /**
   * Setup foldable layout
   */
  private setupFoldableLayout(): void {
    // Configure layout for foldable devices
    if (Platform.OS === 'web') {
      // Add CSS for foldable layouts
      const style = document.createElement('style');
      style.textContent = `
        @media (screen-spanning: single-fold-vertical) {
          .foldable-layout {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: env(fold-width);
          }
        }
        
        @media (screen-spanning: single-fold-horizontal) {
          .foldable-layout {
            display: grid;
            grid-template-rows: 1fr 1fr;
            gap: env(fold-height);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Setup hinge detection
   */
  private setupHingeDetection(): void {
    if (Platform.OS === 'web' && 'getScreenDetails' in window) {
      // Setup hinge angle detection
      window.addEventListener('resize', () => {
        this.updateFoldableInfo();
      });
    }
  }

  /**
   * Setup dual screen support
   */
  private setupDualScreenSupport(): void {
    if (this.foldableInfo.isDualScreen) {
      // Configure dual screen behavior
      this.setupDualScreenLayout();
      this.setupDualScreenNavigation();
    }
  }

  /**
   * Setup dual screen layout
   */
  private setupDualScreenLayout(): void {
    // Configure layout for dual screen devices
  }

  /**
   * Setup dual screen navigation
   */
  private setupDualScreenNavigation(): void {
    // Configure navigation for dual screen devices
  }

  /**
   * Update foldable device information
   */
  private updateFoldableInfo(): void {
    this.foldableInfo = this.detectFoldableDevice();
  }

  /**
   * Get device capabilities
   */
  getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.deviceCapabilities };
  }

  /**
   * Get performance configuration
   */
  getPerformanceConfig(): PerformanceConfig {
    return { ...this.performanceConfig };
  }

  /**
   * Get foldable device information
   */
  getFoldableInfo(): FoldableDeviceInfo {
    return { ...this.foldableInfo };
  }

  /**
   * Update performance configuration
   */
  updatePerformanceConfig(config: Partial<PerformanceConfig>): void {
    this.performanceConfig = { ...this.performanceConfig, ...config };
    this.initializeOptimizations();
  }

  /**
   * Check if optimization is enabled
   */
  isOptimizationEnabled(optimization: keyof PerformanceConfig): boolean {
    return this.performanceConfig[optimization];
  }

  /**
   * Get optimal image quality based on device capabilities
   */
  getOptimalImageQuality(): number {
    if (this.deviceCapabilities.isHighPerformance) {
      return 0.9; // High quality for high-performance devices
    } else {
      return 0.7; // Lower quality for lower-performance devices
    }
  }

  /**
   * Get optimal compression level based on device capabilities
   */
  getOptimalCompressionLevel(): number {
    if (this.deviceCapabilities.isHighPerformance) {
      return 6; // Higher compression for high-performance devices
    } else {
      return 3; // Lower compression for lower-performance devices
    }
  }
}

// Global platform optimizations instance
export const platformOptimizations = new PlatformOptimizations();

export default PlatformOptimizations; 