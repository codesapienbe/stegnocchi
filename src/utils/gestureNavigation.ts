import { Platform } from 'react-native';
import { hapticFeedback } from './hapticFeedback';
import { logInfo, Component } from '../core/logger';

export interface GestureNavigationConfig {
  enabled: boolean;
  swipeThreshold: number;
  longPressDelay: number;
  doubleTapDelay: number;
}

export interface NavigationAction {
  type: 'navigate' | 'goBack' | 'goForward' | 'refresh' | 'home' | 'settings';
  route?: string;
  params?: Record<string, any>;
}

export interface GestureHandler {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  onPinchIn?: () => void;
  onPinchOut?: () => void;
}

/**
 * Gesture-based navigation utility
 */
export class GestureNavigation {
  private config: GestureNavigationConfig;
  private handlers: Map<string, GestureHandler> = new Map();
  private isEnabled: boolean = true;

  constructor(config: GestureNavigationConfig = {
    enabled: true,
    swipeThreshold: 50,
    longPressDelay: 500,
    doubleTapDelay: 300,
  }) {
    this.config = config;
    this.isEnabled = config.enabled;
  }

  /**
   * Register gesture handler for a screen
   */
  registerHandler(screenId: string, handler: GestureHandler): void {
    this.handlers.set(screenId, handler);
    
    logInfo(Component.UI, 'Gesture handler registered', {
      screenId,
      hasSwipeLeft: !!handler.onSwipeLeft,
      hasSwipeRight: !!handler.onSwipeRight,
      hasLongPress: !!handler.onLongPress,
      hasDoubleTap: !!handler.onDoubleTap,
    });
  }

  /**
   * Unregister gesture handler
   */
  unregisterHandler(screenId: string): void {
    this.handlers.delete(screenId);
    
    logInfo(Component.UI, 'Gesture handler unregistered', { screenId });
  }

  /**
   * Handle swipe gesture
   */
  handleSwipe(screenId: string, direction: 'left' | 'right' | 'up' | 'down', distance: number): void {
    if (!this.isEnabled || distance < this.config.swipeThreshold) {
      return;
    }

    const handler = this.handlers.get(screenId);
    if (!handler) return;

    let action: (() => void) | undefined;

    switch (direction) {
      case 'left':
        action = handler.onSwipeLeft;
        break;
      case 'right':
        action = handler.onSwipeRight;
        break;
      case 'up':
        action = handler.onSwipeUp;
        break;
      case 'down':
        action = handler.onSwipeDown;
        break;
    }

    if (action) {
      hapticFeedback.trigger('light');
      action();
      
      logInfo(Component.UI, 'Swipe gesture handled', {
        screenId,
        direction,
        distance,
      });
    }
  }

  /**
   * Handle long press gesture
   */
  handleLongPress(screenId: string): void {
    if (!this.isEnabled) return;

    const handler = this.handlers.get(screenId);
    if (handler?.onLongPress) {
      hapticFeedback.trigger('medium');
      handler.onLongPress();
      
      logInfo(Component.UI, 'Long press gesture handled', { screenId });
    }
  }

  /**
   * Handle double tap gesture
   */
  handleDoubleTap(screenId: string): void {
    if (!this.isEnabled) return;

    const handler = this.handlers.get(screenId);
    if (handler?.onDoubleTap) {
      hapticFeedback.trigger('light');
      handler.onDoubleTap();
      
      logInfo(Component.UI, 'Double tap gesture handled', { screenId });
    }
  }

  /**
   * Handle pinch gesture
   */
  handlePinch(screenId: string, scale: number): void {
    if (!this.isEnabled) return;

    const handler = this.handlers.get(screenId);
    if (!handler) return;

    if (scale < 0.8 && handler.onPinchIn) {
      hapticFeedback.trigger('light');
      handler.onPinchIn();
      
      logInfo(Component.UI, 'Pinch in gesture handled', { screenId, scale });
    } else if (scale > 1.2 && handler.onPinchOut) {
      hapticFeedback.trigger('light');
      handler.onPinchOut();
      
      logInfo(Component.UI, 'Pinch out gesture handled', { screenId, scale });
    }
  }

  /**
   * Create default navigation gestures
   */
  createDefaultGestures(navigation: any): GestureHandler {
    return {
      onSwipeLeft: () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      },
      onSwipeRight: () => {
        // Could be used for forward navigation or menu toggle
      },
      onSwipeUp: () => {
        // Could be used for refresh or scroll to top
      },
      onSwipeDown: () => {
        // Could be used for pull to refresh
      },
      onLongPress: () => {
        // Could be used for context menu or options
      },
      onDoubleTap: () => {
        // Could be used for quick actions
      },
    };
  }

  /**
   * Enable/disable gesture navigation
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    logInfo(Component.UI, 'Gesture navigation toggled', { enabled });
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<GestureNavigationConfig>): void {
    this.config = { ...this.config, ...config };
    
    logInfo(Component.UI, 'Gesture navigation config updated', { config });
  }

  /**
   * Get current configuration
   */
  getConfig(): GestureNavigationConfig {
    return { ...this.config };
  }

  /**
   * Get registered handlers count
   */
  getHandlerCount(): number {
    return this.handlers.size;
  }
}

// Export singleton instance
export const gestureNavigation = new GestureNavigation(); 