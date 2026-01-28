import { create } from 'zustand';

export type ChoreFilter = {
  status: 'all' | 'pending' | 'completed' | 'needs-approval';
  assignee: string | 'all';
  category: string | 'all';
  sortBy: 'dueTime' | 'points' | 'difficulty' | 'name';
  sortOrder: 'asc' | 'desc';
};

interface ChoreStoreState {
  // Selected household and member
  selectedHouseholdId: string | null;
  selectedMemberId: string | null;

  // Filters
  filters: ChoreFilter;

  // UI state
  selectedChoreId: string | null;
  isDetailModalOpen: boolean;

  // Actions
  setSelectedHousehold: (householdId: string | null) => void;
  setSelectedMember: (memberId: string | null) => void;
  setFilters: (filters: Partial<ChoreFilter>) => void;
  resetFilters: () => void;
  openChoreDetail: (choreId: string) => void;
  closeChoreDetail: () => void;
}

const defaultFilters: ChoreFilter = {
  status: 'all',
  assignee: 'all',
  category: 'all',
  sortBy: 'dueTime',
  sortOrder: 'asc',
};

export const useChoreStore = create<ChoreStoreState>((set) => ({
  selectedHouseholdId: null,
  selectedMemberId: null,
  filters: defaultFilters,
  selectedChoreId: null,
  isDetailModalOpen: false,

  setSelectedHousehold: (householdId) =>
    set({ selectedHouseholdId: householdId }),

  setSelectedMember: (memberId) => set({ selectedMemberId: memberId }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: defaultFilters }),

  openChoreDetail: (choreId) =>
    set({ selectedChoreId: choreId, isDetailModalOpen: true }),

  closeChoreDetail: () =>
    set({ selectedChoreId: null, isDetailModalOpen: false }),
}));
