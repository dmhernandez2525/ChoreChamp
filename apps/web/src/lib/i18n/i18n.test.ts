import { describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES, RTL_LOCALES, LOCALE_NAMES, LOCALE_NATIVE_NAMES } from './types';
import { en } from './translations/en';
import { es } from './translations/es';
import { fr } from './translations/fr';
import { de } from './translations/de';
import { pt } from './translations/pt';
import { it as itTranslation } from './translations/it';
import { ja } from './translations/ja';
import { ko } from './translations/ko';
import { zh } from './translations/zh';
import { ar } from './translations/ar';

const ALL_TRANSLATIONS = { en, es, fr, de, pt, it: itTranslation, ja, ko, zh, ar };
const EN_KEYS = Object.keys(en) as (keyof typeof en)[];

describe('i18n configuration', () => {
  it('supports 10 locales', () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
  });

  it('includes English as first locale', () => {
    expect(SUPPORTED_LOCALES[0]).toBe('en');
  });

  it('has display names for all locales', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(LOCALE_NAMES[locale]).toBeTruthy();
      expect(LOCALE_NATIVE_NAMES[locale]).toBeTruthy();
    }
  });

  it('marks Arabic as RTL', () => {
    expect(RTL_LOCALES).toContain('ar');
  });

  it('does not mark non-RTL languages as RTL', () => {
    const ltrLanguages = ['en', 'es', 'fr', 'de', 'pt', 'it', 'ja', 'ko', 'zh'] as const;
    for (const lang of ltrLanguages) {
      expect(RTL_LOCALES).not.toContain(lang);
    }
  });
});

describe('translation completeness', () => {
  it('English has all required keys', () => {
    expect(EN_KEYS.length).toBeGreaterThanOrEqual(70);
  });

  for (const [locale, translations] of Object.entries(ALL_TRANSLATIONS)) {
    it(`${locale} has all keys from English`, () => {
      const translationKeys = Object.keys(translations);
      for (const key of EN_KEYS) {
        expect(translationKeys).toContain(key);
      }
    });

    it(`${locale} has no extra keys beyond English`, () => {
      const translationKeys = Object.keys(translations);
      for (const key of translationKeys) {
        expect(EN_KEYS).toContain(key);
      }
    });

    it(`${locale} has no empty string values`, () => {
      for (const [key, value] of Object.entries(translations)) {
        expect(value.trim().length, `${locale}.${key} is empty`).toBeGreaterThan(0);
      }
    });
  }
});

describe('interpolation placeholders', () => {
  it('streak_days contains {{count}} placeholder in all locales', () => {
    for (const [locale, translations] of Object.entries(ALL_TRANSLATIONS)) {
      expect(
        translations['gamification.streak_days'],
        `${locale} gamification.streak_days missing {{count}}`
      ).toContain('{{count}}');
    }
  });

  it('days_ago contains {{count}} placeholder in all locales', () => {
    for (const [locale, translations] of Object.entries(ALL_TRANSLATIONS)) {
      expect(
        translations['time.days_ago'],
        `${locale} time.days_ago missing {{count}}`
      ).toContain('{{count}}');
    }
  });
});

describe('translation categories', () => {
  it('covers navigation keys', () => {
    const navKeys = EN_KEYS.filter((k) => k.startsWith('nav.'));
    expect(navKeys.length).toBeGreaterThanOrEqual(8);
  });

  it('covers action keys', () => {
    const actionKeys = EN_KEYS.filter((k) => k.startsWith('action.'));
    expect(actionKeys.length).toBeGreaterThanOrEqual(10);
  });

  it('covers chore keys', () => {
    const choreKeys = EN_KEYS.filter((k) => k.startsWith('chores.'));
    expect(choreKeys.length).toBeGreaterThanOrEqual(8);
  });

  it('covers error and empty state keys', () => {
    const errorKeys = EN_KEYS.filter((k) => k.startsWith('error.'));
    const emptyKeys = EN_KEYS.filter((k) => k.startsWith('empty.'));
    expect(errorKeys.length).toBeGreaterThanOrEqual(3);
    expect(emptyKeys.length).toBeGreaterThanOrEqual(2);
  });
});
