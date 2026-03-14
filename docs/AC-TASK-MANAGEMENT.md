# Acceptance Criteria: Advanced Task Management Views

**Status:** Draft
**Priority:** P1
**Related SDDs:** 025-033
**Created:** 2026-03-14

> Ported from Command Center UI project management views, adapted for ChoreChamp's
> family chore management domain.

---

## SDD-025: Kanban Board View

### Board Rendering
- [ ] AC-025-01: Board displays columns for each chore status: To Do, In Progress, Done, Verified
- [ ] AC-025-02: Each column shows a header with status name, chore count, and color bar
- [ ] AC-025-03: Chores render as cards within their corresponding status column
- [ ] AC-025-04: Board is horizontally scrollable when columns exceed viewport width
- [ ] AC-025-05: Empty columns show an empty state message ("No chores in this status")
- [ ] AC-025-06: Board loads chores for the current household only

### Drag and Drop
- [ ] AC-025-07: Chore cards are draggable between columns using mouse/touch
- [ ] AC-025-08: Dragging a card to a new column updates the chore's status
- [ ] AC-025-09: Status update is optimistic (card moves immediately, API call follows)
- [ ] AC-025-10: If API call fails, card reverts to original column with error toast
- [ ] AC-025-11: Cards can be reordered within a column (changes board_order)
- [ ] AC-025-12: Drag preview shows a semi-transparent copy of the card
- [ ] AC-025-13: Drop target column highlights when a card is dragged over it
- [ ] AC-025-14: Keyboard drag is supported (Space to pick up, Arrow keys to move, Space to drop)

### Grouping
- [ ] AC-025-15: Board can be grouped by member (swimlane per family member)
- [ ] AC-025-16: Board can be grouped by category (kitchen, bathroom, outdoor, etc.)
- [ ] AC-025-17: Board can be grouped by priority (urgent, high, medium, low)
- [ ] AC-025-18: Board can be grouped by due date (overdue, today, this week, later, no date)
- [ ] AC-025-19: Group headers show group name and chore count
- [ ] AC-025-20: Groups are collapsible (click header to toggle)
- [ ] AC-025-21: Default grouping is "none" (flat board)

### WIP Limits
- [ ] AC-025-22: Parents can set a WIP limit per column (e.g., max 3 chores "In Progress")
- [ ] AC-025-23: Column header shows WIP indicator when at or near limit (e.g., "3/3")
- [ ] AC-025-24: Column header turns red/warning when WIP limit is exceeded
- [ ] AC-025-25: WIP limits are per-household, stored in board preferences

### Column Customization
- [ ] AC-025-26: Column header color is customizable (color picker)
- [ ] AC-025-27: Column settings persist across sessions (stored in board preferences)

### Card Display
- [ ] AC-025-28: Card shows chore title, assignee avatar(s), category icon, due date
- [ ] AC-025-29: Card shows difficulty badge (easy/medium/hard) and point value
- [ ] AC-025-30: Card shows priority indicator (colored left border)
- [ ] AC-025-31: Overdue chores show due date in red
- [ ] AC-025-32: Chores requiring photo proof show camera icon
- [ ] AC-025-33: Chores pending approval show approval indicator
- [ ] AC-025-34: Clicking a card opens the chore detail panel

### Accessibility
- [ ] AC-025-35: All board elements have ARIA labels
- [ ] AC-025-36: Columns are labeled as lists with role="list"
- [ ] AC-025-37: Drag operations are announced to screen readers
- [ ] AC-025-38: Board is navigable with keyboard (Tab between columns, Arrow between cards)
- [ ] AC-025-39: Reduced motion setting disables drag animations

---

## SDD-026: Calendar View

### Calendar Rendering
- [ ] AC-026-01: Calendar displays a month view by default
- [ ] AC-026-02: Calendar has a week view toggle
- [ ] AC-026-03: Each day cell shows chores scheduled for that date
- [ ] AC-026-04: Day cells show a maximum of 3 chore chips, then "+N more" indicator
- [ ] AC-026-05: Clicking "+N more" expands to show all chores for that day
- [ ] AC-026-06: Today's date is highlighted with a distinct background
- [ ] AC-026-07: Past dates with incomplete chores show overdue indicator
- [ ] AC-026-08: Completed chores show a checkmark overlay

### Navigation
- [ ] AC-026-09: Previous/Next buttons navigate between months (or weeks in week view)
- [ ] AC-026-10: "Today" button jumps to current date
- [ ] AC-026-11: Month/year header shows current period
- [ ] AC-026-12: Keyboard arrows navigate between days

### Drag to Reschedule
- [ ] AC-026-13: Chore chips are draggable to different day cells
- [ ] AC-026-14: Dropping a chore on a new date updates the scheduled date
- [ ] AC-026-15: Reschedule is optimistic with rollback on failure
- [ ] AC-026-16: Recurring chore reschedule only affects the specific occurrence, not the pattern
- [ ] AC-026-17: Undo toast appears after reschedule

### Color Coding
- [ ] AC-026-18: Chore chips can be colored by assignee (uses member avatar color)
- [ ] AC-026-19: Chore chips can be colored by category (kitchen=green, bathroom=blue, etc.)
- [ ] AC-026-20: Color mode toggle is available in calendar header

### Unscheduled Sidebar
- [ ] AC-026-21: Sidebar lists chores without a scheduled date
- [ ] AC-026-22: Unscheduled chores can be dragged to a day cell to schedule them
- [ ] AC-026-23: Sidebar is collapsible on desktop
- [ ] AC-026-24: Sidebar shows as bottom sheet on mobile

### Create from Calendar
- [ ] AC-026-25: Clicking an empty area of a day cell opens "Create Chore" with that date pre-filled
- [ ] AC-026-26: Clicking a chore chip opens the chore detail panel

### Accessibility
- [ ] AC-026-27: Calendar grid uses role="grid" with row/cell semantics
- [ ] AC-026-28: Day cells announce their date and chore count to screen readers
- [ ] AC-026-29: Keyboard navigation between days with Arrow keys
- [ ] AC-026-30: Drag-to-reschedule has keyboard alternative (select chore, press R, type new date)

---

## SDD-027: List View

### Table Rendering
- [ ] AC-027-01: Table displays chores with columns: checkbox, title, assignee(s), status, category, due date, difficulty, points
- [ ] AC-027-02: Table loads all household chores with virtual scrolling for 100+ items
- [ ] AC-027-03: Each row is clickable to open chore detail panel
- [ ] AC-027-04: Empty state shows "No chores match your filters" when filtered, "No chores yet" when empty

### Sorting
- [ ] AC-027-05: Clicking a column header sorts by that column (ascending)
- [ ] AC-027-06: Clicking the same header again reverses sort direction (descending)
- [ ] AC-027-07: Sort indicator (arrow) shows on the active sort column
- [ ] AC-027-08: Shift+click adds secondary sort (multi-column sort)
- [ ] AC-027-09: Default sort is by due date ascending

### Inline Editing
- [ ] AC-027-10: Clicking the assignee cell shows a member dropdown
- [ ] AC-027-11: Clicking the status cell shows a status dropdown
- [ ] AC-027-12: Clicking the category cell shows a category dropdown
- [ ] AC-027-13: Clicking the due date cell shows a date picker
- [ ] AC-027-14: Clicking the difficulty cell shows easy/medium/hard selector
- [ ] AC-027-15: Changes save automatically on selection (optimistic)
- [ ] AC-027-16: Escape cancels the edit without saving
- [ ] AC-027-17: Tab moves to the next editable cell

### Keyboard Navigation
- [ ] AC-027-18: Arrow keys move focus between cells
- [ ] AC-027-19: Enter activates inline edit on the focused cell
- [ ] AC-027-20: Escape exits edit mode
- [ ] AC-027-21: Space toggles the checkbox for multi-select
- [ ] AC-027-22: Home/End jump to first/last row

### Grouping
- [ ] AC-027-23: Table can be grouped by assignee (collapsible group headers)
- [ ] AC-027-24: Table can be grouped by category
- [ ] AC-027-25: Table can be grouped by status
- [ ] AC-027-26: Group headers show group name and chore count
- [ ] AC-027-27: Groups are collapsible with expand/collapse toggle

### Accessibility
- [ ] AC-027-28: Table uses proper table semantics (thead, tbody, th, td)
- [ ] AC-027-29: Sort state is announced to screen readers
- [ ] AC-027-30: Inline editing is announced ("Editing assignee for [chore title]")

---

## SDD-028: Bulk Actions

### Selection
- [ ] AC-028-01: Clicking a chore checkbox toggles its selection
- [ ] AC-028-02: Cmd+click (Mac) / Ctrl+click (Windows) adds to selection without deselecting others
- [ ] AC-028-03: Shift+click selects a range from the last selected item to the clicked item
- [ ] AC-028-04: "Select All" checkbox in list view header selects all visible chores
- [ ] AC-028-05: Selected count shows in the bulk action bar
- [ ] AC-028-06: Selection persists when switching between views (Kanban/List/Calendar)

### Bulk Action Bar
- [ ] AC-028-07: Floating bar appears at bottom of screen when 1+ items are selected
- [ ] AC-028-08: Bar shows "{N} chore(s) selected" text
- [ ] AC-028-09: Bar has "Assign to" button that opens member picker dropdown
- [ ] AC-028-10: Bar has "Change Status" button that opens status dropdown
- [ ] AC-028-11: Bar has "Change Category" button that opens category dropdown
- [ ] AC-028-12: Bar has "Change Priority" button that opens priority dropdown
- [ ] AC-028-13: Bar has "Reschedule" button that opens date picker
- [ ] AC-028-14: Bar has "Delete" button that opens confirmation dialog
- [ ] AC-028-15: Bar has "Deselect All" / X button
- [ ] AC-028-16: Bar is keyboard accessible (Tab to navigate, Enter to activate)

### Bulk Operations
- [ ] AC-028-17: Bulk assign updates all selected chores' assignee
- [ ] AC-028-18: Bulk status change updates all selected chores' status
- [ ] AC-028-19: Bulk category change updates all selected chores' category
- [ ] AC-028-20: Bulk priority change updates all selected chores' priority
- [ ] AC-028-21: Bulk reschedule updates all selected chores' due date
- [ ] AC-028-22: Bulk delete shows confirmation dialog with count before executing
- [ ] AC-028-23: All bulk operations are optimistic (UI updates immediately)
- [ ] AC-028-24: All bulk operations show undo toast
- [ ] AC-028-25: Failed bulk operations roll back all items and show error toast
- [ ] AC-028-26: Selection clears after successful bulk operation

---

## SDD-029: Advanced Filters

### Quick Filters
- [ ] AC-029-01: Assignee dropdown filters chores by assigned member
- [ ] AC-029-02: Status dropdown filters by current status
- [ ] AC-029-03: Category dropdown filters by chore category
- [ ] AC-029-04: Due date range picker filters by date range
- [ ] AC-029-05: Difficulty filter shows easy/medium/hard options
- [ ] AC-029-06: Multiple quick filters combine with AND logic
- [ ] AC-029-07: Active filters show as removable pills below the filter bar
- [ ] AC-029-08: "Clear all" button removes all active filters
- [ ] AC-029-09: Filter results update immediately (no submit button)

### Advanced Filter Builder
- [ ] AC-029-10: "Advanced" button opens the filter builder panel
- [ ] AC-029-11: Builder supports AND/OR condition groups
- [ ] AC-029-12: Each condition has field, operator, and value selectors
- [ ] AC-029-13: Operators change based on field type (string, enum, number, date, boolean)
- [ ] AC-029-14: Add condition button appends a new row
- [ ] AC-029-15: Remove condition button removes a row (minimum 1 condition)
- [ ] AC-029-16: Preview shows count of matching chores
- [ ] AC-029-17: "Apply" button applies the advanced filter
- [ ] AC-029-18: "Reset" button clears all advanced conditions

### Saved Views
- [ ] AC-029-19: "Save view" button captures current filters, sort, and grouping
- [ ] AC-029-20: Save dialog asks for view name and visibility (private/household)
- [ ] AC-029-21: Saved views appear in a dropdown for quick access
- [ ] AC-029-22: Selecting a saved view applies all its filters/sort/grouping
- [ ] AC-029-23: Saved views can be edited (update filters)
- [ ] AC-029-24: Saved views can be deleted
- [ ] AC-029-25: Private views are visible only to the member who created them
- [ ] AC-029-26: Household views are visible to all household members

### URL State
- [ ] AC-029-27: Active filters are encoded in the URL search params
- [ ] AC-029-28: Sharing a URL with filter params applies those filters for the recipient
- [ ] AC-029-29: Browser back/forward navigates filter history
- [ ] AC-029-30: URL updates do not cause full page reloads

### Filter Presets
- [ ] AC-029-31: "My Chores" preset filters to current user's assigned chores
- [ ] AC-029-32: "Overdue" preset filters to chores past due date and not completed
- [ ] AC-029-33: "Pending Approval" preset filters to chores awaiting parent approval
- [ ] AC-029-34: "Today's Chores" preset filters to chores scheduled for today

---

## SDD-030: Command Palette

- [ ] AC-030-01: Cmd+K (Mac) / Ctrl+K (Windows) opens the command palette
- [ ] AC-030-02: Palette shows a search input at the top
- [ ] AC-030-03: Typing filters results by chore title (fuzzy match)
- [ ] AC-030-04: Results are grouped: "Chores", "Quick Actions", "Recent"
- [ ] AC-030-05: "Chores" group shows matching chore titles with category icon
- [ ] AC-030-06: "Quick Actions" group shows: Create Chore, Go to Board, Go to Calendar, Go to List, Go to Settings
- [ ] AC-030-07: "Recent" group shows last 5 accessed chores
- [ ] AC-030-08: Arrow keys navigate between results
- [ ] AC-030-09: Enter selects the highlighted result
- [ ] AC-030-10: Selecting a chore opens its detail panel
- [ ] AC-030-11: Selecting a navigation action navigates to that view
- [ ] AC-030-12: Escape closes the palette
- [ ] AC-030-13: Clicking outside the palette closes it
- [ ] AC-030-14: Palette has semi-transparent backdrop overlay
- [ ] AC-030-15: Results update in real-time as user types (debounced 150ms)

---

## SDD-031: Enhanced Chore Detail Panel

### Panel Behavior
- [ ] AC-031-01: Panel slides in from the right side of the screen
- [ ] AC-031-02: Panel width is ~480px on desktop
- [ ] AC-031-03: Panel is full-screen on mobile (<768px)
- [ ] AC-031-04: Escape key closes the panel
- [ ] AC-031-05: Clicking outside the panel closes it (on desktop)
- [ ] AC-031-06: Panel shows a close (X) button in the header
- [ ] AC-031-07: Panel header shows the chore title (inline editable)

### Metadata Fields
- [ ] AC-031-08: Assignee field shows member avatar and name, click to change
- [ ] AC-031-09: Status field shows current status with color, click to change
- [ ] AC-031-10: Category field shows category name and icon, click to change
- [ ] AC-031-11: Priority field shows priority level, click to change
- [ ] AC-031-12: Difficulty field shows easy/medium/hard, click to change
- [ ] AC-031-13: Points field shows current point value, click to edit
- [ ] AC-031-14: Due date field shows date, click to open date picker
- [ ] AC-031-15: Estimated time field shows minutes, click to edit
- [ ] AC-031-16: All field changes save automatically (optimistic)

### Description
- [ ] AC-031-17: Description section shows chore description text
- [ ] AC-031-18: Click to enter edit mode
- [ ] AC-031-19: Auto-saves after 1 second of inactivity (debounced)

### Steps/Subtasks
- [ ] AC-031-20: Steps section integrates with existing TaskBreakdown component
- [ ] AC-031-21: Steps can be added, removed, and reordered
- [ ] AC-031-22: Each step has a checkbox to mark complete

### Comments
- [ ] AC-031-23: Comments section shows all comments in chronological order
- [ ] AC-031-24: Each comment shows member avatar, name, and relative timestamp
- [ ] AC-031-25: "Add comment" textarea at the bottom of the section
- [ ] AC-031-26: Typing "@" triggers member autocomplete dropdown
- [ ] AC-031-27: Selecting a member from autocomplete inserts their name as a mention
- [ ] AC-031-28: Rendered mentions are styled distinctly (bold/highlighted)
- [ ] AC-031-29: Own comments can be edited (click edit icon)
- [ ] AC-031-30: Own comments can be deleted (click delete icon, with confirmation)
- [ ] AC-031-31: New comments appear in real-time via Socket.io

### Attachments
- [ ] AC-031-32: Attachments section shows thumbnails for images, file icons for other types
- [ ] AC-031-33: Upload button allows file selection (images, documents)
- [ ] AC-031-34: Upload integrates with existing photo proof system when is_photo_proof=true
- [ ] AC-031-35: Clicking an image opens a lightbox preview
- [ ] AC-031-36: Delete button removes attachment (with confirmation)
- [ ] AC-031-37: File size and upload date shown for each attachment

### Activity Log
- [ ] AC-031-38: Activity section shows chronological list of changes
- [ ] AC-031-39: Each entry shows: member avatar, action description, timestamp
- [ ] AC-031-40: Actions include: created, status changed, assigned, unassigned, edited, commented, attachment added
- [ ] AC-031-41: Shows latest 5 entries by default with "Show all" button
- [ ] AC-031-42: Activity entries are non-editable (read-only audit trail)

### Accessibility
- [ ] AC-031-43: Panel has focus trap (Tab stays within panel)
- [ ] AC-031-44: Focus returns to the triggering element when panel closes
- [ ] AC-031-45: All sections are keyboard navigable
- [ ] AC-031-46: Screen reader announces panel open/close

---

## SDD-032: Automation Rules

### Rule Management
- [ ] AC-032-01: Automation page shows list of existing rules as cards
- [ ] AC-032-02: Each rule card shows: name, trigger type, enabled/disabled toggle, last triggered date
- [ ] AC-032-03: "Create Rule" button opens the rule builder
- [ ] AC-032-04: Rules can be edited by clicking the card
- [ ] AC-032-05: Rules can be deleted (with confirmation)
- [ ] AC-032-06: Rules can be enabled/disabled via toggle

### Rule Builder
- [ ] AC-032-07: Builder has a "When" section for selecting the trigger
- [ ] AC-032-08: Trigger options: chore completed, chore overdue, status changed, time-based, member joined
- [ ] AC-032-09: Builder has a "If" section for adding conditions (optional)
- [ ] AC-032-10: Conditions filter by: category, assignee, priority, difficulty
- [ ] AC-032-11: Builder has a "Then" section for selecting actions
- [ ] AC-032-12: Action options: assign chore, change status, send notification, award bonus points, create chore, escalate
- [ ] AC-032-13: Multiple actions can be added to a single rule
- [ ] AC-032-14: "Save Rule" button saves and enables the rule
- [ ] AC-032-15: "Test Rule" button dry-runs against recent events and shows results

### Rule Execution
- [ ] AC-032-16: Rules execute server-side when their trigger fires
- [ ] AC-032-17: Client receives Socket.io events showing rule execution results
- [ ] AC-032-18: Failed rule executions log an error but do not block the triggering action
- [ ] AC-032-19: Rule execution respects enabled/disabled state
- [ ] AC-032-20: Time-based rules execute on schedule (server-side cron)

---

## SDD-033: Undo/Redo

### Undo Behavior
- [ ] AC-033-01: Status changes show undo toast ("Changed to In Progress. Undo")
- [ ] AC-033-02: Assignment changes show undo toast
- [ ] AC-033-03: Priority changes show undo toast
- [ ] AC-033-04: Category changes show undo toast
- [ ] AC-033-05: Bulk operations show undo toast ("Updated 5 chores. Undo")
- [ ] AC-033-06: Chore deletion shows undo toast ("Deleted [chore title]. Undo")
- [ ] AC-033-07: Calendar reschedule shows undo toast
- [ ] AC-033-08: Clicking "Undo" in the toast reverts the change
- [ ] AC-033-09: Undo toast auto-dismisses after 5 seconds
- [ ] AC-033-10: Cmd+Z triggers undo of the most recent action

### Redo Behavior
- [ ] AC-033-11: Cmd+Shift+Z triggers redo of the last undone action
- [ ] AC-033-12: Redo stack clears when a new action is performed
- [ ] AC-033-13: Multiple consecutive undos walk back through the stack

### Stack Management
- [ ] AC-033-14: Action stack has a maximum depth of 20
- [ ] AC-033-15: Oldest actions are discarded when stack exceeds 20
- [ ] AC-033-16: Navigating away from the board clears the undo stack

### Error Handling
- [ ] AC-033-17: If undo API call fails, error toast shows "Undo failed, please try again"
- [ ] AC-033-18: Failed undo does not remove the action from the stack (can retry)

---

## Cross-Cutting Acceptance Criteria

### View Switching
- [ ] AC-CROSS-01: View switcher shows tabs: Board, Calendar, List, Dashboard
- [ ] AC-CROSS-02: Active view is highlighted
- [ ] AC-CROSS-03: Switching views preserves active filters
- [ ] AC-CROSS-04: View selection persists in localStorage
- [ ] AC-CROSS-05: View switcher shows filter count badge when filters are active

### Mobile Responsiveness
- [ ] AC-CROSS-06: Kanban board shows single-column layout on mobile (<768px)
- [ ] AC-CROSS-07: Calendar defaults to week view on mobile
- [ ] AC-CROSS-08: List view shows only title, assignee, and status columns on mobile
- [ ] AC-CROSS-09: Filter bar collapses to icon button on mobile (opens bottom sheet)
- [ ] AC-CROSS-10: Bulk action bar shows as bottom sheet on mobile
- [ ] AC-CROSS-11: Detail panel is full-screen on mobile
- [ ] AC-CROSS-12: Command palette is full-screen on mobile with large touch targets

### Performance
- [ ] AC-CROSS-13: Board renders within 200ms for up to 100 chores
- [ ] AC-CROSS-14: Calendar renders within 200ms for a month of data
- [ ] AC-CROSS-15: List view handles 500+ chores with virtual scrolling (no jank)
- [ ] AC-CROSS-16: Filter changes apply within 100ms (client-side filtering)

### Gamification Integration
- [ ] AC-CROSS-17: Moving a chore to "Done" on the board triggers point award
- [ ] AC-CROSS-18: Completing chores maintains daily streak
- [ ] AC-CROSS-19: Board completions count toward boss battle progress
- [ ] AC-CROSS-20: Badge checks run after board-triggered completions

### Real-Time
- [ ] AC-CROSS-21: Another household member's drag-drop updates the board in real-time
- [ ] AC-CROSS-22: New comments appear in real-time in the detail panel
- [ ] AC-CROSS-23: Chore creation by another member appears on the board without refresh

---

**Total Acceptance Criteria: 175**

**Document Version:** 1.0.0
**Next Review:** After Phase 15 implementation begins
