import { FastifyInstance } from 'fastify';
import { db } from '@chorechamp/database';
import { members, chores, choreCompletions } from '@chorechamp/database/schema';
import { eq, and } from 'drizzle-orm';
import type {
  DifficultyLevel,
  CalibrationSettings,
  CalibrationSuggestion,
  ChoreCalibrationAnalysis,
  HouseholdCalibrationSummary,
  MemberChorePerformance,
  CalibrationHistoryEntry,
  MemberPerformanceSummary,
  UpdateCalibrationSettingsRequest,
  ApplyCalibrationRequest,
  BulkApplyCalibrationRequest,
} from '@chorechamp/types';
import {
  calculateSuggestedPoints,
  determineCalibrationStatus,
} from '@chorechamp/types';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { randomUUID } from 'crypto';

// In-memory storage (in production, use database)
const calibrationSettings = new Map<string, CalibrationSettings>();
const calibrationHistory = new Map<string, CalibrationHistoryEntry[]>();

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
function getDefaultSettings(_householdId: string): CalibrationSettings {
  return {
    enabled: true,
    autoApply: false,
    minCompletionsRequired: 5,
    calibrationFrequency: 'weekly',
    notifyOnSuggestion: true,
    pointsAdjustmentLimit: 20,
    considerMemberAge: true,
    lastCalibrationAt: null,
    nextCalibrationAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

// Map difficulty string to level
function mapDifficulty(difficulty: string | null): DifficultyLevel {
  const mapping: Record<string, DifficultyLevel> = {
    trivial: 'trivial',
    easy: 'easy',
    medium: 'medium',
    hard: 'hard',
    expert: 'expert',
  };
  return mapping[difficulty || 'medium'] || 'medium';
}

// Calculate performance level
function calculatePerformanceLevel(
  completionRate: number,
  _onTimeRate: number
): 'exceeds' | 'meets' | 'struggles' | 'insufficient_data' {
  if (completionRate >= 90) return 'exceeds';
  if (completionRate >= 70) return 'meets';
  return 'struggles';
}

// Generate suggestions for a chore
function generateSuggestions(
  chore: typeof chores.$inferSelect,
  householdCompletionRate: number,
  memberPerformance: MemberChorePerformance[]
): CalibrationSuggestion[] {
  const suggestions: CalibrationSuggestion[] = [];
  const currentDifficulty = mapDifficulty(chore.difficulty);
  const currentPoints = chore.pointValue;

  // Check household-wide performance
  if (householdCompletionRate > 95) {
    // Too easy, suggest harder
    const difficulties: DifficultyLevel[] = ['trivial', 'easy', 'medium', 'hard', 'expert'];
    const currentIndex = difficulties.indexOf(currentDifficulty);
    if (currentIndex < difficulties.length - 1) {
      const suggestedDifficulty = difficulties[currentIndex + 1];
      suggestions.push({
        choreId: chore.id,
        choreTitle: chore.title,
        currentDifficulty,
        suggestedDifficulty,
        currentPoints,
        suggestedPoints: calculateSuggestedPoints(currentDifficulty, suggestedDifficulty, currentPoints),
        confidence: Math.min(95, 60 + (householdCompletionRate - 95) * 5),
        reason: `Completion rate of ${householdCompletionRate.toFixed(0)}% suggests this chore may be too easy`,
        basedOn: ['completion_rate', 'household_average'],
      });
    }
  } else if (householdCompletionRate < 50) {
    // Too hard, suggest easier
    const difficulties: DifficultyLevel[] = ['trivial', 'easy', 'medium', 'hard', 'expert'];
    const currentIndex = difficulties.indexOf(currentDifficulty);
    if (currentIndex > 0) {
      const suggestedDifficulty = difficulties[currentIndex - 1];
      suggestions.push({
        choreId: chore.id,
        choreTitle: chore.title,
        currentDifficulty,
        suggestedDifficulty,
        currentPoints,
        suggestedPoints: calculateSuggestedPoints(currentDifficulty, suggestedDifficulty, currentPoints),
        confidence: Math.min(95, 60 + (50 - householdCompletionRate)),
        reason: `Completion rate of ${householdCompletionRate.toFixed(0)}% suggests this chore may be too difficult`,
        basedOn: ['completion_rate', 'household_average'],
      });
    }
  }

  // Check for member-specific suggestions
  for (const perf of memberPerformance) {
    if (perf.performanceLevel === 'struggles' && perf.completionRate < 40) {
      const difficulties: DifficultyLevel[] = ['trivial', 'easy', 'medium', 'hard', 'expert'];
      const currentIndex = difficulties.indexOf(currentDifficulty);
      if (currentIndex > 0) {
        suggestions.push({
          choreId: chore.id,
          choreTitle: chore.title,
          currentDifficulty,
          suggestedDifficulty: difficulties[currentIndex - 1],
          currentPoints,
          suggestedPoints: currentPoints, // Keep points same for member-specific
          confidence: 70,
          reason: `${perf.memberName} has a ${perf.completionRate.toFixed(0)}% completion rate`,
          basedOn: ['completion_rate', 'member_experience'],
          memberSpecific: {
            memberId: perf.memberId,
            memberName: perf.memberName,
            performance: 'struggles',
          },
        });
      }
    }
  }

  return suggestions;
}

export async function difficultyCalibrationRoutes(fastify: FastifyInstance) {
  // GET /api/households/:householdId/calibration - Get calibration summary
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

    // Get settings
    const settings = calibrationSettings.get(householdId) || getDefaultSettings(householdId);

    // Get all chores
    const householdChores = await db.query.chores.findMany({
      where: and(
        eq(chores.householdId, householdId),
        eq(chores.isActive, true)
      ),
    });

    // Get completions
    const completions = await db.query.choreCompletions.findMany({
      where: eq(choreCompletions.householdId, householdId),
    });

    // Get members
    const householdMembers = await db.query.members.findMany({
      where: eq(members.householdId, householdId),
    });

    // Calculate metrics per chore
    const suggestions: CalibrationSuggestion[] = [];
    let needsCalibration = 0;
    let calibrated = 0;

    for (const chore of householdChores) {
      const choreCompletionList = completions.filter((c) => c.choreId === chore.id);
      const completionRate = choreCompletionList.length > 0
        ? (choreCompletionList.filter((c) => c.status === 'approved').length / choreCompletionList.length) * 100
        : 0;

      const memberPerf: MemberChorePerformance[] = [];
      const currentYear = new Date().getFullYear();
      for (const member of householdMembers) {
        const memberCompletions = choreCompletionList.filter((c) => c.memberId === member.id);
        if (memberCompletions.length > 0) {
          const memberRate = (memberCompletions.filter((c) => c.status === 'approved').length / memberCompletions.length) * 100;
          const memberAge = member.birthYear ? currentYear - member.birthYear : null;
          memberPerf.push({
            memberId: member.id,
            memberName: member.name,
            memberAge,
            completionRate: memberRate,
            averageTimeMinutes: null,
            performanceLevel: calculatePerformanceLevel(memberRate, memberRate),
            lastCompletion: memberCompletions[0]?.completedAt?.toISOString() || null,
          });
        }
      }

      if (choreCompletionList.length >= settings.minCompletionsRequired) {
        const status = determineCalibrationStatus(completionRate, completionRate);
        if (status !== 'calibrated') {
          needsCalibration++;
          const choreSuggestions = generateSuggestions(chore, completionRate, memberPerf);
          suggestions.push(...choreSuggestions);
        } else {
          calibrated++;
        }
      }
    }

    // Member performance summary
    const memberPerformanceSummary: MemberPerformanceSummary[] = householdMembers
      .filter((m) => m.role === 'child' || m.role === 'teen')
      .map((member) => {
        const memberCompletions = completions.filter((c) => c.memberId === member.id);
        const approvedCount = memberCompletions.filter((c) => c.status === 'approved').length;
        const rate = memberCompletions.length > 0 ? (approvedCount / memberCompletions.length) * 100 : 0;

        return {
          memberId: member.id,
          memberName: member.name,
          totalChoresAssigned: householdChores.length,
          averageCompletionRate: rate,
          choresExceeding: rate >= 90 ? Math.floor(householdChores.length * 0.3) : 0,
          choresMeeting: rate >= 70 ? Math.floor(householdChores.length * 0.5) : 0,
          choresStruggling: rate < 50 ? Math.floor(householdChores.length * 0.2) : 0,
          suggestedAdjustments: suggestions.filter((s) => s.memberSpecific?.memberId === member.id).length,
        };
      });

    const summary: HouseholdCalibrationSummary = {
      householdId,
      settings,
      totalChores: householdChores.length,
      needsCalibration,
      calibrated,
      suggestions: suggestions.slice(0, 10),
      recentCalibrations: (calibrationHistory.get(householdId) || []).slice(0, 5),
      memberPerformanceSummary,
    };

    return summary;
  });

  // GET /api/households/:householdId/calibration/settings - Get settings
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

    return calibrationSettings.get(householdId) || getDefaultSettings(householdId);
  });

  // PUT /api/households/:householdId/calibration/settings - Update settings
  fastify.put('/settings', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = request.body as UpdateCalibrationSettingsRequest;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership || (membership.role !== 'parent' && membership.role !== 'admin')) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can update calibration settings',
      });
    }

    const existing = calibrationSettings.get(householdId) || getDefaultSettings(householdId);
    const updated: CalibrationSettings = {
      ...existing,
      ...body,
    };

    calibrationSettings.set(householdId, updated);
    return updated;
  });

  // GET /api/households/:householdId/calibration/chore/:choreId - Get chore analysis
  fastify.get('/chore/:choreId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId } = request.params as { householdId: string; choreId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const [chore] = await db.query.chores.findMany({
      where: and(
        eq(chores.id, choreId),
        eq(chores.householdId, householdId)
      ),
      limit: 1,
    });

    if (!chore) {
      return reply.status(404).send({ error: 'Chore not found' });
    }

    // Get completions
    const choreCompletionList = await db.query.choreCompletions.findMany({
      where: and(
        eq(choreCompletions.choreId, choreId),
        eq(choreCompletions.householdId, householdId)
      ),
    });

    // Get members
    const householdMembers = await db.query.members.findMany({
      where: eq(members.householdId, householdId),
    });

    const approvedCompletions = choreCompletionList.filter((c) => c.status === 'approved');
    const completionRate = choreCompletionList.length > 0
      ? (approvedCompletions.length / choreCompletionList.length) * 100
      : 0;

    // Calculate member performance
    const memberPerformance: MemberChorePerformance[] = [];
    const choreCurrentYear = new Date().getFullYear();
    for (const member of householdMembers) {
      const memberCompletions = choreCompletionList.filter((c) => c.memberId === member.id);
      if (memberCompletions.length > 0) {
        const memberApproved = memberCompletions.filter((c) => c.status === 'approved');
        const memberRate = (memberApproved.length / memberCompletions.length) * 100;
        const memberAge = member.birthYear ? choreCurrentYear - member.birthYear : null;
        memberPerformance.push({
          memberId: member.id,
          memberName: member.name,
          memberAge,
          completionRate: memberRate,
          averageTimeMinutes: null,
          performanceLevel: calculatePerformanceLevel(memberRate, memberRate),
          lastCompletion: memberCompletions[0]?.completedAt?.toISOString() || null,
        });
      }
    }

    const currentDifficulty = mapDifficulty(chore.difficulty);
    const status = determineCalibrationStatus(completionRate, completionRate);
    const suggestions = generateSuggestions(chore, completionRate, memberPerformance);

    const analysis: ChoreCalibrationAnalysis = {
      choreId: chore.id,
      choreTitle: chore.title,
      category: chore.category || 'general',
      currentDifficulty,
      currentPoints: chore.pointValue,
      status,
      metrics: {
        householdCompletionRate: completionRate,
        householdAverageTime: null,
        memberPerformance,
        recentTrend: 'stable',
      },
      suggestions,
    };

    return analysis;
  });

  // POST /api/households/:householdId/calibration/apply - Apply a calibration
  fastify.post('/apply', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = request.body as ApplyCalibrationRequest;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership || (membership.role !== 'parent' && membership.role !== 'admin')) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can apply calibrations',
      });
    }

    const [chore] = await db.query.chores.findMany({
      where: and(
        eq(chores.id, body.choreId),
        eq(chores.householdId, householdId)
      ),
      limit: 1,
    });

    if (!chore) {
      return reply.status(404).send({ error: 'Chore not found' });
    }

    const previousDifficulty = mapDifficulty(chore.difficulty);
    const previousPoints = chore.pointValue;

    // Update chore
    const updates: Partial<typeof chores.$inferInsert> = {};
    if (body.newDifficulty) {
      updates.difficulty = body.newDifficulty;
    }
    if (body.newPoints !== undefined) {
      updates.pointValue = body.newPoints;
    }

    const [updatedChore] = await db.update(chores)
      .set(updates)
      .where(eq(chores.id, body.choreId))
      .returning();

    // Record history
    const historyEntry: CalibrationHistoryEntry = {
      id: randomUUID(),
      choreId: chore.id,
      choreTitle: chore.title,
      previousDifficulty,
      newDifficulty: body.newDifficulty || previousDifficulty,
      previousPoints,
      newPoints: body.newPoints ?? previousPoints,
      appliedAt: new Date().toISOString(),
      appliedBy: 'manual',
      reason: 'Parent applied calibration',
    };

    const history = calibrationHistory.get(householdId) || [];
    history.unshift(historyEntry);
    calibrationHistory.set(householdId, history.slice(0, 50));

    return {
      success: true,
      chore: updatedChore,
      historyEntry,
    };
  });

  // POST /api/households/:householdId/calibration/bulk-apply - Apply multiple calibrations
  fastify.post('/bulk-apply', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = request.body as BulkApplyCalibrationRequest;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership || (membership.role !== 'parent' && membership.role !== 'admin')) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can apply calibrations',
      });
    }

    const results: Array<{ choreId: string; success: boolean; error?: string }> = [];
    const newHistory: CalibrationHistoryEntry[] = [];

    for (const suggestion of body.suggestions) {
      const [chore] = await db.query.chores.findMany({
        where: and(
          eq(chores.id, suggestion.choreId),
          eq(chores.householdId, householdId)
        ),
        limit: 1,
      });

      if (!chore) {
        results.push({ choreId: suggestion.choreId, success: false, error: 'Chore not found' });
        continue;
      }

      const previousDifficulty = mapDifficulty(chore.difficulty);
      const previousPoints = chore.pointValue;

      const updates: Partial<typeof chores.$inferInsert> = {};
      if (suggestion.newDifficulty) {
        updates.difficulty = suggestion.newDifficulty;
      }
      if (suggestion.newPoints !== undefined) {
        updates.pointValue = suggestion.newPoints;
      }

      await db.update(chores)
        .set(updates)
        .where(eq(chores.id, suggestion.choreId));

      newHistory.push({
        id: randomUUID(),
        choreId: chore.id,
        choreTitle: chore.title,
        previousDifficulty,
        newDifficulty: suggestion.newDifficulty || previousDifficulty,
        previousPoints,
        newPoints: suggestion.newPoints ?? previousPoints,
        appliedAt: new Date().toISOString(),
        appliedBy: 'manual',
        reason: 'Bulk calibration applied',
      });

      results.push({ choreId: suggestion.choreId, success: true });
    }

    // Update history
    const history = calibrationHistory.get(householdId) || [];
    history.unshift(...newHistory);
    calibrationHistory.set(householdId, history.slice(0, 50));

    return {
      applied: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  });

  // GET /api/households/:householdId/calibration/history - Get calibration history
  fastify.get('/history', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { householdId } = request.params as { householdId: string };
      const queryParams = request.query as { limit?: string };

      // Validate pagination
      const MAX_LIMIT = 100;
      const DEFAULT_LIMIT = 20;
      const limitNum = Math.min(
        Math.max(1, parseInt(queryParams.limit || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
        MAX_LIMIT
      );

      const membership = await verifyMembership(user.id, householdId);
      if (!membership) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You are not a member of this household',
        });
      }

      const history = calibrationHistory.get(householdId) || [];
      return reply.send({
        history: history.slice(0, limitNum),
        limit: limitNum,
      });
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch calibration history');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch calibration history',
      });
    }
  });
}
