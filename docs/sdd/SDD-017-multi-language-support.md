# SDD-017: Multi-Language Support (i18n)

**Status:** Implemented
**Feature:** F13.4
**Phase:** 13 (Accessibility & Inclusion)
**Last Updated:** 2026-02-15

---

## 1. Overview

Adds internationalization (i18n) support to ChoreChamp with 10 languages, including right-to-left (RTL) layout for Arabic. The system uses a lightweight custom React context provider with type-safe translation keys, interpolation, and locale-aware date/number formatting.

## 2. Supported Languages

| Code | Language | Direction | Coverage |
|------|----------|-----------|----------|
| `en` | English | LTR | Full (source) |
| `es` | Spanish | LTR | Full |
| `fr` | French | LTR | Full |
| `de` | German | LTR | Full |
| `pt` | Portuguese | LTR | Full |
| `it` | Italian | LTR | Full |
| `ja` | Japanese | LTR | Full |
| `ko` | Korean | LTR | Full |
| `zh` | Chinese (Simplified) | LTR | Full |
| `ar` | Arabic | RTL | Full |

## 3. Architecture

### 3.1 Type-Safe Translation Keys

All translations implement the `TranslationKeys` interface defined in `types.ts`. This provides compile-time checking that every translation file has exactly the same keys as English. The `TranslationKey` type enables autocomplete when calling `t()`.

### 3.2 I18nProvider

The `I18nProvider` React context exposes:
- `locale` - current language code
- `isRtl` - whether the current language is RTL
- `setLocale(locale)` - change language (persisted to localStorage)
- `t(key, params?)` - translate with optional interpolation
- `formatNumber(value)` - locale-aware number formatting
- `formatDate(date, style?)` - locale-aware date formatting

### 3.3 Interpolation

Translation strings can contain `{{param}}` placeholders that are replaced at runtime:
```typescript
t('gamification.streak_days', { count: 7 }) // "7 day streak"
```

### 3.4 Fallback Chain

If a key is missing from the current locale, the system falls back to English. If the key is also missing from English, the raw key string is returned.

### 3.5 RTL Support

When an RTL language is selected, the provider sets `dir="rtl"` on `<html>`. CSS rules in `index.css` handle layout flipping for skip links, step indicators, and other directional elements.

## 4. Files

| File | Purpose |
|------|---------|
| `apps/web/src/lib/i18n/types.ts` | Locale constants, TranslationKeys interface |
| `apps/web/src/lib/i18n/I18nProvider.tsx` | Context provider with t(), formatNumber, formatDate |
| `apps/web/src/lib/i18n/index.ts` | Barrel export |
| `apps/web/src/lib/i18n/translations/*.ts` | 10 translation files |
| `apps/web/src/components/settings/LanguageSection.tsx` | Language picker UI |

## 5. Locale Detection

On first load, the system detects the browser's language preference via `navigator.language`. If it matches a supported locale, that locale is used. Otherwise, English is the default. Once a user explicitly selects a language, it is saved to localStorage and used on subsequent visits.

## 6. Testing

42 unit tests validate:
- All 10 locales are configured with display names
- Arabic is correctly marked as RTL
- Every translation file has identical keys to English
- No translation values are empty strings
- Interpolation placeholders are preserved across all locales
- All translation categories (nav, action, chores, errors) are covered

## 7. Future Enhancements

- Lazy-load translation files per locale to reduce bundle size
- Crowdsourced translation contributions via Weblate or Crowdin
- Server-side locale detection from Accept-Language header
- Pluralization rules per locale (ICU MessageFormat)
- Additional languages (Hindi, Turkish, Vietnamese, Thai)
