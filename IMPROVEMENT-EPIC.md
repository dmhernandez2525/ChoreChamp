# Improvement Epic: RIP Cycle 2

**Epic:** ChoreChamp Quality, Coverage, and Type Safety
**Priority:** CRITICAL/HIGH
**Source:** RIP Cycle 1 Diagnostic Report

---

## Feature 1: Database Migration Infrastructure (CRITICAL)

### US-IMP-01: Generate Drizzle Migrations
**Size:** M
**Acceptance Criteria:**
- Given 42 schema files exist in packages/database/src/schema/
- When `npx drizzle-kit generate` is run
- Then a drizzle/ directory is created with migration SQL files
- And each schema table has a corresponding CREATE TABLE migration
- And the migrations can be applied with `npx drizzle-kit migrate`

---

## Feature 2: API Client Type Safety (CRITICAL)

### US-IMP-02: Replace `unknown` Types in API Client Methods
**Size:** L
**Acceptance Criteria:**
- Given packages/api-client/src/client.ts has 20+ methods returning `unknown`
- When proper types from @chorechamp/types are applied
- Then every public method returns a concrete type (not `unknown`, `unknown[]`, or `Record<string, unknown>`)
- And TypeScript compilation passes with no errors
- And no `as unknown as` casts remain

### US-IMP-03: Replace `unknown` Types in API Client Hooks
**Size:** L
**Acceptance Criteria:**
- Given packages/api-client/src/hooks/index.ts has 30+ `Record<string, unknown>` parameters
- When proper types are applied
- Then all hook parameters and return types use concrete types
- And packages/api-client/src/hooks/board.ts uses concrete types for mutations
- And TypeScript compilation passes

---

## Feature 3: API Route Test Coverage (CRITICAL)

### US-IMP-04: Core Route Tests (auth, households, members)
**Size:** XL
**Acceptance Criteria:**
- Given auth.ts, households.ts, members.ts have no tests
- When test files are created
- Then each route has tests for: success cases, auth failures, validation errors, edge cases
- And test coverage for these files is >= 80%

### US-IMP-05: Board Route Tests (board, calendar, chores)
**Size:** L
**Acceptance Criteria:**
- Given board.ts, calendar.ts, chores.ts have no tests
- When test files are created
- Then each route has tests for CRUD operations, auth checks, and input validation
- And test coverage is >= 80%

### US-IMP-06: Feature Route Tests (tags, time-tracking, dependencies, automation-rules, import-export)
**Size:** L
**Acceptance Criteria:**
- Given tags.ts, time-tracking.ts, dependencies.ts, automation-rules.ts, import-export.ts have no tests
- When test files are created
- Then each route tests: happy path, auth failures, validation errors, edge cases
- And import-export tests verify size limit enforcement and CSV injection protection
- And dependencies tests verify transitive cycle detection
- And test coverage is >= 80%

### US-IMP-07: Utility Route Tests (bulk-actions, saved-filters, comments, attachments, activity)
**Size:** L
**Acceptance Criteria:**
- Given bulk-actions.ts, saved-filters.ts, chore-comments.ts, chore-attachments.ts, chore-activity.ts have no tests
- When test files are created
- Then each route tests CRUD, auth, batch limits, and error handling
- And test coverage is >= 80%

---

## Feature 4: Board Component Test Coverage (HIGH)

### US-IMP-08: Core View Component Tests
**Size:** L
**Acceptance Criteria:**
- Given CalendarView, ListView, KanbanCard, KanbanColumn have no tests
- When test files are created
- Then CalendarView tests: month rendering, day click, chore display, drag-to-reschedule
- And ListView tests: sorting, grouping, selection, row click
- And KanbanCard tests: render, drag handle, selection, priority badge
- And KanbanColumn tests: render, WIP limit warning, empty state

### US-IMP-09: Dialog and Toolbar Component Tests
**Size:** M
**Acceptance Criteria:**
- Given BulkAssignDialog, BulkRescheduleDialog, BulkDeleteConfirmation, SelectionToolbar, CardContextMenu have no tests
- When test files are created
- Then each dialog tests: open/close, form submission, cancel, validation
- And SelectionToolbar tests: visibility based on selection count, action buttons
- And CardContextMenu tests: position, actions, keyboard navigation

### US-IMP-10: Feature Component Tests
**Size:** M
**Acceptance Criteria:**
- Given FilterBuilder, SaveFilterDialog, SavedFilterList, ColumnSettingsPanel, KeyboardShortcutsHelp have no tests
- When test files are created
- Then FilterBuilder tests: add/remove conditions, apply, clear
- And save/load filter tests verify persistence round-trip
- And coverage is >= 80% for each component

### US-IMP-11: Mobile Component Tests
**Size:** M
**Acceptance Criteria:**
- Given MobileBottomSheet, MobileNavBar, MobileChoreCard have no tests
- When test files are created
- Then MobileBottomSheet tests: snap points, drag gesture, backdrop click
- And MobileNavBar tests: tab switching, active state
- And MobileChoreCard tests: swipe actions, tap

### US-IMP-12: Gamification and Accessibility Component Tests
**Size:** M
**Acceptance Criteria:**
- Given StreakIndicator, LevelProgressBar, AchievementToast, SkipLinks, A11yAnnouncer have no tests
- When test files are created
- Then gamification components test: tier calculation, animation triggers, streak states
- And accessibility components test: aria-live announcements, skip link navigation, focus trap

---

## Feature 5: Store and Hook Test Coverage (HIGH)

### US-IMP-13: Store Tests
**Size:** M
**Acceptance Criteria:**
- Given filter-store, selection-store, undo-store have no tests
- When test files are created
- Then filter-store tests: add/remove/clear filters, search query, apply saved filter
- And selection-store tests: toggle, selectAll, deselectAll, range select
- And undo-store tests: push, undo, redo, stack limits, edge cases
- And coverage is >= 80%

### US-IMP-14: Hook Tests
**Size:** M
**Acceptance Criteria:**
- Given useAutomationRules, useBoardSync, usePresence have no tests
- When test files are created
- Then useAutomationRules tests: CRUD operations, mutation callbacks
- And useBoardSync tests: socket event handling, cache invalidation
- And usePresence tests: presence tracking, idle timeout, throttling
- And coverage is >= 80%

---

## Feature 6: Test File TypeScript Fixes (HIGH)

### US-IMP-15: Fix Test File TS Errors
**Size:** S
**Acceptance Criteria:**
- Given 3 TypeScript errors exist in test files
- When BoardSkeleton.test.tsx adds `vi` import from vitest
- And ChoreDetailPanel.test.tsx removes unused `container` variable
- And UndoToast.test.tsx fixes `getState` type on mock
- Then `tsc --noEmit` passes with 0 errors for apps/web

---

## Feature 7: Code Cleanup (MEDIUM)

### US-IMP-16: Implement EditChore updateChore Mutation
**Size:** M
**Acceptance Criteria:**
- Given EditChore.tsx has a TODO for updateChore mutation
- When the mutation is implemented
- Then the edit form submits changes to the API
- And success shows a toast and navigates back
- And errors are displayed to the user

### US-IMP-17: Audit and Clean Up Barrel Exports
**Size:** S
**Acceptance Criteria:**
- Given 18 board components are exported but unused outside the barrel
- When exports are audited
- Then components used internally only (KanbanCard, KanbanColumn, CalendarDay) are removed from barrel
- And components meant for page integration are wired into BoardPage or removed
- And the barrel file only exports components with external consumers

### US-IMP-18: Resolve TODO Comments
**Size:** M
**Acceptance Criteria:**
- Given 6 TODO comments exist across the codebase
- When each is addressed
- Then BossBattle.tsx TODOs are either implemented or documented as future work
- And SchoolExtracurricular.tsx form modals are implemented or scoped out
- And PendingApprovalsScreen.tsx API call is implemented or mock is documented
- And members.ts points history logging is implemented

---

## Feature 8: E2E Test Expansion (MEDIUM)

### US-IMP-19: E2E Tests for Core Flows
**Size:** L
**Acceptance Criteria:**
- Given only 2 E2E spec files exist
- When new specs are created
- Then auth flow (sign up, sign in, sign out) has E2E coverage
- And chore CRUD (create, read, update, delete) has E2E coverage
- And board view switching (kanban, calendar, list) has E2E coverage
- And filter/search has E2E coverage
- And bulk operations have E2E coverage

---

## Dependency Order (Stacked PR Sequence)

```
US-IMP-15 (fix test TS errors) -- no deps
US-IMP-01 (migrations) -- no deps
US-IMP-02 (client types) -> US-IMP-03 (hook types)
US-IMP-13 (store tests) -- no deps
US-IMP-14 (hook tests) -- no deps
US-IMP-08 (view tests) -> US-IMP-09 (dialog tests) -> US-IMP-10 (feature tests) -> US-IMP-11 (mobile tests) -> US-IMP-12 (gamification/a11y tests)
US-IMP-04 (core route tests) -> US-IMP-05 (board route tests) -> US-IMP-06 (feature route tests) -> US-IMP-07 (utility route tests)
US-IMP-16 (EditChore mutation) -- no deps
US-IMP-17 (barrel cleanup) -- after component tests
US-IMP-18 (TODO cleanup) -- no deps
US-IMP-19 (E2E expansion) -- after component integration
```

## Size Summary

| Size | Count | Stories |
|------|-------|---------|
| S | 2 | US-IMP-15, US-IMP-17 |
| M | 8 | US-IMP-01, US-IMP-09, US-IMP-10, US-IMP-11, US-IMP-12, US-IMP-13, US-IMP-14, US-IMP-16, US-IMP-18 |
| L | 5 | US-IMP-02, US-IMP-03, US-IMP-05, US-IMP-06, US-IMP-07, US-IMP-08, US-IMP-19 |
| XL | 1 | US-IMP-04 |
