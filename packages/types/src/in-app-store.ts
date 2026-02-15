export type StoreCatalogItemType =
  | 'cosmetic'
  | 'booster'
  | 'card_pack'
  | 'pet_item'
  | 'story_chapter'
  | 'mini_game_unlock'
  | 'currency_bundle'
  | 'gift_premium';

export type StorePaymentMethod = 'coins' | 'points' | 'gift_card';

export type StorePurchaseStatus =
  | 'completed'
  | 'pending_parent_approval'
  | 'declined'
  | 'refund_requested'
  | 'refunded';

export type StoreRefundStatus = 'pending' | 'approved' | 'rejected';

export type StoreEntitlementType =
  | 'cosmetic'
  | 'booster'
  | 'card_pack'
  | 'pet_accessory'
  | 'story_chapter'
  | 'mini_game_unlock'
  | 'streak_shield'
  | 'xp_boost'
  | 'point_multiplier';

export type StoreGiftCardStatus = 'active' | 'redeemed' | 'expired' | 'canceled';

export interface StoreCatalogItem {
  id: string;
  sku: string;
  title: string;
  description: string;
  itemType: StoreCatalogItemType;
  category: string;
  icon: string | null;
  baseCoinPrice: number;
  basePointPrice: number;
  salePercent: number;
  isLimitedTime: boolean;
  availableFrom: Date | null;
  availableUntil: Date | null;
  maxPurchasesPerMember: number | null;
  requiresParentApproval: boolean;
  metadata: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreWallet {
  id: string;
  householdId: string;
  memberId: string;
  choreCoinsBalance: number;
  lifetimeCoinsPurchased: number;
  lifetimeCoinsSpent: number;
  updatedAt: Date;
}

export interface StoreEntitlement {
  id: string;
  householdId: string;
  memberId: string;
  entitlementType: StoreEntitlementType;
  referenceId: string;
  quantity: number;
  expiresAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StorePurchase {
  id: string;
  householdId: string;
  memberId: string;
  catalogItemId: string | null;
  purchaseType: 'catalog' | 'gift_card';
  paymentMethod: StorePaymentMethod;
  quantity: number;
  coinsSpent: number;
  pointsSpent: number;
  coinsGranted: number;
  status: StorePurchaseStatus;
  receiptNumber: string;
  receiptData: Record<string, unknown> | null;
  approvedByMemberId: string | null;
  approvedAt: Date | null;
  purchasedAt: Date;
  refundedAt: Date | null;
}

export interface StoreReceipt {
  purchase: StorePurchase;
  item: StoreCatalogItem | null;
  walletAfterPurchase: number | null;
  pointsAfterPurchase: number | null;
}

export interface StoreRefundRequest {
  id: string;
  purchaseId: string;
  householdId: string;
  memberId: string;
  reason: string;
  details: string | null;
  status: StoreRefundStatus;
  requestedAt: Date;
  resolvedAt: Date | null;
  resolvedByMemberId: string | null;
  resolutionNote: string | null;
}

export interface StorePurchaseControls {
  id: string;
  householdId: string;
  memberId: string;
  requireParentApproval: boolean;
  requirePinForPurchases: boolean;
  dailyCoinLimit: number;
  dailyPointLimit: number;
  allowGiftCards: boolean;
  allowLimitedTimeOffers: boolean;
  updatedAt: Date;
}

export interface StoreGiftCard {
  id: string;
  householdId: string;
  createdByMemberId: string;
  code: string;
  tier: 'family' | 'premium';
  durationMonths: number;
  recipientEmail: string | null;
  message: string | null;
  status: StoreGiftCardStatus;
  redeemedByMemberId: string | null;
  redeemedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface CreateStorePurchaseRequest {
  itemId: string;
  memberId?: string;
  quantity?: number;
  parentPin?: string;
}

export interface ApproveStorePurchaseRequest {
  parentPin?: string;
}

export interface RequestStoreRefundRequest {
  reason: string;
  details?: string;
}

export interface ResolveStoreRefundRequest {
  decision: 'approve' | 'reject';
  note?: string;
}

export interface UpdateStorePurchaseControlsRequest {
  requireParentApproval?: boolean;
  requirePinForPurchases?: boolean;
  parentPin?: string | null;
  dailyCoinLimit?: number;
  dailyPointLimit?: number;
  allowGiftCards?: boolean;
  allowLimitedTimeOffers?: boolean;
}

export interface CreateStoreGiftCardRequest {
  tier: 'family' | 'premium';
  durationMonths: number;
  recipientEmail?: string;
  message?: string;
  expiresInDays?: number;
}

export interface RedeemStoreGiftCardRequest {
  code: string;
}

