/**
 * Internationalization Tests
 * Tests for i18n functionality
 */

import { i18n } from '@/core/i18n';

describe('I18n System', () => {
  beforeEach(() => {
    // Reset to default locale
    i18n.setLocale('en');
  });

  describe('Translation', () => {
    it('should translate basic keys', () => {
      expect(i18n.t('common.appName')).toBe('Stegnocchi');
      expect(i18n.t('common.appSubtitle')).toBe('EXIF Steganography');
      expect(i18n.t('common.loading')).toBe('Loading...');
    });

    it('should handle nested keys', () => {
      expect(i18n.t('main.title')).toBe('Hide or Extract Secret Messages');
      expect(i18n.t('main.subtitle')).toBe('Use EXIF steganography to conceal data in images');
    });

    it('should interpolate parameters', () => {
      expect(i18n.t('main.maxFileSize', { size: '50MB' })).toBe('Maximum file size: 50MB');
      expect(i18n.t('message.currentLength', { current: 10, max: 100 })).toBe('10 of 100 characters');
    });

    it('should return key if translation not found', () => {
      expect(i18n.t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('should handle empty parameters', () => {
      expect(i18n.t('common.appName', {})).toBe('Stegnocchi');
    });
  });

  describe('Locale Management', () => {
    it('should get current locale', () => {
      expect(i18n.getLocale()).toBe('en');
    });

    it('should get supported locales', () => {
      const locales = i18n.getSupportedLocales();
      expect(locales).toContain('en');
      expect(locales).toContain('es');
      expect(locales).toContain('fr');
      expect(locales).toContain('de');
    });

    it('should check RTL support', () => {
      expect(i18n.isRTL()).toBe(false);
      
      // Test RTL locale
      i18n.setLocale('ar');
      expect(i18n.isRTL()).toBe(true);
    });

    it('should get locale information', () => {
      const enInfo = i18n.getLocaleInfo('en');
      expect(enInfo.name).toBe('English');
      expect(enInfo.nativeName).toBe('English');
      expect(enInfo.rtl).toBe(false);

      const arInfo = i18n.getLocaleInfo('ar');
      expect(arInfo.name).toBe('Arabic');
      expect(arInfo.nativeName).toBe('العربية');
      expect(arInfo.rtl).toBe(true);
    });

    it('should get all locale information', () => {
      const allLocales = i18n.getAllLocaleInfo();
      expect(allLocales.en).toBeDefined();
      expect(allLocales.es).toBeDefined();
      expect(allLocales.ar).toBeDefined();
    });
  });

  describe('Locale Switching', () => {
    it('should switch to supported locale', async () => {
      await i18n.setLocale('es');
      expect(i18n.getLocale()).toBe('es');
    });

    it('should handle unsupported locale gracefully', async () => {
      const originalLocale = i18n.getLocale();
      await i18n.setLocale('unsupported');
      expect(i18n.getLocale()).toBe(originalLocale);
    });
  });

  describe('Translation Categories', () => {
    it('should have common translations', () => {
      expect(i18n.t('common.appName')).toBe('Stegnocchi');
      expect(i18n.t('common.settings')).toBe('Settings');
      expect(i18n.t('common.help')).toBe('Help');
    });

    it('should have navigation translations', () => {
      expect(i18n.t('navigation.home')).toBe('Home');
      expect(i18n.t('navigation.main')).toBe('Main');
      expect(i18n.t('navigation.settings')).toBe('Settings');
    });

    it('should have main screen translations', () => {
      expect(i18n.t('main.hideMode')).toBe('Hide Message');
      expect(i18n.t('main.extractMode')).toBe('Extract Message');
      expect(i18n.t('main.selectImage')).toBe('Select Image');
    });

    it('should have message translations', () => {
      expect(i18n.t('message.title')).toBe('Secret Message');
      expect(i18n.t('message.password')).toBe('Password');
      expect(i18n.t('message.passwordStrength')).toBe('Password Strength');
    });

    it('should have result translations', () => {
      expect(i18n.t('result.title')).toBe('Operation Result');
      expect(i18n.t('result.success')).toBe('Success!');
      expect(i18n.t('result.error')).toBe('Error');
    });

    it('should have settings translations', () => {
      expect(i18n.t('settings.title')).toBe('Settings');
      expect(i18n.t('settings.general')).toBe('General');
      expect(i18n.t('settings.security')).toBe('Security');
    });

    it('should have error translations', () => {
      expect(i18n.t('errors.general')).toBe('Something went wrong');
      expect(i18n.t('errors.network')).toBe('Network error. Please check your connection.');
      expect(i18n.t('errors.timeout')).toBe('Request timed out. Please try again.');
    });

    it('should have accessibility translations', () => {
      expect(i18n.t('accessibility.hideMessageButton')).toBe('Hide message in image');
      expect(i18n.t('accessibility.extractMessageButton')).toBe('Extract message from image');
      expect(i18n.t('accessibility.selectImageButton')).toBe('Select image from gallery');
    });
  });

  describe('Parameter Interpolation', () => {
    it('should handle single parameter', () => {
      expect(i18n.t('main.maxFileSize', { size: '25MB' })).toBe('Maximum file size: 25MB');
    });

    it('should handle multiple parameters', () => {
      expect(i18n.t('message.currentLength', { current: 50, max: 200 })).toBe('50 of 200 characters');
    });

    it('should handle missing parameters', () => {
      expect(i18n.t('main.maxFileSize', {})).toBe('Maximum file size: {size}');
    });

    it('should handle undefined parameters', () => {
      expect(i18n.t('main.maxFileSize')).toBe('Maximum file size: {size}');
    });

    it('should handle complex parameter names', () => {
      expect(i18n.t('settings.version', { version: '1.0.0' })).toBe('Version 1.0.0');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty key', () => {
      expect(i18n.t('')).toBe('');
    });

    it('should handle key with only dots', () => {
      expect(i18n.t('...')).toBe('...');
    });

    it('should handle very long keys', () => {
      const longKey = 'a'.repeat(1000);
      expect(i18n.t(longKey)).toBe(longKey);
    });

    it('should handle special characters in keys', () => {
      expect(i18n.t('key.with.special.chars')).toBe('key.with.special.chars');
    });
  });
}); 