# SDD-025: Kanban Board View

**Status:** Draft
**Priority:** P1 (Enhancement)
**Author:** ChoreChamp Team
**Last Updated:** 2026-03-14

---

## 1. Overview

### 1.1 Purpose
Provide a visual drag-and-drop board for managing chores across status columns, giving household members an intuitive way to track chore progress from assignment through verification. The board supports multiple grouping modes so parents can view chores organized by member, category, priority, or due date.

### 1.2 Scope
- Drag-and-drop chore cards between status columns
- Status columns: To Do, In Progress, Done, Verified (maps to `chore_completions.status`)
- Grouping modes: by member, by category, by priority, by due date
- Configurable WIP (work-in-progress) limits per column
- Column color customization
- Persistent board preferences per member
- Real-time updates when other household members move cards
- Bulk reorder support

### 1.3 Research Justification
- **Visual task management:** Kanban-style boards are proven to reduce cognitive load when managing multiple tasks across a household
- **Drag-and-drop interaction:** Preferred by families over dropdown-based status changes (reduces clicks by ~60%)
- **WIP limits:** Prevents children from overcommitting, a common complaint in household chore apps without guardrails

---

## 2. Database Schema

### 2.1 Chore Board Preferences Table

```typescript
// packages/db/src/schema/choreBoardPreferences.ts
import { pgTable, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { households } from './households';
import { members } from './members';

export const choreBoardPreferences = pgTable('chore_board_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),

  // Display preferences
  viewMode: varchar('view_mode', { length: 20 }).default('board').notNull(),
  // 'board' | 'compact' | 'detailed'

  columnSettings: jsonb('column_settings').$type<{
    todo: { color: string; wipLimit: number | null; collapsed: boolean };
    inProgress: { color: string; wipLimit: number | null; collapsed: boolean };
    done: { color: string; wipLimit: number | null; collapsed: boolean };
    verified: { color: string; wipLimit: number | null; collapsed: boolean };
  }>().default({
    todo: { color: '#6B7280', wipLimit: null, collapsed: false },
    inProgress: { color: '#3B82F6', wipLimit: 3, collapsed: false },
    done: { color: '#10B981', wipLimit: null, collapsed: false },
    verified: { color: '#8B5CF6', wipLimit: null, collapsed: false },
  }),

  savedFilters: jsonb('saved_filters').$type<{
    name: string;
    filters: {
      assignees?: string[];
      categories?: string[];
      priorities?: string[];
      dateRange?: { start: string; end: string };
    };
  }[]>().default([]),

  defaultGroupBy: varchar('default_group_by', { length: 20 }).default('none'),
  // 'none' | 'member' | 'category' | 'priority' | 'dueDate'

  defaultSort: varchar('default_sort', { length: 20 }).default('dueDate'),
  // 'dueDate' | 'priority' | 'title' | 'points' | 'manual'

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
```

### 2.2 Indexes

```sql
CREATE UNIQUE INDEX idx_board_prefs_member ON chore_board_preferences(household_id, member_id);
```

---

## 3. API Endpoints

### 3.1 Board Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/households/:id/board` | Get board data (chores grouped by status) | Member |
| PATCH | `/api/households/:id/board/preferences` | Update board preferences | Member |
| POST | `/api/households/:id/chores/bulk-reorder` | Reorder chores within/between columns | Member |

### 3.2 Request/Response Schemas

#### GET /api/households/:id/board

Query parameters:
- `groupBy` (optional): `member` | `category` | `priority` | `dueDate`
- `assignee` (optional): member UUID filter
- `category` (optional): category slug filter
- `dateFrom` (optional): ISO date string
- `dateTo` (optional): ISO date string

```typescript
// Response
interface BoardResponse {
  columns: {
    id: 'todo' | 'inProgress' | 'done' | 'verified';
    label: string;
    color: string;
    wipLimit: number | null;
    chores: BoardChoreCard[];
  }[];
  swimlanes?: {
    id: string;
    label: string;
    columns: BoardResponse['columns'];
  }[];
  preferences: ChoreBoardPreferences;
}

interface BoardChoreCard {
  id: string;
  title: string;
  icon: string;
  category: string;
  assignees: { id: string; name: string; avatarUrl: string | null }[];
  difficulty: 'easy' | 'medium' | 'hard';
  pointValue: number;
  dueDate: string | null;
  dueTime: string | null;
  isOverdue: boolean;
  completionId: string | null;
  photoUrl: string | null;
  sortOrder: number;
}
```

#### POST /api/households/:id/chores/bulk-reorder

```typescript
interface BulkReorderRequest {
  moves: {
    choreId: string;
    fromColumn: string;
    toColumn: string;
    newIndex: number;
  }[];
}
```

---

## 4. Component Design

### 4.1 Component Tree

```
KanbanBoard
  +-- BoardToolbar
  |     +-- GroupBySelector
  |     +-- FilterDropdown
  |     +-- ViewModeToggle (board / compact / detailed)
  |     +-- ColumnSettingsButton
  +-- KanbanSwimlane (one per group when groupBy is active)
  |     +-- SwimlaneHeader (label, chore count, collapse toggle)
  |     +-- KanbanColumn (To Do | In Progress | Done | Verified)
  |           +-- ColumnHeader (title, count, WIP indicator, color dot)
  |           +-- SortableContext (@dnd-kit)
  |           |     +-- KanbanCard (draggable)
  |           |           +-- CardAvatar (assignee)
  |           |           +-- CardTitle
  |           |           +-- CardMeta (category badge, points, due date)
  |           |           +-- CardActions (quick-complete, details)
  |           +-- ColumnFooter (+ Add Chore button)
  +-- DndContext (@dnd-kit)
  +-- DragOverlay (ghost card shown during drag)
```

### 4.2 Key Components

```typescript
// apps/web/src/components/board/KanbanBoard.tsx
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

interface KanbanBoardProps {
  householdId: string;
}

export function KanbanBoard({ householdId }: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { columns, swimlanes, preferences } = useBoardData(householdId);
  const { moveChore, reorderChore } = useBoardMutations(householdId);
  const [activeCard, setActiveCard] = useState<BoardChoreCard | null>(null);

  function handleDragStart(event: DragStartEvent) {
    const card = findCardById(event.active.id as string);
    setActiveCard(card ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const fromColumn = getColumnForCard(active.id as string);
    const toColumn = getColumnFromDroppable(over.id as string);

    if (fromColumn === toColumn) {
      reorderChore(active.id as string, over.id as string, toColumn);
    } else {
      moveChore(active.id as string, fromColumn, toColumn, over.id as string);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <BoardToolbar householdId={householdId} preferences={preferences} />
      <div className="flex gap-4 overflow-x-auto p-4">
        {columns.map((column) => (
          <KanbanColumn key={column.id} column={column} />
        ))}
      </div>
      <DragOverlay>
        {activeCard ? <KanbanCard card={activeCard} isDragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
```

### 4.3 KanbanCard Component

```typescript
// apps/web/src/components/board/KanbanCard.tsx
interface KanbanCardProps {
  card: BoardChoreCard;
  isDragOverlay?: boolean;
}

export function KanbanCard({ card, isDragOverlay }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'rounded-lg border bg-white p-3 shadow-sm cursor-grab',
        isDragOverlay && 'shadow-lg rotate-2',
        card.isOverdue && 'border-red-300 bg-red-50',
      )}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg">{card.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{card.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <CategoryBadge category={card.category} />
            <span className="text-xs text-gray-500">{card.pointValue} pts</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <AvatarGroup assignees={card.assignees} size="xs" />
        {card.dueDate && (
          <DueDateBadge date={card.dueDate} isOverdue={card.isOverdue} />
        )}
      </div>
    </div>
  );
}
```

---

## 5. State Management

### 5.1 Zustand View Store

```typescript
// apps/web/src/stores/viewStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ViewStoreState {
  viewMode: 'board' | 'compact' | 'detailed';
  filters: {
    assignees: string[];
    categories: string[];
    priorities: string[];
    dateRange: { start: string; end: string } | null;
  };
  sort: 'dueDate' | 'priority' | 'title' | 'points' | 'manual';
  groupBy: 'none' | 'member' | 'category' | 'priority' | 'dueDate';
  selectedIds: string[];
}

interface ViewStoreActions {
  setViewMode: (mode: ViewStoreState['viewMode']) => void;
  setFilter: <K extends keyof ViewStoreState['filters']>(
    key: K,
    value: ViewStoreState['filters'][K],
  ) => void;
  clearFilters: () => void;
  setSort: (sort: ViewStoreState['sort']) => void;
  setGroupBy: (groupBy: ViewStoreState['groupBy']) => void;
  toggleSelected: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
}

export const useViewStore = create<ViewStoreState & ViewStoreActions>()(
  persist(
    (set) => ({
      viewMode: 'board',
      filters: {
        assignees: [],
        categories: [],
        priorities: [],
        dateRange: null,
      },
      sort: 'dueDate',
      groupBy: 'none',
      selectedIds: [],

      setViewMode: (viewMode) => set({ viewMode }),
      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),
      clearFilters: () =>
        set({
          filters: { assignees: [], categories: [], priorities: [], dateRange: null },
        }),
      setSort: (sort) => set({ sort }),
      setGroupBy: (groupBy) => set({ groupBy }),
      toggleSelected: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((s) => s !== id)
            : [...state.selectedIds, id],
        })),
      selectAll: (ids) => set({ selectedIds: ids }),
      clearSelection: () => set({ selectedIds: [] }),
    }),
    { name: 'chorechamp-view-store' },
  ),
);
```

---

## 6. Business Logic

### 6.1 Column Status Mapping

```typescript
const COLUMN_STATUS_MAP: Record<string, string> = {
  todo: 'unstarted',
  inProgress: 'in_progress',
  done: 'pending',     // Completion submitted, awaiting approval
  verified: 'approved', // Parent approved the completion
};

const STATUS_COLUMN_MAP: Record<string, string> = {
  unstarted: 'todo',
  in_progress: 'inProgress',
  pending: 'done',
  approved: 'verified',
};
```

### 6.2 WIP Limit Enforcement

```typescript
function canMoveToColumn(
  column: BoardColumn,
  settings: ColumnSettings,
): boolean {
  if (!settings.wipLimit) return true;
  return column.chores.length < settings.wipLimit;
}

function getWipStatus(column: BoardColumn, settings: ColumnSettings) {
  if (!settings.wipLimit) return 'none';
  const ratio = column.chores.length / settings.wipLimit;
  if (ratio >= 1) return 'exceeded';
  if (ratio >= 0.8) return 'warning';
  return 'ok';
}
```

### 6.3 Drag-and-Drop Move Handler

```typescript
async function handleCardMove(
  choreId: string,
  fromColumn: string,
  toColumn: string,
  householdId: string,
  memberId: string,
) {
  const targetStatus = COLUMN_STATUS_MAP[toColumn];

  // Moving to "Done" triggers a completion
  if (toColumn === 'done' && fromColumn !== 'done') {
    await choreService.completeChore(householdId, choreId, memberId, {
      scheduledDate: new Date().toISOString().split('T')[0],
    });
    return;
  }

  // Moving to "Verified" triggers approval (parent only)
  if (toColumn === 'verified' && fromColumn === 'done') {
    const completion = await getLatestCompletion(choreId);
    await choreService.approveCompletion(householdId, completion.id, memberId);
    return;
  }

  // Moving back from "Done" to "In Progress" rejects/reverts
  if (fromColumn === 'done' && toColumn === 'inProgress') {
    const completion = await getLatestCompletion(choreId);
    await choreService.rejectCompletion(householdId, completion.id, memberId, {
      reason: 'Moved back to In Progress',
    });
    return;
  }

  // Simple status update for other moves
  await choreService.updateChoreStatus(householdId, choreId, targetStatus);
}
```

### 6.4 Grouping Logic

```typescript
function groupChores(
  chores: BoardChoreCard[],
  groupBy: string,
): Map<string, BoardChoreCard[]> {
  const groups = new Map<string, BoardChoreCard[]>();

  const groupKeyFns: Record<string, (c: BoardChoreCard) => string> = {
    member: (c) => c.assignees[0]?.id ?? 'unassigned',
    category: (c) => c.category,
    priority: (c) => c.difficulty,
    dueDate: (c) => c.dueDate ?? 'no-date',
  };

  const keyFn = groupKeyFns[groupBy];
  if (!keyFn) return groups;

  for (const chore of chores) {
    const key = keyFn(chore);
    const existing = groups.get(key) ?? [];
    existing.push(chore);
    groups.set(key, existing);
  }

  return groups;
}
```

---

## 7. Real-Time Events

| Event | Payload | Description |
|-------|---------|-------------|
| `board:card:moved` | `{ choreId, fromColumn, toColumn, memberId, newIndex }` | Card dragged between columns |
| `board:card:reordered` | `{ choreId, column, newIndex }` | Card reordered within same column |
| `board:preferences:updated` | `{ memberId, preferences }` | Board preferences changed |
| `chore:completed` | `{ completion, chore, memberId }` | Chore marked complete (moves to Done) |
| `completion:approved` | `{ completionId, memberId, points }` | Completion approved (moves to Verified) |
| `completion:rejected` | `{ completionId, memberId, reason }` | Completion rejected (moves back) |

### 7.1 Optimistic Updates

```typescript
// Apply move immediately on the client, then sync with server
function useBoardMutations(householdId: string) {
  const queryClient = useQueryClient();

  const moveChore = useMutation({
    mutationFn: (data: MoveChoreRequest) =>
      api.post(`/households/${householdId}/chores/bulk-reorder`, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries(['board', householdId]);
      const previous = queryClient.getQueryData(['board', householdId]);
      // Optimistically update the board state
      queryClient.setQueryData(['board', householdId], (old: BoardResponse) =>
        applyOptimisticMove(old, data),
      );
      return { previous };
    },
    onError: (_err, _data, context) => {
      // Revert on failure
      queryClient.setQueryData(['board', householdId], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['board', householdId]);
    },
  });

  return { moveChore };
}
```

### 7.2 Socket.io Listener

```typescript
useEffect(() => {
  const socket = getHouseholdSocket(householdId);

  socket.on('board:card:moved', (payload) => {
    // Skip if this client initiated the move (already applied optimistically)
    if (payload.memberId === currentMemberId) return;
    queryClient.invalidateQueries(['board', householdId]);
  });

  socket.on('board:card:reordered', (payload) => {
    if (payload.memberId === currentMemberId) return;
    queryClient.invalidateQueries(['board', householdId]);
  });

  return () => {
    socket.off('board:card:moved');
    socket.off('board:card:reordered');
  };
}, [householdId]);
```

---

## 8. Error Handling

| Error Code | Message | HTTP Status |
|------------|---------|-------------|
| `BOARD_WIP_LIMIT_EXCEEDED` | Column has reached its work-in-progress limit | 422 |
| `BOARD_INVALID_COLUMN` | Target column does not exist | 400 |
| `BOARD_MOVE_NOT_ALLOWED` | Cannot move chore to this status (permission or workflow violation) | 403 |
| `BOARD_CHORE_NOT_FOUND` | Chore not found on board | 404 |
| `BOARD_PREFERENCES_INVALID` | Invalid board preference configuration | 400 |
| `BOARD_CONCURRENT_MOVE` | Chore was moved by another member, please refresh | 409 |

---

## 9. Testing Strategy

### 9.1 Unit Tests
- `groupChores()` correctly buckets chores by member, category, priority, due date
- `canMoveToColumn()` enforces WIP limits
- `getWipStatus()` returns correct status for each threshold
- Column status mapping is bidirectional and consistent
- Points calculation on column transitions

### 9.2 Integration Tests
- GET `/api/households/:id/board` returns correctly structured columns
- POST `/api/households/:id/chores/bulk-reorder` updates chore positions
- PATCH `/api/households/:id/board/preferences` persists and returns updated prefs
- Moving a card to "Done" column creates a chore completion record
- Moving a card to "Verified" column triggers approval workflow
- WIP limit returns 422 when exceeded

### 9.3 Component Tests
- KanbanBoard renders all four columns with correct headers
- KanbanCard displays chore title, category badge, assignee avatars, due date
- Drag-and-drop moves card between columns (mock DndContext)
- WIP limit indicator shows warning/exceeded states
- GroupBySelector changes swimlane rendering
- Filter dropdown filters cards by assignee, category, priority
- Overdue cards show red border styling

### 9.4 E2E Tests
- Full drag-and-drop workflow: drag card from To Do to In Progress to Done
- Parent drags card from Done to Verified (approval flow)
- Two members see real-time updates when one moves a card
- Board preferences persist across page reloads
- Column color customization saves and displays correctly

---

> **Attribution:** Ported from Command Center UI project management views.

---

**Document Version:** 1.0.0
**Next Review:** After view implementation sprint
