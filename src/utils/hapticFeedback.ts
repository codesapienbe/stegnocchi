import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { logInfo, Component } from '../core/logger';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

export interface HapticFeedbackConfig {
  enabled: boolean;
  reducedMotion: boolean;
}

/**
 * Haptic feedback utility for cross-platform haptic responses
 */
export class HapticFeedback {
  private config: HapticFeedbackConfig;

  constructor(config: HapticFeedbackConfig = { enabled: true, reducedMotion: false }) {
    this.config = config;
  }

  /**
   * Trigger haptic feedback
   */
  async trigger(type: HapticType): Promise<void> {
    if (!this.config.enabled || this.config.reducedMotion) {
      return;
    }

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'selection':
          await Haptics.selectionAsync();
          break;
      }

      logInfo(Component.UI, 'Haptic feedback triggered', { type, platform: Platform.OS });
    } catch (error) {
      // Silently fail if haptics are not supported
      console.debug('Haptic feedback not supported:', error);
    }
  }

  /**
   * Button press feedback
   */
  async buttonPress(): Promise<void> {
    await this.trigger('light');
  }

  /**
   * Success feedback
   */
  async success(): Promise<void> {
    await this.trigger('success');
  }

  /**
   * Error feedback
   */
  async error(): Promise<void> {
    await this.trigger('error');
  }

  /**
   * Warning feedback
   */
  async warning(): Promise<void> {
    await this.trigger('warning');
  }

  /**
   * Selection feedback
   */
  async selection(): Promise<void> {
    await this.trigger('selection');
  }

  /**
   * Long press feedback
   */
  async longPress(): Promise<void> {
    await this.trigger('medium');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<HapticFeedbackConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const hapticFeedback = new HapticFeedback(); 