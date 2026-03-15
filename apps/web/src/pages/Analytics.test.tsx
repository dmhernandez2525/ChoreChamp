import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: () => ({ householdId: 'hh-1' }),
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// Mock common components
vi.mock('../components/common', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// Mock analytics component
vi.mock('../components/analytics', () => ({
  FamilyAnalyticsDashboard: ({ householdId }: { householdId: string }) => (
    <div data-testid="analytics-dashboard">Analytics for {householdId}</div>
  ),
}));

// Mock FeatureGate
vi.mock('../components/subscription/FeatureGate', () => ({
  FeatureGate: ({ feature, preview, children }: {
    feature: string;
    preview: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div data-testid="feature-gate" data-feature={feature}>
      {children}
      <div data-testid="feature-gate-preview" style={{ display: 'none' }}>{preview}</div>
    </div>
  ),
}));

// API client mock
const mockHouseholdData = {
  id: 'hh-1',
  name: 'Smith Family',
  subscriptionTier: 'premium',
};

let mockHousehold: { data: typeof mockHouseholdData | undefined; isLoading: boolean };

vi.mock('@chorechamp/api-client', () => ({
  useHousehold: () => mockHousehold,
}));

import Analytics from './Analytics';

describe('Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHousehold = { data: mockHouseholdData, isLoading: false };
  });

  it('renders the page title and household name', () => {
    render(<Analytics />);
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Smith Family')).toBeInTheDocument();
  });

  it('renders loading skeletons when data is loading', () => {
    mockHousehold = { data: undefined, isLoading: true };
    render(<Analytics />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
    expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
  });

  it('renders "Household not found" when household is null', () => {
    mockHousehold = { data: undefined, isLoading: false };
    render(<Analytics />);
    expect(screen.getByText('Household not found')).toBeInTheDocument();
    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('renders the back link to household', () => {
    render(<Analytics />);
    const backLink = screen.getByText('←');
    expect(backLink.closest('a')).toHaveAttribute('href', '/households/hh-1');
  });

  it('renders the analytics dashboard inside a feature gate', () => {
    render(<Analytics />);
    expect(screen.getByTestId('feature-gate')).toHaveAttribute('data-feature', 'advanced_analytics');
    expect(screen.getByTestId('analytics-dashboard')).toHaveTextContent('Analytics for hh-1');
  });

  it('provides a preview to the feature gate', () => {
    render(<Analytics />);
    expect(screen.getByTestId('feature-gate-preview')).toBeInTheDocument();
  });

  it('renders the "Back to Dashboard" link on not-found state', () => {
    mockHousehold = { data: undefined, isLoading: false };
    render(<Analytics />);
    const link = screen.getByText('Back to Dashboard');
    expect(link.closest('a')).toHaveAttribute('href', '/dashboard');
  });
});
