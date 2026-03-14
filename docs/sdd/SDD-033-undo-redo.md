# SDD-033: Undo/Redo System

**Status:** Draft
**Priority:** P2
**Author:** ChoreChamp Team
**Last Updated:** 2026-03-14

---

## 1. Overview

### 1.1 Purpose
Implement an undo/redo system that lets users reverse accidental changes with keyboard shortcuts (Cmd+Z / Cmd+Shift+Z) or a toast "Undo" button. This covers common destructive actions like drag-and-drop status changes on the Kanban board, assignment changes, bulk operations, and chore deletions.

### 1.2 Scope
- Client-side action stack using Zustand
- Keyboard shortcuts (Cmd+Z for undo, Cmd+Shift+Z for redo)
- Toast notification with "Undo" button on every undoable action
- Support for single and bulk operations
- API-backed revert (undo calls the appropriate API to reverse the change)
- No new database tables required

### 1.3 Research Justification
- **Accidental drag-and-drop:** Kanban boards are prone to accidental drags, especially on touch devices. Without undo, users must manually find the chore and move it back.
- **Bulk operation safety net:** Bulk status changes or reassignments affect many chores at once. A single undo that reverts the entire batch is critical.
- **Reduced anxiety:** Research on UX for family apps shows that undo capability reduces "fear of clicking" for less tech-savvy family members.

---

## 2. Supported Undoable Actions

| Action | Description | Undo Behavior | Redo Behavior |
|--------|-------------|---------------|---------------|
| `status_change` | Chore status changed (dropdown or Kanban drag) | Revert to previous status | Re-apply the new status |
| `assignment_change` | Chore reassigned to different member | Revert to previous assignee | Re-apply the new assignee |
| `priority_change` | Chore priority updated | Revert to previous priority | Re-apply the new priority |
| `category_change` | Chore category updated | Revert to previous category | Re-apply the new category |
| `bulk_operation` | Multiple chores changed at once | Revert all items in the batch | Re-apply all items in the batch |
| `chore_delete` | Chore deleted (soft delete) | Restore the chore (set is_active = true) | Re-delete (set is_active = false) |
| `reschedule` | Chore due date changed (calendar drag) | Revert to previous due date | Re-apply the new due date |

---

## 3. Architecture

### 3.1 No Database Changes

The undo/redo system is purely frontend state management. When an undo or redo fires, it calls the existing API endpoints (PATCH chore, DELETE chore, etc.) to apply or revert the change. No new database tables or columns are needed.

### 3.2 Action Stack Model

Each undoable action pushes an entry onto the action stack. The entry contains everything needed to reverse or re-apply the change.

```typescript
interface UndoableAction {
  id: string;                    // Unique action ID (nanoid)
  type: string;                  // Action type from supported list
  description: string;           // Human-readable label for the toast (e.g., "Moved 'Wash dishes' to Done")
  timestamp: number;             // When the action occurred (Date.now())
  undoFn: () => Promise<void>;   // Function that reverts the change (API call + local state)
  redoFn: () => Promise<void>;   // Function that re-applies the change (API call + local state)
}
```

### 3.3 Stack Behavior

- **Max depth:** 20 actions (configurable). When the stack exceeds max depth, the oldest action is discarded.
- **Redo clearing:** When the user performs a new undoable action, the redo stack is cleared. This follows standard undo/redo conventions (you cannot redo after making a new change).
- **Bulk operations:** A bulk operation pushes a single `UndoableAction` whose `undoFn` reverts all items and whose `redoFn` re-applies all items.

---

## 4. Implementation

### 4.1 Zustand Undo Store

```typescript
// apps/web/src/stores/undo-store.ts
import { create } from 'zustand';
import { nanoid } from 'nanoid';

interface UndoStore {
  actionStack: UndoableAction[];
  redoStack: UndoableAction[];
  maxDepth: number;

  push: (action: Omit<UndoableAction, 'id' | 'timestamp'>) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  clear: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useUndoStore = create<UndoStore>((set, get) => ({
  actionStack: [],
  redoStack: [],
  maxDepth: 20,

  push: (action) => {
    const entry: UndoableAction = {
      ...action,
      id: nanoid(),
      timestamp: Date.now(),
    };

    set(state => ({
      actionStack: [...state.actionStack, entry].slice(-state.maxDepth),
      redoStack: [], // Clear redo stack on new action
    }));
  },

  undo: async () => {
    const { actionStack } = get();
    if (actionStack.length === 0) return;

    const action = actionStack[actionStack.length - 1];

    try {
      await action.undoFn();

      set(state => ({
        actionStack: state.actionStack.slice(0, -1),
        redoStack: [...state.redoStack, action],
      }));
    } catch (error) {
      // Keep the action in the stack for retry
      console.error('Undo failed:', error);
      throw error;
    }
  },

  redo: async () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return;

    const action = redoStack[redoStack.length - 1];

    try {
      await action.redoFn();

      set(state => ({
        redoStack: state.redoStack.slice(0, -1),
        actionStack: [...state.actionStack, action].slice(-state.maxDepth),
      }));
    } catch (error) {
      console.error('Redo failed:', error);
      throw error;
    }
  },

  clear: () => set({ actionStack: [], redoStack: [] }),

  canUndo: () => get().actionStack.length > 0,

  canRedo: () => get().redoStack.length > 0,
}));
```

### 4.2 useUndoRedo Hook

This hook wraps any action with undo/redo capability. It pushes the action to the stack and shows a toast with an "Undo" button.

```typescript
// apps/web/src/hooks/useUndoRedo.ts
import { useUndoStore } from '@/stores/undo-store';
import { useToast } from '@/hooks/useToast';

interface UndoableOptions {
  type: string;
  description: string;
  undoFn: () => Promise<void>;
  redoFn: () => Promise<void>;
}

export function useUndoRedo() {
  const { push, undo, redo, canUndo, canRedo } = useUndoStore();
  const { showToast, dismissToast } = useToast();

  const execute = async (
    action: () => Promise<void>,
    options: UndoableOptions,
  ) => {
    // Execute the action
    await action();

    // Push to undo stack
    push({
      type: options.type,
      description: options.description,
      undoFn: options.undoFn,
      redoFn: options.redoFn,
    });

    // Show toast with undo button
    const toastId = showToast({
      title: options.description,
      action: {
        label: 'Undo',
        onClick: async () => {
          dismissToast(toastId);
          await undo();
        },
      },
      duration: 5000, // Auto-dismiss after 5 seconds
    });
  };

  return { execute, undo, redo, canUndo, canRedo };
}
```

### 4.3 Keyboard Shortcuts

Global keyboard shortcuts are registered at the app root level. They check for Cmd+Z (undo) and Cmd+Shift+Z (redo), and call the corresponding store methods.

```typescript
// apps/web/src/hooks/useUndoRedoShortcuts.ts
import { useEffect } from 'react';
import { useUndoStore } from '@/stores/undo-store';
import { useToast } from '@/hooks/useToast';

export function useUndoRedoShortcuts() {
  const { undo, redo, canUndo, canRedo } = useUndoStore();
  const { showToast } = useToast();

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (!isMeta || e.key !== 'z') return;

      // Skip if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      e.preventDefault();

      if (e.shiftKey) {
        // Cmd+Shift+Z = Redo
        if (!canRedo()) return;
        try {
          await redo();
        } catch {
          showToast({ title: 'Redo failed. Please try again.', variant: 'error' });
        }
      } else {
        // Cmd+Z = Undo
        if (!canUndo()) return;
        try {
          await undo();
        } catch {
          showToast({ title: 'Undo failed. Please try again.', variant: 'error' });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, showToast]);
}
```

### 4.4 Usage Example: Kanban Status Change

```typescript
// Inside KanbanBoard component, when a chore is dragged to a new column
const { execute } = useUndoRedo();

async function handleChoreDrop(choreId: string, oldStatus: string, newStatus: string) {
  await execute(
    // The action to perform
    async () => {
      await api.patch(`/households/${householdId}/chores/${choreId}`, { status: newStatus });
      updateChoreLocally(choreId, { status: newStatus });
    },
    // Undo/redo options
    {
      type: 'status_change',
      description: `Moved "${choreTitle}" to ${newStatus}`,
      undoFn: async () => {
        await api.patch(`/households/${householdId}/chores/${choreId}`, { status: oldStatus });
        updateChoreLocally(choreId, { status: oldStatus });
      },
      redoFn: async () => {
        await api.patch(`/households/${householdId}/chores/${choreId}`, { status: newStatus });
        updateChoreLocally(choreId, { status: newStatus });
      },
    },
  );
}
```

### 4.5 Usage Example: Bulk Operation

```typescript
const { execute } = useUndoRedo();

async function handleBulkStatusChange(choreIds: string[], newStatus: string) {
  // Capture old statuses before changing
  const oldStatuses = choreIds.map(id => ({
    id,
    status: getChoreStatus(id),
  }));

  await execute(
    async () => {
      await api.post(`/households/${householdId}/chores/bulk-update`, {
        choreIds,
        updates: { status: newStatus },
      });
      choreIds.forEach(id => updateChoreLocally(id, { status: newStatus }));
    },
    {
      type: 'bulk_operation',
      description: `Changed ${choreIds.length} chores to ${newStatus}`,
      undoFn: async () => {
        // Revert each chore to its original status
        for (const { id, status } of oldStatuses) {
          await api.patch(`/households/${householdId}/chores/${id}`, { status });
          updateChoreLocally(id, { status });
        }
      },
      redoFn: async () => {
        await api.post(`/households/${householdId}/chores/bulk-update`, {
          choreIds,
          updates: { status: newStatus },
        });
        choreIds.forEach(id => updateChoreLocally(id, { status: newStatus }));
      },
    },
  );
}
```

### 4.6 Usage Example: Chore Deletion (Soft Delete)

```typescript
const { execute } = useUndoRedo();

async function handleDeleteChore(choreId: string, choreTitle: string) {
  await execute(
    async () => {
      await api.delete(`/households/${householdId}/chores/${choreId}`);
      removeChoreLocally(choreId);
    },
    {
      type: 'chore_delete',
      description: `Deleted "${choreTitle}"`,
      undoFn: async () => {
        // Restore: PATCH is_active back to true
        await api.patch(`/households/${householdId}/chores/${choreId}/restore`, {});
        refetchChores();
      },
      redoFn: async () => {
        await api.delete(`/households/${householdId}/chores/${choreId}`);
        removeChoreLocally(choreId);
      },
    },
  );
}
```

---

## 5. Components

No new visual components are created. The system integrates with existing infrastructure:

| Integration Point | How It Connects |
|-------------------|-----------------|
| Existing toast system | "Undo" button rendered inside toast notifications |
| KanbanBoard | Drag-and-drop handler wrapped with `useUndoRedo().execute()` |
| ChoreDetailPanel (SDD-031) | Field changes wrapped with `useUndoRedo().execute()` |
| CalendarView | Reschedule drag wrapped with `useUndoRedo().execute()` |
| BulkActions toolbar | Bulk operations wrapped with `useUndoRedo().execute()` |
| App root layout | `useUndoRedoShortcuts()` registered once at the top level |

---

## 6. Error Handling

### 6.1 Undo API Failure

If the undo API call fails (network error, 409 conflict, 404 chore already permanently deleted), the system:

1. Shows an error toast: "Undo failed. Please try again."
2. Keeps the action in the stack so the user can retry
3. Does not revert local state (local state only updates on API success)

### 6.2 Stale State

If another household member changed the same chore between the original action and the undo attempt, the API may return a conflict. The undo will fail gracefully, and the user sees the error toast. The chore's current state is re-fetched to show the latest data.

### 6.3 Expired Actions

Actions older than 10 minutes are automatically removed from the stack on the next `push()` call. This prevents confusing undo behavior where reverting a change made 30 minutes ago could conflict with many subsequent changes.

```typescript
// Inside push(), before adding the new action:
const TEN_MINUTES = 10 * 60 * 1000;
const now = Date.now();
const freshStack = state.actionStack.filter(a => now - a.timestamp < TEN_MINUTES);
```

### 6.4 Error Codes

| Scenario | User-Facing Message | Recovery |
|----------|---------------------|----------|
| Network failure on undo | "Undo failed. Check your connection and try again." | Retry via Cmd+Z or toast button |
| Chore no longer exists (410/404) | "This chore was permanently deleted and cannot be restored." | Remove action from stack |
| Conflict (409) | "This chore was changed by another household member. Refreshing." | Re-fetch chore data, remove action from stack |
| Unknown server error (500) | "Something went wrong. Please try again." | Keep action in stack for retry |

---

## 7. Edge Cases

| Edge Case | Behavior |
|-----------|----------|
| User undoes while offline | Queue the undo request; apply when back online. Show "pending" state in toast. |
| Multiple rapid Cmd+Z presses | Each press pops one action. Debounce is not applied (undo should feel instant). |
| Undo after navigating away | Stack persists in Zustand (memory). Navigating to a different page does not clear the stack. Full page reload does clear it. |
| Undo a bulk op that included a now-deleted chore | Skip the deleted chore in the revert loop, show a warning: "1 of 5 chores could not be restored." |
| Input field focused when Cmd+Z pressed | Native browser undo takes precedence (text input undo). The app-level undo does not fire. |

---

## 8. Testing Strategy

### 8.1 Unit Tests
- `useUndoStore.push`: verify action added to stack, redo stack cleared, max depth enforced
- `useUndoStore.undo`: verify last action removed from action stack and added to redo stack, undoFn called
- `useUndoStore.redo`: verify last action removed from redo stack and added to action stack, redoFn called
- `useUndoStore.clear`: verify both stacks emptied
- Expired action cleanup: verify actions older than 10 minutes are pruned on push
- Stack overflow: verify oldest action dropped when max depth exceeded

### 8.2 Integration Tests
- Status change undo: change status via API, undo, verify API called with old status
- Bulk operation undo: bulk change 3 chores, undo, verify all 3 reverted
- Chore delete undo: soft-delete chore, undo, verify restore API called
- Redo after undo: change status, undo, redo, verify final state matches original change
- New action clears redo: change status, undo, make a different change, verify redo stack empty

### 8.3 Component Tests
- Toast renders with "Undo" button after undoable action
- Toast auto-dismisses after 5 seconds
- Clicking "Undo" button calls undo and dismisses toast
- Error toast renders when undo fails

### 8.4 E2E Tests
- Drag a chore on Kanban board, press Cmd+Z, verify chore returns to original column
- Delete a chore, click "Undo" in toast, verify chore reappears
- Perform 3 undoable actions, press Cmd+Z three times, verify all three reversed in correct order
- Press Cmd+Shift+Z after undo, verify action re-applied
- Verify Cmd+Z in a text input does NOT trigger app-level undo

---

**Document Version:** 1.0.0
**Next Review:** After implementation sprint
