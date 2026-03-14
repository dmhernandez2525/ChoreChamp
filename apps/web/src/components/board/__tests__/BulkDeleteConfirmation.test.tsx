import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkDeleteConfirmation } from '../BulkDeleteConfirmation';

// Mock stores
const mockSelectionStore = {
  selectedIds: new Set(['chore-1', 'chore-2']),
  deselectAll: vi.fn(),
};

vi.mock('@/stores/selection-store', () => ({
  useSelectionStore: vi.fn(() => mockSelectionStore),
}));

const mockMutate = vi.fn();
vi.mock('@chorechamp/api-client', () => ({
  useBulkDeleteChores: vi.fn(() => ({
    mutate: mockMutate,
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
  Description: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  Close: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? children : <button>{children}</button>,
}));

vi.mock('@chorechamp/ui', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    className,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    variant?: string;
    size?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  ),
}));

describe('BulkDeleteConfirmation', () => {
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectionStore.selectedIds = new Set(['chore-1', 'chore-2']);
  });

  it('renders the confirmation title with chore count', () => {
    render(
      <BulkDeleteConfirmation householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    expect(screen.getByText('Delete 2 Chores?')).toBeInTheDocument();
  });

  it('uses singular form for single chore', () => {
    mockSelectionStore.selectedIds = new Set(['chore-1']);
    render(
      <BulkDeleteConfirmation householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    expect(screen.getByText('Delete 1 Chore?')).toBeInTheDocument();
  });

  it('renders the warning message', () => {
    render(
      <BulkDeleteConfirmation householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    expect(screen.getByText(/permanently remove the selected chores/)).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/)).toBeInTheDocument();
  });

  it('renders Delete button', () => {
    render(
      <BulkDeleteConfirmation householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders Cancel button', () => {
    render(
      <BulkDeleteConfirmation householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls bulkDelete.mutate when Delete is clicked', async () => {
    const user = userEvent.setup();
    render(
      <BulkDeleteConfirmation householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    await user.click(screen.getByText('Delete'));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.arrayContaining(['chore-1', 'chore-2']),
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('does not render when open is false', () => {
    render(
      <BulkDeleteConfirmation householdId="h1" open={false} onOpenChange={onOpenChange} />
    );

    expect(screen.queryByText(/Delete.*Chore/)).not.toBeInTheDocument();
  });

  it('renders close button', () => {
    render(
      <BulkDeleteConfirmation householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });
});
