/**
 * Accessibility Hook
 * React hook for using accessibility functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { accessibilityManager, AccessibilityConfig, AccessibilityFeatures, AccessibilityProps } from '@/core/accessibility';

export interface UseAccessibilityReturn {
  features: AccessibilityFeatures;
  config: AccessibilityConfig;
  updateConfig: (newConfig: Partial<AccessibilityConfig>) => void;
  getAccessibilityProps: (props: Partial<AccessibilityProps>) => AccessibilityProps;
  provideHapticFeedback: (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
  playSoundEffect: (type: 'success' | 'error' | 'warning' | 'click') => void;
  announceToScreenReader: (message: string) => void;
}

/**
 * Hook for accessibility features
 */
export const useAccessibility = (): UseAccessibilityReturn => {
  const [features, setFeatures] = useState(accessibilityManager.getFeatures());
  const [config, setConfig] = useState<AccessibilityConfig>({
    reduceMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false,
    hapticFeedback: true,
    soundEffects: true,
    colorBlindness: 'none',
    focusIndicators: true,
    keyboardNavigation: true,
    voiceControl: false,
  });

  useEffect(() => {
    // Update features when they change
    const updateFeatures = () => {
      setFeatures(accessibilityManager.getFeatures());
    };

    // Check for changes periodically
    const interval = setInterval(updateFeatures, 1000);

    return () => clearInterval(interval);
  }, []);

  const updateConfig = useCallback((newConfig: Partial<AccessibilityConfig>) => {
    accessibilityManager.updateConfig(newConfig);
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const getAccessibilityProps = useCallback((props: Partial<AccessibilityProps>) => {
    return accessibilityManager.getAccessibilityProps(props);
  }, []);

  const provideHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
    accessibilityManager.provideHapticFeedback(type);
  }, []);

  const playSoundEffect = useCallback((type: 'success' | 'error' | 'warning' | 'click') => {
    accessibilityManager.playSoundEffect(type);
  }, []);

  const announceToScreenReader = useCallback((message: string) => {
    accessibilityManager.announceToScreenReader(message);
  }, []);

  return {
    features,
    config,
    updateConfig,
    getAccessibilityProps,
    provideHapticFeedback,
    playSoundEffect,
    announceToScreenReader,
  };
};

export default useAccessibility; 