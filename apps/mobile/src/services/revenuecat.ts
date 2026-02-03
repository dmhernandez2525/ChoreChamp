import Purchases, { CustomerInfo, PurchasesEntitlementInfo } from 'react-native-purchases';
import { Platform } from 'react-native';
import type { RevenueCatSyncRequest, SubscriptionStatus, SubscriptionStore, SubscriptionTier } from '@chorechamp/types';
import { config } from '../config/env';
import { apiClient } from '../lib/api-client';
import { storage } from '../lib/storage';

let isConfigured = false;
let configuredUserId: string | null = null;

const resolveApiKey = (): string | null => {
  if (Platform.OS === 'ios') {
    return config.revenueCatIosApiKey;
  }
  if (Platform.OS === 'android') {
    return config.revenueCatAndroidApiKey;
  }
  return null;
};

const resolveTierFromEntitlements = (active: Record<string, PurchasesEntitlementInfo>): Exclude<SubscriptionTier, 'free'> | null => {
  if (active.premium) return 'premium';
  if (active.family) return 'family';
  return null;
};

const resolveStore = (entitlement: PurchasesEntitlementInfo | undefined): SubscriptionStore => {
  const storeValue = entitlement?.store?.toString().toLowerCase() || '';
  if (storeValue.includes('app')) return 'app_store';
  if (storeValue.includes('play')) return 'play_store';
  return 'web';
};

const resolveStatus = (entitlement: PurchasesEntitlementInfo | undefined): SubscriptionStatus => {
  if (!entitlement) return 'free';
  if (entitlement.isActive) {
    if (entitlement.periodType?.toString().toLowerCase() === 'trial') {
      return 'trialing';
    }
    return 'active';
  }
  return 'expired';
};

const getActiveEntitlement = (active: Record<string, PurchasesEntitlementInfo>) => {
  if (active.premium) return active.premium;
  if (active.family) return active.family;
  return undefined;
};

export const configureRevenueCat = async (appUserId: string): Promise<boolean> => {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    return false;
  }

  if (isConfigured && configuredUserId === appUserId) {
    return true;
  }

  Purchases.configure({ apiKey, appUserID: appUserId });
  isConfigured = true;
  configuredUserId = appUserId;
  return true;
};

export const syncRevenueCatSubscription = async (
  householdId: string,
  fallbackTier?: SubscriptionTier
): Promise<void> => {
  const user = await storage.getUserData<{ id: string }>();
  if (!user?.id) return;

  const configured = await configureRevenueCat(user.id);
  if (!configured) return;

  const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();
  const activeEntitlements = customerInfo.entitlements.active;
  const tier = resolveTierFromEntitlements(activeEntitlements);
  const selectedTier = tier || (fallbackTier && fallbackTier !== 'free' ? (fallbackTier as Exclude<SubscriptionTier, 'free'>) : null);
  if (!selectedTier) return;

  const entitlement = getActiveEntitlement(activeEntitlements);
  const status = tier ? resolveStatus(entitlement) : 'expired';
  const store = tier
    ? resolveStore(entitlement)
    : Platform.OS === 'ios'
      ? 'app_store'
      : 'play_store';
  const currentPeriodEnd = entitlement?.expirationDate || null;
  const isTrial = entitlement?.periodType?.toString().toLowerCase() === 'trial';

  const payload: RevenueCatSyncRequest = {
    appUserId: user.id,
    householdId,
    tier: selectedTier,
    store,
    status,
    currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd).toISOString() : null,
    isTrial: !!isTrial,
  };

  await apiClient.syncRevenueCat(householdId, payload);
};
