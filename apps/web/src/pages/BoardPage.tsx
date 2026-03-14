import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings2, Search } from 'lucide-react';
import { Button } from '@chorechamp/ui';
import {
  useHousehold,
  useMembers,
  useChores,
  useBoardPreferences,
  useUpdateBoardPreferences,
  useBulkUpdateChores,
  useBulkReorderChores,
} from '@chorechamp/api-client';
import { useAuth } from '../context/AuthContext';
import { useBoardStore } from '../stores/board-store';
import { useFilterStore } from '../stores/filter-store';
import { useSelectionStore } from '../stores/selection-store';
import {
  ViewSwitcher,
  KanbanBoard,
  CalendarView,
  ListView,
  FilterBar,
  FilterBuilder,
  SelectionToolbar,
  CommandPalette,
  ChoreDetailPanel,
  UndoToast,
  SaveFilterDialog,
  SavedFilterList,
  BulkAssignDialog,
  BulkRescheduleDialog,
  BulkDeleteConfirmation,
  CardContextMenu,
  KeyboardShortcutsHelp,
  ColumnSettingsPanel,
} from '../components/board';
import type { Chore, ChoreViewMode, ChorePriority } from '@chorechamp/types';

export default function BoardPage() {
  const { householdId } = useParams<{ householdId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Stores
  const { viewMode, setViewMode, loadPreferences } = useBoardStore();
  const { activeFilters, searchQuery, setSearchQuery } = useFilterStore();
  const { selectedIds } = useSelectionStore();

  // UI state
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const [showSaveFilter, setShowSaveFilter] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [showBulkReschedule, setShowBulkReschedule] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [detailChoreId, setDetailChoreId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ choreId: string; choreTitle: string; x: number; y: number } | null>(null);

  // Queries
  const { data: household, isLoading: loadingHousehold } = useHousehold(householdId!);
  const { data: members = [], isLoading: loadingMembers } = useMembers(householdId!);
  const { data: boardPrefs } = useBoardPreferences(householdId!);

  // Build chore query params from filter store
  const queryParams: Record<string, string> = {};
  if (searchQuery) queryParams.search = searchQuery;
  for (const filter of activeFilters) {
    if (filter.field && filter.value) {
      queryParams[filter.field] = String(filter.value);
    }
  }

  const { data: chores = [], isLoading: loadingChores } = useChores(householdId!, queryParams);

  // Mutations
  const updatePrefs = useUpdateBoardPreferences(householdId!);
  const bulkUpdate = useBulkUpdateChores(householdId!);
  const bulkReorder = useBulkReorderChores(householdId!);

  // Load board preferences on mount
  useEffect(() => {
    if (boardPrefs) {
      loadPreferences(boardPrefs);
    }
  }, [boardPrefs, loadPreferences]);

  // Save view mode preference when changed
  const handleViewChange = useCallback((mode: ChoreViewMode) => {
    setViewMode(mode);
    updatePrefs.mutate({ viewMode: mode });
  }, [setViewMode, updatePrefs]);

  // Open chore detail
  const handleChoreClick = useCallback((choreId: string) => {
    setDetailChoreId(choreId);
  }, []);

  // Edit chore (navigate to edit page)
  const handleEditChore = useCallback((choreId: string) => {
    navigate(`/household/${householdId}/chores/${choreId}/edit`);
  }, [navigate, householdId]);

  // Reschedule chore (from calendar drag)
  const handleReschedule = useCallback((choreId: string, newDate: string) => {
    bulkUpdate.mutate({ choreIds: [choreId], changes: { startDate: newDate } });
  }, [bulkUpdate]);

  // Context menu
  const handleContextMenu = useCallback((choreId: string, choreTitle: string, x: number, y: number) => {
    setContextMenu({ choreId, choreTitle, x, y });
  }, []);

  const handleChangePriority = useCallback((choreId: string, priority: ChorePriority) => {
    bulkUpdate.mutate({ choreIds: [choreId], changes: { priority } });
  }, [bulkUpdate]);

  // Detail chore data
  const detailChore = detailChoreId ? chores.find((c: Chore) => c.id === detailChoreId) ?? null : null;

  // Loading state
  if (loadingHousehold || loadingMembers) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-10 w-full rounded bg-gray-200" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-96 rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4" data-testid="board-page">
      {/* Page header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{household?.name} Board</h1>
          <p className="text-sm text-gray-500">{chores.length} chores</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chores..."
              className="w-48 rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-1.5 text-sm placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
            />
          </div>

          <ViewSwitcher />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowColumnSettings(true)}
          >
            <Settings2 className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            onClick={() => navigate(`/household/${householdId}/chores/create`)}
          >
            New Chore
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar
        onSaveFilter={() => setShowSaveFilter(true)}
        onOpenFilterBuilder={() => setShowFilterBuilder(!showFilterBuilder)}
      />

      {/* Filter builder (conditionally shown) */}
      {showFilterBuilder && (
        <div className="mt-2">
          <FilterBuilder onClose={() => setShowFilterBuilder(false)} />
        </div>
      )}

      {/* Saved filters sidebar */}
      <div className="mt-4 flex gap-4">
        {/* Optional sidebar for saved filters */}
        <div className="hidden lg:block w-48 flex-shrink-0">
          <SavedFilterList householdId={householdId!} />
        </div>

        {/* Main view area */}
        <div className="flex-1 min-w-0">
          {loadingChores ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : chores.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-200 py-16 text-center">
              <p className="text-lg font-medium text-gray-500">No chores found</p>
              <p className="mt-1 text-sm text-gray-400">
                {activeFilters.length > 0 || searchQuery
                  ? 'Try adjusting your filters or search query.'
                  : 'Create your first chore to get started.'}
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate(`/household/${householdId}/chores/create`)}
              >
                Create Chore
              </Button>
            </div>
          ) : (
            <>
              {viewMode === 'kanban' && (
                <KanbanBoard
                  chores={chores}
                  onChoreClick={handleChoreClick}
                />
              )}
              {viewMode === 'calendar' && (
                <CalendarView
                  chores={chores}
                  onChoreClick={handleChoreClick}
                  onReschedule={handleReschedule}
                />
              )}
              {viewMode === 'list' && (
                <ListView
                  chores={chores}
                  onChoreClick={handleChoreClick}
                />
              )}
              {viewMode === 'dashboard' && (
                <KanbanBoard
                  chores={chores}
                  onChoreClick={handleChoreClick}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating selection toolbar */}
      <SelectionToolbar
        onBulkAssign={() => setShowBulkAssign(true)}
        onBulkReschedule={() => setShowBulkReschedule(true)}
        onBulkDelete={() => setShowBulkDelete(true)}
      />

      {/* Chore detail slide-over */}
      <ChoreDetailPanel
        chore={detailChore}
        members={members}
        householdId={householdId!}
        open={!!detailChoreId}
        onClose={() => setDetailChoreId(null)}
        onEdit={handleEditChore}
      />

      {/* Dialogs */}
      <SaveFilterDialog
        householdId={householdId!}
        open={showSaveFilter}
        onOpenChange={setShowSaveFilter}
      />

      <ColumnSettingsPanel
        householdId={householdId!}
        open={showColumnSettings}
        onOpenChange={setShowColumnSettings}
      />

      <BulkAssignDialog
        householdId={householdId!}
        members={members}
        open={showBulkAssign}
        onOpenChange={setShowBulkAssign}
      />

      <BulkRescheduleDialog
        householdId={householdId!}
        open={showBulkReschedule}
        onOpenChange={setShowBulkReschedule}
      />

      <BulkDeleteConfirmation
        householdId={householdId!}
        open={showBulkDelete}
        onOpenChange={setShowBulkDelete}
      />

      {/* Context menu */}
      <CardContextMenu
        choreId={contextMenu?.choreId ?? ''}
        choreTitle={contextMenu?.choreTitle ?? ''}
        position={contextMenu ? { x: contextMenu.x, y: contextMenu.y } : null}
        onClose={() => setContextMenu(null)}
        onEdit={handleEditChore}
        onChangePriority={handleChangePriority}
      />

      {/* Global overlays */}
      <CommandPalette
        chores={chores}
        onChoreClick={handleChoreClick}
        onCreateChore={() => navigate(`/household/${householdId}/chores/create`)}
        onOpenFilters={() => setShowFilterBuilder(true)}
        onNavigate={(path) => navigate(path)}
      />

      <KeyboardShortcutsHelp />
      <UndoToast />
    </div>
  );
}
