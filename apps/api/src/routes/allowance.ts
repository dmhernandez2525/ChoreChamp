import { FastifyInstance } from 'fastify';
import { db } from '@chorechamp/database';
import { allowanceSettings, allowancePayouts, members } from '@chorechamp/database/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import type {
  CreateAllowanceSettingsRequest,
  UpdateAllowanceSettingsRequest,
  MarkPayoutPaidRequest,
  AllowanceSettings,
  AllowancePayout,
  AllowanceSummary,
  PayoutFrequency,
} from '@chorechamp/types';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership } from '../lib/membership';

// Helper to convert database row to AllowanceSettings type
function toAllowanceSettings(row: typeof allowanceSettings.$inferSelect): AllowanceSettings {
  return {
    id: row.id,
    householdId: row.householdId,
    memberId: row.memberId,
    pointsPerDollar: row.pointsPerDollar,
    currency: row.currency,
    payoutFrequency: row.payoutFrequency as PayoutFrequency,
    payoutDayOfWeek: row.payoutDayOfWeek,
    payoutDayOfMonth: row.payoutDayOfMonth,
    minimumPayout: parseFloat(row.minimumPayout),
    maximumPayout: row.maximumPayout ? parseFloat(row.maximumPayout) : null,
    reservePoints: row.reservePoints,
    isActive: row.isActive ?? true,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  };
}

// Helper to convert database row to AllowancePayout type
function toAllowancePayout(row: typeof allowancePayouts.$inferSelect): AllowancePayout {
  return {
    id: row.id,
    householdId: row.householdId,
    memberId: row.memberId,
    settingsId: row.settingsId,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    pointsConverted: row.pointsConverted,
    amountDue: parseFloat(row.amountDue),
    currency: row.currency,
    status: row.status as AllowancePayout['status'],
    paidAt: row.paidAt,
    paidBy: row.paidBy,
    notes: row.notes,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  };
}

// Helper to calculate next payout date
function calculateNextPayoutDate(settings: AllowanceSettings): string | null {
  const now = new Date();
  const result = new Date(now);

  if (settings.payoutFrequency === 'weekly' && settings.payoutDayOfWeek !== null) {
    const daysUntilNext = (settings.payoutDayOfWeek - now.getDay() + 7) % 7 || 7;
    result.setDate(result.getDate() + daysUntilNext);
  } else if (settings.payoutFrequency === 'biweekly' && settings.payoutDayOfWeek !== null) {
    const daysUntilNext = (settings.payoutDayOfWeek - now.getDay() + 7) % 7 || 14;
    result.setDate(result.getDate() + daysUntilNext);
  } else if (settings.payoutFrequency === 'monthly' && settings.payoutDayOfMonth !== null) {
    result.setDate(settings.payoutDayOfMonth);
    if (result <= now) {
      result.setMonth(result.getMonth() + 1);
    }
  } else {
    return null;
  }

  return result.toISOString().split('T')[0];
}

export async function allowanceRoutes(fastify: FastifyInstance) {
  // GET /api/households/:householdId/allowance - Get household allowance summary
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

    // Get all members with allowance settings
    const householdMembers = await db.query.members.findMany({
      where: eq(members.householdId, householdId),
    });

    const allSettings = await db.query.allowanceSettings.findMany({
      where: eq(allowanceSettings.householdId, householdId),
    });

    const pendingPayouts = await db.query.allowancePayouts.findMany({
      where: and(
        eq(allowancePayouts.householdId, householdId),
        eq(allowancePayouts.status, 'pending')
      ),
    });

    let totalPendingAmount = 0;
    const memberSummaries = [];

    for (const member of householdMembers) {
      const settings = allSettings.find((s) => s.memberId === member.id);
      const memberPendingPayouts = pendingPayouts.filter((p) => p.memberId === member.id);
      const pendingAmount = memberPendingPayouts.reduce(
        (sum, p) => sum + parseFloat(p.amountDue),
        0
      );
      totalPendingAmount += pendingAmount;

      // Get last payout
      const lastPayout = await db.query.allowancePayouts.findFirst({
        where: and(
          eq(allowancePayouts.memberId, member.id),
          eq(allowancePayouts.status, 'paid')
        ),
        orderBy: desc(allowancePayouts.paidAt),
      });

      memberSummaries.push({
        memberId: member.id,
        memberName: member.name,
        memberColor: member.color,
        hasAllowance: !!settings,
        pendingAmount,
        lastPayout: lastPayout ? toAllowancePayout(lastPayout) : null,
      });
    }

    const defaultSettings = allSettings[0];

    return {
      totalPendingPayouts: pendingPayouts.length,
      pendingPayoutAmount: totalPendingAmount,
      currency: defaultSettings?.currency || 'USD',
      memberSummaries,
    };
  });

  // GET /api/households/:householdId/allowance/:memberId - Get member's allowance summary
  fastify.get('/:memberId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get member
    const member = await db.query.members.findFirst({
      where: and(
        eq(members.id, memberId),
        eq(members.householdId, householdId)
      ),
    });

    if (!member) {
      return reply.status(404).send({ error: 'Member not found' });
    }

    // Get settings
    const settingsRow = await db.query.allowanceSettings.findFirst({
      where: and(
        eq(allowanceSettings.memberId, memberId),
        eq(allowanceSettings.householdId, householdId)
      ),
    });

    const settings = settingsRow ? toAllowanceSettings(settingsRow) : null;

    // Calculate balances
    const totalPoints = member.pointsCurrent || 0;
    const reservePoints = settings?.reservePoints || 0;
    const availablePoints = Math.max(0, totalPoints - reservePoints);
    const pointsPerDollar = settings?.pointsPerDollar || 100;
    const estimatedValue = availablePoints / pointsPerDollar;

    // Get pending payout
    const pendingPayoutRow = await db.query.allowancePayouts.findFirst({
      where: and(
        eq(allowancePayouts.memberId, memberId),
        eq(allowancePayouts.status, 'pending')
      ),
      orderBy: desc(allowancePayouts.createdAt),
    });

    // Get recent payouts
    const recentPayoutsRows = await db.query.allowancePayouts.findMany({
      where: eq(allowancePayouts.memberId, memberId),
      orderBy: desc(allowancePayouts.createdAt),
      limit: 10,
    });

    // Get lifetime earnings
    const lifetimeStats = await db.select({
      totalPoints: sql<number>`COALESCE(SUM(${allowancePayouts.pointsConverted}), 0)`,
      totalAmount: sql<string>`COALESCE(SUM(${allowancePayouts.amountDue}), 0)`,
    }).from(allowancePayouts).where(and(
      eq(allowancePayouts.memberId, memberId),
      eq(allowancePayouts.status, 'paid')
    ));

    const summary: AllowanceSummary = {
      settings,
      currentBalance: {
        totalPoints,
        reservePoints,
        availablePoints,
        estimatedValue,
        currency: settings?.currency || 'USD',
      },
      pendingPayout: pendingPayoutRow ? toAllowancePayout(pendingPayoutRow) : null,
      nextPayoutDate: settings ? calculateNextPayoutDate(settings) : null,
      recentPayouts: recentPayoutsRows.map(toAllowancePayout),
      lifetimeEarnings: {
        totalPointsConverted: Number(lifetimeStats[0]?.totalPoints || 0),
        totalAmountPaid: parseFloat(lifetimeStats[0]?.totalAmount || '0'),
      },
    };

    return summary;
  });

  // POST /api/households/:householdId/allowance - Create allowance settings
  fastify.post('/', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = request.body as CreateAllowanceSettingsRequest;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership || membership.role !== 'parent') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can manage allowance settings',
      });
    }

    const {
      memberId,
      pointsPerDollar,
      currency = 'USD',
      payoutFrequency,
      payoutDayOfWeek,
      payoutDayOfMonth,
      minimumPayout = 1.00,
      maximumPayout,
      reservePoints = 0,
    } = body;

    // Check if settings already exist
    const existing = await db.query.allowanceSettings.findFirst({
      where: and(
        eq(allowanceSettings.memberId, memberId),
        eq(allowanceSettings.householdId, householdId)
      ),
    });

    if (existing) {
      return reply.status(400).send({ error: 'Allowance settings already exist for this member' });
    }

    // Create settings
    const [created] = await db.insert(allowanceSettings).values({
      householdId,
      memberId,
      pointsPerDollar,
      currency,
      payoutFrequency,
      payoutDayOfWeek: payoutDayOfWeek ?? null,
      payoutDayOfMonth: payoutDayOfMonth ?? null,
      minimumPayout: minimumPayout.toString(),
      maximumPayout: maximumPayout?.toString() ?? null,
      reservePoints,
    }).returning();

    return reply.status(201).send(toAllowanceSettings(created));
  });

  // PATCH /api/households/:householdId/allowance/:memberId - Update allowance settings
  fastify.patch('/:memberId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };
    const body = request.body as UpdateAllowanceSettingsRequest;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership || membership.role !== 'parent') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can manage allowance settings',
      });
    }

    const existing = await db.query.allowanceSettings.findFirst({
      where: and(
        eq(allowanceSettings.memberId, memberId),
        eq(allowanceSettings.householdId, householdId)
      ),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Allowance settings not found' });
    }

    const updateData: Partial<typeof allowanceSettings.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.pointsPerDollar !== undefined) updateData.pointsPerDollar = body.pointsPerDollar;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.payoutFrequency !== undefined) updateData.payoutFrequency = body.payoutFrequency;
    if (body.payoutDayOfWeek !== undefined) updateData.payoutDayOfWeek = body.payoutDayOfWeek;
    if (body.payoutDayOfMonth !== undefined) updateData.payoutDayOfMonth = body.payoutDayOfMonth;
    if (body.minimumPayout !== undefined) updateData.minimumPayout = body.minimumPayout.toString();
    if (body.maximumPayout !== undefined) updateData.maximumPayout = body.maximumPayout?.toString() ?? null;
    if (body.reservePoints !== undefined) updateData.reservePoints = body.reservePoints;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const [updated] = await db.update(allowanceSettings)
      .set(updateData)
      .where(eq(allowanceSettings.id, existing.id))
      .returning();

    return toAllowanceSettings(updated);
  });

  // POST /api/households/:householdId/allowance/:memberId/generate-payout - Generate a payout
  fastify.post('/:memberId/generate-payout', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership || membership.role !== 'parent') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can generate payouts',
      });
    }

    // Get settings
    const settingsRow = await db.query.allowanceSettings.findFirst({
      where: and(
        eq(allowanceSettings.memberId, memberId),
        eq(allowanceSettings.householdId, householdId)
      ),
    });

    if (!settingsRow || !settingsRow.isActive) {
      return reply.status(400).send({ error: 'Allowance is not set up for this member' });
    }

    const settings = toAllowanceSettings(settingsRow);

    // Get member
    const member = await db.query.members.findFirst({
      where: eq(members.id, memberId),
    });

    if (!member) {
      return reply.status(404).send({ error: 'Member not found' });
    }

    // Check if there's a pending payout already
    const existingPending = await db.query.allowancePayouts.findFirst({
      where: and(
        eq(allowancePayouts.memberId, memberId),
        eq(allowancePayouts.status, 'pending')
      ),
    });

    if (existingPending) {
      return reply.status(400).send({ error: 'There is already a pending payout for this member' });
    }

    // Calculate available points
    const totalPoints = member.pointsCurrent || 0;
    const availablePoints = Math.max(0, totalPoints - settings.reservePoints);
    const amountDue = availablePoints / settings.pointsPerDollar;

    if (amountDue < settings.minimumPayout) {
      return reply.status(400).send({
        error: `Insufficient points for payout. Minimum is $${settings.minimumPayout}`,
      });
    }

    // Apply maximum if set
    let finalAmount = amountDue;
    let pointsToConvert = availablePoints;
    if (settings.maximumPayout && amountDue > settings.maximumPayout) {
      finalAmount = settings.maximumPayout;
      pointsToConvert = finalAmount * settings.pointsPerDollar;
    }

    // Calculate period dates
    const now = new Date();
    const periodEnd = now.toISOString().split('T')[0];
    const periodStartDate = new Date(now);
    if (settings.payoutFrequency === 'weekly') {
      periodStartDate.setDate(periodStartDate.getDate() - 7);
    } else if (settings.payoutFrequency === 'biweekly') {
      periodStartDate.setDate(periodStartDate.getDate() - 14);
    } else {
      periodStartDate.setMonth(periodStartDate.getMonth() - 1);
    }
    const periodStart = periodStartDate.toISOString().split('T')[0];

    // Create payout
    const [payout] = await db.insert(allowancePayouts).values({
      householdId,
      memberId,
      settingsId: settings.id,
      periodStart,
      periodEnd,
      pointsConverted: Math.floor(pointsToConvert),
      amountDue: finalAmount.toFixed(2),
      currency: settings.currency,
      status: 'pending',
    }).returning();

    return reply.status(201).send(toAllowancePayout(payout));
  });

  // POST /api/households/:householdId/allowance/payouts/:payoutId/pay - Mark payout as paid
  fastify.post('/payouts/:payoutId/pay', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, payoutId } = request.params as { householdId: string; payoutId: string };
    const body = request.body as MarkPayoutPaidRequest;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership || membership.role !== 'parent') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can mark payouts as paid',
      });
    }

    const payout = await db.query.allowancePayouts.findFirst({
      where: and(
        eq(allowancePayouts.id, payoutId),
        eq(allowancePayouts.householdId, householdId)
      ),
    });

    if (!payout) {
      return reply.status(404).send({ error: 'Payout not found' });
    }

    if (payout.status !== 'pending') {
      return reply.status(400).send({ error: 'Payout is not pending' });
    }

    // Deduct points and update payout status atomically
    const [updated] = await db.transaction(async (tx) => {
      // Check sufficient balance before deducting
      const [currentMember] = await tx.select({ pointsCurrent: members.pointsCurrent })
        .from(members).where(eq(members.id, payout.memberId));
      if (!currentMember || (currentMember.pointsCurrent || 0) < payout.pointsConverted) {
        throw Object.assign(new Error('Insufficient points for payout'), { statusCode: 400 });
      }

      // Deduct points from member
      await tx.update(members)
        .set({
          pointsCurrent: sql`${members.pointsCurrent} - ${payout.pointsConverted}`,
        })
        .where(eq(members.id, payout.memberId));

      // Update payout status
      return await tx.update(allowancePayouts)
        .set({
          status: 'paid',
          paidAt: new Date(),
          paidBy: membership.id,
          notes: body.notes || null,
          updatedAt: new Date(),
        })
        .where(eq(allowancePayouts.id, payoutId))
        .returning();
    });

    return toAllowancePayout(updated);
  });

  // POST /api/households/:householdId/allowance/payouts/:payoutId/cancel - Cancel payout
  fastify.post('/payouts/:payoutId/cancel', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, payoutId } = request.params as { householdId: string; payoutId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership || membership.role !== 'parent') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can cancel payouts',
      });
    }

    const payout = await db.query.allowancePayouts.findFirst({
      where: and(
        eq(allowancePayouts.id, payoutId),
        eq(allowancePayouts.householdId, householdId)
      ),
    });

    if (!payout) {
      return reply.status(404).send({ error: 'Payout not found' });
    }

    if (payout.status !== 'pending') {
      return reply.status(400).send({ error: 'Only pending payouts can be cancelled' });
    }

    const [updated] = await db.update(allowancePayouts)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(allowancePayouts.id, payoutId))
      .returning();

    return toAllowancePayout(updated);
  });

  // GET /api/households/:householdId/allowance/payouts - List all payouts
  fastify.get('/payouts', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const query = request.query as { status?: string; memberId?: string; limit?: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const conditions = [eq(allowancePayouts.householdId, householdId)];

    if (query.status) {
      conditions.push(eq(allowancePayouts.status, query.status));
    }

    if (query.memberId) {
      conditions.push(eq(allowancePayouts.memberId, query.memberId));
    }

    const limit = query.limit ? parseInt(query.limit) : 50;

    const payouts = await db.query.allowancePayouts.findMany({
      where: and(...conditions),
      orderBy: desc(allowancePayouts.createdAt),
      limit,
    });

    // Get member info for each payout
    const result = await Promise.all(payouts.map(async (p) => {
      const member = await db.query.members.findFirst({
        where: eq(members.id, p.memberId),
        columns: { id: true, name: true, color: true },
      });

      let paidByMember = null;
      if (p.paidBy) {
        const payer = await db.query.members.findFirst({
          where: eq(members.id, p.paidBy),
          columns: { id: true, name: true },
        });
        if (payer) {
          paidByMember = { id: payer.id, name: payer.name };
        }
      }

      return {
        ...toAllowancePayout(p),
        member: member ? { id: member.id, name: member.name, color: member.color } : null,
        paidByMember,
      };
    }));

    return result;
  });
}
