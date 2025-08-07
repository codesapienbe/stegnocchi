import { logInfo, Component } from '../core/logger';

export interface CustomTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      small: number;
      medium: number;
      large: number;
      xlarge: number;
    };
    fontWeight: {
      light: string;
      normal: string;
      bold: string;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface ThemePreset {
  id: string;
  name: string;
  theme: CustomTheme;
}

/**
 * Custom themes utility for branding and theme customization
 */
export class CustomThemes {
  private themes: Map<string, CustomTheme> = new Map();
  private presets: Map<string, ThemePreset> = new Map();
  private currentThemeId: string = 'default';

  constructor() {
    this.initializeDefaultThemes();
    this.initializePresets();
  }

  /**
   * Initialize default themes
   */
  private initializeDefaultThemes(): void {
    const defaultTheme: CustomTheme = {
      id: 'default',
      name: 'Default',
      description: 'Default application theme',
      colors: {
        primary: '#007AFF',
        secondary: '#5856D6',
        accent: '#FF9500',
        background: '#FFFFFF',
        surface: '#F2F2F7',
        text: '#000000',
        textSecondary: '#8E8E93',
        border: '#C6C6C8',
        error: '#FF3B30',
        warning: '#FF9500',
        success: '#34C759',
        info: '#007AFF',
      },
      typography: {
        fontFamily: 'System',
        fontSize: {
          small: 12,
          medium: 16,
          large: 20,
          xlarge: 24,
        },
        fontWeight: {
          light: '300',
          normal: '400',
          bold: '700',
        },
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
      },
      borderRadius: {
        small: 4,
        medium: 8,
        large: 12,
      },
      shadows: {
        small: '0 1px 3px rgba(0,0,0,0.12)',
        medium: '0 4px 6px rgba(0,0,0,0.15)',
        large: '0 10px 20px rgba(0,0,0,0.19)',
      },
    };

    const darkTheme: CustomTheme = {
      id: 'dark',
      name: 'Dark',
      description: 'Dark mode theme',
      colors: {
        primary: '#0A84FF',
        secondary: '#5E5CE6',
        accent: '#FF9F0A',
        background: '#000000',
        surface: '#1C1C1E',
        text: '#FFFFFF',
        textSecondary: '#8E8E93',
        border: '#38383A',
        error: '#FF453A',
        warning: '#FF9F0A',
        success: '#30D158',
        info: '#0A84FF',
      },
      typography: defaultTheme.typography,
      spacing: defaultTheme.spacing,
      borderRadius: defaultTheme.borderRadius,
      shadows: {
        small: '0 1px 3px rgba(255,255,255,0.12)',
        medium: '0 4px 6px rgba(255,255,255,0.15)',
        large: '0 10px 20px rgba(255,255,255,0.19)',
      },
    };

    this.themes.set('default', defaultTheme);
    this.themes.set('dark', darkTheme);
  }

  /**
   * Initialize theme presets
   */
  private initializePresets(): void {
    const corporateTheme: CustomTheme = {
      id: 'corporate',
      name: 'Corporate',
      description: 'Professional corporate theme',
      colors: {
        primary: '#2C3E50',
        secondary: '#34495E',
        accent: '#3498DB',
        background: '#ECF0F1',
        surface: '#FFFFFF',
        text: '#2C3E50',
        textSecondary: '#7F8C8D',
        border: '#BDC3C7',
        error: '#E74C3C',
        warning: '#F39C12',
        success: '#27AE60',
        info: '#3498DB',
      },
      typography: {
        fontFamily: 'Roboto, sans-serif',
        fontSize: {
          small: 12,
          medium: 14,
          large: 18,
          xlarge: 22,
        },
        fontWeight: {
          light: '300',
          normal: '400',
          bold: '600',
        },
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
      },
      borderRadius: {
        small: 2,
        medium: 4,
        large: 8,
      },
      shadows: {
        small: '0 1px 2px rgba(44,62,80,0.1)',
        medium: '0 2px 4px rgba(44,62,80,0.15)',
        large: '0 4px 8px rgba(44,62,80,0.2)',
      },
    };

    const creativeTheme: CustomTheme = {
      id: 'creative',
      name: 'Creative',
      description: 'Vibrant creative theme',
      colors: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        accent: '#45B7D1',
        background: '#F7F1E3',
        surface: '#FFFFFF',
        text: '#2C3E50',
        textSecondary: '#7F8C8D',
        border: '#E8E8E8',
        error: '#E74C3C',
        warning: '#F39C12',
        success: '#27AE60',
        info: '#3498DB',
      },
      typography: {
        fontFamily: 'Poppins, sans-serif',
        fontSize: {
          small: 13,
          medium: 16,
          large: 20,
          xlarge: 26,
        },
        fontWeight: {
          light: '300',
          normal: '400',
          bold: '700',
        },
      },
      spacing: {
        xs: 6,
        sm: 12,
        md: 20,
        lg: 28,
        xl: 36,
      },
      borderRadius: {
        small: 8,
        medium: 12,
        large: 16,
      },
      shadows: {
        small: '0 2px 4px rgba(255,107,107,0.1)',
        medium: '0 4px 8px rgba(255,107,107,0.15)',
        large: '0 8px 16px rgba(255,107,107,0.2)',
      },
    };

    this.presets.set('corporate', { id: 'corporate', name: 'Corporate', theme: corporateTheme });
    this.presets.set('creative', { id: 'creative', name: 'Creative', theme: creativeTheme });
  }

  /**
   * Create custom theme
   */
  createTheme(theme: CustomTheme): void {
    this.themes.set(theme.id, theme);
    
    logInfo(Component.UI, 'Custom theme created', {
      themeId: theme.id,
      themeName: theme.name,
    });
  }

  /**
   * Get theme by ID
   */
  getTheme(themeId: string): CustomTheme | null {
    return this.themes.get(themeId) || null;
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): CustomTheme {
    return this.themes.get(this.currentThemeId) || this.themes.get('default')!;
  }

  /**
   * Set current theme
   */
  setCurrentTheme(themeId: string): boolean {
    if (this.themes.has(themeId)) {
      this.currentThemeId = themeId;
      
      logInfo(Component.UI, 'Theme changed', {
        themeId,
        themeName: this.themes.get(themeId)?.name,
      });
      
      return true;
    }
    return false;
  }

  /**
   * Get all available themes
   */
  getAllThemes(): CustomTheme[] {
    return Array.from(this.themes.values());
  }

  /**
   * Get theme presets
   */
  getPresets(): ThemePreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Apply preset theme
   */
  applyPreset(presetId: string): boolean {
    const preset = this.presets.get(presetId);
    if (preset) {
      this.createTheme(preset.theme);
      this.setCurrentTheme(preset.theme.id);
      return true;
    }
    return false;
  }

  /**
   * Update theme
   */
  updateTheme(themeId: string, updates: Partial<CustomTheme>): boolean {
    const theme = this.themes.get(themeId);
    if (theme) {
      const updatedTheme = { ...theme, ...updates };
      this.themes.set(themeId, updatedTheme);
      
      logInfo(Component.UI, 'Theme updated', {
        themeId,
        updates: Object.keys(updates),
      });
      
      return true;
    }
    return false;
  }

  /**
   * Delete theme
   */
  deleteTheme(themeId: string): boolean {
    if (themeId === 'default' || themeId === 'dark') {
      return false; // Cannot delete default themes
    }
    
    const deleted = this.themes.delete(themeId);
    if (deleted && this.currentThemeId === themeId) {
      this.currentThemeId = 'default';
    }
    
    logInfo(Component.UI, 'Theme deleted', { themeId });
    return deleted;
  }

  /**
   * Export theme as JSON
   */
  exportTheme(themeId: string): string | null {
    const theme = this.themes.get(themeId);
    return theme ? JSON.stringify(theme, null, 2) : null;
  }

  /**
   * Import theme from JSON
   */
  importTheme(themeJson: string): boolean {
    try {
      const theme: CustomTheme = JSON.parse(themeJson);
      if (theme.id && theme.name) {
        this.createTheme(theme);
        return true;
      }
    } catch (error) {
      console.error('Failed to import theme:', error);
    }
    return false;
  }
}

// Export singleton instance
export const customThemes = new CustomThemes(); 