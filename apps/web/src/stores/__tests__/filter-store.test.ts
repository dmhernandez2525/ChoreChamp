import { describe, it, expect, beforeEach } from 'vitest';
import { useFilterStore } from '../filter-store';
import type { ChoreFilter, SavedFilterView } from '@chorechamp/types';

describe('useFilterStore', () => {
  beforeEach(() => {
    useFilterStore.setState({
      activeFilters: [],
      savedFilters: [],
      activeFilterId: null,
      searchQuery: '',
    });
  });

  describe('addFilter', () => {
    it('adds a filter to the active filters list', () => {
      useFilterStore.getState().addFilter({
        field: 'priority',
        operator: 'equals',
        value: 'high',
      });

      const filters = useFilterStore.getState().activeFilters;
      expect(filters).toHaveLength(1);
      expect(filters[0]).toEqual({
        field: 'priority',
        operator: 'equals',
        value: 'high',
      });
    });

    it('appends multiple filters in order', () => {
      const store = useFilterStore.getState();
      store.addFilter({ field: 'priority', operator: 'equals', value: 'high' });
      useFilterStore.getState().addFilter({ field: 'category', operator: 'equals', value: 'kitchen' });

      expect(useFilterStore.getState().activeFilters).toHaveLength(2);
      expect(useFilterStore.getState().activeFilters[0].field).toBe('priority');
      expect(useFilterStore.getState().activeFilters[1].field).toBe('category');
    });

    it('clears activeFilterId when a filter is added', () => {
      useFilterStore.setState({ activeFilterId: 'saved-1' });
      useFilterStore.getState().addFilter({ field: 'priority', operator: 'equals', value: 'low' });

      expect(useFilterStore.getState().activeFilterId).toBeNull();
    });
  });

  describe('removeFilter', () => {
    it('removes a filter by index', () => {
      useFilterStore.setState({
        activeFilters: [
          { field: 'priority', operator: 'equals', value: 'high' },
          { field: 'category', operator: 'equals', value: 'kitchen' },
          { field: 'difficulty', operator: 'equals', value: 'hard' },
        ],
      });

      useFilterStore.getState().removeFilter(1);

      const filters = useFilterStore.getState().activeFilters;
      expect(filters).toHaveLength(2);
      expect(filters[0].field).toBe('priority');
      expect(filters[1].field).toBe('difficulty');
    });

    it('clears activeFilterId when removing a filter', () => {
      useFilterStore.setState({
        activeFilters: [{ field: 'priority', operator: 'equals', value: 'high' }],
        activeFilterId: 'saved-1',
      });

      useFilterStore.getState().removeFilter(0);

      expect(useFilterStore.getState().activeFilterId).toBeNull();
    });

    it('handles removing from a single-item list', () => {
      useFilterStore.setState({
        activeFilters: [{ field: 'priority', operator: 'equals', value: 'high' }],
      });

      useFilterStore.getState().removeFilter(0);

      expect(useFilterStore.getState().activeFilters).toEqual([]);
    });
  });

  describe('updateFilter', () => {
    it('replaces the filter at the given index', () => {
      useFilterStore.setState({
        activeFilters: [
          { field: 'priority', operator: 'equals', value: 'high' },
          { field: 'category', operator: 'equals', value: 'kitchen' },
        ],
      });

      useFilterStore.getState().updateFilter(1, {
        field: 'category',
        operator: 'equals',
        value: 'bathroom',
      });

      expect(useFilterStore.getState().activeFilters[1].value).toBe('bathroom');
      expect(useFilterStore.getState().activeFilters[0].value).toBe('high');
    });

    it('clears activeFilterId on update', () => {
      useFilterStore.setState({
        activeFilters: [{ field: 'priority', operator: 'equals', value: 'high' }],
        activeFilterId: 'saved-1',
      });

      useFilterStore.getState().updateFilter(0, {
        field: 'priority',
        operator: 'equals',
        value: 'urgent',
      });

      expect(useFilterStore.getState().activeFilterId).toBeNull();
    });
  });

  describe('clearFilters', () => {
    it('removes all active filters and clears activeFilterId', () => {
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

  describe('setActiveFilters', () => {
    it('replaces all active filters at once', () => {
      const filters: ChoreFilter[] = [
        { field: 'priority', operator: 'equals', value: 'high' },
        { field: 'category', operator: 'equals', value: 'kitchen' },
      ];

      useFilterStore.getState().setActiveFilters(filters);

      expect(useFilterStore.getState().activeFilters).toEqual(filters);
    });
  });

  describe('searchQuery', () => {
    it('starts with an empty search query', () => {
      expect(useFilterStore.getState().searchQuery).toBe('');
    });

    it('sets the search query', () => {
      useFilterStore.getState().setSearchQuery('dishes');
      expect(useFilterStore.getState().searchQuery).toBe('dishes');
    });

    it('clears the search query by setting empty string', () => {
      useFilterStore.getState().setSearchQuery('test');
      useFilterStore.getState().setSearchQuery('');
      expect(useFilterStore.getState().searchQuery).toBe('');
    });

    it('overwrites the previous query', () => {
      useFilterStore.getState().setSearchQuery('first');
      useFilterStore.getState().setSearchQuery('second');
      expect(useFilterStore.getState().searchQuery).toBe('second');
    });
  });

  describe('saved filters', () => {
    const savedFilter: SavedFilterView = {
      id: 'saved-1',
      householdId: 'h1',
      memberId: 'm1',
      name: 'Urgent Kitchen',
      filters: [
        { field: 'priority', operator: 'equals', value: 'urgent' },
        { field: 'category', operator: 'equals', value: 'kitchen' },
      ],
      sort: { field: 'boardOrder', direction: 'asc' },
      groupBy: null,
      visibility: 'private',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('sets saved filters', () => {
      useFilterStore.getState().setSavedFilters([savedFilter]);
      expect(useFilterStore.getState().savedFilters).toHaveLength(1);
      expect(useFilterStore.getState().savedFilters[0].name).toBe('Urgent Kitchen');
    });

    it('applies a saved filter by ID', () => {
      useFilterStore.setState({ savedFilters: [savedFilter] });

      useFilterStore.getState().applyFilter('saved-1');

      expect(useFilterStore.getState().activeFilterId).toBe('saved-1');
      expect(useFilterStore.getState().activeFilters).toHaveLength(2);
      expect(useFilterStore.getState().activeFilters[0].value).toBe('urgent');
      expect(useFilterStore.getState().activeFilters[1].value).toBe('kitchen');
    });

    it('does nothing when applying a nonexistent filter ID', () => {
      useFilterStore.setState({ savedFilters: [savedFilter] });

      useFilterStore.getState().applyFilter('nonexistent');

      expect(useFilterStore.getState().activeFilters).toEqual([]);
      expect(useFilterStore.getState().activeFilterId).toBeNull();
    });

    it('clears the active filter', () => {
      useFilterStore.setState({
        activeFilterId: 'saved-1',
        activeFilters: [{ field: 'priority', operator: 'equals', value: 'high' }],
      });

      useFilterStore.getState().clearActiveFilter();

      expect(useFilterStore.getState().activeFilterId).toBeNull();
      expect(useFilterStore.getState().activeFilters).toEqual([]);
    });
  });

  describe('hasActiveFilters (derived check)', () => {
    it('has no active filters initially', () => {
      const state = useFilterStore.getState();
      expect(state.activeFilters.length > 0 || state.searchQuery !== '').toBe(false);
    });

    it('considers filters as active when filters are set', () => {
      useFilterStore.getState().addFilter({ field: 'priority', operator: 'equals', value: 'high' });
      const state = useFilterStore.getState();
      expect(state.activeFilters.length > 0).toBe(true);
    });

    it('considers search query as active filtering', () => {
      useFilterStore.getState().setSearchQuery('dishes');
      const state = useFilterStore.getState();
      expect(state.searchQuery !== '').toBe(true);
    });
  });
});
