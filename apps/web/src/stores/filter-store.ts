import { create } from 'zustand';
import type { ChoreFilter, SavedFilterView, FilterOperator } from '@chorechamp/types';

interface FilterStoreState {
  // Active filters
  activeFilters: ChoreFilter[];

  // Saved filter views
  savedFilters: SavedFilterView[];
  activeFilterId: string | null;

  // Search
  searchQuery: string;

  // Actions
  addFilter: (filter: ChoreFilter) => void;
  removeFilter: (index: number) => void;
  updateFilter: (index: number, filter: ChoreFilter) => void;
  clearFilters: () => void;
  setActiveFilters: (filters: ChoreFilter[]) => void;

  // Saved filters
  setSavedFilters: (filters: SavedFilterView[]) => void;
  applyFilter: (filterId: string) => void;
  clearActiveFilter: () => void;

  // Search
  setSearchQuery: (query: string) => void;
}

export const useFilterStore = create<FilterStoreState>((set, get) => ({
  activeFilters: [],
  savedFilters: [],
  activeFilterId: null,
  searchQuery: '',

  addFilter: (filter) =>
    set((state) => ({
      activeFilters: [...state.activeFilters, filter],
      activeFilterId: null,
    })),

  removeFilter: (index) =>
    set((state) => ({
      activeFilters: state.activeFilters.filter((_, i) => i !== index),
      activeFilterId: null,
    })),

  updateFilter: (index, filter) =>
    set((state) => ({
      activeFilters: state.activeFilters.map((f, i) => (i === index ? filter : f)),
      activeFilterId: null,
    })),

  clearFilters: () => set({ activeFilters: [], activeFilterId: null }),

  setActiveFilters: (filters) => set({ activeFilters: filters }),

  setSavedFilters: (filters) => set({ savedFilters: filters }),

  applyFilter: (filterId) => {
    const filter = get().savedFilters.find(f => f.id === filterId);
    if (filter) {
      set({
        activeFilters: filter.filters,
        activeFilterId: filterId,
      });
    }
  },

  clearActiveFilter: () => set({ activeFilterId: null, activeFilters: [] }),

  setSearchQuery: (query) => set({ searchQuery: query }),
}));
