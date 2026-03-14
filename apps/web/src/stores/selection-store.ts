import { create } from 'zustand';

interface SelectionStoreState {
  // Selected chore IDs
  selectedIds: Set<string>;

  // Bulk selection mode
  isBulkMode: boolean;

  // Last selected (for shift-click range selection)
  lastSelectedId: string | null;

  // Actions
  select: (id: string) => void;
  deselect: (id: string) => void;
  toggle: (id: string) => void;
  selectRange: (ids: string[]) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
  toggleBulkMode: () => void;
  setBulkMode: (enabled: boolean) => void;
}

export const useSelectionStore = create<SelectionStoreState>((set) => ({
  selectedIds: new Set(),
  isBulkMode: false,
  lastSelectedId: null,

  select: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      next.add(id);
      return { selectedIds: next, lastSelectedId: id };
    }),

  deselect: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      next.delete(id);
      return {
        selectedIds: next,
        isBulkMode: next.size > 0 ? state.isBulkMode : false,
      };
    }),

  toggle: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return {
        selectedIds: next,
        lastSelectedId: id,
        isBulkMode: next.size > 0 ? true : false,
      };
    }),

  selectRange: (ids) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      for (const id of ids) {
        next.add(id);
      }
      return { selectedIds: next, isBulkMode: true };
    }),

  selectAll: (ids) =>
    set({
      selectedIds: new Set(ids),
      isBulkMode: ids.length > 0,
    }),

  deselectAll: () =>
    set({
      selectedIds: new Set(),
      isBulkMode: false,
      lastSelectedId: null,
    }),

  toggleBulkMode: () =>
    set((state) => ({
      isBulkMode: !state.isBulkMode,
      selectedIds: state.isBulkMode ? new Set() : state.selectedIds,
    })),

  setBulkMode: (enabled) =>
    set({
      isBulkMode: enabled,
      selectedIds: enabled ? new Set() : new Set(),
    }),
}));
