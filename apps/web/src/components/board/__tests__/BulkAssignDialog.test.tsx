import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkAssignDialog } from '../BulkAssignDialog';
import type { Member } from '@chorechamp/types';

// Mock stores
const mockSelectionStore = {
  selectedIds: new Set(['chore-1', 'chore-2']),
  deselectAll: vi.fn(),
};

vi.mock('@/stores/selection-store', () => ({
  useSelectionStore: vi.fn(() => mockSelectionStore),
}));

vi.mock('@/stores/undo-store', () => ({
  useUndoStore: vi.fn(() => ({
    pushAction: vi.fn(),
  })),
}));

// Mock API client
const mockMutate = vi.fn();
vi.mock('@chorechamp/api-client', () => ({
  useBulkUpdateChores: vi.fn(() => ({
    mutate: mockMutate,
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

// Mock Radix Dialog - render content directly when open
vi.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div>{children}</div> : null,
  Portal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Overlay: ({ className }: { className?: string }) => <div className={className} />,
  Content: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid={props['data-testid'] as string}>{children}</div>
  ),
  Title: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  Description: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  Close: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? children : <button>{children}</button>,
}));

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
  }) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

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

describe('BulkAssignDialog', () => {
  const members = [
    createMockMember({ id: 'm1', name: 'Alice', color: '#7c3aed' }),
    createMockMember({ id: 'm2', name: 'Bob', color: '#3b82f6' }),
    createMockMember({ id: 'm3', name: 'Carol', color: '#ef4444' }),
  ];
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectionStore.selectedIds = new Set(['chore-1', 'chore-2']);
  });

  it('renders the dialog title', () => {
    render(
      <BulkAssignDialog
        householdId="h1"
        members={members}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    expect(screen.getByText('Assign to Members')).toBeInTheDocument();
  });

  it('renders the member list', () => {
    render(
      <BulkAssignDialog
        householdId="h1"
        members={members}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Carol')).toBeInTheDocument();
  });

  it('shows the count of selected chores', () => {
    render(
      <BulkAssignDialog
        householdId="h1"
        members={members}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    expect(screen.getByText(/2 selected chores/)).toBeInTheDocument();
  });

  it('renders Assign button disabled when no member is selected', () => {
    render(
      <BulkAssignDialog
        householdId="h1"
        members={members}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    const assignButton = screen.getByText('Assign');
    expect(assignButton.closest('button')).toBeDisabled();
  });

  it('enables Assign button when a member is selected', async () => {
    const user = userEvent.setup();
    render(
      <BulkAssignDialog
        householdId="h1"
        members={members}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByText('Alice'));
    const assignButton = screen.getByText('Assign');
    expect(assignButton.closest('button')).not.toBeDisabled();
  });

  it('calls bulkUpdate.mutate when Assign is clicked with selected members', async () => {
    const user = userEvent.setup();
    render(
      <BulkAssignDialog
        householdId="h1"
        members={members}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByText('Alice'));
    await user.click(screen.getByText('Assign'));

    expect(mockMutate).toHaveBeenCalledWith(
      {
        choreIds: expect.arrayContaining(['chore-1', 'chore-2']),
        changes: { assignedTo: ['m1'] },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('shows "Selected" label when a member is toggled', async () => {
    const user = userEvent.setup();
    render(
      <BulkAssignDialog
        householdId="h1"
        members={members}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    await user.click(screen.getByText('Bob'));
    expect(screen.getByText('Selected')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(
      <BulkAssignDialog
        householdId="h1"
        members={members}
        open={false}
        onOpenChange={onOpenChange}
      />
    );

    expect(screen.queryByText('Assign to Members')).not.toBeInTheDocument();
  });

  it('renders Cancel button', () => {
    render(
      <BulkAssignDialog
        householdId="h1"
        members={members}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
});
