import { FastifyInstance } from 'fastify';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { db } from '../lib/db';
import {
  choreCompletions,
  members,
  chores,
} from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

async function verifyParentMembership(
  userId: string,
  householdId: string
): Promise<boolean> {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(
      eq(members.householdId, householdId),
      eq(members.userId, userId),
      eq(members.role, 'parent')
    ));
  return !!membership;
}

export async function reportsRoutes(fastify: FastifyInstance) {
  // Get summary report (parents only)
  fastify.get('/summary', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const {
      startDate,
      endDate,
    } = request.query as {
      startDate?: string;
      endDate?: string;
    };

    const isParent = await verifyParentMembership(user.id, householdId);
    if (!isParent) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can view reports',
      });
    }

    // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Overall stats
    const [overallStats] = await db
      .select({
        totalCompletions: sql<number>`count(*)::int`,
        totalPoints: sql<number>`coalesce(sum(${choreCompletions.pointsAwarded}), 0)::int`,
        approvedCount: sql<number>`count(*) filter (where ${choreCompletions.status} = 'approved')::int`,
        rejectedCount: sql<number>`count(*) filter (where ${choreCompletions.status} = 'rejected')::int`,
        pendingCount: sql<number>`count(*) filter (where ${choreCompletions.status} = 'pending')::int`,
        uniqueChores: sql<number>`count(distinct ${choreCompletions.choreId})::int`,
        uniqueMembers: sql<number>`count(distinct ${choreCompletions.memberId})::int`,
      })
      .from(choreCompletions)
      .where(and(
        eq(choreCompletions.householdId, householdId),
        gte(choreCompletions.completedAt, start),
        lte(choreCompletions.completedAt, end)
      ));

    // Per-member breakdown
    const memberBreakdown = await db
      .select({
        memberId: members.id,
        memberName: members.name,
        memberColor: members.color,
        memberRole: members.role,
        completions: sql<number>`count(${choreCompletions.id})::int`,
        points: sql<number>`coalesce(sum(${choreCompletions.pointsAwarded}), 0)::int`,
        currentStreak: members.streakCurrent,
        longestStreak: members.streakLongest,
      })
      .from(members)
      .leftJoin(
        choreCompletions,
        and(
          eq(choreCompletions.memberId, members.id),
          gte(choreCompletions.completedAt, start),
          lte(choreCompletions.completedAt, end)
        )
      )
      .where(and(
        eq(members.householdId, householdId),
        eq(members.isActive, true)
      ))
      .groupBy(members.id, members.name, members.color, members.role, members.streakCurrent, members.streakLongest)
      .orderBy(sql`count(${choreCompletions.id}) desc`);

    // Most completed chores
    const topChores = await db
      .select({
        choreId: chores.id,
        choreName: chores.title,
        choreCategory: chores.category,
        completions: sql<number>`count(*)::int`,
        totalPoints: sql<number>`coalesce(sum(${choreCompletions.pointsAwarded}), 0)::int`,
      })
      .from(choreCompletions)
      .innerJoin(chores, eq(choreCompletions.choreId, chores.id))
      .where(and(
        eq(choreCompletions.householdId, householdId),
        gte(choreCompletions.completedAt, start),
        lte(choreCompletions.completedAt, end)
      ))
      .groupBy(chores.id, chores.title, chores.category)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    return reply.send({
      period: {
        start,
        end,
        days: Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)),
      },
      overall: overallStats,
      members: memberBreakdown,
      topChores,
    });
  });

  // Get daily completion trend
  fastify.get('/trend', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const {
      startDate,
      endDate,
      memberId,
    } = request.query as {
      startDate?: string;
      endDate?: string;
      memberId?: string;
    };

    const isParent = await verifyParentMembership(user.id, householdId);
    if (!isParent) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can view reports',
      });
    }

    // Default to last 14 days
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 14 * 24 * 60 * 60 * 1000);

    const trend = await db
      .select({
        date: sql<string>`date(${choreCompletions.completedAt})`,
        completions: sql<number>`count(*)::int`,
        points: sql<number>`coalesce(sum(${choreCompletions.pointsAwarded}), 0)::int`,
      })
      .from(choreCompletions)
      .where(and(
        eq(choreCompletions.householdId, householdId),
        gte(choreCompletions.completedAt, start),
        lte(choreCompletions.completedAt, end),
        memberId ? eq(choreCompletions.memberId, memberId) : sql`1=1`
      ))
      .groupBy(sql`date(${choreCompletions.completedAt})`)
      .orderBy(sql`date(${choreCompletions.completedAt})`);

    // Fill in missing days with zeros
    const filledTrend = [];
    const currentDate = new Date(start);
    const trendMap = new Map(trend.map(t => [t.date, t]));

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existing = trendMap.get(dateStr);
      filledTrend.push({
        date: dateStr,
        completions: existing?.completions || 0,
        points: existing?.points || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return reply.send({
      period: { start, end },
      trend: filledTrend,
    });
  });

  // Get category breakdown
  fastify.get('/categories', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const {
      startDate,
      endDate,
    } = request.query as {
      startDate?: string;
      endDate?: string;
    };

    const isParent = await verifyParentMembership(user.id, householdId);
    if (!isParent) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can view reports',
      });
    }

    // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const categories = await db
      .select({
        category: chores.category,
        completions: sql<number>`count(*)::int`,
        points: sql<number>`coalesce(sum(${choreCompletions.pointsAwarded}), 0)::int`,
        uniqueChores: sql<number>`count(distinct ${chores.id})::int`,
      })
      .from(choreCompletions)
      .innerJoin(chores, eq(choreCompletions.choreId, chores.id))
      .where(and(
        eq(choreCompletions.householdId, householdId),
        gte(choreCompletions.completedAt, start),
        lte(choreCompletions.completedAt, end)
      ))
      .groupBy(chores.category)
      .orderBy(sql`count(*) desc`);

    return reply.send({
      period: { start, end },
      categories,
    });
  });

  // Export report data (CSV format)
  fastify.get('/export', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const {
      startDate,
      endDate,
      format = 'json',
    } = request.query as {
      startDate?: string;
      endDate?: string;
      format?: 'json' | 'csv';
    };

    const isParent = await verifyParentMembership(user.id, householdId);
    if (!isParent) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can export reports',
      });
    }

    // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all completions with details
    const completions = await db
      .select({
        completedAt: choreCompletions.completedAt,
        memberName: members.name,
        choreName: chores.title,
        category: chores.category,
        pointsAwarded: choreCompletions.pointsAwarded,
        status: choreCompletions.status,
      })
      .from(choreCompletions)
      .innerJoin(members, eq(choreCompletions.memberId, members.id))
      .innerJoin(chores, eq(choreCompletions.choreId, chores.id))
      .where(and(
        eq(choreCompletions.householdId, householdId),
        gte(choreCompletions.completedAt, start),
        lte(choreCompletions.completedAt, end)
      ))
      .orderBy(desc(choreCompletions.completedAt));

    if (format === 'csv') {
      // Generate CSV
      const headers = ['Date', 'Member', 'Chore', 'Category', 'Points', 'Status'];
      const rows = completions.map(c => [
        c.completedAt.toISOString(),
        c.memberName,
        c.choreName,
        c.category,
        c.pointsAwarded?.toString() || '0',
        c.status,
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(r => r.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="chorechamp-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv"`)
        .send(csv);
    }

    return reply.send({
      period: { start, end },
      completions,
    });
  });
}
