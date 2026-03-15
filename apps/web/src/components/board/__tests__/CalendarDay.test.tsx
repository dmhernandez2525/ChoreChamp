import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarDay } from '../CalendarDay';
import type { Chore } from '@chorechamp/types';

vi.mock('@chorechamp/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

vi.mock('@dnd-kit/core', () => ({
  useDroppable: vi.fn(() => ({
    setNodeRef: vi.fn(),
    isOver: false,
  })),
  useDraggable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    isDragging: false,
  })),
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

describe('CalendarDay', () => {
  const testDate = new Date(2026, 2, 14); // March 14, 2026 in local timezone
  const defaultProps = {
    date: testDate,
    isCurrentMonth: true,
    isToday: false,
    chores: [] as Chore[],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the day number', () => {
    render(<CalendarDay {...defaultProps} />);

    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('renders with the correct test id based on date', () => {
    render(<CalendarDay {...defaultProps} />);

    expect(screen.getByTestId('calendar-day-2026-03-14')).toBeInTheDocument();
  });

  it('applies today styling when isToday is true', () => {
    render(<CalendarDay {...defaultProps} isToday={true} />);

    const dayNumber = screen.getByText('14');
    expect(dayNumber.className).toContain('bg-violet-600');
    expect(dayNumber.className).toContain('text-white');
  });

  it('does not apply today styling when isToday is false', () => {
    render(<CalendarDay {...defaultProps} isToday={false} />);

    const dayNumber = screen.getByText('14');
    expect(dayNumber.className).not.toContain('bg-violet-600');
  });

  it('applies muted text for non-current-month days', () => {
    render(
      <CalendarDay {...defaultProps} isCurrentMonth={false} isToday={false} />,
    );

    const dayNumber = screen.getByText('14');
    expect(dayNumber.className).toContain('text-gray-400');
  });

  it('applies normal text for current-month, non-today days', () => {
    render(
      <CalendarDay {...defaultProps} isCurrentMonth={true} isToday={false} />,
    );

    const dayNumber = screen.getByText('14');
    expect(dayNumber.className).toContain('text-gray-900');
  });

  it('does not show chore count when no chores', () => {
    render(<CalendarDay {...defaultProps} chores={[]} />);

    // No count badge rendered
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows chore count when there are chores', () => {
    const chores = [
      createMockChore({ id: 'c1' }),
      createMockChore({ id: 'c2' }),
    ];
    render(<CalendarDay {...defaultProps} chores={chores} />);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders chore pills with title and icon', () => {
    const chores = [createMockChore({ title: 'Vacuum', icon: '🧹' })];
    render(<CalendarDay {...defaultProps} chores={chores} />);

    // The button text contains both icon and title
    expect(screen.getByTitle('Vacuum')).toBeInTheDocument();
  });

  it('limits visible chores to 3 and shows overflow', () => {
    const chores = [
      createMockChore({ id: 'c1', title: 'Chore 1' }),
      createMockChore({ id: 'c2', title: 'Chore 2' }),
      createMockChore({ id: 'c3', title: 'Chore 3' }),
      createMockChore({ id: 'c4', title: 'Chore 4' }),
      createMockChore({ id: 'c5', title: 'Chore 5' }),
    ];
    render(<CalendarDay {...defaultProps} chores={chores} />);

    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('does not show overflow when chores fit within limit', () => {
    const chores = [
      createMockChore({ id: 'c1' }),
      createMockChore({ id: 'c2' }),
    ];
    render(<CalendarDay {...defaultProps} chores={chores} />);

    expect(screen.queryByText(/more/)).not.toBeInTheDocument();
  });

  it('calls onDateClick when the day cell is clicked', () => {
    const mockOnDateClick = vi.fn();
    render(
      <CalendarDay {...defaultProps} onDateClick={mockOnDateClick} />,
    );

    fireEvent.click(screen.getByTestId('calendar-day-2026-03-14'));
    expect(mockOnDateClick).toHaveBeenCalledWith(testDate);
  });

  it('calls onChoreClick when a chore pill is clicked', () => {
    const mockOnChoreClick = vi.fn();
    const chores = [createMockChore({ id: 'c1', title: 'My Chore' })];
    render(
      <CalendarDay
        {...defaultProps}
        chores={chores}
        onChoreClick={mockOnChoreClick}
      />,
    );

    fireEvent.click(screen.getByTitle('My Chore'));
    expect(mockOnChoreClick).toHaveBeenCalledWith('c1');
  });

  it('calls onDateClick when overflow button is clicked', () => {
    const mockOnDateClick = vi.fn();
    const chores = Array.from({ length: 5 }, (_, i) =>
      createMockChore({ id: `c${i}`, title: `Chore ${i}` }),
    );
    render(
      <CalendarDay
        {...defaultProps}
        chores={chores}
        onDateClick={mockOnDateClick}
      />,
    );

    fireEvent.click(screen.getByText('+2 more'));
    expect(mockOnDateClick).toHaveBeenCalledWith(testDate);
  });

  it('renders non-draggable chore buttons when enableDrag is false', () => {
    const chores = [createMockChore({ title: 'Sweep' })];
    render(
      <CalendarDay {...defaultProps} chores={chores} enableDrag={false} />,
    );

    expect(screen.getByTitle('Sweep')).toBeInTheDocument();
  });

  it('renders draggable chore chips when enableDrag is true', () => {
    const chores = [createMockChore({ title: 'Mop' })];
    render(
      <CalendarDay {...defaultProps} chores={chores} enableDrag={true} />,
    );

    expect(screen.getByTitle('Mop')).toBeInTheDocument();
  });

  it('applies bg-gray-50 for non-current-month days', () => {
    render(
      <CalendarDay {...defaultProps} isCurrentMonth={false} />,
    );

    const cell = screen.getByTestId('calendar-day-2026-03-14');
    expect(cell.className).toContain('bg-gray-50');
  });

  it('does not apply bg-gray-50 for current-month days', () => {
    render(
      <CalendarDay {...defaultProps} isCurrentMonth={true} />,
    );

    const cell = screen.getByTestId('calendar-day-2026-03-14');
    expect(cell.className).not.toContain('bg-gray-50');
  });

  it('does not crash without optional callbacks', () => {
    const chores = [createMockChore()];
    render(<CalendarDay {...defaultProps} chores={chores} />);

    // Should not throw when clicked
    fireEvent.click(screen.getByTestId('calendar-day-2026-03-14'));
    fireEvent.click(screen.getByTitle('Do the dishes'));
  });
});
