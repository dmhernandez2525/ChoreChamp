import { create } from 'zustand';
import type { ChoreViewMode, ChorePriority } from '@chorechamp/types';

interface ColumnSettings {
  color?: string;
  wipLimit?: number;
  hidden?: boolean;
  order?: number;
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface BoardStoreState {
  // View mode
  viewMode: ChoreViewMode;
  previousViewMode: ChoreViewMode | null;

  // Column settings (for kanban)
  columnSettings: Record<string, ColumnSettings>;

  // Grouping and sorting
  groupBy: string | null;
  sort: SortConfig;

  // Calendar state
  calendarDate: Date;
  calendarView: 'month' | 'week';

  // Loading state
  isLoading: boolean;

  // Actions
  setViewMode: (mode: ChoreViewMode) => void;
  setColumnSettings: (columnId: string, settings: ColumnSettings) => void;
  setGroupBy: (field: string | null) => void;
  setSort: (sort: SortConfig) => void;
  setCalendarDate: (date: Date) => void;
  setCalendarView: (view: 'month' | 'week') => void;
  setIsLoading: (loading: boolean) => void;
  loadPreferences: (prefs: {
    viewMode?: ChoreViewMode;
    columnSettings?: Record<string, ColumnSettings>;
    defaultGroupBy?: string | null;
    defaultSort?: SortConfig;
  }) => void;
}

export const useBoardStore = create<BoardStoreState>((set) => ({
  viewMode: 'dashboard',
  previousViewMode: null,
  columnSettings: {},
  groupBy: null,
  sort: { field: 'boardOrder', direction: 'asc' },
  calendarDate: new Date(),
  calendarView: 'month',
  isLoading: false,

  setViewMode: (mode) =>
    set((state) => ({
      viewMode: mode,
      previousViewMode: state.viewMode,
    })),

  setColumnSettings: (columnId, settings) =>
    set((state) => ({
      columnSettings: {
        ...state.columnSettings,
        [columnId]: { ...state.columnSettings[columnId], ...settings },
      },
    })),

  setGroupBy: (field) => set({ groupBy: field }),

  setSort: (sort) => set({ sort }),

  setCalendarDate: (date) => set({ calendarDate: date }),

  setCalendarView: (view) => set({ calendarView: view }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  loadPreferences: (prefs) =>
    set({
      viewMode: prefs.viewMode || 'dashboard',
      columnSettings: prefs.columnSettings || {},
      groupBy: prefs.defaultGroupBy || null,
      sort: prefs.defaultSort || { field: 'boardOrder', direction: 'asc' },
    }),
}));
