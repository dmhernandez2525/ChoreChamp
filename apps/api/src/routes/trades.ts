import { FastifyInstance } from 'fastify';
import { db } from '@chorechamp/database';
import { choreTrades, members, choreSchedules, chores } from '@chorechamp/database/schema';
import { eq, and, or, desc, gte, sql } from 'drizzle-orm';
import type {
  CreateTradeRequest,
  RespondToTradeRequest,
  ApproveTradeRequest,
  TradeWithDetails,
  TradeStatus,
} from '@chorechamp/types';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership } from '../lib/membership';

// Helper to build trade with details
async function getTradeWithDetails(tradeId: string): Promise<TradeWithDetails | null> {
  const trade = await db.query.choreTrades.findFirst({
    where: eq(choreTrades.id, tradeId),
  });

  if (!trade) return null;

  // Get initiator
  const initiator = await db.query.members.findFirst({
    where: eq(members.id, trade.initiatorMemberId),
    columns: { id: true, name: true, color: true },
  });

  // Get recipient
  const recipient = await db.query.members.findFirst({
    where: eq(members.id, trade.recipientMemberId),
    columns: { id: true, name: true, color: true },
  });

  // Get offered chore schedule with chore details
  const offeredSchedule = await db.query.choreSchedules.findFirst({
    where: eq(choreSchedules.id, trade.offeredChoreScheduleId),
  });
  const offeredChore = offeredSchedule
    ? await db.query.chores.findFirst({
        where: eq(chores.id, offeredSchedule.choreId),
        columns: { id: true, title: true, icon: true, pointValue: true },
      })
    : null;

  // Get requested chore schedule with chore details (if exists)
  let requestedChoreDetails = null;
  if (trade.requestedChoreScheduleId) {
    const requestedSchedule = await db.query.choreSchedules.findFirst({
      where: eq(choreSchedules.id, trade.requestedChoreScheduleId),
    });
    if (requestedSchedule) {
      const requestedChore = await db.query.chores.findFirst({
        where: eq(chores.id, requestedSchedule.choreId),
        columns: { id: true, title: true, icon: true, pointValue: true },
      });
      if (requestedChore) {
        requestedChoreDetails = {
          id: requestedChore.id,
          title: requestedChore.title,
          icon: requestedChore.icon || '✅',
          pointValue: requestedChore.pointValue,
          scheduledDate: requestedSchedule.scheduledDate,
        };
      }
    }
  }

  // Get approver if exists
  let approverDetails = null;
  if (trade.approvedBy) {
    const approver = await db.query.members.findFirst({
      where: eq(members.id, trade.approvedBy),
      columns: { id: true, name: true },
    });
    if (approver) {
      approverDetails = { id: approver.id, name: approver.name };
    }
  }

  if (!initiator || !recipient || !offeredChore || !offeredSchedule) {
    return null;
  }

  return {
    id: trade.id,
    householdId: trade.householdId,
    initiatorMemberId: trade.initiatorMemberId,
    recipientMemberId: trade.recipientMemberId,
    offeredChoreScheduleId: trade.offeredChoreScheduleId,
    requestedChoreScheduleId: trade.requestedChoreScheduleId,
    pointsOffered: trade.pointsOffered,
    pointsRequested: trade.pointsRequested,
    message: trade.message,
    status: trade.status as TradeStatus,
    recipientRespondedAt: trade.recipientRespondedAt,
    approvedBy: trade.approvedBy,
    approvedAt: trade.approvedAt,
    rejectionReason: trade.rejectionReason,
    expiresAt: trade.expiresAt,
    createdAt: trade.createdAt || new Date(),
    updatedAt: trade.updatedAt || new Date(),
    initiator: { id: initiator.id, name: initiator.name, color: initiator.color },
    recipient: { id: recipient.id, name: recipient.name, color: recipient.color },
    offeredChore: {
      id: offeredChore.id,
      title: offeredChore.title,
      icon: offeredChore.icon || '✅',
      pointValue: offeredChore.pointValue,
      scheduledDate: offeredSchedule.scheduledDate,
    },
    requestedChore: requestedChoreDetails,
    approver: approverDetails,
  };
}

export async function tradeRoutes(fastify: FastifyInstance) {
  // GET /api/households/:householdId/trades - List all trades
  fastify.get('/', {
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

    const memberId = membership.id;
    const now = new Date();

    // Get incoming trades (where user is recipient)
    const incomingRaw = await db.query.choreTrades.findMany({
      where: and(
        eq(choreTrades.householdId, householdId),
        eq(choreTrades.recipientMemberId, memberId),
        eq(choreTrades.status, 'pending_recipient'),
        gte(choreTrades.expiresAt, now)
      ),
      orderBy: desc(choreTrades.createdAt),
    });

    // Get outgoing trades (where user is initiator)
    const outgoingRaw = await db.query.choreTrades.findMany({
      where: and(
        eq(choreTrades.householdId, householdId),
        eq(choreTrades.initiatorMemberId, memberId),
        or(
          eq(choreTrades.status, 'pending_recipient'),
          eq(choreTrades.status, 'pending_approval')
        ),
        gte(choreTrades.expiresAt, now)
      ),
      orderBy: desc(choreTrades.createdAt),
    });

    // Get trades pending parent approval (for parents only)
    let pendingApprovalRaw: typeof incomingRaw = [];
    if (membership.role === 'parent') {
      pendingApprovalRaw = await db.query.choreTrades.findMany({
        where: and(
          eq(choreTrades.householdId, householdId),
          eq(choreTrades.status, 'pending_approval'),
          gte(choreTrades.expiresAt, now)
        ),
        orderBy: desc(choreTrades.createdAt),
      });
    }

    // Get trade history
    const historyRaw = await db.query.choreTrades.findMany({
      where: and(
        eq(choreTrades.householdId, householdId),
        or(
          eq(choreTrades.initiatorMemberId, memberId),
          eq(choreTrades.recipientMemberId, memberId)
        ),
        or(
          eq(choreTrades.status, 'approved'),
          eq(choreTrades.status, 'rejected'),
          eq(choreTrades.status, 'declined'),
          eq(choreTrades.status, 'cancelled'),
          eq(choreTrades.status, 'expired')
        )
      ),
      orderBy: desc(choreTrades.updatedAt),
      limit: 20,
    });

    // Map to TradeWithDetails
    const incoming = (await Promise.all(
      incomingRaw.map((t) => getTradeWithDetails(t.id))
    )).filter((t): t is TradeWithDetails => t !== null);

    const outgoing = (await Promise.all(
      outgoingRaw.map((t) => getTradeWithDetails(t.id))
    )).filter((t): t is TradeWithDetails => t !== null);

    const pendingApproval = (await Promise.all(
      pendingApprovalRaw.map((t) => getTradeWithDetails(t.id))
    )).filter((t): t is TradeWithDetails => t !== null);

    const history = (await Promise.all(
      historyRaw.map((t) => getTradeWithDetails(t.id))
    )).filter((t): t is TradeWithDetails => t !== null);

    return {
      incoming,
      outgoing,
      pendingApproval,
      history,
    };
  });

  // GET /api/households/:householdId/trades/stats - Get trade statistics
  // Note: Must come before /:tradeId to avoid route conflict
  fastify.get('/stats', {
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

    const memberId = membership.id;

    // Get basic stats
    const initiated = await db.select({ count: sql<number>`count(*)` })
      .from(choreTrades)
      .where(and(
        eq(choreTrades.householdId, householdId),
        eq(choreTrades.initiatorMemberId, memberId)
      ));

    const received = await db.select({ count: sql<number>`count(*)` })
      .from(choreTrades)
      .where(and(
        eq(choreTrades.householdId, householdId),
        eq(choreTrades.recipientMemberId, memberId)
      ));

    const successful = await db.select({ count: sql<number>`count(*)` })
      .from(choreTrades)
      .where(and(
        eq(choreTrades.householdId, householdId),
        or(
          eq(choreTrades.initiatorMemberId, memberId),
          eq(choreTrades.recipientMemberId, memberId)
        ),
        eq(choreTrades.status, 'approved')
      ));

    // Calculate points gained/spent from approved trades
    const approvedTrades = await db.query.choreTrades.findMany({
      where: and(
        eq(choreTrades.householdId, householdId),
        or(
          eq(choreTrades.initiatorMemberId, memberId),
          eq(choreTrades.recipientMemberId, memberId)
        ),
        eq(choreTrades.status, 'approved')
      ),
    });

    let pointsGained = 0;
    let pointsSpent = 0;

    for (const trade of approvedTrades) {
      if (trade.initiatorMemberId === memberId) {
        pointsGained += trade.pointsRequested;
        pointsSpent += trade.pointsOffered;
      } else {
        pointsGained += trade.pointsOffered;
        pointsSpent += trade.pointsRequested;
      }
    }

    // Find most traded with member
    const tradeCounts = new Map<string, number>();
    for (const trade of approvedTrades) {
      const otherId = trade.initiatorMemberId === memberId
        ? trade.recipientMemberId
        : trade.initiatorMemberId;
      tradeCounts.set(otherId, (tradeCounts.get(otherId) || 0) + 1);
    }

    let mostTradedWith = null;
    if (tradeCounts.size > 0) {
      const [topMemberId, tradeCount] = [...tradeCounts.entries()]
        .sort((a, b) => b[1] - a[1])[0];

      const topMember = await db.query.members.findFirst({
        where: eq(members.id, topMemberId),
        columns: { id: true, name: true },
      });

      if (topMember) {
        mostTradedWith = {
          memberId: topMember.id,
          memberName: topMember.name,
          tradeCount,
        };
      }
    }

    return {
      totalTradesInitiated: Number(initiated[0]?.count || 0),
      totalTradesReceived: Number(received[0]?.count || 0),
      successfulTrades: Number(successful[0]?.count || 0),
      pointsGainedFromTrades: pointsGained,
      pointsSpentOnTrades: pointsSpent,
      mostTradedWith,
    };
  });

  // POST /api/households/:householdId/trades - Create a new trade
  fastify.post('/', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = request.body as CreateTradeRequest;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const memberId = membership.id;
    const {
      recipientMemberId,
      offeredChoreScheduleId,
      requestedChoreScheduleId,
      pointsOffered = 0,
      pointsRequested = 0,
      message,
      expiresInHours = 24,
    } = body;

    // Validate recipient exists in household
    const recipient = await db.query.members.findFirst({
      where: and(
        eq(members.id, recipientMemberId),
        eq(members.householdId, householdId)
      ),
    });

    if (!recipient) {
      return reply.status(400).send({ error: 'Recipient not found in household' });
    }

    // Validate offered chore schedule exists and belongs to initiator
    const offeredSchedule = await db.query.choreSchedules.findFirst({
      where: and(
        eq(choreSchedules.id, offeredChoreScheduleId),
        eq(choreSchedules.householdId, householdId),
        eq(choreSchedules.assignedTo, memberId),
        eq(choreSchedules.isCompleted, false)
      ),
    });

    if (!offeredSchedule) {
      return reply.status(400).send({
        error: 'Invalid offered chore schedule or not assigned to you'
      });
    }

    // Validate requested chore schedule if provided
    if (requestedChoreScheduleId) {
      const requestedSchedule = await db.query.choreSchedules.findFirst({
        where: and(
          eq(choreSchedules.id, requestedChoreScheduleId),
          eq(choreSchedules.householdId, householdId),
          eq(choreSchedules.assignedTo, recipientMemberId),
          eq(choreSchedules.isCompleted, false)
        ),
      });

      if (!requestedSchedule) {
        return reply.status(400).send({
          error: 'Invalid requested chore schedule or not assigned to recipient'
        });
      }
    }

    // Check initiator has enough points if offering points
    if (pointsOffered > 0) {
      if ((membership.pointsCurrent || 0) < pointsOffered) {
        return reply.status(400).send({ error: 'Insufficient points to offer' });
      }
    }

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Create the trade
    const [trade] = await db.insert(choreTrades).values({
      householdId,
      initiatorMemberId: memberId,
      recipientMemberId,
      offeredChoreScheduleId,
      requestedChoreScheduleId: requestedChoreScheduleId || null,
      pointsOffered,
      pointsRequested,
      message: message || null,
      status: 'pending_recipient',
      expiresAt,
    }).returning();

    const tradeWithDetails = await getTradeWithDetails(trade.id);
    return reply.status(201).send(tradeWithDetails);
  });

  // GET /api/households/:householdId/trades/:tradeId - Get trade details
  fastify.get('/:tradeId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, tradeId } = request.params as { householdId: string; tradeId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const trade = await db.query.choreTrades.findFirst({
      where: and(
        eq(choreTrades.id, tradeId),
        eq(choreTrades.householdId, householdId)
      ),
    });

    if (!trade) {
      return reply.status(404).send({ error: 'Trade not found' });
    }

    const tradeWithDetails = await getTradeWithDetails(tradeId);
    return tradeWithDetails;
  });

  // POST /api/households/:householdId/trades/:tradeId/respond - Recipient responds
  fastify.post('/:tradeId/respond', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, tradeId } = request.params as { householdId: string; tradeId: string };
    const body = request.body as RespondToTradeRequest;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const memberId = membership.id;
    const { accept } = body;

    const trade = await db.query.choreTrades.findFirst({
      where: and(
        eq(choreTrades.id, tradeId),
        eq(choreTrades.householdId, householdId)
      ),
    });

    if (!trade) {
      return reply.status(404).send({ error: 'Trade not found' });
    }

    // Must be the recipient
    if (trade.recipientMemberId !== memberId) {
      return reply.status(403).send({ error: 'Only the recipient can respond' });
    }

    // Must be pending recipient
    if (trade.status !== 'pending_recipient') {
      return reply.status(400).send({ error: 'Trade is not pending response' });
    }

    // Check if expired
    if (new Date() > trade.expiresAt) {
      await db.update(choreTrades)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(choreTrades.id, tradeId));
      return reply.status(400).send({ error: 'Trade has expired' });
    }

    if (!accept) {
      // Decline the trade
      await db.update(choreTrades)
        .set({
          status: 'declined',
          recipientRespondedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(choreTrades.id, tradeId));

      const updated = await getTradeWithDetails(tradeId);
      return updated;
    }

    // Check if recipient has enough points if points are requested
    if (trade.pointsRequested > 0) {
      if ((membership.pointsCurrent || 0) < trade.pointsRequested) {
        return reply.status(400).send({ error: 'Insufficient points' });
      }
    }

    // Accept - move to pending parent approval
    await db.update(choreTrades)
      .set({
        status: 'pending_approval',
        recipientRespondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(choreTrades.id, tradeId));

    const updated = await getTradeWithDetails(tradeId);
    return updated;
  });

  // POST /api/households/:householdId/trades/:tradeId/approve - Parent approves/rejects
  fastify.post('/:tradeId/approve', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, tradeId } = request.params as { householdId: string; tradeId: string };
    const body = request.body as ApproveTradeRequest;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const memberId = membership.id;
    const { approved, rejectionReason } = body;

    // Must be a parent
    if (membership.role !== 'parent') {
      return reply.status(403).send({ error: 'Only parents can approve trades' });
    }

    const trade = await db.query.choreTrades.findFirst({
      where: and(
        eq(choreTrades.id, tradeId),
        eq(choreTrades.householdId, householdId)
      ),
    });

    if (!trade) {
      return reply.status(404).send({ error: 'Trade not found' });
    }

    // Must be pending approval
    if (trade.status !== 'pending_approval') {
      return reply.status(400).send({ error: 'Trade is not pending approval' });
    }

    // Check if expired
    if (new Date() > trade.expiresAt) {
      await db.update(choreTrades)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(choreTrades.id, tradeId));
      return reply.status(400).send({ error: 'Trade has expired' });
    }

    if (!approved) {
      // Reject the trade
      await db.update(choreTrades)
        .set({
          status: 'rejected',
          approvedBy: memberId,
          approvedAt: new Date(),
          rejectionReason: rejectionReason || null,
          updatedAt: new Date(),
        })
        .where(eq(choreTrades.id, tradeId));

      const updated = await getTradeWithDetails(tradeId);
      return updated;
    }

    // Approve and execute the trade atomically
    await db.transaction(async (tx) => {
      // 1. Swap chore assignments
      await tx.update(choreSchedules)
        .set({ assignedTo: trade.recipientMemberId })
        .where(eq(choreSchedules.id, trade.offeredChoreScheduleId));

      if (trade.requestedChoreScheduleId) {
        await tx.update(choreSchedules)
          .set({ assignedTo: trade.initiatorMemberId })
          .where(eq(choreSchedules.id, trade.requestedChoreScheduleId));
      }

      // 2. Transfer points if applicable
      if (trade.pointsOffered > 0) {
        // Deduct from initiator
        await tx.update(members)
          .set({
            pointsCurrent: sql`${members.pointsCurrent} - ${trade.pointsOffered}`,
          })
          .where(eq(members.id, trade.initiatorMemberId));

        // Add to recipient
        await tx.update(members)
          .set({
            pointsCurrent: sql`${members.pointsCurrent} + ${trade.pointsOffered}`,
          })
          .where(eq(members.id, trade.recipientMemberId));
      }

      if (trade.pointsRequested > 0) {
        // Deduct from recipient
        await tx.update(members)
          .set({
            pointsCurrent: sql`${members.pointsCurrent} - ${trade.pointsRequested}`,
          })
          .where(eq(members.id, trade.recipientMemberId));

        // Add to initiator
        await tx.update(members)
          .set({
            pointsCurrent: sql`${members.pointsCurrent} + ${trade.pointsRequested}`,
          })
          .where(eq(members.id, trade.initiatorMemberId));
      }

      // 3. Update trade status
      await tx.update(choreTrades)
        .set({
          status: 'approved',
          approvedBy: memberId,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(choreTrades.id, tradeId));
    });

    const updated = await getTradeWithDetails(tradeId);
    return updated;
  });

  // DELETE /api/households/:householdId/trades/:tradeId - Cancel a trade
  fastify.delete('/:tradeId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, tradeId } = request.params as { householdId: string; tradeId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const memberId = membership.id;

    const trade = await db.query.choreTrades.findFirst({
      where: and(
        eq(choreTrades.id, tradeId),
        eq(choreTrades.householdId, householdId)
      ),
    });

    if (!trade) {
      return reply.status(404).send({ error: 'Trade not found' });
    }

    // Must be the initiator
    if (trade.initiatorMemberId !== memberId) {
      return reply.status(403).send({ error: 'Only the initiator can cancel' });
    }

    // Can only cancel pending trades
    if (trade.status !== 'pending_recipient' && trade.status !== 'pending_approval') {
      return reply.status(400).send({ error: 'Cannot cancel this trade' });
    }

    await db.update(choreTrades)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(choreTrades.id, tradeId));

    return { success: true };
  });
}
