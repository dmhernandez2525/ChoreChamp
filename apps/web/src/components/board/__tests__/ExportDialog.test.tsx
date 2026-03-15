import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportDialog } from '../ExportDialog';

const mockMutateAsync = vi.fn();
vi.mock('@chorechamp/api-client', () => ({
  useExportChores: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}));

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
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
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

vi.mock('lucide-react', () => ({
  Download: ({ className }: { className?: string }) => <svg data-testid="download-icon" className={className} />,
  X: ({ className }: { className?: string }) => <svg data-testid="x-icon" className={className} />,
}));

describe('ExportDialog', () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom doesn't implement URL.createObjectURL / revokeObjectURL
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it('does not render when closed', () => {
    render(
      <ExportDialog householdId="h-1" open={false} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.queryByTestId('export-dialog')).not.toBeInTheDocument();
  });

  it('renders dialog title when open', () => {
    render(
      <ExportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText('Export Chores')).toBeInTheDocument();
  });

  it('renders format selection buttons', () => {
    render(
      <ExportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
  });

  it('renders filename input with default value', () => {
    render(
      <ExportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    const input = screen.getByDisplayValue('chores');
    expect(input).toBeInTheDocument();
  });

  it('shows file extension based on selected format', () => {
    render(
      <ExportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    // Default format is csv
    expect(screen.getByText('.csv')).toBeInTheDocument();
  });

  it('updates file extension when format changes to JSON', () => {
    render(
      <ExportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    fireEvent.click(screen.getByText('JSON'));

    expect(screen.getByText('.json')).toBeInTheDocument();
  });

  it('allows filename to be changed', () => {
    render(
      <ExportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    const input = screen.getByDisplayValue('chores');
    fireEvent.change(input, { target: { value: 'my-export' } });

    expect(screen.getByDisplayValue('my-export')).toBeInTheDocument();
  });

  it('renders Export button', () => {
    render(
      <ExportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('renders Cancel button', () => {
    render(
      <ExportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls mutateAsync with format when Export is clicked', async () => {
    mockMutateAsync.mockResolvedValue('col1,col2\nval1,val2');

    render(
      <ExportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    fireEvent.click(screen.getByText('Export'));

    expect(mockMutateAsync).toHaveBeenCalledWith('csv');
  });

  it('calls mutateAsync with json format when JSON is selected', async () => {
    mockMutateAsync.mockResolvedValue([{ title: 'test' }]);

    render(
      <ExportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    fireEvent.click(screen.getByText('JSON'));
    fireEvent.click(screen.getByText('Export'));

    expect(mockMutateAsync).toHaveBeenCalledWith('json');
  });

  it('renders close button with aria-label', () => {
    render(
      <ExportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });

  it('renders the Filename label', () => {
    render(
      <ExportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText('Filename')).toBeInTheDocument();
  });

  it('renders the Format label', () => {
    render(
      <ExportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText('Format')).toBeInTheDocument();
  });
});
