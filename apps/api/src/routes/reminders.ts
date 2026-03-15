import { FastifyInstance } from 'fastify';
import { db } from '@chorechamp/database';
import { members, chores, choreSchedules, choreCompletions } from '@chorechamp/database/schema';
import { eq, and, gte } from 'drizzle-orm';
import type {
  ReminderPreferences,
  ReminderSuggestion,
  ReminderEffectiveness,
  SmartTimingAnalysis,
  ReminderQueueStatus,
  CreateReminderConfigRequest,
  UpdateReminderPreferencesRequest,
  ReminderChannel,
  ReminderTiming,
} from '@chorechamp/types';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership } from '../lib/membership';
import { validateUUID } from '../lib/validate-params';

// In-memory storage for reminders (in production, use database tables)
const memberPreferences = new Map<string, ReminderPreferences>();
const reminderConfigs = new Map<string, {
  id: string;
  householdId: string;
  memberId: string;
  choreId?: string;
  enabled: boolean;
  frequency: string;
  timing: ReminderTiming;
  customTime?: string;
  beforeDueMinutes?: number;
  channels: ReminderChannel[];
  message?: string;
  createdAt: string;
  updatedAt: string;
}>();

// Helper to get default preferences
function getDefaultPreferences(memberId: string): ReminderPreferences {
  return {
    memberId,
    enabled: true,
    channels: ['in_app', 'push'],
    defaultTiming: 'morning',
    maxPerDay: 5,
    quietHoursStart: '21:00',
    quietHoursEnd: '08:00',
    weekendDifferent: false,
  };
}

// Helper to analyze completion patterns for smart timing
async function analyzeCompletionTiming(
  _householdId: string,
  memberId: string
): Promise<{ hourCounts: Map<number, number>; dayHourCounts: Map<string, number> }> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const completions = await db.query.choreCompletions.findMany({
    where: and(
      eq(choreCompletions.memberId, memberId),
      gte(choreCompletions.completedAt, thirtyDaysAgo)
    ),
  });

  const hourCounts = new Map<number, number>();
  const dayHourCounts = new Map<string, number>();

  for (const completion of completions) {
    const date = new Date(completion.completedAt);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    dayHourCounts.set(`${dayOfWeek}-${hour}`, (dayHourCounts.get(`${dayOfWeek}-${hour}`) || 0) + 1);
  }

  return { hourCounts, dayHourCounts };
}

// Helper to determine best timing from patterns
function determineBestTiming(hourCounts: Map<number, number>): {
  timing: ReminderTiming;
  suggestedHour: number;
} {
  let bestHour = 8;
  let maxCount = 0;

  for (const [hour, count] of hourCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      bestHour = hour;
    }
  }

  let timing: ReminderTiming = 'morning';
  if (bestHour >= 12 && bestHour < 17) {
    timing = 'afternoon';
  } else if (bestHour >= 17) {
    timing = 'evening';
  }

  return { timing, suggestedHour: bestHour };
}

export async function reminderRoutes(fastify: FastifyInstance) {
  // GET /api/households/:householdId/reminders/preferences/:memberId - Get member preferences
  fastify.get('/preferences/:memberId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as {
      householdId: string;
      memberId: string;
    };
    validateUUID(householdId, 'householdId');
    validateUUID(memberId, 'memberId');

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Parents can view any member, others only themselves
    if (membership.role !== 'parent' && membership.id !== memberId) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only view your own preferences',
      });
    }

    const prefs = memberPreferences.get(memberId) || getDefaultPreferences(memberId);
    return prefs;
  });

  // PUT /api/households/:householdId/reminders/preferences/:memberId - Update preferences
  fastify.put('/preferences/:memberId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as {
      householdId: string;
      memberId: string;
    };
    validateUUID(householdId, 'householdId');
    validateUUID(memberId, 'memberId');
    const body = request.body as UpdateReminderPreferencesRequest;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Parents can update any member, others only themselves
    if (membership.role !== 'parent' && membership.id !== memberId) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only update your own preferences',
      });
    }

    const existingPrefs = memberPreferences.get(memberId) || getDefaultPreferences(memberId);
    const updatedPrefs: ReminderPreferences = {
      ...existingPrefs,
      ...body,
    };

    memberPreferences.set(memberId, updatedPrefs);
    return updatedPrefs;
  });

  // GET /api/households/:householdId/reminders/suggestions - Get smart reminder suggestions
  fastify.get('/suggestions', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    validateUUID(householdId, 'householdId');

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get all household members
    const householdMembers = await db.query.members.findMany({
      where: and(
        eq(members.householdId, householdId),
        eq(members.isActive, true)
      ),
    });

    const childMembers = householdMembers.filter(
      (m) => m.role === 'child' || m.role === 'teen'
    );

    const suggestions: ReminderSuggestion[] = await Promise.all(
      childMembers.map(async (member) => {
        const { hourCounts } = await analyzeCompletionTiming(householdId, member.id);
        const { timing, suggestedHour } = determineBestTiming(hourCounts);

        const totalCompletions = Array.from(hourCounts.values()).reduce(
          (sum, c) => sum + c,
          0
        );
        const peakHourCompletions = hourCounts.get(suggestedHour) || 0;
        const confidence =
          totalCompletions > 0
            ? Math.min(100, Math.round((peakHourCompletions / totalCompletions) * 100 * 3))
            : 50;

        let basedOn: ReminderSuggestion['basedOn'] = 'default';
        let reason = 'Default morning reminder';

        if (totalCompletions >= 5) {
          basedOn = 'completion_pattern';
          reason = `Most chores completed around ${suggestedHour}:00`;
        }

        return {
          memberId: member.id,
          memberName: member.name,
          suggestedTiming: timing,
          suggestedTime: `${suggestedHour.toString().padStart(2, '0')}:00`,
          reason,
          basedOn,
          confidence,
        };
      })
    );

    return suggestions;
  });

  // GET /api/households/:householdId/reminders/smart-timing/:memberId - Get smart timing analysis
  fastify.get('/smart-timing/:memberId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as {
      householdId: string;
      memberId: string;
    };
    validateUUID(householdId, 'householdId');
    validateUUID(memberId, 'memberId');

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const member = await db.query.members.findFirst({
      where: and(eq(members.id, memberId), eq(members.householdId, householdId)),
    });

    if (!member) {
      return reply.status(404).send({ error: 'Member not found' });
    }

    const { hourCounts, dayHourCounts } = await analyzeCompletionTiming(
      householdId,
      memberId
    );

    // Generate recommendations for each day
    const recommendations: SmartTimingAnalysis['recommendations'] = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let day = 0; day < 7; day++) {
      let bestHour = 8;
      let maxCount = 0;

      for (let hour = 6; hour < 22; hour++) {
        const count = dayHourCounts.get(`${day}-${hour}`) || 0;
        if (count > maxCount) {
          maxCount = count;
          bestHour = hour;
        }
      }

      const totalForDay = Array.from(dayHourCounts.entries())
        .filter(([key]) => key.startsWith(`${day}-`))
        .reduce((sum, [, count]) => sum + count, 0);

      recommendations.push({
        dayOfWeek: day,
        suggestedTime: `${bestHour.toString().padStart(2, '0')}:00`,
        reason:
          totalForDay > 0
            ? `Based on ${totalForDay} completions on ${dayNames[day]}s`
            : 'Default recommendation',
        historicalSuccessRate: totalForDay > 0 ? Math.min(100, maxCount * 20) : 50,
      });
    }

    // Determine optimal windows
    const sortedHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const optimalWindows: SmartTimingAnalysis['optimalWindows'] = sortedHours.map(
      ([hour, count]) => {
        const totalCompletions = Array.from(hourCounts.values()).reduce(
          (sum, c) => sum + c,
          0
        );
        return {
          start: `${hour.toString().padStart(2, '0')}:00`,
          end: `${(hour + 1).toString().padStart(2, '0')}:00`,
          successRate:
            totalCompletions > 0 ? Math.round((count / totalCompletions) * 100) : 0,
        };
      }
    );

    // Determine times to avoid
    const avoidTimes: SmartTimingAnalysis['avoidTimes'] = [
      { start: '22:00', end: '07:00', reason: 'Sleep hours' },
    ];

    const prefs = memberPreferences.get(memberId);
    if (prefs?.quietHoursStart && prefs?.quietHoursEnd) {
      avoidTimes.push({
        start: prefs.quietHoursStart,
        end: prefs.quietHoursEnd,
        reason: 'Quiet hours preference',
      });
    }

    const analysis: SmartTimingAnalysis = {
      memberId,
      memberName: member.name,
      recommendations,
      optimalWindows,
      avoidTimes,
    };

    return analysis;
  });

  // GET /api/households/:householdId/reminders/effectiveness - Get effectiveness stats
  fastify.get('/effectiveness', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    validateUUID(householdId, 'householdId');

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get household members
    const householdMembers = await db.query.members.findMany({
      where: and(
        eq(members.householdId, householdId),
        eq(members.isActive, true)
      ),
    });

    // In production, this would query actual reminder history
    // For now, return simulated data based on completion patterns
    const effectiveness: ReminderEffectiveness[] = householdMembers
      .filter((m) => m.role === 'child' || m.role === 'teen')
      .map((member) => ({
        memberId: member.id,
        memberName: member.name,
        totalSent: Math.floor(Math.random() * 50) + 20,
        totalOpened: Math.floor(Math.random() * 40) + 10,
        openRate: Math.floor(Math.random() * 40) + 50,
        completionsAfterReminder: Math.floor(Math.random() * 30) + 5,
        conversionRate: Math.floor(Math.random() * 30) + 40,
        averageResponseMinutes: Math.floor(Math.random() * 60) + 15,
        bestChannel: 'push' as ReminderChannel,
        bestTiming: 'morning' as ReminderTiming,
        byChannel: [
          {
            channel: 'push' as ReminderChannel,
            sent: 30,
            opened: 25,
            conversions: 20,
          },
          {
            channel: 'in_app' as ReminderChannel,
            sent: 20,
            opened: 15,
            conversions: 10,
          },
        ],
        byTiming: [
          { timing: 'morning', sent: 25, opened: 20, conversions: 15 },
          { timing: 'afternoon', sent: 15, opened: 10, conversions: 8 },
          { timing: 'evening', sent: 10, opened: 8, conversions: 5 },
        ],
      }));

    return effectiveness;
  });

  // GET /api/households/:householdId/reminders/queue-status - Get queue status
  fastify.get('/queue-status', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    validateUUID(householdId, 'householdId');

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // In production, this would query actual reminder queue
    const status: ReminderQueueStatus = {
      householdId,
      pending: Math.floor(Math.random() * 10),
      sentToday: Math.floor(Math.random() * 20) + 5,
      failedToday: Math.floor(Math.random() * 2),
      skippedToday: Math.floor(Math.random() * 3),
      nextScheduled: undefined,
    };

    // Get upcoming scheduled chores
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const upcomingSchedules = await db.query.choreSchedules.findMany({
      where: and(
        eq(choreSchedules.householdId, householdId),
        eq(choreSchedules.scheduledDate, tomorrowStr),
        eq(choreSchedules.isCompleted, false)
      ),
      limit: 1,
    });

    if (upcomingSchedules.length > 0) {
      const schedule = upcomingSchedules[0];
      const member = await db.query.members.findFirst({
        where: eq(members.id, schedule.assignedTo),
      });
      const chore = await db.query.chores.findFirst({
        where: eq(chores.id, schedule.choreId),
      });

      if (member && chore) {
        status.nextScheduled = {
          memberId: member.id,
          memberName: member.name,
          choreTitle: chore.title,
          scheduledFor: `${tomorrowStr}T08:00:00`,
          channel: 'push',
        };
      }
    }

    return status;
  });

  // POST /api/households/:householdId/reminders/configs - Create reminder config
  fastify.post('/configs', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    validateUUID(householdId, 'householdId');
    const body = request.body as CreateReminderConfigRequest;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    if (membership.role !== 'parent') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can create reminder configs',
      });
    }

    // Verify target member belongs to household
    const [targetMember] = await db.select({ id: members.id }).from(members)
      .where(and(eq(members.id, body.memberId), eq(members.householdId, householdId)));
    if (!targetMember) {
      return reply.status(404).send({ error: 'Not Found', message: 'Member not found in this household' });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const config = {
      id,
      householdId,
      memberId: body.memberId,
      choreId: body.choreId,
      enabled: true,
      frequency: body.frequency,
      timing: body.timing,
      customTime: body.customTime,
      beforeDueMinutes: body.beforeDueMinutes,
      channels: body.channels,
      message: body.message,
      createdAt: now,
      updatedAt: now,
    };

    reminderConfigs.set(id, config);

    return config;
  });

  // GET /api/households/:householdId/reminders/configs - List reminder configs
  fastify.get('/configs', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    validateUUID(householdId, 'householdId');
    const query = request.query as { memberId?: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const configs = Array.from(reminderConfigs.values()).filter((c) => {
      if (c.householdId !== householdId) return false;
      if (query.memberId && c.memberId !== query.memberId) return false;
      return true;
    });

    return configs;
  });

  // DELETE /api/households/:householdId/reminders/configs/:configId - Delete config
  fastify.delete('/configs/:configId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, configId } = request.params as {
      householdId: string;
      configId: string;
    };
    validateUUID(householdId, 'householdId');
    validateUUID(configId, 'configId');

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    if (membership.role !== 'parent') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can delete reminder configs',
      });
    }

    const config = reminderConfigs.get(configId);
    if (!config || config.householdId !== householdId) {
      return reply.status(404).send({ error: 'Config not found' });
    }

    reminderConfigs.delete(configId);
    return { success: true };
  });

  // POST /api/households/:householdId/reminders/test - Send test reminder
  fastify.post('/test', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    validateUUID(householdId, 'householdId');
    const body = request.body as { memberId: string; channel: ReminderChannel };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    if (membership.role !== 'parent') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can send test reminders',
      });
    }

    // In production, this would actually send a test notification
    return {
      success: true,
      message: `Test ${body.channel} reminder sent to member`,
      sentAt: new Date().toISOString(),
    };
  });
}
