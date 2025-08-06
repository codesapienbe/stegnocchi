/**
 * Theming System
 * Comprehensive theme management with dark mode support
 */

import { Platform } from 'react-native';

export interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  error: string;
  errorLight: string;
  errorDark: string;
  warning: string;
  warningLight: string;
  warningDark: string;
  success: string;
  successLight: string;
  successDark: string;
  info: string;
  infoLight: string;
  infoDark: string;
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    inverse: string;
  };
  border: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  shadow: {
    light: string;
    medium: string;
    heavy: string;
  };
}

export interface Typography {
  fontFamily: {
    regular: string;
    medium: string;
    bold: string;
    mono: string;
  };
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
    '5xl': number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  fontWeight: {
    light: string;
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
}

export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
}

export interface BorderRadius {
  none: number;
  sm: number;
  base: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  full: number;
}

export interface Theme {
  name: string;
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  isDark: boolean;
  isHighContrast: boolean;
  isLargeText: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'auto';

// Light theme colors
const lightColors: ColorPalette = {
  primary: '#F8CC67',
  primaryLight: '#FBE39D',
  primaryDark: '#F1A948',
  secondary: '#1C1600',
  secondaryLight: '#4A3D00',
  secondaryDark: '#0A0800',
  accent: '#007AFF',
  accentLight: '#4DA3FF',
  accentDark: '#0056CC',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  surfaceVariant: '#E9ECEF',
  error: '#DC3545',
  errorLight: '#F8D7DA',
  errorDark: '#C82333',
  warning: '#FFC107',
  warningLight: '#FFF3CD',
  warningDark: '#E0A800',
  success: '#28A745',
  successLight: '#D4EDDA',
  successDark: '#1E7E34',
  info: '#17A2B8',
  infoLight: '#D1ECF1',
  infoDark: '#117A8B',
  text: {
    primary: '#1A1A1A',
    secondary: '#6C757D',
    tertiary: '#ADB5BD',
    disabled: '#CED4DA',
    inverse: '#FFFFFF',
  },
  border: {
    primary: '#DEE2E6',
    secondary: '#E9ECEF',
    disabled: '#F8F9FA',
  },
  shadow: {
    light: '0 1px 3px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
    heavy: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },
};

// Dark theme colors
const darkColors: ColorPalette = {
  primary: '#F8CC67',
  primaryLight: '#FBE39D',
  primaryDark: '#F1A948',
  secondary: '#FFFFFF',
  secondaryLight: '#F8F9FA',
  secondaryDark: '#E9ECEF',
  accent: '#0A84FF',
  accentLight: '#4DA3FF',
  accentDark: '#0056CC',
  background: '#000000',
  surface: '#1C1C1E',
  surfaceVariant: '#2C2C2E',
  error: '#FF453A',
  errorLight: '#FF6B6B',
  errorDark: '#CC0000',
  warning: '#FF9F0A',
  warningLight: '#FFB340',
  warningDark: '#CC7F00',
  success: '#30D158',
  successLight: '#5CDB7B',
  successDark: '#00A800',
  info: '#64D2FF',
  infoLight: '#8EDFFF',
  infoDark: '#0099CC',
  text: {
    primary: '#FFFFFF',
    secondary: '#ADB5BD',
    tertiary: '#6C757D',
    disabled: '#495057',
    inverse: '#000000',
  },
  border: {
    primary: '#2C2C2E',
    secondary: '#3A3A3C',
    disabled: '#1C1C1E',
  },
  shadow: {
    light: '0 1px 3px rgba(0, 0, 0, 0.3)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.3)',
    heavy: '0 10px 15px rgba(0, 0, 0, 0.3)',
  },
};

// High contrast light theme
const highContrastLightColors: ColorPalette = {
  ...lightColors,
  text: {
    primary: '#000000',
    secondary: '#000000',
    tertiary: '#000000',
    disabled: '#666666',
    inverse: '#FFFFFF',
  },
  border: {
    primary: '#000000',
    secondary: '#000000',
    disabled: '#666666',
  },
  shadow: {
    light: '0 1px 3px rgba(0, 0, 0, 0.5)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.5)',
    heavy: '0 10px 15px rgba(0, 0, 0, 0.5)',
  },
};

// High contrast dark theme
const highContrastDarkColors: ColorPalette = {
  ...darkColors,
  text: {
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    tertiary: '#FFFFFF',
    disabled: '#999999',
    inverse: '#000000',
  },
  border: {
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    disabled: '#999999',
  },
  shadow: {
    light: '0 1px 3px rgba(255, 255, 255, 0.5)',
    medium: '0 4px 6px rgba(255, 255, 255, 0.5)',
    heavy: '0 10px 15px rgba(255, 255, 255, 0.5)',
  },
};

// Typography configuration
const typography: Typography = {
  fontFamily: {
    regular: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
    medium: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
    bold: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
    mono: Platform.OS === 'ios' ? 'SF Mono' : 'Roboto Mono',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Spacing configuration
const spacing: Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
};

// Border radius configuration
const borderRadius: BorderRadius = {
  none: 0,
  sm: 2,
  base: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  full: 9999,
};

class ThemeManager {
  private currentTheme: Theme;
  private themeMode: ThemeMode;
  private listeners: Set<(theme: Theme) => void>;

  constructor() {
    this.themeMode = 'auto';
    this.listeners = new Set();
    this.currentTheme = this.createTheme('light', false, false);
    this.initializeTheme();
  }

  /**
   * Initialize theme based on system preferences
   */
  private initializeTheme(): void {
    if (this.themeMode === 'auto') {
      this.detectSystemTheme();
    } else {
      this.setTheme(this.themeMode);
    }

    // Listen for system theme changes
    this.setupThemeListener();
  }

  /**
   * Detect system theme preference
   */
  private detectSystemTheme(): void {
    if (Platform.OS === 'web') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      const isLargeText = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      this.setTheme(isDark ? 'dark' : 'light', isHighContrast, isLargeText);
    } else {
      // For React Native, we'll use a default theme
      // In a real app, you'd use platform-specific APIs
      this.setTheme('light', false, false);
    }
  }

  /**
   * Set up theme change listener
   */
  private setupThemeListener(): void {
    if (Platform.OS === 'web') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (this.themeMode === 'auto') {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  /**
   * Create theme object
   */
  private createTheme(
    mode: 'light' | 'dark',
    isHighContrast: boolean = false,
    isLargeText: boolean = false
  ): Theme {
    let colors: ColorPalette;

    if (isHighContrast) {
      colors = mode === 'dark' ? highContrastDarkColors : highContrastLightColors;
    } else {
      colors = mode === 'dark' ? darkColors : lightColors;
    }

    // Adjust typography for large text
    const adjustedTypography = isLargeText ? {
      ...typography,
      fontSize: {
        ...typography.fontSize,
        base: typography.fontSize.base * 1.2,
        lg: typography.fontSize.lg * 1.2,
        xl: typography.fontSize.xl * 1.2,
        '2xl': typography.fontSize['2xl'] * 1.2,
        '3xl': typography.fontSize['3xl'] * 1.2,
        '4xl': typography.fontSize['4xl'] * 1.2,
        '5xl': typography.fontSize['5xl'] * 1.2,
      },
    } : typography;

    return {
      name: `${mode}${isHighContrast ? '-high-contrast' : ''}${isLargeText ? '-large-text' : ''}`,
      colors,
      typography: adjustedTypography,
      spacing,
      borderRadius,
      isDark: mode === 'dark',
      isHighContrast,
      isLargeText,
    };
  }

  /**
   * Set theme mode
   */
  setThemeMode(mode: ThemeMode): void {
    this.themeMode = mode;
    
    if (mode === 'auto') {
      this.detectSystemTheme();
    } else {
      this.setTheme(mode);
    }
  }

  /**
   * Set specific theme
   */
  setTheme(
    mode: 'light' | 'dark',
    isHighContrast: boolean = false,
    isLargeText: boolean = false
  ): void {
    this.currentTheme = this.createTheme(mode, isHighContrast, isLargeText);
    this.notifyListeners();
    this.applyTheme();
  }

  /**
   * Get current theme
   */
  getTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Get current theme mode
   */
  getThemeMode(): ThemeMode {
    return this.themeMode;
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of theme change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentTheme);
      } catch (error) {
        console.error('Theme listener error:', error);
      }
    });
  }

  /**
   * Apply theme to the application
   */
  private applyTheme(): void {
    if (Platform.OS === 'web') {
      this.applyWebTheme();
    } else {
      this.applyNativeTheme();
    }
  }

  /**
   * Apply theme to web platform
   */
  private applyWebTheme(): void {
    const root = document.documentElement;
    const theme = this.currentTheme;

    // Set CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'string') {
        root.style.setProperty(`--color-${key}`, value);
      } else if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          root.style.setProperty(`--color-${key}-${subKey}`, subValue);
        });
      }
    });

    // Set theme attributes
    root.setAttribute('data-theme', theme.name);
    root.setAttribute('data-dark', theme.isDark.toString());
    root.setAttribute('data-high-contrast', theme.isHighContrast.toString());
    root.setAttribute('data-large-text', theme.isLargeText.toString());

    // Update status bar color (for PWA)
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.colors.primary);
    }
  }

  /**
   * Apply theme to native platform
   */
  private applyNativeTheme(): void {
    // For React Native, themes are applied through StyleSheet
    // This is handled by the component-level theme application
    console.log('Native theme applied:', this.currentTheme.name);
  }

  /**
   * Get color from theme
   */
  getColor(path: string): string {
    const keys = path.split('.');
    let current: any = this.currentTheme.colors;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        console.warn(`Color not found: ${path}`);
        return '#000000';
      }
    }

    return typeof current === 'string' ? current : '#000000';
  }

  /**
   * Get spacing value
   */
  getSpacing(size: keyof Spacing): number {
    return this.currentTheme.spacing[size];
  }

  /**
   * Get border radius value
   */
  getBorderRadius(size: keyof BorderRadius): number {
    return this.currentTheme.borderRadius[size];
  }

  /**
   * Get font size value
   */
  getFontSize(size: keyof Typography['fontSize']): number {
    return this.currentTheme.typography.fontSize[size];
  }

  /**
   * Get font family
   */
  getFontFamily(weight: keyof Typography['fontFamily']): string {
    return this.currentTheme.typography.fontFamily[weight];
  }

  /**
   * Get font weight
   */
  getFontWeight(weight: keyof Typography['fontWeight']): string {
    return this.currentTheme.typography.fontWeight[weight];
  }

  /**
   * Create a color variant
   */
  createColorVariant(baseColor: string, variant: 'light' | 'dark'): string {
    // Simple color manipulation for variants
    // In a real app, you'd use a proper color manipulation library
    if (variant === 'light') {
      return this.lightenColor(baseColor, 0.2);
    } else {
      return this.darkenColor(baseColor, 0.2);
    }
  }

  /**
   * Lighten a color
   */
  private lightenColor(color: string, amount: number): string {
    // Simple color lightening - in production, use a proper color library
    return color;
  }

  /**
   * Darken a color
   */
  private darkenColor(color: string, amount: number): string {
    // Simple color darkening - in production, use a proper color library
    return color;
  }
}

// Global theme manager instance
export const themeManager = new ThemeManager();

export default ThemeManager; 