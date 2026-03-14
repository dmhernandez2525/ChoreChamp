# SDD-028: Multi-Select and Bulk Operations

**Status:** Draft
**Priority:** P2 (Enhancement)
**Author:** ChoreChamp Team
**Last Updated:** 2026-03-14

---

## 1. Overview

### 1.1 Purpose
Enable household members to select multiple chores at once and perform batch operations, reducing repetitive clicks when managing large numbers of chores across Kanban, Calendar, and List views.

### 1.2 Scope
- Multi-select interaction model (click, Cmd+click, Shift+click, Select All)
- Floating bulk action bar UI
- Bulk assign, status change, category change, priority change, reschedule, and delete
- Confirmation dialog for destructive actions
- Optimistic UI with rollback on failure
- Undo support for the last bulk action

### 1.3 Research Justification
- **Batch operations reduce friction:** Households with many chores (10+) need fast ways to reassign or reschedule after routine changes (vacation, illness, new school schedule)
- **Standard UX pattern:** Gmail, Trello, and Notion all use multi-select with floating action bars; users already understand the interaction model
- **Parent workflow:** Parents frequently need to reassign all of one child's chores to another (grounding, reward, schedule swap)

---

## 2. Database Schema

No new database tables are required. Bulk operations target the existing `chores` table (see SDD-003) and execute updates transactionally against multiple rows.

---

## 3. Selection Model

### 3.1 Interaction Patterns

| Gesture | Behavior |
|---------|----------|
| Click on chore checkbox | Toggle that chore's selection on/off |
| Cmd+Click (Mac) / Ctrl+Click (Win) | Additive toggle without deselecting others |
| Shift+Click | Range select from last-clicked to current item, inclusive |
| Select All checkbox (header) | Toggle all visible chores on/off |
| Escape key | Deselect all and dismiss the action bar |

### 3.2 Selection Rules
- Selection is scoped to the current view and active filters. Selecting "all" means all chores matching the current filter, not every chore in the household.
- Selection state persists across page scrolling but clears on navigation to a different view.
- Maximum selection limit: 100 chores per bulk operation to prevent accidental mass updates.
- Chores the current member lacks permission to modify are visually disabled and cannot be selected.

---

## 4. API Endpoints

### 4.1 Bulk Update

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/households/:id/chores/bulk-update` | Apply a single action to multiple chores | Parent |

**Request Body:**
```typescript
interface BulkUpdateRequest {
  choreIds: string[];           // UUIDs, max 100
  action: BulkAction;           // The operation to perform
  payload: BulkActionPayload;   // Action-specific data
}

type BulkAction =
  | 'assign'
  | 'change_status'
  | 'change_category'
  | 'change_priority'
  | 'reschedule';

type BulkActionPayload =
  | { assignedTo: string[] }                        // assign
  | { status: 'active' | 'paused' | 'archived' }   // change_status
  | { category: string }                            // change_category
  | { difficulty: 'easy' | 'medium' | 'hard' }     // change_priority
  | { dueDate: string; dueTime?: string }           // reschedule
```

**Response:**
```typescript
interface BulkUpdateResponse {
  updated: number;       // Count of successfully updated chores
  failed: string[];      // IDs of chores that could not be updated
  errors: Array<{
    choreId: string;
    reason: string;
  }>;
}
```

### 4.2 Bulk Delete

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| DELETE | `/api/households/:id/chores/bulk-delete` | Delete multiple chores | Parent |

**Request Body:**
```typescript
interface BulkDeleteRequest {
  choreIds: string[];          // UUIDs, max 100
  confirmationToken: string;   // Client-generated token confirming user intent
}
```

The `confirmationToken` is a short-lived token generated client-side when the user confirms the delete dialog. The server validates that the token was issued within the last 60 seconds to prevent stale or replayed delete requests.

**Response:**
```typescript
interface BulkDeleteResponse {
  deleted: number;
  failed: string[];
}
```

---

## 5. Business Logic

### 5.1 Bulk Update Service

```typescript
// apps/api/src/services/bulk-action.service.ts
export class BulkActionService {
  async bulkUpdate(
    householdId: string,
    userId: string,
    request: BulkUpdateRequest
  ): Promise<BulkUpdateResponse> {
    await this.verifyParentAccess(householdId, userId);

    if (request.choreIds.length > 100) {
      throw new BadRequestError('Cannot update more than 100 chores at once');
    }

    const results: BulkUpdateResponse = {
      updated: 0,
      failed: [],
      errors: [],
    };

    // Run all updates in a single transaction
    await db.transaction(async (tx) => {
      for (const choreId of request.choreIds) {
        try {
          const updateData = this.buildUpdatePayload(request.action, request.payload);

          await tx.update(chores)
            .set({ ...updateData, updatedAt: new Date() })
            .where(
              and(
                eq(chores.id, choreId),
                eq(chores.householdId, householdId)
              )
            );

          results.updated++;

          // Emit individual event per chore for real-time subscribers
          this.emitToHousehold(householdId, 'chore:updated', { choreId, ...updateData });
        } catch (error) {
          results.failed.push(choreId);
          results.errors.push({ choreId, reason: error.message });
        }
      }
    });

    return results;
  }

  private buildUpdatePayload(action: BulkAction, payload: BulkActionPayload): Partial<Chore> {
    const handlers: Record<BulkAction, () => Partial<Chore>> = {
      assign: () => ({ assignedTo: payload.assignedTo }),
      change_status: () => ({ isActive: payload.status === 'active' }),
      change_category: () => ({ category: payload.category }),
      change_priority: () => ({ difficulty: payload.difficulty }),
      reschedule: () => ({
        startDate: new Date(payload.dueDate),
        dueTime: payload.dueTime ?? null,
      }),
    };

    const handler = handlers[action];
    if (!handler) throw new BadRequestError(`Unknown bulk action: ${action}`);
    return handler();
  }

  async bulkDelete(
    householdId: string,
    userId: string,
    request: BulkDeleteRequest
  ): Promise<BulkDeleteResponse> {
    await this.verifyParentAccess(householdId, userId);
    this.validateConfirmationToken(request.confirmationToken);

    if (request.choreIds.length > 100) {
      throw new BadRequestError('Cannot delete more than 100 chores at once');
    }

    const results: BulkDeleteResponse = { deleted: 0, failed: [] };

    await db.transaction(async (tx) => {
      for (const choreId of request.choreIds) {
        try {
          await tx.delete(chores)
            .where(
              and(
                eq(chores.id, choreId),
                eq(chores.householdId, householdId)
              )
            );
          results.deleted++;
          this.emitToHousehold(householdId, 'chore:deleted', { choreId });
        } catch (error) {
          results.failed.push(choreId);
        }
      }
    });

    return results;
  }
}
```

---

## 6. State Management

### 6.1 Bulk Action Store (Zustand)

```typescript
// apps/web/src/stores/bulk-action-store.ts
import { create } from 'zustand';

interface BulkActionState {
  selectedIds: Set<string>;
  selectionMode: 'none' | 'single' | 'range';
  lastClickedId: string | null;
  lastAction: {
    type: BulkAction | 'delete';
    choreIds: string[];
    previousValues: Record<string, Partial<Chore>>;
  } | null;

  // Actions
  toggleSelection: (id: string) => void;
  addToSelection: (id: string) => void;
  rangeSelect: (id: string, allVisibleIds: string[]) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
  setLastAction: (action: BulkActionState['lastAction']) => void;
  clearLastAction: () => void;
}

export const useBulkActionStore = create<BulkActionState>((set, get) => ({
  selectedIds: new Set(),
  selectionMode: 'none',
  lastClickedId: null,
  lastAction: null,

  toggleSelection: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return {
        selectedIds: next,
        selectionMode: next.size > 0 ? 'single' : 'none',
        lastClickedId: id,
      };
    }),

  addToSelection: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      next.add(id);
      return { selectedIds: next, selectionMode: 'single', lastClickedId: id };
    }),

  rangeSelect: (id, allVisibleIds) =>
    set((state) => {
      const lastIndex = allVisibleIds.indexOf(state.lastClickedId ?? '');
      const currentIndex = allVisibleIds.indexOf(id);
      if (lastIndex === -1 || currentIndex === -1) return state;

      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);
      const next = new Set(state.selectedIds);
      for (let i = start; i <= end; i++) {
        next.add(allVisibleIds[i]);
      }
      return { selectedIds: next, selectionMode: 'range', lastClickedId: id };
    }),

  selectAll: (ids) =>
    set({ selectedIds: new Set(ids), selectionMode: 'single' }),

  deselectAll: () =>
    set({ selectedIds: new Set(), selectionMode: 'none', lastClickedId: null }),

  setLastAction: (action) => set({ lastAction: action }),
  clearLastAction: () => set({ lastAction: null }),
}));
```

---

## 7. Components

### 7.1 useMultiSelect Hook

```typescript
// apps/web/src/hooks/useMultiSelect.ts
export function useMultiSelect(allVisibleIds: string[]) {
  const store = useBulkActionStore();

  const handleClick = useCallback(
    (id: string, event: React.MouseEvent) => {
      if (event.shiftKey && store.lastClickedId) {
        store.rangeSelect(id, allVisibleIds);
      } else if (event.metaKey || event.ctrlKey) {
        store.addToSelection(id);
      } else {
        store.toggleSelection(id);
      }
    },
    [allVisibleIds, store]
  );

  const handleSelectAll = useCallback(() => {
    if (store.selectedIds.size === allVisibleIds.length) {
      store.deselectAll();
    } else {
      store.selectAll(allVisibleIds);
    }
  }, [allVisibleIds, store]);

  return {
    selectedIds: store.selectedIds,
    handleClick,
    handleSelectAll,
    isAllSelected: store.selectedIds.size === allVisibleIds.length,
    selectedCount: store.selectedIds.size,
    hasSelection: store.selectedIds.size > 0,
  };
}
```

### 7.2 BulkActionBar Component

```typescript
// apps/web/src/components/chores/BulkActionBar.tsx
export function BulkActionBar() {
  const { selectedIds, deselectAll, setLastAction } = useBulkActionStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (selectedIds.size === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                    bg-white dark:bg-gray-800 rounded-xl shadow-2xl border
                    px-6 py-3 flex items-center gap-4">
      <span className="text-sm font-medium">
        {selectedIds.size} selected
      </span>

      <div className="h-6 w-px bg-gray-200" />

      <ActionButton icon={UserIcon} label="Assign" onClick={handleAssign} />
      <ActionButton icon={TagIcon} label="Category" onClick={handleCategory} />
      <ActionButton icon={FlagIcon} label="Priority" onClick={handlePriority} />
      <ActionButton icon={CalendarIcon} label="Reschedule" onClick={handleReschedule} />
      <ActionButton icon={ArchiveIcon} label="Archive" onClick={handleArchive} />

      <div className="h-6 w-px bg-gray-200" />

      <ActionButton
        icon={TrashIcon}
        label="Delete"
        variant="destructive"
        onClick={() => setShowDeleteConfirm(true)}
      />

      <button onClick={deselectAll} className="ml-2 text-gray-400 hover:text-gray-600">
        <XIcon className="w-4 h-4" />
      </button>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Chores"
          message={`Are you sure you want to delete ${selectedIds.size} chore(s)? This cannot be undone.`}
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={handleBulkDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
```

### 7.3 Optimistic UI Flow

```typescript
// apps/web/src/hooks/useBulkUpdate.ts
export function useBulkUpdate(householdId: string) {
  const queryClient = useQueryClient();
  const { setLastAction } = useBulkActionStore();

  return useMutation({
    mutationFn: (request: BulkUpdateRequest) =>
      api.post(`/households/${householdId}/chores/bulk-update`, request),

    onMutate: async (request) => {
      await queryClient.cancelQueries({ queryKey: ['chores', householdId] });

      const previousChores = queryClient.getQueryData(['chores', householdId]);

      // Optimistically apply changes
      queryClient.setQueryData(['chores', householdId], (old: Chore[]) =>
        old.map((chore) => {
          if (!request.choreIds.includes(chore.id)) return chore;
          return { ...chore, ...buildOptimisticUpdate(request.action, request.payload) };
        })
      );

      // Store previous values for undo
      setLastAction({
        type: request.action,
        choreIds: request.choreIds,
        previousValues: extractPreviousValues(previousChores, request.choreIds),
      });

      return { previousChores };
    },

    onError: (_err, _variables, context) => {
      // Rollback on failure
      if (context?.previousChores) {
        queryClient.setQueryData(['chores', householdId], context.previousChores);
      }
      toast.error('Bulk update failed. Changes have been reverted.');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chores', householdId] });
    },
  });
}
```

---

## 8. Real-Time Events

Bulk operations do not emit a single "bulk" event. Instead, each updated chore emits its own `chore:updated` or `chore:deleted` event so that other connected clients can update their local state granularly without needing to know the bulk operation context.

| Event | Payload | Emitted Per |
|-------|---------|-------------|
| `chore:updated` | `{ choreId, ...updatedFields }` | Each chore in the bulk update |
| `chore:deleted` | `{ choreId }` | Each chore in the bulk delete |

---

## 9. Error Handling

| Error Code | Message | HTTP Status |
|------------|---------|-------------|
| `BULK_LIMIT_EXCEEDED` | Cannot operate on more than 100 chores at once | 400 |
| `BULK_INVALID_ACTION` | Unknown bulk action type | 400 |
| `BULK_PARTIAL_FAILURE` | Some chores could not be updated (see response) | 207 |
| `INVALID_CONFIRMATION_TOKEN` | Confirmation token is missing or expired | 400 |
| `CHORE_NOT_FOUND` | One or more chore IDs do not exist | 404 |
| `INSUFFICIENT_PERMISSIONS` | Only parents can perform bulk operations | 403 |

---

## 10. Testing Strategy

### 10.1 Unit Tests
- `useMultiSelect` hook: verify click, Cmd+click, Shift+click, and Select All logic
- `BulkActionStore`: verify selection toggling, range selection, deselect all, and lastAction tracking
- `buildUpdatePayload`: verify correct mapping for each `BulkAction` type
- Confirmation token generation and expiry validation

### 10.2 Integration Tests
- `POST /api/households/:id/chores/bulk-update`: verify all five action types apply correctly to multiple chores
- `DELETE /api/households/:id/chores/bulk-delete`: verify deletion with valid token, rejection with expired token
- Transaction rollback: verify that if one chore fails, all updates in the batch still succeed (partial failure, not full rollback)
- Permission checks: verify child members cannot perform bulk operations

### 10.3 End-to-End Tests
- Select 3 chores via click, reassign via bulk bar, verify updated assignees in the list
- Shift+click range select across 10 chores, change category, verify all updated
- Bulk delete with confirmation dialog, verify chores removed from view
- Optimistic UI: simulate network delay, verify changes appear instantly, then persist
- Undo: perform bulk action, click undo in toast, verify chores revert to previous state

---

**Document Version:** 1.0.0
**Next Review:** After Phase 2 implementation
