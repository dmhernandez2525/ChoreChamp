import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';

export const storeCatalogItems = pgTable(
  'store_catalog_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sku: varchar('sku', { length: 80 }).notNull().unique(),
    title: varchar('title', { length: 150 }).notNull(),
    description: text('description').notNull(),
    itemType: varchar('item_type', { length: 40 }).notNull(),
    category: varchar('category', { length: 40 }).notNull(),
    icon: varchar('icon', { length: 20 }),
    baseCoinPrice: integer('base_coin_price').notNull().default(0),
    basePointPrice: integer('base_point_price').notNull().default(0),
    salePercent: integer('sale_percent').notNull().default(0),
    isLimitedTime: boolean('is_limited_time').notNull().default(false),
    availableFrom: timestamp('available_from', { withTimezone: true }),
    availableUntil: timestamp('available_until', { withTimezone: true }),
    maxPurchasesPerMember: integer('max_purchases_per_member'),
    requiresParentApproval: boolean('requires_parent_approval').notNull().default(false),
    metadata: jsonb('metadata'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_store_catalog_active').on(table.isActive),
    index('idx_store_catalog_type').on(table.itemType),
    index('idx_store_catalog_category').on(table.category),
    index('idx_store_catalog_limited').on(table.isLimitedTime, table.availableFrom, table.availableUntil),
  ]
);

export const storeWallets = pgTable(
  'store_wallets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' })
      .unique(),
    choreCoinsBalance: integer('chore_coins_balance').notNull().default(0),
    lifetimeCoinsPurchased: integer('lifetime_coins_purchased').notNull().default(0),
    lifetimeCoinsSpent: integer('lifetime_coins_spent').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_store_wallets_household').on(table.householdId),
    index('idx_store_wallets_member').on(table.memberId),
  ]
);

export const storePurchases = pgTable(
  'store_purchases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    catalogItemId: uuid('catalog_item_id').references(() => storeCatalogItems.id),
    purchaseType: varchar('purchase_type', { length: 20 }).notNull().default('catalog'),
    paymentMethod: varchar('payment_method', { length: 20 }).notNull(),
    quantity: integer('quantity').notNull().default(1),
    coinsSpent: integer('coins_spent').notNull().default(0),
    pointsSpent: integer('points_spent').notNull().default(0),
    coinsGranted: integer('coins_granted').notNull().default(0),
    status: varchar('status', { length: 40 }).notNull().default('completed'),
    receiptNumber: varchar('receipt_number', { length: 60 }).notNull().unique(),
    receiptData: jsonb('receipt_data'),
    approvedByMemberId: uuid('approved_by_member_id').references(() => members.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    purchasedAt: timestamp('purchased_at', { withTimezone: true }).defaultNow(),
    refundedAt: timestamp('refunded_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_store_purchases_household').on(table.householdId, table.purchasedAt),
    index('idx_store_purchases_member').on(table.memberId, table.purchasedAt),
    index('idx_store_purchases_status').on(table.status),
    index('idx_store_purchases_item').on(table.catalogItemId),
  ]
);

export const storeMemberEntitlements = pgTable(
  'store_member_entitlements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    entitlementType: varchar('entitlement_type', { length: 40 }).notNull(),
    referenceId: varchar('reference_id', { length: 120 }).notNull(),
    quantity: integer('quantity').notNull().default(1),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_store_entitlements_member').on(table.memberId),
    index('idx_store_entitlements_household').on(table.householdId),
    unique('unique_store_entitlement').on(table.memberId, table.entitlementType, table.referenceId),
  ]
);

export const storeRefundRequests = pgTable(
  'store_refund_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    purchaseId: uuid('purchase_id')
      .notNull()
      .references(() => storePurchases.id, { onDelete: 'cascade' }),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    details: text('details'),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedByMemberId: uuid('resolved_by_member_id').references(() => members.id),
    resolutionNote: text('resolution_note'),
  },
  (table) => [
    index('idx_store_refunds_household').on(table.householdId, table.requestedAt),
    index('idx_store_refunds_purchase').on(table.purchaseId),
    index('idx_store_refunds_status').on(table.status),
    unique('unique_store_refund_request_per_purchase').on(table.purchaseId),
  ]
);

export const storePurchaseControls = pgTable(
  'store_purchase_controls',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' })
      .unique(),
    requireParentApproval: boolean('require_parent_approval').notNull().default(true),
    requirePinForPurchases: boolean('require_pin_for_purchases').notNull().default(false),
    pinHash: text('pin_hash'),
    dailyCoinLimit: integer('daily_coin_limit').notNull().default(5000),
    dailyPointLimit: integer('daily_point_limit').notNull().default(2000),
    allowGiftCards: boolean('allow_gift_cards').notNull().default(true),
    allowLimitedTimeOffers: boolean('allow_limited_time_offers').notNull().default(true),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_store_controls_household').on(table.householdId),
    index('idx_store_controls_member').on(table.memberId),
  ]
);

export const storeGiftCards = pgTable(
  'store_gift_cards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    createdByMemberId: uuid('created_by_member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 32 }).notNull().unique(),
    tier: varchar('tier', { length: 20 }).notNull(),
    durationMonths: integer('duration_months').notNull().default(1),
    recipientEmail: text('recipient_email'),
    message: text('message'),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    redeemedByMemberId: uuid('redeemed_by_member_id').references(() => members.id),
    redeemedAt: timestamp('redeemed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_store_gift_cards_household').on(table.householdId, table.createdAt),
    index('idx_store_gift_cards_status').on(table.status),
    index('idx_store_gift_cards_code').on(table.code),
  ]
);

export const storeWalletsRelations = relations(storeWallets, ({ one }) => ({
  household: one(households, {
    fields: [storeWallets.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [storeWallets.memberId],
    references: [members.id],
  }),
}));

export const storePurchasesRelations = relations(storePurchases, ({ one, many }) => ({
  household: one(households, {
    fields: [storePurchases.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [storePurchases.memberId],
    references: [members.id],
  }),
  catalogItem: one(storeCatalogItems, {
    fields: [storePurchases.catalogItemId],
    references: [storeCatalogItems.id],
  }),
  refundRequests: many(storeRefundRequests),
}));

export const storeEntitlementsRelations = relations(storeMemberEntitlements, ({ one }) => ({
  household: one(households, {
    fields: [storeMemberEntitlements.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [storeMemberEntitlements.memberId],
    references: [members.id],
  }),
}));

export const storeRefundRequestsRelations = relations(storeRefundRequests, ({ one }) => ({
  purchase: one(storePurchases, {
    fields: [storeRefundRequests.purchaseId],
    references: [storePurchases.id],
  }),
  household: one(households, {
    fields: [storeRefundRequests.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [storeRefundRequests.memberId],
    references: [members.id],
  }),
  resolvedBy: one(members, {
    fields: [storeRefundRequests.resolvedByMemberId],
    references: [members.id],
  }),
}));

export const storePurchaseControlsRelations = relations(storePurchaseControls, ({ one }) => ({
  household: one(households, {
    fields: [storePurchaseControls.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [storePurchaseControls.memberId],
    references: [members.id],
  }),
}));

export const storeGiftCardsRelations = relations(storeGiftCards, ({ one }) => ({
  household: one(households, {
    fields: [storeGiftCards.householdId],
    references: [households.id],
  }),
  createdBy: one(members, {
    fields: [storeGiftCards.createdByMemberId],
    references: [members.id],
  }),
  redeemedBy: one(members, {
    fields: [storeGiftCards.redeemedByMemberId],
    references: [members.id],
  }),
}));

