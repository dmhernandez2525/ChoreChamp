import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImportDialog } from '../ImportDialog';

const mockMutateAsync = vi.fn();
vi.mock('@chorechamp/api-client', () => ({
  useImportChores: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}));

vi.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open, onOpenChange: _onOpenChange }: { children: React.ReactNode; open: boolean; onOpenChange?: (open: boolean) => void }) =>
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
  Upload: ({ className }: { className?: string }) => <svg data-testid="upload-icon" className={className} />,
  X: ({ className }: { className?: string }) => <svg data-testid="x-icon" className={className} />,
  FileText: ({ className }: { className?: string }) => <svg data-testid="file-text-icon" className={className} />,
  AlertCircle: ({ className }: { className?: string }) => <svg data-testid="alert-circle-icon" className={className} />,
  CheckCircle2: ({ className }: { className?: string }) => <svg data-testid="check-circle-icon" className={className} />,
}));

describe('ImportDialog', () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when closed', () => {
    render(
      <ImportDialog householdId="h-1" open={false} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.queryByTestId('import-dialog')).not.toBeInTheDocument();
  });

  it('renders dialog title when open', () => {
    render(
      <ImportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText('Import Chores')).toBeInTheDocument();
  });

  it('renders drop zone with instructions', () => {
    render(
      <ImportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText('Drop a CSV or JSON file here')).toBeInTheDocument();
    expect(screen.getByText('or click to browse')).toBeInTheDocument();
  });

  it('renders Import button (disabled when no file)', () => {
    render(
      <ImportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    const importBtn = screen.getByText('Import');
    expect(importBtn).toBeInTheDocument();
    expect(importBtn.closest('button')).toBeDisabled();
  });

  it('renders Cancel button', () => {
    render(
      <ImportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders close button with aria-label', () => {
    render(
      <ImportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });

  it('renders hidden file input with correct accept types', () => {
    render(
      <ImportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    expect(fileInput.accept).toBe('.csv,.json');
    expect(fileInput.className).toContain('hidden');
  });

  it('processes a CSV file when selected', async () => {
    render(
      <ImportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    const csvContent = 'title,category\nDishes,kitchen\nVacuum,living_room';
    const file = new File([csvContent], 'chores.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Simulate file selection
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    // Wait for FileReader to process
    await vi.waitFor(() => {
      expect(screen.getByText('chores.csv')).toBeInTheDocument();
    });

    expect(screen.getByText('csv')).toBeInTheDocument();
  });

  it('processes a JSON file when selected', async () => {
    render(
      <ImportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    const jsonContent = JSON.stringify([
      { title: 'Dishes', category: 'kitchen' },
      { title: 'Vacuum', category: 'living_room' },
    ]);
    const file = new File([jsonContent], 'chores.json', { type: 'application/json' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(screen.getByText('chores.json')).toBeInTheDocument();
    });

    expect(screen.getByText('json')).toBeInTheDocument();
  });

  it('shows preview table after file is loaded', async () => {
    render(
      <ImportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    const csvContent = 'title,category\nDishes,kitchen\nVacuum,living_room';
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(screen.getByText('Dishes')).toBeInTheDocument();
    });

    expect(screen.getByText('kitchen')).toBeInTheDocument();
    expect(screen.getByText('Vacuum')).toBeInTheDocument();
  });

  it('shows remove file button after file is loaded', async () => {
    render(
      <ImportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    const csvContent = 'title,category\nDishes,kitchen';
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(screen.getByLabelText('Remove file')).toBeInTheDocument();
    });
  });

  it('resets to drop zone when remove file is clicked', async () => {
    render(
      <ImportDialog householdId="h-1" open={true} onOpenChange={mockOnOpenChange} />
    );

    const csvContent = 'title,category\nDishes,kitchen';
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(screen.getByLabelText('Remove file')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Remove file'));

    expect(screen.getByText('Drop a CSV or JSON file here')).toBeInTheDocument();
  });
});
