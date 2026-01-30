import { FastifyInstance } from 'fastify';
import { eq, and, desc, gte, sql } from 'drizzle-orm';
import { db } from '../lib/db';
import {
  choreCompletions,
  pointTransactions,
  members,
  chores,
} from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

interface ActivityItem {
  id: string;
  type: 'chore_completed' | 'chore_approved' | 'chore_rejected' | 'points_earned' | 'points_spent' | 'badge_earned' | 'streak_milestone';
  memberId: string;
  memberName: string;
  memberColor: string;
  title: string;
  description: string;
  points?: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

async function verifyMembership(
  userId: string,
  householdId: string
): Promise<typeof members.$inferSelect | null> {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(
      eq(members.householdId, householdId),
      eq(members.userId, userId)
    ));
  return membership || null;
}

export async function activityRoutes(fastify: FastifyInstance) {
  // Get activity feed for household
  fastify.get('/', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const {
      limit = 50,
      offset = 0,
      memberId,
      type,
      since,
    } = request.query as {
      limit?: number;
      offset?: number;
      memberId?: string;
      type?: string;
      since?: string;
    };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Build activity items from multiple sources
    const activities: ActivityItem[] = [];

    // Get completions with member and chore info
    const completionsQuery = db
      .select({
        id: choreCompletions.id,
        status: choreCompletions.status,
        memberId: choreCompletions.memberId,
        memberName: members.name,
        memberColor: members.color,
        choreId: choreCompletions.choreId,
        choreName: chores.title,
        pointsAwarded: choreCompletions.pointsAwarded,
        completedAt: choreCompletions.completedAt,
        approvedAt: choreCompletions.approvedAt,
      })
      .from(choreCompletions)
      .innerJoin(members, eq(choreCompletions.memberId, members.id))
      .innerJoin(chores, eq(choreCompletions.choreId, chores.id))
      .where(and(
        eq(choreCompletions.householdId, householdId),
        memberId ? eq(choreCompletions.memberId, memberId) : sql`1=1`,
        since ? gte(choreCompletions.completedAt, new Date(since)) : sql`1=1`
      ))
      .orderBy(desc(choreCompletions.completedAt))
      .limit(Number(limit))
      .offset(Number(offset));

    const completions = await completionsQuery;

    // Transform completions to activity items
    for (const completion of completions) {
      // Add completion activity
      activities.push({
        id: `completion-${completion.id}`,
        type: 'chore_completed',
        memberId: completion.memberId,
        memberName: completion.memberName,
        memberColor: completion.memberColor,
        title: `Completed "${completion.choreName}"`,
        description: completion.pointsAwarded
          ? `Earned ${completion.pointsAwarded} points`
          : 'Pending approval',
        points: completion.pointsAwarded || undefined,
        timestamp: completion.completedAt,
        metadata: {
          choreId: completion.choreId,
          status: completion.status,
        },
      });

      // Add approval activity if approved
      if (completion.status === 'approved' && completion.approvedAt) {
        activities.push({
          id: `approval-${completion.id}`,
          type: 'chore_approved',
          memberId: completion.memberId,
          memberName: completion.memberName,
          memberColor: completion.memberColor,
          title: `"${completion.choreName}" approved`,
          description: `${completion.pointsAwarded} points awarded`,
          points: completion.pointsAwarded || undefined,
          timestamp: completion.approvedAt,
          metadata: {
            choreId: completion.choreId,
          },
        });
      }
    }

    // Get point transactions (for bonus points, redemptions, etc.)
    if (!type || type === 'points_earned' || type === 'points_spent') {
      const transactions = await db
        .select({
          id: pointTransactions.id,
          memberId: pointTransactions.memberId,
          memberName: members.name,
          memberColor: members.color,
          amount: pointTransactions.amount,
          transactionType: pointTransactions.transactionType,
          description: pointTransactions.description,
          createdAt: pointTransactions.createdAt,
        })
        .from(pointTransactions)
        .innerJoin(members, eq(pointTransactions.memberId, members.id))
        .where(and(
          eq(pointTransactions.householdId, householdId),
          memberId ? eq(pointTransactions.memberId, memberId) : sql`1=1`,
          since ? gte(pointTransactions.createdAt, new Date(since)) : sql`1=1`
        ))
        .orderBy(desc(pointTransactions.createdAt))
        .limit(Number(limit));

      for (const tx of transactions) {
        // Skip chore completions (already handled above)
        if (tx.transactionType === 'chore_completion') continue;

        const isEarning = tx.amount > 0;
        activities.push({
          id: `transaction-${tx.id}`,
          type: isEarning ? 'points_earned' : 'points_spent',
          memberId: tx.memberId,
          memberName: tx.memberName,
          memberColor: tx.memberColor,
          title: tx.description || (isEarning ? 'Points earned' : 'Points spent'),
          description: `${isEarning ? '+' : ''}${tx.amount} points`,
          points: tx.amount,
          timestamp: tx.createdAt!,
          metadata: {
            transactionType: tx.transactionType,
          },
        });
      }
    }

    // Sort all activities by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply type filter if specified
    let filteredActivities = activities;
    if (type) {
      filteredActivities = activities.filter(a => a.type === type);
    }

    // Apply pagination
    const paginatedActivities = filteredActivities.slice(0, Number(limit));

    return reply.send({
      activities: paginatedActivities,
      total: filteredActivities.length,
      hasMore: filteredActivities.length > Number(limit),
    });
  });

  // Get activity stats summary
  fastify.get('/stats', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const { period = 'week' } = request.query as { period?: 'day' | 'week' | 'month' };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'week':
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
    }

    // Get completion stats
    const [completionStats] = await db
      .select({
        totalCompleted: sql<number>`count(*)::int`,
        totalPoints: sql<number>`coalesce(sum(${choreCompletions.pointsAwarded}), 0)::int`,
        pendingApprovals: sql<number>`count(*) filter (where ${choreCompletions.status} = 'pending')::int`,
      })
      .from(choreCompletions)
      .where(and(
        eq(choreCompletions.householdId, householdId),
        gte(choreCompletions.completedAt, startDate)
      ));

    // Get per-member stats
    const memberStats = await db
      .select({
        memberId: members.id,
        memberName: members.name,
        memberColor: members.color,
        completedCount: sql<number>`count(${choreCompletions.id})::int`,
        pointsEarned: sql<number>`coalesce(sum(${choreCompletions.pointsAwarded}), 0)::int`,
      })
      .from(members)
      .leftJoin(
        choreCompletions,
        and(
          eq(choreCompletions.memberId, members.id),
          gte(choreCompletions.completedAt, startDate)
        )
      )
      .where(and(
        eq(members.householdId, householdId),
        eq(members.isActive, true)
      ))
      .groupBy(members.id, members.name, members.color)
      .orderBy(sql`count(${choreCompletions.id}) desc`);

    return reply.send({
      period,
      startDate,
      summary: {
        totalCompleted: completionStats?.totalCompleted || 0,
        totalPoints: completionStats?.totalPoints || 0,
        pendingApprovals: completionStats?.pendingApprovals || 0,
      },
      memberStats,
    });
  });
}
