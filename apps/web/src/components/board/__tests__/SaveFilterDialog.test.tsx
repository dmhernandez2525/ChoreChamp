import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveFilterDialog } from '../SaveFilterDialog';
import type { ChoreFilter } from '@chorechamp/types';

// Mock filter store
const mockFilterStore = {
  activeFilters: [
    { field: 'priority', operator: 'equals', value: 'high' },
  ] as ChoreFilter[],
};

vi.mock('@/stores/filter-store', () => ({
  useFilterStore: vi.fn(() => mockFilterStore),
}));

const mockMutate = vi.fn();
vi.mock('@chorechamp/api-client', () => ({
  useCreateSavedFilter: vi.fn(() => ({
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

describe('SaveFilterDialog', () => {
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFilterStore.activeFilters = [
      { field: 'priority', operator: 'equals', value: 'high' },
    ];
  });

  it('renders the dialog title', () => {
    render(
      <SaveFilterDialog householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    expect(screen.getByText('Save Filter View')).toBeInTheDocument();
  });

  it('renders the name input', () => {
    render(
      <SaveFilterDialog householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('renders visibility options', () => {
    render(
      <SaveFilterDialog householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    expect(screen.getByText('Just Me')).toBeInTheDocument();
    expect(screen.getByText('Whole Household')).toBeInTheDocument();
  });

  it('shows count of active filters', () => {
    render(
      <SaveFilterDialog householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    expect(screen.getByText(/1 active filter/)).toBeInTheDocument();
  });

  it('shows plural form for multiple filters', () => {
    mockFilterStore.activeFilters = [
      { field: 'priority', operator: 'equals', value: 'high' },
      { field: 'category', operator: 'equals', value: 'kitchen' },
    ];
    render(
      <SaveFilterDialog householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    expect(screen.getByText(/2 active filters/)).toBeInTheDocument();
  });

  it('renders Save View button disabled when name is empty', () => {
    render(
      <SaveFilterDialog householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    const saveBtn = screen.getByText('Save View');
    expect(saveBtn.closest('button')).toBeDisabled();
  });

  it('enables Save View button when name is entered', async () => {
    const user = userEvent.setup();
    render(
      <SaveFilterDialog householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    const input = screen.getByLabelText('Name');
    await user.type(input, 'My Filter');

    const saveBtn = screen.getByText('Save View');
    expect(saveBtn.closest('button')).not.toBeDisabled();
  });

  it('calls createFilter.mutate when Save View is clicked', async () => {
    const user = userEvent.setup();
    render(
      <SaveFilterDialog householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    const input = screen.getByLabelText('Name');
    await user.type(input, 'My Filter');
    await user.click(screen.getByText('Save View'));

    expect(mockMutate).toHaveBeenCalledWith(
      {
        name: 'My Filter',
        filters: mockFilterStore.activeFilters,
        visibility: 'private',
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('sends household visibility when selected', async () => {
    const user = userEvent.setup();
    render(
      <SaveFilterDialog householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    await user.click(screen.getByText('Whole Household'));
    const input = screen.getByLabelText('Name');
    await user.type(input, 'Shared Filter');
    await user.click(screen.getByText('Save View'));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        visibility: 'household',
      }),
      expect.any(Object),
    );
  });

  it('renders Cancel button', () => {
    render(
      <SaveFilterDialog householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(
      <SaveFilterDialog householdId="h1" open={false} onOpenChange={onOpenChange} />
    );

    expect(screen.queryByText('Save Filter View')).not.toBeInTheDocument();
  });

  it('disables Save View when no active filters exist', async () => {
    const user = userEvent.setup();
    mockFilterStore.activeFilters = [];
    render(
      <SaveFilterDialog householdId="h1" open={true} onOpenChange={onOpenChange} />
    );

    const input = screen.getByLabelText('Name');
    await user.type(input, 'Empty');

    const saveBtn = screen.getByText('Save View');
    expect(saveBtn.closest('button')).toBeDisabled();
  });
});
