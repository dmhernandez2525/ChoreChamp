import { FastifyInstance } from 'fastify';
import { db } from '@chorechamp/database';
import {
  members,
  choreCompletions,
  choreSchedules,
  choreTrades,
  allowancePayouts,
  rewardRedemptions,
  households,
  chores,
} from '@chorechamp/database/schema';
import { eq, and, gte, lte, desc, count } from 'drizzle-orm';
import type {
  DashboardSummary,
  MemberDashboardData,
  DashboardTrend,
  DashboardInsight,
  ParentDashboard,
} from '@chorechamp/types';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership } from '../lib/membership';
import { validateUUID } from '../lib/validate-params';

// Helper to get date range based on period
function getDateRange(period: string): { start: Date; end: Date; label: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  let label = '';

  switch (period) {
    case 'day':
      label = 'Today';
      break;
    case 'week':
      start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
      label = 'This Week';
      break;
    case 'month':
      start.setDate(1);
      label = 'This Month';
      break;
    case 'year':
      start.setMonth(0, 1);
      label = 'This Year';
      break;
    default:
      start.setDate(start.getDate() - start.getDay());
      label = 'This Week';
  }

  return { start, end, label };
}

export async function dashboardRoutes(fastify: FastifyInstance) {
  // GET /api/households/:householdId/dashboard - Get parent dashboard
  fastify.get('/', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    validateUUID(householdId, 'householdId');
    const query = request.query as { period?: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Only parents can access the full dashboard
    if (membership.role !== 'parent') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can access the dashboard',
      });
    }

    const period = query.period || 'week';
    const { start, end, label } = getDateRange(period);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    // Get household info
    const household = await db.query.households.findFirst({
      where: eq(households.id, householdId),
    });

    // Get all household members
    const householdMembers = await db.query.members.findMany({
      where: eq(members.householdId, householdId),
    });

    const childMembers = householdMembers.filter(
      (m) => m.role === 'child' || m.role === 'teen'
    );

    // Get completions in period
    const completions = await db.query.choreCompletions.findMany({
      where: and(
        eq(choreCompletions.householdId, householdId),
        gte(choreCompletions.completedAt, start),
        lte(choreCompletions.completedAt, end)
      ),
    });

    // Get scheduled chores in period
    const schedules = await db.query.choreSchedules.findMany({
      where: and(
        eq(choreSchedules.householdId, householdId),
        gte(choreSchedules.scheduledDate, startStr),
        lte(choreSchedules.scheduledDate, endStr)
      ),
    });

    // Calculate summary stats
    const totalChoresCompleted = completions.filter((c) => c.status === 'approved' || c.status === 'pending').length;
    const totalChoresScheduled = schedules.length;
    const completionRate = totalChoresScheduled > 0
      ? Math.round((totalChoresCompleted / totalChoresScheduled) * 100)
      : 0;
    const totalPointsAwarded = completions.reduce((sum, c) => sum + (c.pointsAwarded || 0), 0);

    // Get pending approvals
    const pendingApprovals = await db.select({ count: count() })
      .from(choreCompletions)
      .where(and(
        eq(choreCompletions.householdId, householdId),
        eq(choreCompletions.status, 'pending')
      ));

    // Get pending redemptions
    const pendingRedemptions = await db.select({ count: count() })
      .from(rewardRedemptions)
      .where(and(
        eq(rewardRedemptions.householdId, householdId),
        eq(rewardRedemptions.status, 'pending')
      ));

    // Get pending trades
    const pendingTrades = await db.select({ count: count() })
      .from(choreTrades)
      .where(and(
        eq(choreTrades.householdId, householdId),
        eq(choreTrades.status, 'pending_approval')
      ));

    // Get pending payouts
    const pendingPayouts = await db.select({ count: count() })
      .from(allowancePayouts)
      .where(and(
        eq(allowancePayouts.householdId, householdId),
        eq(allowancePayouts.status, 'pending')
      ));

    // Get rewards redeemed count
    const redemptionsInPeriod = await db.select({ count: count() })
      .from(rewardRedemptions)
      .where(and(
        eq(rewardRedemptions.householdId, householdId),
        eq(rewardRedemptions.status, 'approved'),
        gte(rewardRedemptions.requestedAt, start),
        lte(rewardRedemptions.requestedAt, end)
      ));

    // Calculate top performers
    const memberStats = new Map<string, { completed: number; points: number }>();
    for (const completion of completions) {
      if (completion.status !== 'rejected') {
        const stats = memberStats.get(completion.memberId) || { completed: 0, points: 0 };
        stats.completed += 1;
        stats.points += completion.pointsAwarded || 0;
        memberStats.set(completion.memberId, stats);
      }
    }

    const topPerformers = childMembers
      .map((member) => {
        const stats = memberStats.get(member.id) || { completed: 0, points: 0 };
        return {
          memberId: member.id,
          memberName: member.name,
          memberColor: member.color,
          choresCompleted: stats.completed,
          pointsEarned: stats.points,
        };
      })
      .sort((a, b) => b.choresCompleted - a.choresCompleted)
      .slice(0, 5);

    const summary: DashboardSummary = {
      period: { start: startStr, end: endStr, label },
      totalChoresCompleted,
      totalChoresScheduled,
      completionRate,
      totalPointsAwarded,
      totalRewardsRedeemed: Number(redemptionsInPeriod[0]?.count || 0),
      pendingApprovals: Number(pendingApprovals[0]?.count || 0),
      pendingRedemptions: Number(pendingRedemptions[0]?.count || 0),
      pendingTrades: Number(pendingTrades[0]?.count || 0),
      pendingPayouts: Number(pendingPayouts[0]?.count || 0),
      familyStreak: household?.currentFamilyStreak || 0,
      longestFamilyStreak: household?.longestFamilyStreak || 0,
      topPerformers,
    };

    // Get member data for each child
    const memberData: MemberDashboardData[] = await Promise.all(
      childMembers.map(async (member) => {
        // Get member's completions
        const memberCompletions = completions.filter((c) => c.memberId === member.id);
        const memberSchedules = schedules.filter((s) => s.assignedTo === member.id);

        const choresCompleted = memberCompletions.filter((c) => c.status !== 'rejected').length;
        const choresAssigned = memberSchedules.length;
        const completionRateMember = choresAssigned > 0
          ? Math.round((choresCompleted / choresAssigned) * 100)
          : 0;
        const pointsEarned = memberCompletions.reduce((sum, c) => sum + (c.pointsAwarded || 0), 0);

        // Get recent completions with chore details
        const recentCompletionsRaw = await db.query.choreCompletions.findMany({
          where: eq(choreCompletions.memberId, member.id),
          orderBy: desc(choreCompletions.completedAt),
          limit: 5,
        });

        const recentCompletions = await Promise.all(
          recentCompletionsRaw.map(async (c) => {
            const chore = await db.query.chores.findFirst({
              where: eq(chores.id, c.choreId),
              columns: { title: true, icon: true },
            });
            return {
              id: c.id,
              choreTitle: chore?.title || 'Unknown',
              choreIcon: chore?.icon || '✅',
              completedAt: c.completedAt,
              pointsAwarded: c.pointsAwarded || 0,
              status: c.status || 'pending',
            };
          })
        );

        // Calculate weekly completion trend (last 7 days)
        const weeklyCompletion: Array<{ date: string; completed: number; scheduled: number }> = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];

          const dayCompletions = memberCompletions.filter((c) => {
            const cDate = new Date(c.completedAt).toISOString().split('T')[0];
            return cDate === dateStr && c.status !== 'rejected';
          }).length;

          const dayScheduled = memberSchedules.filter((s) => s.scheduledDate === dateStr).length;

          weeklyCompletion.push({
            date: dateStr,
            completed: dayCompletions,
            scheduled: dayScheduled,
          });
        }

        return {
          memberId: member.id,
          memberName: member.name,
          memberColor: member.color,
          role: member.role,
          choresCompleted,
          choresAssigned,
          completionRate: completionRateMember,
          pointsCurrent: member.pointsCurrent || 0,
          pointsEarned,
          currentStreak: member.streakCurrent || 0,
          longestStreak: member.streakLongest || 0,
          recentCompletions,
          weeklyCompletion,
        };
      })
    );

    // Calculate daily trends for the period
    const trends: DashboardTrend[] = [];
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysToShow = Math.min(daysDiff, 30);

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(end);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayCompletions = completions.filter((c) => {
        const cDate = new Date(c.completedAt).toISOString().split('T')[0];
        return cDate === dateStr && c.status !== 'rejected';
      });

      trends.push({
        date: dateStr,
        completions: dayCompletions.length,
        points: dayCompletions.reduce((sum, c) => sum + (c.pointsAwarded || 0), 0),
      });
    }

    // Generate insights
    const insights: DashboardInsight[] = [];

    // Check for streak achievements
    for (const member of childMembers) {
      const streakCurrent = member.streakCurrent || 0;
      if (streakCurrent >= 7 && streakCurrent % 7 === 0) {
        insights.push({
          type: 'achievement',
          title: 'Week Streak!',
          message: `${member.name} has maintained a ${streakCurrent}-day streak!`,
          memberId: member.id,
          memberName: member.name,
        });
      }
    }

    // Check for low completion rates
    for (const data of memberData) {
      if (data.completionRate < 50 && data.choresAssigned >= 3) {
        insights.push({
          type: 'warning',
          title: 'Low Completion Rate',
          message: `${data.memberName} has only completed ${data.completionRate}% of assigned chores this ${period}`,
          memberId: data.memberId,
          memberName: data.memberName,
          actionLabel: 'View Details',
        });
      }
    }

    // Check for pending actions
    if (summary.pendingApprovals > 0) {
      insights.push({
        type: 'suggestion',
        title: 'Approvals Needed',
        message: `${summary.pendingApprovals} chore completion${summary.pendingApprovals !== 1 ? 's' : ''} waiting for approval`,
        actionLabel: 'Review',
      });
    }

    // Celebrate high performers
    const highPerformer = topPerformers[0];
    if (highPerformer && highPerformer.choresCompleted >= 5) {
      insights.push({
        type: 'celebration',
        title: 'Star Performer!',
        message: `${highPerformer.memberName} leads with ${highPerformer.choresCompleted} chores completed!`,
        memberId: highPerformer.memberId,
        memberName: highPerformer.memberName,
      });
    }

    const dashboard: ParentDashboard = {
      summary,
      memberData,
      trends,
      insights,
    };

    return dashboard;
  });

  // GET /api/households/:householdId/dashboard/member/:memberId - Get specific member dashboard data
  fastify.get('/member/:memberId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };
    validateUUID(householdId, 'householdId');
    validateUUID(memberId, 'memberId');
    const query = request.query as { period?: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Parents can view any member, others can only view themselves
    if (membership.role !== 'parent' && membership.id !== memberId) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only view your own data',
      });
    }

    const member = await db.query.members.findFirst({
      where: and(
        eq(members.id, memberId),
        eq(members.householdId, householdId)
      ),
    });

    if (!member) {
      return reply.status(404).send({ error: 'Member not found' });
    }

    const period = query.period || 'week';
    const { start, end } = getDateRange(period);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    // Get member's completions
    const completions = await db.query.choreCompletions.findMany({
      where: and(
        eq(choreCompletions.memberId, memberId),
        gte(choreCompletions.completedAt, start),
        lte(choreCompletions.completedAt, end)
      ),
    });

    // Get member's schedules
    const schedules = await db.query.choreSchedules.findMany({
      where: and(
        eq(choreSchedules.assignedTo, memberId),
        gte(choreSchedules.scheduledDate, startStr),
        lte(choreSchedules.scheduledDate, endStr)
      ),
    });

    const choresCompleted = completions.filter((c) => c.status !== 'rejected').length;
    const choresAssigned = schedules.length;
    const completionRateMember = choresAssigned > 0
      ? Math.round((choresCompleted / choresAssigned) * 100)
      : 0;
    const pointsEarned = completions.reduce((sum, c) => sum + (c.pointsAwarded || 0), 0);

    // Get recent completions with chore details
    const recentCompletionsRaw = await db.query.choreCompletions.findMany({
      where: eq(choreCompletions.memberId, memberId),
      orderBy: desc(choreCompletions.completedAt),
      limit: 10,
    });

    const recentCompletions = await Promise.all(
      recentCompletionsRaw.map(async (c) => {
        const chore = await db.query.chores.findFirst({
          where: eq(chores.id, c.choreId),
          columns: { title: true, icon: true },
        });
        return {
          id: c.id,
          choreTitle: chore?.title || 'Unknown',
          choreIcon: chore?.icon || '✅',
          completedAt: c.completedAt,
          pointsAwarded: c.pointsAwarded || 0,
          status: c.status || 'pending',
        };
      })
    );

    // Calculate weekly completion trend
    const weeklyCompletion: Array<{ date: string; completed: number; scheduled: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayCompletions = completions.filter((c) => {
        const cDate = new Date(c.completedAt).toISOString().split('T')[0];
        return cDate === dateStr && c.status !== 'rejected';
      }).length;

      const dayScheduled = schedules.filter((s) => s.scheduledDate === dateStr).length;

      weeklyCompletion.push({
        date: dateStr,
        completed: dayCompletions,
        scheduled: dayScheduled,
      });
    }

    const data: MemberDashboardData = {
      memberId: member.id,
      memberName: member.name,
      memberColor: member.color,
      role: member.role,
      choresCompleted,
      choresAssigned,
      completionRate: completionRateMember,
      pointsCurrent: member.pointsCurrent || 0,
      pointsEarned,
      currentStreak: member.streakCurrent || 0,
      longestStreak: member.streakLongest || 0,
      recentCompletions,
      weeklyCompletion,
    };

    return data;
  });
}
