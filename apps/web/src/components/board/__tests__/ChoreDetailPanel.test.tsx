import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChoreDetailPanel } from '../ChoreDetailPanel';
import type { Chore, Member } from '@chorechamp/types';

// Mock the API hooks
vi.mock('@chorechamp/api-client', () => ({
  useChoreComments: vi.fn(() => ({ data: [], isLoading: false })),
  useAddComment: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteComment: vi.fn(() => ({ mutate: vi.fn() })),
  useChoreActivity: vi.fn(() => ({ data: [], isLoading: false })),
}));

// Mock the UI package
vi.mock('@chorechamp/ui', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
    className?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

function createMockChore(overrides: Partial<Chore> = {}): Chore {
  return {
    id: 'chore-1',
    householdId: 'household-1',
    title: 'Wash the dishes',
    description: 'Clean all dishes in the sink',
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
    color: '#3b82f6',
    avatarUrl: null,
    points: 100,
    level: 5,
    isActive: true,
    joinedAt: new Date(),
    ...overrides,
  } as Member;
}

describe('ChoreDetailPanel', () => {
  const defaultProps = {
    householdId: 'household-1',
    members: [createMockMember()],
    open: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chore details when open with a chore', () => {
    const chore = createMockChore();
    render(<ChoreDetailPanel {...defaultProps} chore={chore} />);

    expect(screen.getByTestId('chore-detail-panel')).toBeInTheDocument();
    expect(screen.getByText('Wash the dishes')).toBeInTheDocument();
    expect(screen.getByText('Kitchen')).toBeInTheDocument();
    expect(screen.getByText('Clean all dishes in the sink')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    // Both difficulty and priority are "medium", so expect multiple matches
    const mediumTexts = screen.getAllByText('Medium');
    expect(mediumTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders nothing when chore is null', () => {
    render(
      <ChoreDetailPanel {...defaultProps} chore={null} />
    );
    expect(screen.queryByTestId('chore-detail-panel')).not.toBeInTheDocument();
  });

  it('shows the Details tab content by default', () => {
    const chore = createMockChore();
    render(<ChoreDetailPanel {...defaultProps} chore={chore} />);

    // Details tab should be selected
    const detailsTab = screen.getByRole('tab', { name: /details/i });
    expect(detailsTab).toHaveAttribute('aria-selected', 'true');

    // Description from the details tab should be visible
    expect(screen.getByText('Clean all dishes in the sink')).toBeInTheDocument();
  });

  it('switches to Comments tab when clicked', async () => {
    const user = userEvent.setup();
    const chore = createMockChore();
    render(<ChoreDetailPanel {...defaultProps} chore={chore} />);

    const commentsTab = screen.getByRole('tab', { name: /comments/i });
    await user.click(commentsTab);

    expect(commentsTab).toHaveAttribute('aria-selected', 'true');
    // Comments empty state should be visible
    expect(screen.getByText('No comments yet')).toBeInTheDocument();
    // Details content should not be visible
    expect(screen.queryByText('Clean all dishes in the sink')).not.toBeInTheDocument();
  });

  it('switches to Activity tab when clicked', async () => {
    const user = userEvent.setup();
    const chore = createMockChore();
    render(<ChoreDetailPanel {...defaultProps} chore={chore} />);

    const activityTab = screen.getByRole('tab', { name: /activity/i });
    await user.click(activityTab);

    expect(activityTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('No activity recorded')).toBeInTheDocument();
  });

  it('renders Edit button and fires onEdit callback when clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const chore = createMockChore();

    render(
      <ChoreDetailPanel {...defaultProps} chore={chore} onEdit={onEdit} />
    );

    const editButton = screen.getByText('Edit');
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledWith('chore-1');
  });

  it('does not render Edit button when onEdit is not provided', () => {
    const chore = createMockChore();
    render(<ChoreDetailPanel {...defaultProps} chore={chore} />);

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('fires onClose callback when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const chore = createMockChore();

    render(
      <ChoreDetailPanel {...defaultProps} chore={chore} onClose={onClose} />
    );

    const closeButton = screen.getByLabelText('Close panel');
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('displays assignee names when chore has assigned members', () => {
    const members = [
      createMockMember({ id: 'member-1', name: 'Alice' }),
      createMockMember({ id: 'member-2', name: 'Bob', color: '#ef4444' }),
    ];
    const chore = createMockChore({
      assignedTo: ['member-1', 'member-2'],
    });

    render(
      <ChoreDetailPanel
        {...defaultProps}
        chore={chore}
        members={members}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows point value and difficulty in the metrics grid', () => {
    const chore = createMockChore({
      pointValue: 25,
      difficulty: 'hard',
      priority: 'high',
    });

    render(<ChoreDetailPanel {...defaultProps} chore={chore} />);

    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });
});
