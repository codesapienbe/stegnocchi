/**
 * Platform Optimizations Tests
 * Tests for platform-specific optimizations
 */

import { platformOptimizations } from '@/core/platformOptimizations';

describe('PlatformOptimizations', () => {
  describe('Device Capabilities', () => {
    it('should detect device capabilities', () => {
      const capabilities = platformOptimizations.getDeviceCapabilities();
      
      expect(capabilities).toBeDefined();
      expect(typeof capabilities.isHighPerformance).toBe('boolean');
      expect(typeof capabilities.hasHardwareAcceleration).toBe('boolean');
      expect(typeof capabilities.supportsWebGL).toBe('boolean');
      expect(typeof capabilities.supportsWebAssembly).toBe('boolean');
      expect(typeof capabilities.memorySize).toBe('number');
      expect(typeof capabilities.cpuCores).toBe('number');
      expect(typeof capabilities.gpuType).toBe('string');
      expect(typeof capabilities.storageType).toBe('string');
      expect(typeof capabilities.networkType).toBe('string');
      expect(typeof capabilities.batteryLevel).toBe('number');
      expect(typeof capabilities.isCharging).toBe('boolean');
      expect(typeof capabilities.isLowPowerMode).toBe('boolean');
    });

    it('should have valid memory size', () => {
      const capabilities = platformOptimizations.getDeviceCapabilities();
      expect(capabilities.memorySize).toBeGreaterThan(0);
    });

    it('should have valid CPU cores', () => {
      const capabilities = platformOptimizations.getDeviceCapabilities();
      expect(capabilities.cpuCores).toBeGreaterThan(0);
    });

    it('should have valid battery level', () => {
      const capabilities = platformOptimizations.getDeviceCapabilities();
      expect(capabilities.batteryLevel).toBeGreaterThanOrEqual(0);
      expect(capabilities.batteryLevel).toBeLessThanOrEqual(1);
    });
  });

  describe('Performance Configuration', () => {
    it('should get performance configuration', () => {
      const config = platformOptimizations.getPerformanceConfig();
      
      expect(config).toBeDefined();
      expect(typeof config.enableHardwareAcceleration).toBe('boolean');
      expect(typeof config.enableWebGL).toBe('boolean');
      expect(typeof config.enableWebAssembly).toBe('boolean');
      expect(typeof config.enableCompression).toBe('boolean');
      expect(typeof config.enableCaching).toBe('boolean');
      expect(typeof config.enableLazyLoading).toBe('boolean');
      expect(typeof config.enableCodeSplitting).toBe('boolean');
      expect(typeof config.enableServiceWorker).toBe('boolean');
      expect(typeof config.enableBackgroundSync).toBe('boolean');
      expect(typeof config.enablePushNotifications).toBe('boolean');
      expect(typeof config.maxConcurrentOperations).toBe('number');
      expect(typeof config.memoryLimit).toBe('number');
      expect(typeof config.cacheSize).toBe('number');
    });

    it('should have valid concurrent operations limit', () => {
      const config = platformOptimizations.getPerformanceConfig();
      expect(config.maxConcurrentOperations).toBeGreaterThan(0);
    });

    it('should have valid memory limit', () => {
      const config = platformOptimizations.getPerformanceConfig();
      expect(config.memoryLimit).toBeGreaterThan(0);
    });

    it('should have valid cache size', () => {
      const config = platformOptimizations.getPerformanceConfig();
      expect(config.cacheSize).toBeGreaterThan(0);
    });

    it('should update performance configuration', () => {
      const originalConfig = platformOptimizations.getPerformanceConfig();
      const newConfig = {
        maxConcurrentOperations: 16,
        cacheSize: 200 * 1024 * 1024, // 200MB
      };

      platformOptimizations.updatePerformanceConfig(newConfig);
      const updatedConfig = platformOptimizations.getPerformanceConfig();

      expect(updatedConfig.maxConcurrentOperations).toBe(16);
      expect(updatedConfig.cacheSize).toBe(200 * 1024 * 1024);
      expect(updatedConfig.enableHardwareAcceleration).toBe(originalConfig.enableHardwareAcceleration);
    });
  });

  describe('Foldable Device Info', () => {
    it('should get foldable device information', () => {
      const foldableInfo = platformOptimizations.getFoldableInfo();
      
      expect(foldableInfo).toBeDefined();
      expect(typeof foldableInfo.isFoldable).toBe('boolean');
      expect(typeof foldableInfo.isDualScreen).toBe('boolean');
      expect(typeof foldableInfo.isTablet).toBe('boolean');
      expect(typeof foldableInfo.screenOrientation).toBe('string');
      expect(['portrait', 'landscape', 'auto']).toContain(foldableInfo.screenOrientation);
      expect(typeof foldableInfo.activeScreen).toBe('string');
      expect(['primary', 'secondary', 'both']).toContain(foldableInfo.activeScreen);
      expect(typeof foldableInfo.screenLayout).toBe('string');
      expect(['single', 'dual', 'folded', 'unfolded']).toContain(foldableInfo.screenLayout);
      expect(typeof foldableInfo.displayMode).toBe('string');
      expect(['mirror', 'extend', 'single']).toContain(foldableInfo.displayMode);
    });
  });

  describe('Optimization Checks', () => {
    it('should check if optimization is enabled', () => {
      const config = platformOptimizations.getPerformanceConfig();
      
      expect(platformOptimizations.isOptimizationEnabled('enableCompression')).toBe(config.enableCompression);
      expect(platformOptimizations.isOptimizationEnabled('enableCaching')).toBe(config.enableCaching);
      expect(platformOptimizations.isOptimizationEnabled('enableLazyLoading')).toBe(config.enableLazyLoading);
    });
  });

  describe('Optimal Settings', () => {
    it('should get optimal image quality', () => {
      const quality = platformOptimizations.getOptimalImageQuality();
      expect(quality).toBeGreaterThan(0);
      expect(quality).toBeLessThanOrEqual(1);
    });

    it('should get optimal compression level', () => {
      const level = platformOptimizations.getOptimalCompressionLevel();
      expect(level).toBeGreaterThan(0);
      expect(level).toBeLessThanOrEqual(9);
    });
  });
}); 