import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { SupportedLocale, TranslationKey, TranslationKeys } from './types';
import { SUPPORTED_LOCALES, RTL_LOCALES } from './types';
import { en } from './translations/en';
import { es } from './translations/es';
import { fr } from './translations/fr';
import { de } from './translations/de';
import { pt } from './translations/pt';
import { it } from './translations/it';
import { ja } from './translations/ja';
import { ko } from './translations/ko';
import { zh } from './translations/zh';
import { ar } from './translations/ar';

const TRANSLATIONS: Record<SupportedLocale, TranslationKeys> = {
  en,
  es,
  fr,
  de,
  pt,
  it,
  ja,
  ko,
  zh,
  ar,
};

const STORAGE_KEY = 'cc_locale';

interface I18nContextValue {
  locale: SupportedLocale;
  isRtl: boolean;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  formatNumber: (value: number) => string;
  formatDate: (date: Date | string, style?: 'short' | 'medium' | 'long') => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function detectBrowserLocale(): SupportedLocale {
  if (typeof navigator === 'undefined') return 'en';
  const browserLang = navigator.language?.slice(0, 2)?.toLowerCase();
  if (browserLang && SUPPORTED_LOCALES.includes(browserLang as SupportedLocale)) {
    return browserLang as SupportedLocale;
  }
  return 'en';
}

function loadStoredLocale(): SupportedLocale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
      return stored as SupportedLocale;
    }
  } catch {
    // Ignore storage errors
  }
  return detectBrowserLocale();
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(loadStoredLocale);

  const isRtl = RTL_LOCALES.includes(locale);

  const setLocale = useCallback((next: SupportedLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', locale);
    root.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  }, [locale, isRtl]);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      const translations = TRANSLATIONS[locale] ?? TRANSLATIONS.en;
      let text = translations[key] ?? TRANSLATIONS.en[key] ?? key;

      if (params) {
        for (const [param, value] of Object.entries(params)) {
          text = text.replace(new RegExp(`\\{\\{${param}\\}\\}`, 'g'), String(value));
        }
      }

      return text;
    },
    [locale]
  );

  const formatNumber = useCallback(
    (value: number) => {
      try {
        return new Intl.NumberFormat(locale).format(value);
      } catch {
        return String(value);
      }
    },
    [locale]
  );

  const formatDate = useCallback(
    (date: Date | string, style: 'short' | 'medium' | 'long' = 'medium') => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const options: Intl.DateTimeFormatOptions =
        style === 'short'
          ? { month: 'numeric', day: 'numeric' }
          : style === 'long'
            ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
            : { year: 'numeric', month: 'short', day: 'numeric' };
      try {
        return new Intl.DateTimeFormat(locale, options).format(dateObj);
      } catch {
        return dateObj.toLocaleDateString();
      }
    },
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, isRtl, setLocale, t, formatNumber, formatDate }),
    [locale, isRtl, setLocale, t, formatNumber, formatDate]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
