import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: () => ({ householdId: 'hh-1' }),
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// Mock auth context
const mockUser = { id: 'user-1', email: 'test@example.com' };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock UI
vi.mock('@chorechamp/ui', () => ({
  Button: ({ children, onClick, disabled, asChild, className, ...props }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    asChild?: boolean;
    className?: string;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  ),
}));

// Mock subscription
let mockHasFeature = true;
vi.mock('../lib/subscription', () => ({
  hasFeature: () => mockHasFeature,
}));

// Mock common
vi.mock('../components/common', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// Mock reward components
vi.mock('../components/rewards', () => ({
  PointsDisplay: ({ points }: { points: number; size: string }) => (
    <span data-testid="points-display">{points} pts</span>
  ),
  RewardsList: ({ rewards, onRedeem }: {
    rewards: { id: string; title: string }[];
    currentPoints: number;
    onRedeem: (id: string) => void;
    onEdit?: (id: string) => void;
    redeemingId: string | null;
    isParent: boolean;
  }) => (
    <div data-testid="rewards-list">
      <span data-testid="reward-count">{rewards.length} rewards</span>
      {rewards.map((r) => (
        <div key={r.id}>
          <span>{r.title}</span>
          <button onClick={() => onRedeem(r.id)}>Redeem</button>
        </div>
      ))}
    </div>
  ),
  RedeemRewardModal: ({ reward, onClose, onConfirm }: {
    reward: unknown;
    currentPoints: number;
    onClose: () => void;
    onConfirm: (notes?: string) => void;
    isRedeeming: boolean;
  }) => (
    reward ? (
      <div data-testid="redeem-modal">
        <button onClick={() => onConfirm('test note')}>Confirm Redeem</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null
  ),
  PendingRedemptions: ({ redemptions }: { redemptions: unknown[]; [key: string]: unknown }) => (
    <div data-testid="pending-redemptions">
      <span data-testid="pending-count">{redemptions.length}</span>
    </div>
  ),
}));

// API client mocks
const mockHouseholdData = { id: 'hh-1', name: 'Smith Family', subscriptionTier: 'free' };
const mockMembersData = [
  { id: 'm-1', userId: 'user-1', name: 'Dad', role: 'parent', color: '#blue' },
  { id: 'm-2', userId: 'user-2', name: 'Emma', role: 'child', color: '#pink' },
];
const mockRewardsData = [
  { id: 'r-1', title: 'Extra Screen Time', pointCost: 100, icon: '📺' },
  { id: 'r-2', title: 'Ice Cream', pointCost: 50, icon: '🍦' },
];
const mockStatsData = { pointsCurrent: 200, pointsLifetime: 500 };
const mockPendingData = [
  { id: 'red-1', rewardId: 'r-1', memberId: 'm-2', status: 'pending' },
];

let mockHousehold: { data: typeof mockHouseholdData | undefined; isLoading: boolean };
let mockMembers: { data: typeof mockMembersData | undefined; isLoading: boolean };
let mockRewards: { data: typeof mockRewardsData | undefined; isLoading: boolean };

const mockRedeemMutate = vi.fn().mockResolvedValue(undefined);
const mockApproveMutate = vi.fn().mockResolvedValue(undefined);
const mockFulfillMutate = vi.fn().mockResolvedValue(undefined);
const mockRejectMutate = vi.fn().mockResolvedValue(undefined);

vi.mock('@chorechamp/api-client', () => ({
  useHousehold: () => mockHousehold,
  useMembers: () => mockMembers,
  useRewards: () => mockRewards,
  useGamificationStats: () => ({ data: mockStatsData }),
  usePendingRedemptions: () => ({ data: mockPendingData }),
  useRedeemReward: () => ({ mutateAsync: mockRedeemMutate }),
  useApproveRedemption: () => ({ mutateAsync: mockApproveMutate }),
  useFulfillRedemption: () => ({ mutateAsync: mockFulfillMutate }),
  useRejectRedemption: () => ({ mutateAsync: mockRejectMutate }),
}));

import RewardsStore from './RewardsStore';

describe('RewardsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHousehold = { data: mockHouseholdData, isLoading: false };
    mockMembers = { data: mockMembersData, isLoading: false };
    mockRewards = { data: mockRewardsData, isLoading: false };
    mockHasFeature = true;
  });

  it('renders the page title and household name', () => {
    render(<RewardsStore />);
    // "Rewards Store" appears both in header title and tab; use getAllByText
    const rewardsStoreElements = screen.getAllByText('Rewards Store');
    expect(rewardsStoreElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Smith Family')).toBeInTheDocument();
  });

  it('renders loading skeletons when data is loading', () => {
    mockHousehold = { data: undefined, isLoading: true };
    mockMembers = { data: undefined, isLoading: true };
    mockRewards = { data: undefined, isLoading: true };
    render(<RewardsStore />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
    expect(screen.queryByText('Rewards Store')).not.toBeInTheDocument();
  });

  it('renders "Household not found" when household is null', () => {
    mockHousehold = { data: undefined, isLoading: false };
    render(<RewardsStore />);
    expect(screen.getByText('Household not found')).toBeInTheDocument();
    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('displays the current points balance', () => {
    render(<RewardsStore />);
    expect(screen.getByTestId('points-display')).toHaveTextContent('200 pts');
    expect(screen.getByText('Your Balance')).toBeInTheDocument();
  });

  it('shows the rewards list with correct count', () => {
    render(<RewardsStore />);
    expect(screen.getByTestId('rewards-list')).toBeInTheDocument();
    expect(screen.getByTestId('reward-count')).toHaveTextContent('2 rewards');
  });

  it('shows "Create Reward" button for parent users', () => {
    render(<RewardsStore />);
    expect(screen.getByText('Create Reward')).toBeInTheDocument();
  });

  it('hides "Create Reward" button for non-parent users', () => {
    mockMembers = {
      data: [{ id: 'm-2', userId: 'user-1', name: 'Emma', role: 'child', color: '#pink' }],
      isLoading: false,
    };
    render(<RewardsStore />);
    expect(screen.queryByText('Create Reward')).not.toBeInTheDocument();
  });

  it('shows the pending redemptions tab for parents', async () => {
    const user = userEvent.setup();
    render(<RewardsStore />);

    expect(screen.getByText('Pending Redemptions')).toBeInTheDocument();
    await user.click(screen.getByText('Pending Redemptions'));
    expect(screen.getByTestId('pending-redemptions')).toBeInTheDocument();
  });

  it('shows the reward limit warning when limit is reached and feature is gated', () => {
    mockHasFeature = false;
    mockRewards = {
      data: Array.from({ length: 5 }, (_, i) => ({
        id: `r-${i}`,
        title: `Reward ${i}`,
        pointCost: 10,
        icon: '🎁',
      })),
      isLoading: false,
    };
    render(<RewardsStore />);
    expect(
      screen.getByText(/Free and Family plans can create up to 5 rewards/)
    ).toBeInTheDocument();
  });

  it('opens the redeem modal when a reward is selected', async () => {
    const user = userEvent.setup();
    render(<RewardsStore />);

    expect(screen.queryByTestId('redeem-modal')).not.toBeInTheDocument();
    const redeemButtons = screen.getAllByText('Redeem');
    await user.click(redeemButtons[0]);
    expect(screen.getByTestId('redeem-modal')).toBeInTheDocument();
  });
});
