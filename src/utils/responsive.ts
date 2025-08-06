/**
 * Responsive Design Utilities
 * Breakpoints and layout utilities for different screen sizes
 */

import { Dimensions, Platform } from 'react-native';

// Screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Breakpoints
export const BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
} as const;

// Screen size detection
export const isMobile = screenWidth < BREAKPOINTS.tablet;
export const isTablet = screenWidth >= BREAKPOINTS.tablet && screenWidth < BREAKPOINTS.desktop;
export const isDesktop = screenWidth >= BREAKPOINTS.desktop;
export const isSmallScreen = screenWidth < BREAKPOINTS.mobile;

// Platform detection
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isWeb = Platform.OS === 'web';

// Responsive spacing
export const SPACING = {
  xs: isSmallScreen ? 4 : 8,
  sm: isSmallScreen ? 8 : 12,
  md: isSmallScreen ? 12 : 16,
  lg: isSmallScreen ? 16 : 24,
  xl: isSmallScreen ? 24 : 32,
  xxl: isSmallScreen ? 32 : 48,
} as const;

// Responsive font sizes
export const FONT_SIZES = {
  xs: isSmallScreen ? 10 : 12,
  sm: isSmallScreen ? 12 : 14,
  md: isSmallScreen ? 14 : 16,
  lg: isSmallScreen ? 16 : 18,
  xl: isSmallScreen ? 18 : 24,
  xxl: isSmallScreen ? 24 : 32,
  xxxl: isSmallScreen ? 32 : 48,
} as const;

// Responsive padding
export const PADDING = {
  screen: isSmallScreen ? 16 : isMobile ? 20 : 24,
  card: isSmallScreen ? 12 : isMobile ? 16 : 20,
  button: isSmallScreen ? 12 : isMobile ? 16 : 20,
  input: isSmallScreen ? 12 : isMobile ? 16 : 20,
} as const;

// Responsive margins
export const MARGIN = {
  screen: isSmallScreen ? 16 : isMobile ? 20 : 24,
  card: isSmallScreen ? 8 : isMobile ? 12 : 16,
  button: isSmallScreen ? 8 : isMobile ? 12 : 16,
  input: isSmallScreen ? 8 : isMobile ? 12 : 16,
} as const;

// Responsive border radius
export const BORDER_RADIUS = {
  sm: isSmallScreen ? 4 : 6,
  md: isSmallScreen ? 8 : 12,
  lg: isSmallScreen ? 12 : 16,
  xl: isSmallScreen ? 16 : 24,
  round: isSmallScreen ? 20 : 25,
} as const;

// Touch target sizes (minimum 44px for accessibility)
export const TOUCH_TARGETS = {
  small: Math.max(32, 44), // Minimum 44px for accessibility
  medium: Math.max(44, 48),
  large: Math.max(48, 56),
} as const;

// Layout dimensions
export const LAYOUT = {
  maxWidth: isDesktop ? 1200 : isTablet ? 768 : screenWidth,
  headerHeight: isSmallScreen ? 56 : isMobile ? 64 : 72,
  footerHeight: isSmallScreen ? 60 : isMobile ? 70 : 80,
  sidebarWidth: isTablet ? 280 : 320,
} as const;

// Grid system
export const GRID = {
  columns: isDesktop ? 12 : isTablet ? 8 : 4,
  gutter: isSmallScreen ? 8 : isMobile ? 12 : 16,
  margin: isSmallScreen ? 16 : isMobile ? 20 : 24,
} as const;

/**
 * Get responsive value based on screen size
 */
export function getResponsiveValue<T>(
  mobile: T,
  tablet?: T,
  desktop?: T
): T {
  if (isDesktop && desktop !== undefined) {
    return desktop;
  }
  if (isTablet && tablet !== undefined) {
    return tablet;
  }
  return mobile;
}

/**
 * Get responsive style object
 */
export function getResponsiveStyle(styles: {
  mobile?: any;
  tablet?: any;
  desktop?: any;
}): any {
  if (isDesktop && styles.desktop) {
    return { ...styles.mobile, ...styles.tablet, ...styles.desktop };
  }
  if (isTablet && styles.tablet) {
    return { ...styles.mobile, ...styles.tablet };
  }
  return styles.mobile || {};
}

/**
 * Check if device supports specific features
 */
export const DEVICE_CAPABILITIES = {
  hasHapticFeedback: isIOS || isAndroid,
  hasBiometrics: isIOS || isAndroid,
  hasCamera: isIOS || isAndroid,
  hasFileSystem: isIOS || isAndroid,
  hasSharing: isIOS || isAndroid,
  hasClipboard: isIOS || isAndroid || isWeb,
  hasGeolocation: isIOS || isAndroid || isWeb,
} as const;

/**
 * Get safe area insets
 */
export const SAFE_AREA = {
  top: isIOS ? 44 : 24,
  bottom: isIOS ? 34 : 24,
  left: 0,
  right: 0,
} as const;

/**
 * Responsive hook for dynamic updates
 */
export function useResponsive() {
  return {
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen,
    isIOS,
    isAndroid,
    isWeb,
    screenWidth,
    screenHeight,
    SPACING,
    FONT_SIZES,
    PADDING,
    MARGIN,
    BORDER_RADIUS,
    TOUCH_TARGETS,
    LAYOUT,
    GRID,
    DEVICE_CAPABILITIES,
    SAFE_AREA,
    getResponsiveValue,
    getResponsiveStyle,
  };
} 