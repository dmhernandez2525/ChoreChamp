# SDD-018: Special Needs Accommodations

**Status:** Implemented
**Feature:** F13.5
**Phase:** 13 (Accessibility & Inclusion)
**Last Updated:** 2026-02-15

---

## 1. Overview

Provides tailored accommodations for users with ADHD, autism spectrum conditions, and sensory processing differences. These features build on the cognitive accessibility mode (F13.3) with specific adaptations grounded in neurodivergent UX research.

## 2. Features

### ADHD Support
- **ADHD Mode**: Highlights the active task and dims others to reduce decision fatigue
- **Visual Timer**: Adds visible countdown indicator around timer elements for time awareness

### Autism-Friendly
- **Autism-Friendly Mode**: Removes surprise elements (confetti, auto-popups, celebrations)
- **Predictable Layouts**: Enforces consistent card sizes so UI never shifts unexpectedly
- **Consistent Navigation**: Ensures nav labels are always visible, never hidden or collapsed

### Sensory Controls
- **Sensory Level**: Three levels (default, low, minimal) that progressively reduce color saturation
- **Transition Style**: Control over transitions (default, fade only, no transitions)
- **Quiet Mode**: Hides notification badges, alert dots, and unread indicators

## 3. New State Fields

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `adhdModeEnabled` | `boolean` | `false` | Highlight active task, dim others |
| `autismFriendlyEnabled` | `boolean` | `false` | Remove surprise/unpredictable elements |
| `sensoryLevel` | `'default' \| 'low' \| 'minimal'` | `'default'` | Color saturation control |
| `predictableLayoutEnabled` | `boolean` | `false` | Consistent card sizes |
| `transitionStyle` | `'default' \| 'fade' \| 'none'` | `'default'` | Transition animation control |
| `visualTimerEnabled` | `boolean` | `false` | Visible countdown ring |
| `quietModeEnabled` | `boolean` | `false` | Hide notification badges |
| `consistentNavigationEnabled` | `boolean` | `false` | Always-visible nav labels |

## 4. CSS Implementation

| Selector | Behavior |
|----------|----------|
| `[data-adhd-mode='true'] .task-card.active` | Ring shadow highlight |
| `[data-adhd-mode='true'] .task-card:not(.active)` | 60% opacity |
| `[data-autism-friendly='true'] .surprise-element` | Hidden |
| `[data-sensory-level='low']` | 70% saturation filter |
| `[data-sensory-level='minimal']` | 40% saturation, 95% brightness |
| `[data-transition-style='fade']` | Only opacity transitions |
| `[data-transition-style='none']` | All transitions and animations disabled |
| `[data-quiet-mode='true'] .notification-badge` | Hidden |
| `[data-predictable-layout='true'] .task-card` | Minimum height enforced |
| `[data-consistent-navigation='true'] nav span` | Always displayed |

Image elements receive compensating filters so photos remain natural even when the root is desaturated.

## 5. Components

| Component | File | Role |
|-----------|------|------|
| AccessibilityProvider | `AccessibilityProvider.tsx` | Extended with 8 special needs state fields |
| SpecialNeedsSection | `SpecialNeedsSection.tsx` | Settings UI with ADHD, autism, sensory controls |
| Settings | `Settings.tsx` | Renders SpecialNeedsSection under accessibility tab |

## 6. Testing

8 unit tests validate:
- Sensory levels have correct progressive ordering
- Transition style options have graduated control
- Constants cover full range from normal to minimal

## 7. Research Basis

- ADHD mode reduces decision fatigue by limiting visible options (Miller's Law)
- Autism-friendly mode removes unpredictable stimuli per sensory regulation research
- Sensory level controls align with occupational therapy "sensory diet" principles
- Predictable layouts follow the WCAG 2.1 consistent identification guideline (3.2.4)
