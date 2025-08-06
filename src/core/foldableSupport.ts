/**
 * Foldable Device Support
 * Comprehensive support for foldable and dual-screen devices
 */

import { Platform, Dimensions } from 'react-native';

export interface FoldableConfig {
  enableFoldableDetection: boolean;
  enableDualScreen: boolean;
  enableHingeDetection: boolean;
  enableOrientationChange: boolean;
  enableLayoutAdaptation: boolean;
  enableGestureSupport: boolean;
  enableSplitView: boolean;
  enableMirrorMode: boolean;
  enableExtendMode: boolean;
  enableSingleMode: boolean;
}

export interface ScreenInfo {
  id: string;
  width: number;
  height: number;
  x: number;
  y: number;
  isPrimary: boolean;
  isActive: boolean;
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
  colorDepth: number;
  refreshRate: number;
}

export interface FoldableState {
  isFoldable: boolean;
  isDualScreen: boolean;
  isTablet: boolean;
  hingeAngle: number;
  foldState: 'folded' | 'unfolded' | 'half-folded';
  activeScreens: ScreenInfo[];
  layout: 'single' | 'dual' | 'folded' | 'unfolded';
  displayMode: 'mirror' | 'extend' | 'single';
  orientation: 'portrait' | 'landscape' | 'auto';
  isHingeVisible: boolean;
  hingePosition: 'vertical' | 'horizontal' | 'none';
}

export interface LayoutConfig {
  single: {
    width: number;
    height: number;
    columns: number;
    rows: number;
  };
  dual: {
    leftScreen: {
      width: number;
      height: number;
      columns: number;
      rows: number;
    };
    rightScreen: {
      width: number;
      height: number;
      columns: number;
      rows: number;
    };
    hinge: {
      width: number;
      height: number;
    };
  };
  folded: {
    width: number;
    height: number;
    columns: number;
    rows: number;
  };
  unfolded: {
    width: number;
    height: number;
    columns: number;
    rows: number;
  };
}

class FoldableSupport {
  private config: FoldableConfig;
  private state: FoldableState;
  private layoutConfig: LayoutConfig;
  private listeners: Set<(state: FoldableState) => void>;

  constructor() {
    this.config = this.getDefaultConfig();
    this.state = this.getInitialState();
    this.layoutConfig = this.getInitialLayoutConfig();
    this.listeners = new Set();
    this.initialize();
  }

  /**
   * Get default foldable configuration
   */
  private getDefaultConfig(): FoldableConfig {
    return {
      enableFoldableDetection: true,
      enableDualScreen: true,
      enableHingeDetection: true,
      enableOrientationChange: true,
      enableLayoutAdaptation: true,
      enableGestureSupport: true,
      enableSplitView: true,
      enableMirrorMode: true,
      enableExtendMode: true,
      enableSingleMode: true,
    };
  }

  /**
   * Get initial foldable state
   */
  private getInitialState(): FoldableState {
    const { width, height } = Dimensions.get('window');
    const isTablet = this.isTablet();
    const isFoldable = this.isFoldableDevice();
    const isDualScreen = this.isDualScreenDevice();

    return {
      isFoldable,
      isDualScreen,
      isTablet,
      hingeAngle: 180,
      foldState: 'unfolded',
      activeScreens: this.getScreenInfo(),
      layout: 'single',
      displayMode: 'single',
      orientation: this.getScreenOrientation(),
      isHingeVisible: false,
      hingePosition: 'none',
    };
  }

  /**
   * Get initial layout configuration
   */
  private getInitialLayoutConfig(): LayoutConfig {
    const { width, height } = Dimensions.get('window');
    const isTablet = this.isTablet();

    return {
      single: {
        width,
        height,
        columns: isTablet ? 12 : 6,
        rows: isTablet ? 8 : 10,
      },
      dual: {
        leftScreen: {
          width: width / 2,
          height,
          columns: isTablet ? 6 : 3,
          rows: isTablet ? 8 : 10,
        },
        rightScreen: {
          width: width / 2,
          height,
          columns: isTablet ? 6 : 3,
          rows: isTablet ? 8 : 10,
        },
        hinge: {
          width: 0,
          height,
        },
      },
      folded: {
        width: width / 2,
        height,
        columns: isTablet ? 6 : 3,
        rows: isTablet ? 8 : 10,
      },
      unfolded: {
        width,
        height,
        columns: isTablet ? 12 : 6,
        rows: isTablet ? 8 : 10,
      },
    };
  }

  /**
   * Initialize foldable support
   */
  private initialize(): void {
    if (Platform.OS === 'web') {
      this.initializeWebFoldable();
    } else {
      this.initializeNativeFoldable();
    }

    this.setupEventListeners();
    this.updateState();
  }

  /**
   * Initialize web foldable support
   */
  private initializeWebFoldable(): void {
    // Check for foldable device APIs
    if ('getScreenDetails' in window) {
      this.setupScreenDetailsAPI();
    }

    // Check for CSS foldable media queries
    this.setupCSSFoldableSupport();

    // Check for foldable device detection
    this.detectFoldableDevice();
  }

  /**
   * Initialize native foldable support
   */
  private initializeNativeFoldable(): void {
    // For React Native, we'll use platform-specific APIs
    // This would integrate with native foldable device libraries
    console.log('Native foldable support initialized');
  }

  /**
   * Setup screen details API
   */
  private async setupScreenDetailsAPI(): Promise<void> {
    try {
      const screenDetails = await (window as any).getScreenDetails();
      const screens = screenDetails.screens;

      // Update screen information
      this.state.activeScreens = screens.map((screen: any, index: number) => ({
        id: screen.id,
        width: screen.width,
        height: screen.height,
        x: screen.left,
        y: screen.top,
        isPrimary: index === 0,
        isActive: true,
        orientation: screen.width > screen.height ? 'landscape' : 'portrait',
        pixelRatio: screen.devicePixelRatio,
        colorDepth: screen.colorDepth,
        refreshRate: screen.refreshRate,
      }));

      // Listen for screen changes
      screenDetails.addEventListener('screenschange', () => {
        this.updateScreenInfo();
      });

      // Listen for current screen changes
      screenDetails.addEventListener('currentscreenchange', () => {
        this.updateCurrentScreen();
      });
    } catch (error) {
      console.error('Failed to setup screen details API:', error);
    }
  }

  /**
   * Setup CSS foldable support
   */
  private setupCSSFoldableSupport(): void {
    if (Platform.OS === 'web') {
      // Add CSS for foldable layouts
      const style = document.createElement('style');
      style.textContent = `
        /* Foldable device support */
        @media (screen-spanning: single-fold-vertical) {
          .foldable-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: env(fold-width);
          }
          
          .foldable-left {
            grid-column: 1;
          }
          
          .foldable-right {
            grid-column: 2;
          }
          
          .foldable-hinge {
            grid-column: 1 / 3;
            width: env(fold-width);
            background: var(--hinge-color, #000);
          }
        }
        
        @media (screen-spanning: single-fold-horizontal) {
          .foldable-container {
            display: grid;
            grid-template-rows: 1fr 1fr;
            gap: env(fold-height);
          }
          
          .foldable-top {
            grid-row: 1;
          }
          
          .foldable-bottom {
            grid-row: 2;
          }
          
          .foldable-hinge {
            grid-row: 1 / 3;
            height: env(fold-height);
            background: var(--hinge-color, #000);
          }
        }
        
        /* Fold state detection */
        @media (screen-spanning: none) {
          .foldable-container {
            display: block;
          }
        }
        
        /* Orientation support */
        @media (orientation: portrait) {
          .foldable-portrait {
            display: block;
          }
          
          .foldable-landscape {
            display: none;
          }
        }
        
        @media (orientation: landscape) {
          .foldable-portrait {
            display: none;
          }
          
          .foldable-landscape {
            display: block;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Detect foldable device
   */
  private detectFoldableDevice(): void {
    if (Platform.OS === 'web') {
      // Check for foldable device indicators
      const userAgent = navigator.userAgent.toLowerCase();
      const isFoldable = userAgent.includes('fold') || 
                        userAgent.includes('duo') || 
                        userAgent.includes('surface') ||
                        this.hasFoldableFeatures();

      this.state.isFoldable = isFoldable;
      this.state.isDualScreen = isFoldable && this.hasDualScreenFeatures();
    }
  }

  /**
   * Check for foldable features
   */
  private hasFoldableFeatures(): boolean {
    if (Platform.OS !== 'web') return false;

    // Check for CSS foldable support
    const testElement = document.createElement('div');
    testElement.style.cssText = 'screen-spanning: single-fold-vertical';
    return testElement.style.screenSpanning !== undefined;
  }

  /**
   * Check for dual screen features
   */
  private hasDualScreenFeatures(): boolean {
    if (Platform.OS !== 'web') return false;

    // Check for dual screen APIs
    return 'getScreenDetails' in window || 'fold' in window;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (Platform.OS === 'web') {
      // Listen for window resize
      window.addEventListener('resize', () => {
        this.handleResize();
      });

      // Listen for orientation change
      window.addEventListener('orientationchange', () => {
        this.handleOrientationChange();
      });

      // Listen for fold state changes
      if ('onfoldchange' in window) {
        window.addEventListener('foldchange', (event: any) => {
          this.handleFoldChange(event);
        });
      }
    } else {
      // For React Native, use Dimensions API
      Dimensions.addEventListener('change', () => {
        this.handleResize();
      });
    }
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    this.updateScreenInfo();
    this.updateLayoutConfig();
    this.updateState();
  }

  /**
   * Handle orientation change
   */
  private handleOrientationChange(): void {
    this.state.orientation = this.getScreenOrientation();
    this.updateLayoutConfig();
    this.updateState();
  }

  /**
   * Handle fold state change
   */
  private handleFoldChange(event: any): void {
    if (event.detail) {
      this.state.hingeAngle = event.detail.angle || 180;
      this.state.foldState = this.getFoldState(this.state.hingeAngle);
      this.state.isHingeVisible = this.state.hingeAngle < 180;
      this.updateState();
    }
  }

  /**
   * Get screen information
   */
  private getScreenInfo(): ScreenInfo[] {
    const { width, height } = Dimensions.get('window');
    
    return [{
      id: 'primary',
      width,
      height,
      x: 0,
      y: 0,
      isPrimary: true,
      isActive: true,
      orientation: this.getScreenOrientation(),
      pixelRatio: Platform.OS === 'web' ? window.devicePixelRatio : 1,
      colorDepth: Platform.OS === 'web' ? window.screen.colorDepth : 24,
      refreshRate: Platform.OS === 'web' ? (window.screen as any).refreshRate || 60 : 60,
    }];
  }

  /**
   * Update screen information
   */
  private updateScreenInfo(): void {
    this.state.activeScreens = this.getScreenInfo();
  }

  /**
   * Update current screen
   */
  private updateCurrentScreen(): void {
    // Update which screen is currently active
    this.state.activeScreens.forEach(screen => {
      screen.isActive = screen.isPrimary; // Simplified logic
    });
  }

  /**
   * Update layout configuration
   */
  private updateLayoutConfig(): void {
    this.layoutConfig = this.getInitialLayoutConfig();
  }

  /**
   * Update foldable state
   */
  private updateState(): void {
    this.state.layout = this.getLayout();
    this.state.hingePosition = this.getHingePosition();
    this.notifyListeners();
  }

  /**
   * Get current layout
   */
  private getLayout(): 'single' | 'dual' | 'folded' | 'unfolded' {
    if (!this.state.isFoldable) {
      return 'single';
    }

    if (this.state.hingeAngle < 30) {
      return 'folded';
    } else if (this.state.hingeAngle > 150) {
      return 'unfolded';
    } else {
      return 'dual';
    }
  }

  /**
   * Get hinge position
   */
  private getHingePosition(): 'vertical' | 'horizontal' | 'none' {
    if (!this.state.isFoldable) {
      return 'none';
    }

    const { width, height } = Dimensions.get('window');
    return width > height ? 'vertical' : 'horizontal';
  }

  /**
   * Get fold state from hinge angle
   */
  private getFoldState(angle: number): 'folded' | 'unfolded' | 'half-folded' {
    if (angle < 30) {
      return 'folded';
    } else if (angle > 150) {
      return 'unfolded';
    } else {
      return 'half-folded';
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
      return this.hasFoldableFeatures();
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
      return this.hasDualScreenFeatures();
    } else {
      return false;
    }
  }

  /**
   * Notify listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Foldable state listener error:', error);
      }
    });
  }

  /**
   * Subscribe to foldable state changes
   */
  subscribe(listener: (state: FoldableState) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current foldable state
   */
  getState(): FoldableState {
    return { ...this.state };
  }

  /**
   * Get layout configuration
   */
  getLayoutConfig(): LayoutConfig {
    return { ...this.layoutConfig };
  }

  /**
   * Get configuration
   */
  getConfig(): FoldableConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<FoldableConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if foldable features are supported
   */
  isSupported(): boolean {
    return this.state.isFoldable || this.state.isDualScreen;
  }

  /**
   * Check if specific feature is enabled
   */
  isEnabled(feature: keyof FoldableConfig): boolean {
    return this.config[feature];
  }

  /**
   * Get optimal layout for current state
   */
  getOptimalLayout(): LayoutConfig[keyof LayoutConfig] {
    return this.layoutConfig[this.state.layout];
  }

  /**
   * Get screen by ID
   */
  getScreen(id: string): ScreenInfo | null {
    return this.state.activeScreens.find(screen => screen.id === id) || null;
  }

  /**
   * Get primary screen
   */
  getPrimaryScreen(): ScreenInfo | null {
    return this.state.activeScreens.find(screen => screen.isPrimary) || null;
  }

  /**
   * Get active screens
   */
  getActiveScreens(): ScreenInfo[] {
    return this.state.activeScreens.filter(screen => screen.isActive);
  }
}

// Global foldable support instance
export const foldableSupport = new FoldableSupport();

export default FoldableSupport; 