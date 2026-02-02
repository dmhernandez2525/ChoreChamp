import { FastifyInstance } from 'fastify';
import { db } from '@chorechamp/database';
import {
  members,
  chores,
  choreSchedules,
  choreCompletions,
  choreTemplates,
} from '@chorechamp/database/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import type {
  ScheduleSuggestion,
  AISchedule,
  GenerateScheduleRequest,
  WorkloadData,
  CompletionPattern,
  ScheduleAnalytics,
  OptimizationSuggestion,
  ApplyScheduleRequest,
  ApplyScheduleResult,
} from '@chorechamp/types';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { randomUUID } from 'crypto';

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

// Helper to get date range for period
function getDateRange(
  period: string,
  startDate?: string
): { start: Date; end: Date } {
  const start = startDate ? new Date(startDate) : new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);

  switch (period) {
    case 'day':
      // Same day
      break;
    case 'week':
      end.setDate(end.getDate() + 6);
      break;
    case 'month':
      end.setMonth(end.getMonth() + 1);
      end.setDate(end.getDate() - 1);
      break;
    default:
      end.setDate(end.getDate() + 6);
  }

  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// Helper to calculate member workload
async function calculateWorkload(
  householdId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<WorkloadData[]> {
  const startStr = periodStart.toISOString().split('T')[0];
  const endStr = periodEnd.toISOString().split('T')[0];

  // Get all household members
  const householdMembers = await db.query.members.findMany({
    where: and(
      eq(members.householdId, householdId),
      eq(members.isActive, true)
    ),
  });

  // Get schedules for period
  const schedules = await db.query.choreSchedules.findMany({
    where: and(
      eq(choreSchedules.householdId, householdId),
      gte(choreSchedules.scheduledDate, startStr),
      lte(choreSchedules.scheduledDate, endStr)
    ),
  });

  // Get completions for period
  const completions = await db.query.choreCompletions.findMany({
    where: and(
      eq(choreCompletions.householdId, householdId),
      gte(choreCompletions.completedAt, periodStart),
      lte(choreCompletions.completedAt, periodEnd)
    ),
  });

  // Calculate stats for each member
  return householdMembers.map((member) => {
    const memberSchedules = schedules.filter(
      (s) => s.assignedTo === member.id
    );
    const memberCompletions = completions.filter(
      (c) => c.memberId === member.id && c.status !== 'rejected'
    );

    const totalAssigned = memberSchedules.length;
    const totalCompleted = memberCompletions.length;
    const completionRate =
      totalAssigned > 0
        ? Math.round((totalCompleted / totalAssigned) * 100)
        : 100;

    // Calculate weekly averages from historical data
    const weeksInPeriod = Math.max(
      1,
      Math.ceil(
        (periodEnd.getTime() - periodStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
      )
    );

    return {
      memberId: member.id,
      memberName: member.name,
      memberColor: member.color,
      totalAssigned,
      totalCompleted,
      completionRate,
      currentWeekChores: memberSchedules.length,
      averagePointsPerWeek: Math.round(
        memberCompletions.reduce((sum, c) => sum + (c.pointsAwarded || 0), 0) /
          weeksInPeriod
      ),
      averageChoresPerWeek: Math.round(totalCompleted / weeksInPeriod),
    };
  });
}

// Helper to analyze completion patterns
async function analyzePatterns(
  householdId: string,
  memberId: string
): Promise<CompletionPattern> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const member = await db.query.members.findFirst({
    where: eq(members.id, memberId),
  });

  const completions = await db.query.choreCompletions.findMany({
    where: and(
      eq(choreCompletions.memberId, memberId),
      gte(choreCompletions.completedAt, thirtyDaysAgo)
    ),
  });

  // Get chore details for category analysis
  const choreIds = [...new Set(completions.map((c) => c.choreId))];
  const choresData =
    choreIds.length > 0
      ? await db.query.chores.findMany({
          where: eq(chores.householdId, householdId),
        })
      : [];
  const choreMap = new Map(choresData.map((c) => [c.id, c]));

  // Analyze by day of week
  const byDayOfWeek: Map<number, { count: number; total: number }> = new Map();
  for (let i = 0; i < 7; i++) {
    byDayOfWeek.set(i, { count: 0, total: 0 });
  }

  for (const completion of completions) {
    const day = new Date(completion.completedAt).getDay();
    const data = byDayOfWeek.get(day)!;
    data.total++;
    if (completion.status !== 'rejected') {
      data.count++;
    }
  }

  // Analyze by time of day
  const byTimeOfDay: Map<string, { count: number; total: number }> = new Map([
    ['morning', { count: 0, total: 0 }],
    ['afternoon', { count: 0, total: 0 }],
    ['evening', { count: 0, total: 0 }],
  ]);

  for (const completion of completions) {
    const hour = new Date(completion.completedAt).getHours();
    let slot: string;
    if (hour < 12) slot = 'morning';
    else if (hour < 17) slot = 'afternoon';
    else slot = 'evening';

    const data = byTimeOfDay.get(slot)!;
    data.total++;
    if (completion.status !== 'rejected') {
      data.count++;
    }
  }

  // Analyze by category
  const byCategory: Map<string, { count: number; total: number }> = new Map();
  for (const completion of completions) {
    const chore = choreMap.get(completion.choreId);
    const category = chore?.category || 'general';

    if (!byCategory.has(category)) {
      byCategory.set(category, { count: 0, total: 0 });
    }
    const data = byCategory.get(category)!;
    data.total++;
    if (completion.status !== 'rejected') {
      data.count++;
    }
  }

  // Determine streak tendency
  const recentCompletions = completions.slice(0, 7);
  const olderCompletions = completions.slice(7, 14);
  const recentRate =
    recentCompletions.length > 0
      ? recentCompletions.filter((c) => c.status !== 'rejected').length /
        recentCompletions.length
      : 0;
  const olderRate =
    olderCompletions.length > 0
      ? olderCompletions.filter((c) => c.status !== 'rejected').length /
        olderCompletions.length
      : 0;

  let streakTendency: 'improving' | 'stable' | 'declining' = 'stable';
  if (recentRate > olderRate + 0.1) streakTendency = 'improving';
  else if (recentRate < olderRate - 0.1) streakTendency = 'declining';

  return {
    memberId,
    memberName: member?.name || 'Unknown',
    byDayOfWeek: Array.from(byDayOfWeek.entries()).map(([day, data]) => ({
      day,
      count: data.count,
      rate: data.total > 0 ? Math.round((data.count / data.total) * 100) : 0,
    })),
    byTimeOfDay: Array.from(byTimeOfDay.entries()).map(([slot, data]) => ({
      slot,
      count: data.count,
      rate: data.total > 0 ? Math.round((data.count / data.total) * 100) : 0,
    })),
    byCategory: Array.from(byCategory.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      rate: data.total > 0 ? Math.round((data.count / data.total) * 100) : 0,
    })),
    averageCompletionTime: 4, // Default to 4 hours
    streakTendency,
  };
}

// Helper to get age from birth year
function getAgeFromBirthYear(birthYear: number | null): number | null {
  if (!birthYear) return null;
  return new Date().getFullYear() - birthYear;
}

// Helper to check age appropriateness
function isAgeAppropriate(
  memberAge: number | null,
  minAge: number | null,
  maxAge: number | null
): boolean {
  if (memberAge === null) return true;
  if (minAge !== null && memberAge < minAge) return false;
  if (maxAge !== null && memberAge > maxAge + 3) return false;
  return true;
}

export async function aiSchedulingRoutes(fastify: FastifyInstance) {
  // POST /api/households/:householdId/ai-schedule/generate - Generate AI schedule
  fastify.post('/generate', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = request.body as GenerateScheduleRequest;

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
        message: 'Only parents can generate AI schedules',
      });
    }

    const period = body.period || 'week';
    const { start, end } = getDateRange(period, body.startDate);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    // Get all active chores
    const householdChores = await db.query.chores.findMany({
      where: and(
        eq(chores.householdId, householdId),
        eq(chores.isActive, true)
      ),
    });

    // Get all active members (children/teens)
    const householdMembers = await db.query.members.findMany({
      where: and(
        eq(members.householdId, householdId),
        eq(members.isActive, true)
      ),
    });

    const assignableMembers = householdMembers.filter(
      (m) =>
        (m.role === 'child' || m.role === 'teen') &&
        !body.excludeMemberIds?.includes(m.id)
    );

    // Get existing schedules for the period
    const existingSchedules = await db.query.choreSchedules.findMany({
      where: and(
        eq(choreSchedules.householdId, householdId),
        gte(choreSchedules.scheduledDate, startStr),
        lte(choreSchedules.scheduledDate, endStr)
      ),
    });

    // Get templates for age info
    const templateIds = householdChores
      .map((c) => c.templateId)
      .filter(Boolean) as string[];
    const templates =
      templateIds.length > 0
        ? await db.query.choreTemplates.findMany({
            where: eq(choreTemplates.isActive, true),
          })
        : [];
    const templateMap = new Map(templates.map((t) => [t.id, t]));

    // Calculate current workload
    const workload = await calculateWorkload(householdId, start, end);
    const workloadMap = new Map(workload.map((w) => [w.memberId, w]));

    // Get patterns for each member
    const patternsMap = new Map<string, CompletionPattern>();
    if (body.considerPatterns !== false) {
      for (const member of assignableMembers) {
        const pattern = await analyzePatterns(householdId, member.id);
        patternsMap.set(member.id, pattern);
      }
    }

    // Generate suggestions
    const suggestions: ScheduleSuggestion[] = [];
    const scheduledSet = new Set(
      existingSchedules.map((s) => `${s.choreId}-${s.scheduledDate}`)
    );

    // Filter chores that need scheduling
    const choresToSchedule = householdChores.filter((chore) => {
      if (body.excludeChoreIds?.includes(chore.id)) return false;

      // Check recurrence type
      if (chore.recurrenceType === 'once') {
        // Only schedule if not already scheduled in period
        return !existingSchedules.some((s) => s.choreId === chore.id);
      }

      return true;
    });

    // Generate dates for the period
    const dates: string[] = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    for (const chore of choresToSchedule) {
      // Determine which dates to schedule
      let scheduleDates: string[] = [];

      if (chore.recurrenceType === 'daily') {
        scheduleDates = dates;
      } else if (
        chore.recurrenceType === 'weekly' &&
        chore.recurrenceDays?.length
      ) {
        scheduleDates = dates.filter((d) => {
          const dayOfWeek = new Date(d).getDay();
          return chore.recurrenceDays!.includes(dayOfWeek);
        });
      } else if (chore.recurrenceType === 'once') {
        // Schedule for the first available day
        scheduleDates = [dates[0]];
      } else {
        // Default: schedule once per week
        scheduleDates = [dates[Math.floor(dates.length / 2)]];
      }

      // Get template age info if available
      const template = chore.templateId
        ? templateMap.get(chore.templateId)
        : null;
      const minAge = template?.minAge ?? null;
      const maxAge = template?.maxAge ?? null;

      for (const dateStr of scheduleDates) {
        // Skip if already scheduled
        if (scheduledSet.has(`${chore.id}-${dateStr}`)) continue;

        // Find best member for this chore
        let bestMember: (typeof assignableMembers)[0] | null = null;
        let bestScore = -1;
        let bestReason: ScheduleSuggestion['reason'] | null = null;
        const alternatives: string[] = [];

        for (const member of assignableMembers) {
          const memberAge = getAgeFromBirthYear(member.birthYear);
          let score = 50; // Base score
          const factors: string[] = [];

          // Age appropriateness check
          if (body.considerAge !== false) {
            if (!isAgeAppropriate(memberAge, minAge, maxAge)) {
              if (minAge !== null && memberAge !== null && memberAge < minAge) {
                score -= 100; // Strongly discourage
                factors.push('Too young for this chore');
              }
            } else {
              score += 10;
              factors.push('Age appropriate');
            }
          }

          // Workload balance
          if (body.balanceWorkload !== false) {
            const memberWorkload = workloadMap.get(member.id);
            if (memberWorkload) {
              const avgWorkload =
                workload.reduce((sum, w) => sum + w.currentWeekChores, 0) /
                workload.length;
              if (memberWorkload.currentWeekChores < avgWorkload) {
                score += 15;
                factors.push('Below average workload');
              } else if (memberWorkload.currentWeekChores > avgWorkload * 1.5) {
                score -= 20;
                factors.push('Above average workload');
              }
            }
          }

          // Pattern matching
          if (body.considerPatterns !== false) {
            const pattern = patternsMap.get(member.id);
            if (pattern) {
              const dayOfWeek = new Date(dateStr).getDay();
              const dayPattern = pattern.byDayOfWeek.find(
                (d) => d.day === dayOfWeek
              );
              if (dayPattern && dayPattern.rate > 70) {
                score += 10;
                factors.push('High success rate on this day');
              }

              // Category preference
              const choreCategory = chore.category || 'general';
              const categoryPattern = pattern.byCategory.find(
                (c) => c.category === choreCategory
              );
              if (categoryPattern && categoryPattern.rate > 70) {
                score += 10;
                factors.push(`Good at ${choreCategory} chores`);
              }

              // Streak tendency
              if (pattern.streakTendency === 'improving') {
                score += 5;
                factors.push('Improving performance');
              } else if (pattern.streakTendency === 'declining') {
                score -= 5;
                factors.push('Declining performance');
              }
            }
          }

          // Existing assignment preference
          if (chore.assignedTo?.includes(member.id)) {
            score += 20;
            factors.push('Currently assigned to this chore');
          }

          // Update tracking
          if (score > bestScore) {
            if (bestMember) {
              alternatives.push(bestMember.id);
            }
            bestScore = score;
            bestMember = member;

            // Determine primary reason
            const reasonType = factors.includes('Age appropriate')
              ? 'age_appropriate'
              : factors.includes('Below average workload')
              ? 'workload_balance'
              : factors.includes('High success rate on this day')
              ? 'pattern_match'
              : factors.includes('Currently assigned to this chore')
              ? 'rotation'
              : 'workload_balance';

            bestReason = {
              type: reasonType,
              message: factors[0] || 'Best available match',
              factors,
            };
          } else if (score > 0) {
            alternatives.push(member.id);
          }
        }

        if (bestMember && bestReason && bestScore > 0) {
          suggestions.push({
            id: randomUUID(),
            choreId: chore.id,
            choreTitle: chore.title,
            choreIcon: chore.icon || '✅',
            choreDifficulty: chore.difficulty || 'medium',
            chorePoints: chore.pointValue,
            memberId: bestMember.id,
            memberName: bestMember.name,
            memberColor: bestMember.color,
            suggestedDate: dateStr,
            suggestedTime: chore.dueTime || undefined,
            reason: bestReason,
            confidence: Math.min(100, Math.max(0, bestScore)),
            alternativeMemberIds:
              alternatives.length > 0 ? alternatives.slice(0, 3) : undefined,
          });
        }
      }
    }

    // Sort by date and confidence
    suggestions.sort((a, b) => {
      const dateCompare = a.suggestedDate.localeCompare(b.suggestedDate);
      if (dateCompare !== 0) return dateCompare;
      return b.confidence - a.confidence;
    });

    const schedule: AISchedule = {
      id: randomUUID(),
      householdId,
      periodStart: startStr,
      periodEnd: endStr,
      suggestions,
      workloadSummary: workload,
      generatedAt: new Date().toISOString(),
      status: 'pending',
    };

    return schedule;
  });

  // POST /api/households/:householdId/ai-schedule/apply - Apply AI schedule
  fastify.post('/apply', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = request.body as ApplyScheduleRequest;

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
        message: 'Only parents can apply schedules',
      });
    }

    // This would normally retrieve the stored schedule
    // For simplicity, we'll accept suggestions directly in the request
    const suggestions = (request.body as { suggestions?: ScheduleSuggestion[] })
      .suggestions;
    if (!suggestions || !Array.isArray(suggestions)) {
      return reply.status(400).send({
        error: 'Invalid request',
        message: 'Suggestions array is required',
      });
    }

    const filterIds = new Set(body.suggestionIds);
    const toApply = suggestions.filter((s) => filterIds.has(s.id));

    const result: ApplyScheduleResult = {
      applied: 0,
      skipped: 0,
      conflicts: [],
      scheduleIds: [],
    };

    for (const suggestion of toApply) {
      // Check for conflicts
      const existingSchedule = await db.query.choreSchedules.findFirst({
        where: and(
          eq(choreSchedules.choreId, suggestion.choreId),
          eq(choreSchedules.scheduledDate, suggestion.suggestedDate)
        ),
      });

      if (existingSchedule) {
        result.conflicts.push({
          type: 'duplicate',
          message: `${suggestion.choreTitle} is already scheduled for ${suggestion.suggestedDate}`,
          affectedChoreId: suggestion.choreId,
          suggestedDate: suggestion.suggestedDate,
          resolution: 'Skip this suggestion or choose a different date',
        });
        result.skipped++;
        continue;
      }

      // Create schedule
      const [newSchedule] = await db
        .insert(choreSchedules)
        .values({
          householdId,
          choreId: suggestion.choreId,
          assignedTo: suggestion.memberId,
          scheduledDate: suggestion.suggestedDate,
        })
        .returning();

      result.scheduleIds.push(newSchedule.id);
      result.applied++;
    }

    return result;
  });

  // GET /api/households/:householdId/ai-schedule/workload - Get workload analysis
  fastify.get('/workload', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const query = request.query as { period?: string; startDate?: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const period = query.period || 'week';
    const { start, end } = getDateRange(period, query.startDate);

    const workload = await calculateWorkload(householdId, start, end);

    return {
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
      workload,
    };
  });

  // GET /api/households/:householdId/ai-schedule/patterns/:memberId - Get member patterns
  fastify.get('/patterns/:memberId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as {
      householdId: string;
      memberId: string;
    };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Verify member exists in household
    const targetMember = await db.query.members.findFirst({
      where: and(
        eq(members.id, memberId),
        eq(members.householdId, householdId)
      ),
    });

    if (!targetMember) {
      return reply.status(404).send({ error: 'Member not found' });
    }

    const pattern = await analyzePatterns(householdId, memberId);
    return pattern;
  });

  // GET /api/households/:householdId/ai-schedule/analytics - Get schedule analytics
  fastify.get('/analytics', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const query = request.query as { period?: string; startDate?: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const period = query.period || 'week';
    const { start, end } = getDateRange(period, query.startDate);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    // Get members
    const householdMembers = await db.query.members.findMany({
      where: and(
        eq(members.householdId, householdId),
        eq(members.isActive, true)
      ),
    });

    // Get schedules
    const schedules = await db.query.choreSchedules.findMany({
      where: and(
        eq(choreSchedules.householdId, householdId),
        gte(choreSchedules.scheduledDate, startStr),
        lte(choreSchedules.scheduledDate, endStr)
      ),
    });

    // Get completions
    const completions = await db.query.choreCompletions.findMany({
      where: and(
        eq(choreCompletions.householdId, householdId),
        gte(choreCompletions.completedAt, start),
        lte(choreCompletions.completedAt, end)
      ),
    });

    const totalScheduled = schedules.length;
    const totalCompleted = completions.filter(
      (c) => c.status !== 'rejected'
    ).length;
    const completionRate =
      totalScheduled > 0
        ? Math.round((totalCompleted / totalScheduled) * 100)
        : 0;

    // Workload distribution
    const workloadDistribution = householdMembers.map((member) => {
      const assigned = schedules.filter(
        (s) => s.assignedTo === member.id
      ).length;
      const completed = completions.filter(
        (c) => c.memberId === member.id && c.status !== 'rejected'
      ).length;

      return {
        memberId: member.id,
        memberName: member.name,
        assigned,
        completed,
        percentage:
          totalScheduled > 0 ? Math.round((assigned / totalScheduled) * 100) : 0,
      };
    });

    // Peak days
    const dayCount = new Map<number, number>();
    for (const schedule of schedules) {
      const day = new Date(schedule.scheduledDate).getDay();
      dayCount.set(day, (dayCount.get(day) || 0) + 1);
    }
    const peakDays = Array.from(dayCount.entries())
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => b.count - a.count);

    // Get chores for category breakdown
    const choreIds = [...new Set(schedules.map((s) => s.choreId))];
    const choresData =
      choreIds.length > 0
        ? await db.query.chores.findMany({
            where: eq(chores.householdId, householdId),
          })
        : [];
    const choreMap = new Map(choresData.map((c) => [c.id, c]));

    const categoryCount = new Map<string, number>();
    for (const schedule of schedules) {
      const chore = choreMap.get(schedule.choreId);
      const category = chore?.category || 'general';
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    }
    const categoryBreakdown = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Generate recommendations
    const recommendations: OptimizationSuggestion[] = [];

    // Check for workload imbalance
    const avgAssigned = totalScheduled / (workloadDistribution.length || 1);
    for (const dist of workloadDistribution) {
      if (dist.assigned > avgAssigned * 1.5) {
        recommendations.push({
          type: 'redistribute',
          priority: 'medium',
          title: `${dist.memberName} has high workload`,
          description: `${dist.memberName} has ${dist.assigned} chores assigned, which is above the average of ${Math.round(avgAssigned)}`,
          impact: 'Better workload balance may improve completion rates',
          affectedMembers: [dist.memberId],
          affectedChores: [],
          suggestedAction: {
            action: 'redistribute',
            params: { memberId: dist.memberId, targetCount: Math.round(avgAssigned) },
          },
        });
      }
    }

    // Check for low completion rate
    if (completionRate < 70) {
      recommendations.push({
        type: 'reschedule',
        priority: 'high',
        title: 'Low completion rate',
        description: `Only ${completionRate}% of scheduled chores were completed`,
        impact: 'Consider reducing workload or adjusting schedule',
        affectedMembers: [],
        affectedChores: [],
        suggestedAction: {
          action: 'analyze',
          params: {},
        },
      });
    }

    const analytics: ScheduleAnalytics = {
      householdId,
      period: { start: startStr, end: endStr },
      totalScheduled,
      totalCompleted,
      completionRate,
      workloadDistribution,
      peakDays,
      categoryBreakdown,
      recommendations,
    };

    return analytics;
  });
}
