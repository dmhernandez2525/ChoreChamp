import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectionToolbar } from '../SelectionToolbar';

// Mock selection store
const mockSelectionStore = {
  selectedIds: new Set<string>(),
  deselectAll: vi.fn(),
  isBulkMode: false,
};

vi.mock('@/stores/selection-store', () => ({
  useSelectionStore: vi.fn(() => mockSelectionStore),
}));

vi.mock('@chorechamp/ui', () => ({
  Button: ({
    children,
    onClick,
    className,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: string;
    size?: string;
  }) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}));

describe('SelectionToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectionStore.selectedIds = new Set();
    mockSelectionStore.isBulkMode = false;
  });

  it('returns null when not in bulk mode', () => {
    mockSelectionStore.isBulkMode = false;
    mockSelectionStore.selectedIds = new Set(['c1']);
    const { container } = render(<SelectionToolbar />);

    expect(container.firstChild).toBeNull();
  });

  it('returns null when no items are selected', () => {
    mockSelectionStore.isBulkMode = true;
    mockSelectionStore.selectedIds = new Set();
    const { container } = render(<SelectionToolbar />);

    expect(container.firstChild).toBeNull();
  });

  it('renders when bulk mode is on and items are selected', () => {
    mockSelectionStore.isBulkMode = true;
    mockSelectionStore.selectedIds = new Set(['c1', 'c2']);
    render(<SelectionToolbar />);

    expect(screen.getByTestId('selection-toolbar')).toBeInTheDocument();
  });

  it('shows the number of selected items', () => {
    mockSelectionStore.isBulkMode = true;
    mockSelectionStore.selectedIds = new Set(['c1', 'c2', 'c3']);
    render(<SelectionToolbar />);

    expect(screen.getByText('3 selected')).toBeInTheDocument();
  });

  it('renders Assign button when onBulkAssign is provided', () => {
    mockSelectionStore.isBulkMode = true;
    mockSelectionStore.selectedIds = new Set(['c1']);
    render(<SelectionToolbar onBulkAssign={vi.fn()} />);

    expect(screen.getByText('Assign')).toBeInTheDocument();
  });

  it('renders Reschedule button when onBulkReschedule is provided', () => {
    mockSelectionStore.isBulkMode = true;
    mockSelectionStore.selectedIds = new Set(['c1']);
    render(<SelectionToolbar onBulkReschedule={vi.fn()} />);

    expect(screen.getByText('Reschedule')).toBeInTheDocument();
  });

  it('renders Priority button when onBulkChangePriority is provided', () => {
    mockSelectionStore.isBulkMode = true;
    mockSelectionStore.selectedIds = new Set(['c1']);
    render(<SelectionToolbar onBulkChangePriority={vi.fn()} />);

    expect(screen.getByText('Priority')).toBeInTheDocument();
  });

  it('renders Category button when onBulkChangeCategory is provided', () => {
    mockSelectionStore.isBulkMode = true;
    mockSelectionStore.selectedIds = new Set(['c1']);
    render(<SelectionToolbar onBulkChangeCategory={vi.fn()} />);

    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('renders Delete button when onBulkDelete is provided', () => {
    mockSelectionStore.isBulkMode = true;
    mockSelectionStore.selectedIds = new Set(['c1']);
    render(<SelectionToolbar onBulkDelete={vi.fn()} />);

    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('does not render action buttons when handlers are not provided', () => {
    mockSelectionStore.isBulkMode = true;
    mockSelectionStore.selectedIds = new Set(['c1']);
    render(<SelectionToolbar />);

    expect(screen.queryByText('Assign')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    expect(screen.queryByText('Reschedule')).not.toBeInTheDocument();
  });

  it('calls onBulkAssign when Assign button is clicked', async () => {
    const user = userEvent.setup();
    const onBulkAssign = vi.fn();
    mockSelectionStore.isBulkMode = true;
    mockSelectionStore.selectedIds = new Set(['c1']);
    render(<SelectionToolbar onBulkAssign={onBulkAssign} />);

    await user.click(screen.getByText('Assign'));
    expect(onBulkAssign).toHaveBeenCalledTimes(1);
  });

  it('calls onBulkDelete when Delete button is clicked', async () => {
    const user = userEvent.setup();
    const onBulkDelete = vi.fn();
    mockSelectionStore.isBulkMode = true;
    mockSelectionStore.selectedIds = new Set(['c1']);
    render(<SelectionToolbar onBulkDelete={onBulkDelete} />);

    await user.click(screen.getByText('Delete'));
    expect(onBulkDelete).toHaveBeenCalledTimes(1);
  });

  it('calls deselectAll when clear selection button is clicked', async () => {
    const user = userEvent.setup();
    mockSelectionStore.isBulkMode = true;
    mockSelectionStore.selectedIds = new Set(['c1', 'c2']);
    render(<SelectionToolbar />);

    await user.click(screen.getByLabelText('Clear selection'));
    expect(mockSelectionStore.deselectAll).toHaveBeenCalledTimes(1);
  });

  it('has toolbar role and aria-label', () => {
    mockSelectionStore.isBulkMode = true;
    mockSelectionStore.selectedIds = new Set(['c1']);
    render(<SelectionToolbar />);

    expect(screen.getByRole('toolbar')).toHaveAttribute('aria-label', 'Bulk actions');
  });
});
