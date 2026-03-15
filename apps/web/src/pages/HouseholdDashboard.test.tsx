import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useParams: () => ({ householdId: 'household-123' }),
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// Mock auth context
const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
const mockSignOut = vi.fn().mockResolvedValue(undefined);
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    signOut: mockSignOut,
  }),
}));

// Mock API client hooks
const mockCompleteChore = { mutateAsync: vi.fn().mockResolvedValue(undefined) };
const mockApproveCompletion = { mutateAsync: vi.fn().mockResolvedValue(undefined) };
const mockRejectCompletion = { mutateAsync: vi.fn().mockResolvedValue(undefined) };

let mockHouseholdData: { data: unknown; isLoading: boolean } = {
  data: { id: 'household-123', name: 'Test Family', pointsName: 'Stars' },
  isLoading: false,
};
let mockMembersData: { data: unknown; isLoading: boolean } = {
  data: [
    { id: 'member-1', userId: 'user-1', name: 'Test User', role: 'parent', color: '#3b82f6' },
  ],
  isLoading: false,
};
let mockChoresData: { data: unknown; isLoading: boolean } = {
  data: [],
  isLoading: false,
};

vi.mock('@chorechamp/api-client', () => ({
  useHousehold: () => mockHouseholdData,
  useMembers: () => mockMembersData,
  useTodaysChores: () => mockChoresData,
  useCompleteChore: () => mockCompleteChore,
  useApproveCompletion: () => mockApproveCompletion,
  useRejectCompletion: () => mockRejectCompletion,
}));

// Mock chore store
const mockSetSelectedHousehold = vi.fn();
const mockSetSelectedMember = vi.fn();
vi.mock('../stores/chore-store', () => ({
  useChoreStore: () => ({
    setSelectedHousehold: mockSetSelectedHousehold,
    setSelectedMember: mockSetSelectedMember,
    selectedMemberId: null,
  }),
}));

// Mock accessibility
vi.mock('../components/accessibility', () => ({
  useAccessibility: () => ({
    announce: vi.fn(),
  }),
}));

// Mock celebrations
vi.mock('../components/celebrations', () => ({
  useCelebration: () => ({
    celebrateChoreCompleted: vi.fn(),
  }),
}));

// Mock subscription
vi.mock('../lib/subscription', () => ({
  hasFeature: () => false,
}));

// Mock UI
vi.mock('@chorechamp/ui', () => ({
  Button: ({ children, onClick, disabled, type, ...props }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: string; [key: string]: unknown }) => (
    <button onClick={onClick} disabled={disabled} type={type as 'button' | 'submit' | 'reset' | undefined} {...props}>{children}</button>
  ),
}));

// Mock chore components
vi.mock('../components/chores', () => ({
  ChoreList: () => <div data-testid="chore-list">ChoreList</div>,
  ChorePreviewList: () => <div data-testid="chore-preview-list">ChorePreviewList</div>,
  ChoreDetailModal: () => <div data-testid="chore-detail-modal" />,
  PendingApprovals: () => <div data-testid="pending-approvals">PendingApprovals</div>,
  StatsCards: () => <div data-testid="stats-cards">StatsCards</div>,
  QuickStats: () => <div data-testid="quick-stats">QuickStats</div>,
}));

// Mock common components
vi.mock('../components/common', () => ({
  DashboardSkeleton: () => <div data-testid="dashboard-skeleton">Loading...</div>,
  NoChoresEmptyState: () => <div data-testid="no-chores-empty">No chores today!</div>,
}));

import HouseholdDashboard from './HouseholdDashboard';

describe('HouseholdDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHouseholdData = {
      data: { id: 'household-123', name: 'Test Family', pointsName: 'Stars' },
      isLoading: false,
    };
    mockMembersData = {
      data: [
        { id: 'member-1', userId: 'user-1', name: 'Test User', role: 'parent', color: '#3b82f6' },
      ],
      isLoading: false,
    };
    mockChoresData = {
      data: [],
      isLoading: false,
    };
  });

  it('renders loading skeleton when data is loading', () => {
    mockHouseholdData = { data: undefined, isLoading: true };
    mockMembersData = { data: undefined, isLoading: true };
    mockChoresData = { data: undefined, isLoading: true };

    render(<HouseholdDashboard />);
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });

  it('renders household not found when household data is null', () => {
    mockHouseholdData = { data: null, isLoading: false };

    render(<HouseholdDashboard />);
    expect(screen.getByText('Household not found')).toBeInTheDocument();
    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('renders the household name in the header', () => {
    render(<HouseholdDashboard />);
    expect(screen.getByText('Test Family')).toBeInTheDocument();
  });

  it('renders tabs for today, all chores', () => {
    render(<HouseholdDashboard />);
    expect(screen.getByText("Today's Chores")).toBeInTheDocument();
    expect(screen.getByText('All Chores')).toBeInTheDocument();
  });

  it('renders approvals tab when user is a parent', () => {
    render(<HouseholdDashboard />);
    expect(screen.getByText('Approvals')).toBeInTheDocument();
  });

  it('does not render approvals tab when user is a child', () => {
    mockMembersData = {
      data: [
        { id: 'member-1', userId: 'user-1', name: 'Test User', role: 'child', color: '#3b82f6' },
      ],
      isLoading: false,
    };

    render(<HouseholdDashboard />);
    expect(screen.queryByText('Approvals')).not.toBeInTheDocument();
  });

  it('shows no chores empty state when there are no chores', () => {
    mockChoresData = { data: [], isLoading: false };

    render(<HouseholdDashboard />);
    expect(screen.getByTestId('no-chores-empty')).toBeInTheDocument();
  });

  it('switches to all chores tab on click', async () => {
    const user = userEvent.setup();
    render(<HouseholdDashboard />);

    await user.click(screen.getByText('All Chores'));
    expect(screen.getByTestId('chore-list')).toBeInTheDocument();
  });

  it('renders sign out button and signs out on click', async () => {
    const user = userEvent.setup();
    render(<HouseholdDashboard />);

    await user.click(screen.getByText('Sign Out'));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('renders quick action links', () => {
    render(<HouseholdDashboard />);
    expect(screen.getByText('+ Add Chore')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });
});
