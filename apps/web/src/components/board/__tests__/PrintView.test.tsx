import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrintView } from '../PrintView';
import type { Chore, Member } from '@chorechamp/types';

vi.mock('@chorechamp/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} data-testid={props['data-testid'] as string}>
      {children}
    </button>
  ),
}));

vi.mock('lucide-react', () => ({
  Printer: ({ className }: { className?: string }) => (
    <svg data-testid="printer-icon" className={className} />
  ),
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

describe('PrintView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'print').mockImplementation(() => {});
  });

  it('renders the print button', () => {
    render(
      <PrintView chores={[]} householdName="My Household" viewMode="list" />,
    );

    expect(screen.getByTestId('print-button')).toBeInTheDocument();
    expect(screen.getByText('Print')).toBeInTheDocument();
  });

  it('calls window.print when print button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PrintView chores={[]} householdName="My Household" viewMode="list" />,
    );

    await user.click(screen.getByTestId('print-button'));
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('renders the print-view area', () => {
    render(
      <PrintView chores={[]} householdName="My Household" viewMode="list" />,
    );

    expect(screen.getByTestId('print-view')).toBeInTheDocument();
  });

  it('renders the household name as title', () => {
    render(
      <PrintView chores={[]} householdName="Smith Family" viewMode="list" />,
    );

    expect(screen.getByText('Smith Family')).toBeInTheDocument();
  });

  it('shows the chore count in metadata', () => {
    const chores = [
      createMockChore({ id: 'c1' }),
      createMockChore({ id: 'c2' }),
      createMockChore({ id: 'c3' }),
    ];
    render(
      <PrintView chores={chores} householdName="Home" viewMode="list" />,
    );

    expect(screen.getByText('3 chores')).toBeInTheDocument();
  });

  it('shows singular chore when only one', () => {
    const chores = [createMockChore()];
    render(
      <PrintView chores={chores} householdName="Home" viewMode="list" />,
    );

    expect(screen.getByText('1 chore')).toBeInTheDocument();
  });

  it('shows the view mode in metadata', () => {
    render(
      <PrintView chores={[]} householdName="Home" viewMode="calendar" />,
    );

    expect(screen.getByText('View: calendar')).toBeInTheDocument();
  });

  it('renders table headers for list view', () => {
    const chores = [createMockChore()];
    render(
      <PrintView chores={chores} householdName="Home" viewMode="list" />,
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Assignee')).toBeInTheDocument();
    expect(screen.getByText('Due Date')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('renders chore data in the table', () => {
    const chores = [
      createMockChore({
        title: 'Mop floors',
        priority: 'high',
        category: 'kitchen',
        startDate: '2026-03-14',
      }),
    ];
    render(
      <PrintView chores={chores} householdName="Home" viewMode="list" />,
    );

    expect(screen.getByText('Mop floors')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders "Unassigned" when chore has no assignees', () => {
    const chores = [createMockChore({ assignedTo: [] })];
    render(
      <PrintView chores={chores} householdName="Home" viewMode="list" />,
    );

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('renders member names for assigned chores', () => {
    const chores = [createMockChore({ assignedTo: ['m1', 'm2'] })];
    const members = [
      createMockMember({ id: 'm1', name: 'Alice' }),
      createMockMember({ id: 'm2', name: 'Bob' }),
    ];
    render(
      <PrintView
        chores={chores}
        householdName="Home"
        viewMode="list"
        members={members}
      />,
    );

    expect(screen.getByText('Alice, Bob')).toBeInTheDocument();
  });

  it('groups chores by priority in kanban view', () => {
    const chores = [
      createMockChore({ id: 'c1', title: 'Urgent task', priority: 'urgent' }),
      createMockChore({ id: 'c2', title: 'Low task', priority: 'low' }),
    ];
    render(
      <PrintView chores={chores} householdName="Home" viewMode="kanban" />,
    );

    expect(screen.getByText('Urgent (1)')).toBeInTheDocument();
    expect(screen.getByText('Low (1)')).toBeInTheDocument();
  });

  it('shows empty message for no chores in list view', () => {
    render(
      <PrintView chores={[]} householdName="Home" viewMode="list" />,
    );

    expect(screen.getByText('No chores in this group.')).toBeInTheDocument();
  });

  it('renders dash for missing due date', () => {
    const chores = [createMockChore({ startDate: '' })];
    render(
      <PrintView chores={chores} householdName="Home" viewMode="list" />,
    );

    // The formatDate function returns '-' for empty/null
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
