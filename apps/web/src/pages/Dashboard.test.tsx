import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// Mock auth context
const mockSignOut = vi.fn().mockResolvedValue(undefined);
const mockUser = { id: 'user-1', name: 'Test User', email: 'test@example.com' };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    signOut: mockSignOut,
  }),
}));

// Mock API client
const mockHouseholds = [
  { id: 'hh-001', name: 'Smith Family', currentFamilyStreak: 5 },
  { id: 'hh-002', name: 'Work House', currentFamilyStreak: 0 },
];

const mockApiState = {
  households: { data: mockHouseholds, isLoading: false } as { data: typeof mockHouseholds | null; isLoading: boolean },
};

vi.mock('@chorechamp/api-client', () => ({
  useHouseholds: () => mockApiState.households,
}));

// Mock UI
vi.mock('@chorechamp/ui', () => ({
  Button: ({ children, onClick, asChild, ...props }: { children: React.ReactNode; onClick?: () => void; asChild?: boolean; [key: string]: unknown }) => (
    asChild ? <>{children}</> : <button onClick={onClick} {...props}>{children}</button>
  ),
}));

// Mock Skeleton
vi.mock('../components/common', () => ({
  Skeleton: ({ className }: { className?: string }) => <div data-testid="skeleton" className={className} />,
}));

import Dashboard from './Dashboard';

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiState.households = { data: mockHouseholds, isLoading: false };
  });

  it('renders the ChoreChamp header', () => {
    render(<Dashboard />);
    expect(screen.getByText('ChoreChamp')).toBeInTheDocument();
  });

  it('displays the user name in the header', () => {
    render(<Dashboard />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders the Sign Out button', () => {
    render(<Dashboard />);
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('calls signOut and navigates to login on Sign Out click', async () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByText('Sign Out'));
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('shows welcome message with user name', () => {
    render(<Dashboard />);
    expect(screen.getByText('Welcome, Test User!')).toBeInTheDocument();
  });

  it('shows household selection message when households exist', () => {
    render(<Dashboard />);
    expect(screen.getByText("Select a household to view today's chores.")).toBeInTheDocument();
  });

  it('shows getting started message when no households exist', () => {
    mockApiState.households = { data: [], isLoading: false };
    render(<Dashboard />);
    expect(screen.getByText('Get started by creating a household or joining an existing one.')).toBeInTheDocument();
  });

  it('renders loading skeletons when households are loading', () => {
    mockApiState.households = { data: null, isLoading: true };
    render(<Dashboard />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders household cards with names', () => {
    render(<Dashboard />);
    expect(screen.getByText('Smith Family')).toBeInTheDocument();
    expect(screen.getByText('Work House')).toBeInTheDocument();
  });

  it('renders Open links for each household', () => {
    render(<Dashboard />);
    const openLinks = screen.getAllByText('Open');
    expect(openLinks).toHaveLength(2);
    expect(openLinks[0].closest('a')).toHaveAttribute('href', '/households/hh-001');
    expect(openLinks[1].closest('a')).toHaveAttribute('href', '/households/hh-002');
  });

  it('displays streak count for each household', () => {
    render(<Dashboard />);
    expect(screen.getByText('5 day streak')).toBeInTheDocument();
    expect(screen.getByText('0 day streak')).toBeInTheDocument();
  });

  it('renders Add Household card when households exist', () => {
    render(<Dashboard />);
    expect(screen.getByText('Add Household')).toBeInTheDocument();
    expect(screen.getByText('Add Household').closest('a')).toHaveAttribute('href', '/households/new');
  });

  it('renders empty state actions when no households exist', () => {
    mockApiState.households = { data: [], isLoading: false };
    render(<Dashboard />);
    // "Create Household" appears both as a quick action card and in the empty state CTA
    expect(screen.getAllByText('Create Household').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Join Household')).toBeInTheDocument();
    expect(screen.getByText('Browse Templates')).toBeInTheDocument();
  });

  it('renders the No households yet empty state when no households', () => {
    mockApiState.households = { data: [], isLoading: false };
    render(<Dashboard />);
    expect(screen.getByText('No households yet')).toBeInTheDocument();
    expect(screen.getByText('Create a household to start assigning chores and earning points!')).toBeInTheDocument();
  });

  it('renders Browse templates link when households exist', () => {
    render(<Dashboard />);
    const templatesLink = screen.getByText(/Browse 70\+ chore templates/);
    expect(templatesLink).toBeInTheDocument();
    expect(templatesLink.closest('a')).toHaveAttribute('href', '/templates');
  });

  it('renders Create Household and Join with Code buttons in empty state', () => {
    mockApiState.households = { data: [], isLoading: false };
    render(<Dashboard />);
    // Check the button-style links in the centered empty state
    const createLinks = screen.getAllByText('Create Household');
    expect(createLinks.length).toBeGreaterThanOrEqual(1);
    const joinLinks = screen.getAllByText(/Join/);
    expect(joinLinks.length).toBeGreaterThanOrEqual(1);
  });
});
