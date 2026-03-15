import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';


// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: () => ({ householdId: 'hh-1' }),
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// Mock UI
vi.mock('@chorechamp/ui', () => ({
  Button: ({ children, onClick, _variant, _size, ...props }: {
    children: React.ReactNode;
    onClick?: () => void;
    _variant?: string;
    _size?: string;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

// Mock common
vi.mock('../components/common', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// Mock activity components
vi.mock('../components/activity', () => ({
  ActivityFeed: ({ activities, emptyMessage }: {
    activities: unknown[];
    emptyMessage: string;
  }) => (
    <div data-testid="activity-feed">
      <span data-testid="activity-count">{activities.length}</span>
      {activities.length === 0 && <span>{emptyMessage}</span>}
    </div>
  ),
  ActivityFilter: ({ selectedCategory, onCategoryChange, onMemberChange, members }: {
    selectedCategory: string;
    onCategoryChange: (cat: string) => void;
    selectedMemberId?: string;
    onMemberChange: (id: string | undefined) => void;
    members: { id: string; name: string }[];
  }) => {
    return (
      <div data-testid="activity-filter">
        <span data-testid="current-category">{selectedCategory}</span>
        <span data-testid="member-options">{members.length} members</span>
        <button onClick={() => onCategoryChange('chores')}>Filter Chores</button>
        <button onClick={() => onMemberChange('m-1')}>Filter Member</button>
      </div>
    );
  },
  ActivityStats: ({ activities, className }: { activities: unknown[]; className?: string }) => (
    <div data-testid="activity-stats" className={className}>
      Stats for {activities.length} activities
    </div>
  ),
  MemberActivitySummary: ({ activities }: { activities: unknown[] }) => (
    <div data-testid="member-activity-summary">Summary of {activities.length}</div>
  ),
  categoryActivityTypes: {
    all: null,
    chores: ['chore_completed', 'chore_assigned'],
    rewards: ['reward_redeemed'],
    achievements: ['badge_earned'],
  } as Record<string, string[] | null>,
}));

// API mock data
const mockActivityItems = [
  {
    id: 'a-1',
    type: 'chore_completed',
    title: 'Completed dishes',
    description: 'Washed all the dishes',
    memberId: 'm-1',
    memberName: 'Dad',
    timestamp: new Date().toISOString(),
    metadata: {},
  },
  {
    id: 'a-2',
    type: 'badge_earned',
    title: 'Badge earned',
    description: 'Earned streak badge',
    memberId: 'm-2',
    memberName: 'Emma',
    timestamp: new Date().toISOString(),
    metadata: {},
  },
];

const mockMembersData = [
  { id: 'm-1', userId: 'user-1', name: 'Dad', role: 'parent', color: '#blue' },
  { id: 'm-2', userId: 'user-2', name: 'Emma', role: 'child', color: '#pink' },
];

let mockActivityFeed: { data: { activities: typeof mockActivityItems } | undefined; isLoading: boolean };
let mockMembers: { data: typeof mockMembersData | undefined; isLoading: boolean };

vi.mock('@chorechamp/api-client', () => ({
  useActivityFeed: () => mockActivityFeed,
  useMembers: () => mockMembers,
}));

import Activity from './Activity';

describe('Activity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActivityFeed = { data: { activities: mockActivityItems }, isLoading: false };
    mockMembers = { data: mockMembersData, isLoading: false };
  });

  it('renders the page heading', () => {
    render(<Activity />);
    expect(screen.getByText('Activity Feed')).toBeInTheDocument();
    expect(screen.getByText("See what's happening in your household")).toBeInTheDocument();
  });

  it('renders loading skeletons when data is loading', () => {
    mockActivityFeed = { data: undefined, isLoading: true };
    mockMembers = { data: undefined, isLoading: true };
    render(<Activity />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
    expect(screen.queryByText('Activity Feed')).not.toBeInTheDocument();
  });

  it('renders the activity feed with correct count', () => {
    render(<Activity />);
    expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
    expect(screen.getByTestId('activity-count')).toHaveTextContent('2');
  });

  it('renders the activity stats section', () => {
    render(<Activity />);
    expect(screen.getByTestId('activity-stats')).toHaveTextContent('Stats for 2 activities');
  });

  it('renders the member activity summary', () => {
    render(<Activity />);
    expect(screen.getByTestId('member-activity-summary')).toHaveTextContent('Summary of 2');
  });

  it('renders the activity filter with member options', () => {
    render(<Activity />);
    expect(screen.getByTestId('activity-filter')).toBeInTheDocument();
    expect(screen.getByTestId('member-options')).toHaveTextContent('2 members');
    expect(screen.getByTestId('current-category')).toHaveTextContent('all');
  });

  it('renders quick links in the sidebar', () => {
    render(<Activity />);
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByText('View Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('Boss Battle')).toBeInTheDocument();
    expect(screen.getByText('Rewards Store')).toBeInTheDocument();
  });

  it('renders the back button linking to household', () => {
    render(<Activity />);
    const backLink = screen.getByText('Back').closest('a');
    expect(backLink).toHaveAttribute('href', '/households/hh-1');
  });

  it('handles empty activity data gracefully', () => {
    mockActivityFeed = { data: { activities: [] }, isLoading: false };
    render(<Activity />);
    expect(screen.getByTestId('activity-count')).toHaveTextContent('0');
  });

  it('handles null activity data gracefully', () => {
    mockActivityFeed = { data: undefined, isLoading: false };
    render(<Activity />);
    expect(screen.getByTestId('activity-count')).toHaveTextContent('0');
  });
});
