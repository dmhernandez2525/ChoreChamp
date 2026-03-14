# SDD-029: Filter System

**Status:** Draft
**Priority:** P2 (Enhancement)
**Author:** ChoreChamp Team
**Last Updated:** 2026-03-14

---

## 1. Overview

### 1.1 Purpose
Provide a comprehensive filtering system for chore views (Kanban, Calendar, List) so household members can quickly narrow down chores by assignee, status, category, due date, difficulty, and arbitrary field combinations using an advanced filter builder.

### 1.2 Scope
- Quick filter dropdowns for common fields
- Advanced filter builder with AND/OR condition groups
- Saved filter views (private or shared with household)
- Built-in filter presets for common workflows
- URL state persistence for shareable filtered views
- Cross-view filter consistency (filters apply regardless of Kanban, Calendar, or List mode)

### 1.3 Research Justification
- **Households grow complex fast:** A family of five with 30+ active chores needs filtering to stay manageable
- **"My Chores" is the #1 request:** Every competitor (OurHome, S'moresUp, Homey) surfaces a personal chore view; a filter system generalizes this pattern
- **Saved views reduce cognitive load:** Parents can set up "Morning Routine" or "Weekend Chores" views once and reuse them daily

---

## 2. Database Schema

### 2.1 Saved Chore Filters Table

```typescript
// apps/api/src/db/schema/saved-chore-filters.ts
import { pgTable, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const savedChoreFilters = pgTable('saved_chore_filters', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  filters: jsonb('filters').notNull(),        // FilterConditionGroup[]
  sort: jsonb('sort'),                         // { field: string, direction: 'asc' | 'desc' }[]
  groupBy: varchar('group_by', { length: 50 }),// Optional grouping field
  visibility: varchar('visibility', { length: 20 }).notNull().default('private'), // 'private' | 'household'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
```

```sql
CREATE INDEX idx_saved_filters_household ON saved_chore_filters(household_id);
CREATE INDEX idx_saved_filters_member ON saved_chore_filters(member_id);
CREATE INDEX idx_saved_filters_visibility ON saved_chore_filters(household_id, visibility);
```

---

## 3. Filter Data Model

### 3.1 Type Definitions

```typescript
// packages/shared/src/types/filters.ts

// A single filter condition: "assignee equals member-123"
interface FilterCondition {
  field: FilterField;
  operator: FilterOperator;
  value: FilterValue;
}

// A group of conditions joined by AND or OR
interface FilterConditionGroup {
  logic: 'and' | 'or';
  conditions: Array<FilterCondition | FilterConditionGroup>; // Supports nesting
}

type FilterField =
  | 'assignee'
  | 'status'
  | 'category'
  | 'priority'
  | 'due_date'
  | 'difficulty'
  | 'points'
  | 'title'
  | 'requires_approval'
  | 'requires_photo';

type FilterValue = string | string[] | number | number[] | boolean | DateRange | null;

interface DateRange {
  start?: string;  // ISO date
  end?: string;    // ISO date
}
```

### 3.2 Operators by Field Type

| Field Type | Applicable Operators |
|------------|---------------------|
| **String** (`title`) | `equals`, `not_equals`, `contains`, `starts_with` |
| **Enum** (`status`, `category`, `difficulty`, `assignee`) | `equals`, `not_equals`, `in`, `not_in` |
| **Number** (`points`) | `equals`, `gt`, `lt`, `gte`, `lte`, `between` |
| **Date** (`due_date`) | `equals`, `before`, `after`, `between`, `is_overdue`, `is_today`, `is_this_week` |
| **Boolean** (`requires_approval`, `requires_photo`) | `is_true`, `is_false` |

```typescript
type StringOperator = 'equals' | 'not_equals' | 'contains' | 'starts_with';
type EnumOperator = 'equals' | 'not_equals' | 'in' | 'not_in';
type NumberOperator = 'equals' | 'gt' | 'lt' | 'gte' | 'lte' | 'between';
type DateOperator = 'equals' | 'before' | 'after' | 'between' | 'is_overdue' | 'is_today' | 'is_this_week';
type BooleanOperator = 'is_true' | 'is_false';

type FilterOperator = StringOperator | EnumOperator | NumberOperator | DateOperator | BooleanOperator;
```

### 3.3 Operator Resolution

The `is_overdue`, `is_today`, and `is_this_week` operators are server-resolved relative to the current date at query time. They do not require a `value` field.

---

## 4. Filter Presets

Built-in presets are not stored in the database. They are defined client-side and applied as predefined `FilterConditionGroup` configurations.

| Preset Name | Conditions | Description |
|-------------|-----------|-------------|
| My Chores | `assignee equals {currentMemberId}` | Chores assigned to the logged-in member |
| Overdue | `due_date is_overdue` | Chores past their due date |
| Pending Approval | `requires_approval is_true` AND `status equals pending` | Completed chores awaiting parent review |
| Today's Chores | `due_date is_today` | Chores due today |

```typescript
// apps/web/src/lib/filter-presets.ts
export function getFilterPresets(currentMemberId: string): FilterPreset[] {
  return [
    {
      name: 'My Chores',
      icon: UserIcon,
      conditions: {
        logic: 'and',
        conditions: [
          { field: 'assignee', operator: 'equals', value: currentMemberId },
        ],
      },
    },
    {
      name: 'Overdue',
      icon: AlertTriangleIcon,
      conditions: {
        logic: 'and',
        conditions: [
          { field: 'due_date', operator: 'is_overdue', value: null },
        ],
      },
    },
    {
      name: 'Pending Approval',
      icon: ClockIcon,
      conditions: {
        logic: 'and',
        conditions: [
          { field: 'requires_approval', operator: 'is_true', value: null },
          { field: 'status', operator: 'equals', value: 'pending' },
        ],
      },
    },
    {
      name: "Today's Chores",
      icon: CalendarIcon,
      conditions: {
        logic: 'and',
        conditions: [
          { field: 'due_date', operator: 'is_today', value: null },
        ],
      },
    },
  ];
}
```

---

## 5. API Endpoints

### 5.1 Saved Filter CRUD

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/households/:id/saved-filters` | Create a saved filter view | Member |
| GET | `/api/households/:id/saved-filters` | List saved filters (own + household-visible) | Member |
| GET | `/api/households/:id/saved-filters/:filterId` | Get a single saved filter | Member |
| PATCH | `/api/households/:id/saved-filters/:filterId` | Update a saved filter | Owner |
| DELETE | `/api/households/:id/saved-filters/:filterId` | Delete a saved filter | Owner |

**Create Request Body:**
```typescript
interface CreateSavedFilterRequest {
  name: string;
  filters: FilterConditionGroup;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  groupBy?: string;
  visibility: 'private' | 'household';
}
```

### 5.2 Filtered Chore Listing

The existing `GET /api/households/:id/chores` endpoint is extended with query parameters for server-side filtering:

| Parameter | Type | Description |
|-----------|------|-------------|
| `assignee` | string | Member ID |
| `status` | string | `active`, `paused`, `archived` |
| `category` | string | Category slug |
| `difficulty` | string | `easy`, `medium`, `hard` |
| `due_before` | ISO date | Chores due before this date |
| `due_after` | ISO date | Chores due after this date |
| `overdue` | boolean | Only overdue chores |
| `search` | string | Text search on title |
| `filters` | JSON string | Full `FilterConditionGroup` for advanced queries |

When the `filters` parameter is provided, it takes precedence over individual query parameters. The server parses the JSON and builds the corresponding SQL WHERE clause.

---

## 6. Business Logic

### 6.1 Filter Evaluation Engine

```typescript
// apps/api/src/services/filter-engine.ts
import { SQL, and, or, eq, ne, like, gt, lt, gte, lte, between, inArray, notInArray } from 'drizzle-orm';

export function buildFilterQuery(
  group: FilterConditionGroup,
  today: Date
): SQL {
  const clauses = group.conditions.map((condition) => {
    // Nested group: recurse
    if ('logic' in condition) {
      return buildFilterQuery(condition, today);
    }
    return buildConditionClause(condition, today);
  });

  return group.logic === 'and' ? and(...clauses) : or(...clauses);
}

function buildConditionClause(condition: FilterCondition, today: Date): SQL {
  const column = FIELD_COLUMN_MAP[condition.field];

  const operatorHandlers: Record<string, () => SQL> = {
    equals: () => eq(column, condition.value),
    not_equals: () => ne(column, condition.value),
    contains: () => like(column, `%${condition.value}%`),
    starts_with: () => like(column, `${condition.value}%`),
    in: () => inArray(column, condition.value as string[]),
    not_in: () => notInArray(column, condition.value as string[]),
    gt: () => gt(column, condition.value),
    lt: () => lt(column, condition.value),
    gte: () => gte(column, condition.value),
    lte: () => lte(column, condition.value),
    between: () => between(column, condition.value.start, condition.value.end),
    before: () => lt(column, condition.value),
    after: () => gt(column, condition.value),
    is_overdue: () => lt(column, today),
    is_today: () => eq(column, today),
    is_this_week: () => between(column, startOfWeek(today), endOfWeek(today)),
    is_true: () => eq(column, true),
    is_false: () => eq(column, false),
  };

  const handler = operatorHandlers[condition.operator];
  if (!handler) throw new BadRequestError(`Unknown operator: ${condition.operator}`);
  return handler();
}

const FIELD_COLUMN_MAP: Record<FilterField, Column> = {
  assignee: chores.assignedTo,
  status: chores.isActive,
  category: chores.category,
  priority: chores.difficulty,
  due_date: choreSchedules.scheduledDate,
  difficulty: chores.difficulty,
  points: chores.pointValue,
  title: chores.title,
  requires_approval: chores.requiresApproval,
  requires_photo: chores.requiresPhoto,
};
```

---

## 7. State Management

### 7.1 Filter Store (Zustand)

```typescript
// apps/web/src/stores/filter-store.ts
import { create } from 'zustand';

interface FilterState {
  // Quick filters
  quickFilters: {
    assignee: string | null;
    status: string | null;
    category: string | null;
    difficulty: string | null;
    dueDateRange: { start?: string; end?: string } | null;
  };

  // Advanced filter builder
  advancedConditions: FilterConditionGroup | null;

  // Active preset or saved view
  activePreset: string | null;
  activeSavedFilterId: string | null;

  // Actions
  setQuickFilter: (field: string, value: string | null) => void;
  clearQuickFilters: () => void;
  setAdvancedConditions: (conditions: FilterConditionGroup | null) => void;
  setActivePreset: (presetName: string | null) => void;
  setActiveSavedFilter: (filterId: string | null, conditions: FilterConditionGroup) => void;
  clearAll: () => void;

  // URL sync
  toURLParams: () => string;
  fromURLParams: (params: URLSearchParams) => void;
}

export const useFilterStore = create<FilterState>((set, get) => ({
  quickFilters: {
    assignee: null,
    status: null,
    category: null,
    difficulty: null,
    dueDateRange: null,
  },
  advancedConditions: null,
  activePreset: null,
  activeSavedFilterId: null,

  setQuickFilter: (field, value) =>
    set((state) => ({
      quickFilters: { ...state.quickFilters, [field]: value },
      activePreset: null,
      activeSavedFilterId: null,
    })),

  clearQuickFilters: () =>
    set({
      quickFilters: {
        assignee: null,
        status: null,
        category: null,
        difficulty: null,
        dueDateRange: null,
      },
    }),

  setAdvancedConditions: (conditions) =>
    set({ advancedConditions: conditions, activePreset: null }),

  setActivePreset: (presetName) =>
    set({ activePreset: presetName, advancedConditions: null, activeSavedFilterId: null }),

  setActiveSavedFilter: (filterId, conditions) =>
    set({ activeSavedFilterId: filterId, advancedConditions: conditions, activePreset: null }),

  clearAll: () =>
    set({
      quickFilters: { assignee: null, status: null, category: null, difficulty: null, dueDateRange: null },
      advancedConditions: null,
      activePreset: null,
      activeSavedFilterId: null,
    }),

  toURLParams: () => {
    const state = get();
    const params = new URLSearchParams();
    const filterData = {
      quick: state.quickFilters,
      advanced: state.advancedConditions,
      preset: state.activePreset,
      savedFilterId: state.activeSavedFilterId,
    };
    params.set('filters', JSON.stringify(filterData));
    return params.toString();
  },

  fromURLParams: (params) => {
    const raw = params.get('filters');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      set({
        quickFilters: parsed.quick ?? get().quickFilters,
        advancedConditions: parsed.advanced ?? null,
        activePreset: parsed.preset ?? null,
        activeSavedFilterId: parsed.savedFilterId ?? null,
      });
    } catch {
      // Ignore malformed URL filter params
    }
  },
}));
```

---

## 8. Components

### 8.1 FilterBar

Top-level component rendered above the chore view. Contains quick filter dropdowns and access to the advanced filter builder.

```typescript
// apps/web/src/components/chores/FilterBar.tsx
export function FilterBar({ householdId }: { householdId: string }) {
  const { quickFilters, setQuickFilter, clearAll, activePreset } = useFilterStore();
  const { data: members } = useHouseholdMembers(householdId);
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="flex items-center gap-3 flex-wrap py-2">
      <FilterPresetPills householdId={householdId} />

      <DropdownFilter
        label="Assignee"
        value={quickFilters.assignee}
        options={members?.map((m) => ({ label: m.displayName, value: m.id })) ?? []}
        onChange={(v) => setQuickFilter('assignee', v)}
      />
      <DropdownFilter
        label="Category"
        value={quickFilters.category}
        options={CHORE_CATEGORIES}
        onChange={(v) => setQuickFilter('category', v)}
      />
      <DropdownFilter
        label="Difficulty"
        value={quickFilters.difficulty}
        options={DIFFICULTY_OPTIONS}
        onChange={(v) => setQuickFilter('difficulty', v)}
      />

      <button onClick={() => setShowAdvanced(true)} className="text-sm text-blue-600">
        Advanced Filters
      </button>

      {hasActiveFilters(quickFilters) && (
        <button onClick={clearAll} className="text-sm text-gray-500">
          Clear All
        </button>
      )}

      {showAdvanced && (
        <AdvancedFilterBuilder
          onClose={() => setShowAdvanced(false)}
          householdId={householdId}
        />
      )}
    </div>
  );
}
```

### 8.2 AdvancedFilterBuilder

Modal dialog for constructing complex AND/OR condition groups.

```typescript
// apps/web/src/components/chores/AdvancedFilterBuilder.tsx
export function AdvancedFilterBuilder({
  onClose,
  householdId,
}: {
  onClose: () => void;
  householdId: string;
}) {
  const { advancedConditions, setAdvancedConditions } = useFilterStore();
  const [draft, setDraft] = useState<FilterConditionGroup>(
    advancedConditions ?? { logic: 'and', conditions: [] }
  );

  const addCondition = () => {
    setDraft({
      ...draft,
      conditions: [
        ...draft.conditions,
        { field: 'title', operator: 'contains', value: '' },
      ],
    });
  };

  const apply = () => {
    setAdvancedConditions(draft.conditions.length > 0 ? draft : null);
    onClose();
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Advanced Filters</DialogTitle>
      <DialogContent>
        <LogicToggle value={draft.logic} onChange={(logic) => setDraft({ ...draft, logic })} />

        {draft.conditions.map((condition, index) => (
          <ConditionRow
            key={index}
            condition={condition}
            onChange={(updated) => updateConditionAt(index, updated)}
            onRemove={() => removeConditionAt(index)}
          />
        ))}

        <button onClick={addCondition}>+ Add condition</button>
      </DialogContent>
      <DialogActions>
        <button onClick={onClose}>Cancel</button>
        <button onClick={apply}>Apply Filters</button>
      </DialogActions>
    </Dialog>
  );
}
```

### 8.3 SavedViewSelector

Dropdown listing the member's saved filter views plus household-shared views.

```typescript
// apps/web/src/components/chores/SavedViewSelector.tsx
export function SavedViewSelector({ householdId }: { householdId: string }) {
  const { data: savedFilters } = useSavedFilters(householdId);
  const { setActiveSavedFilter } = useFilterStore();

  return (
    <Select
      placeholder="Saved Views"
      options={savedFilters?.map((f) => ({
        label: f.name,
        value: f.id,
        icon: f.visibility === 'household' ? UsersIcon : LockIcon,
      })) ?? []}
      onChange={(filterId) => {
        const filter = savedFilters?.find((f) => f.id === filterId);
        if (filter) setActiveSavedFilter(filterId, filter.filters);
      }}
    />
  );
}
```

### 8.4 SaveViewDialog

Dialog for naming and saving the current filter configuration.

```typescript
// apps/web/src/components/chores/SaveViewDialog.tsx
export function SaveViewDialog({
  householdId,
  onClose,
}: {
  householdId: string;
  onClose: () => void;
}) {
  const { advancedConditions, quickFilters } = useFilterStore();
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'household'>('private');
  const createFilter = useCreateSavedFilter(householdId);

  const handleSave = async () => {
    const filters = advancedConditions ?? quickFiltersToConditionGroup(quickFilters);
    await createFilter.mutateAsync({ name, filters, visibility });
    toast.success(`View "${name}" saved`);
    onClose();
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Save Current View</DialogTitle>
      <DialogContent>
        <Input label="View Name" value={name} onChange={setName} placeholder="e.g., Morning Routine" />
        <RadioGroup
          label="Visibility"
          value={visibility}
          onChange={setVisibility}
          options={[
            { label: 'Only me', value: 'private' },
            { label: 'Everyone in household', value: 'household' },
          ]}
        />
      </DialogContent>
      <DialogActions>
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleSave} disabled={!name.trim()}>Save</button>
      </DialogActions>
    </Dialog>
  );
}
```

### 8.5 FilterPresetPills

Horizontal row of clickable preset pills for one-click filtering.

```typescript
// apps/web/src/components/chores/FilterPresetPills.tsx
export function FilterPresetPills({ householdId }: { householdId: string }) {
  const { activePreset, setActivePreset, setAdvancedConditions } = useFilterStore();
  const { memberId } = useCurrentMember();
  const presets = getFilterPresets(memberId);

  return (
    <div className="flex gap-2">
      {presets.map((preset) => (
        <button
          key={preset.name}
          onClick={() => {
            if (activePreset === preset.name) {
              setActivePreset(null);
              setAdvancedConditions(null);
            } else {
              setActivePreset(preset.name);
              setAdvancedConditions(preset.conditions);
            }
          }}
          className={cn(
            'px-3 py-1 rounded-full text-sm border',
            activePreset === preset.name
              ? 'bg-blue-100 border-blue-300 text-blue-700'
              : 'bg-gray-50 border-gray-200 text-gray-600'
          )}
        >
          <preset.icon className="w-3.5 h-3.5 mr-1 inline" />
          {preset.name}
        </button>
      ))}
    </div>
  );
}
```

---

## 9. URL State Persistence

Filters are serialized to URL search parameters so that filtered views can be shared via link. When a member navigates to a URL containing a `filters` parameter, the filter store hydrates from it on mount.

```typescript
// apps/web/src/hooks/useFilterURLSync.ts
export function useFilterURLSync() {
  const { toURLParams, fromURLParams } = useFilterStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Hydrate from URL on mount
  useEffect(() => {
    fromURLParams(searchParams);
  }, []);

  // Sync store changes to URL
  useEffect(() => {
    const params = toURLParams();
    if (params !== searchParams.toString()) {
      setSearchParams(new URLSearchParams(params), { replace: true });
    }
  }, [toURLParams]);
}
```

---

## 10. Error Handling

| Error Code | Message | HTTP Status |
|------------|---------|-------------|
| `FILTER_NOT_FOUND` | Saved filter not found | 404 |
| `FILTER_NOT_OWNER` | Cannot modify another member's private filter | 403 |
| `INVALID_FILTER_CONDITION` | Malformed filter condition | 400 |
| `UNKNOWN_FILTER_FIELD` | Unrecognized filter field name | 400 |
| `UNKNOWN_FILTER_OPERATOR` | Operator not valid for this field type | 400 |
| `FILTER_LIMIT_EXCEEDED` | Maximum 50 saved filters per member | 400 |

---

## 11. Testing Strategy

### 11.1 Unit Tests
- `buildFilterQuery`: verify SQL generation for every operator type (string, enum, number, date, boolean)
- `buildFilterQuery` with nested AND/OR groups: verify correct clause nesting
- `is_overdue`, `is_today`, `is_this_week` operators: verify date boundary logic
- `useFilterStore`: verify quick filter setting, advanced condition setting, preset toggling, URL serialization round-trip
- `quickFiltersToConditionGroup`: verify conversion from quick filter state to `FilterConditionGroup`

### 11.2 Integration Tests
- `GET /api/households/:id/chores?filters=...`: verify server-side filtering returns correct subset
- `POST /api/households/:id/saved-filters`: verify creation, retrieval, and visibility scoping
- `PATCH /api/households/:id/saved-filters/:id`: verify only owner can update
- `DELETE /api/households/:id/saved-filters/:id`: verify only owner can delete, household-visible filters are removed for all members
- Permission: verify child members can create private saved filters but only parents can create household-visible ones

### 11.3 End-to-End Tests
- Click "My Chores" preset pill, verify only assigned chores appear in the list
- Set assignee + category quick filters, verify combined filtering
- Open advanced filter builder, create AND group with two conditions, apply, verify results
- Save current filter as "Weekend Chores", reload page, select saved view, verify same results
- Copy URL with filters, open in new tab, verify filters are restored from URL
- Clear all filters, verify full chore list is restored

---

**Document Version:** 1.0.0
**Next Review:** After Phase 2 implementation
