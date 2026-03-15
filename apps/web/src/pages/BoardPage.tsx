import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Settings2, Search, Download, Upload, Printer } from 'lucide-react';
import { Button } from '@chorechamp/ui';
import {
  useHousehold,
  useMembers,
  useChores,
  useBoardPreferences,
  useBulkUpdateChores,
  useUpdateChore,
} from '@chorechamp/api-client';
import { useBoardStore } from '../stores/board-store';
import { useFilterStore } from '../stores/filter-store';
import { usePresence } from '../hooks/usePresence';
import { useAuth } from '../context/AuthContext';
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
  KanbanSkeleton,
  CalendarSkeleton,
  ListSkeleton,
  BoardHeaderSkeleton,
  NoChoresEmpty,
  NoFilterResultsEmpty,
  NoSearchResultsEmpty,
  SkipLinks,
  BoardErrorBoundary,
  PresenceAvatars,
  ExportDialog,
  ImportDialog,
  PrintView,
  MobileNavBar,
  MobileBottomSheet,
  MobileChoreCard,
  PointsBadge,
  StreakIndicator,
} from '../components/board';
import type { Chore, ChorePriority } from '@chorechamp/types';

export default function BoardPage() {
  const { householdId } = useParams<{ householdId: string }>();
  const navigate = useNavigate();

  // Auth & stores (all hooks must be called unconditionally)
  const { user } = useAuth();
  const { viewMode, loadPreferences } = useBoardStore();
  const { activeFilters, searchQuery, setSearchQuery } = useFilterStore();

  // UI state
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const [showSaveFilter, setShowSaveFilter] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [showBulkReschedule, setShowBulkReschedule] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [detailChoreId, setDetailChoreId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ choreId: string; choreTitle: string; x: number; y: number } | null>(null);

  // Queries (householdId may be undefined but hooks must be called unconditionally)
  const { data: household, isLoading: loadingHousehold } = useHousehold(householdId!);
  const { data: members = [], isLoading: loadingMembers } = useMembers(householdId!);
  const { data: boardPrefs } = useBoardPreferences(householdId!);

  const { data: chores = [], isLoading: loadingChores } = useChores(householdId!);

  // Presence
  const { onlineMembers } = usePresence({ householdId: householdId!, boardId: householdId! });

  // Mutations
  const bulkUpdate = useBulkUpdateChores(householdId!);
  const updateChore = useUpdateChore(householdId!);

  // Load board preferences on mount
  useEffect(() => {
    if (boardPrefs) {
      loadPreferences(boardPrefs);
    }
  }, [boardPrefs, loadPreferences]);

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
  }, [bulkUpdate.mutate]);

  const handleChangePriority = useCallback((choreId: string, priority: ChorePriority) => {
    bulkUpdate.mutate({ choreIds: [choreId], changes: { priority } });
  }, [bulkUpdate.mutate]);

  // Inline edit from list view
  const handleUpdateChoreField = useCallback((choreId: string, field: string, value: string) => {
    updateChore.mutate({ choreId, data: { [field]: value } });
  }, [updateChore.mutate]);

  // Guard: redirect if no householdId (after all hooks)
  if (!householdId) return <Navigate to="/" />;

  // Current member for gamification display
  const currentMember = members.find(m => m.userId === user?.id);

  // Detail chore data
  const detailChore = detailChoreId ? chores.find((c: Chore) => c.id === detailChoreId) ?? null : null;

  // Loading state
  if (loadingHousehold || loadingMembers) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <BoardHeaderSkeleton />
        <KanbanSkeleton />
      </div>
    );
  }

  return (
    <BoardErrorBoundary>
    <SkipLinks />
    <div className="mx-auto max-w-7xl px-4 py-4" id="main-content" data-testid="board-page">
      {/* Page header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{household?.name} Board</h1>
            <p className="text-sm text-gray-500">{chores.length} chores</p>
          </div>
          {currentMember && (
            <div className="hidden sm:flex items-center gap-2">
              <StreakIndicator streak={currentMember.streakCurrent} />
              <PointsBadge points={currentMember.pointsCurrent} variant="compact" />
            </div>
          )}
          <PresenceAvatars members={onlineMembers} maxVisible={5} />
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
            onClick={() => setShowExport(true)}
            title="Export chores"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImport(true)}
            title="Import chores"
          >
            <Upload className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrintView(true)}
            title="Print view"
          >
            <Printer className="h-4 w-4" />
          </Button>

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
        <div className="flex-1 min-w-0" id="board-content">
          {loadingChores ? (
            <>
              {viewMode === 'kanban' || viewMode === 'dashboard' ? <KanbanSkeleton /> : null}
              {viewMode === 'calendar' ? <CalendarSkeleton /> : null}
              {viewMode === 'list' ? <ListSkeleton /> : null}
            </>
          ) : chores.length === 0 ? (
            <>
              {searchQuery ? (
                <NoSearchResultsEmpty query={searchQuery} />
              ) : activeFilters.length > 0 ? (
                <NoFilterResultsEmpty />
              ) : (
                <NoChoresEmpty onCreateChore={() => navigate(`/household/${householdId}/chores/create`)} />
              )}
            </>
          ) : (
            <>
              {viewMode === 'kanban' && (
                <KanbanBoard
                  chores={chores}
                  onCardClick={handleChoreClick}
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
                  onUpdateChore={handleUpdateChoreField}
                />
              )}
              {viewMode === 'dashboard' && (
                <KanbanBoard
                  chores={chores}
                  onCardClick={handleChoreClick}
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

      {/* Export/Import dialogs */}
      <ExportDialog
        householdId={householdId!}
        open={showExport}
        onOpenChange={setShowExport}
      />
      <ImportDialog
        householdId={householdId!}
        open={showImport}
        onOpenChange={setShowImport}
      />

      {/* Mobile navigation bar */}
      <div className="md:hidden">
        <MobileNavBar
          activeTab={viewMode === 'calendar' ? 'calendar' : 'board'}
          onViewChange={(view) => {
            const store = useBoardStore.getState();
            store.setViewMode(view === 'calendar' ? 'calendar' : 'kanban');
          }}
          onShowFilters={() => setShowFilterBuilder(true)}
          onCreateChore={() => navigate(`/household/${householdId}/chores/create`)}
        />
      </div>

      {/* Mobile chore detail bottom sheet */}
      <MobileBottomSheet
        open={!!detailChoreId}
        onClose={() => setDetailChoreId(null)}
        title={detailChore?.title}
      >
        {detailChore && (
          <MobileChoreCard chore={detailChore} />
        )}
      </MobileBottomSheet>

      {/* Print view */}
      {showPrintView && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto print:static">
          <div className="p-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrintView(false)}
              className="mb-4 print:hidden"
            >
              Close Print View
            </Button>
            <PrintView
              chores={chores}
              householdName={household?.name || ''}
              viewMode={viewMode === 'dashboard' ? 'kanban' : viewMode as 'list' | 'kanban' | 'calendar'}
              members={members}
            />
          </div>
        </div>
      )}
    </div>
    </BoardErrorBoundary>
  );
}
