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

export class UserPreferences {
  private config: PreferencesConfig;
  private preferences: Map<string, UserPreference> = new Map();
  private categories: Map<string, PreferenceCategory> = new Map();
  private storagePrefix = 'stegnocchi_pref_';
  private autoSaveTimer?: ReturnType<typeof setInterval>;

  constructor(config?: Partial<PreferencesConfig>) {
    this.config = {
      enabled: true,
      autoSave: true,
      encryption: false,
      syncAcrossDevices: false,
      backupInterval: 300000,
      ...config,
    };

    this.initializeDefaultPreferences();
    this.initializeCategories();

    if (this.config.autoSave) {
      this.startAutoSave();
    }
  }

  private initializeDefaultPreferences(): void {
    const defaultPreferences: UserPreference[] = [
      { key: 'theme', value: 'light', category: 'appearance', description: 'Application theme (light/dark)', type: 'string', defaultValue: 'light', validation: (value) => ['light', 'dark', 'auto'].includes(value) },
      { key: 'language', value: 'en', category: 'localization', description: 'Application language', type: 'string', defaultValue: 'en', validation: (value) => ['en', 'es', 'fr', 'de', 'tr'].includes(value) },
      { key: 'autoSave', value: true, category: 'data', description: 'Automatically save work in progress', type: 'boolean', defaultValue: true },
      { key: 'imageQuality', value: 0.9, category: 'processing', description: 'Image compression quality (0.1-1.0)', type: 'number', defaultValue: 0.9, validation: (value) => value >= 0.1 && value <= 1.0 },
      { key: 'maxFileSize', value: 50 * 1024 * 1024, category: 'processing', description: 'Maximum file size in bytes', type: 'number', defaultValue: 50 * 1024 * 1024, validation: (value) => value > 0 && value <= 100 * 1024 * 1024 },
      { key: 'enableAnimations', value: true, category: 'performance', description: 'Enable UI animations', type: 'boolean', defaultValue: true },
      { key: 'enableHaptics', value: true, category: 'feedback', description: 'Enable haptic feedback', type: 'boolean', defaultValue: true },
      { key: 'enableNotifications', value: true, category: 'notifications', description: 'Enable push notifications', type: 'boolean', defaultValue: true },
      { key: 'recentFiles', value: [], category: 'data', description: 'Recently accessed files', type: 'array', defaultValue: [] },
      { key: 'shortcuts', value: {}, category: 'keyboard', description: 'Custom keyboard shortcuts', type: 'object', defaultValue: {} },
    ];

    defaultPreferences.forEach(pref => this.preferences.set(pref.key, pref));
  }

  private initializeCategories(): void {
    const defaultCategories: PreferenceCategory[] = [
      { id: 'appearance', name: 'Appearance', description: 'Visual settings and themes', icon: '🎨' },
      { id: 'localization', name: 'Language & Region', description: 'Language and regional settings', icon: '🌍' },
      { id: 'data', name: 'Data Management', description: 'Data handling and storage settings', icon: '💾' },
      { id: 'processing', name: 'Processing', description: 'Image processing and quality settings', icon: '⚙️' },
      { id: 'performance', name: 'Performance', description: 'Performance and optimization settings', icon: '🚀' },
      { id: 'feedback', name: 'Feedback', description: 'Haptic and audio feedback settings', icon: '📳' },
      { id: 'notifications', name: 'Notifications', description: 'Notification preferences', icon: '🔔' },
      { id: 'keyboard', name: 'Keyboard', description: 'Keyboard shortcuts and input settings', icon: '⌨️' },
    ];

    defaultCategories.forEach(category => this.categories.set(category.id, category));
  }

  async getPreference(key: string): Promise<any> {
    const preference = this.preferences.get(key);
    if (!preference) throw new Error(`Preference not found: ${key}`);

    try {
      const storedValue = await this.getStoredValue(key);
      return storedValue !== null ? storedValue : preference.defaultValue;
    } catch (error) {
      logError(Component.UI, 'Failed to get preference', { key, error });
      return preference.defaultValue;
    }
  }

  async setPreference(key: string, value: any): Promise<boolean> {
    const preference = this.preferences.get(key);
    if (!preference) throw new Error(`Preference not found: ${key}`);

    if (preference.validation && !preference.validation(value)) {
      throw new Error(`Invalid value for preference: ${key}`);
    }

    try {
      await this.setStoredValue(key, value);
      preference.value = value;
      logInfo(Component.UI, 'Preference updated', { key, value, category: preference.category });
      return true;
    } catch (error) {
      logError(Component.UI, 'Failed to set preference', { key, value, error });
      return false;
    }
  }

  async resetPreference(key: string): Promise<boolean> {
    const preference = this.preferences.get(key);
    if (!preference) return false;
    return this.setPreference(key, preference.defaultValue);
  }

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

  async getPreferencesByCategory(category: string): Promise<Record<string, any>> {
    const categoryPreferences: Record<string, any> = {};
    for (const [key, preference] of this.preferences.entries()) {
      if (preference.category === category) {
        categoryPreferences[key] = await this.getPreference(key);
      }
    }
    return categoryPreferences;
  }

  async exportPreferences(): Promise<string> {
    const allPreferences = await this.getAllPreferences();
    const exportData = {
      timestamp: new Date().toISOString(),
      preferences: allPreferences,
    };
    return JSON.stringify(exportData, null, 2);
  }

  async importPreferences(preferencesJson: string): Promise<boolean> {
    try {
      const importData = JSON.parse(preferencesJson);
      const preferences = importData.preferences || {};
      for (const [key, value] of Object.entries(preferences)) {
        if (this.preferences.has(key)) {
          await this.setPreference(key, value);
        }
      }
      logInfo(Component.UI, 'Preferences imported successfully', { importedCount: Object.keys(preferences).length });
      return true;
    } catch (error) {
      logError(Component.UI, 'Failed to import preferences', { error });
      return false;
    }
  }

  private async getStoredValue(key: string): Promise<any> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(this.storagePrefix + key);
        return raw ? JSON.parse(raw) : null;
      }
      return null;
    } catch (error) {
      logError(Component.UI, 'Failed to get stored value (web)', { key, error });
      return null;
    }
  }

  private async setStoredValue(key: string, value: any): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.storagePrefix + key, JSON.stringify(value));
      }
    } catch (error) {
      logError(Component.UI, 'Failed to set stored value (web)', { key, value, error });
      throw error;
    }
  }

  private async removeStoredValue(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(this.storagePrefix + key);
      }
    } catch (error) {
      logError(Component.UI, 'Failed to remove stored value (web)', { key, error });
    }
  }

  private startAutoSave(): void {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
    this.autoSaveTimer = setInterval(() => {
      this.saveAllPreferences();
    }, this.config.backupInterval);
  }

  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = undefined;
    }
  }

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

  updateConfig(config: Partial<PreferencesConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.config.autoSave) {
      this.startAutoSave();
    } else {
      this.stopAutoSave();
    }
    logInfo(Component.UI, 'User preferences config updated', { config: this.config });
  }

  async getAllPreferences(): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    for (const [key] of this.preferences.entries()) {
      result[key] = await this.getPreference(key);
    }
    return result;
  }
}

export const userPreferences = new UserPreferences(); 