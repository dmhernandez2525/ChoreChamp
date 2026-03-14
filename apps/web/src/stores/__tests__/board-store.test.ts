import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useBoardStore } from '../board-store';
import { useFilterStore } from '../filter-store';
import { useSelectionStore } from '../selection-store';
import { useUndoStore } from '../undo-store';

// Helper to reset Zustand stores between tests
function resetStore<T>(useStore: { setState: (state: Partial<T>) => void; getState: () => T }) {
  const initial = useStore.getState();
  useStore.setState(initial);
}

describe('useBoardStore', () => {
  beforeEach(() => {
    // Reset to defaults
    useBoardStore.setState({
      viewMode: 'dashboard',
      previousViewMode: null,
      columnSettings: {},
      groupBy: null,
      sort: { field: 'boardOrder', direction: 'asc' },
      calendarDate: new Date(),
      calendarView: 'month',
      isLoading: false,
    });
  });

  describe('viewMode', () => {
    it('defaults to dashboard', () => {
      expect(useBoardStore.getState().viewMode).toBe('dashboard');
    });

    it('sets viewMode and tracks previousViewMode', () => {
      useBoardStore.getState().setViewMode('kanban');

      const state = useBoardStore.getState();
      expect(state.viewMode).toBe('kanban');
      expect(state.previousViewMode).toBe('dashboard');
    });

    it('tracks each view mode transition', () => {
      useBoardStore.getState().setViewMode('kanban');
      useBoardStore.getState().setViewMode('calendar');

      const state = useBoardStore.getState();
      expect(state.viewMode).toBe('calendar');
      expect(state.previousViewMode).toBe('kanban');
    });

    it('supports all view modes', () => {
      const modes = ['kanban', 'calendar', 'list', 'dashboard'] as const;
      for (const mode of modes) {
        useBoardStore.getState().setViewMode(mode);
        expect(useBoardStore.getState().viewMode).toBe(mode);
      }
    });
  });

  describe('columnSettings', () => {
    it('starts with empty column settings', () => {
      expect(useBoardStore.getState().columnSettings).toEqual({});
    });

    it('sets column settings for a specific column', () => {
      useBoardStore.getState().setColumnSettings('urgent', { color: '#ff0000', wipLimit: 5 });

      expect(useBoardStore.getState().columnSettings.urgent).toEqual({
        color: '#ff0000',
        wipLimit: 5,
      });
    });

    it('merges column settings without overwriting other columns', () => {
      useBoardStore.getState().setColumnSettings('urgent', { color: '#ff0000' });
      useBoardStore.getState().setColumnSettings('high', { wipLimit: 3 });

      const settings = useBoardStore.getState().columnSettings;
      expect(settings.urgent).toEqual({ color: '#ff0000' });
      expect(settings.high).toEqual({ wipLimit: 3 });
    });

    it('merges partial updates for the same column', () => {
      useBoardStore.getState().setColumnSettings('urgent', { color: '#ff0000' });
      useBoardStore.getState().setColumnSettings('urgent', { wipLimit: 5 });

      expect(useBoardStore.getState().columnSettings.urgent).toEqual({
        color: '#ff0000',
        wipLimit: 5,
      });
    });

    it('can mark a column as hidden', () => {
      useBoardStore.getState().setColumnSettings('low', { hidden: true });
      expect(useBoardStore.getState().columnSettings.low?.hidden).toBe(true);
    });
  });

  describe('groupBy', () => {
    it('defaults to null', () => {
      expect(useBoardStore.getState().groupBy).toBeNull();
    });

    it('sets groupBy field', () => {
      useBoardStore.getState().setGroupBy('priority');
      expect(useBoardStore.getState().groupBy).toBe('priority');
    });

    it('clears groupBy when set to null', () => {
      useBoardStore.getState().setGroupBy('priority');
      useBoardStore.getState().setGroupBy(null);
      expect(useBoardStore.getState().groupBy).toBeNull();
    });
  });

  describe('sort', () => {
    it('defaults to boardOrder ascending', () => {
      expect(useBoardStore.getState().sort).toEqual({
        field: 'boardOrder',
        direction: 'asc',
      });
    });

    it('sets sort configuration', () => {
      useBoardStore.getState().setSort({ field: 'priority', direction: 'desc' });
      expect(useBoardStore.getState().sort).toEqual({
        field: 'priority',
        direction: 'desc',
      });
    });
  });

  describe('calendar state', () => {
    it('sets calendar date', () => {
      const date = new Date('2026-06-15');
      useBoardStore.getState().setCalendarDate(date);
      expect(useBoardStore.getState().calendarDate).toEqual(date);
    });

    it('defaults calendar view to month', () => {
      expect(useBoardStore.getState().calendarView).toBe('month');
    });

    it('switches calendar view to week', () => {
      useBoardStore.getState().setCalendarView('week');
      expect(useBoardStore.getState().calendarView).toBe('week');
    });
  });

  describe('loading state', () => {
    it('defaults to not loading', () => {
      expect(useBoardStore.getState().isLoading).toBe(false);
    });

    it('toggles loading state', () => {
      useBoardStore.getState().setIsLoading(true);
      expect(useBoardStore.getState().isLoading).toBe(true);

      useBoardStore.getState().setIsLoading(false);
      expect(useBoardStore.getState().isLoading).toBe(false);
    });
  });

  describe('loadPreferences', () => {
    it('loads preferences from saved data', () => {
      useBoardStore.getState().loadPreferences({
        viewMode: 'kanban',
        columnSettings: { urgent: { color: '#ff0000' } },
        defaultGroupBy: 'priority',
        defaultSort: { field: 'dueDate', direction: 'asc' },
      });

      const state = useBoardStore.getState();
      expect(state.viewMode).toBe('kanban');
      expect(state.columnSettings.urgent?.color).toBe('#ff0000');
      expect(state.groupBy).toBe('priority');
      expect(state.sort).toEqual({ field: 'dueDate', direction: 'asc' });
    });

    it('falls back to defaults when preferences are empty', () => {
      useBoardStore.getState().loadPreferences({});

      const state = useBoardStore.getState();
      expect(state.viewMode).toBe('dashboard');
      expect(state.columnSettings).toEqual({});
      expect(state.groupBy).toBeNull();
      expect(state.sort).toEqual({ field: 'boardOrder', direction: 'asc' });
    });
  });
});

describe('useFilterStore', () => {
  beforeEach(() => {
    useFilterStore.setState({
      activeFilters: [],
      savedFilters: [],
      activeFilterId: null,
      searchQuery: '',
    });
  });

  describe('filter management', () => {
    it('starts with no active filters', () => {
      expect(useFilterStore.getState().activeFilters).toEqual([]);
    });

    it('adds a filter', () => {
      useFilterStore.getState().addFilter({
        field: 'priority',
        operator: 'equals',
        value: 'high',
      });

      expect(useFilterStore.getState().activeFilters).toHaveLength(1);
      expect(useFilterStore.getState().activeFilters[0].field).toBe('priority');
    });

    it('clears activeFilterId when adding a filter', () => {
      useFilterStore.setState({ activeFilterId: 'saved-1' });
      useFilterStore.getState().addFilter({
        field: 'priority',
        operator: 'equals',
        value: 'high',
      });

      expect(useFilterStore.getState().activeFilterId).toBeNull();
    });

    it('removes a filter by index', () => {
      useFilterStore.setState({
        activeFilters: [
          { field: 'priority', operator: 'equals', value: 'high' },
          { field: 'category', operator: 'equals', value: 'kitchen' },
        ],
      });

      useFilterStore.getState().removeFilter(0);

      const filters = useFilterStore.getState().activeFilters;
      expect(filters).toHaveLength(1);
      expect(filters[0].field).toBe('category');
    });

    it('updates a filter at a specific index', () => {
      useFilterStore.setState({
        activeFilters: [
          { field: 'priority', operator: 'equals', value: 'high' },
        ],
      });

      useFilterStore.getState().updateFilter(0, {
        field: 'priority',
        operator: 'equals',
        value: 'urgent',
      });

      expect(useFilterStore.getState().activeFilters[0].value).toBe('urgent');
    });

    it('clears all filters', () => {
      useFilterStore.setState({
        activeFilters: [
          { field: 'priority', operator: 'equals', value: 'high' },
          { field: 'category', operator: 'equals', value: 'kitchen' },
        ],
        activeFilterId: 'saved-1',
      });

      useFilterStore.getState().clearFilters();

      expect(useFilterStore.getState().activeFilters).toEqual([]);
      expect(useFilterStore.getState().activeFilterId).toBeNull();
    });
  });

  describe('saved filters', () => {
    it('applies a saved filter by ID', () => {
      useFilterStore.setState({
        savedFilters: [
          {
            id: 'saved-1',
            householdId: 'h1',
            memberId: 'm1',
            name: 'My Filter',
            filters: [{ field: 'priority', operator: 'equals', value: 'urgent' }],
            sort: { field: 'boardOrder', direction: 'asc' },
            groupBy: null,
            visibility: 'private',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      useFilterStore.getState().applyFilter('saved-1');

      expect(useFilterStore.getState().activeFilterId).toBe('saved-1');
      expect(useFilterStore.getState().activeFilters).toHaveLength(1);
      expect(useFilterStore.getState().activeFilters[0].value).toBe('urgent');
    });

    it('does nothing when applying a nonexistent filter ID', () => {
      useFilterStore.getState().applyFilter('nonexistent');
      expect(useFilterStore.getState().activeFilters).toEqual([]);
    });

    it('clears the active saved filter', () => {
      useFilterStore.setState({ activeFilterId: 'saved-1' });
      useFilterStore.getState().clearActiveFilter();

      expect(useFilterStore.getState().activeFilterId).toBeNull();
      expect(useFilterStore.getState().activeFilters).toEqual([]);
    });
  });

  describe('search', () => {
    it('starts with an empty search query', () => {
      expect(useFilterStore.getState().searchQuery).toBe('');
    });

    it('sets the search query', () => {
      useFilterStore.getState().setSearchQuery('dishes');
      expect(useFilterStore.getState().searchQuery).toBe('dishes');
    });

    it('clears the search query', () => {
      useFilterStore.getState().setSearchQuery('dishes');
      useFilterStore.getState().setSearchQuery('');
      expect(useFilterStore.getState().searchQuery).toBe('');
    });
  });
});

describe('useSelectionStore', () => {
  beforeEach(() => {
    useSelectionStore.setState({
      selectedIds: new Set(),
      isBulkMode: false,
      lastSelectedId: null,
    });
  });

  it('starts with no selections', () => {
    const state = useSelectionStore.getState();
    expect(state.selectedIds.size).toBe(0);
    expect(state.isBulkMode).toBe(false);
  });

  it('selects an item and tracks lastSelectedId', () => {
    useSelectionStore.getState().select('c1');

    const state = useSelectionStore.getState();
    expect(state.selectedIds.has('c1')).toBe(true);
    expect(state.lastSelectedId).toBe('c1');
  });

  it('deselects an item', () => {
    useSelectionStore.getState().select('c1');
    useSelectionStore.getState().deselect('c1');

    expect(useSelectionStore.getState().selectedIds.has('c1')).toBe(false);
  });

  it('disables bulk mode when deselecting the last item', () => {
    useSelectionStore.setState({ isBulkMode: true, selectedIds: new Set(['c1']) });
    useSelectionStore.getState().deselect('c1');

    expect(useSelectionStore.getState().isBulkMode).toBe(false);
  });

  it('toggles selection on and off', () => {
    useSelectionStore.getState().toggle('c1');
    expect(useSelectionStore.getState().selectedIds.has('c1')).toBe(true);
    expect(useSelectionStore.getState().isBulkMode).toBe(true);

    useSelectionStore.getState().toggle('c1');
    expect(useSelectionStore.getState().selectedIds.has('c1')).toBe(false);
    expect(useSelectionStore.getState().isBulkMode).toBe(false);
  });

  it('selects a range of IDs', () => {
    useSelectionStore.getState().selectRange(['c1', 'c2', 'c3']);

    const state = useSelectionStore.getState();
    expect(state.selectedIds.size).toBe(3);
    expect(state.isBulkMode).toBe(true);
  });

  it('selects all IDs', () => {
    useSelectionStore.getState().selectAll(['c1', 'c2', 'c3', 'c4']);

    const state = useSelectionStore.getState();
    expect(state.selectedIds.size).toBe(4);
    expect(state.isBulkMode).toBe(true);
  });

  it('deselects all', () => {
    useSelectionStore.getState().selectAll(['c1', 'c2']);
    useSelectionStore.getState().deselectAll();

    const state = useSelectionStore.getState();
    expect(state.selectedIds.size).toBe(0);
    expect(state.isBulkMode).toBe(false);
    expect(state.lastSelectedId).toBeNull();
  });

  it('toggles bulk mode', () => {
    useSelectionStore.getState().toggleBulkMode();
    expect(useSelectionStore.getState().isBulkMode).toBe(true);

    // Toggling off clears selection
    useSelectionStore.setState({ selectedIds: new Set(['c1']), isBulkMode: true });
    useSelectionStore.getState().toggleBulkMode();
    expect(useSelectionStore.getState().isBulkMode).toBe(false);
    expect(useSelectionStore.getState().selectedIds.size).toBe(0);
  });

  it('sets bulk mode explicitly', () => {
    useSelectionStore.getState().setBulkMode(true);
    expect(useSelectionStore.getState().isBulkMode).toBe(true);

    useSelectionStore.getState().setBulkMode(false);
    expect(useSelectionStore.getState().isBulkMode).toBe(false);
  });
});

describe('useUndoStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useUndoStore.setState({
      undoStack: [],
      redoStack: [],
      activeToast: null,
      toastTimeoutId: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with empty stacks', () => {
    const state = useUndoStore.getState();
    expect(state.undoStack).toHaveLength(0);
    expect(state.redoStack).toHaveLength(0);
  });

  it('pushes an action onto the undo stack', () => {
    useUndoStore.getState().pushAction({
      type: 'reorder',
      description: 'Reorder chores',
      undoFn: async () => {},
      redoFn: async () => {},
    });

    expect(useUndoStore.getState().undoStack).toHaveLength(1);
    expect(useUndoStore.getState().undoStack[0].type).toBe('reorder');
  });

  it('shows a toast when pushing an action', () => {
    useUndoStore.getState().pushAction({
      type: 'reorder',
      description: 'Reorder chores',
      undoFn: async () => {},
      redoFn: async () => {},
    });

    expect(useUndoStore.getState().activeToast).not.toBeNull();
    expect(useUndoStore.getState().activeToast?.description).toBe('Reorder chores');
  });

  it('clears the redo stack when a new action is pushed', () => {
    useUndoStore.setState({
      redoStack: [
        {
          id: 'old',
          type: 'test',
          description: 'old',
          undoFn: async () => {},
          redoFn: async () => {},
          timestamp: Date.now(),
        },
      ],
    });

    useUndoStore.getState().pushAction({
      type: 'new',
      description: 'new action',
      undoFn: async () => {},
      redoFn: async () => {},
    });

    expect(useUndoStore.getState().redoStack).toHaveLength(0);
  });

  it('undoes the most recent action', async () => {
    const undoFn = vi.fn().mockResolvedValue(undefined);
    useUndoStore.getState().pushAction({
      type: 'reorder',
      description: 'Reorder',
      undoFn,
      redoFn: async () => {},
    });

    await useUndoStore.getState().undo();

    expect(undoFn).toHaveBeenCalled();
    expect(useUndoStore.getState().undoStack).toHaveLength(0);
    expect(useUndoStore.getState().redoStack).toHaveLength(1);
  });

  it('redoes the most recently undone action', async () => {
    const redoFn = vi.fn().mockResolvedValue(undefined);
    useUndoStore.getState().pushAction({
      type: 'reorder',
      description: 'Reorder',
      undoFn: async () => {},
      redoFn,
    });

    await useUndoStore.getState().undo();
    await useUndoStore.getState().redo();

    expect(redoFn).toHaveBeenCalled();
    expect(useUndoStore.getState().undoStack).toHaveLength(1);
    expect(useUndoStore.getState().redoStack).toHaveLength(0);
  });

  it('does nothing when undo is called with empty stack', async () => {
    await useUndoStore.getState().undo();
    expect(useUndoStore.getState().undoStack).toHaveLength(0);
  });

  it('does nothing when redo is called with empty stack', async () => {
    await useUndoStore.getState().redo();
    expect(useUndoStore.getState().redoStack).toHaveLength(0);
  });

  it('clears all stacks', () => {
    useUndoStore.getState().pushAction({
      type: 'test',
      description: 'test',
      undoFn: async () => {},
      redoFn: async () => {},
    });

    useUndoStore.getState().clearStacks();

    const state = useUndoStore.getState();
    expect(state.undoStack).toHaveLength(0);
    expect(state.redoStack).toHaveLength(0);
    expect(state.activeToast).toBeNull();
  });

  it('dismisses the toast', () => {
    useUndoStore.getState().pushAction({
      type: 'test',
      description: 'test',
      undoFn: async () => {},
      redoFn: async () => {},
    });

    expect(useUndoStore.getState().activeToast).not.toBeNull();

    useUndoStore.getState().dismissToast();

    expect(useUndoStore.getState().activeToast).toBeNull();
  });

  it('respects max stack size of 50', () => {
    for (let i = 0; i < 60; i++) {
      useUndoStore.getState().pushAction({
        type: 'test',
        description: `action ${i}`,
        undoFn: async () => {},
        redoFn: async () => {},
      });
    }

    expect(useUndoStore.getState().undoStack.length).toBeLessThanOrEqual(50);
  });
});
