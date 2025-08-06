/**
 * Accessibility System
 * WCAG 2.1 AA compliance and accessibility features
 */

import { Platform } from 'react-native';

export interface AccessibilityConfig {
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  hapticFeedback: boolean;
  soundEffects: boolean;
  colorBlindness: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  focusIndicators: boolean;
  keyboardNavigation: boolean;
  voiceControl: boolean;
}

export interface AccessibilityFeatures {
  isScreenReaderActive: boolean;
  isReduceMotionEnabled: boolean;
  isHighContrastEnabled: boolean;
  isLargeTextEnabled: boolean;
  isHapticFeedbackEnabled: boolean;
  isSoundEffectsEnabled: boolean;
  colorBlindnessType: string;
  focusVisible: boolean;
  keyboardAccessible: boolean;
  voiceControlEnabled: boolean;
}

export interface AccessibilityAction {
  name: string;
  label: string;
  hint?: string;
  role?: string;
  disabled?: boolean;
}

export interface AccessibilityProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityActions?: AccessibilityAction[];
  accessibilityLiveRegion?: 'polite' | 'assertive' | 'off';
  accessibilityViewIsModal?: boolean;
  accessibilityElementsHidden?: boolean;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  testID?: string;
}

class AccessibilityManager {
  private config: AccessibilityConfig;
  private features: AccessibilityFeatures;

  constructor() {
    this.config = {
      reduceMotion: false,
      highContrast: false,
      largeText: false,
      screenReader: false,
      hapticFeedback: true,
      soundEffects: true,
      colorBlindness: 'none',
      focusIndicators: true,
      keyboardNavigation: true,
      voiceControl: false,
    };

    this.features = this.detectAccessibilityFeatures();
    this.initializeAccessibility();
  }

  /**
   * Detect system accessibility features
   */
  private detectAccessibilityFeatures(): AccessibilityFeatures {
    const features: AccessibilityFeatures = {
      isScreenReaderActive: false,
      isReduceMotionEnabled: false,
      isHighContrastEnabled: false,
      isLargeTextEnabled: false,
      isHapticFeedbackEnabled: true,
      isSoundEffectsEnabled: true,
      colorBlindnessType: 'none',
      focusVisible: true,
      keyboardAccessible: true,
      voiceControlEnabled: false,
    };

    if (Platform.OS === 'web') {
      // Web accessibility detection
      features.isScreenReaderActive = this.detectScreenReader();
      features.isReduceMotionEnabled = this.detectReduceMotion();
      features.isHighContrastEnabled = this.detectHighContrast();
      features.isLargeTextEnabled = this.detectLargeText();
      features.colorBlindnessType = this.detectColorBlindness();
    } else {
      // Native accessibility detection
      features.isScreenReaderActive = this.detectNativeScreenReader();
      features.isReduceMotionEnabled = this.detectNativeReduceMotion();
      features.isHighContrastEnabled = this.detectNativeHighContrast();
      features.isLargeTextEnabled = this.detectNativeLargeText();
    }

    return features;
  }

  /**
   * Initialize accessibility features
   */
  private initializeAccessibility(): void {
    // Apply accessibility configurations
    this.applyAccessibilityConfig();
    
    // Set up event listeners
    this.setupAccessibilityListeners();
    
    // Initialize focus management
    this.initializeFocusManagement();
  }

  /**
   * Apply accessibility configuration
   */
  private applyAccessibilityConfig(): void {
    if (Platform.OS === 'web') {
      // Apply CSS custom properties for accessibility
      const root = document.documentElement;
      
      if (this.config.reduceMotion) {
        root.style.setProperty('--reduce-motion', '1');
      }
      
      if (this.config.highContrast) {
        root.style.setProperty('--high-contrast', '1');
      }
      
      if (this.config.largeText) {
        root.style.setProperty('--large-text', '1');
      }
      
      if (this.config.colorBlindness !== 'none') {
        root.style.setProperty('--color-blindness', this.config.colorBlindness);
      }
    }
  }

  /**
   * Set up accessibility event listeners
   */
  private setupAccessibilityListeners(): void {
    if (Platform.OS === 'web') {
      // Listen for system accessibility changes
      window.addEventListener('focusin', this.handleFocusIn.bind(this));
      window.addEventListener('focusout', this.handleFocusOut.bind(this));
      
      // Listen for keyboard navigation
      document.addEventListener('keydown', this.handleKeyDown.bind(this));
      
      // Listen for screen reader announcements
      this.setupLiveRegion();
    }
  }

  /**
   * Initialize focus management
   */
  private initializeFocusManagement(): void {
    if (Platform.OS === 'web') {
      // Create focus trap for modals
      this.createFocusTrap();
      
      // Set up skip links
      this.createSkipLinks();
      
      // Initialize focus indicators
      this.initializeFocusIndicators();
    }
  }

  /**
   * Detect screen reader on web
   */
  private detectScreenReader(): boolean {
    if (Platform.OS !== 'web') return false;
    
    // Check for common screen reader indicators
    const indicators = [
      'speechSynthesis' in window,
      'webkitSpeechSynthesis' in window,
      navigator.userAgent.includes('NVDA'),
      navigator.userAgent.includes('JAWS'),
      navigator.userAgent.includes('VoiceOver'),
      navigator.userAgent.includes('TalkBack'),
    ];
    
    return indicators.some(Boolean);
  }

  /**
   * Detect reduce motion preference
   */
  private detectReduceMotion(): boolean {
    if (Platform.OS !== 'web') return false;
    
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Detect high contrast preference
   */
  private detectHighContrast(): boolean {
    if (Platform.OS !== 'web') return false;
    
    return window.matchMedia('(prefers-contrast: high)').matches;
  }

  /**
   * Detect large text preference
   */
  private detectLargeText(): boolean {
    if (Platform.OS !== 'web') return false;
    
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Detect color blindness
   */
  private detectColorBlindness(): string {
    if (Platform.OS !== 'web') return 'none';
    
    // This would require user input or specialized testing
    // For now, return 'none' as default
    return 'none';
  }

  /**
   * Detect native screen reader
   */
  private detectNativeScreenReader(): boolean {
    // This would use platform-specific APIs
    // For now, return false as default
    return false;
  }

  /**
   * Detect native reduce motion
   */
  private detectNativeReduceMotion(): boolean {
    // This would use platform-specific APIs
    // For now, return false as default
    return false;
  }

  /**
   * Detect native high contrast
   */
  private detectNativeHighContrast(): boolean {
    // This would use platform-specific APIs
    // For now, return false as default
    return false;
  }

  /**
   * Detect native large text
   */
  private detectNativeLargeText(): boolean {
    // This would use platform-specific APIs
    // For now, return false as default
    return false;
  }

  /**
   * Handle focus in events
   */
  private handleFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    
    // Add focus indicator
    if (this.config.focusIndicators) {
      target.classList.add('focus-visible');
    }
    
    // Announce focus to screen reader
    if (this.features.isScreenReaderActive) {
      this.announceToScreenReader(target.getAttribute('aria-label') || target.textContent || '');
    }
  }

  /**
   * Handle focus out events
   */
  private handleFocusOut(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    
    // Remove focus indicator
    target.classList.remove('focus-visible');
  }

  /**
   * Handle keyboard navigation
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // Handle keyboard shortcuts
    switch (event.key) {
      case 'Tab':
        this.handleTabNavigation(event);
        break;
      case 'Escape':
        this.handleEscapeKey(event);
        break;
      case 'Enter':
      case ' ':
        this.handleActivationKey(event);
        break;
    }
  }

  /**
   * Handle tab navigation
   */
  private handleTabNavigation(event: KeyboardEvent): void {
    // Ensure proper tab order
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    if (event.shiftKey) {
      // Shift+Tab: move backward
      const previousIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
      focusableElements[previousIndex]?.focus();
    } else {
      // Tab: move forward
      const nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
      focusableElements[nextIndex]?.focus();
    }
  }

  /**
   * Handle escape key
   */
  private handleEscapeKey(event: KeyboardEvent): void {
    // Close modals, dropdowns, etc.
    const modals = document.querySelectorAll('[role="dialog"]');
    const openModal = Array.from(modals).find(modal => 
      modal.getAttribute('aria-hidden') !== 'true'
    );
    
    if (openModal) {
      const closeButton = openModal.querySelector('[aria-label*="close" i]') as HTMLElement;
      closeButton?.click();
    }
  }

  /**
   * Handle activation keys
   */
  private handleActivationKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    
    // Prevent default for space key
    if (event.key === ' ') {
      event.preventDefault();
    }
    
    // Trigger click if element is focusable
    if (target.click) {
      target.click();
    }
  }

  /**
   * Get all focusable elements
   */
  private getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ];
    
    return Array.from(document.querySelectorAll(focusableSelectors.join(', '))) as HTMLElement[];
  }

  /**
   * Set up live region for announcements
   */
  private setupLiveRegion(): void {
    if (Platform.OS !== 'web') return;
    
    // Create live region if it doesn't exist
    let liveRegion = document.getElementById('accessibility-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'accessibility-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }
  }

  /**
   * Announce message to screen reader
   */
  announceToScreenReader(message: string): void {
    if (Platform.OS !== 'web') return;
    
    const liveRegion = document.getElementById('accessibility-live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  /**
   * Create focus trap for modals
   */
  private createFocusTrap(): void {
    // This would implement focus trapping for modal dialogs
    // For now, it's a placeholder
  }

  /**
   * Create skip links
   */
  private createSkipLinks(): void {
    if (Platform.OS !== 'web') return;
    
    const skipLinks = [
      { href: '#main-content', text: 'Skip to main content' },
      { href: '#navigation', text: 'Skip to navigation' },
      { href: '#footer', text: 'Skip to footer' },
    ];
    
    skipLinks.forEach(link => {
      const skipLink = document.createElement('a');
      skipLink.href = link.href;
      skipLink.textContent = link.text;
      skipLink.className = 'skip-link';
      skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        z-index: 1000;
        transition: top 0.3s;
      `;
      
      skipLink.addEventListener('focus', () => {
        skipLink.style.top = '6px';
      });
      
      skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
      });
      
      document.body.appendChild(skipLink);
    });
  }

  /**
   * Initialize focus indicators
   */
  private initializeFocusIndicators(): void {
    if (Platform.OS !== 'web') return;
    
    // Add CSS for focus indicators
    const style = document.createElement('style');
    style.textContent = `
      .focus-visible {
        outline: 2px solid #007AFF !important;
        outline-offset: 2px !important;
      }
      
      .focus-visible:focus {
        outline: none !important;
      }
      
      /* High contrast mode */
      [data-high-contrast="true"] .focus-visible {
        outline: 3px solid #000 !important;
        outline-offset: 1px !important;
      }
      
      /* Reduce motion */
      [data-reduce-motion="true"] * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
      
      /* Large text */
      [data-large-text="true"] {
        font-size: 1.2em !important;
      }
      
      /* Color blindness support */
      [data-color-blindness="protanopia"] {
        filter: url('#protanopia-filter') !important;
      }
      
      [data-color-blindness="deuteranopia"] {
        filter: url('#deuteranopia-filter') !important;
      }
      
      [data-color-blindness="tritanopia"] {
        filter: url('#tritanopia-filter') !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Update accessibility configuration
   */
  updateConfig(newConfig: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.applyAccessibilityConfig();
  }

  /**
   * Get current accessibility features
   */
  getFeatures(): AccessibilityFeatures {
    return { ...this.features };
  }

  /**
   * Get accessibility props for React Native components
   */
  getAccessibilityProps(props: Partial<AccessibilityProps>): AccessibilityProps {
    return {
      accessible: true,
      accessibilityRole: 'button',
      accessibilityState: { disabled: false },
      ...props,
    };
  }

  /**
   * Provide haptic feedback
   */
  provideHapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'): void {
    if (!this.config.hapticFeedback) return;
    
    // This would use platform-specific haptic feedback
    // For now, it's a placeholder
    console.log(`Haptic feedback: ${type}`);
  }

  /**
   * Play sound effect
   */
  playSoundEffect(type: 'success' | 'error' | 'warning' | 'click'): void {
    if (!this.config.soundEffects) return;
    
    // This would play platform-specific sound effects
    // For now, it's a placeholder
    console.log(`Sound effect: ${type}`);
  }
}

// Global accessibility manager instance
export const accessibilityManager = new AccessibilityManager();

export default AccessibilityManager; 