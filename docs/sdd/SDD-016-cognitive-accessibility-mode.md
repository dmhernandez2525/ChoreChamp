# SDD-016: Cognitive Accessibility Mode

**Status:** Implemented
**Feature:** F13.3
**Phase:** 13 (Accessibility & Inclusion)
**Last Updated:** 2026-02-15

---

## 1. Overview

Cognitive Accessibility Mode provides tools to reduce cognitive load, minimize distractions, and make the ChoreChamp interface easier to process for users with ADHD, executive function challenges, anxiety, or other cognitive differences. It builds on the reading accommodations from F13.2 by adding focus mode, task chunking, progress visualization preferences, and safety nets.

## 2. Goals

- Provide a focus mode that dims or hides non-essential UI elements
- Support task chunking to break multi-step chores into smaller pieces
- Allow users to choose their preferred progress visualization style
- Limit the number of items shown at once to reduce overwhelm
- Add confirmation dialogs before destructive or important actions
- Provide auto-save reminders for in-progress work
- Add visual timer indicators for deadline awareness

## 3. Architecture

### 3.1 Client-Side State

All cognitive preferences are managed in the existing `AccessibilityProvider` context alongside display and reading preferences. Each preference is a standalone `useState` hook persisted to `localStorage`.

### 3.2 New State Fields

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `focusMode` | `'off' \| 'moderate' \| 'strict'` | `'off'` | Controls UI distraction reduction |
| `taskChunkingEnabled` | `boolean` | `false` | Breaks tasks into step groups |
| `maxStepsPerChunk` | `number (1-5)` | `3` | Steps shown per chunk |
| `progressStyle` | `'bar' \| 'steps' \| 'checklist' \| 'ring'` | `'bar'` | Preferred progress visualization |
| `maxItemsPerView` | `3 \| 5 \| 10 \| 0` | `0` (unlimited) | Max list items before pagination |
| `confirmBeforeActions` | `boolean` | `false` | Require confirmation for actions |
| `autoSaveReminders` | `boolean` | `false` | Periodic save/submit reminders |
| `timerVisualizationEnabled` | `boolean` | `false` | Pulsing visual on timers |

### 3.3 CSS Integration

| Data Attribute | CSS Behavior |
|---------------|--------------|
| `data-focus-mode="moderate"` | Dims `.secondary-content`, `.decorative-only`, `aside` to 45% opacity |
| `data-focus-mode="strict"` | Hides `.secondary-content`, `.decorative-only`, `aside`, `.optional-detail` |
| `data-task-chunking="true"` | Adds left-border step indicators to `.chore-step` elements |
| `data-timer-visualization="true"` | Adds pulsing box-shadow animation to `.timer-ring` elements |

Focus mode respects `:hover` and `:focus-within` to restore opacity on interaction.

## 4. Components

| Component | File | Role |
|-----------|------|------|
| AccessibilityProvider | `apps/web/src/components/accessibility/AccessibilityProvider.tsx` | Extended with cognitive state |
| CognitiveAccessibilitySection | `apps/web/src/components/settings/CognitiveAccessibilitySection.tsx` | Settings UI for all cognitive preferences |
| Settings | `apps/web/src/pages/Settings.tsx` | Renders cognitive section under accessibility tab |
| index.css | `apps/web/src/index.css` | Focus mode, task chunking, timer visualization CSS |

## 5. Focus Mode Levels

| Level | Behavior | Use Case |
|-------|----------|----------|
| **Off** | No changes | Default experience |
| **Moderate** | Secondary content dimmed to 45% opacity, restored on hover/focus | Mild distraction reduction |
| **Strict** | Non-essential UI completely hidden | Maximum focus, minimal visual noise |

Elements tagged with these CSS classes are affected:
- `.secondary-content` - sidebars, related content, suggestions
- `.decorative-only` - decorative images, patterns, flourishes
- `.optional-detail` - additional metadata that is not critical
- `aside:not([role="alert"])` - sidebar content (alerts preserved)

## 6. Task Chunking

When enabled, multi-step chores are visually segmented into groups of `maxStepsPerChunk` steps. Each chunk is displayed with a left-border accent and progress indicator. Completed chunks fade to 70% opacity to provide visual closure.

## 7. Progress Visualization Options

| Style | Description |
|-------|-------------|
| **Bar** | Horizontal progress bar (default, familiar pattern) |
| **Steps** | Numbered step dots with active/completed states |
| **Checklist** | Traditional checkmark list |
| **Ring** | Circular progress ring (compact, gamified feel) |

## 8. Safety Features

- **Confirm Before Actions**: Shows a confirmation modal before any chore completion, deletion, or edit
- **Auto-Save Reminders**: Triggers a subtle notification if a form has been open for 2+ minutes without saving
- **Visual Timer**: Adds a pulsing animation around countdown elements to maintain deadline awareness without being jarring (respects reduced-motion preference)

## 9. Testing

Unit tests validate:
- Focus mode options have correct progressive ordering (off < moderate < strict)
- Progress styles cover both linear and circular visualizations
- Max items options include restrictive and unlimited choices
- All constant arrays have expected values and lengths

## 10. Future Enhancements

- Guided task walkthroughs with step-by-step overlay
- Pomodoro timer integration for timed focus sessions
- Cognitive load scoring per screen with automatic simplification
- Parent-configurable cognitive profiles per child
