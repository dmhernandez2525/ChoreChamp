import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock params
vi.mock('react-router-dom', () => ({
  useParams: () => ({ householdId: 'hh-001' }),
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// Mock auth
const mockUser = { id: 'user-1', name: 'Test Parent' };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock data
const mockHousehold = { id: 'hh-001', name: 'Smith Family' };
const mockMembers = [
  { id: 'm-1', userId: 'user-1', name: 'Test Parent', role: 'parent' },
  { id: 'm-2', userId: 'user-2', name: 'Test Child', role: 'child' },
];
const mockCurrentBoss = {
  id: 'boss-1',
  name: 'Dust Dragon',
  health: 500,
  maxHealth: 1000,
};
const mockBossHistory = [
  { id: 'boss-0', name: 'Grime Goblin', health: 0, maxHealth: 800 },
];
const mockBattleStats = {
  party: {
    householdId: 'hh-001',
    healthCurrent: 75,
    healthMax: 100,
    weeklyGoal: 20,
    weeklyProgress: 12,
    bossActive: true,
    bossId: 'boss-1',
  },
  contributors: [
    { memberId: 'm-1', name: 'Test Parent', damage: 300 },
    { memberId: 'm-2', name: 'Test Child', damage: 200 },
  ],
};

const mockApiState = {
  household: { data: mockHousehold, isLoading: false } as { data: typeof mockHousehold | null; isLoading: boolean },
  members: { data: mockMembers, isLoading: false } as { data: typeof mockMembers | null; isLoading: boolean },
  currentBoss: { data: mockCurrentBoss, isLoading: false } as { data: typeof mockCurrentBoss | null; isLoading: boolean },
  bossHistory: { data: mockBossHistory, isLoading: false } as { data: typeof mockBossHistory | null; isLoading: boolean },
  battleStats: { data: mockBattleStats, isLoading: false } as { data: typeof mockBattleStats | null; isLoading: boolean },
};

vi.mock('@chorechamp/api-client', () => ({
  useHousehold: () => mockApiState.household,
  useMembers: () => mockApiState.members,
  useCurrentBossBattle: () => mockApiState.currentBoss,
  useBossBattleHistory: () => mockApiState.bossHistory,
  useBossBattleStats: () => mockApiState.battleStats,
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

// Mock boss battle components
vi.mock('../components/bossbattle', () => ({
  BossCard: ({ boss }: { boss: { name: string } }) => (
    <div data-testid="boss-card">{boss.name}</div>
  ),
  FamilyGoalProgress: ({ party }: { party: { weeklyProgress: number; weeklyGoal: number } }) => (
    <div data-testid="family-goal-progress">{party.weeklyProgress}/{party.weeklyGoal}</div>
  ),
  ContributionLeaderboard: ({ contributors }: { contributors: { name: string }[]; currentUserId?: string }) => (
    <div data-testid="contribution-leaderboard">
      {contributors.map((c, i) => <span key={i}>{c.name}</span>)}
    </div>
  ),
  BossHistoryList: ({ bosses }: { bosses: { id: string; name: string }[] }) => (
    <div data-testid="boss-history-list">
      {bosses.map((b) => <span key={b.id}>{b.name}</span>)}
    </div>
  ),
}));

import BossBattle from './BossBattle';

describe('BossBattle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiState.household = { data: mockHousehold, isLoading: false };
    mockApiState.members = { data: mockMembers, isLoading: false };
    mockApiState.currentBoss = { data: mockCurrentBoss, isLoading: false };
    mockApiState.bossHistory = { data: mockBossHistory, isLoading: false };
    mockApiState.battleStats = { data: mockBattleStats, isLoading: false };
  });

  it('renders loading skeletons when data is loading', () => {
    mockApiState.household = { data: null, isLoading: true };
    render(<BossBattle />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders loading when boss data is loading', () => {
    mockApiState.currentBoss = { data: null, isLoading: true };
    render(<BossBattle />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders not found when household is null', () => {
    mockApiState.household = { data: null, isLoading: false };
    render(<BossBattle />);
    expect(screen.getByText('Household not found')).toBeInTheDocument();
    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('renders the Boss Battle header', () => {
    render(<BossBattle />);
    expect(screen.getByText('Boss Battle')).toBeInTheDocument();
  });

  it('displays household name in the header', () => {
    render(<BossBattle />);
    expect(screen.getByText('Smith Family')).toBeInTheDocument();
  });

  it('renders back link to household page', () => {
    render(<BossBattle />);
    const backLink = screen.getByText('\u2190');
    expect(backLink.closest('a')).toHaveAttribute('href', '/households/hh-001');
  });

  it('renders the BossCard when a current boss exists', () => {
    render(<BossBattle />);
    expect(screen.getByTestId('boss-card')).toBeInTheDocument();
    // "Dust Dragon" appears in both boss-card and boss-history-list
    expect(screen.getAllByText('Dust Dragon').length).toBeGreaterThanOrEqual(1);
  });

  it('renders No Active Boss Battle state when no current boss', () => {
    mockApiState.currentBoss = { data: null, isLoading: false };
    render(<BossBattle />);
    expect(screen.getByText('No Active Boss Battle')).toBeInTheDocument();
    expect(screen.getByText(/Parents can start a new boss battle/)).toBeInTheDocument();
  });

  it('renders Start New Battle button for parents when no boss', () => {
    mockApiState.currentBoss = { data: null, isLoading: false };
    render(<BossBattle />);
    expect(screen.getByText('Start New Battle')).toBeInTheDocument();
  });

  it('does not render Start New Battle button for non-parent members', () => {
    mockApiState.currentBoss = { data: null, isLoading: false };
    mockApiState.members = {
      data: [{ id: 'm-2', userId: 'user-1', name: 'Test Child', role: 'child' }],
      isLoading: false,
    };
    render(<BossBattle />);
    expect(screen.queryByText('Start New Battle')).not.toBeInTheDocument();
  });

  it('renders How Boss Battles Work section', () => {
    render(<BossBattle />);
    expect(screen.getByText('How Boss Battles Work')).toBeInTheDocument();
    expect(screen.getByText(/Complete chores to deal damage/)).toBeInTheDocument();
  });

  it('renders FamilyGoalProgress component', () => {
    render(<BossBattle />);
    const progress = screen.getByTestId('family-goal-progress');
    expect(progress).toBeInTheDocument();
    // The text content contains the progress values (split across text nodes)
    expect(progress.textContent).toContain('/');
    expect(progress.textContent).toContain('20');
  });

  it('renders ContributionLeaderboard component', () => {
    render(<BossBattle />);
    expect(screen.getByTestId('contribution-leaderboard')).toBeInTheDocument();
  });

  it('renders BossHistoryList component', () => {
    render(<BossBattle />);
    expect(screen.getByTestId('boss-history-list')).toBeInTheDocument();
  });
});
