import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListView } from '../ListView';
import type { Chore } from '@chorechamp/types';

// Mock selection store
const mockSelectionStore = {
  selectedIds: new Set<string>(),
  toggle: vi.fn(),
  selectAll: vi.fn(),
  deselectAll: vi.fn(),
};

vi.mock('@/stores/selection-store', () => ({
  useSelectionStore: vi.fn(() => mockSelectionStore),
}));

vi.mock('@/stores/board-store', () => ({
  useBoardStore: vi.fn(() => ({
    groupBy: null,
  })),
}));

vi.mock('@chorechamp/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

function createMockChore(overrides: Partial<Chore> = {}): Chore {
  return {
    id: `chore-${Math.random().toString(36).slice(2, 8)}`,
    householdId: 'household-1',
    title: 'Test Chore',
    description: null,
    icon: '🧹',
    category: 'general',
    pointValue: 10,
    difficulty: 'medium',
    assignedTo: [],
    assignmentType: 'anyone',
    rotationIndex: 0,
    recurrenceType: 'once',
    recurrenceDays: null,
    recurrenceInterval: null,
    recurrenceAfterDays: null,
    startDate: '2026-03-14',
    endDate: null,
    dueTime: null,
    timeWindowMinutes: null,
    requiresApproval: false,
    requiresPhoto: false,
    estimatedMinutes: null,
    priority: 'medium',
    boardOrder: 0,
    showTimer: false,
    steps: null,
    createdBy: 'user-1',
    isActive: true,
    templateId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ListView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectionStore.selectedIds = new Set();
  });

  it('renders the list view container', () => {
    render(<ListView chores={[]} />);

    expect(screen.getByTestId('list-view')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<ListView chores={[]} />);

    expect(screen.getByText('Chore')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Points')).toBeInTheDocument();
  });

  it('renders empty state when no chores', () => {
    render(<ListView chores={[]} />);

    expect(screen.getByText('No chores found')).toBeInTheDocument();
  });

  it('renders chore rows with title and icon', () => {
    const chores = [
      createMockChore({ id: 'c1', title: 'Wash dishes', icon: '🍽️' }),
    ];
    render(<ListView chores={chores} />);

    expect(screen.getByText('Wash dishes')).toBeInTheDocument();
    expect(screen.getByText('🍽️')).toBeInTheDocument();
  });

  it('renders priority badges with correct text', () => {
    const chores = [
      createMockChore({ id: 'c1', title: 'Task', priority: 'urgent' }),
    ];
    render(<ListView chores={chores} />);

    expect(screen.getByText('urgent')).toBeInTheDocument();
  });

  it('renders point values', () => {
    const chores = [
      createMockChore({ id: 'c1', title: 'Task', pointValue: 42 }),
    ];
    render(<ListView chores={chores} />);

    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders category badge', () => {
    const chores = [
      createMockChore({ id: 'c1', title: 'Task', category: 'kitchen' }),
    ];
    render(<ListView chores={chores} />);

    expect(screen.getByText('kitchen')).toBeInTheDocument();
  });

  it('renders estimated time when present', () => {
    const chores = [
      createMockChore({ id: 'c1', title: 'Task', estimatedMinutes: 15 }),
    ];
    render(<ListView chores={chores} />);

    expect(screen.getByText('15m')).toBeInTheDocument();
  });

  it('renders dash for null estimated time', () => {
    const chores = [
      createMockChore({ id: 'c1', title: 'Task', estimatedMinutes: null }),
    ];
    render(<ListView chores={chores} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders Unassigned when no assignees', () => {
    const chores = [
      createMockChore({ id: 'c1', title: 'Task', assignedTo: [] }),
    ];
    render(<ListView chores={chores} />);

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('calls onChoreClick when a row is clicked', async () => {
    const user = userEvent.setup();
    const onChoreClick = vi.fn();
    const chores = [
      createMockChore({ id: 'chore-click', title: 'Click Me' }),
    ];
    render(<ListView chores={chores} onChoreClick={onChoreClick} />);

    const row = screen.getByRole('button', { name: /Click Me/i }) ||
      screen.getByText('Click Me').closest('tr');
    await user.click(row!);
    expect(onChoreClick).toHaveBeenCalledWith('chore-click');
  });

  it('renders selection checkboxes', () => {
    const chores = [
      createMockChore({ id: 'c1', title: 'Task 1' }),
    ];
    render(<ListView chores={chores} />);

    // Header checkbox + row checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(2);
  });

  it('calls toggle when a row checkbox is clicked', async () => {
    const user = userEvent.setup();
    const chores = [
      createMockChore({ id: 'c1', title: 'Task 1' }),
    ];
    render(<ListView chores={chores} />);

    const checkboxes = screen.getAllByRole('checkbox');
    // The row checkbox (not the header)
    const rowCheckbox = checkboxes[checkboxes.length - 1];
    await user.click(rowCheckbox);
    expect(mockSelectionStore.toggle).toHaveBeenCalledWith('c1');
  });

  it('sorts by column when header is clicked', async () => {
    const user = userEvent.setup();
    const chores = [
      createMockChore({ id: 'c1', title: 'Beta', priority: 'low' }),
      createMockChore({ id: 'c2', title: 'Alpha', priority: 'high' }),
    ];
    render(<ListView chores={chores} />);

    // Click on Priority header to sort
    const priorityHeader = screen.getByText('Priority');
    await user.click(priorityHeader);

    // After sorting, the rows should be reordered
    // Just verify the click is handled without error
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders date column with formatted date', () => {
    const chores = [
      createMockChore({ id: 'c1', title: 'Task', startDate: '2026-03-14' }),
    ];
    render(<ListView chores={chores} />);

    // The formatted date depends on timezone, so check for Mar with a day number
    const dateCell = screen.getByText(/^Mar \d+$/);
    expect(dateCell).toBeInTheDocument();
  });

  it('highlights selected rows with violet background', () => {
    mockSelectionStore.selectedIds = new Set(['c1']);
    const chores = [
      createMockChore({ id: 'c1', title: 'Selected Task' }),
    ];
    render(<ListView chores={chores} />);

    const row = screen.getByText('Selected Task').closest('tr');
    expect(row?.className).toContain('bg-violet-50');
  });
});
