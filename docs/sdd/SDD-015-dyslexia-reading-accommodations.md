# SDD-015: Dyslexia & Reading Accommodations

**Status:** Implemented
**Feature:** F13.2
**Phase:** 13 (Accessibility & Inclusion)
**Last Updated:** 2026-02-15

---

## 1. Overview

This feature delivers a comprehensive suite of reading accommodations designed for users with dyslexia, low vision, or other reading difficulties. It builds on the accessibility foundation established in F13.1 (Screen Reader & Assistive Technology) by adding fine-grained control over typography, color overlays, reading aids, and text-to-speech.

## 2. Goals

- Provide dyslexia-friendly font options (OpenDyslexic, Lexie Readable)
- Allow users to adjust font size, line spacing, letter spacing, and word spacing independently
- Offer tinted color overlays that reduce visual stress (Irlen Syndrome accommodation)
- Include a reading ruler that follows the cursor for line tracking
- Support bionic reading mode for faster text scanning
- Provide text-to-speech for any page via the Web Speech API
- Enable reading preference profiles for quick switching between configurations
- Offer a simplified language toggle for plainer, shorter text alternatives

## 3. Architecture

### 3.1 Client-Side Only

All reading accommodations are implemented entirely on the client side. No backend changes are needed because preferences are stored in `localStorage` and applied via CSS custom properties and `data-*` attributes on `<html>`.

### 3.2 State Management

The `AccessibilityProvider` React context manages all reading preferences alongside the existing high-contrast and reduced-motion toggles. Each preference is an individual `useState` hook with a setter exposed through context.

### 3.3 CSS Integration

Reading styles are applied through a combination of:

| Mechanism | Purpose |
|-----------|---------|
| `data-reading-font` attribute | Font family switching via CSS selectors |
| `--reading-font-scale` custom property | `calc(1rem * var(...))` on body font-size |
| `--reading-line-height` custom property | Applied to body line-height |
| `--reading-letter-spacing` custom property | Applied to body letter-spacing |
| `--reading-word-spacing` custom property | Applied to body word-spacing |
| `--reading-overlay-color` custom property | Used by `::after` pseudo-element on `<html>` |
| `--reading-ruler-y` custom property | Positions the `::before` ruler band |
| `data-bionic-reading` attribute | Applies selective bold styling |
| `data-icon-heavy-navigation` attribute | Enlarges nav icons and labels |

### 3.4 Text-to-Speech

Uses the browser's native `SpeechSynthesis` API. The provider exposes three methods:

- `speakText(text)` - reads arbitrary text
- `speakPage(selector?)` - reads `innerText` from a DOM element (defaults to `<main>`)
- `stopSpeaking()` - cancels speech

A floating TTS button is rendered in `AppShell` on desktop viewports.

### 3.5 Reading Profiles

Users can save named snapshots of all reading preferences and restore them later. Profiles are serialized to `localStorage` alongside other preferences.

## 4. Components

| Component | File | Role |
|-----------|------|------|
| AccessibilityProvider | `apps/web/src/components/accessibility/AccessibilityProvider.tsx` | Context with all reading state, TTS, profiles |
| AccessibilitySection | `apps/web/src/components/settings/AccessibilitySection.tsx` | Full settings UI with font picker, sliders, overlays, profiles |
| AppShell | `apps/web/src/components/app/AppShell.tsx` | Floating TTS button |
| index.css | `apps/web/src/index.css` | Font faces, overlay, ruler, bionic reading, icon-heavy nav CSS |

## 5. Reading Font Options

| Key | Font Family | Notes |
|-----|-------------|-------|
| `default` | System sans-serif | No change |
| `open-dyslexic` | OpenDyslexic | Weighted bottoms prevent letter rotation |
| `lexie-readable` | Lexend (as Lexie Readable substitute) | Variable font optimized for reading fluency |

Fonts are loaded from CDN with `font-display: swap` to prevent FOIT.

## 6. Color Overlay Presets

| Key | Color | Opacity |
|-----|-------|---------|
| `none` | Transparent | 0% |
| `warm-cream` | #fff4d6 | 35% |
| `soft-peach` | #ffe6d6 | 35% |
| `mint` | #dcffea | 30% |
| `sky` | #ddf0ff | 30% |
| `lavender` | #ede6ff | 32% |
| `rose` | #ffe6ee | 30% |
| `sand` | #f4ead4 | 32% |
| `cool-gray` | #ebeef3 | 36% |

Overlays use `mix-blend-mode: multiply` and `pointer-events: none` so they do not interfere with interaction.

## 7. Accessibility Compliance

- All controls have proper ARIA labels and roles
- Color overlay swatch picker uses `role="radiogroup"` with `role="radio"` items
- Range sliders have `aria-valuemin`, `aria-valuemax`, `aria-valuenow`
- Screen reader announcements fire on every preference change
- Reading ruler and overlay do not capture pointer events
- TTS provides spoken feedback when starting and stopping

## 8. Persistence

All preferences (including profiles) persist in `localStorage` under the key `cc_accessibility_preferences`. The provider reads stored values on mount and writes on every change.

## 9. Testing

Unit tests validate:
- All constant arrays have correct values and lengths
- Overlay colors cover warm and cool tones
- Spacing levels are sequential
- Font options include dyslexia-friendly choices
- Line spacing covers WCAG recommended range (1.5x minimum)

## 10. Future Enhancements

- Server-side profile sync for cross-device persistence
- Per-language TTS voice selection
- Reading speed control for TTS
- Syllable highlighting during TTS playback
- Custom color overlay with hex picker
