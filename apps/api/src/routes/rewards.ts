import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, eq, sql, desc, count } from 'drizzle-orm';
import { db } from '../lib/db';
import {
  rewards,
  rewardRedemptions,
  members,
  pointTransactions,
  households,
} from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { getEffectiveTierForHousehold, isTierAtLeast } from '../lib/subscription';
import type { RewardType, RedemptionStatus } from '@chorechamp/types';

const createRewardSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  type: z.enum(['screen_time', 'money', 'privilege', 'activity', 'custom']).optional(),
  pointCost: z.number().int().min(1),
  quantity: z.number().int().min(1).nullable().optional(),
  availableFrom: z.string().datetime().optional(),
  availableUntil: z.string().datetime().optional(),
});

const updateRewardSchema = createRewardSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const redeemRewardSchema = z.object({
  memberId: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

const rejectSchema = z.object({
  reason: z.string().min(1).max(500),
});

const MAX_FREE_REWARDS = 5;

async function getMembership(userId: string, householdId: string) {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(eq(members.householdId, householdId), eq(members.userId, userId)));
  return membership || null;
}

function isParent(member: typeof members.$inferSelect | null): boolean {
  return member?.role === 'parent';
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function rewardRoutes(fastify: FastifyInstance) {
  // List rewards
  fastify.get('/rewards', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await getMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const rewardList = await db
      .select()
      .from(rewards)
      .where(eq(rewards.householdId, householdId))
      .orderBy(desc(rewards.createdAt));

    return rewardList;
  });

  // Get reward
  fastify.get('/rewards/:rewardId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, rewardId } = request.params as { householdId: string; rewardId: string };

    const membership = await getMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const [reward] = await db
      .select()
      .from(rewards)
      .where(and(eq(rewards.householdId, householdId), eq(rewards.id, rewardId)));

    if (!reward) {
      return reply.status(404).send({ error: 'Not found', message: 'Reward not found' });
    }

    return reward;
  });

  // Create reward (parents only)
  fastify.post('/rewards', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = createRewardSchema.parse(request.body);

    const membership = await getMembership(user.id, householdId);
    if (!membership || !isParent(membership)) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can create rewards' });
    }

    const [household] = await db.select().from(households).where(eq(households.id, householdId));
    const effectiveTier = household ? getEffectiveTierForHousehold(household) : 'free';

    const availableFrom = parseDate(body.availableFrom);
    const availableUntil = parseDate(body.availableUntil);

    // Wrap limit check and reward creation in a transaction to prevent race conditions
    let reward;
    try {
      reward = await db.transaction(async (tx) => {
        // Check limit inside transaction
        if (!isTierAtLeast(effectiveTier, 'premium')) {
          const [rewardCount] = await tx
            .select({ count: count() })
            .from(rewards)
            .where(eq(rewards.householdId, householdId));

          if ((rewardCount?.count || 0) >= MAX_FREE_REWARDS) {
            throw new Error(`Free and Family plans can create up to ${MAX_FREE_REWARDS} rewards. Upgrade to Premium for unlimited rewards.`);
          }
        }

        // Create reward inside same transaction
        const [newReward] = await tx
          .insert(rewards)
          .values({
            householdId,
            title: body.title,
            description: body.description || null,
            icon: body.icon || '🎁',
            type: (body.type || 'custom') as RewardType,
            pointCost: body.pointCost,
            createdBy: membership.id,
            quantity: body.quantity ?? null,
            quantityRemaining: body.quantity ?? null,
            availableFrom,
            availableUntil,
            isActive: true,
          })
          .returning();

        return newReward;
      });
    } catch (error) {
      return reply.status(403).send({ error: 'Forbidden', message: (error as Error).message });
    }

    return reply.status(201).send(reward);
  });

  // Update reward (parents only)
  fastify.patch('/rewards/:rewardId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, rewardId } = request.params as { householdId: string; rewardId: string };
    const body = updateRewardSchema.parse(request.body);

    const membership = await getMembership(user.id, householdId);
    if (!membership || !isParent(membership)) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can update rewards' });
    }

    const [existingReward] = await db
      .select()
      .from(rewards)
      .where(and(eq(rewards.householdId, householdId), eq(rewards.id, rewardId)));

    if (!existingReward) {
      return reply.status(404).send({ error: 'Not found', message: 'Reward not found' });
    }

    let quantityRemaining = existingReward.quantityRemaining;
    if (body.quantity !== undefined) {
      if (body.quantity === null) {
        quantityRemaining = null;
      } else {
        const usedCount =
          existingReward.quantity !== null && existingReward.quantityRemaining !== null
            ? Math.max(existingReward.quantity - existingReward.quantityRemaining, 0)
            : 0;
        quantityRemaining = Math.max(body.quantity - usedCount, 0);
      }
    }

    const [reward] = await db
      .update(rewards)
      .set({
        title: body.title ?? existingReward.title,
        description: body.description ?? existingReward.description,
        icon: body.icon ?? existingReward.icon,
        type: (body.type ?? existingReward.type) as RewardType,
        pointCost: body.pointCost ?? existingReward.pointCost,
        quantity: body.quantity === undefined ? existingReward.quantity : body.quantity,
        quantityRemaining,
        availableFrom: body.availableFrom ? parseDate(body.availableFrom) : existingReward.availableFrom,
        availableUntil: body.availableUntil ? parseDate(body.availableUntil) : existingReward.availableUntil,
        isActive: body.isActive ?? existingReward.isActive,
        updatedAt: new Date(),
      })
      .where(and(eq(rewards.householdId, householdId), eq(rewards.id, rewardId)))
      .returning();

    return reward;
  });

  // Delete reward (parents only)
  fastify.delete('/rewards/:rewardId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, rewardId } = request.params as { householdId: string; rewardId: string };

    const membership = await getMembership(user.id, householdId);
    if (!membership || !isParent(membership)) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can delete rewards' });
    }

    await db
      .delete(rewards)
      .where(and(eq(rewards.householdId, householdId), eq(rewards.id, rewardId)));

    return reply.status(204).send();
  });

  // Redeem reward
  fastify.post('/rewards/:rewardId/redeem', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, rewardId } = request.params as { householdId: string; rewardId: string };
    const body = redeemRewardSchema.parse(request.body);

    const membership = await getMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const [redeemingMember] = await db
      .select()
      .from(members)
      .where(and(eq(members.householdId, householdId), eq(members.id, body.memberId)));

    if (!redeemingMember) {
      return reply.status(404).send({ error: 'Not found', message: 'Member not found' });
    }

    const isSelf = membership.id === redeemingMember.id;
    if (!isSelf && !isParent(membership)) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Cannot redeem for another member' });
    }

    if (!redeemingMember.canRedeemRewards) {
      return reply.status(403).send({ error: 'Forbidden', message: 'This member cannot redeem rewards' });
    }

    const [reward] = await db
      .select()
      .from(rewards)
      .where(and(eq(rewards.householdId, householdId), eq(rewards.id, rewardId)));

    if (!reward) {
      return reply.status(404).send({ error: 'Not found', message: 'Reward not found' });
    }

    if (!reward.isActive) {
      return reply.status(400).send({ error: 'Unavailable', message: 'Reward is not active' });
    }

    const now = new Date();
    if (reward.availableFrom && reward.availableFrom > now) {
      return reply.status(400).send({ error: 'Unavailable', message: 'Reward is not available yet' });
    }
    if (reward.availableUntil && reward.availableUntil < now) {
      return reply.status(400).send({ error: 'Unavailable', message: 'Reward is no longer available' });
    }
    if (reward.quantityRemaining !== null && reward.quantityRemaining <= 0) {
      return reply.status(400).send({ error: 'Unavailable', message: 'Reward is sold out' });
    }

    const currentPoints = redeemingMember.pointsCurrent || 0;
    if (currentPoints < reward.pointCost) {
      return reply.status(400).send({ error: 'Insufficient points', message: 'Not enough points' });
    }

    const requiresApproval = redeemingMember.requiresApproval;
    const status: RedemptionStatus = requiresApproval ? 'pending' : 'approved';

    const newBalance = currentPoints - reward.pointCost;

    // Wrap all redemption operations in a transaction to prevent race conditions
    let redemption;
    try {
      redemption = await db.transaction(async (tx) => {
        // Re-check points within transaction using optimistic update
        const updateResult = await tx
          .update(members)
          .set({ pointsCurrent: newBalance })
          .where(and(
            eq(members.id, redeemingMember.id),
            sql`${members.pointsCurrent} >= ${reward.pointCost}`
          ))
          .returning();

        if (updateResult.length === 0) {
          throw new Error('Insufficient points or concurrent redemption');
        }

        // Update reward quantity atomically if limited
        if (reward.quantityRemaining !== null) {
          const rewardUpdate = await tx
            .update(rewards)
            .set({ quantityRemaining: sql`${rewards.quantityRemaining} - 1` })
            .where(and(
              eq(rewards.id, reward.id),
              sql`${rewards.quantityRemaining} > 0`
            ))
            .returning();

          if (rewardUpdate.length === 0) {
            throw new Error('Reward is sold out');
          }
        }

        // Insert redemption record
        const [newRedemption] = await tx
          .insert(rewardRedemptions)
          .values({
            rewardId: reward.id,
            householdId,
            memberId: redeemingMember.id,
            pointsSpent: reward.pointCost,
            status,
            requestedAt: now,
            approvedBy: status === 'approved' ? membership.id : null,
            approvedAt: status === 'approved' ? now : null,
            notes: body.notes || null,
          })
          .returning();

        // Insert point transaction
        await tx
          .insert(pointTransactions)
          .values({
            householdId,
            memberId: redeemingMember.id,
            amount: -reward.pointCost,
            balanceAfter: newBalance,
            transactionType: 'reward_redemption',
            referenceId: newRedemption.id,
            referenceType: 'reward',
            description: `Redeemed reward: ${reward.title}`,
          });

        return newRedemption;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Redemption failed';
      return reply.status(400).send({ error: 'Redemption failed', message });
    }

    return reply.status(201).send(redemption);
  });

  // List pending redemptions (parents only)
  fastify.get('/redemptions/pending', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await getMembership(user.id, householdId);
    if (!membership || !isParent(membership)) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can view redemptions' });
    }

    const pending = await db
      .select()
      .from(rewardRedemptions)
      .where(and(
        eq(rewardRedemptions.householdId, householdId),
        sql`${rewardRedemptions.status} in ('pending','approved')`
      ))
      .orderBy(desc(rewardRedemptions.requestedAt));

    return pending;
  });

  // Approve redemption
  fastify.post('/redemptions/:redemptionId/approve', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, redemptionId } = request.params as { householdId: string; redemptionId: string };

    const membership = await getMembership(user.id, householdId);
    if (!membership || !isParent(membership)) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can approve redemptions' });
    }

    const [redemption] = await db
      .select()
      .from(rewardRedemptions)
      .where(and(eq(rewardRedemptions.householdId, householdId), eq(rewardRedemptions.id, redemptionId)));

    if (!redemption) {
      return reply.status(404).send({ error: 'Not found', message: 'Redemption not found' });
    }

    if (redemption.status !== 'pending') {
      return reply.status(400).send({ error: 'Invalid', message: 'Redemption is not pending' });
    }

    const [updated] = await db
      .update(rewardRedemptions)
      .set({
        status: 'approved',
        approvedBy: membership.id,
        approvedAt: new Date(),
      })
      .where(eq(rewardRedemptions.id, redemption.id))
      .returning();

    return updated;
  });

  // Fulfill redemption
  fastify.post('/redemptions/:redemptionId/fulfill', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, redemptionId } = request.params as { householdId: string; redemptionId: string };

    const membership = await getMembership(user.id, householdId);
    if (!membership || !isParent(membership)) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can fulfill redemptions' });
    }

    const [redemption] = await db
      .select()
      .from(rewardRedemptions)
      .where(and(eq(rewardRedemptions.householdId, householdId), eq(rewardRedemptions.id, redemptionId)));

    if (!redemption) {
      return reply.status(404).send({ error: 'Not found', message: 'Redemption not found' });
    }

    if (redemption.status !== 'approved') {
      return reply.status(400).send({ error: 'Invalid', message: 'Redemption must be approved first' });
    }

    const [updated] = await db
      .update(rewardRedemptions)
      .set({
        status: 'fulfilled',
        fulfilledBy: membership.id,
        fulfilledAt: new Date(),
      })
      .where(eq(rewardRedemptions.id, redemption.id))
      .returning();

    return updated;
  });

  // Reject redemption
  fastify.post('/redemptions/:redemptionId/reject', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, redemptionId } = request.params as { householdId: string; redemptionId: string };
    const body = rejectSchema.parse(request.body);

    const membership = await getMembership(user.id, householdId);
    if (!membership || !isParent(membership)) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can reject redemptions' });
    }

    const [redemption] = await db
      .select()
      .from(rewardRedemptions)
      .where(and(eq(rewardRedemptions.householdId, householdId), eq(rewardRedemptions.id, redemptionId)));

    if (!redemption) {
      return reply.status(404).send({ error: 'Not found', message: 'Redemption not found' });
    }

    if (redemption.status !== 'pending') {
      return reply.status(400).send({ error: 'Invalid', message: 'Only pending redemptions can be rejected' });
    }

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, redemption.memberId));

    if (!member) {
      return reply.status(404).send({ error: 'Not found', message: 'Member not found' });
    }

    const refundedBalance = (member.pointsCurrent || 0) + redemption.pointsSpent;

    // Wrap all rejection operations in a transaction for atomicity
    const updated = await db.transaction(async (tx) => {
      const [rejectedRedemption] = await tx
        .update(rewardRedemptions)
        .set({
          status: 'rejected',
          rejectedBy: membership.id,
          rejectedAt: new Date(),
          rejectionReason: body.reason,
        })
        .where(eq(rewardRedemptions.id, redemption.id))
        .returning();

      await tx
        .update(members)
        .set({
          pointsCurrent: refundedBalance,
        })
        .where(eq(members.id, member.id));

      await tx
        .insert(pointTransactions)
        .values({
          householdId,
          memberId: member.id,
          amount: redemption.pointsSpent,
          balanceAfter: refundedBalance,
          transactionType: 'reward_refund',
          referenceId: redemption.id,
          referenceType: 'reward',
          description: `Refunded reward redemption`,
        });

      if (redemption.rewardId) {
        const [reward] = await tx
          .select()
          .from(rewards)
          .where(eq(rewards.id, redemption.rewardId));

        if (reward?.quantityRemaining !== null) {
          await tx
            .update(rewards)
            .set({ quantityRemaining: sql`${rewards.quantityRemaining} + 1` })
            .where(eq(rewards.id, reward.id));
        }
      }

      return rejectedRedemption;
    });

    return updated;
  });
}
