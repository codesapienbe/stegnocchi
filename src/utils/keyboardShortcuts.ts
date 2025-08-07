import { Platform } from 'react-native';
import { logInfo, logError, Component } from '../core/logger';

export interface KeyboardShortcut {
  id: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  category: string;
  enabled: boolean;
}

export interface ShortcutConfig {
  enabled: boolean;
  enableGlobal: boolean;
  preventDefault: boolean;
  showHints: boolean;
}

/**
 * Keyboard shortcuts utility for customizable keyboard shortcuts
 */
export class KeyboardShortcuts {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private config: ShortcutConfig;
  private isListening: boolean = false;
  private eventListeners: Array<() => void> = [];

  constructor(config?: Partial<ShortcutConfig>) {
    this.config = {
      enabled: true,
      enableGlobal: true,
      preventDefault: true,
      showHints: true,
      ...config,
    };

    this.initializeDefaultShortcuts();
  }

  /**
   * Initialize default keyboard shortcuts
   */
  private initializeDefaultShortcuts(): void {
    const defaultShortcuts: KeyboardShortcut[] = [
      {
        id: 'encode-image',
        key: 'e',
        ctrl: true,
        description: 'Encode image with hidden message',
        action: () => this.executeAction('encode-image'),
        category: 'steganography',
        enabled: true,
      },
      {
        id: 'decode-image',
        key: 'd',
        ctrl: true,
        description: 'Decode hidden message from image',
        action: () => this.executeAction('decode-image'),
        category: 'steganography',
        enabled: true,
      },
      {
        id: 'open-file',
        key: 'o',
        ctrl: true,
        description: 'Open image file',
        action: () => this.executeAction('open-file'),
        category: 'file',
        enabled: true,
      },
      {
        id: 'save-file',
        key: 's',
        ctrl: true,
        description: 'Save processed image',
        action: () => this.executeAction('save-file'),
        category: 'file',
        enabled: true,
      },
      {
        id: 'settings',
        key: ',',
        ctrl: true,
        description: 'Open settings',
        action: () => this.executeAction('open-settings'),
        category: 'navigation',
        enabled: true,
      },
      {
        id: 'help',
        key: 'F1',
        description: 'Show help',
        action: () => this.executeAction('show-help'),
        category: 'navigation',
        enabled: true,
      },
      {
        id: 'zoom-in',
        key: '=',
        ctrl: true,
        description: 'Zoom in',
        action: () => this.executeAction('zoom-in'),
        category: 'view',
        enabled: true,
      },
      {
        id: 'zoom-out',
        key: '-',
        ctrl: true,
        description: 'Zoom out',
        action: () => this.executeAction('zoom-out'),
        category: 'view',
        enabled: true,
      },
      {
        id: 'reset-zoom',
        key: '0',
        ctrl: true,
        description: 'Reset zoom',
        action: () => this.executeAction('reset-zoom'),
        category: 'view',
        enabled: true,
      },
      {
        id: 'undo',
        key: 'z',
        ctrl: true,
        description: 'Undo last action',
        action: () => this.executeAction('undo'),
        category: 'edit',
        enabled: true,
      },
      {
        id: 'redo',
        key: 'y',
        ctrl: true,
        description: 'Redo last action',
        action: () => this.executeAction('redo'),
        category: 'edit',
        enabled: true,
      },
    ];

    defaultShortcuts.forEach(shortcut => {
      this.shortcuts.set(shortcut.id, shortcut);
    });
  }

  /**
   * Start listening for keyboard events
   */
  startListening(): void {
    if (Platform.OS !== 'web' || this.isListening || !this.config.enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      this.handleKeyEvent(event);
    };

    const target = this.config.enableGlobal ? document : document.activeElement;
    target?.addEventListener('keydown', handleKeyDown);
    
    this.eventListeners.push(() => {
      target?.removeEventListener('keydown', handleKeyDown);
    });

    this.isListening = true;
    
    logInfo(Component.UI, 'Keyboard shortcuts listening started', {
      global: this.config.enableGlobal,
    });
  }

  /**
   * Stop listening for keyboard events
   */
  stopListening(): void {
    if (!this.isListening) {
      return;
    }

    this.eventListeners.forEach(cleanup => cleanup());
    this.eventListeners = [];
    this.isListening = false;
    
    logInfo(Component.UI, 'Keyboard shortcuts listening stopped', {});
  }

  /**
   * Handle keyboard event
   */
  private handleKeyEvent(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;
    const alt = event.altKey;

    // Find matching shortcut
    const shortcut = this.findMatchingShortcut(key, ctrl, shift, alt);
    
    if (shortcut && shortcut.enabled) {
      if (this.config.preventDefault) {
        event.preventDefault();
      }

      try {
        shortcut.action();
        
        logInfo(Component.UI, 'Keyboard shortcut executed', {
          shortcutId: shortcut.id,
          key: key,
          ctrl,
          shift,
          alt,
        });
      } catch (error) {
        logError(Component.UI, 'Keyboard shortcut execution failed', {
          shortcutId: shortcut.id,
          error,
        });
      }
    }
  }

  /**
   * Find matching shortcut
   */
  private findMatchingShortcut(
    key: string,
    ctrl: boolean,
    shift: boolean,
    alt: boolean
  ): KeyboardShortcut | null {
    for (const shortcut of this.shortcuts.values()) {
      if (
        shortcut.key.toLowerCase() === key &&
        shortcut.ctrl === ctrl &&
        shortcut.shift === shift &&
        shortcut.alt === alt &&
        shortcut.enabled
      ) {
        return shortcut;
      }
    }
    return null;
  }

  /**
   * Add custom shortcut
   */
  addShortcut(shortcut: KeyboardShortcut): void {
    this.shortcuts.set(shortcut.id, shortcut);
    
    logInfo(Component.UI, 'Custom shortcut added', {
      shortcutId: shortcut.id,
      key: shortcut.key,
      category: shortcut.category,
    });
  }

  /**
   * Remove shortcut
   */
  removeShortcut(shortcutId: string): boolean {
    const removed = this.shortcuts.delete(shortcutId);
    
    if (removed) {
      logInfo(Component.UI, 'Shortcut removed', { shortcutId });
    }
    
    return removed;
  }

  /**
   * Enable/disable shortcut
   */
  setShortcutEnabled(shortcutId: string, enabled: boolean): boolean {
    const shortcut = this.shortcuts.get(shortcutId);
    if (shortcut) {
      shortcut.enabled = enabled;
      
      logInfo(Component.UI, 'Shortcut enabled/disabled', {
        shortcutId,
        enabled,
      });
      
      return true;
    }
    return false;
  }

  /**
   * Get all shortcuts
   */
  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get shortcuts by category
   */
  getShortcutsByCategory(category: string): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
      .filter(shortcut => shortcut.category === category)
      .sort((a, b) => a.description.localeCompare(b.description));
  }

  /**
   * Get shortcut categories
   */
  getCategories(): string[] {
    const categories = new Set(Array.from(this.shortcuts.values()).map(s => s.category));
    return Array.from(categories).sort();
  }

  /**
   * Check for shortcut conflicts
   */
  checkConflicts(newShortcut: Omit<KeyboardShortcut, 'id'>): KeyboardShortcut[] {
    const conflicts: KeyboardShortcut[] = [];
    
    for (const shortcut of this.shortcuts.values()) {
      if (
        shortcut.key.toLowerCase() === newShortcut.key.toLowerCase() &&
        shortcut.ctrl === newShortcut.ctrl &&
        shortcut.shift === newShortcut.shift &&
        shortcut.alt === newShortcut.alt
      ) {
        conflicts.push(shortcut);
      }
    }
    
    return conflicts;
  }

  /**
   * Generate shortcut hint text
   */
  getShortcutHint(shortcutId: string): string {
    const shortcut = this.shortcuts.get(shortcutId);
    if (!shortcut) return '';

    const parts: string[] = [];
    
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.meta) parts.push('Cmd');
    
    parts.push(shortcut.key.toUpperCase());
    
    return parts.join('+');
  }

  /**
   * Execute action (placeholder for actual implementation)
   */
  private executeAction(action: string): void {
    // This would be implemented to actually perform the actions
    logInfo(Component.UI, 'Shortcut action executed', { action });
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ShortcutConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.enabled && !this.isListening) {
      this.startListening();
    } else if (!this.config.enabled && this.isListening) {
      this.stopListening();
    }
    
    logInfo(Component.UI, 'Keyboard shortcuts config updated', {
      config: this.config,
    });
  }

  /**
   * Export shortcuts configuration
   */
  exportConfig(): string {
    const config = {
      shortcuts: Array.from(this.shortcuts.values()),
      config: this.config,
    };
    
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import shortcuts configuration
   */
  importConfig(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson);
      
      if (config.shortcuts) {
        this.shortcuts.clear();
        config.shortcuts.forEach((shortcut: KeyboardShortcut) => {
          this.shortcuts.set(shortcut.id, shortcut);
        });
      }
      
      if (config.config) {
        this.updateConfig(config.config);
      }
      
      logInfo(Component.UI, 'Shortcuts configuration imported', {
        shortcutsCount: this.shortcuts.size,
      });
      
      return true;
    } catch (error) {
      logError(Component.UI, 'Shortcuts configuration import failed', { error });
      return false;
    }
  }
}

// Export singleton instance
export const keyboardShortcuts = new KeyboardShortcuts(); 