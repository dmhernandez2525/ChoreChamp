import type { Household, SubscriptionStatus, SubscriptionTier } from '@chorechamp/types';

export type FeatureKey =
  | 'advanced_analytics'
  | 'unlimited_rewards'
  | 'priority_support'
  | 'ad_free'
  | 'custom_themes'
  | 'extended_history'
  | 'api_access'
  | 'white_label';

const TIER_ORDER: Record<SubscriptionTier, number> = {
  free: 0,
  family: 1,
  premium: 2,
};

const ENTITLED_STATUSES: SubscriptionStatus[] = [
  'active',
  'trialing',
  'grace_period',
  'past_due',
];

const FEATURE_REQUIREMENTS: Record<FeatureKey, { tier: SubscriptionTier; label: string; description: string }> = {
  advanced_analytics: {
    tier: 'premium',
    label: 'Advanced analytics',
    description: 'Household trends, insights, and performance breakdowns.',
  },
  unlimited_rewards: {
    tier: 'premium',
    label: 'Unlimited rewards',
    description: 'Create as many custom rewards as your family needs.',
  },
  priority_support: {
    tier: 'premium',
    label: 'Priority support',
    description: 'Get fast help with in-app chat from the support team.',
  },
  ad_free: {
    tier: 'family',
    label: 'Ad-free experience',
    description: 'Remove sponsored content across the household experience.',
  },
  custom_themes: {
    tier: 'premium',
    label: 'Custom themes',
    description: 'Personalize colors and skins across the app.',
  },
  extended_history: {
    tier: 'premium',
    label: 'Extended history',
    description: 'Access up to 2 years of reporting history.',
  },
  api_access: {
    tier: 'premium',
    label: 'API access',
    description: 'Unlock developer access for automations and integrations.',
  },
  white_label: {
    tier: 'premium',
    label: 'White-label branding',
    description: 'Customize branding for enterprise households.',
  },
};

function parseDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeStatus(
  status: SubscriptionStatus | null | undefined,
  gracePeriodEndsAt: Date | string | null | undefined
): SubscriptionStatus {
  if (!status) return 'free';
  if (status === 'grace_period') {
    const grace = parseDate(gracePeriodEndsAt);
    if (grace && grace.getTime() < Date.now()) {
      return 'expired';
    }
  }
  return status;
}

export function isStatusEntitled(status: SubscriptionStatus): boolean {
  return ENTITLED_STATUSES.includes(status);
}

export function getEffectiveTier(
  tier: SubscriptionTier,
  status: SubscriptionStatus,
  gracePeriodEndsAt: Date | string | null | undefined
): SubscriptionTier {
  const normalized = normalizeStatus(status, gracePeriodEndsAt);
  if (!isStatusEntitled(normalized)) {
    return 'free';
  }
  return tier;
}

export function getHouseholdEffectiveTier(household?: Household | null): SubscriptionTier {
  if (!household) return 'free';
  return getEffectiveTier(
    household.subscriptionTier ?? 'free',
    household.subscriptionStatus ?? 'free',
    household.subscriptionGracePeriodEndsAt
  );
}

export function isTierAtLeast(tier: SubscriptionTier, required: SubscriptionTier): boolean {
  return TIER_ORDER[tier] >= TIER_ORDER[required];
}

export function getFeatureRequirement(feature: FeatureKey) {
  return FEATURE_REQUIREMENTS[feature];
}

export function hasFeature(household: Household | null | undefined, feature: FeatureKey): boolean {
  if (!household) return false;
  const effectiveTier = getHouseholdEffectiveTier(household);
  const requirement = FEATURE_REQUIREMENTS[feature];
  if (feature === 'white_label') {
    return Boolean(household.whiteLabelEnabled) && isTierAtLeast(effectiveTier, requirement.tier);
  }
  return isTierAtLeast(effectiveTier, requirement.tier);
}

export function getFeatureTier(feature: FeatureKey): SubscriptionTier {
  return FEATURE_REQUIREMENTS[feature].tier;
}

export function getFeatureLabel(feature: FeatureKey): string {
  return FEATURE_REQUIREMENTS[feature].label;
}

export function getFeatureDescription(feature: FeatureKey): string {
  return FEATURE_REQUIREMENTS[feature].description;
}
