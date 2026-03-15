import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColumnSettingsPanel } from '../ColumnSettingsPanel';

// Mock board store
const mockBoardStore = {
  columnSettings: {} as Record<string, unknown>,
};

vi.mock('@/stores/board-store', () => ({
  useBoardStore: vi.fn(() => mockBoardStore),
}));

// Mock API client
const mockMutate = vi.fn();
vi.mock('@chorechamp/api-client', () => ({
  useUpdateBoardPreferences: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
  })),
  useAutomationRules: vi.fn(() => ({ data: { rules: [], total: 0 }, isLoading: false })),
  useCreateAutomationRule: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUpdateAutomationRule: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteAutomationRule: vi.fn(() => ({ mutate: vi.fn(), isPending: false, variables: null })),
}));

// Mock Radix Dialog to render inline (no portal)
vi.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div>{children}</div> : null,
  Portal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Overlay: ({ _className, ...props }: Record<string, unknown>) => (
    <div data-testid="dialog-overlay" {...props} />
  ),
  Content: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => (
    <div {...props}>{children}</div>
  ),
  Title: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => (
    <h2 {...props}>{children}</h2>
  ),
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

vi.mock('lucide-react', () => ({
  X: (props: Record<string, unknown>) => <svg data-testid="x-icon" {...props} />,
  Eye: (props: Record<string, unknown>) => <svg data-testid="eye-icon" {...props} />,
  EyeOff: (props: Record<string, unknown>) => <svg data-testid="eyeoff-icon" {...props} />,
  GripVertical: (props: Record<string, unknown>) => <svg data-testid="grip-icon" {...props} />,
  Palette: (props: Record<string, unknown>) => <svg data-testid="palette-icon" {...props} />,
}));

describe('ColumnSettingsPanel', () => {
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockBoardStore.columnSettings = {};
  });

  it('renders nothing when closed', () => {
    render(
      <ColumnSettingsPanel householdId="h1" open={false} onOpenChange={onOpenChange} />,
    );
    expect(screen.queryByText('Column Settings')).not.toBeInTheDocument();
  });

  it('renders the panel title when open', () => {
    render(
      <ColumnSettingsPanel householdId="h1" open={true} onOpenChange={onOpenChange} />,
    );
    expect(screen.getByText('Column Settings')).toBeInTheDocument();
  });

  it('renders all default columns', () => {
    render(
      <ColumnSettingsPanel householdId="h1" open={true} onOpenChange={onOpenChange} />,
    );
    expect(screen.getByText('Not Started')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Needs Review')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Blocked')).toBeInTheDocument();
  });

  it('renders a close button with aria-label', () => {
    render(
      <ColumnSettingsPanel householdId="h1" open={true} onOpenChange={onOpenChange} />,
    );
    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });

  it('renders visibility toggle buttons for each column', () => {
    render(
      <ColumnSettingsPanel householdId="h1" open={true} onOpenChange={onOpenChange} />,
    );
    // 4 visible columns get "Hide column", 1 hidden gets "Show column"
    const hideButtons = screen.getAllByLabelText('Hide column');
    const showButtons = screen.getAllByLabelText('Show column');
    expect(hideButtons).toHaveLength(4);
    expect(showButtons).toHaveLength(1);
  });

  it('toggles visibility when clicking the eye button', async () => {
    const user = userEvent.setup();
    render(
      <ColumnSettingsPanel householdId="h1" open={true} onOpenChange={onOpenChange} />,
    );

    // Click "Show column" for the Blocked column (initially hidden)
    const showButtons = screen.getAllByLabelText('Show column');
    await user.click(showButtons[0]);

    // Now all should be visible, so no "Show column" buttons remain
    expect(screen.queryByLabelText('Show column')).not.toBeInTheDocument();
    expect(screen.getAllByLabelText('Hide column')).toHaveLength(5);
  });

  it('renders WIP limit inputs for visible columns', () => {
    render(
      <ColumnSettingsPanel householdId="h1" open={true} onOpenChange={onOpenChange} />,
    );
    // 4 visible columns should have WIP Limit labels
    const wipLabels = screen.getAllByText('WIP Limit:');
    expect(wipLabels).toHaveLength(4);
  });

  it('renders Save and Cancel buttons', () => {
    render(
      <ColumnSettingsPanel householdId="h1" open={true} onOpenChange={onOpenChange} />,
    );
    expect(screen.getByText('Save Settings')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls mutate when Save Settings is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ColumnSettingsPanel householdId="h1" open={true} onOpenChange={onOpenChange} />,
    );

    await user.click(screen.getByText('Save Settings'));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    const callArgs = mockMutate.mock.calls[0];
    expect(callArgs[0]).toHaveProperty('columnSettings');
    expect(callArgs[0].columnSettings).toHaveProperty('not_started');
    expect(callArgs[0].columnSettings).toHaveProperty('in_progress');
    expect(callArgs[0].columnSettings).toHaveProperty('completed');
  });

  it('updates WIP limit when input value changes', async () => {
    const user = userEvent.setup();
    render(
      <ColumnSettingsPanel householdId="h1" open={true} onOpenChange={onOpenChange} />,
    );

    const wipInputs = screen.getAllByRole('spinbutton');
    // Clear and type a new value in the first WIP input
    await user.clear(wipInputs[0]);
    await user.type(wipInputs[0], '10');

    await user.click(screen.getByText('Save Settings'));

    const savedSettings = mockMutate.mock.calls[0][0].columnSettings;
    expect(savedSettings.not_started.wipLimit).toBe(10);
  });
});
