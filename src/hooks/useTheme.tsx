/**
 * Theme Hook
 * React hook for using theme functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { themeManager, Theme, ThemeMode } from '@/core/theme';

export interface UseThemeReturn {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  setTheme: (mode: 'light' | 'dark', isHighContrast?: boolean, isLargeText?: boolean) => void;
  getColor: (path: string) => string;
  getSpacing: (size: keyof Theme['spacing']) => number;
  getBorderRadius: (size: keyof Theme['borderRadius']) => number;
  getFontSize: (size: keyof Theme['typography']['fontSize']) => number;
  getFontFamily: (weight: keyof Theme['typography']['fontFamily']) => string;
  getFontWeight: (weight: keyof Theme['typography']['fontWeight']) => string;
  createColorVariant: (baseColor: string, variant: 'light' | 'dark') => string;
}

/**
 * Hook for theme management
 */
export const useTheme = (): UseThemeReturn => {
  const [theme, setThemeState] = useState(themeManager.getTheme());
  const [themeMode, setThemeModeState] = useState(themeManager.getThemeMode());

  useEffect(() => {
    // Subscribe to theme changes
    const unsubscribe = themeManager.subscribe((newTheme) => {
      setThemeState(newTheme);
    });

    return unsubscribe;
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    themeManager.setThemeMode(mode);
    setThemeModeState(mode);
  }, []);

  const setTheme = useCallback((
    mode: 'light' | 'dark',
    isHighContrast: boolean = false,
    isLargeText: boolean = false
  ) => {
    themeManager.setTheme(mode, isHighContrast, isLargeText);
  }, []);

  const getColor = useCallback((path: string) => {
    return themeManager.getColor(path);
  }, []);

  const getSpacing = useCallback((size: keyof Theme['spacing']) => {
    return themeManager.getSpacing(size);
  }, []);

  const getBorderRadius = useCallback((size: keyof Theme['borderRadius']) => {
    return themeManager.getBorderRadius(size);
  }, []);

  const getFontSize = useCallback((size: keyof Theme['typography']['fontSize']) => {
    return themeManager.getFontSize(size);
  }, []);

  const getFontFamily = useCallback((weight: keyof Theme['typography']['fontFamily']) => {
    return themeManager.getFontFamily(weight);
  }, []);

  const getFontWeight = useCallback((weight: keyof Theme['typography']['fontWeight']) => {
    return themeManager.getFontWeight(weight);
  }, []);

  const createColorVariant = useCallback((baseColor: string, variant: 'light' | 'dark') => {
    return themeManager.createColorVariant(baseColor, variant);
  }, []);

  return {
    theme,
    themeMode,
    setThemeMode,
    setTheme,
    getColor,
    getSpacing,
    getBorderRadius,
    getFontSize,
    getFontFamily,
    getFontWeight,
    createColorVariant,
  };
};

export default useTheme; 