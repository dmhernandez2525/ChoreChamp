import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock navigate and useParams
const mockNavigate = vi.fn();
const mockParams: Record<string, string | undefined> = { householdId: 'hh-001' };

vi.mock('react-router-dom', () => ({
  useParams: () => mockParams,
  useNavigate: () => mockNavigate,
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
}));

// Mock auth context
const mockUser = { id: 'user-1', name: 'Test Parent', email: 'parent@example.com' };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock board store
const mockBoardStore = {
  viewMode: 'kanban' as string,
  loadPreferences: vi.fn(),
  setViewMode: vi.fn(),
};
vi.mock('../stores/board-store', () => ({
  useBoardStore: Object.assign(vi.fn(() => mockBoardStore), {
    getState: () => mockBoardStore,
  }),
}));

// Mock filter store
const mockFilterStore = {
  activeFilters: [] as { field?: string; value?: unknown }[],
  searchQuery: '',
  setSearchQuery: vi.fn(),
};
vi.mock('../stores/filter-store', () => ({
  useFilterStore: vi.fn(() => mockFilterStore),
}));

// Mock presence hook
vi.mock('../hooks/usePresence', () => ({
  usePresence: () => ({ onlineMembers: [] }),
}));

// Mock API client hooks
const mockHousehold = { id: 'hh-001', name: 'Smith Family' };
const mockMembers = [
  { id: 'm-1', userId: 'user-1', name: 'Test Parent', role: 'parent', streakCurrent: 5, pointsCurrent: 120 },
  { id: 'm-2', userId: 'user-2', name: 'Test Child', role: 'child', streakCurrent: 3, pointsCurrent: 80 },
];
const mockChores = [
  { id: 'c-1', title: 'Wash dishes', status: 'todo', priority: 'medium' },
  { id: 'c-2', title: 'Vacuum living room', status: 'in_progress', priority: 'high' },
];

const mockApiState = {
  household: { data: mockHousehold, isLoading: false },
  members: { data: mockMembers, isLoading: false },
  chores: { data: mockChores, isLoading: false },
  boardPrefs: { data: null },
  bulkUpdate: { mutate: vi.fn() },
  updateChore: { mutate: vi.fn() },
};

vi.mock('@chorechamp/api-client', () => ({
  useHousehold: () => mockApiState.household,
  useMembers: () => mockApiState.members,
  useChores: () => mockApiState.chores,
  useBoardPreferences: () => mockApiState.boardPrefs,
  useBulkUpdateChores: () => mockApiState.bulkUpdate,
  useUpdateChore: () => mockApiState.updateChore,
}));

// Mock @chorechamp/ui
vi.mock('@chorechamp/ui', () => ({
  Button: ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void; [key: string]: unknown }) => (
    <button onClick={onClick} data-variant={props.variant} data-size={props.size} title={props.title as string}>
      {children}
    </button>
  ),
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Settings2: () => <span data-testid="icon-settings2" />,
  Search: () => <span data-testid="icon-search" />,
  Download: () => <span data-testid="icon-download" />,
  Upload: () => <span data-testid="icon-upload" />,
  Printer: () => <span data-testid="icon-printer" />,
}));

// Mock all board components
vi.mock('../components/board', () => ({
  ViewSwitcher: () => <div data-testid="view-switcher">ViewSwitcher</div>,
  KanbanBoard: ({ chores, onCardClick }: { chores: unknown[]; onCardClick: (id: string) => void }) => (
    <div data-testid="kanban-board" onClick={() => onCardClick('c-1')}>
      KanbanBoard ({chores.length} chores)
    </div>
  ),
  CalendarView: ({ chores }: { chores: unknown[] }) => (
    <div data-testid="calendar-view">CalendarView ({chores.length} chores)</div>
  ),
  ListView: ({ chores }: { chores: unknown[] }) => (
    <div data-testid="list-view">ListView ({chores.length} chores)</div>
  ),
  FilterBar: ({ onOpenFilterBuilder }: { onSaveFilter: () => void; onOpenFilterBuilder: () => void }) => (
    <div data-testid="filter-bar" onClick={onOpenFilterBuilder}>FilterBar</div>
  ),
  FilterBuilder: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="filter-builder"><button onClick={onClose}>Close</button></div>
  ),
  SelectionToolbar: () => <div data-testid="selection-toolbar" />,
  CommandPalette: () => <div data-testid="command-palette" />,
  ChoreDetailPanel: ({ open }: { open: boolean; [key: string]: unknown }) => (
    open ? <div data-testid="chore-detail-panel">Detail Panel</div> : null
  ),
  UndoToast: () => <div data-testid="undo-toast" />,
  SaveFilterDialog: () => <div data-testid="save-filter-dialog" />,
  SavedFilterList: () => <div data-testid="saved-filter-list" />,
  BulkAssignDialog: () => <div data-testid="bulk-assign-dialog" />,
  BulkRescheduleDialog: () => <div data-testid="bulk-reschedule-dialog" />,
  BulkDeleteConfirmation: () => <div data-testid="bulk-delete-confirmation" />,
  CardContextMenu: () => <div data-testid="card-context-menu" />,
  KeyboardShortcutsHelp: () => <div data-testid="keyboard-shortcuts-help" />,
  ColumnSettingsPanel: () => <div data-testid="column-settings-panel" />,
  KanbanSkeleton: () => <div data-testid="kanban-skeleton">Loading kanban...</div>,
  CalendarSkeleton: () => <div data-testid="calendar-skeleton">Loading calendar...</div>,
  ListSkeleton: () => <div data-testid="list-skeleton">Loading list...</div>,
  BoardHeaderSkeleton: () => <div data-testid="board-header-skeleton">Loading header...</div>,
  NoChoresEmpty: ({ onCreateChore }: { onCreateChore: () => void }) => (
    <div data-testid="no-chores-empty"><button onClick={onCreateChore}>Create Chore</button></div>
  ),
  NoFilterResultsEmpty: () => <div data-testid="no-filter-results-empty">No filter results</div>,
  NoSearchResultsEmpty: ({ query }: { query: string }) => (
    <div data-testid="no-search-results-empty">No results for "{query}"</div>
  ),
  SkipLinks: () => <div data-testid="skip-links" />,
  BoardErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PresenceAvatars: () => <div data-testid="presence-avatars" />,
  ExportDialog: () => <div data-testid="export-dialog" />,
  ImportDialog: () => <div data-testid="import-dialog" />,
  PrintView: () => <div data-testid="print-view" />,
  MobileNavBar: () => <div data-testid="mobile-nav-bar" />,
  MobileBottomSheet: ({ children, open }: { children: React.ReactNode; open: boolean; [key: string]: unknown }) => (
    open ? <div data-testid="mobile-bottom-sheet">{children}</div> : null
  ),
  MobileChoreCard: () => <div data-testid="mobile-chore-card" />,
  PointsBadge: ({ points }: { points: number; variant?: string }) => (
    <span data-testid="points-badge">{points} pts</span>
  ),
  StreakIndicator: ({ streak }: { streak: number }) => (
    <span data-testid="streak-indicator">{streak} streak</span>
  ),
}));

import BoardPage from './BoardPage';

describe('BoardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.householdId = 'hh-001';
    mockBoardStore.viewMode = 'kanban';
    mockFilterStore.activeFilters = [];
    mockFilterStore.searchQuery = '';
    mockApiState.household = { data: mockHousehold, isLoading: false };
    mockApiState.members = { data: mockMembers, isLoading: false };
    mockApiState.chores = { data: mockChores, isLoading: false };
  });

  it('redirects to / when householdId is missing', () => {
    mockParams.householdId = undefined;
    render(<BoardPage />);
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/');
  });

  it('renders loading skeletons when household is loading', () => {
    mockApiState.household = { data: null as unknown as typeof mockHousehold, isLoading: true };
    mockApiState.members = { data: mockMembers, isLoading: false };
    render(<BoardPage />);
    expect(screen.getByTestId('board-header-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-skeleton')).toBeInTheDocument();
  });

  it('renders loading skeletons when members are loading', () => {
    mockApiState.household = { data: mockHousehold, isLoading: false };
    mockApiState.members = { data: [] as typeof mockMembers, isLoading: true };
    render(<BoardPage />);
    expect(screen.getByTestId('board-header-skeleton')).toBeInTheDocument();
  });

  it('renders the board page with household name', () => {
    render(<BoardPage />);
    expect(screen.getByText('Smith Family Board')).toBeInTheDocument();
  });

  it('displays chore count', () => {
    render(<BoardPage />);
    expect(screen.getByText('2 chores')).toBeInTheDocument();
  });

  it('renders the search input with placeholder', () => {
    render(<BoardPage />);
    expect(screen.getByPlaceholderText('Search chores...')).toBeInTheDocument();
  });

  it('calls setSearchQuery when typing in search input', () => {
    render(<BoardPage />);
    const searchInput = screen.getByPlaceholderText('Search chores...');
    fireEvent.change(searchInput, { target: { value: 'dishes' } });
    expect(mockFilterStore.setSearchQuery).toHaveBeenCalledWith('dishes');
  });

  it('renders the kanban board by default', () => {
    render(<BoardPage />);
    expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
  });

  it('renders the calendar view when viewMode is calendar', () => {
    mockBoardStore.viewMode = 'calendar';
    render(<BoardPage />);
    expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
  });

  it('renders the list view when viewMode is list', () => {
    mockBoardStore.viewMode = 'list';
    render(<BoardPage />);
    expect(screen.getByTestId('list-view')).toBeInTheDocument();
  });

  it('renders ViewSwitcher component', () => {
    render(<BoardPage />);
    expect(screen.getByTestId('view-switcher')).toBeInTheDocument();
  });

  it('renders the New Chore button', () => {
    render(<BoardPage />);
    expect(screen.getByText('New Chore')).toBeInTheDocument();
  });

  it('navigates to create chore page when New Chore is clicked', () => {
    render(<BoardPage />);
    fireEvent.click(screen.getByText('New Chore'));
    expect(mockNavigate).toHaveBeenCalledWith('/household/hh-001/chores/create');
  });

  it('shows NoChoresEmpty when there are no chores', () => {
    mockApiState.chores = { data: [], isLoading: false };
    render(<BoardPage />);
    expect(screen.getByTestId('no-chores-empty')).toBeInTheDocument();
  });

  it('shows NoSearchResultsEmpty when search yields no results', () => {
    mockApiState.chores = { data: [], isLoading: false };
    mockFilterStore.searchQuery = 'nonexistent';
    render(<BoardPage />);
    expect(screen.getByTestId('no-search-results-empty')).toBeInTheDocument();
    expect(screen.getByText('No results for "nonexistent"')).toBeInTheDocument();
  });

  it('shows NoFilterResultsEmpty when filters yield no results', () => {
    mockApiState.chores = { data: [], isLoading: false };
    mockFilterStore.activeFilters = [{ field: 'status', value: 'done' }];
    render(<BoardPage />);
    expect(screen.getByTestId('no-filter-results-empty')).toBeInTheDocument();
  });

  it('renders gamification elements for current member', () => {
    render(<BoardPage />);
    expect(screen.getByTestId('streak-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('points-badge')).toBeInTheDocument();
    expect(screen.getByText('5 streak')).toBeInTheDocument();
    expect(screen.getByText('120 pts')).toBeInTheDocument();
  });

  it('renders presence avatars', () => {
    render(<BoardPage />);
    expect(screen.getByTestId('presence-avatars')).toBeInTheDocument();
  });

  it('renders export and import buttons', () => {
    render(<BoardPage />);
    expect(screen.getByTitle('Export chores')).toBeInTheDocument();
    expect(screen.getByTitle('Import chores')).toBeInTheDocument();
  });

  it('renders print view button', () => {
    render(<BoardPage />);
    expect(screen.getByTitle('Print view')).toBeInTheDocument();
  });

  it('shows loading skeletons for chores when chores are loading', () => {
    mockApiState.chores = { data: [], isLoading: true };
    render(<BoardPage />);
    expect(screen.getByTestId('kanban-skeleton')).toBeInTheDocument();
  });

  it('shows calendar skeleton when loading in calendar mode', () => {
    mockBoardStore.viewMode = 'calendar';
    mockApiState.chores = { data: [], isLoading: true };
    render(<BoardPage />);
    expect(screen.getByTestId('calendar-skeleton')).toBeInTheDocument();
  });

  it('shows list skeleton when loading in list mode', () => {
    mockBoardStore.viewMode = 'list';
    mockApiState.chores = { data: [], isLoading: true };
    render(<BoardPage />);
    expect(screen.getByTestId('list-skeleton')).toBeInTheDocument();
  });
});
