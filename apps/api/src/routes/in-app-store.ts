import { createHash, randomBytes } from 'crypto';
import { FastifyInstance } from 'fastify';
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../lib/db';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { getMemberLimitForTier } from '../lib/subscription';
import {
  households,
  members,
  storeCatalogItems,
  storeGiftCards,
  storeMemberEntitlements,
  storePurchaseControls,
  storePurchases,
  storeRefundRequests,
  storeWallets,
} from '@chorechamp/database';
import type {
  StoreCatalogItemType,
  StoreEntitlementType,
  StorePaymentMethod,
  StorePurchaseStatus,
} from '@chorechamp/types';

const STARTER_CHORE_COINS = 500;
const GIFT_CARD_COIN_COST_BY_TIER: Record<'family' | 'premium', number> = {
  family: 2500,
  premium: 5000,
};

const catalogQuerySchema = z.object({
  category: z.string().max(40).optional(),
  type: z.enum([
    'cosmetic',
    'booster',
    'card_pack',
    'pet_item',
    'story_chapter',
    'mini_game_unlock',
    'currency_bundle',
    'gift_premium',
  ]).optional(),
  includeInactive: z.coerce.boolean().optional().default(false),
});

const createPurchaseSchema = z.object({
  itemId: z.string().uuid(),
  memberId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(10).optional().default(1),
  parentPin: z.string().max(12).optional(),
});

const approvePurchaseSchema = z.object({
  parentPin: z.string().max(12).optional(),
});

const createRefundRequestSchema = z.object({
  reason: z.string().min(3).max(240),
  details: z.string().max(1000).optional(),
});

const resolveRefundSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  note: z.string().max(1000).optional(),
});

const updateControlsSchema = z.object({
  requireParentApproval: z.boolean().optional(),
  requirePinForPurchases: z.boolean().optional(),
  parentPin: z.string().max(12).nullable().optional(),
  dailyCoinLimit: z.number().int().min(0).max(100000).optional(),
  dailyPointLimit: z.number().int().min(0).max(100000).optional(),
  allowGiftCards: z.boolean().optional(),
  allowLimitedTimeOffers: z.boolean().optional(),
});

const createGiftCardSchema = z.object({
  tier: z.enum(['family', 'premium']),
  durationMonths: z.number().int().min(1).max(12).default(1),
  recipientEmail: z.string().email().optional(),
  message: z.string().max(500).optional(),
  expiresInDays: z.number().int().min(1).max(365).optional().default(90),
  parentPin: z.string().max(12).optional(),
});

const redeemGiftCardSchema = z.object({
  code: z.string().min(8).max(32),
});

type Membership = typeof members.$inferSelect;
type CatalogItem = typeof storeCatalogItems.$inferSelect;
type Wallet = typeof storeWallets.$inferSelect;
type PurchaseRecord = typeof storePurchases.$inferSelect;
type PurchaseControl = typeof storePurchaseControls.$inferSelect;
type DbExecutor = Pick<typeof db, 'select' | 'insert' | 'update'>;

function startOfDay(date = new Date()): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function addMonths(date: Date, months: number): Date {
  const value = new Date(date);
  value.setMonth(value.getMonth() + months);
  return value;
}

function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex');
}

function verifyPin(pin: string, hash: string | null): boolean {
  if (!hash) return false;
  return hashPin(pin) === hash;
}

function generateReceiptNumber(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = randomBytes(3).toString('hex').toUpperCase();
  return `CC-${stamp}-${suffix}`;
}

function generateGiftCode(): string {
  const raw = randomBytes(6).toString('hex').toUpperCase();
  return `GIFT-${raw}`;
}

function parseMetadataNumber(metadata: Record<string, unknown> | null, key: string, fallback = 0): number {
  if (!metadata) return fallback;
  const value = metadata[key];
  return typeof value === 'number' ? value : fallback;
}

function resolveEntitlementType(itemType: StoreCatalogItemType, metadata: Record<string, unknown> | null): StoreEntitlementType | null {
  switch (itemType) {
    case 'cosmetic':
      return 'cosmetic';
    case 'booster': {
      const effectType = metadata?.effectType;
      if (effectType === 'xp_boost') return 'xp_boost';
      if (effectType === 'point_multiplier') return 'point_multiplier';
      if (effectType === 'streak_shield') return 'streak_shield';
      return 'booster';
    }
    case 'card_pack':
      return 'card_pack';
    case 'pet_item':
      return 'pet_accessory';
    case 'story_chapter':
      return 'story_chapter';
    case 'mini_game_unlock':
      return 'mini_game_unlock';
    default:
      return null;
  }
}

function getPricing(item: CatalogItem, quantity: number): {
  paymentMethod: StorePaymentMethod;
  coinsSpent: number;
  pointsSpent: number;
  coinsGranted: number;
} {
  const saleFactor = Math.max(0, 100 - (item.salePercent ?? 0)) / 100;
  const discountedCoin = Math.floor((item.baseCoinPrice ?? 0) * saleFactor);
  const discountedPoints = Math.floor((item.basePointPrice ?? 0) * saleFactor);

  if ((item.itemType as StoreCatalogItemType) === 'currency_bundle') {
    const metadata = item.metadata as Record<string, unknown> | null;
    const coinsGranted = parseMetadataNumber(metadata, 'coinsGranted', 0) * quantity;
    return {
      paymentMethod: 'points',
      coinsSpent: 0,
      pointsSpent: discountedPoints * quantity,
      coinsGranted,
    };
  }

  return {
    paymentMethod: 'coins',
    coinsSpent: discountedCoin * quantity,
    pointsSpent: 0,
    coinsGranted: 0,
  };
}

function isItemAvailable(item: CatalogItem, now: Date): { valid: boolean; reason?: string } {
  if (!item.isActive) return { valid: false, reason: 'Item is not currently active.' };
  if (item.availableFrom && item.availableFrom > now) {
    return { valid: false, reason: 'Item is not available yet.' };
  }
  if (item.availableUntil && item.availableUntil < now) {
    return { valid: false, reason: 'This offer has ended.' };
  }
  return { valid: true };
}

function buildDefaultCatalog(now: Date): Array<typeof storeCatalogItems.$inferInsert> {
  const nextMonth = addMonths(now, 1);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return [
    {
      sku: 'cosmetic-avatar-starter-pack',
      title: 'Avatar Starter Pack',
      description: 'Unlock 12 premium avatar outfits and profile frames.',
      itemType: 'cosmetic',
      category: 'avatar',
      icon: '🧢',
      baseCoinPrice: 1200,
      basePointPrice: 0,
      salePercent: 0,
      isLimitedTime: false,
      requiresParentApproval: false,
      metadata: { referenceId: 'avatar-starter-pack' },
      isActive: true,
    },
    {
      sku: 'cosmetic-theme-nebula',
      title: 'Nebula Theme Pack',
      description: 'Unlock custom gradients, icons, and app shell skin.',
      itemType: 'cosmetic',
      category: 'themes',
      icon: '🎨',
      baseCoinPrice: 900,
      basePointPrice: 0,
      salePercent: 0,
      isLimitedTime: false,
      requiresParentApproval: false,
      metadata: { referenceId: 'theme-nebula' },
      isActive: true,
    },
    {
      sku: 'booster-xp-3day',
      title: 'XP Booster (3 Days)',
      description: 'Earn 1.5x character XP on all completed chores for 3 days.',
      itemType: 'booster',
      category: 'boosters',
      icon: '⚡',
      baseCoinPrice: 700,
      basePointPrice: 0,
      salePercent: 0,
      isLimitedTime: false,
      requiresParentApproval: false,
      metadata: { referenceId: 'xp-booster-3day', effectType: 'xp_boost', multiplier: 1.5, durationDays: 3 },
      isActive: true,
    },
    {
      sku: 'booster-streak-shield-5',
      title: 'Streak Shield Bundle',
      description: 'Get 5 streak shields to protect progress on busy days.',
      itemType: 'booster',
      category: 'boosters',
      icon: '🛡️',
      baseCoinPrice: 550,
      basePointPrice: 0,
      salePercent: 0,
      isLimitedTime: false,
      requiresParentApproval: false,
      metadata: { referenceId: 'streak-shield', effectType: 'streak_shield', quantityPerPurchase: 5 },
      isActive: true,
    },
    {
      sku: 'cards-premium-pack',
      title: 'Premium Card Pack',
      description: 'Guaranteed rare or better collectible card pack.',
      itemType: 'card_pack',
      category: 'collectibles',
      icon: '🃏',
      baseCoinPrice: 800,
      basePointPrice: 0,
      salePercent: 0,
      isLimitedTime: false,
      requiresParentApproval: false,
      metadata: { referenceId: 'premium-pack' },
      isActive: true,
    },
    {
      sku: 'pet-evolution-token',
      title: 'Pet Evolution Token',
      description: 'Instantly evolve one eligible pet to the next tier.',
      itemType: 'pet_item',
      category: 'pets',
      icon: '🐾',
      baseCoinPrice: 1500,
      basePointPrice: 0,
      salePercent: 0,
      isLimitedTime: false,
      requiresParentApproval: true,
      metadata: { referenceId: 'pet-evolution-token' },
      isActive: true,
    },
    {
      sku: 'story-chapter-frost-peak',
      title: 'Story Expansion: Frost Peak',
      description: 'Unlock chapter 6 with new quests, boss battle, and rewards.',
      itemType: 'story_chapter',
      category: 'story',
      icon: '📖',
      baseCoinPrice: 1800,
      basePointPrice: 0,
      salePercent: 0,
      isLimitedTime: false,
      requiresParentApproval: false,
      metadata: { referenceId: 'chapter-frost-peak' },
      isActive: true,
    },
    {
      sku: 'arcade-power-pass',
      title: 'Arcade Power Pass',
      description: 'Unlock two mini-games and a double-score power-up.',
      itemType: 'mini_game_unlock',
      category: 'arcade',
      icon: '🕹️',
      baseCoinPrice: 1300,
      basePointPrice: 0,
      salePercent: 0,
      isLimitedTime: false,
      requiresParentApproval: false,
      metadata: { referenceId: 'arcade-power-pass' },
      isActive: true,
    },
    {
      sku: 'coins-starter-1000',
      title: 'ChoreCoins Bundle (1,000)',
      description: 'Exchange points for 1,000 ChoreCoins.',
      itemType: 'currency_bundle',
      category: 'currency',
      icon: '🪙',
      baseCoinPrice: 0,
      basePointPrice: 250,
      salePercent: 0,
      isLimitedTime: false,
      requiresParentApproval: false,
      metadata: { coinsGranted: 1000, referenceId: 'coins-1000' },
      isActive: true,
    },
    {
      sku: 'coins-pro-5000',
      title: 'ChoreCoins Bundle (5,000)',
      description: 'Exchange points for 5,000 ChoreCoins.',
      itemType: 'currency_bundle',
      category: 'currency',
      icon: '💰',
      baseCoinPrice: 0,
      basePointPrice: 1100,
      salePercent: 10,
      isLimitedTime: true,
      availableFrom: now,
      availableUntil: nextMonth,
      requiresParentApproval: false,
      metadata: { coinsGranted: 5000, referenceId: 'coins-5000' },
      isActive: true,
    },
    {
      sku: 'gift-premium-month',
      title: 'Gift Premium (1 Month)',
      description: 'Generate a gift code for one month of Premium access.',
      itemType: 'gift_premium',
      category: 'gifts',
      icon: '🎁',
      baseCoinPrice: GIFT_CARD_COIN_COST_BY_TIER.premium,
      basePointPrice: 0,
      salePercent: 20,
      isLimitedTime: true,
      availableFrom: now,
      availableUntil: nextWeek,
      requiresParentApproval: true,
      metadata: { tier: 'premium', durationMonths: 1, referenceId: 'gift-premium-month' },
      isActive: true,
    },
  ];
}

async function ensureCatalogSeeded(): Promise<void> {
  const [existing] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(storeCatalogItems);
  if ((existing?.count ?? 0) > 0) return;
  await db.insert(storeCatalogItems).values(buildDefaultCatalog(new Date()));
}

async function getMembership(userId: string, householdId: string): Promise<Membership | null> {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(eq(members.householdId, householdId), eq(members.userId, userId)));
  return membership || null;
}

async function getTargetMember(membership: Membership, householdId: string, targetMemberId?: string): Promise<Membership | null> {
  if (!targetMemberId) return membership;
  const [targetMember] = await db
    .select()
    .from(members)
    .where(and(eq(members.householdId, householdId), eq(members.id, targetMemberId)));
  return targetMember || null;
}

async function getOrCreateWallet(memberId: string, householdId: string): Promise<Wallet> {
  const [wallet] = await db
    .select()
    .from(storeWallets)
    .where(and(eq(storeWallets.memberId, memberId), eq(storeWallets.householdId, householdId)));

  if (wallet) return wallet;

  const [created] = await db
    .insert(storeWallets)
    .values({
      memberId,
      householdId,
      choreCoinsBalance: STARTER_CHORE_COINS,
      lifetimeCoinsPurchased: STARTER_CHORE_COINS,
      lifetimeCoinsSpent: 0,
    })
    .returning();

  return created;
}

async function getOrCreateControls(memberId: string, householdId: string): Promise<PurchaseControl> {
  const [controls] = await db
    .select()
    .from(storePurchaseControls)
    .where(and(eq(storePurchaseControls.memberId, memberId), eq(storePurchaseControls.householdId, householdId)));

  if (controls) return controls;

  const [created] = await db
    .insert(storePurchaseControls)
    .values({
      memberId,
      householdId,
      requireParentApproval: true,
      requirePinForPurchases: false,
      dailyCoinLimit: 5000,
      dailyPointLimit: 2000,
      allowGiftCards: true,
      allowLimitedTimeOffers: true,
    })
    .returning();

  return created;
}

async function getDailySpend(memberId: string): Promise<{ coinsSpent: number; pointsSpent: number }> {
  const [result] = await db
    .select({
      coinsSpent: sql<number>`coalesce(sum(${storePurchases.coinsSpent}), 0)::int`,
      pointsSpent: sql<number>`coalesce(sum(${storePurchases.pointsSpent}), 0)::int`,
    })
    .from(storePurchases)
    .where(
      and(
        eq(storePurchases.memberId, memberId),
        gte(storePurchases.purchasedAt, startOfDay()),
        inArray(storePurchases.status, ['completed', 'refund_requested'])
      )
    );

  return {
    coinsSpent: result?.coinsSpent ?? 0,
    pointsSpent: result?.pointsSpent ?? 0,
  };
}

async function countCompletedPurchasesForItem(memberId: string, itemId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(storePurchases)
    .where(
      and(
        eq(storePurchases.memberId, memberId),
        eq(storePurchases.catalogItemId, itemId),
        inArray(storePurchases.status, ['completed', 'refund_requested'])
      )
    );
  return result?.count ?? 0;
}

async function grantEntitlement(
  tx: DbExecutor,
  householdId: string,
  memberId: string,
  item: CatalogItem,
  quantity: number
): Promise<void> {
  const metadata = (item.metadata as Record<string, unknown> | null) ?? null;
  const itemType = item.itemType as StoreCatalogItemType;
  const entitlementType = resolveEntitlementType(itemType, metadata);
  if (!entitlementType) return;

  const referenceId = String(metadata?.referenceId ?? item.sku);
  const quantityPerPurchase = parseMetadataNumber(metadata, 'quantityPerPurchase', 1);
  const totalQuantity = Math.max(1, quantityPerPurchase * quantity);
  const durationDays = parseMetadataNumber(metadata, 'durationDays', 0);
  const expiresAt = durationDays > 0
    ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
    : null;

  const [existing] = await tx
    .select()
    .from(storeMemberEntitlements)
    .where(
      and(
        eq(storeMemberEntitlements.memberId, memberId),
        eq(storeMemberEntitlements.entitlementType, entitlementType),
        eq(storeMemberEntitlements.referenceId, referenceId)
      )
    );

  if (existing) {
    await tx
      .update(storeMemberEntitlements)
      .set({
        quantity: sql`${storeMemberEntitlements.quantity} + ${totalQuantity}`,
        expiresAt,
        metadata,
        updatedAt: new Date(),
      })
      .where(eq(storeMemberEntitlements.id, existing.id));
    return;
  }

  await tx.insert(storeMemberEntitlements).values({
    householdId,
    memberId,
    entitlementType,
    referenceId,
    quantity: totalQuantity,
    expiresAt,
    metadata,
  });
}

async function spendFunds(
  tx: DbExecutor,
  targetMember: Membership,
  wallet: Wallet,
  pricing: { paymentMethod: StorePaymentMethod; coinsSpent: number; pointsSpent: number }
): Promise<{ walletAfter: number; pointsAfter: number }> {
  let walletAfter = wallet.choreCoinsBalance;
  let pointsAfter = targetMember.pointsCurrent ?? 0;

  if (pricing.paymentMethod === 'coins') {
    if (pricing.coinsSpent > 0) {
      const [updatedWallet] = await tx
        .update(storeWallets)
        .set({
          choreCoinsBalance: sql`${storeWallets.choreCoinsBalance} - ${pricing.coinsSpent}`,
          lifetimeCoinsSpent: sql`${storeWallets.lifetimeCoinsSpent} + ${pricing.coinsSpent}`,
          updatedAt: new Date(),
        })
        .where(and(eq(storeWallets.id, wallet.id), gte(storeWallets.choreCoinsBalance, pricing.coinsSpent)))
        .returning();

      if (!updatedWallet) {
        throw new Error('Not enough ChoreCoins for this purchase.');
      }
      walletAfter = updatedWallet.choreCoinsBalance;
    }
  } else if (pricing.paymentMethod === 'points') {
    if (pricing.pointsSpent > 0) {
      const [updatedMember] = await tx
        .update(members)
        .set({
          pointsCurrent: sql`${members.pointsCurrent} - ${pricing.pointsSpent}`,
          updatedAt: new Date(),
        })
        .where(and(eq(members.id, targetMember.id), gte(members.pointsCurrent, pricing.pointsSpent)))
        .returning();

      if (!updatedMember) {
        throw new Error('Not enough points for this purchase.');
      }
      pointsAfter = updatedMember.pointsCurrent ?? 0;
    }
  }

  return { walletAfter, pointsAfter };
}

async function grantCoins(
  tx: DbExecutor,
  walletId: string,
  coinsGranted: number
): Promise<number> {
  if (coinsGranted <= 0) {
    const [wallet] = await tx.select().from(storeWallets).where(eq(storeWallets.id, walletId));
    return wallet?.choreCoinsBalance ?? 0;
  }

  const [updatedWallet] = await tx
    .update(storeWallets)
    .set({
      choreCoinsBalance: sql`${storeWallets.choreCoinsBalance} + ${coinsGranted}`,
      lifetimeCoinsPurchased: sql`${storeWallets.lifetimeCoinsPurchased} + ${coinsGranted}`,
      updatedAt: new Date(),
    })
    .where(eq(storeWallets.id, walletId))
    .returning();

  return updatedWallet?.choreCoinsBalance ?? 0;
}

async function createPurchaseRecord(
  tx: DbExecutor,
  params: {
    householdId: string;
    memberId: string;
    item: CatalogItem | null;
    quantity: number;
    pricing: { paymentMethod: StorePaymentMethod; coinsSpent: number; pointsSpent: number; coinsGranted: number };
    status: StorePurchaseStatus;
    approvedByMemberId?: string | null;
    approvedAt?: Date | null;
    receiptData?: Record<string, unknown> | null;
  }
): Promise<PurchaseRecord> {
  const [purchase] = await tx
    .insert(storePurchases)
    .values({
      householdId: params.householdId,
      memberId: params.memberId,
      catalogItemId: params.item?.id ?? null,
      purchaseType: params.item ? 'catalog' : 'gift_card',
      paymentMethod: params.pricing.paymentMethod,
      quantity: params.quantity,
      coinsSpent: params.pricing.coinsSpent,
      pointsSpent: params.pricing.pointsSpent,
      coinsGranted: params.pricing.coinsGranted,
      status: params.status,
      receiptNumber: generateReceiptNumber(),
      approvedByMemberId: params.approvedByMemberId ?? null,
      approvedAt: params.approvedAt ?? null,
      receiptData: params.receiptData ?? null,
    })
    .returning();

  return purchase;
}

export async function inAppStoreRoutes(fastify: FastifyInstance) {
  await ensureCatalogSeeded();

  fastify.get('/catalog', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const query = catalogQuerySchema.parse(request.query);

    const membership = await getMembership(user.id, householdId);
    if (!membership) return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });

    const conditions = [];
    if (!query.includeInactive) {
      conditions.push(eq(storeCatalogItems.isActive, true));
    }
    if (query.category) {
      conditions.push(eq(storeCatalogItems.category, query.category));
    }
    if (query.type) {
      conditions.push(eq(storeCatalogItems.itemType, query.type));
    }

    const items = await db
      .select()
      .from(storeCatalogItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(storeCatalogItems.category, storeCatalogItems.title);

    return items;
  });

  fastify.get('/offers', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await getMembership(user.id, householdId);
    if (!membership) return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });

    const now = new Date();
    const offers = await db
      .select()
      .from(storeCatalogItems)
      .where(
        and(
          eq(storeCatalogItems.isActive, true),
          sql`(${storeCatalogItems.salePercent} > 0 OR ${storeCatalogItems.isLimitedTime} = true)`,
          sql`(${storeCatalogItems.availableFrom} IS NULL OR ${storeCatalogItems.availableFrom} <= ${now})`,
          sql`(${storeCatalogItems.availableUntil} IS NULL OR ${storeCatalogItems.availableUntil} >= ${now})`
        )
      )
      .orderBy(desc(storeCatalogItems.salePercent), storeCatalogItems.title);

    return { offers, now };
  });

  fastify.get('/wallet', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await getMembership(user.id, householdId);
    if (!membership) return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });

    const wallet = await getOrCreateWallet(membership.id, householdId);
    return wallet;
  });

  fastify.get('/wallet/:memberId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };

    const membership = await getMembership(user.id, householdId);
    if (!membership) return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });
    if (membership.role !== 'parent' && membership.id !== memberId) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can view other member wallets.' });
    }

    const target = await getTargetMember(membership, householdId, memberId);
    if (!target) return reply.status(404).send({ error: 'Not found', message: 'Member not found.' });

    const wallet = await getOrCreateWallet(target.id, householdId);
    return wallet;
  });

  fastify.get('/entitlements', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await getMembership(user.id, householdId);
    if (!membership) return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });

    const entitlements = await db
      .select()
      .from(storeMemberEntitlements)
      .where(eq(storeMemberEntitlements.memberId, membership.id))
      .orderBy(desc(storeMemberEntitlements.updatedAt));

    return entitlements;
  });

  fastify.post('/purchases', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = createPurchaseSchema.parse(request.body);

    const membership = await getMembership(user.id, householdId);
    if (!membership) return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });

    const targetMember = await getTargetMember(membership, householdId, body.memberId);
    if (!targetMember) return reply.status(404).send({ error: 'Not found', message: 'Member not found.' });
    if (membership.role !== 'parent' && targetMember.id !== membership.id) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Cannot purchase for another member.' });
    }

    const [item] = await db
      .select()
      .from(storeCatalogItems)
      .where(eq(storeCatalogItems.id, body.itemId));
    if (!item) return reply.status(404).send({ error: 'Not found', message: 'Store item not found.' });

    const now = new Date();
    const availability = isItemAvailable(item, now);
    if (!availability.valid) return reply.status(400).send({ error: 'Unavailable', message: availability.reason });

    const controls = await getOrCreateControls(targetMember.id, householdId);
    if (!controls.allowLimitedTimeOffers && (item.isLimitedTime || item.salePercent > 0)) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Limited-time offers are disabled for this member.' });
    }
    if (!controls.allowGiftCards && (item.itemType as StoreCatalogItemType) === 'gift_premium') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Gift purchases are disabled for this member.' });
    }

    if (controls.requirePinForPurchases) {
      const pin = body.parentPin;
      if (!pin || !verifyPin(pin, controls.pinHash ?? null)) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Parent purchase PIN is required.' });
      }
    }

    if (item.maxPurchasesPerMember !== null && item.maxPurchasesPerMember !== undefined) {
      const existingPurchases = await countCompletedPurchasesForItem(targetMember.id, item.id);
      if (existingPurchases + body.quantity > item.maxPurchasesPerMember) {
        return reply.status(400).send({
          error: 'Limit reached',
          message: `This item is limited to ${item.maxPurchasesPerMember} purchase(s) per member.`,
        });
      }
    }

    const pricing = getPricing(item, body.quantity);
    const dailySpend = await getDailySpend(targetMember.id);
    if (dailySpend.coinsSpent + pricing.coinsSpent > controls.dailyCoinLimit) {
      return reply.status(400).send({ error: 'Limit reached', message: 'Daily ChoreCoin spending limit reached.' });
    }
    if (dailySpend.pointsSpent + pricing.pointsSpent > controls.dailyPointLimit) {
      return reply.status(400).send({ error: 'Limit reached', message: 'Daily points spending limit reached.' });
    }

    if (controls.requireParentApproval && membership.role !== 'parent') {
      const pendingPurchase = await db.transaction(async (tx) =>
        createPurchaseRecord(tx, {
          householdId,
          memberId: targetMember.id,
          item,
          quantity: body.quantity,
          pricing,
          status: 'pending_parent_approval',
          receiptData: {
            requestedByMemberId: membership.id,
            itemSnapshot: {
              title: item.title,
              itemType: item.itemType,
              salePercent: item.salePercent,
            },
          },
        })
      );

      return reply.status(202).send({
        pending: true,
        purchase: pendingPurchase,
        message: 'Purchase is pending parent approval.',
      });
    }

    const wallet = await getOrCreateWallet(targetMember.id, householdId);

    const result = await db.transaction(async (tx) => {
      const { walletAfter, pointsAfter } = await spendFunds(tx, targetMember, wallet, pricing);
      const walletAfterGrant = await grantCoins(tx, wallet.id, pricing.coinsGranted);

      await grantEntitlement(tx, householdId, targetMember.id, item, body.quantity);

      let receiptData: Record<string, unknown> | null = null;
      if ((item.itemType as StoreCatalogItemType) === 'gift_premium') {
        const metadata = (item.metadata as Record<string, unknown> | null) ?? {};
        const tier = (metadata.tier === 'family' ? 'family' : 'premium') as 'family' | 'premium';
        const durationMonths = Math.max(1, parseMetadataNumber(metadata, 'durationMonths', 1));
        const giftCode = generateGiftCode();

        await tx.insert(storeGiftCards).values({
          householdId,
          createdByMemberId: membership.id,
          code: giftCode,
          tier,
          durationMonths,
          status: 'active',
          expiresAt: addMonths(new Date(), 3),
        });

        receiptData = { giftCode, tier, durationMonths };
      }

      const purchase = await createPurchaseRecord(tx, {
        householdId,
        memberId: targetMember.id,
        item,
        quantity: body.quantity,
        pricing,
        status: 'completed',
        approvedByMemberId: membership.id,
        approvedAt: new Date(),
        receiptData,
      });

      return {
        purchase,
        walletAfter: pricing.coinsGranted > 0 ? walletAfterGrant : walletAfter,
        pointsAfter,
      };
    });

    return reply.status(201).send(result);
  });

  fastify.post('/purchases/:purchaseId/approve', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, purchaseId } = request.params as { householdId: string; purchaseId: string };
    const body = approvePurchaseSchema.parse(request.body);

    const membership = await getMembership(user.id, householdId);
    if (!membership || membership.role !== 'parent') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can approve purchases.' });
    }

    const [pendingPurchase] = await db
      .select()
      .from(storePurchases)
      .where(
        and(
          eq(storePurchases.householdId, householdId),
          eq(storePurchases.id, purchaseId),
          eq(storePurchases.status, 'pending_parent_approval')
        )
      );

    if (!pendingPurchase) {
      return reply.status(404).send({ error: 'Not found', message: 'Pending purchase not found.' });
    }

    const [targetMember] = await db
      .select()
      .from(members)
      .where(eq(members.id, pendingPurchase.memberId));
    if (!targetMember) return reply.status(404).send({ error: 'Not found', message: 'Member not found.' });

    const controls = await getOrCreateControls(targetMember.id, householdId);
    if (controls.requirePinForPurchases) {
      const pin = body.parentPin;
      if (!pin || !verifyPin(pin, controls.pinHash ?? null)) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Parent purchase PIN is required.' });
      }
    }

    const [item] = pendingPurchase.catalogItemId
      ? await db.select().from(storeCatalogItems).where(eq(storeCatalogItems.id, pendingPurchase.catalogItemId))
      : [];
    if (!item) return reply.status(404).send({ error: 'Not found', message: 'Store item not found.' });

    const wallet = await getOrCreateWallet(targetMember.id, householdId);

    const result = await db.transaction(async (tx) => {
      const pricing = {
        paymentMethod: pendingPurchase.paymentMethod as StorePaymentMethod,
        coinsSpent: pendingPurchase.coinsSpent,
        pointsSpent: pendingPurchase.pointsSpent,
        coinsGranted: pendingPurchase.coinsGranted,
      };

      const { walletAfter, pointsAfter } = await spendFunds(tx, targetMember, wallet, pricing);
      const walletAfterGrant = await grantCoins(tx, wallet.id, pricing.coinsGranted);
      await grantEntitlement(tx, householdId, targetMember.id, item, pendingPurchase.quantity);

      await tx
        .update(storePurchases)
        .set({
          status: 'completed',
          approvedByMemberId: membership.id,
          approvedAt: new Date(),
        })
        .where(eq(storePurchases.id, pendingPurchase.id));

      return {
        purchaseId: pendingPurchase.id,
        walletAfter: pricing.coinsGranted > 0 ? walletAfterGrant : walletAfter,
        pointsAfter,
      };
    });

    return result;
  });

  fastify.post('/purchases/:purchaseId/decline', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, purchaseId } = request.params as { householdId: string; purchaseId: string };

    const membership = await getMembership(user.id, householdId);
    if (!membership || membership.role !== 'parent') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can decline purchases.' });
    }

    const [updated] = await db
      .update(storePurchases)
      .set({
        status: 'declined',
        approvedByMemberId: membership.id,
        approvedAt: new Date(),
      })
      .where(
        and(
          eq(storePurchases.householdId, householdId),
          eq(storePurchases.id, purchaseId),
          eq(storePurchases.status, 'pending_parent_approval')
        )
      )
      .returning();

    if (!updated) {
      return reply.status(404).send({ error: 'Not found', message: 'Pending purchase not found.' });
    }

    return updated;
  });

  fastify.get('/purchases', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await getMembership(user.id, householdId);
    if (!membership) return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });

    const purchases = await db
      .select({
        purchase: storePurchases,
        item: storeCatalogItems,
      })
      .from(storePurchases)
      .leftJoin(storeCatalogItems, eq(storePurchases.catalogItemId, storeCatalogItems.id))
      .where(
        membership.role === 'parent'
          ? eq(storePurchases.householdId, householdId)
          : eq(storePurchases.memberId, membership.id)
      )
      .orderBy(desc(storePurchases.purchasedAt))
      .limit(200);

    return purchases;
  });

  fastify.get('/purchases/:purchaseId/receipt', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, purchaseId } = request.params as { householdId: string; purchaseId: string };

    const membership = await getMembership(user.id, householdId);
    if (!membership) return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });

    const [purchaseRecord] = await db
      .select({
        purchase: storePurchases,
        item: storeCatalogItems,
      })
      .from(storePurchases)
      .leftJoin(storeCatalogItems, eq(storePurchases.catalogItemId, storeCatalogItems.id))
      .where(and(eq(storePurchases.householdId, householdId), eq(storePurchases.id, purchaseId)));

    if (!purchaseRecord) return reply.status(404).send({ error: 'Not found', message: 'Receipt not found.' });
    if (membership.role !== 'parent' && purchaseRecord.purchase.memberId !== membership.id) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Cannot view this receipt.' });
    }

    const wallet = await getOrCreateWallet(purchaseRecord.purchase.memberId, householdId);
    const [member] = await db.select().from(members).where(eq(members.id, purchaseRecord.purchase.memberId));

    return {
      purchase: purchaseRecord.purchase,
      item: purchaseRecord.item,
      walletAfterPurchase: wallet.choreCoinsBalance,
      pointsAfterPurchase: member?.pointsCurrent ?? 0,
    };
  });

  fastify.post('/purchases/:purchaseId/refund-request', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, purchaseId } = request.params as { householdId: string; purchaseId: string };
    const body = createRefundRequestSchema.parse(request.body);

    const membership = await getMembership(user.id, householdId);
    if (!membership) return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });

    const [purchase] = await db
      .select()
      .from(storePurchases)
      .where(and(eq(storePurchases.householdId, householdId), eq(storePurchases.id, purchaseId)));
    if (!purchase) return reply.status(404).send({ error: 'Not found', message: 'Purchase not found.' });
    if (membership.role !== 'parent' && purchase.memberId !== membership.id) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Cannot request refund for this purchase.' });
    }
    if (purchase.status !== 'completed') {
      return reply.status(400).send({ error: 'Invalid state', message: 'Only completed purchases can be refunded.' });
    }

    const [refund] = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(storeRefundRequests)
        .values({
          purchaseId: purchase.id,
          householdId,
          memberId: membership.id,
          reason: body.reason,
          details: body.details ?? null,
          status: 'pending',
        })
        .returning();

      await tx
        .update(storePurchases)
        .set({ status: 'refund_requested' })
        .where(eq(storePurchases.id, purchase.id));

      return [created];
    });

    return reply.status(201).send(refund);
  });

  fastify.get('/refunds', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await getMembership(user.id, householdId);
    if (!membership || membership.role !== 'parent') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can manage refunds.' });
    }

    const requests = await db
      .select({
        refund: storeRefundRequests,
        purchase: storePurchases,
        item: storeCatalogItems,
      })
      .from(storeRefundRequests)
      .innerJoin(storePurchases, eq(storeRefundRequests.purchaseId, storePurchases.id))
      .leftJoin(storeCatalogItems, eq(storePurchases.catalogItemId, storeCatalogItems.id))
      .where(eq(storeRefundRequests.householdId, householdId))
      .orderBy(desc(storeRefundRequests.requestedAt));

    return requests;
  });

  fastify.post('/refunds/:refundId/resolve', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, refundId } = request.params as { householdId: string; refundId: string };
    const body = resolveRefundSchema.parse(request.body);

    const membership = await getMembership(user.id, householdId);
    if (!membership || membership.role !== 'parent') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can resolve refunds.' });
    }

    const [refundRecord] = await db
      .select()
      .from(storeRefundRequests)
      .where(and(eq(storeRefundRequests.householdId, householdId), eq(storeRefundRequests.id, refundId)));

    if (!refundRecord) return reply.status(404).send({ error: 'Not found', message: 'Refund request not found.' });
    if (refundRecord.status !== 'pending') {
      return reply.status(400).send({ error: 'Invalid state', message: 'Refund request is already resolved.' });
    }

    const [purchase] = await db
      .select()
      .from(storePurchases)
      .where(eq(storePurchases.id, refundRecord.purchaseId));
    if (!purchase) return reply.status(404).send({ error: 'Not found', message: 'Purchase not found.' });

    const outcome = await db.transaction(async (tx) => {
      if (body.decision === 'approve') {
        const wallet = await getOrCreateWallet(purchase.memberId, householdId);

        if (purchase.coinsSpent > 0) {
          await tx
            .update(storeWallets)
            .set({
              choreCoinsBalance: sql`${storeWallets.choreCoinsBalance} + ${purchase.coinsSpent}`,
              lifetimeCoinsSpent: sql`greatest(0, ${storeWallets.lifetimeCoinsSpent} - ${purchase.coinsSpent})`,
              updatedAt: new Date(),
            })
            .where(eq(storeWallets.id, wallet.id));
        }

        if (purchase.pointsSpent > 0) {
          await tx
            .update(members)
            .set({
              pointsCurrent: sql`${members.pointsCurrent} + ${purchase.pointsSpent}`,
              updatedAt: new Date(),
            })
            .where(eq(members.id, purchase.memberId));
        }

        if (purchase.coinsGranted > 0) {
          await tx
            .update(storeWallets)
            .set({
              choreCoinsBalance: sql`greatest(0, ${storeWallets.choreCoinsBalance} - ${purchase.coinsGranted})`,
              lifetimeCoinsPurchased: sql`greatest(0, ${storeWallets.lifetimeCoinsPurchased} - ${purchase.coinsGranted})`,
              updatedAt: new Date(),
            })
            .where(eq(storeWallets.id, wallet.id));
        }

        await tx
          .update(storePurchases)
          .set({
            status: 'refunded',
            refundedAt: new Date(),
          })
          .where(eq(storePurchases.id, purchase.id));

        await tx
          .update(storeRefundRequests)
          .set({
            status: 'approved',
            resolvedAt: new Date(),
            resolvedByMemberId: membership.id,
            resolutionNote: body.note ?? null,
          })
          .where(eq(storeRefundRequests.id, refundId));

        return { approved: true };
      }

      await tx
        .update(storePurchases)
        .set({ status: 'completed' })
        .where(eq(storePurchases.id, purchase.id));

      await tx
        .update(storeRefundRequests)
        .set({
          status: 'rejected',
          resolvedAt: new Date(),
          resolvedByMemberId: membership.id,
          resolutionNote: body.note ?? null,
        })
        .where(eq(storeRefundRequests.id, refundId));

      return { approved: false };
    });

    return outcome;
  });

  fastify.get('/controls', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await getMembership(user.id, householdId);
    if (!membership) return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });

    const controls = await getOrCreateControls(membership.id, householdId);
    return controls;
  });

  fastify.get('/controls/:memberId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };

    const membership = await getMembership(user.id, householdId);
    if (!membership || membership.role !== 'parent') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can view member controls.' });
    }

    const target = await getTargetMember(membership, householdId, memberId);
    if (!target) return reply.status(404).send({ error: 'Not found', message: 'Member not found.' });

    const controls = await getOrCreateControls(target.id, householdId);
    return controls;
  });

  fastify.put('/controls/:memberId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };
    const body = updateControlsSchema.parse(request.body);

    const membership = await getMembership(user.id, householdId);
    if (!membership || membership.role !== 'parent') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can update member controls.' });
    }

    const target = await getTargetMember(membership, householdId, memberId);
    if (!target) return reply.status(404).send({ error: 'Not found', message: 'Member not found.' });

    const existing = await getOrCreateControls(target.id, householdId);
    const nextPinHash = body.parentPin === null
      ? null
      : body.parentPin
        ? hashPin(body.parentPin)
        : existing.pinHash;

    const [updated] = await db
      .update(storePurchaseControls)
      .set({
        requireParentApproval: body.requireParentApproval ?? existing.requireParentApproval,
        requirePinForPurchases: body.requirePinForPurchases ?? existing.requirePinForPurchases,
        pinHash: nextPinHash,
        dailyCoinLimit: body.dailyCoinLimit ?? existing.dailyCoinLimit,
        dailyPointLimit: body.dailyPointLimit ?? existing.dailyPointLimit,
        allowGiftCards: body.allowGiftCards ?? existing.allowGiftCards,
        allowLimitedTimeOffers: body.allowLimitedTimeOffers ?? existing.allowLimitedTimeOffers,
        updatedAt: new Date(),
      })
      .where(eq(storePurchaseControls.id, existing.id))
      .returning();

    return updated;
  });

  fastify.post('/gift-cards', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = createGiftCardSchema.parse(request.body);

    const membership = await getMembership(user.id, householdId);
    if (!membership || membership.role !== 'parent') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can create gift cards.' });
    }

    const controls = await getOrCreateControls(membership.id, householdId);
    if (!controls.allowGiftCards) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Gift cards are disabled by parental controls.' });
    }
    if (controls.requirePinForPurchases) {
      if (!body.parentPin || !verifyPin(body.parentPin, controls.pinHash ?? null)) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Parent purchase PIN is required.' });
      }
    }

    const wallet = await getOrCreateWallet(membership.id, householdId);
    const coinCost = GIFT_CARD_COIN_COST_BY_TIER[body.tier] * body.durationMonths;

    const result = await db.transaction(async (tx) => {
      const [walletUpdated] = await tx
        .update(storeWallets)
        .set({
          choreCoinsBalance: sql`${storeWallets.choreCoinsBalance} - ${coinCost}`,
          lifetimeCoinsSpent: sql`${storeWallets.lifetimeCoinsSpent} + ${coinCost}`,
          updatedAt: new Date(),
        })
        .where(and(eq(storeWallets.id, wallet.id), gte(storeWallets.choreCoinsBalance, coinCost)))
        .returning();

      if (!walletUpdated) {
        throw new Error('Not enough ChoreCoins to create this gift card.');
      }

      const [giftCard] = await tx
        .insert(storeGiftCards)
        .values({
          householdId,
          createdByMemberId: membership.id,
          code: generateGiftCode(),
          tier: body.tier,
          durationMonths: body.durationMonths,
          recipientEmail: body.recipientEmail ?? null,
          message: body.message ?? null,
          status: 'active',
          expiresAt: new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000),
        })
        .returning();

      const purchase = await createPurchaseRecord(tx, {
        householdId,
        memberId: membership.id,
        item: null,
        quantity: 1,
        pricing: {
          paymentMethod: 'coins',
          coinsSpent: coinCost,
          pointsSpent: 0,
          coinsGranted: 0,
        },
        status: 'completed',
        approvedByMemberId: membership.id,
        approvedAt: new Date(),
        receiptData: {
          giftCardId: giftCard.id,
          code: giftCard.code,
          tier: giftCard.tier,
          durationMonths: giftCard.durationMonths,
        },
      });

      return { giftCard, purchase, wallet: walletUpdated };
    });

    return reply.status(201).send(result);
  });

  fastify.get('/gift-cards', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await getMembership(user.id, householdId);
    if (!membership || membership.role !== 'parent') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can view gift cards.' });
    }

    const cards = await db
      .select()
      .from(storeGiftCards)
      .where(eq(storeGiftCards.householdId, householdId))
      .orderBy(desc(storeGiftCards.createdAt));

    return cards;
  });

  fastify.post('/gift-cards/redeem', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = redeemGiftCardSchema.parse(request.body);

    const membership = await getMembership(user.id, householdId);
    if (!membership || membership.role !== 'parent') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can redeem gift cards.' });
    }

    const code = body.code.toUpperCase();
    const [giftCard] = await db
      .select()
      .from(storeGiftCards)
      .where(and(eq(storeGiftCards.code, code), eq(storeGiftCards.status, 'active')));

    if (!giftCard) return reply.status(404).send({ error: 'Not found', message: 'Gift card not found.' });
    if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
      return reply.status(400).send({ error: 'Expired', message: 'Gift card has expired.' });
    }

    const [household] = await db.select().from(households).where(eq(households.id, householdId));
    if (!household) return reply.status(404).send({ error: 'Not found', message: 'Household not found.' });

    const now = new Date();
    const periodEnd = addMonths(now, giftCard.durationMonths);
    const memberLimit = getMemberLimitForTier(giftCard.tier as 'family' | 'premium');

    await db.transaction(async (tx) => {
      await tx
        .update(storeGiftCards)
        .set({
          status: 'redeemed',
          redeemedByMemberId: membership.id,
          redeemedAt: now,
        })
        .where(eq(storeGiftCards.id, giftCard.id));

      await tx
        .update(households)
        .set({
          subscriptionTier: giftCard.tier,
          subscriptionStatus: 'active',
          subscriptionProvider: 'stripe',
          subscriptionStore: 'web',
          subscriptionBillingInterval: null,
          subscriptionCurrentPeriodStart: now,
          subscriptionCurrentPeriodEnd: periodEnd,
          subscriptionExpiresAt: periodEnd,
          subscriptionTrialEndsAt: null,
          subscriptionGracePeriodEndsAt: null,
          subscriptionCancelAtPeriodEnd: false,
          subscriptionCanceledAt: null,
          subscriptionMemberLimit: memberLimit,
          updatedAt: now,
        })
        .where(eq(households.id, householdId));
    });

    return {
      success: true,
      subscription: {
        tier: giftCard.tier,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    };
  });
}
