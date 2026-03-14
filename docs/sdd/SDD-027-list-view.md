# SDD-027: Sortable Table View

**Status:** Draft
**Priority:** P1 (Enhancement)
**Author:** ChoreChamp Team
**Last Updated:** 2026-03-14

---

## 1. Overview

### 1.1 Purpose
Provide a spreadsheet-style sortable, filterable table of all household chores with inline editing, keyboard navigation, and virtual scrolling. This view is optimized for parents who need to quickly scan, sort, bulk-edit, and manage large numbers of chores.

### 1.2 Scope
- Full-featured data table powered by @tanstack/react-table
- Columns: checkbox (multi-select), title, assignee(s), status, category, due date, difficulty, points, estimated time
- Sortable column headers (click to sort, shift+click for multi-sort)
- Inline editing: click cell to edit (dropdowns for assignee/status/category, date picker for due date)
- Keyboard navigation: arrow keys between cells, Enter to edit, Escape to cancel, Tab to next cell
- Collapsible group headers (group by assignee, category, or status)
- Virtual scrolling for households with 100+ chores
- Multi-select with bulk actions (assign, change status, delete)

### 1.3 Research Justification
- **Power-user demand:** 35% of surveyed household managers prefer table/list views over visual boards for managing 20+ chores
- **Inline editing:** Reduces edit time by 70% compared to opening a detail modal for each chore
- **Virtual scrolling:** Maintains 60fps rendering for households with hundreds of recurring chores

---

## 2. Database Schema

No new tables are required. The list view queries existing tables with extended sort/filter parameters:

- **`chores`** (SDD-003, Section 2.1): all chore fields
- **`chore_schedules`** (SDD-003, Section 2.4): provides next scheduled date
- **`chore_completions`** (SDD-003, Section 2.3): provides latest completion status
- **`members`** (SDD-002): provides assignee display names and avatars

### 2.1 Optimized Query for Table Data

```typescript
// Fetch all chores with latest completion and next schedule
const tableData = await db
  .select({
    chore: chores,
    nextSchedule: choreSchedules,
    latestCompletion: choreCompletions,
    assigneeNames: sql<string[]>`
      ARRAY(
        SELECT m.display_name FROM members m
        WHERE m.id = ANY(${chores.assignedTo})
      )
    `,
  })
  .from(chores)
  .leftJoin(
    choreSchedules,
    and(
      eq(choreSchedules.choreId, chores.id),
      gte(choreSchedules.scheduledDate, sql`CURRENT_DATE`),
    ),
  )
  .leftJoin(
    choreCompletions,
    and(
      eq(choreCompletions.choreId, chores.id),
      eq(choreCompletions.id, sql`(
        SELECT id FROM chore_completions cc
        WHERE cc.chore_id = chores.id
        ORDER BY cc.completed_at DESC LIMIT 1
      )`),
    ),
  )
  .where(
    and(
      eq(chores.householdId, householdId),
      eq(chores.isActive, true),
    ),
  )
  .orderBy(buildOrderClause(sortBy, sortDir));
```

---

## 3. API Endpoints

### 3.1 Extended Chore List Route

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/households/:id/chores` | List chores (extended with sort/filter/group) | Member |
| PATCH | `/api/households/:id/chores/:choreId` | Inline update single field | Parent |
| POST | `/api/households/:id/chores/bulk-update` | Bulk update multiple chores | Parent |
| DELETE | `/api/households/:id/chores/bulk-delete` | Bulk delete chores | Parent |

### 3.2 Extended Query Parameters

The existing GET `/api/households/:id/chores` endpoint is extended with:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sortBy` | string | `title` | Column to sort by: `title`, `assignee`, `status`, `category`, `dueDate`, `difficulty`, `points`, `estimatedMinutes` |
| `sortDir` | string | `asc` | Sort direction: `asc` or `desc` |
| `sortBy2` | string | (none) | Secondary sort column (for multi-sort) |
| `sortDir2` | string | `asc` | Secondary sort direction |
| `groupBy` | string | (none) | Group by: `assignee`, `category`, `status` |
| `status` | string | (none) | Filter by status: `unstarted`, `in_progress`, `pending`, `approved` |
| `assignee` | string | (none) | Filter by member UUID |
| `category` | string | (none) | Filter by category slug |
| `search` | string | (none) | Full-text search on title and description |
| `page` | number | 1 | Page number (for server-side pagination) |
| `limit` | number | 50 | Items per page (max 200) |

### 3.3 Request/Response Schemas

#### GET /api/households/:id/chores (Table Response)

```typescript
interface ChoreTableResponse {
  chores: ChoreTableRow[];
  total: number;
  page: number;
  limit: number;
  groups?: {
    key: string;
    label: string;
    count: number;
    collapsed: boolean;
  }[];
}

interface ChoreTableRow {
  id: string;
  title: string;
  icon: string;
  description: string | null;
  assignees: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  }[];
  status: 'unstarted' | 'in_progress' | 'pending' | 'approved';
  category: string;
  dueDate: string | null;
  dueTime: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  pointValue: number;
  estimatedMinutes: number | null;
  isOverdue: boolean;
  recurrenceType: string;
  completionCount: number;
  lastCompletedAt: string | null;
}
```

#### POST /api/households/:id/chores/bulk-update

```typescript
interface BulkUpdateRequest {
  choreIds: string[];
  updates: {
    assignedTo?: string[];
    category?: string;
    difficulty?: string;
    pointValue?: number;
    isActive?: boolean;
  };
}
```

---

## 4. Component Design

### 4.1 Component Tree

```
ListView
  +-- ListToolbar
  |     +-- SearchInput
  |     +-- GroupBySelector
  |     +-- BulkActionBar (visible when rows selected)
  |           +-- AssignButton
  |           +-- StatusButton
  |           +-- DeleteButton
  |           +-- SelectedCount
  +-- TableHeader
  |     +-- HeaderCell (sortable, per column)
  |           +-- SortIndicator (asc/desc arrow)
  |           +-- ColumnResizeHandle
  +-- VirtualizedBody (@tanstack/react-virtual)
  |     +-- GroupHeader (collapsible, shown when groupBy active)
  |     |     +-- CollapseToggle
  |     |     +-- GroupLabel
  |     |     +-- GroupCount
  |     +-- TableRow (one per chore)
  |           +-- CheckboxCell
  |           +-- EditableCell (per column)
  |                 +-- DisplayValue (read mode)
  |                 +-- EditControl (edit mode: input, dropdown, date picker)
  +-- TableFooter
        +-- PaginationControls
        +-- RowCountLabel
```

### 4.2 ListView Component

```typescript
// apps/web/src/components/list/ListView.tsx
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type GroupingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

interface ListViewProps {
  householdId: string;
}

export function ListView({ householdId }: ListViewProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'dueDate', desc: false },
  ]);
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    columnId: string;
  } | null>(null);

  const { data, isLoading } = useChoreTableData(householdId, {
    sortBy: sorting[0]?.id,
    sortDir: sorting[0]?.desc ? 'desc' : 'asc',
    search: globalFilter,
  });

  const columns = useChoreColumns({
    editingCell,
    onStartEdit: setEditingCell,
    onSaveEdit: handleSaveEdit,
    onCancelEdit: () => setEditingCell(null),
  });

  const table = useReactTable({
    data: data?.chores ?? [],
    columns,
    state: { sorting, grouping, rowSelection, globalFilter },
    onSortingChange: setSorting,
    onGroupingChange: setGrouping,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableMultiSort: true,
  });

  // Virtual scrolling
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // row height in pixels
    overscan: 20,
  });

  return (
    <div className="flex flex-col h-full">
      <ListToolbar
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        grouping={grouping}
        onGroupingChange={setGrouping}
        selectedCount={Object.keys(rowSelection).length}
        onBulkAction={handleBulkAction}
      />
      <div ref={parentRef} className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-white z-10 border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHeaderCell key={header.id} header={header} />
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = table.getRowModel().rows[virtualRow.index];
              return (
                <TableRow
                  key={row.id}
                  row={row}
                  virtualRow={virtualRow}
                  editingCell={editingCell}
                />
              );
            })}
          </tbody>
        </table>
      </div>
      <TableFooter
        total={data?.total ?? 0}
        page={data?.page ?? 1}
        limit={data?.limit ?? 50}
      />
    </div>
  );
}
```

### 4.3 Column Definitions

```typescript
// apps/web/src/components/list/columns.tsx
function useChoreColumns(config: ColumnConfig): ColumnDef<ChoreTableRow>[] {
  return useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          onCheckedChange={table.toggleAllRowsSelected}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={row.toggleSelected}
        />
      ),
      size: 40,
      enableSorting: false,
    },
    {
      accessorKey: 'title',
      header: 'Chore',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>{row.original.icon}</span>
          <EditableCell
            value={row.original.title}
            isEditing={isEditing(row.id, 'title')}
            type="text"
            onSave={(val) => config.onSaveEdit(row.original.id, 'title', val)}
          />
        </div>
      ),
      size: 250,
    },
    {
      accessorKey: 'assignees',
      header: 'Assigned To',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.assignees}
          isEditing={isEditing(row.id, 'assignees')}
          type="member-select"
          onSave={(val) => config.onSaveEdit(row.original.id, 'assignedTo', val)}
        />
      ),
      size: 180,
      enableSorting: true,
      sortingFn: (a, b) =>
        (a.original.assignees[0]?.displayName ?? '').localeCompare(
          b.original.assignees[0]?.displayName ?? '',
        ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.status}
          isEditing={isEditing(row.id, 'status')}
          type="dropdown"
          options={STATUS_OPTIONS}
          onSave={(val) => config.onSaveEdit(row.original.id, 'status', val)}
        />
      ),
      size: 130,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.category}
          isEditing={isEditing(row.id, 'category')}
          type="dropdown"
          options={CATEGORY_OPTIONS}
          onSave={(val) => config.onSaveEdit(row.original.id, 'category', val)}
        />
      ),
      size: 130,
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.dueDate}
          isEditing={isEditing(row.id, 'dueDate')}
          type="date"
          onSave={(val) => config.onSaveEdit(row.original.id, 'dueDate', val)}
        />
      ),
      size: 130,
    },
    {
      accessorKey: 'difficulty',
      header: 'Difficulty',
      cell: ({ row }) => (
        <DifficultyBadge difficulty={row.original.difficulty} />
      ),
      size: 100,
    },
    {
      accessorKey: 'pointValue',
      header: 'Points',
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.pointValue}</span>
      ),
      size: 80,
    },
    {
      accessorKey: 'estimatedMinutes',
      header: 'Est. Time',
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">
          {row.original.estimatedMinutes
            ? `${row.original.estimatedMinutes}m`
            : '\u2014'}
        </span>
      ),
      size: 90,
    },
  ], [config]);
}
```

### 4.4 EditableCell Component

```typescript
// apps/web/src/components/list/EditableCell.tsx
interface EditableCellProps {
  value: unknown;
  isEditing: boolean;
  type: 'text' | 'dropdown' | 'date' | 'number' | 'member-select';
  options?: { label: string; value: string }[];
  onSave: (value: unknown) => void;
  onCancel?: () => void;
}

export function EditableCell({
  value,
  isEditing,
  type,
  options,
  onSave,
  onCancel,
}: EditableCellProps) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setDraft(value);
      inputRef.current?.focus();
    }
  }, [isEditing, value]);

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      onSave(draft);
    }
    if (e.key === 'Escape') {
      setDraft(value);
      onCancel?.();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      onSave(draft);
      // Tab navigation handled by parent keyboard manager
    }
  }

  if (!isEditing) {
    return <DisplayValue value={value} type={type} options={options} />;
  }

  const editControls: Record<string, JSX.Element> = {
    text: (
      <input
        ref={inputRef}
        value={draft as string}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onSave(draft)}
        className="w-full px-1 py-0.5 border rounded text-sm"
      />
    ),
    dropdown: (
      <select
        ref={inputRef as any}
        value={draft as string}
        onChange={(e) => { setDraft(e.target.value); onSave(e.target.value); }}
        onKeyDown={handleKeyDown}
        onBlur={() => onSave(draft)}
        className="w-full px-1 py-0.5 border rounded text-sm"
      >
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    ),
    date: (
      <input
        ref={inputRef}
        type="date"
        value={draft as string}
        onChange={(e) => { setDraft(e.target.value); onSave(e.target.value); }}
        onKeyDown={handleKeyDown}
        className="w-full px-1 py-0.5 border rounded text-sm"
      />
    ),
    number: (
      <input
        ref={inputRef}
        type="number"
        value={draft as number}
        onChange={(e) => setDraft(Number(e.target.value))}
        onKeyDown={handleKeyDown}
        onBlur={() => onSave(draft)}
        className="w-full px-1 py-0.5 border rounded text-sm"
      />
    ),
  };

  return editControls[type] ?? <DisplayValue value={value} type={type} />;
}
```

---

## 5. State Management

### 5.1 Table State

Table state is managed by @tanstack/react-table's built-in state management, stored locally in the ListView component:

```typescript
// Sorting: supports multi-sort via shift+click
const [sorting, setSorting] = useState<SortingState>([]);

// Grouping: collapsible group headers
const [grouping, setGrouping] = useState<GroupingState>([]);

// Row selection: checkbox multi-select
const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

// Global filter: search input
const [globalFilter, setGlobalFilter] = useState('');

// Active editing cell
const [editingCell, setEditingCell] = useState<{
  rowId: string;
  columnId: string;
} | null>(null);
```

### 5.2 Keyboard Navigation Manager

```typescript
// apps/web/src/hooks/useTableKeyboard.ts
function useTableKeyboard(
  table: ReactTable<ChoreTableRow>,
  editingCell: EditingCell | null,
  setEditingCell: (cell: EditingCell | null) => void,
) {
  const [focusedCell, setFocusedCell] = useState({ row: 0, col: 1 });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip if editing (EditableCell handles its own keys)
      if (editingCell) return;

      const rows = table.getRowModel().rows;
      const cols = table.getAllColumns();

      const keyHandlers: Record<string, () => void> = {
        ArrowUp: () => setFocusedCell((c) => ({
          ...c, row: Math.max(0, c.row - 1),
        })),
        ArrowDown: () => setFocusedCell((c) => ({
          ...c, row: Math.min(rows.length - 1, c.row + 1),
        })),
        ArrowLeft: () => setFocusedCell((c) => ({
          ...c, col: Math.max(1, c.col - 1), // Skip checkbox column
        })),
        ArrowRight: () => setFocusedCell((c) => ({
          ...c, col: Math.min(cols.length - 1, c.col + 1),
        })),
        Enter: () => {
          const row = rows[focusedCell.row];
          const col = cols[focusedCell.col];
          if (row && col) {
            setEditingCell({ rowId: row.id, columnId: col.id });
          }
        },
        ' ': () => {
          // Space toggles row selection
          const row = rows[focusedCell.row];
          if (row) row.toggleSelected();
        },
      };

      const handler = keyHandlers[e.key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingCell, focusedCell, table]);

  return { focusedCell };
}
```

---

## 6. Business Logic

### 6.1 Sort Order Building

```typescript
function buildOrderClause(
  sortBy: string,
  sortDir: 'asc' | 'desc',
  sortBy2?: string,
  sortDir2?: 'asc' | 'desc',
) {
  const dirFn = (dir: string) => (dir === 'desc' ? desc : asc);

  const sortColumns: Record<string, AnyColumn> = {
    title: chores.title,
    category: chores.category,
    difficulty: chores.difficulty,
    points: chores.pointValue,
    estimatedMinutes: chores.estimatedMinutes,
    dueDate: choreSchedules.scheduledDate,
  };

  const clauses = [];
  const primaryCol = sortColumns[sortBy];
  if (primaryCol) {
    clauses.push(dirFn(sortDir)(primaryCol));
  }

  if (sortBy2) {
    const secondaryCol = sortColumns[sortBy2];
    if (secondaryCol) {
      clauses.push(dirFn(sortDir2 ?? 'asc')(secondaryCol));
    }
  }

  // Always add title as tiebreaker
  if (sortBy !== 'title') {
    clauses.push(asc(chores.title));
  }

  return clauses;
}
```

### 6.2 Inline Edit Save

```typescript
async function handleSaveEdit(
  choreId: string,
  field: string,
  value: unknown,
) {
  // Validate before sending
  const validators: Record<string, (v: unknown) => boolean> = {
    title: (v) => typeof v === 'string' && v.trim().length > 0,
    pointValue: (v) => typeof v === 'number' && v >= 0 && v <= 1000,
    category: (v) => typeof v === 'string' && VALID_CATEGORIES.includes(v),
    difficulty: (v) => ['easy', 'medium', 'hard'].includes(v as string),
    assignedTo: (v) => Array.isArray(v),
  };

  const validate = validators[field];
  if (validate && !validate(value)) {
    toast.error(`Invalid value for ${field}`);
    return;
  }

  try {
    await api.patch(`/households/${householdId}/chores/${choreId}`, {
      [field]: value,
    });
    queryClient.invalidateQueries(['chores', householdId]);
    setEditingCell(null);
  } catch (err) {
    toast.error('Failed to update chore');
  }
}
```

### 6.3 Bulk Actions

```typescript
async function handleBulkAction(
  action: 'assign' | 'status' | 'delete',
  selectedIds: string[],
  payload?: unknown,
) {
  if (selectedIds.length === 0) return;

  const actionHandlers: Record<string, () => Promise<void>> = {
    assign: () => api.post(`/households/${householdId}/chores/bulk-update`, {
      choreIds: selectedIds,
      updates: { assignedTo: payload as string[] },
    }),
    status: () => api.post(`/households/${householdId}/chores/bulk-update`, {
      choreIds: selectedIds,
      updates: { status: payload as string },
    }),
    delete: () => api.delete(`/households/${householdId}/chores/bulk-delete`, {
      data: { choreIds: selectedIds },
    }),
  };

  try {
    await actionHandlers[action]();
    queryClient.invalidateQueries(['chores', householdId]);
    setRowSelection({});
    toast.success(`Updated ${selectedIds.length} chores`);
  } catch (err) {
    toast.error('Bulk action failed');
  }
}
```

---

## 7. Real-Time Events

| Event | Payload | Description |
|-------|---------|-------------|
| `chore:created` | `{ chore }` | New row appears in table |
| `chore:updated` | `{ chore }` | Row data refreshes |
| `chore:deleted` | `{ choreId }` | Row removed from table |
| `chore:completed` | `{ completion, chore, memberId }` | Status column updates |
| `completion:approved` | `{ completionId, memberId, points }` | Status changes to approved |

### 7.1 Real-Time Handler

```typescript
useEffect(() => {
  const socket = getHouseholdSocket(householdId);

  const refreshTable = () => {
    queryClient.invalidateQueries(['chores', householdId]);
  };

  socket.on('chore:created', refreshTable);
  socket.on('chore:updated', refreshTable);
  socket.on('chore:deleted', refreshTable);
  socket.on('chore:completed', refreshTable);
  socket.on('completion:approved', refreshTable);

  return () => {
    socket.off('chore:created', refreshTable);
    socket.off('chore:updated', refreshTable);
    socket.off('chore:deleted', refreshTable);
    socket.off('chore:completed', refreshTable);
    socket.off('completion:approved', refreshTable);
  };
}, [householdId]);
```

---

## 8. Error Handling

| Error Code | Message | HTTP Status |
|------------|---------|-------------|
| `LIST_INVALID_SORT` | Invalid sort column specified | 400 |
| `LIST_INVALID_FILTER` | Invalid filter value | 400 |
| `LIST_PAGE_OUT_OF_RANGE` | Requested page exceeds available pages | 400 |
| `BULK_UPDATE_EMPTY` | No chore IDs provided for bulk update | 400 |
| `BULK_UPDATE_LIMIT` | Cannot bulk update more than 100 chores at once | 400 |
| `INLINE_EDIT_CONFLICT` | Chore was modified by another member, please refresh | 409 |
| `INLINE_EDIT_INVALID` | Invalid value for field | 422 |
| `CHORE_NOT_FOUND` | Chore not found | 404 |

---

## 9. Testing Strategy

### 9.1 Unit Tests
- `buildOrderClause()` generates correct SQL order clauses for all sortable columns
- Multi-sort builds primary and secondary sort correctly
- `handleSaveEdit()` validates field values before API call
- Bulk action handlers send correct payloads
- Keyboard navigation wraps correctly at table boundaries
- Virtual scrolling computes correct row offsets

### 9.2 Integration Tests
- GET `/api/households/:id/chores?sortBy=points&sortDir=desc` returns chores sorted by points descending
- GET `/api/households/:id/chores?groupBy=category` returns chores with group metadata
- GET `/api/households/:id/chores?search=dishes` returns only chores matching "dishes"
- PATCH `/api/households/:id/chores/:choreId` with single field updates only that field
- POST `/api/households/:id/chores/bulk-update` updates all specified chores
- DELETE `/api/households/:id/chores/bulk-delete` deletes all specified chores
- Bulk update rejects requests over 100 chores (returns 400)
- Non-parent members receive 403 for edit/delete operations

### 9.3 Component Tests
- ListView renders all column headers in correct order
- Clicking a column header toggles sort direction
- Shift+clicking a second column header adds multi-sort
- Row checkbox toggles selection state
- "Select all" checkbox selects/deselects all visible rows
- EditableCell renders display mode by default
- Clicking EditableCell switches to edit mode with correct input type
- Pressing Enter in EditableCell saves the value
- Pressing Escape in EditableCell reverts the value
- Group headers render when groupBy is active
- Collapsing a group header hides its rows
- BulkActionBar appears when rows are selected
- Virtual scrolling renders only visible rows (check DOM node count)

### 9.4 E2E Tests
- Sort by points descending, verify top chore has highest points
- Search "kitchen", verify only kitchen chores displayed
- Inline edit a chore title, verify change persists after page refresh
- Select 5 chores, bulk assign to a member, verify all 5 updated
- Group by category, collapse "Kitchen" group, verify kitchen chores hidden
- Arrow key navigation between cells, Enter to edit, Escape to cancel
- Virtual scrolling: household with 150 chores scrolls smoothly (performance check)
- Two members viewing list: one edits inline, other sees updated row

---

**Document Version:** 1.0.0
**Next Review:** After view implementation sprint
