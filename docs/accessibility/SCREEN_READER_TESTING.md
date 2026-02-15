# Screen Reader & Assistive Tech Testing (F13.1)

**Last Updated:** 2026-02-15

## Scope

This checklist validates VoiceOver (iOS), TalkBack (Android), keyboard-only web navigation, live-region announcements, reduced motion, and high contrast behavior.

## Web Checklist

1. Keyboard-only:
- Tab from page start reaches `Skip to main content` link.
- Activating skip link moves focus to the primary `<main>` region heading.
- Every interactive control is reachable in a visible focus order.

2. Screen reader (NVDA/VoiceOver on web):
- Route changes announce page context (`Navigated to ...`).
- Dynamic updates (chore approvals/completions) are announced through the live region.
- Navigation controls have explicit labels and state.

3. Visual accessibility:
- High contrast mode preserves readable contrast for text, buttons, and borders.
- Reduced motion mode suppresses non-essential animations/transitions.

## Mobile Checklist

1. iOS VoiceOver:
- Bottom tab items announce meaningful labels and hints.
- Chore cards announce title, points, and completion status.
- Chore row custom actions expose both “Open details” and “Complete chore” when relevant.

2. Android TalkBack:
- Filter chips announce selected state.
- Search field and clear action are discoverable by label.
- Swipe completion action announces intent and hint.

3. Voice control compatibility:
- Interactive controls have stable, explicit labels (no icon-only ambiguity).

## Regression Pass (Required before release)

- Run web TypeScript check (`apps/web`)
- Run mobile TypeScript check (`apps/mobile`)
- Manually test at least one full chore completion flow with VoiceOver and TalkBack enabled
- Validate Settings → Accessibility toggles persist after app reload
