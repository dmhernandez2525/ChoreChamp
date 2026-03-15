import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock navigate and params
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useParams: () => ({ householdId: 'hh-001' }),
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// Mock API client hooks
const mockHousehold = { id: 'hh-001', name: 'Smith Family' };
const mockMembers = [
  { id: 'm-1', userId: 'user-1', name: 'Parent', role: 'parent' },
  { id: 'm-2', userId: 'user-2', name: 'Child', role: 'child' },
];
const mockCreateChore = {
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
};

const mockApiState = {
  household: { data: mockHousehold, isLoading: false } as { data: typeof mockHousehold | null; isLoading: boolean },
  members: { data: mockMembers, isLoading: false } as { data: typeof mockMembers | null; isLoading: boolean },
};

vi.mock('@chorechamp/api-client', () => ({
  useHousehold: () => mockApiState.household,
  useMembers: () => mockApiState.members,
  useCreateChore: () => mockCreateChore,
}));

// Mock UI
vi.mock('@chorechamp/ui', () => ({
  Button: ({ children, onClick, asChild, ...props }: { children: React.ReactNode; onClick?: () => void; asChild?: boolean; [key: string]: unknown }) => (
    asChild ? <>{children}</> : <button onClick={onClick} {...props}>{children}</button>
  ),
}));

// Mock ChoreForm
vi.mock('../components/chores/form', () => ({
  ChoreForm: ({ onSubmit, onCancel, isSubmitting }: { onSubmit: (data: unknown) => void; onCancel: () => void; isSubmitting: boolean; members?: unknown[] }) => (
    <div data-testid="chore-form">
      <span data-testid="submitting-state">{String(isSubmitting)}</span>
      <button data-testid="submit-btn" onClick={() => onSubmit({ title: 'Test Chore' })}>Submit</button>
      <button data-testid="cancel-btn" onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

// Mock Skeleton
vi.mock('../components/common', () => ({
  Skeleton: ({ className }: { className?: string }) => <div data-testid="skeleton" className={className} />,
}));

import CreateChore from './CreateChore';

describe('CreateChore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiState.household = { data: mockHousehold, isLoading: false };
    mockApiState.members = { data: mockMembers, isLoading: false };
    mockCreateChore.mutateAsync.mockResolvedValue({});
    mockCreateChore.isPending = false;
  });

  it('renders loading skeletons when household is loading', () => {
    mockApiState.household = { data: null, isLoading: true };
    render(<CreateChore />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders loading skeletons when members are loading', () => {
    mockApiState.members = { data: null, isLoading: true };
    render(<CreateChore />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders not found state when household is null', () => {
    mockApiState.household = { data: null, isLoading: false };
    render(<CreateChore />);
    expect(screen.getByText('Household not found')).toBeInTheDocument();
    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('renders not found state when members is null', () => {
    mockApiState.members = { data: null, isLoading: false };
    render(<CreateChore />);
    expect(screen.getByText('Household not found')).toBeInTheDocument();
  });

  it('renders the page header with title', () => {
    render(<CreateChore />);
    expect(screen.getByText('Create New Chore')).toBeInTheDocument();
  });

  it('renders the household name in the header', () => {
    render(<CreateChore />);
    expect(screen.getByText('Smith Family')).toBeInTheDocument();
  });

  it('renders a back link to the household page', () => {
    render(<CreateChore />);
    const backLink = screen.getByText('\u2190');
    expect(backLink.closest('a')).toHaveAttribute('href', '/households/hh-001');
  });

  it('renders the ChoreForm component', () => {
    render(<CreateChore />);
    expect(screen.getByTestId('chore-form')).toBeInTheDocument();
  });

  it('navigates back to household on cancel', () => {
    render(<CreateChore />);
    fireEvent.click(screen.getByTestId('cancel-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('/households/hh-001');
  });

  it('calls createChore and navigates on submit', async () => {
    render(<CreateChore />);
    fireEvent.click(screen.getByTestId('submit-btn'));
    expect(mockCreateChore.mutateAsync).toHaveBeenCalledWith({ title: 'Test Chore' });
  });

  it('passes isSubmitting state to ChoreForm', () => {
    mockCreateChore.isPending = true;
    render(<CreateChore />);
    expect(screen.getByTestId('submitting-state').textContent).toBe('true');
  });
});
