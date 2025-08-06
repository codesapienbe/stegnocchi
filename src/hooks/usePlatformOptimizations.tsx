/**
 * Platform Optimizations Hook
 * React hook for using platform optimization features
 */

import { useState, useEffect, useCallback } from 'react';
import { platformOptimizations, DeviceCapabilities, PerformanceConfig, FoldableDeviceInfo } from '@/core/platformOptimizations';
import { hardwareAcceleration, HardwareAccelerationConfig } from '@/core/hardwareAcceleration';
import { foldableSupport, FoldableState, LayoutConfig } from '@/core/foldableSupport';

export interface UsePlatformOptimizationsReturn {
  // Device capabilities
  deviceCapabilities: DeviceCapabilities;
  isHighPerformance: boolean;
  hasHardwareAcceleration: boolean;
  
  // Performance configuration
  performanceConfig: PerformanceConfig;
  updatePerformanceConfig: (config: Partial<PerformanceConfig>) => void;
  
  // Hardware acceleration
  hardwareAcceleration: {
    isAvailable: boolean;
    config: HardwareAccelerationConfig;
    updateConfig: (config: Partial<HardwareAccelerationConfig>) => void;
    compressData: (data: ArrayBuffer, algorithm?: 'gzip' | 'deflate' | 'brotli') => Promise<ArrayBuffer>;
    decompressData: (data: ArrayBuffer, algorithm?: 'gzip' | 'deflate' | 'brotli') => Promise<ArrayBuffer>;
    optimizeImage: (imageData: ImageData) => Promise<ImageData>;
  };
  
  // Foldable support
  foldable: {
    state: FoldableState;
    layoutConfig: LayoutConfig;
    isSupported: boolean;
    subscribe: (listener: (state: FoldableState) => void) => () => void;
    getOptimalLayout: () => any;
    getScreen: (id: string) => any;
    getPrimaryScreen: () => any;
    getActiveScreens: () => any[];
  };
  
  // Utility functions
  getOptimalImageQuality: () => number;
  getOptimalCompressionLevel: () => number;
  isOptimizationEnabled: (optimization: keyof PerformanceConfig) => boolean;
}

/**
 * Hook for platform optimizations
 */
export const usePlatformOptimizations = (): UsePlatformOptimizationsReturn => {
  const [deviceCapabilities, setDeviceCapabilities] = useState(platformOptimizations.getDeviceCapabilities());
  const [performanceConfig, setPerformanceConfig] = useState(platformOptimizations.getPerformanceConfig());
  const [foldableState, setFoldableState] = useState(foldableSupport.getState());
  const [layoutConfig, setLayoutConfig] = useState(foldableSupport.getLayoutConfig());

  useEffect(() => {
    // Subscribe to foldable state changes
    const unsubscribe = foldableSupport.subscribe((newState) => {
      setFoldableState(newState);
      setLayoutConfig(foldableSupport.getLayoutConfig());
    });

    return unsubscribe;
  }, []);

  const updatePerformanceConfig = useCallback((config: Partial<PerformanceConfig>) => {
    platformOptimizations.updatePerformanceConfig(config);
    setPerformanceConfig(platformOptimizations.getPerformanceConfig());
  }, []);

  const updateHardwareAccelerationConfig = useCallback((config: Partial<HardwareAccelerationConfig>) => {
    hardwareAcceleration.updateConfig(config);
  }, []);

  const compressData = useCallback(async (data: ArrayBuffer, algorithm: 'gzip' | 'deflate' | 'brotli' = 'gzip') => {
    return hardwareAcceleration.compressData(data, algorithm);
  }, []);

  const decompressData = useCallback(async (data: ArrayBuffer, algorithm: 'gzip' | 'deflate' | 'brotli' = 'gzip') => {
    return hardwareAcceleration.decompressData(data, algorithm);
  }, []);

  const optimizeImage = useCallback(async (imageData: ImageData) => {
    return hardwareAcceleration.optimizeImage(imageData);
  }, []);

  const subscribeToFoldable = useCallback((listener: (state: FoldableState) => void) => {
    return foldableSupport.subscribe(listener);
  }, []);

  const getOptimalLayout = useCallback(() => {
    return foldableSupport.getOptimalLayout();
  }, []);

  const getScreen = useCallback((id: string) => {
    return foldableSupport.getScreen(id);
  }, []);

  const getPrimaryScreen = useCallback(() => {
    return foldableSupport.getPrimaryScreen();
  }, []);

  const getActiveScreens = useCallback(() => {
    return foldableSupport.getActiveScreens();
  }, []);

  const getOptimalImageQuality = useCallback(() => {
    return platformOptimizations.getOptimalImageQuality();
  }, []);

  const getOptimalCompressionLevel = useCallback(() => {
    return platformOptimizations.getOptimalCompressionLevel();
  }, []);

  const isOptimizationEnabled = useCallback((optimization: keyof PerformanceConfig) => {
    return platformOptimizations.isOptimizationEnabled(optimization);
  }, []);

  return {
    // Device capabilities
    deviceCapabilities,
    isHighPerformance: deviceCapabilities.isHighPerformance,
    hasHardwareAcceleration: deviceCapabilities.hasHardwareAcceleration,
    
    // Performance configuration
    performanceConfig,
    updatePerformanceConfig,
    
    // Hardware acceleration
    hardwareAcceleration: {
      isAvailable: hardwareAcceleration.isAvailable(),
      config: hardwareAcceleration.getConfig(),
      updateConfig: updateHardwareAccelerationConfig,
      compressData,
      decompressData,
      optimizeImage,
    },
    
    // Foldable support
    foldable: {
      state: foldableState,
      layoutConfig,
      isSupported: foldableSupport.isSupported(),
      subscribe: subscribeToFoldable,
      getOptimalLayout,
      getScreen,
      getPrimaryScreen,
      getActiveScreens,
    },
    
    // Utility functions
    getOptimalImageQuality,
    getOptimalCompressionLevel,
    isOptimizationEnabled,
  };
};

export default usePlatformOptimizations; 