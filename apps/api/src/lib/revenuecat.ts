import { createLogger } from './logger';
import type { SubscriptionStatus, SubscriptionTier } from '@chorechamp/types';

const logger = createLogger('revenuecat');

/**
 * RevenueCat API configuration
 */
const REVENUECAT_API_URL = 'https://api.revenuecat.com/v1';

interface RevenueCatEntitlement {
  expires_date: string | null;
  purchase_date: string;
  product_identifier: string;
}

interface RevenueCatSubscriberResponse {
  request_date: string;
  request_date_ms: number;
  subscriber: {
    entitlements: {
      [entitlementId: string]: RevenueCatEntitlement;
    };
    subscriptions: {
      [productId: string]: {
        expires_date: string | null;
        purchase_date: string;
        is_sandbox: boolean;
        store: string;
        unsubscribe_detected_at: string | null;
        billing_issues_detected_at: string | null;
        period_type: 'normal' | 'trial' | 'intro';
      };
    };
    non_subscriptions: Record<string, unknown>;
    first_seen: string;
    original_app_user_id: string;
  };
}

export interface VerifiedSubscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  store: 'app_store' | 'play_store' | 'web';
  currentPeriodEnd: Date | null;
  isTrial: boolean;
}

/**
 * Get RevenueCat API key from environment.
 * Throws if not configured.
 */
function getRevenueCatApiKey(): string {
  const apiKey = process.env.REVENUECAT_API_KEY;
  if (!apiKey) {
    throw new Error('REVENUECAT_API_KEY is not configured');
  }
  return apiKey;
}

/**
 * Map RevenueCat store name to our internal store type
 */
function mapStore(store: string): 'app_store' | 'play_store' | 'web' {
  switch (store.toLowerCase()) {
    case 'app_store':
    case 'mac_app_store':
      return 'app_store';
    case 'play_store':
      return 'play_store';
    case 'stripe':
    case 'promotional':
    default:
      return 'web';
  }
}

/**
 * Map RevenueCat entitlements to our subscription tier
 */
function mapEntitlementToTier(entitlements: Record<string, RevenueCatEntitlement>): SubscriptionTier {
  // Check for premium entitlement first (higher tier)
  if (entitlements['premium'] || entitlements['chorechamp_premium']) {
    return 'premium';
  }
  // Check for family entitlement
  if (entitlements['family'] || entitlements['chorechamp_family']) {
    return 'family';
  }
  // No active entitlements = free tier
  return 'free';
}

/**
 * Determine subscription status from RevenueCat subscription data
 */
function determineStatus(
  subscription: RevenueCatSubscriberResponse['subscriber']['subscriptions'][string] | undefined,
  expiresDate: Date | null
): SubscriptionStatus {
  if (!subscription) {
    return 'free';
  }

  const now = Date.now();

  // Check for billing issues (grace period)
  if (subscription.billing_issues_detected_at) {
    return 'grace_period';
  }

  // Check for unsubscribed/canceled
  if (subscription.unsubscribe_detected_at) {
    // Still within paid period?
    if (expiresDate && expiresDate.getTime() > now) {
      return 'canceled'; // Canceled but still active
    }
    return 'expired';
  }

  // Check expiration
  if (expiresDate && expiresDate.getTime() < now) {
    return 'expired';
  }

  // Check trial period
  if (subscription.period_type === 'trial') {
    return 'trialing';
  }

  return 'active';
}

/**
 * Verify subscription status directly with RevenueCat API.
 * This should be used instead of trusting client-provided data.
 */
export async function verifySubscription(appUserId: string): Promise<VerifiedSubscription> {
  const apiKey = getRevenueCatApiKey();

  logger.info({ appUserId }, 'Verifying subscription with RevenueCat API');

  const response = await fetch(`${REVENUECAT_API_URL}/subscribers/${encodeURIComponent(appUserId)}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Platform': 'ios', // Required header, but response contains all platforms
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error({
      appUserId,
      status: response.status,
      error: errorText,
    }, 'RevenueCat API request failed');

    if (response.status === 404) {
      // User not found in RevenueCat - treat as free tier
      return {
        tier: 'free',
        status: 'free',
        store: 'web',
        currentPeriodEnd: null,
        isTrial: false,
      };
    }

    throw new Error(`RevenueCat API error: ${response.status}`);
  }

  const data = await response.json() as RevenueCatSubscriberResponse;
  const subscriber = data.subscriber;

  // Get active entitlements (only those that haven't expired)
  const now = Date.now();
  const activeEntitlements: Record<string, RevenueCatEntitlement> = {};

  for (const [id, entitlement] of Object.entries(subscriber.entitlements)) {
    const expiresDate = entitlement.expires_date ? new Date(entitlement.expires_date) : null;
    // Include entitlement if it has no expiry or hasn't expired yet
    if (!expiresDate || expiresDate.getTime() > now) {
      activeEntitlements[id] = entitlement;
    }
  }

  const tier = mapEntitlementToTier(activeEntitlements);

  // Find the most recent active subscription for status details
  let latestSubscription: RevenueCatSubscriberResponse['subscriber']['subscriptions'][string] | undefined;
  let latestExpiresDate: Date | null = null;
  let store: 'app_store' | 'play_store' | 'web' = 'web';

  for (const [, sub] of Object.entries(subscriber.subscriptions)) {
    const subExpires = sub.expires_date ? new Date(sub.expires_date) : null;

    // Find subscription with latest expiry date
    if (!latestExpiresDate || (subExpires && subExpires.getTime() > latestExpiresDate.getTime())) {
      latestSubscription = sub;
      latestExpiresDate = subExpires;
      store = mapStore(sub.store);
    }
  }

  const status = determineStatus(latestSubscription, latestExpiresDate);
  const isTrial = latestSubscription?.period_type === 'trial';

  logger.info({
    appUserId,
    tier,
    status,
    store,
    isTrial,
    currentPeriodEnd: latestExpiresDate?.toISOString(),
  }, 'RevenueCat subscription verified');

  return {
    tier,
    status,
    store,
    currentPeriodEnd: latestExpiresDate,
    isTrial,
  };
}

/**
 * Check if RevenueCat is configured
 */
export function isRevenueCatConfigured(): boolean {
  return Boolean(process.env.REVENUECAT_API_KEY);
}
