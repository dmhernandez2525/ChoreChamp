import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KanbanColumn } from '../KanbanColumn';
import type { Chore } from '@chorechamp/types';

// Mock dnd-kit
vi.mock('@dnd-kit/core', () => ({
  useDroppable: vi.fn(() => ({ setNodeRef: vi.fn(), isOver: false })),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  verticalListSortingStrategy: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => null),
    },
  },
}));

vi.mock('@chorechamp/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

vi.mock('@/stores/selection-store', () => ({
  useSelectionStore: vi.fn(() => ({
    selectedIds: new Set(),
    isBulkMode: false,
    toggle: vi.fn(),
  })),
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

describe('KanbanColumn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders column header with title', () => {
    render(<KanbanColumn id="urgent" title="Urgent" chores={[]} />);

    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('renders chore count in the header', () => {
    const chores = [
      createMockChore({ id: 'c1', title: 'Chore 1' }),
      createMockChore({ id: 'c2', title: 'Chore 2' }),
    ];
    render(<KanbanColumn id="medium" title="Medium" chores={chores} />);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders the column test id', () => {
    render(<KanbanColumn id="high" title="High" chores={[]} />);

    expect(screen.getByTestId('kanban-column-high')).toBeInTheDocument();
  });

  it('renders empty column state when no chores', () => {
    render(<KanbanColumn id="low" title="Low" chores={[]} />);

    expect(screen.getByText('No chores')).toBeInTheDocument();
  });

  it('does not render empty state when chores exist', () => {
    const chores = [createMockChore({ id: 'c1', title: 'Task' })];
    render(<KanbanColumn id="medium" title="Medium" chores={chores} />);

    expect(screen.queryByText('No chores')).not.toBeInTheDocument();
  });

  it('renders child cards for each chore', () => {
    const chores = [
      createMockChore({ id: 'c1', title: 'First Task' }),
      createMockChore({ id: 'c2', title: 'Second Task' }),
    ];
    render(<KanbanColumn id="medium" title="Medium" chores={chores} />);

    expect(screen.getByText('First Task')).toBeInTheDocument();
    expect(screen.getByText('Second Task')).toBeInTheDocument();
  });

  it('shows WIP limit in count badge when provided', () => {
    const chores = [createMockChore({ id: 'c1' })];
    render(<KanbanColumn id="medium" title="Medium" chores={chores} wipLimit={5} />);

    expect(screen.getByText('1/5')).toBeInTheDocument();
  });

  it('applies warning style when WIP limit is exceeded', () => {
    const chores = [
      createMockChore({ id: 'c1' }),
      createMockChore({ id: 'c2' }),
      createMockChore({ id: 'c3' }),
    ];
    render(<KanbanColumn id="medium" title="Medium" chores={chores} wipLimit={2} />);

    const badge = screen.getByText('3/2');
    expect(badge.className).toContain('bg-red-100');
    expect(badge.className).toContain('text-red-700');
  });

  it('uses normal badge style when under WIP limit', () => {
    const chores = [createMockChore({ id: 'c1' })];
    render(<KanbanColumn id="medium" title="Medium" chores={chores} wipLimit={5} />);

    const badge = screen.getByText('1/5');
    expect(badge.className).toContain('bg-gray-200');
    expect(badge.className).toContain('text-gray-600');
  });

  it('renders add button when onAddChore is provided', () => {
    render(
      <KanbanColumn id="medium" title="Medium" chores={[]} onAddChore={vi.fn()} />
    );

    expect(screen.getByLabelText('Add chore to Medium')).toBeInTheDocument();
  });

  it('does not render add button when onAddChore is not provided', () => {
    render(<KanbanColumn id="medium" title="Medium" chores={[]} />);

    expect(screen.queryByLabelText(/add chore/i)).not.toBeInTheDocument();
  });

  it('calls onAddChore when add button is clicked', async () => {
    const user = userEvent.setup();
    const onAddChore = vi.fn();
    render(
      <KanbanColumn id="medium" title="Medium" chores={[]} onAddChore={onAddChore} />
    );

    await user.click(screen.getByLabelText('Add chore to Medium'));
    expect(onAddChore).toHaveBeenCalledTimes(1);
  });

  it('calls onCardClick with chore id when a card is clicked', async () => {
    const user = userEvent.setup();
    const onCardClick = vi.fn();
    const chores = [createMockChore({ id: 'chore-abc', title: 'Clickable' })];
    render(
      <KanbanColumn
        id="medium"
        title="Medium"
        chores={chores}
        onCardClick={onCardClick}
      />
    );

    await user.click(screen.getByText('Clickable'));
    expect(onCardClick).toHaveBeenCalledWith('chore-abc');
  });

  it('renders color indicator when color prop is provided', () => {
    render(
      <KanbanColumn id="custom" title="Custom" chores={[]} color="#ff5733" />
    );

    const colorDot = screen.getByTestId('kanban-column-custom')
      .querySelector('span[style]') as HTMLElement;
    expect(colorDot).toBeTruthy();
    expect(colorDot.style.backgroundColor).toBe('rgb(255, 87, 51)');
  });
});
