import { FastifyInstance } from 'fastify';
import { db } from '@chorechamp/database';
import { members, choreSchedules } from '@chorechamp/database/schema';
import { eq, and } from 'drizzle-orm';
import type {
  StreakHealth,
  StreakRiskLevel,
  RiskFactor,
  StreakPrediction,
  StreakAlert,
  StreakProtectionSettings,
  StreakAnalytics,
  HouseholdStreakSummary,
  StreakProtectionAction,
  UpdateProtectionSettingsRequest,
  UseStreakFreezeRequest,
  DismissAlertRequest,
} from '@chorechamp/types';
import { getRiskLevelFromScore, getNextMilestone } from '@chorechamp/types';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

// In-memory storage (in production, use database)
const protectionSettings = new Map<string, StreakProtectionSettings>();
const streakAlerts = new Map<string, StreakAlert[]>();

// Helper to verify membership
async function verifyMembership(
  userId: string,
  householdId: string
): Promise<typeof members.$inferSelect | null> {
  const [membership] = await db
    .select()
    .from(members)
    .where(
      and(eq(members.householdId, householdId), eq(members.userId, userId))
    );
  return membership || null;
}

// Get default settings
function getDefaultSettings(): StreakProtectionSettings {
  return {
    enabled: true,
    alertThreshold: 'medium',
    autoFreeze: false,
    autoFreezeThreshold: 80,
    reminderBuffer: 4,
    notifyParents: true,
    customReminderTimes: ['16:00', '19:00'],
    weekendExempt: false,
    vacationMode: false,
    vacationEndDate: null,
  };
}

// Calculate risk factors for a member
function calculateRiskFactors(
  member: typeof members.$inferSelect,
  pendingChores: number,
  hoursUntilMidnight: number
): { factors: RiskFactor[]; score: number } {
  const factors: RiskFactor[] = [];
  let score = 0;

  const today = new Date();
  const dayOfWeek = today.getDay();
  const lastCompleted = member.streakLastCompletedDate
    ? new Date(member.streakLastCompletedDate)
    : null;

  // Time running out
  if (hoursUntilMidnight < 4) {
    factors.push('time_running_out');
    score += 30;
  } else if (hoursUntilMidnight < 8) {
    score += 15;
  }

  // Multiple pending chores
  if (pendingChores > 3) {
    factors.push('multiple_chores_pending');
    score += 20;
  } else if (pendingChores > 1) {
    score += 10;
  }

  // Weekend pattern (typically lower completion)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    factors.push('weekend_pattern');
    score += 15;
  }

  // No activity today yet
  if (!lastCompleted || lastCompleted.toDateString() !== today.toDateString()) {
    if (hoursUntilMidnight < 6) {
      factors.push('low_activity_pattern');
      score += 25;
    }
  }

  // Long streak at risk (higher stakes)
  const streakCurrent = member.streakCurrent || 0;
  if (streakCurrent >= 30) {
    score += 10; // Extra pressure for long streaks
  } else if (streakCurrent >= 7) {
    score += 5;
  }

  return { factors, score: Math.min(100, score) };
}

// Generate protection actions
function generateProtectionActions(
  riskLevel: StreakRiskLevel,
  freezesAvailable: number,
  pendingChores: number
): StreakProtectionAction[] {
  const actions: StreakProtectionAction[] = [];

  if (riskLevel === 'high' || riskLevel === 'critical') {
    if (freezesAvailable > 0) {
      actions.push({
        type: 'use_freeze',
        priority: 'high',
        title: 'Use Streak Freeze',
        description: 'Protect your streak by using a freeze for today',
        effectivenessScore: 100,
      });
    }

    actions.push({
      type: 'early_completion',
      priority: 'high',
      title: 'Complete Chores Now',
      description: 'Focus on completing your most important chores immediately',
      effectivenessScore: 95,
    });
  }

  if (riskLevel === 'medium' || riskLevel === 'high') {
    actions.push({
      type: 'set_reminder',
      priority: 'medium',
      title: 'Set Extra Reminder',
      description: 'Add a reminder to complete remaining chores',
      effectivenessScore: 70,
      automated: true,
    });
  }

  if (pendingChores > 3) {
    actions.push({
      type: 'reduce_workload',
      priority: 'low',
      title: 'Focus on Key Chores',
      description: 'Prioritize the most important chores to maintain your streak',
      effectivenessScore: 60,
    });
  }

  if (riskLevel === 'critical') {
    actions.push({
      type: 'notify_parent',
      priority: 'high',
      title: 'Notify Parent',
      description: 'Alert a parent about your streak being at risk',
      effectivenessScore: 80,
    });
  }

  return actions;
}

export async function streakProtectionRoutes(fastify: FastifyInstance) {
  // GET /api/households/:householdId/streak-protection - Get protection summary
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

    const settings = protectionSettings.get(householdId) || getDefaultSettings();

    // Get all members
    const householdMembers = await db.query.members.findMany({
      where: and(
        eq(members.householdId, householdId),
        eq(members.isActive, true)
      ),
    });

    // Get today's schedules
    const today = new Date().toISOString().split('T')[0];
    const todaySchedules = await db.query.choreSchedules.findMany({
      where: and(
        eq(choreSchedules.householdId, householdId),
        eq(choreSchedules.scheduledDate, today)
      ),
    });

    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const hoursUntilMidnight = (midnight.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Calculate health for each member
    const memberHealth: StreakHealth[] = [];
    const activeAlerts: StreakAlert[] = [];
    let totalAtRisk = 0;
    const upcomingMilestones: HouseholdStreakSummary['upcomingMilestones'] = [];

    for (const member of householdMembers) {
      if (member.role !== 'child' && member.role !== 'teen') continue;

      const memberSchedules = todaySchedules.filter((s) => s.assignedTo === member.id);
      const pendingChores = memberSchedules.filter((s) => !s.isCompleted).length;

      const { factors, score } = calculateRiskFactors(member, pendingChores, hoursUntilMidnight);
      const riskLevel = getRiskLevelFromScore(score);

      const streakCurrent = member.streakCurrent || 0;
      const nextMilestone = getNextMilestone(streakCurrent);
      const daysUntilMilestone = nextMilestone ? nextMilestone - streakCurrent : null;

      memberHealth.push({
        memberId: member.id,
        memberName: member.name,
        currentStreak: streakCurrent,
        longestStreak: member.streakLongest || 0,
        riskLevel,
        riskScore: score,
        riskFactors: factors,
        predictedBreakProbability: Math.min(score, 95),
        lastCompletedDate: member.streakLastCompletedDate?.toString() || null,
        freezesAvailable: member.streakFreezesAvailable || 0,
        freezesUsed: member.streakFreezesUsed || 0,
        daysUntilMilestone,
        nextMilestone,
      });

      if (riskLevel === 'high' || riskLevel === 'critical') {
        totalAtRisk++;
      }

      // Add milestone tracking
      if (nextMilestone && daysUntilMilestone && daysUntilMilestone <= 3) {
        upcomingMilestones.push({
          memberId: member.id,
          memberName: member.name,
          currentStreak: streakCurrent,
          milestone: nextMilestone,
          daysRemaining: daysUntilMilestone,
        });
      }
    }

    // Get active alerts
    const householdAlerts = streakAlerts.get(householdId) || [];
    const nonDismissedAlerts = householdAlerts.filter(
      (a) => !a.isDismissed && new Date(a.expiresAt) > new Date()
    );
    activeAlerts.push(...nonDismissedAlerts);

    const summary: HouseholdStreakSummary = {
      householdId,
      settings,
      memberHealth,
      activeAlerts,
      totalActiveStreaks: memberHealth.filter((m) => m.currentStreak > 0).length,
      totalMembersAtRisk: totalAtRisk,
      freezesAvailableTotal: memberHealth.reduce((sum, m) => sum + m.freezesAvailable, 0),
      upcomingMilestones: upcomingMilestones.sort((a, b) => a.daysRemaining - b.daysRemaining),
    };

    return summary;
  });

  // GET /api/households/:householdId/streak-protection/member/:memberId - Get member prediction
  fastify.get('/member/:memberId', {
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

    const [member] = await db.query.members.findMany({
      where: and(
        eq(members.id, memberId),
        eq(members.householdId, householdId)
      ),
      limit: 1,
    });

    if (!member) {
      return reply.status(404).send({ error: 'Member not found' });
    }

    const today = new Date().toISOString().split('T')[0];
    const todaySchedules = await db.query.choreSchedules.findMany({
      where: and(
        eq(choreSchedules.householdId, householdId),
        eq(choreSchedules.assignedTo, memberId),
        eq(choreSchedules.scheduledDate, today)
      ),
    });

    const pendingChores = todaySchedules.filter((s) => !s.isCompleted).length;

    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const hoursUntilMidnight = (midnight.getTime() - now.getTime()) / (1000 * 60 * 60);

    const { score } = calculateRiskFactors(member, pendingChores, hoursUntilMidnight);
    const riskLevel = getRiskLevelFromScore(score);

    const prediction: StreakPrediction = {
      memberId: member.id,
      memberName: member.name,
      currentStreak: member.streakCurrent || 0,
      predictedOutcome: score >= 70 ? 'likely_break' : score >= 40 ? 'at_risk' : 'continue',
      confidence: Math.min(85, 60 + Math.abs(50 - score) * 0.5),
      breakProbability: Math.min(score, 95),
      riskPeakTime: hoursUntilMidnight < 6 ? new Date(midnight.getTime() - 2 * 60 * 60 * 1000).toISOString() : null,
      suggestedActions: generateProtectionActions(riskLevel, member.streakFreezesAvailable || 0, pendingChores),
      historicalPatterns: [
        {
          patternType: 'day_of_week',
          description: 'Completion tends to drop on weekends',
          frequency: 0.7,
          impact: 'negative',
          confidence: 75,
        },
        {
          patternType: 'time_of_day',
          description: 'Most productive between 4-7 PM',
          frequency: 0.65,
          impact: 'positive',
          confidence: 80,
        },
      ],
    };

    return prediction;
  });

  // GET /api/households/:householdId/streak-protection/settings - Get settings
  fastify.get('/settings', {
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

    return protectionSettings.get(householdId) || getDefaultSettings();
  });

  // PUT /api/households/:householdId/streak-protection/settings - Update settings
  fastify.put('/settings', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = request.body as UpdateProtectionSettingsRequest;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership || (membership.role !== 'parent' && membership.role !== 'admin')) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can update protection settings',
      });
    }

    const existing = protectionSettings.get(householdId) || getDefaultSettings();
    const updated: StreakProtectionSettings = {
      ...existing,
      ...body,
    };

    protectionSettings.set(householdId, updated);
    return updated;
  });

  // POST /api/households/:householdId/streak-protection/use-freeze - Use a streak freeze
  fastify.post('/use-freeze', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = request.body as UseStreakFreezeRequest;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const [member] = await db.query.members.findMany({
      where: and(
        eq(members.id, body.memberId),
        eq(members.householdId, householdId)
      ),
      limit: 1,
    });

    if (!member) {
      return reply.status(404).send({ error: 'Member not found' });
    }

    const freezesAvailable = member.streakFreezesAvailable || 0;
    if (freezesAvailable <= 0) {
      return reply.status(400).send({
        error: 'No freezes available',
        message: 'This member has no streak freezes available',
      });
    }

    // Update member
    const [updatedMember] = await db.update(members)
      .set({
        streakFreezesAvailable: freezesAvailable - 1,
        streakFreezesUsed: (member.streakFreezesUsed || 0) + 1,
        streakLastCompletedDate: new Date().toISOString().split('T')[0],
      })
      .where(eq(members.id, body.memberId))
      .returning();

    return {
      success: true,
      member: updatedMember,
      freezesRemaining: (updatedMember.streakFreezesAvailable || 0),
      message: `Streak freeze used for ${member.name}. Streak protected!`,
    };
  });

  // POST /api/households/:householdId/streak-protection/dismiss-alert - Dismiss an alert
  fastify.post('/dismiss-alert', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = request.body as DismissAlertRequest;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const alerts = streakAlerts.get(householdId) || [];
    const alertIndex = alerts.findIndex((a) => a.id === body.alertId);

    if (alertIndex === -1) {
      return reply.status(404).send({ error: 'Alert not found' });
    }

    alerts[alertIndex].isDismissed = true;
    streakAlerts.set(householdId, alerts);

    return { success: true };
  });

  // GET /api/households/:householdId/streak-protection/analytics/:memberId - Get streak analytics
  fastify.get('/analytics/:memberId', {
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

    const [member] = await db.query.members.findMany({
      where: and(
        eq(members.id, memberId),
        eq(members.householdId, householdId)
      ),
      limit: 1,
    });

    if (!member) {
      return reply.status(404).send({ error: 'Member not found' });
    }

    const analytics: StreakAnalytics = {
      memberId: member.id,
      memberName: member.name,
      totalStreaksStarted: Math.max(1, Math.floor((member.pointsLifetime || 0) / 100)),
      averageStreakLength: Math.floor(((member.streakCurrent || 0) + (member.streakLongest || 0)) / 2),
      longestStreak: member.streakLongest || 0,
      currentStreak: member.streakCurrent || 0,
      streaksEndedByDay: {
        Sunday: 3,
        Monday: 1,
        Tuesday: 0,
        Wednesday: 1,
        Thursday: 0,
        Friday: 2,
        Saturday: 4,
      },
      mostProductiveDays: ['Tuesday', 'Wednesday', 'Thursday'],
      leastProductiveDays: ['Saturday', 'Sunday'],
      freezesUsedTotal: member.streakFreezesUsed || 0,
      freezesSavedStreaks: Math.max(0, (member.streakFreezesUsed || 0) - 1),
      riskHistoryLast30Days: Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          riskLevel: (['safe', 'safe', 'low', 'safe', 'medium', 'safe', 'low'] as StreakRiskLevel[])[i % 7],
          wasProtected: i % 10 === 5,
        };
      }),
    };

    return analytics;
  });
}
