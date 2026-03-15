import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SavedFilterList } from '../SavedFilterList';
import type { SavedFilterView } from '@chorechamp/types';

// Mock filter store state
const mockFilterStore = {
  activeFilterId: null as string | null,
  applyFilter: vi.fn(),
  clearActiveFilter: vi.fn(),
  setSavedFilters: vi.fn(),
  savedFilters: [] as SavedFilterView[],
};

const mockGetState = vi.fn(() => mockFilterStore);

vi.mock('@/stores/filter-store', () => ({
  useFilterStore: Object.assign(vi.fn(() => mockFilterStore), {
    getState: () => mockGetState(),
  }),
}));

// Mock API client hooks
const mockFiltersData: SavedFilterView[] = [];
const mockIsLoading = { value: false };
const mockDeleteMutate = vi.fn();

vi.mock('@chorechamp/api-client', () => ({
  useSavedFilters: vi.fn(() => ({
    data: mockFiltersData,
    isLoading: mockIsLoading.value,
  })),
  useDeleteSavedFilter: vi.fn(() => ({
    mutate: mockDeleteMutate,
  })),
}));

vi.mock('@chorechamp/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

vi.mock('lucide-react', () => ({
  Bookmark: ({ className }: { className?: string }) => <svg data-testid="bookmark-icon" className={className} />,
  Trash2: ({ className }: { className?: string }) => <svg data-testid="trash-icon" className={className} />,
  Lock: ({ className }: { className?: string }) => <svg data-testid="lock-icon" className={className} />,
  Users: ({ className }: { className?: string }) => <svg data-testid="users-icon" className={className} />,
  Check: ({ className }: { className?: string }) => <svg data-testid="check-icon" className={className} />,
}));

function createMockFilter(overrides: Partial<SavedFilterView> = {}): SavedFilterView {
  return {
    id: 'filter-1',
    householdId: 'household-1',
    memberId: 'member-1',
    name: 'My Filter',
    filters: [{ field: 'priority', operator: 'equals', value: 'high' }],
    sort: { field: 'createdAt', direction: 'desc' },
    groupBy: null,
    visibility: 'private',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('SavedFilterList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFiltersData.length = 0;
    mockIsLoading.value = false;
    mockFilterStore.activeFilterId = null;
    mockFilterStore.savedFilters = [];
  });

  it('renders loading state', () => {
    mockIsLoading.value = true;
    render(<SavedFilterList householdId="h1" />);

    expect(screen.getByText('Loading views...')).toBeInTheDocument();
  });

  it('renders empty state when no saved filters', () => {
    render(<SavedFilterList householdId="h1" />);

    expect(screen.getByText('No saved views yet')).toBeInTheDocument();
  });

  it('renders the list of saved filters', () => {
    mockFiltersData.push(
      createMockFilter({ id: 'f1', name: 'High Priority' }),
      createMockFilter({ id: 'f2', name: 'My Kitchen Chores' }),
    );
    render(<SavedFilterList householdId="h1" />);

    expect(screen.getByTestId('saved-filter-list')).toBeInTheDocument();
    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(screen.getByText('My Kitchen Chores')).toBeInTheDocument();
  });

  it('renders the section header', () => {
    mockFiltersData.push(createMockFilter());
    render(<SavedFilterList householdId="h1" />);

    expect(screen.getByText('Saved Views')).toBeInTheDocument();
  });

  it('shows filter count per filter', () => {
    mockFiltersData.push(
      createMockFilter({
        filters: [
          { field: 'priority', operator: 'equals', value: 'high' },
          { field: 'category', operator: 'equals', value: 'kitchen' },
        ],
      }),
    );
    render(<SavedFilterList householdId="h1" />);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls applyFilter when a filter is clicked', () => {
    mockFiltersData.push(createMockFilter({ id: 'f1', name: 'My Filter' }));
    render(<SavedFilterList householdId="h1" />);

    fireEvent.click(screen.getByText('My Filter'));
    expect(mockFilterStore.applyFilter).toHaveBeenCalledWith('f1');
  });

  it('calls clearActiveFilter when active filter is clicked again', () => {
    mockFilterStore.activeFilterId = 'f1';
    mockFiltersData.push(createMockFilter({ id: 'f1', name: 'Active Filter' }));
    render(<SavedFilterList householdId="h1" />);

    fireEvent.click(screen.getByText('Active Filter'));
    expect(mockFilterStore.clearActiveFilter).toHaveBeenCalledTimes(1);
  });

  it('calls deleteFilter.mutate when delete button is clicked', () => {
    mockFiltersData.push(createMockFilter({ id: 'f1', name: 'To Delete' }));
    render(<SavedFilterList householdId="h1" />);

    fireEvent.click(screen.getByLabelText('Delete To Delete'));
    expect(mockDeleteMutate).toHaveBeenCalledWith('f1');
  });

  it('does not trigger filter apply when delete is clicked (stopPropagation)', () => {
    mockFiltersData.push(createMockFilter({ id: 'f1', name: 'Test Filter' }));
    render(<SavedFilterList householdId="h1" />);

    fireEvent.click(screen.getByLabelText('Delete Test Filter'));
    expect(mockFilterStore.applyFilter).not.toHaveBeenCalled();
  });

  it('shows lock icon for private filters', () => {
    mockFiltersData.push(createMockFilter({ visibility: 'private' }));
    render(<SavedFilterList householdId="h1" />);

    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
  });

  it('shows users icon for household-visible filters', () => {
    mockFiltersData.push(createMockFilter({ visibility: 'household' }));
    render(<SavedFilterList householdId="h1" />);

    expect(screen.getByTestId('users-icon')).toBeInTheDocument();
  });

  it('shows check icon for the active filter', () => {
    mockFilterStore.activeFilterId = 'f1';
    mockFiltersData.push(createMockFilter({ id: 'f1' }));
    render(<SavedFilterList householdId="h1" />);

    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
  });

  it('shows bookmark icon for non-active filters', () => {
    mockFilterStore.activeFilterId = null;
    mockFiltersData.push(createMockFilter({ id: 'f1' }));
    render(<SavedFilterList householdId="h1" />);

    expect(screen.getByTestId('bookmark-icon')).toBeInTheDocument();
  });

  it('applies active styles to the selected filter', () => {
    mockFilterStore.activeFilterId = 'f1';
    mockFiltersData.push(createMockFilter({ id: 'f1', name: 'Active' }));
    render(<SavedFilterList householdId="h1" />);

    const btn = screen.getByText('Active').closest('button');
    expect(btn?.className).toContain('bg-violet-50');
  });

  it('applies custom className', () => {
    mockIsLoading.value = true;
    render(<SavedFilterList householdId="h1" className="my-class" />);

    // The loading wrapper should contain the class
    const wrapper = screen.getByText('Loading views...').parentElement;
    expect(wrapper?.className).toContain('my-class');
  });
});
