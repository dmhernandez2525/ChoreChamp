# ChoreChamp Diagnostic Report

**Branch:** `feature/F15-US29-page-integration`
**Date:** 2026-03-14
**Scope:** Read-only diagnostic scan of TypeScript health, test coverage, code quality, and architecture

---

## Summary

| Category | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH | 3 |
| MEDIUM | 3 |
| LOW | 2 |

---

## CRITICAL

### C1. API TypeScript Compilation Fails (49 errors)

The `apps/api` project fails `tsc --noEmit` with **49 type errors** across 10 files. The web app compiles cleanly (0 errors).

**Error breakdown by file:**

| File | Errors |
|------|--------|
| `src/routes/tags.ts` | 12 |
| `src/routes/automation-rules.ts` | 11 |
| `src/routes/time-tracking.ts` | 8 |
| `src/routes/dependencies.ts` | 6 |
| `src/routes/import-export.ts` | 4 |
| `src/routes/bulk-actions.ts` | 3 |
| `packages/database/src/schema/index.ts` | 2 |
| `src/routes/chores.ts` | 1 |
| `src/routes/chore-comments.ts` | 1 |
| `src/routes/chore-attachments.ts` | 1 |

**Error breakdown by type:**

| Error Code | Count | Description |
|------------|-------|-------------|
| TS2345 | 24 | Argument type mismatch (`AuthenticatedRequest` vs `FastifyRequest`) |
| TS2339 | 22 | Property does not exist (`db` on `FastifyInstance`, `memberId` on user) |
| TS2308 | 2 | Duplicate exported member (`automationRules`, `automationRulesRelations`) |
| TS6133 | 1 | Declared but unused variable |

**Root causes:**
1. Route handlers use a custom `AuthenticatedRequest` type that is incompatible with Fastify's route handler signature. The 6 newest route files (tags, automation-rules, time-tracking, dependencies, import-export, bulk-actions) all share this pattern.
2. `fastify.db` is accessed but never declared on the Fastify instance type (missing type augmentation).
3. `packages/database/src/schema/index.ts` re-exports `automationRules` and `automationRulesRelations` from both `./smart-automation` and `./automation-rules`, causing a duplicate export conflict.

### C2. Database Schema Duplicate Exports

`packages/database/src/schema/index.ts` exports `*` from both `smart-automation` and `automation-rules`. Both modules export `automationRules` and `automationRulesRelations`, producing TS2308 errors. This can cause unpredictable behavior at runtime depending on which export "wins."

**Conflicting files:**
- `packages/database/src/schema/smart-automation.ts` (exports `automationRules`, `automationRulesRelations`)
- `packages/database/src/schema/automation-rules.ts` (exports `automationRules`, `automationRulesRelations`)

---

## HIGH

### H1. Board Component Test Coverage: 18% (8 of 44 components tested)

Only **8 out of 44** `.tsx` files in `apps/web/src/components/board/` have corresponding test files, yielding ~18% file-level coverage.

**Components WITH tests (8):**
- BoardSkeleton, ChoreDetailPanel, CommandPalette, EmptyStates, FilterBar, KanbanBoard, TagPicker, UndoToast

**Components WITHOUT tests (37):**
- A11yAnnouncer, AchievementToast, AutomationRuleBuilder, AutomationRuleList, BoardErrorBoundary, BulkAssignDialog, BulkDeleteConfirmation, BulkRescheduleDialog, CalendarDay, CalendarView, CardContextMenu, ColumnSettingsPanel, DemoBanner, DependencyPicker, ExportDialog, FilterBuilder, ImportDialog, InlineEditCell, KanbanCard, KanbanColumn, KeyboardShortcutsHelp, LevelProgressBar, ListView, MobileBottomSheet, MobileChoreCard, MobileNavBar, PointsBadge, PresenceAvatars, PrintView, SavedFilterList, SaveFilterDialog, SelectionToolbar, SkipLinks, StreakIndicator, TimeTracker, ViewSwitcher

### H2. Missing Coverage Tooling

`@vitest/coverage-v8` is not installed. Running `npx vitest run --coverage` fails with a missing dependency error. Without coverage tooling, there is no way to measure line/branch/function coverage percentages.

### H3. 33 Unused Board Barrel Exports

33 of the 55 named exports from `apps/web/src/components/board/index.ts` are never imported anywhere outside the board directory (excluding test files). These components are exported but not consumed by any page or parent component.

**Unused exports:** KanbanColumn, KanbanCard, CalendarDay, InlineEditCell, InlineSelectCell, TagPicker, TagBadge, TimeTracker, DependencyPicker, PresenceAvatars, PrintView, ExportDialog, ImportDialog, BoardErrorBoundary, KanbanSkeleton, CalendarSkeleton, BoardHeaderSkeleton, NoFilterResultsEmpty, NoSearchResultsEmpty, EmptyColumn, MobileBottomSheet, MobileNavBar, MobileChoreCard, PointsBadge, StreakIndicator, LevelProgressBar, AchievementToastProvider, useAchievementToast, AutomationRuleBuilder, AutomationRuleList, SkipLinks, A11yAnnouncerProvider, useAnnounce

**Note:** Some of these (KanbanColumn, KanbanCard) are likely consumed internally by KanbanBoard and re-exported for potential external use. Others may represent features built but not yet integrated into pages.

---

## MEDIUM

### M1. TODO/FIXME Comments (6 total)

Six TODO comments exist across the codebase. None appear to be blocking, but they indicate incomplete implementations:

| File | Comment |
|------|---------|
| `apps/web/src/pages/BossBattle.tsx:31` | Get party stats from API when endpoint is available |
| `apps/web/src/pages/BossBattle.tsx:42` | Get contributor damage stats from API when endpoint is available |
| `apps/web/src/pages/SchoolExtracurricular.tsx:68` | Implement form modals |
| `apps/web/src/pages/EditChore.tsx:28` | Implement updateChore mutation |
| `apps/mobile/src/screens/chores/PendingApprovalsScreen.tsx:44` | Replace with actual API call when endpoint exists |
| `apps/api/src/routes/members.ts:332` | Log bonus in a points history table |

### M2. Stale .env.example Entry

`VITE_STRIPE_PUBLIC_KEY` is documented in `apps/web/.env.example` but is **never referenced** in any source file under `apps/web/src/`. This is either premature documentation or a leftover from removed Stripe integration code.

### M3. Test Suite Passes But Coverage is Unknown

All 487 tests across 15 test files pass. However, without `@vitest/coverage-v8` installed, actual line/branch/function coverage percentages cannot be measured. The existing tests may cover only a fraction of the codebase.

**Test results:**
- 15 test files, all passing
- 487 total test assertions
- Duration: 2.23s

---

## LOW

### L1. No Circular Import Patterns Detected

Scanned board components, stores, and lib directories for mutual imports. No circular dependency patterns were found.

### L2. All API Route Files Are Registered

All non-test `.ts` files in `apps/api/src/routes/` are properly imported and registered in `apps/api/src/routes/index.ts`. No orphaned route files were detected.

---

## Recommendations (Priority Order)

1. **Fix the AuthenticatedRequest type mismatch** in the 6 affected API route files. Either augment the Fastify type definitions to include `db` and the extended user properties, or adjust the route handlers to use Fastify's native request type with proper generics.

2. **Resolve the duplicate schema exports.** Either remove `automationRules`/`automationRulesRelations` from `smart-automation.ts` (if the `automation-rules.ts` version is canonical) or use explicit named re-exports in `schema/index.ts` to disambiguate.

3. **Install `@vitest/coverage-v8`** to enable coverage reporting. Target 80% coverage across all metrics.

4. **Add tests for the 37 untested board components**, prioritizing the 22 that are actively imported by pages (KanbanBoard's children like KanbanColumn/KanbanCard, CalendarView, ListView, etc.).

5. **Audit the 33 unused barrel exports.** Remove exports for components that are only used internally (e.g., KanbanColumn is used inside KanbanBoard, not externally). Keep exports only for components intended for external consumption.

6. **Remove or implement the 6 TODO items.** The `EditChore.tsx` TODO (implement updateChore mutation) is the most impactful since it represents missing core functionality.

7. **Remove `VITE_STRIPE_PUBLIC_KEY`** from `.env.example` until Stripe integration is implemented, or add the corresponding source code that uses it.
