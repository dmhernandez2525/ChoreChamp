import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarView } from '../CalendarView';
import type { Chore } from '@chorechamp/types';

// Mock board store state
const mockBoardStore = {
  calendarDate: new Date(2026, 2, 14), // March 14, 2026
  calendarView: 'month' as 'month' | 'week',
  setCalendarDate: vi.fn(),
  setCalendarView: vi.fn(),
};

vi.mock('@/stores/board-store', () => ({
  useBoardStore: vi.fn(() => mockBoardStore),
}));

vi.mock('@/stores/undo-store', () => ({
  useUndoStore: vi.fn(() => ({
    pushAction: vi.fn(),
  })),
}));

// Mock dnd-kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  pointerWithin: vi.fn(),
  useDroppable: vi.fn(() => ({ setNodeRef: vi.fn(), isOver: false })),
  useDraggable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    isDragging: false,
  })),
}));

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

describe('CalendarView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBoardStore.calendarDate = new Date(2026, 2, 14);
    mockBoardStore.calendarView = 'month';
  });

  it('renders the calendar view container', () => {
    render(<CalendarView chores={[]} />);

    expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
  });

  it('renders the month and year header', () => {
    render(<CalendarView chores={[]} />);

    expect(screen.getByText('March 2026')).toBeInTheDocument();
  });

  it('renders weekday headers', () => {
    render(<CalendarView chores={[]} />);

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (const day of weekdays) {
      expect(screen.getByText(day)).toBeInTheDocument();
    }
  });

  it('renders the Today button', () => {
    render(<CalendarView chores={[]} />);

    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('renders Week and Month view toggle buttons', () => {
    render(<CalendarView chores={[]} />);

    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
  });

  it('renders navigation arrows', () => {
    render(<CalendarView chores={[]} />);

    expect(screen.getByLabelText('Previous')).toBeInTheDocument();
    expect(screen.getByLabelText('Next')).toBeInTheDocument();
  });

  it('places chores on the correct day cells', () => {
    const chores = [
      createMockChore({ id: 'c1', title: 'March Task', icon: '📋', startDate: '2026-03-14' }),
    ];
    render(<CalendarView chores={chores} />);

    expect(screen.getByTestId('calendar-day-2026-03-14')).toBeInTheDocument();
    expect(screen.getByText(/March Task/)).toBeInTheDocument();
  });

  it('renders multiple chores on the same day', () => {
    const chores = [
      createMockChore({ id: 'c1', title: 'Task One', icon: '📋', startDate: '2026-03-14' }),
      createMockChore({ id: 'c2', title: 'Task Two', icon: '📌', startDate: '2026-03-14' }),
    ];
    render(<CalendarView chores={chores} />);

    expect(screen.getByText(/Task One/)).toBeInTheDocument();
    expect(screen.getByText(/Task Two/)).toBeInTheDocument();
  });

  it('renders empty day cells without chore content', () => {
    render(<CalendarView chores={[]} />);

    const emptyDay = screen.getByTestId('calendar-day-2026-03-15');
    expect(emptyDay).toBeInTheDocument();
    // Empty day should not have chore buttons inside it
    const choreButtons = emptyDay.querySelectorAll('button[title]');
    expect(choreButtons.length).toBe(0);
  });

  it('navigates to previous month when clicking left arrow', async () => {
    const user = userEvent.setup();
    render(<CalendarView chores={[]} />);

    await user.click(screen.getByLabelText('Previous'));
    expect(mockBoardStore.setCalendarDate).toHaveBeenCalled();
    const newDate = mockBoardStore.setCalendarDate.mock.calls[0][0] as Date;
    expect(newDate.getMonth()).toBe(1); // February
  });

  it('navigates to next month when clicking right arrow', async () => {
    const user = userEvent.setup();
    render(<CalendarView chores={[]} />);

    await user.click(screen.getByLabelText('Next'));
    expect(mockBoardStore.setCalendarDate).toHaveBeenCalled();
    const newDate = mockBoardStore.setCalendarDate.mock.calls[0][0] as Date;
    expect(newDate.getMonth()).toBe(3); // April
  });

  it('switches to week view when Week button is clicked', async () => {
    const user = userEvent.setup();
    render(<CalendarView chores={[]} />);

    await user.click(screen.getByText('Week'));
    expect(mockBoardStore.setCalendarView).toHaveBeenCalledWith('week');
  });

  it('switches to month view when Month button is clicked', async () => {
    const user = userEvent.setup();
    mockBoardStore.calendarView = 'week';
    render(<CalendarView chores={[]} />);

    await user.click(screen.getByText('Month'));
    expect(mockBoardStore.setCalendarView).toHaveBeenCalledWith('month');
  });

  it('calls setCalendarDate when Today button is clicked', async () => {
    const user = userEvent.setup();
    render(<CalendarView chores={[]} />);

    await user.click(screen.getByText('Today'));
    expect(mockBoardStore.setCalendarDate).toHaveBeenCalled();
  });

  it('renders only 7 day cells in week view', () => {
    mockBoardStore.calendarView = 'week';
    render(<CalendarView chores={[]} />);

    // In week view, there should be exactly 7 calendar day cells
    const dayCells = screen.getAllByTestId(/^calendar-day-/);
    expect(dayCells.length).toBe(7);
  });

  it('calls onChoreClick when a chore chip is clicked', async () => {
    const user = userEvent.setup();
    const onChoreClick = vi.fn();
    const chores = [
      createMockChore({ id: 'click-me', title: 'Clickable Chore', icon: '📋', startDate: '2026-03-14' }),
    ];
    render(<CalendarView chores={chores} onChoreClick={onChoreClick} />);

    const choreButton = screen.getByTitle('Clickable Chore');
    await user.click(choreButton);
    expect(onChoreClick).toHaveBeenCalledWith('click-me');
  });
});
