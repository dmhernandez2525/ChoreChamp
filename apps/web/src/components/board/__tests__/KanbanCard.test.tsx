import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KanbanCard } from '../KanbanCard';
import type { Chore, Member } from '@chorechamp/types';

// Track mock store state
const mockSelectionStore = {
  selectedIds: new Set<string>(),
  isBulkMode: false,
  toggle: vi.fn(),
};

vi.mock('@/stores/selection-store', () => ({
  useSelectionStore: vi.fn(() => mockSelectionStore),
}));

// Mock dnd-kit sortable
vi.mock('@dnd-kit/sortable', () => ({
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

function createMockChore(overrides: Partial<Chore> = {}): Chore {
  return {
    id: 'chore-1',
    householdId: 'household-1',
    title: 'Do the dishes',
    description: null,
    icon: '🍽️',
    category: 'kitchen',
    pointValue: 15,
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

function createMockMember(overrides: Partial<Member> = {}): Member {
  return {
    id: 'member-1',
    householdId: 'household-1',
    userId: 'user-1',
    name: 'Alice',
    role: 'parent',
    color: '#7c3aed',
    avatarUrl: null,
    birthYear: null,
    pointsCurrent: 0,
    pointsLifetime: 0,
    currentStreak: 0,
    longestStreak: 0,
    level: 1,
    xp: 0,
    isActive: true,
    joinedAt: new Date(),
    ...overrides,
  } as Member;
}

describe('KanbanCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectionStore.selectedIds = new Set();
    mockSelectionStore.isBulkMode = false;
  });

  it('renders the chore title and icon', () => {
    const chore = createMockChore({ title: 'Wash dishes', icon: '🍽️' });
    render(<KanbanCard chore={chore} />);

    expect(screen.getByText('Wash dishes')).toBeInTheDocument();
    expect(screen.getByText('🍽️')).toBeInTheDocument();
  });

  it('renders the point value', () => {
    const chore = createMockChore({ pointValue: 25 });
    render(<KanbanCard chore={chore} />);

    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('renders estimated time when provided', () => {
    const chore = createMockChore({ estimatedMinutes: 30 });
    render(<KanbanCard chore={chore} />);

    expect(screen.getByText('30m')).toBeInTheDocument();
  });

  it('does not render estimated time when null', () => {
    const chore = createMockChore({ estimatedMinutes: null });
    render(<KanbanCard chore={chore} />);

    expect(screen.queryByText(/m$/)).not.toBeInTheDocument();
  });

  it('renders the category badge', () => {
    const chore = createMockChore({ category: 'kitchen' });
    render(<KanbanCard chore={chore} />);

    expect(screen.getByText('kitchen')).toBeInTheDocument();
  });

  it('renders the drag handle button', () => {
    const chore = createMockChore();
    render(<KanbanCard chore={chore} />);

    expect(screen.getByLabelText('Drag to reorder')).toBeInTheDocument();
  });

  it('applies the correct priority color class for urgent', () => {
    const chore = createMockChore({ priority: 'urgent' });
    const { container } = render(<KanbanCard chore={chore} />);

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('border-l-red-500');
  });

  it('applies the correct priority color class for high', () => {
    const chore = createMockChore({ priority: 'high' });
    const { container } = render(<KanbanCard chore={chore} />);

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('border-l-orange-500');
  });

  it('applies the correct priority color class for low', () => {
    const chore = createMockChore({ priority: 'low' });
    const { container } = render(<KanbanCard chore={chore} />);

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('border-l-blue-300');
  });

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const chore = createMockChore();
    render(<KanbanCard chore={chore} onClick={onClick} />);

    await user.click(screen.getByTestId('kanban-card-chore-1'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows selection checkbox in bulk mode', () => {
    mockSelectionStore.isBulkMode = true;
    const chore = createMockChore({ title: 'Test Chore' });
    render(<KanbanCard chore={chore} />);

    expect(screen.getByLabelText('Select Test Chore')).toBeInTheDocument();
  });

  it('does not show selection checkbox when not in bulk mode', () => {
    mockSelectionStore.isBulkMode = false;
    const chore = createMockChore({ title: 'Test Chore' });
    render(<KanbanCard chore={chore} />);

    expect(screen.queryByLabelText('Select Test Chore')).not.toBeInTheDocument();
  });

  it('toggles selection in bulk mode instead of calling onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    mockSelectionStore.isBulkMode = true;
    const chore = createMockChore({ id: 'chore-99' });
    render(<KanbanCard chore={chore} onClick={onClick} />);

    await user.click(screen.getByTestId('kanban-card-chore-99'));
    expect(mockSelectionStore.toggle).toHaveBeenCalledWith('chore-99');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders selected state with ring class when selected', () => {
    mockSelectionStore.selectedIds = new Set(['chore-1']);
    const chore = createMockChore({ id: 'chore-1' });
    const { container } = render(<KanbanCard chore={chore} />);

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('ring-2 ring-violet-500');
  });

  it('renders assignee initials', () => {
    const chore = createMockChore({ assignedTo: ['member-1'] });
    const members = [createMockMember({ id: 'member-1', name: 'Alice' })];
    render(<KanbanCard chore={chore} members={members} />);

    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows overflow count when more than 3 assignees', () => {
    const chore = createMockChore({
      assignedTo: ['m1', 'm2', 'm3', 'm4', 'm5'],
    });
    const members = [
      createMockMember({ id: 'm1', name: 'Alice' }),
      createMockMember({ id: 'm2', name: 'Bob' }),
      createMockMember({ id: 'm3', name: 'Carol' }),
      createMockMember({ id: 'm4', name: 'Dave' }),
      createMockMember({ id: 'm5', name: 'Eve' }),
    ];
    render(<KanbanCard chore={chore} members={members} />);

    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('renders steps indicator when steps are present', () => {
    const chore = createMockChore({
      steps: [
        { label: 'Step 1', completed: false },
        { label: 'Step 2', completed: false },
        { label: 'Step 3', completed: false },
      ] as unknown as Chore['steps'],
    });
    render(<KanbanCard chore={chore} />);

    expect(screen.getByText('3 steps')).toBeInTheDocument();
  });

  it('does not render steps indicator when steps are null', () => {
    const chore = createMockChore({ steps: null });
    render(<KanbanCard chore={chore} />);

    expect(screen.queryByText(/steps/)).not.toBeInTheDocument();
  });
});
