import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileChoreCard } from '../MobileChoreCard';
import type { Chore, Member } from '@chorechamp/types';

vi.mock('@chorechamp/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

vi.mock('lucide-react', () => ({
  Check: ({ className }: { className?: string }) => <svg data-testid="check-icon" className={className} />,
  Pencil: ({ className }: { className?: string }) => <svg data-testid="pencil-icon" className={className} />,
  Trash2: ({ className }: { className?: string }) => <svg data-testid="trash-icon" className={className} />,
  Clock: ({ className }: { className?: string }) => <svg data-testid="clock-icon" className={className} />,
  Star: ({ className }: { className?: string }) => <svg data-testid="star-icon" className={className} />,
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

describe('MobileChoreCard', () => {
  const mockOnClick = vi.fn();
  const mockOnComplete = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the chore title', () => {
    const chore = createMockChore({ title: 'Wash dishes' });
    render(<MobileChoreCard chore={chore} />);

    expect(screen.getByText('Wash dishes')).toBeInTheDocument();
  });

  it('renders the chore icon', () => {
    const chore = createMockChore({ icon: '🍽️' });
    render(<MobileChoreCard chore={chore} />);

    expect(screen.getByText('🍽️')).toBeInTheDocument();
  });

  it('renders with correct test id', () => {
    const chore = createMockChore({ id: 'chore-42' });
    render(<MobileChoreCard chore={chore} />);

    expect(screen.getByTestId('mobile-chore-card-chore-42')).toBeInTheDocument();
  });

  it('renders the point value', () => {
    const chore = createMockChore({ pointValue: 25 });
    render(<MobileChoreCard chore={chore} />);

    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('renders estimated minutes when provided', () => {
    const chore = createMockChore({ estimatedMinutes: 30 });
    render(<MobileChoreCard chore={chore} />);

    expect(screen.getByText('30m')).toBeInTheDocument();
  });

  it('does not render estimated minutes when null', () => {
    const chore = createMockChore({ estimatedMinutes: null });
    render(<MobileChoreCard chore={chore} />);

    // The estimated minutes section shows text like "30m"
    expect(screen.queryByText(/^\d+m$/)).not.toBeInTheDocument();
  });

  it('renders the priority badge for urgent priority', () => {
    const chore = createMockChore({ priority: 'urgent' });
    render(<MobileChoreCard chore={chore} />);

    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('renders the priority badge for high priority', () => {
    const chore = createMockChore({ priority: 'high' });
    render(<MobileChoreCard chore={chore} />);

    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders the priority badge for low priority', () => {
    const chore = createMockChore({ priority: 'low' });
    render(<MobileChoreCard chore={chore} />);

    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('renders due date from startDate', () => {
    const chore = createMockChore({ startDate: '2026-06-15' });
    render(<MobileChoreCard chore={chore} />);

    // Date formatting depends on locale/timezone; just verify some date text renders
    const expectedDate = new Date('2026-06-15').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it('renders assignee initials when members are assigned', () => {
    const chore = createMockChore({ assignedTo: ['member-1'] });
    const members = [createMockMember({ id: 'member-1', name: 'Alice' })];
    render(<MobileChoreCard chore={chore} members={members} />);

    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders multiple assignees up to 2 visible', () => {
    const chore = createMockChore({ assignedTo: ['m1', 'm2', 'm3'] });
    const members = [
      createMockMember({ id: 'm1', name: 'Alice' }),
      createMockMember({ id: 'm2', name: 'Bob' }),
      createMockMember({ id: 'm3', name: 'Carol' }),
    ];
    render(<MobileChoreCard chore={chore} members={members} />);

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('does not render assignee section when no members assigned', () => {
    const chore = createMockChore({ assignedTo: [] });
    render(<MobileChoreCard chore={chore} />);

    expect(screen.queryByText('A')).not.toBeInTheDocument();
  });

  it('renders swipe action buttons', () => {
    const chore = createMockChore();
    render(
      <MobileChoreCard
        chore={chore}
        onComplete={mockOnComplete}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByLabelText('Complete chore')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit chore')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete chore')).toBeInTheDocument();
  });

  it('calls onComplete when complete button is clicked', () => {
    const chore = createMockChore();
    render(<MobileChoreCard chore={chore} onComplete={mockOnComplete} />);

    fireEvent.click(screen.getByLabelText('Complete chore'));
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit when edit button is clicked', () => {
    const chore = createMockChore();
    render(<MobileChoreCard chore={chore} onEdit={mockOnEdit} />);

    fireEvent.click(screen.getByLabelText('Edit chore'));
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', () => {
    const chore = createMockChore();
    render(<MobileChoreCard chore={chore} onDelete={mockOnDelete} />);

    fireEvent.click(screen.getByLabelText('Delete chore'));
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('renders the card content with role=button and aria-label', () => {
    const chore = createMockChore({ title: 'Vacuum floor' });
    render(<MobileChoreCard chore={chore} />);

    expect(screen.getByRole('button', { name: 'Chore: Vacuum floor' })).toBeInTheDocument();
  });

  it('calls onChoreClick when the card is tapped (not swiped)', () => {
    const chore = createMockChore();
    render(<MobileChoreCard chore={chore} onChoreClick={mockOnClick} />);

    fireEvent.click(screen.getByRole('button', { name: `Chore: ${chore.title}` }));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
