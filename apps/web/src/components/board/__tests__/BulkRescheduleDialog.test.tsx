import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkRescheduleDialog } from '../BulkRescheduleDialog';

// Mock stores
const mockSelectionStore = {
  selectedIds: new Set(['chore-1', 'chore-2', 'chore-3']),
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

const mockMutate = vi.fn();
vi.mock('@chorechamp/api-client', () => ({
  useBulkUpdateChores: vi.fn(() => ({
    mutate: mockMutate,
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

// Mock Radix Dialog
vi.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div>{children}</div> : null,
  Portal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Overlay: ({ className }: { className?: string }) => <div className={className} />,
  Content: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid={props['data-testid'] as string}>{children}</div>
  ),
  Title: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
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
}));

describe('BulkRescheduleDialog', () => {
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectionStore.selectedIds = new Set(['chore-1', 'chore-2', 'chore-3']);
  });

  it('renders the dialog title', () => {
    render(
      <BulkRescheduleDialog householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    expect(screen.getByText('Reschedule Chores')).toBeInTheDocument();
  });

  it('shows the count of selected chores', () => {
    render(
      <BulkRescheduleDialog householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    expect(screen.getByText(/3 selected chores/)).toBeInTheDocument();
  });

  it('renders date input', () => {
    render(
      <BulkRescheduleDialog householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    expect(screen.getByLabelText('New Date')).toBeInTheDocument();
  });

  it('renders optional time input', () => {
    render(
      <BulkRescheduleDialog householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    expect(screen.getByLabelText(/New Due Time/)).toBeInTheDocument();
  });

  it('renders Reschedule button disabled when no date is set', () => {
    render(
      <BulkRescheduleDialog householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    const rescheduleBtn = screen.getByText('Reschedule');
    expect(rescheduleBtn.closest('button')).toBeDisabled();
  });

  it('enables Reschedule button after a date is entered', () => {
    render(
      <BulkRescheduleDialog householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    const dateInput = screen.getByLabelText('New Date');
    fireEvent.change(dateInput, { target: { value: '2026-04-01' } });

    const rescheduleBtn = screen.getByText('Reschedule');
    expect(rescheduleBtn.closest('button')).not.toBeDisabled();
  });

  it('calls mutate with date when Reschedule is clicked', async () => {
    const user = userEvent.setup();
    render(
      <BulkRescheduleDialog householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    const dateInput = screen.getByLabelText('New Date');
    fireEvent.change(dateInput, { target: { value: '2026-04-01' } });

    await user.click(screen.getByText('Reschedule'));

    expect(mockMutate).toHaveBeenCalledWith(
      {
        choreIds: expect.arrayContaining(['chore-1', 'chore-2', 'chore-3']),
        changes: { startDate: '2026-04-01' },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('includes time in the update when time is set', async () => {
    const user = userEvent.setup();
    render(
      <BulkRescheduleDialog householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    const dateInput = screen.getByLabelText('New Date');
    fireEvent.change(dateInput, { target: { value: '2026-04-01' } });

    const timeInput = screen.getByLabelText(/New Due Time/);
    fireEvent.change(timeInput, { target: { value: '14:30' } });

    await user.click(screen.getByText('Reschedule'));

    expect(mockMutate).toHaveBeenCalledWith(
      {
        choreIds: expect.any(Array),
        changes: { startDate: '2026-04-01', dueTime: '14:30' },
      },
      expect.any(Object),
    );
  });

  it('renders Cancel button', () => {
    render(
      <BulkRescheduleDialog householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(
      <BulkRescheduleDialog householdId="h1" open={false} onOpenChange={onOpenChange} />
    );

    expect(screen.queryByText('Reschedule Chores')).not.toBeInTheDocument();
  });
});
