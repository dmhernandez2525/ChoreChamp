# SDD-030: Quick Command and Search

**Status:** Draft
**Priority:** P2 (Enhancement)
**Author:** ChoreChamp Team
**Last Updated:** 2026-03-14

---

## 1. Overview

### 1.1 Purpose
Provide a keyboard-driven command palette for rapid chore lookup, navigation, and quick actions. Members can press a single shortcut to search across all household chores, jump to any view, or trigger common actions without reaching for the mouse.

### 1.2 Scope
- Global keyboard shortcut (Cmd+K / Ctrl+K) to open the palette
- Fuzzy search across chore titles within the current household
- Quick action commands for navigation and chore creation
- Recently accessed chores (last 5, persisted in localStorage)
- Grouped results: Chores, Quick Actions, Recent
- Full keyboard navigation (arrow keys, Enter, Escape)

### 1.3 Research Justification
- **Power user retention:** Command palettes (VS Code, Linear, Notion, Slack) are the single most-cited "delight" feature among power users
- **Accessibility win:** Keyboard-driven interfaces benefit users who cannot use a mouse or trackpad
- **Speed for parents:** Parents managing 20+ chores across multiple children need sub-second navigation; scrolling through lists is too slow

---

## 2. Database Schema

No new database tables are required. Chore search uses the existing `chores` table with a text search query parameter. Recently accessed chores are stored client-side in localStorage.

---

## 3. API Endpoints

### 3.1 Chore Search

The existing `GET /api/households/:id/chores` endpoint is extended with a `search` query parameter for title text search.

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Case-insensitive partial match on chore title |

**Implementation:**
```typescript
// In the chore listing query builder
if (params.search) {
  query = query.where(
    ilike(chores.title, `%${params.search}%`)
  );
}
```

The search parameter returns a maximum of 10 results, sorted by relevance (exact prefix match first, then substring match), then by most recently updated.

**Response:** Standard chore list response (same shape as `GET /api/households/:id/chores`), limited to 10 items when `search` is provided.

---

## 4. Business Logic

### 4.1 Search Ranking

Results are ranked by the following priority, applied server-side:

1. **Exact prefix match:** Chore title starts with the search term (case-insensitive)
2. **Word boundary match:** Search term appears at the start of any word in the title
3. **Substring match:** Search term appears anywhere in the title

```typescript
// apps/api/src/services/chore-search.service.ts
export async function searchChores(
  householdId: string,
  searchTerm: string,
  limit: number = 10
): Promise<Chore[]> {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return [];
  }

  const sanitized = searchTerm.trim().toLowerCase();

  const results = await db.query.chores.findMany({
    where: and(
      eq(chores.householdId, householdId),
      eq(chores.isActive, true),
      ilike(chores.title, `%${sanitized}%`)
    ),
    limit: limit * 2, // Fetch extra for re-ranking
    orderBy: [desc(chores.updatedAt)],
  });

  // Client-side re-rank for prefix and word-boundary priority
  return results
    .sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const aPrefix = aTitle.startsWith(sanitized) ? 0 : 1;
      const bPrefix = bTitle.startsWith(sanitized) ? 0 : 1;
      if (aPrefix !== bPrefix) return aPrefix - bPrefix;

      const aWord = new RegExp(`\\b${sanitized}`).test(aTitle) ? 0 : 1;
      const bWord = new RegExp(`\\b${sanitized}`).test(bTitle) ? 0 : 1;
      return aWord - bWord;
    })
    .slice(0, limit);
}
```

### 4.2 Recently Accessed Chores

The last 5 chores a member interacted with are stored in localStorage under the key `chorechamp:recent-chores:{memberId}`. "Interaction" means viewing the chore detail page, completing the chore, or selecting it from the command palette.

```typescript
// apps/web/src/lib/recent-chores.ts
const MAX_RECENT = 5;

interface RecentChore {
  id: string;
  title: string;
  icon: string;
  category: string;
  accessedAt: number; // Unix timestamp
}

export function getRecentChores(memberId: string): RecentChore[] {
  const key = `chorechamp:recent-chores:${memberId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RecentChore[];
  } catch {
    return [];
  }
}

export function addRecentChore(memberId: string, chore: RecentChore): void {
  const key = `chorechamp:recent-chores:${memberId}`;
  const existing = getRecentChores(memberId).filter((c) => c.id !== chore.id);
  const updated = [{ ...chore, accessedAt: Date.now() }, ...existing].slice(0, MAX_RECENT);
  localStorage.setItem(key, JSON.stringify(updated));
}
```

---

## 5. Quick Actions

Quick actions are static navigation commands and chore creation shortcuts. They do not require an API call to resolve.

| Action | Label | Shortcut | Target |
|--------|-------|----------|--------|
| Create Chore | "Create new chore" | (none) | Opens chore creation dialog |
| Go to Board | "Go to Board view" | (none) | `/household/:id/board` |
| Go to Calendar | "Go to Calendar view" | (none) | `/household/:id/calendar` |
| Go to List | "Go to List view" | (none) | `/household/:id/list` |
| Go to Dashboard | "Go to Dashboard" | (none) | `/household/:id/dashboard` |
| Go to Settings | "Go to Settings" | (none) | `/household/:id/settings` |

```typescript
// apps/web/src/lib/command-actions.ts
export function getQuickActions(householdId: string): QuickAction[] {
  return [
    {
      id: 'create-chore',
      label: 'Create new chore',
      icon: PlusIcon,
      action: { type: 'dialog', dialog: 'create-chore' },
    },
    {
      id: 'go-board',
      label: 'Go to Board view',
      icon: LayoutIcon,
      action: { type: 'navigate', path: `/household/${householdId}/board` },
    },
    {
      id: 'go-calendar',
      label: 'Go to Calendar view',
      icon: CalendarIcon,
      action: { type: 'navigate', path: `/household/${householdId}/calendar` },
    },
    {
      id: 'go-list',
      label: 'Go to List view',
      icon: ListIcon,
      action: { type: 'navigate', path: `/household/${householdId}/list` },
    },
    {
      id: 'go-dashboard',
      label: 'Go to Dashboard',
      icon: BarChartIcon,
      action: { type: 'navigate', path: `/household/${householdId}/dashboard` },
    },
    {
      id: 'go-settings',
      label: 'Go to Settings',
      icon: SettingsIcon,
      action: { type: 'navigate', path: `/household/${householdId}/settings` },
    },
  ];
}
```

---

## 6. Components

### 6.1 CommandPalette

The command palette is built with the [cmdk](https://github.com/pacocoursey/cmdk) library, a headless React component for building command menus with built-in keyboard navigation, fuzzy filtering, and accessibility.

```typescript
// apps/web/src/components/CommandPalette.tsx
import { Command } from 'cmdk';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { householdId } = useCurrentHousehold();
  const { memberId } = useCurrentMember();
  const navigate = useNavigate();

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Debounced chore search
  const debouncedSearch = useDebouncedValue(search, 200);
  const { data: searchResults } = useChoreSearch(householdId, debouncedSearch);

  const recentChores = getRecentChores(memberId);
  const quickActions = getQuickActions(householdId);

  const handleSelectChore = (chore: Chore) => {
    addRecentChore(memberId, {
      id: chore.id,
      title: chore.title,
      icon: chore.icon,
      category: chore.category,
      accessedAt: Date.now(),
    });
    navigate(`/household/${householdId}/chores/${chore.id}`);
    setOpen(false);
    setSearch('');
  };

  const handleSelectAction = (action: QuickAction) => {
    if (action.action.type === 'navigate') {
      navigate(action.action.path);
    } else if (action.action.type === 'dialog') {
      openDialog(action.action.dialog);
    }
    setOpen(false);
    setSearch('');
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      className="fixed inset-0 z-50"
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg
                      bg-white dark:bg-gray-900 rounded-xl shadow-2xl border overflow-hidden">
        <Command.Input
          value={search}
          onValueChange={setSearch}
          placeholder="Search chores, navigate, or run a command..."
          className="w-full px-4 py-3 text-base border-b outline-none"
        />

        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-gray-500">
            No results found.
          </Command.Empty>

          {/* Search Results */}
          {searchResults && searchResults.length > 0 && (
            <Command.Group heading="Chores">
              {searchResults.map((chore) => (
                <Command.Item
                  key={chore.id}
                  value={chore.title}
                  onSelect={() => handleSelectChore(chore)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
                             data-[selected=true]:bg-blue-50 dark:data-[selected=true]:bg-blue-900/20"
                >
                  <span className="text-lg">{chore.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{chore.title}</div>
                    <div className="text-xs text-gray-500">{chore.category}</div>
                  </div>
                  <ChoreStatusBadge status={chore.isActive ? 'active' : 'paused'} />
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Recent Chores (shown when no search query) */}
          {!search && recentChores.length > 0 && (
            <Command.Group heading="Recent">
              {recentChores.map((chore) => (
                <Command.Item
                  key={chore.id}
                  value={`recent-${chore.title}`}
                  onSelect={() => {
                    navigate(`/household/${householdId}/chores/${chore.id}`);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
                             data-[selected=true]:bg-blue-50"
                >
                  <span className="text-lg">{chore.icon}</span>
                  <span className="text-sm">{chore.title}</span>
                  <ClockIcon className="w-3.5 h-3.5 text-gray-400 ml-auto" />
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Quick Actions */}
          <Command.Group heading="Quick Actions">
            {quickActions.map((action) => (
              <Command.Item
                key={action.id}
                value={action.label}
                onSelect={() => handleSelectAction(action)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
                           data-[selected=true]:bg-blue-50"
              >
                <action.icon className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{action.label}</span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>

        <div className="border-t px-4 py-2 flex items-center gap-4 text-xs text-gray-400">
          <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">↑↓</kbd> Navigate</span>
          <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">↵</kbd> Select</span>
          <span><kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">Esc</kbd> Close</span>
        </div>
      </div>
    </Command.Dialog>
  );
}
```

### 6.2 useChoreSearch Hook

```typescript
// apps/web/src/hooks/useChoreSearch.ts
export function useChoreSearch(householdId: string, searchTerm: string) {
  return useQuery({
    queryKey: ['chores', householdId, 'search', searchTerm],
    queryFn: () =>
      api.get(`/households/${householdId}/chores`, {
        params: { search: searchTerm, limit: 10 },
      }),
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 30_000,       // Cache results for 30 seconds
    placeholderData: [],     // Show empty list while loading
  });
}
```

### 6.3 useDebouncedValue Hook

```typescript
// apps/web/src/hooks/useDebouncedValue.ts
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
```

---

## 7. Keyboard Interaction

All keyboard behavior is handled by the `cmdk` library. The following table documents the expected interactions for reference and testing.

| Key | Behavior |
|-----|----------|
| `Cmd+K` (Mac) / `Ctrl+K` (Windows) | Toggle the command palette open/closed |
| `↑` / `↓` Arrow keys | Move highlight through the result list |
| `Enter` | Execute the highlighted item (navigate or open dialog) |
| `Escape` | Close the palette and clear the search input |
| Type any text | Filter results across all groups (chores, actions, recent) |
| `Backspace` on empty input | Close the palette |

---

## 8. Real-Time Events

The command palette does not emit or listen to real-time events. Chore search results reflect the state at query time. If a chore is created or deleted by another household member while the palette is open, the results will be stale until the next keystroke triggers a re-fetch.

---

## 9. Error Handling

| Error Code | Message | HTTP Status |
|------------|---------|-------------|
| `SEARCH_TERM_TOO_SHORT` | Search term must be at least 2 characters | 400 |
| `SEARCH_TERM_TOO_LONG` | Search term must not exceed 100 characters | 400 |
| `HOUSEHOLD_NOT_FOUND` | Household not found | 404 |

Client-side errors (localStorage full, JSON parse failure) are caught silently. The recent chores list degrades gracefully to an empty list if localStorage is unavailable.

---

## 10. Performance Considerations

- **Debounced search:** API calls are debounced by 200ms to avoid firing on every keystroke
- **Result limit:** Search returns a maximum of 10 results to keep the response fast and the UI scannable
- **Query caching:** React Query caches search results for 30 seconds, so repeated searches for the same term do not trigger additional API calls
- **No full-text index:** For households with fewer than 500 chores, `ILIKE` is sufficient. If performance becomes an issue at scale, a `pg_trgm` GIN index can be added to `chores.title` without schema changes
- **Bundle size:** The `cmdk` library is approximately 5KB gzipped, with no additional dependencies

---

## 11. Accessibility

- The command palette uses `role="dialog"` with `aria-label="Command palette"` for screen readers
- `cmdk` provides built-in ARIA attributes for combobox semantics (`role="combobox"`, `aria-expanded`, `aria-activedescendant`)
- Focus is trapped within the palette while open
- The overlay is marked `aria-hidden="true"` so screen readers skip it
- All keyboard shortcuts are documented in the palette footer for discoverability

---

## 12. Testing Strategy

### 12.1 Unit Tests
- `searchChores`: verify prefix match ranking, word boundary ranking, substring ranking, and result limiting
- `getRecentChores` / `addRecentChore`: verify localStorage read/write, deduplication, max 5 limit, and graceful failure on localStorage errors
- `getQuickActions`: verify correct paths are generated for a given household ID
- `useDebouncedValue`: verify debounce timing with fake timers
- `useChoreSearch`: verify query is disabled when search term is empty or under 2 characters

### 12.2 Integration Tests
- `GET /api/households/:id/chores?search=dishes`: verify correct chores are returned
- `GET /api/households/:id/chores?search=xx`: verify empty result set for non-matching term
- Verify search is case-insensitive
- Verify search respects household scoping (no cross-household leakage)

### 12.3 End-to-End Tests
- Press Cmd+K, type a chore name, verify matching results appear
- Select a chore result with Enter, verify navigation to the chore detail page
- Verify the selected chore appears in "Recent" on next palette open
- Press Cmd+K, select "Go to Calendar", verify navigation to the Calendar view
- Press Cmd+K, then Escape, verify the palette closes
- Verify arrow key navigation highlights items sequentially across all groups
- Open the palette on a mobile viewport (if supported), verify it renders correctly as a sheet

---

**Document Version:** 1.0.0
**Next Review:** After Phase 2 implementation
