import type {
  BillingInterval,
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionSummary,
  SubscriptionTier,
} from '@chorechamp/types';
import { households } from '@chorechamp/database/schema';

export const TRIAL_DAYS = 14;
const DEFAULT_GRACE_DAYS = 7;

const FREE_PLAN_FEATURES = [
  'Up to 5 family members',
  'Core chore management',
  'Basic gamification (points, streaks, badges)',
  'Template browser',
  'Standard support',
  'Reports up to 30 days',
];

const FAMILY_PLAN_FEATURES = [
  'Up to 6 family members',
  'Ad-free experience',
  'Family challenges and goals',
  'Allowance management',
  'Shared household insights',
  'Reports up to 30 days',
];

const PREMIUM_PLAN_FEATURES = [
  'Unlimited family members',
  'Everything in Family',
  'Advanced analytics',
  'Custom themes and skins',
  'Unlimited custom rewards',
  'Extended reports (2 years)',
  'Priority support chat',
  'API access for power users',
];

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    tier: 'free',
    name: 'Free',
    description: 'Core chores and gamification for small families.',
    monthlyPrice: 0,
    annualPrice: 0,
    annualSavingsLabel: '',
    memberLimit: 5,
    features: FREE_PLAN_FEATURES,
    highlight: false,
  },
  {
    tier: 'family',
    name: 'Family',
    description: 'Premium features for busy households.',
    monthlyPrice: 4.99,
    annualPrice: 49.99,
    annualSavingsLabel: '2 months free',
    memberLimit: 6,
    features: FAMILY_PLAN_FEATURES,
    highlight: true,
  },
  {
    tier: 'premium',
    name: 'Premium',
    description: 'Everything unlocked plus priority support.',
    monthlyPrice: 9.99,
    annualPrice: 99.99,
    annualSavingsLabel: '2 months free',
    memberLimit: null,
    features: PREMIUM_PLAN_FEATURES,
    highlight: false,
  },
];

export function getPlanByTier(tier: SubscriptionTier): SubscriptionPlan {
  const plan = subscriptionPlans.find((entry) => entry.tier === tier);
  if (!plan) {
    return subscriptionPlans[0];
  }
  return plan;
}

export function getMemberLimitForTier(tier: SubscriptionTier): number | null {
  return getPlanByTier(tier).memberLimit ?? null;
}

export function getGracePeriodDays(): number {
  const value = parseInt(process.env.SUBSCRIPTION_GRACE_PERIOD_DAYS || '', 10);
  if (Number.isNaN(value) || value <= 0) {
    return DEFAULT_GRACE_DAYS;
  }
  return value;
}

export function isStatusEntitled(status: SubscriptionStatus): boolean {
  return ['active', 'trialing', 'grace_period', 'past_due'].includes(status);
}

export function normalizeStatus(
  status: SubscriptionStatus | null | undefined,
  gracePeriodEndsAt: Date | string | null
): SubscriptionStatus {
  if (!status) return 'free';
  if (status === 'grace_period' && gracePeriodEndsAt) {
    // Defensive parsing in case database returns string instead of Date
    const gracePeriod = gracePeriodEndsAt instanceof Date
      ? gracePeriodEndsAt
      : new Date(gracePeriodEndsAt);
    if (Number.isNaN(gracePeriod.getTime())) {
      return status;
    }
    if (gracePeriod.getTime() < Date.now()) {
      return 'expired';
    }
  }
  return status;
}

export function getEffectiveTier(
  tier: SubscriptionTier,
  status: SubscriptionStatus,
  gracePeriodEndsAt: Date | string | null
): SubscriptionTier {
  const normalizedStatus = normalizeStatus(status, gracePeriodEndsAt);
  if (!isStatusEntitled(normalizedStatus)) {
    return 'free';
  }
  return tier;
}

const TIER_ORDER: Record<SubscriptionTier, number> = {
  free: 0,
  family: 1,
  premium: 2,
};

export function isTierAtLeast(tier: SubscriptionTier, required: SubscriptionTier): boolean {
  return TIER_ORDER[tier] >= TIER_ORDER[required];
}

export function getEffectiveTierForHousehold(
  household: typeof households.$inferSelect
): SubscriptionTier {
  const tier = (household.subscriptionTier as SubscriptionTier) ?? 'free';
  const status = (household.subscriptionStatus as SubscriptionStatus) ?? 'free';
  return getEffectiveTier(tier, status, household.subscriptionGracePeriodEndsAt ?? null);
}

export function getEffectiveMemberLimit(
  household: typeof households.$inferSelect
): number | null {
  const tier = (household.subscriptionTier as SubscriptionTier) ?? 'free';
  const status = (household.subscriptionStatus as SubscriptionStatus) ?? 'free';
  const effectiveTier = getEffectiveTier(tier, status, household.subscriptionGracePeriodEndsAt ?? null);
  return getMemberLimitForTier(effectiveTier);
}

export function buildSubscriptionSummary(
  household: typeof households.$inferSelect
): SubscriptionSummary {
  const gracePeriodEndsAt = household.subscriptionGracePeriodEndsAt ?? null;
  const status = normalizeStatus(
    (household.subscriptionStatus as SubscriptionStatus | null) ?? 'free',
    gracePeriodEndsAt
  );
  const tier = (household.subscriptionTier as SubscriptionTier) ?? 'free';
  const memberLimit =
    household.subscriptionMemberLimit !== null && household.subscriptionMemberLimit !== undefined
      ? household.subscriptionMemberLimit
      : getMemberLimitForTier(tier);

  return {
    id: household.stripeSubscriptionId ?? null,
    householdId: household.id,
    tier,
    status,
    provider: (household.subscriptionProvider as SubscriptionSummary['provider']) ?? null,
    store: (household.subscriptionStore as SubscriptionSummary['store']) ?? null,
    billingInterval: (household.subscriptionBillingInterval as BillingInterval | null) ?? null,
    currentPeriodStart: household.subscriptionCurrentPeriodStart ?? null,
    currentPeriodEnd: household.subscriptionCurrentPeriodEnd ?? null,
    trialEndsAt: household.subscriptionTrialEndsAt ?? null,
    gracePeriodEndsAt,
    cancelAtPeriodEnd: household.subscriptionCancelAtPeriodEnd ?? false,
    canceledAt: household.subscriptionCanceledAt ?? null,
    isGrandfathered: household.subscriptionIsGrandfathered ?? false,
    memberLimit,
  };
}

export function resolveGrandfathered(
  household: typeof households.$inferSelect
): boolean {
  if (household.subscriptionIsGrandfathered) return true;
  const cutoffRaw = process.env.SUBSCRIPTION_GRANDFATHERED_CUTOFF_DATE;
  if (!cutoffRaw) return false;
  const cutoff = new Date(cutoffRaw);
  if (Number.isNaN(cutoff.getTime())) return false;
  return household.createdAt ? household.createdAt.getTime() < cutoff.getTime() : false;
}

export function mapStripeStatus(status: string): SubscriptionStatus {
  switch (status) {
    case 'trialing':
      return 'trialing';
    case 'active':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
      return 'canceled';
    case 'unpaid':
      return 'past_due';
    case 'incomplete':
      return 'past_due';
    case 'incomplete_expired':
      return 'expired';
    default:
      return 'free';
  }
}
