export type SubscriptionTier = 'free' | 'family' | 'premium';
export type SubscriptionStatus =
  | 'free'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'grace_period'
  | 'canceled'
  | 'expired';
export type BillingInterval = 'monthly' | 'annual';
export type SubscriptionProvider = 'stripe' | 'revenuecat' | 'apple' | 'google';
export type SubscriptionStore = 'app_store' | 'play_store' | 'web';

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  annualSavingsLabel: string;
  memberLimit: number | null;
  features: string[];
  highlight: boolean;
}

export interface SubscriptionSummary {
  id: string | null;
  householdId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  provider: SubscriptionProvider | null;
  store: SubscriptionStore | null;
  billingInterval: BillingInterval | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  trialEndsAt: Date | null;
  gracePeriodEndsAt: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  isGrandfathered: boolean;
  memberLimit: number | null;
}

export interface SubscriptionPlansResponse {
  plans: SubscriptionPlan[];
  trialDays: number;
}

export interface SubscriptionStatusResponse {
  subscription: SubscriptionSummary;
}

export interface CreateCheckoutSessionRequest {
  tier: Exclude<SubscriptionTier, 'free'>;
  billingInterval: BillingInterval;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutSessionResponse {
  url: string;
}

export interface CreatePortalSessionRequest {
  returnUrl: string;
}

export interface CreatePortalSessionResponse {
  url: string;
}

export interface RevenueCatSyncRequest {
  appUserId: string;
  householdId: string;
  tier: Exclude<SubscriptionTier, 'free'>;
  store: SubscriptionStore;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  isTrial: boolean;
}

export interface RevenueCatSyncResponse {
  subscription: SubscriptionSummary;
}
