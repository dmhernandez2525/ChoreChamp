import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';


// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: () => ({ householdId: 'household-123' }),
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// Mock auth context
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
  }),
}));

// Mock API client hooks
let mockHouseholdData: { data: unknown; isLoading: boolean } = {
  data: { id: 'household-123', name: 'Test Family' },
  isLoading: false,
};
let mockMembersData: { data: unknown; isLoading: boolean } = {
  data: [{ id: 'member-1', userId: 'user-1', name: 'Test User' }],
  isLoading: false,
};
let mockLeaderboardData: { data: unknown; isLoading: boolean } = {
  data: [
    { memberId: 'member-1', memberName: 'Test User', totalPoints: 150, completedChores: 10 },
    { memberId: 'member-2', memberName: 'Jane', totalPoints: 120, completedChores: 8 },
  ],
  isLoading: false,
};

vi.mock('@chorechamp/api-client', () => ({
  useHousehold: () => mockHouseholdData,
  useMembers: () => mockMembersData,
  useLeaderboard: () => mockLeaderboardData,
}));

// Mock UI
vi.mock('@chorechamp/ui', () => ({
  Button: ({ children, onClick, disabled, type, ...props }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: string; [key: string]: unknown }) => (
    <button onClick={onClick} disabled={disabled} type={type as 'button' | 'submit' | 'reset' | undefined} {...props}>{children}</button>
  ),
}));

// Mock leaderboard components
vi.mock('../components/leaderboard', () => ({
  LeaderboardTable: ({ entries }: { entries: unknown[] }) => (
    <div data-testid="leaderboard-table">Table with {entries.length} entries</div>
  ),
  LeaderboardPodium: () => <div data-testid="leaderboard-podium">Podium</div>,
  PeriodSelector: ({ onChange }: { onChange: (v: string) => void }) => (
    <div data-testid="period-selector">
      <button onClick={() => onChange('month')}>This Month</button>
      <button onClick={() => onChange('all')}>All Time</button>
    </div>
  ),
}));

// Mock common components
vi.mock('../components/common', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

import Leaderboard from './Leaderboard';

describe('Leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHouseholdData = {
      data: { id: 'household-123', name: 'Test Family' },
      isLoading: false,
    };
    mockMembersData = {
      data: [{ id: 'member-1', userId: 'user-1', name: 'Test User' }],
      isLoading: false,
    };
    mockLeaderboardData = {
      data: [
        { memberId: 'member-1', memberName: 'Test User', totalPoints: 150, completedChores: 10 },
        { memberId: 'member-2', memberName: 'Jane', totalPoints: 120, completedChores: 8 },
      ],
      isLoading: false,
    };
  });

  it('renders loading skeletons when data is loading', () => {
    mockHouseholdData = { data: undefined, isLoading: true };
    mockMembersData = { data: undefined, isLoading: true };
    mockLeaderboardData = { data: undefined, isLoading: true };

    render(<Leaderboard />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders household not found when household is null', () => {
    mockHouseholdData = { data: null, isLoading: false };

    render(<Leaderboard />);
    expect(screen.getByText('Household not found')).toBeInTheDocument();
    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('renders the Leaderboard heading with household name', () => {
    render(<Leaderboard />);
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('Test Family')).toBeInTheDocument();
  });

  it('renders the period selector', () => {
    render(<Leaderboard />);
    expect(screen.getByTestId('period-selector')).toBeInTheDocument();
  });

  it('renders the rankings banner with correct period label', () => {
    render(<Leaderboard />);
    expect(screen.getByText('This Week Rankings')).toBeInTheDocument();
    expect(screen.getByText('2 family members competing')).toBeInTheDocument();
  });

  it('renders the podium when there are leaderboard entries', () => {
    render(<Leaderboard />);
    expect(screen.getByTestId('leaderboard-podium')).toBeInTheDocument();
    expect(screen.getByText('Top 3')).toBeInTheDocument();
  });

  it('renders the full rankings table', () => {
    render(<Leaderboard />);
    expect(screen.getByTestId('leaderboard-table')).toBeInTheDocument();
    expect(screen.getByText('Full Rankings')).toBeInTheDocument();
  });

  it('renders stat summary cards', () => {
    render(<Leaderboard />);
    expect(screen.getByText('Total Points Earned')).toBeInTheDocument();
    expect(screen.getByText('Chores Completed')).toBeInTheDocument();
    expect(screen.getByText('Avg Points/Member')).toBeInTheDocument();
  });

  it('calculates correct total points', () => {
    render(<Leaderboard />);
    // 150 + 120 = 270
    expect(screen.getByText('270')).toBeInTheDocument();
  });

  it('does not render podium or stats when leaderboard is empty', () => {
    mockLeaderboardData = { data: [], isLoading: false };

    render(<Leaderboard />);
    expect(screen.queryByTestId('leaderboard-podium')).not.toBeInTheDocument();
    expect(screen.queryByText('Total Points Earned')).not.toBeInTheDocument();
  });
});
