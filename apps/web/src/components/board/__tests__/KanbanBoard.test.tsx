import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KanbanBoard } from '../KanbanBoard';
import type { Chore } from '@chorechamp/types';

// Mock the stores
vi.mock('@/stores/board-store', () => ({
  useBoardStore: vi.fn(() => ({
    groupBy: 'priority',
    columnSettings: {},
  })),
}));

vi.mock('@/stores/undo-store', () => ({
  useUndoStore: vi.fn(() => ({
    pushAction: vi.fn(),
  })),
}));

// Mock dnd-kit to avoid layout measurement issues in jsdom
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCorners: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  sortableKeyboardCoordinates: vi.fn(),
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

vi.mock('@dnd-kit/core', async () => {
  return {
    DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    closestCorners: vi.fn(),
    KeyboardSensor: vi.fn(),
    PointerSensor: vi.fn(),
    useSensor: vi.fn(),
    useSensors: vi.fn(() => []),
    useDroppable: vi.fn(() => ({ setNodeRef: vi.fn(), isOver: false })),
  };
});

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

describe('KanbanBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the kanban board container', () => {
    render(<KanbanBoard chores={[]} />);
    expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
  });

  it('renders priority columns by default', () => {
    render(<KanbanBoard chores={[]} />);

    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('distributes chores into the correct columns by priority', () => {
    const chores: Chore[] = [
      createMockChore({ id: 'c1', title: 'Urgent Task', priority: 'urgent', boardOrder: 0 }),
      createMockChore({ id: 'c2', title: 'High Task', priority: 'high', boardOrder: 1 }),
      createMockChore({ id: 'c3', title: 'Medium Task', priority: 'medium', boardOrder: 2 }),
      createMockChore({ id: 'c4', title: 'Low Task', priority: 'low', boardOrder: 3 }),
    ];

    render(<KanbanBoard chores={chores} />);

    expect(screen.getByText('Urgent Task')).toBeInTheDocument();
    expect(screen.getByText('High Task')).toBeInTheDocument();
    expect(screen.getByText('Medium Task')).toBeInTheDocument();
    expect(screen.getByText('Low Task')).toBeInTheDocument();
  });

  it('renders empty columns when no chores are provided', () => {
    render(<KanbanBoard chores={[]} />);

    // Each empty column should show "No chores"
    const emptyMessages = screen.getAllByText('No chores');
    expect(emptyMessages.length).toBe(4);
  });

  it('calls onCardClick when a card is clicked', async () => {
    const user = userEvent.setup();
    const onCardClick = vi.fn();
    const chores = [
      createMockChore({ id: 'c1', title: 'Click Me', priority: 'medium', boardOrder: 0 }),
    ];

    render(<KanbanBoard chores={chores} onCardClick={onCardClick} />);

    const card = screen.getByText('Click Me');
    await user.click(card);

    expect(onCardClick).toHaveBeenCalledWith('c1');
  });

  it('calls onAddChore with the column id when add button is clicked', async () => {
    const user = userEvent.setup();
    const onAddChore = vi.fn();

    render(<KanbanBoard chores={[]} onAddChore={onAddChore} />);

    // Click the add button on the Urgent column
    const addButtons = screen.getAllByRole('button', { name: /add chore to/i });
    await user.click(addButtons[0]);

    expect(onAddChore).toHaveBeenCalledWith('urgent');
  });

  it('hides columns marked as hidden in columnSettings', async () => {
    const boardStoreModule = await import('@/stores/board-store');
    const mockedUseBoardStore = vi.mocked(boardStoreModule.useBoardStore);
    mockedUseBoardStore.mockReturnValue({
      groupBy: 'priority',
      columnSettings: { low: { hidden: true } },
    } as ReturnType<typeof boardStoreModule.useBoardStore>);

    render(<KanbanBoard chores={[]} />);

    expect(screen.queryByText('Low')).not.toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();

    // Restore default mock
    mockedUseBoardStore.mockReturnValue({
      groupBy: 'priority',
      columnSettings: {},
    } as ReturnType<typeof boardStoreModule.useBoardStore>);
  });

  it('sorts chores within each column by boardOrder', () => {
    const chores: Chore[] = [
      createMockChore({ id: 'c1', title: 'Third', priority: 'medium', boardOrder: 3 }),
      createMockChore({ id: 'c2', title: 'First', priority: 'medium', boardOrder: 1 }),
      createMockChore({ id: 'c3', title: 'Second', priority: 'medium', boardOrder: 2 }),
    ];

    render(<KanbanBoard chores={chores} />);

    const cards = screen.getAllByText(/First|Second|Third/);
    expect(cards[0]).toHaveTextContent('First');
    expect(cards[1]).toHaveTextContent('Second');
    expect(cards[2]).toHaveTextContent('Third');
  });
});
