import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logInfo, logError, Component } from '../core/logger';

export interface UserPreference {
  key: string;
  value: any;
  category: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue: any;
  validation?: (value: any) => boolean;
}

export interface PreferencesConfig {
  enabled: boolean;
  autoSave: boolean;
  encryption: boolean;
  syncAcrossDevices: boolean;
  backupInterval: number; // milliseconds
}

export interface PreferenceCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

/**
 * User preferences and settings persistence utility
 */
export class UserPreferences {
  private config: PreferencesConfig;
  private preferences: Map<string, UserPreference> = new Map();
  private categories: Map<string, PreferenceCategory> = new Map();
  private storagePrefix = 'stegnocchi_pref_';
  private autoSaveTimer?: NodeJS.Timeout;

  constructor(config?: Partial<PreferencesConfig>) {
    this.config = {
      enabled: true,
      autoSave: true,
      encryption: false,
      syncAcrossDevices: false,
      backupInterval: 300000, // 5 minutes
      ...config,
    };

    this.initializeDefaultPreferences();
    this.initializeCategories();
    
    if (this.config.autoSave) {
      this.startAutoSave();
    }
  }

  /**
   * Initialize default preferences
   */
  private initializeDefaultPreferences(): void {
    const defaultPreferences: UserPreference[] = [
      {
        key: 'theme',
        value: 'light',
        category: 'appearance',
        description: 'Application theme (light/dark)',
        type: 'string',
        defaultValue: 'light',
        validation: (value) => ['light', 'dark', 'auto'].includes(value),
      },
      {
        key: 'language',
        value: 'en',
        category: 'localization',
        description: 'Application language',
        type: 'string',
        defaultValue: 'en',
        validation: (value) => ['en', 'es', 'fr', 'de', 'tr'].includes(value),
      },
      {
        key: 'autoSave',
        value: true,
        category: 'data',
        description: 'Automatically save work in progress',
        type: 'boolean',
        defaultValue: true,
      },
      {
        key: 'imageQuality',
        value: 0.9,
        category: 'processing',
        description: 'Image compression quality (0.1-1.0)',
        type: 'number',
        defaultValue: 0.9,
        validation: (value) => value >= 0.1 && value <= 1.0,
      },
      {
        key: 'maxFileSize',
        value: 50 * 1024 * 1024, // 50MB
        category: 'processing',
        description: 'Maximum file size in bytes',
        type: 'number',
        defaultValue: 50 * 1024 * 1024,
        validation: (value) => value > 0 && value <= 100 * 1024 * 1024,
      },
      {
        key: 'enableAnimations',
        value: true,
        category: 'performance',
        description: 'Enable UI animations',
        type: 'boolean',
        defaultValue: true,
      },
      {
        key: 'enableHaptics',
        value: true,
        category: 'feedback',
        description: 'Enable haptic feedback',
        type: 'boolean',
        defaultValue: true,
      },
      {
        key: 'enableNotifications',
        value: true,
        category: 'notifications',
        description: 'Enable push notifications',
        type: 'boolean',
        defaultValue: true,
      },
      {
        key: 'recentFiles',
        value: [],
        category: 'data',
        description: 'Recently accessed files',
        type: 'array',
        defaultValue: [],
      },
      {
        key: 'shortcuts',
        value: {},
        category: 'keyboard',
        description: 'Custom keyboard shortcuts',
        type: 'object',
        defaultValue: {},
      },
    ];

    defaultPreferences.forEach(pref => {
      this.preferences.set(pref.key, pref);
    });
  }

  /**
   * Initialize preference categories
   */
  private initializeCategories(): void {
    const defaultCategories: PreferenceCategory[] = [
      {
        id: 'appearance',
        name: 'Appearance',
        description: 'Visual settings and themes',
        icon: '🎨',
      },
      {
        id: 'localization',
        name: 'Language & Region',
        description: 'Language and regional settings',
        icon: '🌍',
      },
      {
        id: 'data',
        name: 'Data Management',
        description: 'Data handling and storage settings',
        icon: '💾',
      },
      {
        id: 'processing',
        name: 'Processing',
        description: 'Image processing and quality settings',
        icon: '⚙️',
      },
      {
        id: 'performance',
        name: 'Performance',
        description: 'Performance and optimization settings',
        icon: '🚀',
      },
      {
        id: 'feedback',
        name: 'Feedback',
        description: 'Haptic and audio feedback settings',
        icon: '📳',
      },
      {
        id: 'notifications',
        name: 'Notifications',
        description: 'Notification preferences',
        icon: '🔔',
      },
      {
        id: 'keyboard',
        name: 'Keyboard',
        description: 'Keyboard shortcuts and input settings',
        icon: '⌨️',
      },
    ];

    defaultCategories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  /**
   * Get preference value
   */
  async getPreference(key: string): Promise<any> {
    const preference = this.preferences.get(key);
    if (!preference) {
      throw new Error(`Preference not found: ${key}`);
    }

    try {
      const storedValue = await this.getStoredValue(key);
      return storedValue !== null ? storedValue : preference.defaultValue;
    } catch (error) {
      logError(Component.UI, 'Failed to get preference', { key, error });
      return preference.defaultValue;
    }
  }

  /**
   * Set preference value
   */
  async setPreference(key: string, value: any): Promise<boolean> {
    const preference = this.preferences.get(key);
    if (!preference) {
      throw new Error(`Preference not found: ${key}`);
    }

    // Validate value
    if (preference.validation && !preference.validation(value)) {
      throw new Error(`Invalid value for preference: ${key}`);
    }

    try {
      await this.setStoredValue(key, value);
      preference.value = value;
      
      logInfo(Component.UI, 'Preference updated', {
        key,
        value,
        category: preference.category,
      });
      
      return true;
    } catch (error) {
      logError(Component.UI, 'Failed to set preference', { key, value, error });
      return false;
    }
  }

  /**
   * Reset preference to default
   */
  async resetPreference(key: string): Promise<boolean> {
    const preference = this.preferences.get(key);
    if (!preference) {
      return false;
    }

    return this.setPreference(key, preference.defaultValue);
  }

  /**
   * Reset all preferences to defaults
   */
  async resetAllPreferences(): Promise<boolean> {
    try {
      const keys = Array.from(this.preferences.keys());
      await Promise.all(keys.map(key => this.resetPreference(key)));
      
      logInfo(Component.UI, 'All preferences reset to defaults', {});
      return true;
    } catch (error) {
      logError(Component.UI, 'Failed to reset all preferences', { error });
      return false;
    }
  }

  /**
   * Get all preferences for a category
   */
  async getPreferencesByCategory(category: string): Promise<Record<string, any>> {
    const categoryPreferences: Record<string, any> = {};
    
    for (const [key, preference] of this.preferences.entries()) {
      if (preference.category === category) {
        categoryPreferences[key] = await this.getPreference(key);
      }
    }
    
    return categoryPreferences;
  }

  /**
   * Get all preferences
   */
  async getAllPreferences(): Promise<Record<string, any>> {
    const allPreferences: Record<string, any> = {};
    
    for (const [key] of this.preferences.entries()) {
      allPreferences[key] = await this.getPreference(key);
    }
    
    return allPreferences;
  }

  /**
   * Add custom preference
   */
  addPreference(preference: UserPreference): void {
    this.preferences.set(preference.key, preference);
    
    logInfo(Component.UI, 'Custom preference added', {
      key: preference.key,
      category: preference.category,
      type: preference.type,
    });
  }

  /**
   * Remove preference
   */
  async removePreference(key: string): Promise<boolean> {
    const preference = this.preferences.get(key);
    if (!preference) {
      return false;
    }

    this.preferences.delete(key);
    await this.removeStoredValue(key);
    
    logInfo(Component.UI, 'Preference removed', { key });
    return true;
  }

  /**
   * Get preference categories
   */
  getCategories(): PreferenceCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Add custom category
   */
  addCategory(category: PreferenceCategory): void {
    this.categories.set(category.id, category);
    
    logInfo(Component.UI, 'Custom category added', {
      categoryId: category.id,
      name: category.name,
    });
  }

  /**
   * Export preferences
   */
  async exportPreferences(): Promise<string> {
    try {
      const allPreferences = await this.getAllPreferences();
      const exportData = {
        preferences: allPreferences,
        metadata: {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          platform: Platform.OS,
        },
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      logError(Component.UI, 'Failed to export preferences', { error });
      throw error;
    }
  }

  /**
   * Import preferences
   */
  async importPreferences(preferencesJson: string): Promise<boolean> {
    try {
      const importData = JSON.parse(preferencesJson);
      const preferences = importData.preferences || {};
      
      for (const [key, value] of Object.entries(preferences)) {
        if (this.preferences.has(key)) {
          await this.setPreference(key, value);
        }
      }
      
      logInfo(Component.UI, 'Preferences imported successfully', {
        importedCount: Object.keys(preferences).length,
      });
      
      return true;
    } catch (error) {
      logError(Component.UI, 'Failed to import preferences', { error });
      return false;
    }
  }

  /**
   * Get stored value from storage
   */
  private async getStoredValue(key: string): Promise<any> {
    try {
      const storedValue = await AsyncStorage.getItem(this.storagePrefix + key);
      return storedValue ? JSON.parse(storedValue) : null;
    } catch (error) {
      logError(Component.UI, 'Failed to get stored value', { key, error });
      return null;
    }
  }

  /**
   * Set stored value in storage
   */
  private async setStoredValue(key: string, value: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storagePrefix + key, JSON.stringify(value));
    } catch (error) {
      logError(Component.UI, 'Failed to set stored value', { key, value, error });
      throw error;
    }
  }

  /**
   * Remove stored value from storage
   */
  private async removeStoredValue(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.storagePrefix + key);
    } catch (error) {
      logError(Component.UI, 'Failed to remove stored value', { key, error });
    }
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(() => {
      this.saveAllPreferences();
    }, this.config.backupInterval);
  }

  /**
   * Stop auto-save timer
   */
  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = undefined;
    }
  }

  /**
   * Save all preferences
   */
  private async saveAllPreferences(): Promise<void> {
    try {
      const allPreferences = await this.getAllPreferences();
      for (const [key, value] of Object.entries(allPreferences)) {
        await this.setStoredValue(key, value);
      }
      
      logInfo(Component.UI, 'All preferences auto-saved', {});
    } catch (error) {
      logError(Component.UI, 'Auto-save failed', { error });
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PreferencesConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.autoSave) {
      this.startAutoSave();
    } else {
      this.stopAutoSave();
    }
    
    logInfo(Component.UI, 'User preferences config updated', {
      config: this.config,
    });
  }
}

// Export singleton instance
export const userPreferences = new UserPreferences(); 