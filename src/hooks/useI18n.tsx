/**
 * Internationalization Hook
 * React hook for using i18n functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { i18n, I18nInstance } from '@/core/i18n';

export interface UseI18nReturn {
  t: (key: string, params?: Record<string, any>) => string;
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  getSupportedLocales: () => string[];
  isRTL: () => boolean;
  getLocaleInfo: (locale: string) => any;
  getAllLocaleInfo: () => any;
}

/**
 * Hook for internationalization
 */
export const useI18n = (): UseI18nReturn => {
  const [locale, setLocaleState] = useState(i18n.getLocale());

  useEffect(() => {
    // Subscribe to locale changes
    const unsubscribe = i18n.subscribe(() => {
      setLocaleState(i18n.getLocale());
    });

    return unsubscribe;
  }, []);

  const setLocale = useCallback(async (newLocale: string) => {
    await i18n.setLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  const t = useCallback((key: string, params?: Record<string, any>) => {
    return i18n.t(key, params);
  }, []);

  const getSupportedLocales = useCallback(() => {
    return i18n.getSupportedLocales();
  }, []);

  const isRTL = useCallback(() => {
    return i18n.isRTL();
  }, []);

  const getLocaleInfo = useCallback((locale: string) => {
    return i18n.getLocaleInfo(locale);
  }, []);

  const getAllLocaleInfo = useCallback(() => {
    return i18n.getAllLocaleInfo();
  }, []);

  return {
    t,
    locale,
    setLocale,
    getSupportedLocales,
    isRTL,
    getLocaleInfo,
    getAllLocaleInfo,
  };
};

export default useI18n; 