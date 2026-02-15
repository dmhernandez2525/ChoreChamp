# SDD-014: Screen Reader & Assistive Technology

**Status:** Implemented (Phase 13.1)
**Priority:** P1
**Last Updated:** 2026-02-15

---

## 1. Overview

### 1.1 Purpose

Provide an accessibility foundation for ChoreChamp across web and mobile by improving screen reader output, keyboard navigation, focus behavior, motion sensitivity support, and contrast controls.

### 1.2 Scope

- Global web live region announcements
- Skip navigation link and route focus management
- High contrast mode and reduced motion controls
- Landmark and navigation labeling improvements
- VoiceOver/TalkBack labels and action hints for core mobile navigation/chore interactions
- Accessibility settings in the web settings screen
- Screen reader testing documentation and checklist

### 1.3 Out of Scope

- Full cognitive simplification flows (Phase 13.3)
- Dyslexia typography and spacing system (Phase 13.2)
- Full localization rollout (Phase 13.4)

---

## 2. Web Implementation

### 2.1 Accessibility Provider

- Added `AccessibilityProvider` with:
  - persistent high contrast preference
  - persistent reduced motion preference
  - shared `announce()` API for live region output
- Provider updates root attributes:
  - `data-high-contrast`
  - `data-reduced-motion`

### 2.2 App Shell Enhancements

- Added keyboard-first skip link (`Skip to main content`).
- Route changes now:
  - focus primary heading for keyboard/screen reader continuity
  - announce page context via live region
- Bottom mobile navigation received explicit ARIA labels and expanded state metadata.

### 2.3 Accessibility Styling

- Added strong `:focus-visible` ring behavior.
- Added high contrast palette targeting AAA-oriented contrast values.
- Added reduced-motion behavior for both system preference and explicit app setting.

### 2.4 Settings Surface

- Added Accessibility settings tab with toggles for:
  - High Contrast Mode
  - Reduced Motion
- Toggle changes announce state updates for screen readers.

---

## 3. Mobile Implementation

### 3.1 Navigation Labels

- Added explicit tab accessibility labels/hints for VoiceOver/TalkBack in `MainNavigator`.
- Hidden decorative tab icon containers from accessibility tree to avoid duplicate narration.

### 3.2 Chore List Interactions

- Added rich accessibility labels/hints for chore rows.
- Added custom accessibility actions:
  - `activate` (open details)
  - `complete` (complete chore)
- Added labels for filter buttons, search input, clear control, and swipe completion action.

---

## 4. Testing Strategy

### 4.1 Documentation

- Added `docs/accessibility/SCREEN_READER_TESTING.md` with explicit web/mobile testing checklist.

### 4.2 Validation Commands

- `../../node_modules/.bin/tsc --noEmit` in:
  - `apps/web`
  - `apps/mobile`

---

## 5. Risks and Follow-ups

### 5.1 Current Risks

- Some legacy pages still rely on visual-only cues and need incremental labeling improvements.
- Voice control phrase quality depends on consistency of control naming across all screens.

### 5.2 Recommended Next Enhancements

- Expand live-region announcements to more async workflows (reports, imports, approvals).
- Add automated accessibility audits in CI (axe-based checks for web).
- Continue phase sequence with dyslexia and cognitive accessibility modules.
