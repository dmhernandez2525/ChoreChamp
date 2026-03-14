import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from '../FilterBar';
import type { ChoreFilter } from '@chorechamp/types';

// Track mock store state so tests can modify it
const mockFilterStore = {
  activeFilters: [] as ChoreFilter[],
  removeFilter: vi.fn(),
  clearFilters: vi.fn(),
  searchQuery: '',
  setSearchQuery: vi.fn(),
  activeFilterId: null as string | null,
};

vi.mock('@/stores/filter-store', () => ({
  useFilterStore: vi.fn(() => mockFilterStore),
}));

// Mock the UI package
vi.mock('@chorechamp/ui', () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    size?: string;
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

describe('FilterBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFilterStore.activeFilters = [];
    mockFilterStore.searchQuery = '';
    mockFilterStore.activeFilterId = null;
  });

  it('returns null when there are no filters and no search query', () => {
    const { container } = render(<FilterBar />);
    expect(container.firstChild).toBeNull();
  });

  it('renders filter chips for active filters', () => {
    mockFilterStore.activeFilters = [
      { field: 'priority', operator: 'equals', value: 'high' },
      { field: 'category', operator: 'equals', value: 'kitchen' },
    ];

    render(<FilterBar />);

    expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
    expect(screen.getByText('Priority is high')).toBeInTheDocument();
    expect(screen.getByText('Category is kitchen')).toBeInTheDocument();
  });

  it('renders a search chip when searchQuery is set', () => {
    mockFilterStore.searchQuery = 'dishes';

    render(<FilterBar />);

    expect(screen.getByText(/Search:/)).toBeInTheDocument();
    expect(screen.getByText(/"dishes"/)).toBeInTheDocument();
  });

  it('renders unary operator filters without a value', () => {
    mockFilterStore.activeFilters = [
      { field: 'dueTime', operator: 'is_overdue', value: null },
    ];

    render(<FilterBar />);

    expect(screen.getByText('Due Time is overdue')).toBeInTheDocument();
  });

  it('calls removeFilter when clicking X on a filter chip', async () => {
    const user = userEvent.setup();
    mockFilterStore.activeFilters = [
      { field: 'priority', operator: 'equals', value: 'high' },
    ];

    render(<FilterBar />);

    // The X button is the child button of the filter chip
    const chipText = screen.getByText('Priority is high');
    const removeButton = chipText.parentElement?.querySelector('button');
    expect(removeButton).toBeTruthy();

    await user.click(removeButton!);
    expect(mockFilterStore.removeFilter).toHaveBeenCalledWith(0);
  });

  it('calls clearFilters and setSearchQuery when clicking Clear All', async () => {
    const user = userEvent.setup();
    mockFilterStore.activeFilters = [
      { field: 'priority', operator: 'equals', value: 'high' },
    ];

    render(<FilterBar />);

    const clearButton = screen.getByText('Clear All');
    await user.click(clearButton);

    expect(mockFilterStore.clearFilters).toHaveBeenCalled();
    expect(mockFilterStore.setSearchQuery).toHaveBeenCalledWith('');
  });

  it('clears search query when clicking X on the search chip', async () => {
    const user = userEvent.setup();
    mockFilterStore.searchQuery = 'test';

    render(<FilterBar />);

    const searchChip = screen.getByText(/Search:/).parentElement;
    const removeButton = searchChip?.querySelector('button');
    expect(removeButton).toBeTruthy();

    await user.click(removeButton!);
    expect(mockFilterStore.setSearchQuery).toHaveBeenCalledWith('');
  });

  it('shows Save button when filters exist and no saved filter is active', () => {
    mockFilterStore.activeFilters = [
      { field: 'category', operator: 'equals', value: 'kitchen' },
    ];
    const onSaveFilter = vi.fn();

    render(<FilterBar onSaveFilter={onSaveFilter} />);

    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('hides Save button when a saved filter is active', () => {
    mockFilterStore.activeFilters = [
      { field: 'category', operator: 'equals', value: 'kitchen' },
    ];
    mockFilterStore.activeFilterId = 'saved-1';
    const onSaveFilter = vi.fn();

    render(<FilterBar onSaveFilter={onSaveFilter} />);

    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('calls onSaveFilter when Save is clicked', async () => {
    const user = userEvent.setup();
    mockFilterStore.activeFilters = [
      { field: 'category', operator: 'equals', value: 'kitchen' },
    ];
    const onSaveFilter = vi.fn();

    render(<FilterBar onSaveFilter={onSaveFilter} />);

    await user.click(screen.getByText('Save'));
    expect(onSaveFilter).toHaveBeenCalled();
  });

  it('shows Add Filter button when onOpenFilterBuilder is provided', () => {
    mockFilterStore.searchQuery = 'test';

    render(<FilterBar onOpenFilterBuilder={vi.fn()} />);

    expect(screen.getByText('Add Filter')).toBeInTheDocument();
  });

  it('calls onOpenFilterBuilder when Add Filter is clicked', async () => {
    const user = userEvent.setup();
    mockFilterStore.searchQuery = 'test';
    const onOpenFilterBuilder = vi.fn();

    render(<FilterBar onOpenFilterBuilder={onOpenFilterBuilder} />);

    await user.click(screen.getByText('Add Filter'));
    expect(onOpenFilterBuilder).toHaveBeenCalled();
  });
});
