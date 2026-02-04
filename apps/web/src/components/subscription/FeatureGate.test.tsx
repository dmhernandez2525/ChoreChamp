import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { FeatureGate } from './FeatureGate';
import type { Household } from '@chorechamp/types';

// Mock the subscription lib
vi.mock('../../lib/subscription', () => ({
  hasFeature: vi.fn(),
  getFeatureLabel: vi.fn(),
  getFeatureDescription: vi.fn(),
  getFeatureTier: vi.fn(),
}));

import { hasFeature, getFeatureLabel, getFeatureDescription, getFeatureTier } from '../../lib/subscription';

const mockHouseholdId = '550e8400-e29b-41d4-a716-446655440000';

const createMockHousehold = (overrides: Partial<Household> = {}): Household => ({
  id: mockHouseholdId,
  name: 'Test Household',
  subscriptionTier: 'free',
  subscriptionStatus: 'free',
  subscriptionProvider: null,
  subscriptionStore: null,
  subscriptionBillingInterval: null,
  subscriptionCurrentPeriodStart: null,
  subscriptionCurrentPeriodEnd: null,
  subscriptionExpiresAt: null,
  subscriptionTrialEndsAt: null,
  subscriptionGracePeriodEndsAt: null,
  subscriptionCancelAtPeriodEnd: false,
  subscriptionCanceledAt: null,
  subscriptionMemberLimit: 5,
  subscriptionIsGrandfathered: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const renderWithRouter = (
  ui: React.ReactElement,
  { route = `/households/${mockHouseholdId}/test` } = {}
) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/households/:householdId/*" element={ui} />
      </Routes>
    </MemoryRouter>
  );
};

describe('FeatureGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getFeatureLabel as ReturnType<typeof vi.fn>).mockReturnValue('Advanced Analytics');
    (getFeatureDescription as ReturnType<typeof vi.fn>).mockReturnValue(
      'Household trends, insights, and performance breakdowns.'
    );
    (getFeatureTier as ReturnType<typeof vi.fn>).mockReturnValue('premium');
  });

  describe('locked state for free users', () => {
    it('renders locked state when user does not have the feature', () => {
      (hasFeature as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const freeHousehold = createMockHousehold({ subscriptionTier: 'free' });

      renderWithRouter(
        <FeatureGate household={freeHousehold} feature="advanced_analytics">
          <div data-testid="protected-content">Premium Content</div>
        </FeatureGate>
      );

      // Should show locked UI
      expect(screen.getByText('Premium Feature')).toBeInTheDocument();
      expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
      expect(
        screen.getByText('Household trends, insights, and performance breakdowns.')
      ).toBeInTheDocument();

      // Should NOT show the protected content
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('displays lock icon in locked state', () => {
      (hasFeature as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const freeHousehold = createMockHousehold({ subscriptionTier: 'free' });

      renderWithRouter(
        <FeatureGate household={freeHousehold} feature="advanced_analytics">
          <div>Content</div>
        </FeatureGate>
      );

      // Lock icon should be present (via lucide-react)
      const lockIcon = document.querySelector('svg.lucide-lock');
      expect(lockIcon).toBeInTheDocument();
    });

    it('uses custom title and description when provided', () => {
      (hasFeature as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const freeHousehold = createMockHousehold({ subscriptionTier: 'free' });

      renderWithRouter(
        <FeatureGate
          household={freeHousehold}
          feature="advanced_analytics"
          title="Custom Title"
          description="Custom description for this feature."
        >
          <div>Content</div>
        </FeatureGate>
      );

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom description for this feature.')).toBeInTheDocument();
    });

    it('renders preview content in locked state', () => {
      (hasFeature as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const freeHousehold = createMockHousehold({ subscriptionTier: 'free' });

      renderWithRouter(
        <FeatureGate
          household={freeHousehold}
          feature="advanced_analytics"
          preview={<div data-testid="preview-content">Preview of analytics</div>}
        >
          <div data-testid="real-content">Real analytics</div>
        </FeatureGate>
      );

      expect(screen.getByTestId('preview-content')).toBeInTheDocument();
      expect(screen.queryByTestId('real-content')).not.toBeInTheDocument();
    });
  });

  describe('unlocked state for premium users', () => {
    it('renders children when user has the feature', () => {
      (hasFeature as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const premiumHousehold = createMockHousehold({
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
      });

      renderWithRouter(
        <FeatureGate household={premiumHousehold} feature="advanced_analytics">
          <div data-testid="protected-content">Premium Content</div>
        </FeatureGate>
      );

      // Should show the protected content
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();

      // Should NOT show locked UI
      expect(screen.queryByText('Premium Feature')).not.toBeInTheDocument();
    });

    it('does not show lock icon when unlocked', () => {
      (hasFeature as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const premiumHousehold = createMockHousehold({
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
      });

      renderWithRouter(
        <FeatureGate household={premiumHousehold} feature="advanced_analytics">
          <div>Content</div>
        </FeatureGate>
      );

      const lockIcon = document.querySelector('svg.lucide-lock');
      expect(lockIcon).not.toBeInTheDocument();
    });
  });

  describe('upgrade prompt display', () => {
    it('shows upgrade button linking to subscription page', () => {
      (hasFeature as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (getFeatureTier as ReturnType<typeof vi.fn>).mockReturnValue('premium');

      const freeHousehold = createMockHousehold({ subscriptionTier: 'free' });

      renderWithRouter(
        <FeatureGate household={freeHousehold} feature="advanced_analytics">
          <div>Content</div>
        </FeatureGate>
      );

      const upgradeButton = screen.getByRole('link', { name: /upgrade to premium/i });
      expect(upgradeButton).toBeInTheDocument();
      expect(upgradeButton).toHaveAttribute(
        'href',
        `/households/${mockHouseholdId}/subscription`
      );
    });

    it('shows upgrade to Family for family-tier features', () => {
      (hasFeature as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (getFeatureTier as ReturnType<typeof vi.fn>).mockReturnValue('family');

      const freeHousehold = createMockHousehold({ subscriptionTier: 'free' });

      renderWithRouter(
        <FeatureGate household={freeHousehold} feature="ad_free">
          <div>Content</div>
        </FeatureGate>
      );

      const upgradeButton = screen.getByRole('link', { name: /upgrade to family/i });
      expect(upgradeButton).toBeInTheDocument();
    });

    it('does not show upgrade button when no householdId in params', () => {
      (hasFeature as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const freeHousehold = createMockHousehold({ subscriptionTier: 'free' });

      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={
                <FeatureGate household={freeHousehold} feature="advanced_analytics">
                  <div>Content</div>
                </FeatureGate>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // The upgrade button should not be shown without householdId
      const upgradeButton = screen.queryByRole('link', { name: /upgrade/i });
      expect(upgradeButton).not.toBeInTheDocument();
    });
  });

  describe('null/undefined household handling', () => {
    it('renders locked state when household is null', () => {
      (hasFeature as ReturnType<typeof vi.fn>).mockReturnValue(false);

      renderWithRouter(
        <FeatureGate household={null} feature="advanced_analytics">
          <div data-testid="protected-content">Premium Content</div>
        </FeatureGate>
      );

      expect(screen.getByText('Premium Feature')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('renders locked state when household is undefined', () => {
      (hasFeature as ReturnType<typeof vi.fn>).mockReturnValue(false);

      renderWithRouter(
        <FeatureGate household={undefined} feature="advanced_analytics">
          <div data-testid="protected-content">Premium Content</div>
        </FeatureGate>
      );

      expect(screen.getByText('Premium Feature')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('feature unlock animation', () => {
    it('shows unlock notification when feature becomes available', async () => {
      (hasFeature as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const freeHousehold = createMockHousehold({ subscriptionTier: 'free' });
      const premiumHousehold = createMockHousehold({
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
      });

      const { rerender } = renderWithRouter(
        <FeatureGate household={freeHousehold} feature="advanced_analytics">
          <div data-testid="protected-content">Premium Content</div>
        </FeatureGate>
      );

      // Verify locked state
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

      // Simulate upgrade
      (hasFeature as ReturnType<typeof vi.fn>).mockReturnValue(true);

      await act(async () => {
        rerender(
          <MemoryRouter initialEntries={[`/households/${mockHouseholdId}/test`]}>
            <Routes>
              <Route
                path="/households/:householdId/*"
                element={
                  <FeatureGate household={premiumHousehold} feature="advanced_analytics">
                    <div data-testid="protected-content">Premium Content</div>
                  </FeatureGate>
                }
              />
            </Routes>
          </MemoryRouter>
        );
      });

      // Should now show the content
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();

      // Should show unlock notification
      await waitFor(() => {
        expect(screen.getByText('Feature unlocked!')).toBeInTheDocument();
      });
    });

    it('hides unlock notification after timeout', async () => {
      vi.useFakeTimers();
      (hasFeature as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const freeHousehold = createMockHousehold({ subscriptionTier: 'free' });
      const premiumHousehold = createMockHousehold({
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
      });

      const { rerender } = renderWithRouter(
        <FeatureGate household={freeHousehold} feature="advanced_analytics">
          <div>Content</div>
        </FeatureGate>
      );

      // Simulate upgrade
      (hasFeature as ReturnType<typeof vi.fn>).mockReturnValue(true);

      await act(async () => {
        rerender(
          <MemoryRouter initialEntries={[`/households/${mockHouseholdId}/test`]}>
            <Routes>
              <Route
                path="/households/:householdId/*"
                element={
                  <FeatureGate household={premiumHousehold} feature="advanced_analytics">
                    <div>Content</div>
                  </FeatureGate>
                }
              />
            </Routes>
          </MemoryRouter>
        );
      });

      // Notification should be visible
      expect(screen.getByText('Feature unlocked!')).toBeInTheDocument();

      // Advance timer past the 3.5s timeout
      await act(async () => {
        vi.advanceTimersByTime(4000);
      });

      // Notification should be gone
      expect(screen.queryByText('Feature unlocked!')).not.toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('className prop', () => {
    it('applies custom className when unlocked', () => {
      (hasFeature as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const premiumHousehold = createMockHousehold({
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
      });

      const { container } = renderWithRouter(
        <FeatureGate
          household={premiumHousehold}
          feature="advanced_analytics"
          className="custom-class"
        >
          <div>Content</div>
        </FeatureGate>
      );

      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies custom className when locked', () => {
      (hasFeature as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const freeHousehold = createMockHousehold({ subscriptionTier: 'free' });

      const { container } = renderWithRouter(
        <FeatureGate
          household={freeHousehold}
          feature="advanced_analytics"
          className="custom-class"
        >
          <div>Content</div>
        </FeatureGate>
      );

      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('different feature types', () => {
    const features = [
      { key: 'advanced_analytics', tier: 'premium', label: 'Advanced Analytics' },
      { key: 'unlimited_rewards', tier: 'premium', label: 'Unlimited Rewards' },
      { key: 'priority_support', tier: 'premium', label: 'Priority Support' },
      { key: 'ad_free', tier: 'family', label: 'Ad-free Experience' },
      { key: 'custom_themes', tier: 'premium', label: 'Custom Themes' },
      { key: 'extended_history', tier: 'premium', label: 'Extended History' },
      { key: 'api_access', tier: 'premium', label: 'API Access' },
    ] as const;

    features.forEach(({ key, tier, label }) => {
      it(`correctly handles ${key} feature`, () => {
        (hasFeature as ReturnType<typeof vi.fn>).mockReturnValue(false);
        (getFeatureLabel as ReturnType<typeof vi.fn>).mockReturnValue(label);
        (getFeatureTier as ReturnType<typeof vi.fn>).mockReturnValue(tier);

        const freeHousehold = createMockHousehold({ subscriptionTier: 'free' });

        renderWithRouter(
          <FeatureGate household={freeHousehold} feature={key}>
            <div data-testid={`${key}-content`}>Feature Content</div>
          </FeatureGate>
        );

        expect(screen.getByText(label)).toBeInTheDocument();
        expect(screen.queryByTestId(`${key}-content`)).not.toBeInTheDocument();
      });
    });
  });
});
