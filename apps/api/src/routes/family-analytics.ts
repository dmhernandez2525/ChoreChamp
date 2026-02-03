import { FastifyInstance } from 'fastify';
import { db } from '@chorechamp/database';
import { members, households } from '@chorechamp/database/schema';
import { eq, and } from 'drizzle-orm';
import type {
  FamilyAnalytics,
  AnalyticsPeriod,
  MemberInsight,
  InsightRecommendation,
  AnalyticsExport,
  PeriodComparison,
} from '@chorechamp/types';
import {
  calculateFairnessScore,
  getPeriodDays,
  GetAnalyticsRequestSchema,
  ExportAnalyticsRequestSchema,
  ComparePeriodsRequestSchema,
} from '@chorechamp/types';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { randomUUID } from 'crypto';
import { getEffectiveTierForHousehold, isTierAtLeast } from '../lib/subscription';

// Helper to verify membership
async function verifyMembership(
  userId: string,
  householdId: string
): Promise<typeof members.$inferSelect | null> {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(eq(members.householdId, householdId), eq(members.userId, userId)));
  return membership || null;
}

async function verifyPremiumAccess(householdId: string): Promise<boolean> {
  const [household] = await db.select().from(households).where(eq(households.id, householdId));
  if (!household) return false;
  const effectiveTier = getEffectiveTierForHousehold(household);
  return isTierAtLeast(effectiveTier, 'premium');
}

// Generate mock analytics data
function generateAnalytics(
  householdId: string,
  period: AnalyticsPeriod,
  householdMembers: (typeof members.$inferSelect)[]
): FamilyAnalytics {
  const days = getPeriodDays(period);
  const multiplier = days === -1 ? 365 : days;

  // Generate member insights
  const memberInsights: MemberInsight[] = householdMembers.map((m, index) => {
    const baseChores = Math.floor(15 + Math.random() * 20);
    const completed = Math.floor(baseChores * (0.7 + Math.random() * 0.25));
    const points = completed * (10 + Math.floor(Math.random() * 15));

    return {
      memberId: m.id,
      memberName: m.name,
      avatarUrl: m.avatarUrl || undefined,
      role: m.role,
      choresCompleted: completed * (multiplier / 30),
      choresAssigned: baseChores * (multiplier / 30),
      completionRate: Math.round((completed / baseChores) * 100),
      pointsEarned: points * (multiplier / 30),
      currentStreak: Math.floor(Math.random() * 14) + 1,
      longestStreak: Math.floor(Math.random() * 30) + 7,
      preferredChoreTypes: ['Cleaning', 'Kitchen', 'Outdoor'].slice(0, Math.floor(Math.random() * 3) + 1),
      mostProductiveDay: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][Math.floor(Math.random() * 7)],
      mostProductiveTime: ['Morning', 'Afternoon', 'Evening'][Math.floor(Math.random() * 3)],
      averageCompletionTime: Math.floor(15 + Math.random() * 30),
      badgesEarned: Math.floor(Math.random() * 10) + 1,
      challengesWon: Math.floor(Math.random() * 5),
      performanceTrend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)] as 'improving' | 'stable' | 'declining',
      trendPercentage: Math.floor(Math.random() * 20) - 10,
      rank: index + 1,
      rankChange: Math.floor(Math.random() * 3) - 1,
    };
  });

  // Sort by completion rate for ranking
  memberInsights.sort((a, b) => b.completionRate - a.completionRate);
  memberInsights.forEach((m, i) => {
    m.rank = i + 1;
  });

  // Calculate totals
  const totalCompleted = memberInsights.reduce((sum, m) => sum + m.choresCompleted, 0);
  const totalAssigned = memberInsights.reduce((sum, m) => sum + m.choresAssigned, 0);
  const totalPoints = memberInsights.reduce((sum, m) => sum + m.pointsEarned, 0);

  // Generate daily trend data
  const dailyCompletions = Array.from({ length: Math.min(days === -1 ? 30 : days, 30) }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toISOString().split('T')[0],
      value: Math.floor(5 + Math.random() * 15),
    };
  }).reverse();

  // Generate chore distribution
  const choreDistribution = memberInsights.map((m) => ({
    memberId: m.memberId,
    memberName: m.memberName,
    totalChores: m.choresCompleted,
    totalPoints: m.pointsEarned,
    choresByCategory: {
      Cleaning: Math.floor(m.choresCompleted * 0.3),
      Kitchen: Math.floor(m.choresCompleted * 0.25),
      Outdoor: Math.floor(m.choresCompleted * 0.2),
      Organization: Math.floor(m.choresCompleted * 0.15),
      Other: Math.floor(m.choresCompleted * 0.1),
    },
    percentage: Math.round((m.choresCompleted / Math.max(totalCompleted, 1)) * 100),
  }));

  // Generate recommendations
  const recommendations: InsightRecommendation[] = [
    {
      id: randomUUID(),
      type: 'celebration',
      priority: 'medium',
      title: 'Great Week!',
      description: `Your household completed ${totalCompleted} chores this period. That's ${Math.floor(Math.random() * 20) + 5}% more than last period!`,
      actionable: false,
    },
    {
      id: randomUUID(),
      type: 'suggestion',
      priority: 'low',
      title: 'Balance Opportunity',
      description: 'Consider redistributing some chores for a more even workload across family members.',
      actionable: true,
      action: {
        label: 'View Distribution',
        type: 'navigate',
        payload: { screen: 'choreDistribution' },
      },
    },
  ];

  // Add member-specific recommendations
  const topPerformer = memberInsights[0];
  if (topPerformer) {
    recommendations.push({
      id: randomUUID(),
      type: 'celebration',
      priority: 'high',
      title: 'Star Performer',
      description: `${topPerformer.memberName} has the highest completion rate at ${topPerformer.completionRate}%!`,
      targetMemberId: topPerformer.memberId,
      targetMemberName: topPerformer.memberName,
      actionable: true,
      action: {
        label: 'Send Appreciation',
        type: 'reward',
        payload: { memberId: topPerformer.memberId },
      },
    });
  }

  const analytics: FamilyAnalytics = {
    householdId,
    period,
    generatedAt: new Date().toISOString(),
    overview: {
      totalChoresCompleted: totalCompleted,
      totalChoresAssigned: totalAssigned,
      completionRate: totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0,
      totalPointsEarned: totalPoints,
      averageChoresPerDay: totalCompleted / (days === -1 ? 365 : days),
      activeMemberCount: memberInsights.length,
      currentHouseholdStreak: Math.floor(Math.random() * 10) + 1,
      longestHouseholdStreak: Math.floor(Math.random() * 30) + 10,
      comparisonToPrevious: {
        choresCompleted: Math.floor(Math.random() * 30) - 15,
        completionRate: Math.floor(Math.random() * 20) - 10,
        pointsEarned: Math.floor(Math.random() * 25) - 12,
      },
    },
    memberInsights,
    trends: {
      dailyCompletions,
      weeklyComparison: Array.from({ length: 4 }, (_, i) => ({
        week: `Week ${4 - i}`,
        choresCompleted: Math.floor(20 + Math.random() * 30),
        pointsEarned: Math.floor(200 + Math.random() * 300),
        completionRate: Math.floor(70 + Math.random() * 25),
      })),
      peakHours: [
        { label: 'Morning (6-12)', value: 35, percentage: 35 },
        { label: 'Afternoon (12-18)', value: 40, percentage: 40 },
        { label: 'Evening (18-24)', value: 25, percentage: 25 },
      ],
      peakDays: [
        { label: 'Monday', value: 12, percentage: 12 },
        { label: 'Tuesday', value: 10, percentage: 10 },
        { label: 'Wednesday', value: 14, percentage: 14 },
        { label: 'Thursday', value: 11, percentage: 11 },
        { label: 'Friday', value: 13, percentage: 13 },
        { label: 'Saturday', value: 22, percentage: 22 },
        { label: 'Sunday', value: 18, percentage: 18 },
      ],
      categoryDistribution: [
        { category: 'Cleaning', count: Math.floor(totalCompleted * 0.3), percentage: 30, averagePoints: 15 },
        { category: 'Kitchen', count: Math.floor(totalCompleted * 0.25), percentage: 25, averagePoints: 12 },
        { category: 'Outdoor', count: Math.floor(totalCompleted * 0.2), percentage: 20, averagePoints: 20 },
        { category: 'Organization', count: Math.floor(totalCompleted * 0.15), percentage: 15, averagePoints: 18 },
        { category: 'Other', count: Math.floor(totalCompleted * 0.1), percentage: 10, averagePoints: 10 },
      ],
    },
    choreAnalysis: {
      mostCompletedChores: [
        { choreId: '1', choreName: 'Make Bed', category: 'Bedroom', completionCount: 45, skipCount: 5, averageCompletionTime: 5, assignedTo: ['All'] },
        { choreId: '2', choreName: 'Dishes', category: 'Kitchen', completionCount: 40, skipCount: 8, averageCompletionTime: 15, assignedTo: ['All'] },
        { choreId: '3', choreName: 'Vacuum', category: 'Cleaning', completionCount: 12, skipCount: 2, averageCompletionTime: 25, assignedTo: ['Parents'] },
      ],
      leastCompletedChores: [
        { choreId: '4', choreName: 'Clean Garage', category: 'Outdoor', completionCount: 2, skipCount: 6, averageCompletionTime: 60, assignedTo: ['Dad'] },
        { choreId: '5', choreName: 'Windows', category: 'Cleaning', completionCount: 3, skipCount: 5, averageCompletionTime: 45, assignedTo: ['All'] },
      ],
      mostSkippedChores: [
        { choreId: '4', choreName: 'Clean Garage', category: 'Outdoor', completionCount: 2, skipCount: 6, averageCompletionTime: 60, assignedTo: ['Dad'] },
      ],
      fastestCompletedChores: [
        { choreId: '1', choreName: 'Make Bed', category: 'Bedroom', completionCount: 45, skipCount: 5, averageCompletionTime: 5, assignedTo: ['All'] },
      ],
      slowestCompletedChores: [
        { choreId: '4', choreName: 'Clean Garage', category: 'Outdoor', completionCount: 2, skipCount: 6, averageCompletionTime: 60, assignedTo: ['Dad'] },
      ],
      choreDistribution,
      fairnessScore: calculateFairnessScore(choreDistribution),
    },
    engagement: {
      activeUsers: memberInsights.length,
      averageSessionDuration: Math.floor(5 + Math.random() * 10),
      loginFrequency: Object.fromEntries(memberInsights.map((m) => [m.memberId, Math.floor(5 + Math.random() * 20)])),
      featureUsage: [
        { feature: 'Chore Completion', usageCount: totalCompleted, uniqueUsers: memberInsights.length, trend: 'increasing' as const },
        { feature: 'Point Redemption', usageCount: Math.floor(totalPoints * 0.3), uniqueUsers: Math.ceil(memberInsights.length * 0.7), trend: 'stable' as const },
        { feature: 'Challenges', usageCount: Math.floor(Math.random() * 20), uniqueUsers: Math.ceil(memberInsights.length * 0.6), trend: 'increasing' as const },
      ],
      gamificationEngagement: {
        pointsRedeemed: Math.floor(totalPoints * 0.3),
        rewardsClaimedCount: Math.floor(Math.random() * 10),
        challengesParticipated: Math.floor(Math.random() * 5),
        achievementsUnlocked: memberInsights.reduce((sum, m) => sum + m.badgesEarned, 0),
      },
      tradeProposals: Math.floor(Math.random() * 15),
      tradeAcceptanceRate: Math.floor(60 + Math.random() * 30),
      choreSwapsCompleted: Math.floor(Math.random() * 10),
    },
    recommendations,
  };

  return analytics;
}

export async function familyAnalyticsRoutes(fastify: FastifyInstance) {
  // GET /api/households/:householdId/analytics - Get analytics
  fastify.get('/', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const parseResult = GetAnalyticsRequestSchema.safeParse(request.query);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: 'Invalid query parameters',
        details: parseResult.error.flatten(),
      });
    }
    const query = parseResult.data;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    // Parents only for full analytics
    if (membership.role !== 'parent' && membership.role !== 'admin') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Analytics require parent access' });
    }

    const hasPremium = await verifyPremiumAccess(householdId);
    if (!hasPremium) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Advanced analytics are available on Premium.' });
    }

    // Get household members
    const householdMembers = await db.query.members.findMany({
      where: eq(members.householdId, householdId),
    });

    const period = query.period || 'month';
    const analytics = generateAnalytics(householdId, period, householdMembers);

    return analytics;
  });

  // GET /api/households/:householdId/analytics/member/:memberId - Get member analytics
  fastify.get('/member/:memberId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };
    const query = request.query as { period?: AnalyticsPeriod };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    // Can view own or parents can view any
    if (membership.id !== memberId && membership.role !== 'parent' && membership.role !== 'admin') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Cannot view other member analytics' });
    }

    const hasPremium = await verifyPremiumAccess(householdId);
    if (!hasPremium) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Advanced analytics are available on Premium.' });
    }

    const householdMembers = await db.query.members.findMany({
      where: eq(members.householdId, householdId),
    });

    const period = query.period || 'month';
    const analytics = generateAnalytics(householdId, period, householdMembers);
    const memberInsight = analytics.memberInsights.find((m) => m.memberId === memberId);

    if (!memberInsight) {
      return reply.status(404).send({ error: 'Member not found' });
    }

    return { member: memberInsight, period };
  });

  // GET /api/households/:householdId/analytics/compare - Compare periods
  fastify.get('/compare', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const parseResult = ComparePeriodsRequestSchema.safeParse(request.query);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: 'Invalid query parameters',
        details: parseResult.error.flatten(),
      });
    }
    const query = parseResult.data;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership || (membership.role !== 'parent' && membership.role !== 'admin')) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Analytics require parent access' });
    }

    const hasPremium = await verifyPremiumAccess(householdId);
    if (!hasPremium) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Advanced analytics are available on Premium.' });
    }

    const householdMembers = await db.query.members.findMany({
      where: eq(members.householdId, householdId),
    });

    const period1 = query.period1 || 'week';
    const period2 = query.period2 || 'month';

    const analytics1 = generateAnalytics(householdId, period1, householdMembers);
    const analytics2 = generateAnalytics(householdId, period2, householdMembers);

    const comparison: PeriodComparison = {
      period1: analytics1,
      period2: analytics2,
      changes: {
        choresCompleted: {
          absolute: analytics1.overview.totalChoresCompleted - analytics2.overview.totalChoresCompleted,
          percentage: analytics2.overview.totalChoresCompleted > 0
            ? ((analytics1.overview.totalChoresCompleted - analytics2.overview.totalChoresCompleted) / analytics2.overview.totalChoresCompleted) * 100
            : 0,
        },
        completionRate: {
          absolute: analytics1.overview.completionRate - analytics2.overview.completionRate,
          percentage: analytics2.overview.completionRate > 0
            ? ((analytics1.overview.completionRate - analytics2.overview.completionRate) / analytics2.overview.completionRate) * 100
            : 0,
        },
        pointsEarned: {
          absolute: analytics1.overview.totalPointsEarned - analytics2.overview.totalPointsEarned,
          percentage: analytics2.overview.totalPointsEarned > 0
            ? ((analytics1.overview.totalPointsEarned - analytics2.overview.totalPointsEarned) / analytics2.overview.totalPointsEarned) * 100
            : 0,
        },
        activeMemberCount: {
          absolute: analytics1.overview.activeMemberCount - analytics2.overview.activeMemberCount,
          percentage: analytics2.overview.activeMemberCount > 0
            ? ((analytics1.overview.activeMemberCount - analytics2.overview.activeMemberCount) / analytics2.overview.activeMemberCount) * 100
            : 0,
        },
      },
      insights: [
        `Chore completion ${analytics1.overview.totalChoresCompleted > analytics2.overview.totalChoresCompleted ? 'increased' : 'decreased'} compared to the previous period.`,
        `The household maintained a ${analytics1.overview.completionRate}% completion rate.`,
      ],
    };

    return comparison;
  });

  // POST /api/households/:householdId/analytics/export - Export analytics
  fastify.post('/export', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const parseResult = ExportAnalyticsRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: 'Invalid request body',
        details: parseResult.error.flatten(),
      });
    }
    const body = parseResult.data;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership || (membership.role !== 'parent' && membership.role !== 'admin')) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Export requires parent access' });
    }

    const hasPremium = await verifyPremiumAccess(householdId);
    if (!hasPremium) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Advanced analytics are available on Premium.' });
    }

    // In a real implementation, this would generate a file
    const exportData: AnalyticsExport = {
      format: body.format,
      period: body.period,
      sections: body.sections,
      generatedAt: new Date().toISOString(),
      downloadUrl: `/api/households/${householdId}/analytics/download/${randomUUID()}`,
    };

    return { success: true, export: exportData };
  });

  // GET /api/households/:householdId/analytics/recommendations - Get recommendations
  fastify.get('/recommendations', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const hasPremium = await verifyPremiumAccess(householdId);
    if (!hasPremium) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Advanced analytics are available on Premium.' });
    }

    // Generate recommendations
    const recommendations: InsightRecommendation[] = [
      {
        id: randomUUID(),
        type: 'improvement',
        priority: 'medium',
        title: 'Optimize Morning Routine',
        description: 'Most chores are completed in the afternoon. Consider shifting some tasks to morning for better distribution.',
        actionable: true,
        action: {
          label: 'Adjust Schedule',
          type: 'navigate',
          payload: { screen: 'schedule' },
        },
      },
      {
        id: randomUUID(),
        type: 'suggestion',
        priority: 'low',
        title: 'Try New Challenges',
        description: 'Your household hasn\'t participated in a challenge recently. Challenges boost engagement and fun!',
        actionable: true,
        action: {
          label: 'View Challenges',
          type: 'navigate',
          payload: { screen: 'challenges' },
        },
      },
      {
        id: randomUUID(),
        type: 'celebration',
        priority: 'high',
        title: 'Streak Achievement',
        description: 'Your household has maintained an active streak for 7 days! Keep it going!',
        actionable: false,
      },
    ];

    return { recommendations };
  });
}
