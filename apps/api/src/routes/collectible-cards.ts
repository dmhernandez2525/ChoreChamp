import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../lib/db';
import {
  cardSets,
  cards,
  cardPacks,
  ownedCards,
  packOpenings,
  cardTrades,
  cardWishlists,
  cardShowcases,
  setCompletions,
  members,
} from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import {
  PACK_CONFIG,
  openPack,
  getHighestRarity,
  calculateCollectionStats,
  calculateSetProgress,
  validateTradeOffer,
  calculateDuplicateValue,
  getRarityInfo,
  getCardCategoryInfo,
} from '@chorechamp/gamification';
import type { CardRarity, RarityWeights, TradeCard, PackOpenResult } from '@chorechamp/types';
import { verifyMembership } from '../lib/membership';

// Validation schemas
const openPackSchema = z.object({
  packId: z.string(),
  quantity: z.number().int().min(1).max(10).optional().default(1),
});

const createTradeSchema = z.object({
  targetMemberId: z.string().uuid(),
  offeredCards: z.array(z.object({
    cardId: z.string(),
    quantity: z.number().int().min(1),
  })).min(1).max(10),
  requestedCards: z.array(z.object({
    cardId: z.string(),
    quantity: z.number().int().min(1),
  })).min(1).max(10),
  message: z.string().max(500).optional(),
});

const respondTradeSchema = z.object({
  action: z.enum(['accept', 'decline']),
});

const updateShowcaseSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  cardIds: z.array(z.string()).max(6).optional(),
  layout: z.enum(['grid', 'row', 'featured']).optional(),
  isPublic: z.boolean().optional(),
});

const wishlistSchema = z.object({
  cardId: z.string(),
  priority: z.number().int().min(1).max(10).optional().default(5),
});

// Helper functions
async function getMemberOwnedCards(memberId: string): Promise<Map<string, number>> {
  const owned = await db
    .select()
    .from(ownedCards)
    .where(eq(ownedCards.memberId, memberId));

  return new Map(owned.map(o => [o.cardId, o.quantity]));
}

export async function collectibleCardsRoutes(fastify: FastifyInstance) {
  // Get all card sets
  fastify.get('/cards/sets', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const sets = await db
      .select()
      .from(cardSets)
      .where(eq(cardSets.isActive, true))
      .orderBy(cardSets.releaseDate);

    // Get completion status for each set
    const completions = await db
      .select()
      .from(setCompletions)
      .where(eq(setCompletions.memberId, membership.id));

    const completionMap = new Map(completions.map(c => [c.setId, c]));

    // Get owned card counts per set
    const owned = await db
      .select({
        setId: cards.setId,
        count: sql<number>`count(distinct ${ownedCards.cardId})::int`,
      })
      .from(ownedCards)
      .innerJoin(cards, eq(ownedCards.cardId, cards.id))
      .where(eq(ownedCards.memberId, membership.id))
      .groupBy(cards.setId);

    const ownedCountMap = new Map(owned.map(o => [o.setId, o.count]));

    const setsWithProgress = sets.map(set => ({
      ...set,
      cardsOwned: ownedCountMap.get(set.id) || 0,
      isComplete: completionMap.has(set.id),
      bonusClaimed: completionMap.get(set.id)?.bonusClaimed || false,
    }));

    return reply.send(setsWithProgress);
  });

  // Get all cards in a set with ownership status
  fastify.get('/cards/sets/:setId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, setId } = request.params as { householdId: string; setId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get set
    const [set] = await db
      .select()
      .from(cardSets)
      .where(eq(cardSets.id, setId));

    if (!set) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Card set not found',
      });
    }

    // Get all cards in set
    const setCards = await db
      .select()
      .from(cards)
      .where(and(
        eq(cards.setId, setId),
        eq(cards.isActive, true)
      ))
      .orderBy(cards.setNumber);

    // Get owned cards
    const owned = await db
      .select()
      .from(ownedCards)
      .where(and(
        eq(ownedCards.memberId, membership.id),
        inArray(ownedCards.cardId, setCards.map(c => c.id))
      ));

    const ownedMap = new Map(owned.map(o => [o.cardId, o]));
    const ownedCardIds = new Set(owned.map(o => o.cardId));

    // Calculate progress
    const progress = calculateSetProgress(set.id, set.name, setCards as Parameters<typeof calculateSetProgress>[2], ownedCardIds);

    const cardsWithOwnership = setCards.map(card => ({
      ...card,
      rarityInfo: getRarityInfo(card.rarity as CardRarity),
      isOwned: ownedMap.has(card.id),
      quantity: ownedMap.get(card.id)?.quantity || 0,
      isFavorite: ownedMap.get(card.id)?.isFavorite || false,
      isNew: ownedMap.get(card.id)?.isNew || false,
    }));

    return reply.send({
      set,
      cards: cardsWithOwnership,
      progress,
    });
  });

  // Get member's collection
  fastify.get('/cards/collection', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const { category, rarity, setId, favorites } = request.query as {
      category?: string;
      rarity?: string;
      setId?: string;
      favorites?: string;
    };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Build query for owned cards
    const conditions = [eq(ownedCards.memberId, membership.id)];

    if (favorites === 'true') {
      conditions.push(eq(ownedCards.isFavorite, true));
    }

    const owned = await db
      .select({
        owned: ownedCards,
        card: cards,
      })
      .from(ownedCards)
      .innerJoin(cards, eq(ownedCards.cardId, cards.id))
      .where(and(...conditions))
      .orderBy(desc(ownedCards.lastObtainedAt));

    // Filter by card properties
    let filtered = owned;
    if (category) {
      filtered = filtered.filter(o => o.card.category === category);
    }
    if (rarity) {
      filtered = filtered.filter(o => o.card.rarity === rarity);
    }
    if (setId) {
      filtered = filtered.filter(o => o.card.setId === setId);
    }

    // Get all cards for stats
    const allCards = await db.select().from(cards).where(eq(cards.isActive, true));

    // Get pack openings count
    const [packStats] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(packOpenings)
      .where(eq(packOpenings.memberId, membership.id));

    const stats = calculateCollectionStats(
      owned.map(o => ({
        cardId: o.owned.cardId,
        quantity: o.owned.quantity,
        isFavorite: o.owned.isFavorite ?? false,
      })),
      allCards as Parameters<typeof calculateCollectionStats>[1],
      packStats?.count || 0
    );

    return reply.send({
      cards: filtered.map(o => ({
        ...o.card,
        rarityInfo: getRarityInfo(o.card.rarity as CardRarity),
        categoryInfo: getCardCategoryInfo(o.card.category as Parameters<typeof getCardCategoryInfo>[0]),
        quantity: o.owned.quantity,
        isFavorite: o.owned.isFavorite,
        isNew: o.owned.isNew,
        firstObtainedAt: o.owned.firstObtainedAt,
        lastObtainedAt: o.owned.lastObtainedAt,
      })),
      stats,
    });
  });

  // Get available card packs
  fastify.get('/cards/packs', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const now = new Date();

    // Get active packs
    const packs = await db
      .select()
      .from(cardPacks)
      .where(and(
        eq(cardPacks.isActive, true),
        sql`(${cardPacks.availableFrom} IS NULL OR ${cardPacks.availableFrom} <= ${now})`,
        sql`(${cardPacks.availableUntil} IS NULL OR ${cardPacks.availableUntil} >= ${now})`
      ))
      .orderBy(cardPacks.sortOrder);

    // Get member's points
    const canAfford = packs.map(pack => ({
      ...pack,
      canAfford: (membership.pointsCurrent || 0) >= pack.pointCost,
    }));

    return reply.send(canAfford);
  });

  // Open a card pack
  fastify.post('/cards/packs/:packId/open', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, packId } = request.params as { householdId: string; packId: string };
    const body = openPackSchema.parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get pack
    const [pack] = await db
      .select()
      .from(cardPacks)
      .where(eq(cardPacks.id, packId));

    if (!pack) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Pack not found',
      });
    }

    // Check availability
    const now = new Date();
    if (pack.availableFrom && pack.availableFrom > now) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Pack is not yet available',
      });
    }
    if (pack.availableUntil && pack.availableUntil < now) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Pack is no longer available',
      });
    }

    // Check if member can afford
    const totalCost = pack.pointCost * body.quantity;
    if ((membership.pointsCurrent || 0) < totalCost) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Not enough points to purchase pack(s)',
      });
    }

    // Get available cards
    const availableCards = await db
      .select()
      .from(cards)
      .where(eq(cards.isActive, true));

    // Get owned card IDs
    const owned = await db
      .select()
      .from(ownedCards)
      .where(eq(ownedCards.memberId, membership.id));

    const ownedCardIds = new Set(owned.map(o => o.cardId));

    // Open packs atomically (cards + points deduction)
    const results: PackOpenResult[] = [];
    for (let i = 0; i < body.quantity; i++) {
      results.push(openPack(
        pack.id,
        pack.name,
        pack.cardCount,
        pack.rarityWeights as RarityWeights,
        pack.guaranteedRarity as CardRarity | null,
        availableCards as Parameters<typeof openPack>[5],
        ownedCardIds
      ));
    }

    await db.transaction(async (tx) => {
      for (const result of results) {
        // Update owned cards
        for (const packCard of result.cards) {
          const existingOwned = owned.find(o => o.cardId === packCard.card.id);

          if (existingOwned) {
            await tx
              .update(ownedCards)
              .set({
                quantity: sql`${ownedCards.quantity} + 1`,
                lastObtainedAt: new Date(),
              })
              .where(eq(ownedCards.id, existingOwned.id));
          } else {
            await tx.insert(ownedCards).values({
              cardId: packCard.card.id,
              memberId: membership.id,
              householdId,
              quantity: 1,
              isFavorite: false,
              isNew: true,
            });
          }
        }

        // Record pack opening
        await tx.insert(packOpenings).values({
          packId: pack.id,
          memberId: membership.id,
          householdId,
          pointsSpent: pack.pointCost,
          cardsReceived: result.cards.map(c => c.card.id),
          newCardsCount: result.newCards,
          duplicateCardsCount: result.duplicateCards,
          highestRarity: getHighestRarity(result.cards.map(c => ({ rarity: c.card.rarity as CardRarity }))),
        });
      }

      // Deduct points
      await tx
        .update(members)
        .set({
          pointsCurrent: sql`${members.pointsCurrent} - ${totalCost}`,
        })
        .where(eq(members.id, membership.id));
    });

    // Emit pack opened event
    const io = fastify.io;
    if (io) {
      io.to(`household:${householdId}`).emit('cards:pack-opened', {
        memberId: membership.id,
        memberName: membership.name,
        packName: pack.name,
        quantity: body.quantity,
        highestRarity: getHighestRarity(
          results.flatMap(r => r.cards.map(c => ({ rarity: c.card.rarity as CardRarity })))
        ),
      });
    }

    return reply.send({
      results,
      pointsSpent: totalCost,
    });
  });

  // Toggle card favorite
  fastify.post('/cards/:cardId/favorite', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, cardId } = request.params as { householdId: string; cardId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get owned card
    const [owned] = await db
      .select()
      .from(ownedCards)
      .where(and(
        eq(ownedCards.memberId, membership.id),
        eq(ownedCards.cardId, cardId)
      ));

    if (!owned) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Card not in collection',
      });
    }

    // Toggle favorite
    const [updated] = await db
      .update(ownedCards)
      .set({ isFavorite: !owned.isFavorite })
      .where(eq(ownedCards.id, owned.id))
      .returning();

    return reply.send(updated);
  });

  // Mark card as viewed (not new)
  fastify.post('/cards/:cardId/view', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, cardId } = request.params as { householdId: string; cardId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    await db
      .update(ownedCards)
      .set({ isNew: false })
      .where(and(
        eq(ownedCards.memberId, membership.id),
        eq(ownedCards.cardId, cardId)
      ));

    return reply.send({ success: true });
  });

  // Create trade offer
  fastify.post('/cards/trades', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = createTradeSchema.parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Verify target member
    const [targetMember] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.id, body.targetMemberId),
        eq(members.householdId, householdId)
      ));

    if (!targetMember) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Target member not found',
      });
    }

    // Get owned cards for both members
    const initiatorOwned = await getMemberOwnedCards(membership.id);
    const targetOwned = await getMemberOwnedCards(body.targetMemberId);

    // Validate trade
    const validation = validateTradeOffer(
      body.offeredCards as TradeCard[],
      body.requestedCards as TradeCard[],
      initiatorOwned,
      targetOwned
    );

    if (!validation.valid) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: validation.error,
      });
    }

    // Create trade
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + PACK_CONFIG.tradeExpirationHours);

    const [trade] = await db
      .insert(cardTrades)
      .values({
        householdId,
        initiatorMemberId: membership.id,
        targetMemberId: body.targetMemberId,
        offeredCards: body.offeredCards,
        requestedCards: body.requestedCards,
        message: body.message,
        expiresAt,
      })
      .returning();

    // Emit trade created event
    const io = fastify.io;
    if (io) {
      io.to(`member:${body.targetMemberId}`).emit('cards:trade-received', {
        tradeId: trade.id,
        fromMemberId: membership.id,
        fromMemberName: membership.name,
      });
    }

    return reply.status(201).send(trade);
  });

  // Get trades
  fastify.get('/cards/trades', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const { status, type } = request.query as { status?: string; type?: 'incoming' | 'outgoing' };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const conditions = [eq(cardTrades.householdId, householdId)];

    if (type === 'incoming') {
      conditions.push(eq(cardTrades.targetMemberId, membership.id));
    } else if (type === 'outgoing') {
      conditions.push(eq(cardTrades.initiatorMemberId, membership.id));
    } else {
      conditions.push(sql`(${cardTrades.initiatorMemberId} = ${membership.id} OR ${cardTrades.targetMemberId} = ${membership.id})`);
    }

    if (status) {
      conditions.push(eq(cardTrades.status, status));
    }

    const trades = await db
      .select({
        trade: cardTrades,
        initiator: members,
      })
      .from(cardTrades)
      .innerJoin(members, eq(cardTrades.initiatorMemberId, members.id))
      .where(and(...conditions))
      .orderBy(desc(cardTrades.createdAt));

    // Get target member info
    const tradesWithTarget = await Promise.all(trades.map(async (t) => {
      const [target] = await db
        .select()
        .from(members)
        .where(eq(members.id, t.trade.targetMemberId));

      return {
        ...t.trade,
        initiator: {
          id: t.initiator.id,
          name: t.initiator.name,
          color: t.initiator.color,
        },
        target: {
          id: target.id,
          name: target.name,
          color: target.color,
        },
        isIncoming: t.trade.targetMemberId === membership.id,
      };
    }));

    return reply.send(tradesWithTarget);
  });

  // Respond to trade
  fastify.post('/cards/trades/:tradeId/respond', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, tradeId } = request.params as { householdId: string; tradeId: string };
    const body = respondTradeSchema.parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get trade
    const [trade] = await db
      .select()
      .from(cardTrades)
      .where(and(
        eq(cardTrades.id, tradeId),
        eq(cardTrades.householdId, householdId)
      ));

    if (!trade) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Trade not found',
      });
    }

    if (trade.targetMemberId !== membership.id) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not the target of this trade',
      });
    }

    if (trade.status !== 'pending') {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Trade is no longer pending',
      });
    }

    if (trade.expiresAt < new Date()) {
      await db
        .update(cardTrades)
        .set({ status: 'expired' })
        .where(eq(cardTrades.id, tradeId));

      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Trade has expired',
      });
    }

    if (body.action === 'decline') {
      const [updated] = await db
        .update(cardTrades)
        .set({
          status: 'declined',
          respondedAt: new Date(),
        })
        .where(eq(cardTrades.id, tradeId))
        .returning();

      return reply.send(updated);
    }

    // Accept trade - transfer cards atomically
    const offeredCards = trade.offeredCards as TradeCard[];
    const requestedCards = trade.requestedCards as TradeCard[];

    const updated = await db.transaction(async (tx) => {
      // Update initiator's cards (remove offered, add requested)
      for (const { cardId, quantity } of offeredCards) {
        await tx
          .update(ownedCards)
          .set({ quantity: sql`${ownedCards.quantity} - ${quantity}` })
          .where(and(
            eq(ownedCards.memberId, trade.initiatorMemberId),
            eq(ownedCards.cardId, cardId)
          ));
      }

      for (const { cardId, quantity } of requestedCards) {
        const [existing] = await tx
          .select()
          .from(ownedCards)
          .where(and(
            eq(ownedCards.memberId, trade.initiatorMemberId),
            eq(ownedCards.cardId, cardId)
          ));

        if (existing) {
          await tx
            .update(ownedCards)
            .set({
              quantity: sql`${ownedCards.quantity} + ${quantity}`,
              lastObtainedAt: new Date(),
            })
            .where(eq(ownedCards.id, existing.id));
        } else {
          await tx.insert(ownedCards).values({
            cardId,
            memberId: trade.initiatorMemberId,
            householdId,
            quantity,
            isFavorite: false,
            isNew: true,
          });
        }
      }

      // Update target's cards (add offered, remove requested)
      for (const { cardId, quantity } of offeredCards) {
        const [existing] = await tx
          .select()
          .from(ownedCards)
          .where(and(
            eq(ownedCards.memberId, membership.id),
            eq(ownedCards.cardId, cardId)
          ));

        if (existing) {
          await tx
            .update(ownedCards)
            .set({
              quantity: sql`${ownedCards.quantity} + ${quantity}`,
              lastObtainedAt: new Date(),
            })
            .where(eq(ownedCards.id, existing.id));
        } else {
          await tx.insert(ownedCards).values({
            cardId,
            memberId: membership.id,
            householdId,
            quantity,
            isFavorite: false,
            isNew: true,
          });
        }
      }

      for (const { cardId, quantity } of requestedCards) {
        await tx
          .update(ownedCards)
          .set({ quantity: sql`${ownedCards.quantity} - ${quantity}` })
          .where(and(
            eq(ownedCards.memberId, membership.id),
            eq(ownedCards.cardId, cardId)
          ));
      }

      // Update trade status
      const [result] = await tx
        .update(cardTrades)
        .set({
          status: 'accepted',
          respondedAt: new Date(),
        })
        .where(eq(cardTrades.id, tradeId))
        .returning();

      return result;
    });

    // Emit trade completed event
    const io = fastify.io;
    if (io) {
      io.to(`member:${trade.initiatorMemberId}`).emit('cards:trade-completed', {
        tradeId,
        accepted: true,
      });
    }

    return reply.send(updated);
  });

  // Get/Update showcase
  fastify.get('/cards/showcase', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    let [showcase] = await db
      .select()
      .from(cardShowcases)
      .where(eq(cardShowcases.memberId, membership.id));

    if (!showcase) {
      [showcase] = await db
        .insert(cardShowcases)
        .values({
          memberId: membership.id,
          title: 'My Collection',
          cardIds: [],
          layout: 'grid',
          isPublic: true,
        })
        .returning();
    }

    // Get card details
    const cardDetails = showcase.cardIds && showcase.cardIds.length > 0
      ? await db
          .select()
          .from(cards)
          .where(inArray(cards.id, showcase.cardIds))
      : [];

    return reply.send({
      ...showcase,
      cards: cardDetails.map(c => ({
        ...c,
        rarityInfo: getRarityInfo(c.rarity as CardRarity),
      })),
    });
  });

  fastify.put('/cards/showcase', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = updateShowcaseSchema.parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Verify all cards are owned if updating cardIds
    if (body.cardIds) {
      const owned = await db
        .select()
        .from(ownedCards)
        .where(and(
          eq(ownedCards.memberId, membership.id),
          inArray(ownedCards.cardId, body.cardIds)
        ));

      if (owned.length !== body.cardIds.length) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'You can only showcase cards you own',
        });
      }
    }

    const [updated] = await db
      .update(cardShowcases)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(cardShowcases.memberId, membership.id))
      .returning();

    return reply.send(updated);
  });

  // Wishlist
  fastify.get('/cards/wishlist', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const wishlist = await db
      .select({
        wishlist: cardWishlists,
        card: cards,
      })
      .from(cardWishlists)
      .innerJoin(cards, eq(cardWishlists.cardId, cards.id))
      .where(eq(cardWishlists.memberId, membership.id))
      .orderBy(cardWishlists.priority);

    return reply.send(wishlist.map(w => ({
      ...w.wishlist,
      card: {
        ...w.card,
        rarityInfo: getRarityInfo(w.card.rarity as CardRarity),
      },
    })));
  });

  fastify.post('/cards/wishlist', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = wishlistSchema.parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Verify card exists
    const [card] = await db
      .select()
      .from(cards)
      .where(eq(cards.id, body.cardId));

    if (!card) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Card not found',
      });
    }

    // Check if already owned
    const [owned] = await db
      .select()
      .from(ownedCards)
      .where(and(
        eq(ownedCards.memberId, membership.id),
        eq(ownedCards.cardId, body.cardId)
      ));

    if (owned) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'You already own this card',
      });
    }

    const [wishlistEntry] = await db
      .insert(cardWishlists)
      .values({
        memberId: membership.id,
        cardId: body.cardId,
        priority: body.priority,
      })
      .onConflictDoUpdate({
        target: [cardWishlists.memberId, cardWishlists.cardId],
        set: { priority: body.priority },
      })
      .returning();

    return reply.status(201).send(wishlistEntry);
  });

  fastify.delete('/cards/wishlist/:cardId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, cardId } = request.params as { householdId: string; cardId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    await db
      .delete(cardWishlists)
      .where(and(
        eq(cardWishlists.memberId, membership.id),
        eq(cardWishlists.cardId, cardId)
      ));

    return reply.send({ success: true });
  });

  // Convert duplicates to points
  fastify.post('/cards/:cardId/convert', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, cardId } = request.params as { householdId: string; cardId: string };
    const { quantity } = z.object({ quantity: z.number().int().min(1) }).parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get owned card
    const [owned] = await db
      .select()
      .from(ownedCards)
      .where(and(
        eq(ownedCards.memberId, membership.id),
        eq(ownedCards.cardId, cardId)
      ));

    if (!owned) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Card not in collection',
      });
    }

    if (owned.quantity <= quantity) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Must keep at least one copy of each card',
      });
    }

    // Get card details
    const [card] = await db
      .select()
      .from(cards)
      .where(eq(cards.id, cardId));

    const pointsEarned = calculateDuplicateValue(card as Parameters<typeof calculateDuplicateValue>[0], quantity);

    // Update owned card quantity
    await db
      .update(ownedCards)
      .set({ quantity: sql`${ownedCards.quantity} - ${quantity}` })
      .where(eq(ownedCards.id, owned.id));

    // Add points to member
    await db
      .update(members)
      .set({
        pointsCurrent: sql`${members.pointsCurrent} + ${pointsEarned}`,
        pointsLifetime: sql`${members.pointsLifetime} + ${pointsEarned}`,
      })
      .where(eq(members.id, membership.id));

    return reply.send({
      pointsEarned,
      cardsConverted: quantity,
      remainingQuantity: owned.quantity - quantity,
    });
  });
}
