import { FastifyInstance } from 'fastify';
import { db } from '../lib/db';
import { members } from '@chorechamp/database';
import { eq, and } from 'drizzle-orm';
import type {
  FamilyChallenge,
  ChallengeParticipant,
  ChallengeSummary,
  ChallengeLeaderboardEntry,
  HouseholdChallengesOverview,
  ChallengeSettings,
} from '@chorechamp/types';
import {
  getChallengeProgress,
  getChallengeTimeRemaining,
  CHALLENGE_TEMPLATES,
  CreateChallengeRequestSchema,
  UpdateChallengeRequestSchema,
  JoinChallengeRequestSchema,
  UpdateProgressRequestSchema,
} from '@chorechamp/types';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership } from '../lib/membership';
import { randomUUID } from 'crypto';

// In-memory storage
const challenges = new Map<string, FamilyChallenge[]>();

// Default settings
function getDefaultSettings(): ChallengeSettings {
  return {
    allowLateJoin: true,
    showProgress: true,
    showLeaderboard: true,
    notifyOnProgress: true,
    notifyOnMilestone: true,
    milestonePercentages: [25, 50, 75, 100],
  };
}

export async function familyChallengeRoutes(fastify: FastifyInstance) {
  // GET /api/households/:householdId/challenges - Get overview
  fastify.get('/', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const householdChallenges = challenges.get(householdId) || [];
    const now = new Date();
    const nowIso = now.toISOString();

    // Update status for any expired challenges
    householdChallenges.forEach((c) => {
      if (c.status === 'active' && new Date(c.endDate) < now) {
        c.status = c.goal.current >= c.goal.target ? 'completed' : 'expired';
        c.updatedAt = nowIso;
      }
      if (c.status === 'draft' && new Date(c.startDate) <= now) {
        c.status = 'active';
        c.updatedAt = nowIso;
      }
    });
    challenges.set(householdId, householdChallenges);

    // Calculate actual statistics
    const completedChallenges = householdChallenges.filter((c) => c.status === 'completed');
    const challengesWithGoalMet = completedChallenges.filter((c) => c.goal.current >= c.goal.target);

    // Calculate average participation rate
    const totalParticipants = householdChallenges.reduce((sum, c) => sum + c.participants.length, 0);
    const householdMemberCount = await db.query.members.findMany({
      where: eq(members.householdId, householdId),
    });
    const maxPossibleParticipants = householdChallenges.length * householdMemberCount.length;
    const avgParticipation = maxPossibleParticipants > 0
      ? Math.round((totalParticipants / maxPossibleParticipants) * 100)
      : 0;

    const overview: HouseholdChallengesOverview = {
      householdId,
      activeChallenges: householdChallenges.filter((c) => c.status === 'active'),
      upcomingChallenges: householdChallenges.filter((c) => c.status === 'draft' && c.startDate > nowIso),
      completedChallenges: completedChallenges.slice(0, 5),
      stats: {
        totalChallengesCreated: householdChallenges.length,
        totalChallengesCompleted: completedChallenges.length,
        totalChallengesWon: challengesWithGoalMet.length,
        averageParticipation: avgParticipation,
      },
    };

    return overview;
  });

  // GET /api/households/:householdId/challenges/templates - Get templates
  fastify.get('/templates', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    return { templates: CHALLENGE_TEMPLATES };
  });

  // POST /api/households/:householdId/challenges - Create challenge
  fastify.post('/', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    // Validate request body
    const parseResult = CreateChallengeRequestSchema.safeParse(request.body);
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
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can create challenges' });
    }

    // Validate dates
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    if (endDate <= startDate) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: 'End date must be after start date',
      });
    }

    // Get participant names
    const householdMembers = await db.query.members.findMany({
      where: eq(members.householdId, householdId),
    });

    const participants: ChallengeParticipant[] = body.participantIds.map((id) => {
      const member = householdMembers.find((m) => m.id === id);
      return {
        memberId: id,
        memberName: member?.name || 'Unknown',
        progress: 0,
        contribution: 0,
        joinedAt: new Date().toISOString(),
        isActive: true,
      };
    });

    const challenge: FamilyChallenge = {
      id: randomUUID(),
      householdId,
      title: body.title,
      description: body.description,
      type: body.type,
      status: new Date(body.startDate) <= new Date() ? 'active' : 'draft',
      goal: { ...body.goal, current: 0 },
      rewards: body.rewards,
      participants,
      teams: body.teams?.map((t) => ({
        id: randomUUID(),
        ...t,
        progress: 0,
        totalContribution: 0,
      })),
      startDate: body.startDate,
      endDate: body.endDate,
      createdBy: membership.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: { ...getDefaultSettings(), ...body.settings },
    };

    const householdChallenges = challenges.get(householdId) || [];
    householdChallenges.push(challenge);
    challenges.set(householdId, householdChallenges);

    return challenge;
  });

  // GET /api/households/:householdId/challenges/:challengeId - Get challenge
  fastify.get('/:challengeId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, challengeId } = request.params as { householdId: string; challengeId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const householdChallenges = challenges.get(householdId) || [];
    const challenge = householdChallenges.find((c) => c.id === challengeId);

    if (!challenge) {
      return reply.status(404).send({ error: 'Challenge not found' });
    }

    // Build leaderboard
    const leaderboard: ChallengeLeaderboardEntry[] = challenge.participants
      .sort((a, b) => b.contribution - a.contribution)
      .map((p, i) => ({
        rank: i + 1,
        memberId: p.memberId,
        memberName: p.memberName,
        progress: p.progress,
        contribution: p.contribution,
        isCurrentUser: p.memberId === membership.id,
      }));

    const summary: ChallengeSummary = {
      challenge,
      leaderboard,
      milestones: challenge.settings.milestonePercentages.map((pct) => ({
        percentage: pct,
        reachedAt: getChallengeProgress(challenge) >= pct ? new Date().toISOString() : null,
        reachedBy: null,
      })),
      timeRemaining: getChallengeTimeRemaining(challenge.endDate),
      progressPercentage: getChallengeProgress(challenge),
      isParticipating: challenge.participants.some((p) => p.memberId === membership.id),
      userRank: leaderboard.find((e) => e.isCurrentUser)?.rank || null,
    };

    return summary;
  });

  // PATCH /api/households/:householdId/challenges/:challengeId - Update challenge
  fastify.patch('/:challengeId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, challengeId } = request.params as { householdId: string; challengeId: string };

    // Validate request body
    const parseResult = UpdateChallengeRequestSchema.safeParse(request.body);
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
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can update challenges' });
    }

    const householdChallenges = challenges.get(householdId) || [];
    const index = householdChallenges.findIndex((c) => c.id === challengeId);

    if (index === -1) {
      return reply.status(404).send({ error: 'Challenge not found' });
    }

    householdChallenges[index] = {
      ...householdChallenges[index],
      ...body,
      settings: body.settings
        ? { ...householdChallenges[index].settings, ...body.settings }
        : householdChallenges[index].settings,
      updatedAt: new Date().toISOString(),
    };

    challenges.set(householdId, householdChallenges);
    return householdChallenges[index];
  });

  // POST /api/households/:householdId/challenges/:challengeId/join - Join challenge
  fastify.post('/:challengeId/join', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, challengeId } = request.params as { householdId: string; challengeId: string };

    // Validate request body
    const parseResult = JoinChallengeRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: 'Invalid request body',
        details: parseResult.error.flatten(),
      });
    }
    const body = parseResult.data;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const householdChallenges = challenges.get(householdId) || [];
    const challenge = householdChallenges.find((c) => c.id === challengeId);

    if (!challenge) {
      return reply.status(404).send({ error: 'Challenge not found' });
    }

    // Check if challenge accepts new participants
    const isJoinableStatus = challenge.status === 'draft' || challenge.status === 'active';

    if (!isJoinableStatus) {
      return reply.status(400).send({
        error: 'Cannot join challenge',
        message: `Challenge is ${challenge.status} and does not accept new participants`,
      });
    }

    // Check late join policy for active challenges
    if (challenge.status === 'active' && !challenge.settings.allowLateJoin) {
      const challengeStartTime = new Date(challenge.startDate).getTime();
      const now = Date.now();
      const hoursSinceStart = (now - challengeStartTime) / (1000 * 60 * 60);

      // Allow late join only within first 24 hours if late join is disabled
      if (hoursSinceStart > 24) {
        return reply.status(400).send({
          error: 'Late join not allowed',
          message: 'This challenge does not accept late participants after 24 hours',
        });
      }
    }

    // Check if already a participant
    const existingParticipant = challenge.participants.find((p) => p.memberId === body.memberId);
    if (existingParticipant) {
      return reply.status(400).send({
        error: 'Already participating',
        message: 'Member is already a participant in this challenge',
      });
    }

    const [joiningMember] = await db.query.members.findMany({
      where: and(eq(members.id, body.memberId), eq(members.householdId, householdId)),
      limit: 1,
    });

    if (!joiningMember) {
      return reply.status(404).send({ error: 'Member not found' });
    }

    challenge.participants.push({
      memberId: body.memberId,
      memberName: joiningMember.name,
      teamId: body.teamId,
      progress: 0,
      contribution: 0,
      joinedAt: new Date().toISOString(),
      isActive: true,
    });

    challenges.set(householdId, householdChallenges);
    return { success: true, challenge };
  });

  // POST /api/households/:householdId/challenges/:challengeId/progress - Update progress
  fastify.post('/:challengeId/progress', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, challengeId } = request.params as { householdId: string; challengeId: string };

    // Validate request body
    const parseResult = UpdateProgressRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: 'Invalid request body',
        details: parseResult.error.flatten(),
      });
    }
    const body = parseResult.data;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const householdChallenges = challenges.get(householdId) || [];
    const challenge = householdChallenges.find((c) => c.id === challengeId);

    if (!challenge) {
      return reply.status(404).send({ error: 'Challenge not found' });
    }

    const participant = challenge.participants.find((p) => p.memberId === body.memberId);
    if (!participant) {
      return reply.status(400).send({ error: 'Not a participant' });
    }

    // Authorization: Only the participant themselves or parents/admins can update progress
    const isOwnProgress = body.memberId === membership.id;
    const isParentOrAdmin = membership.role === 'parent' || membership.role === 'admin';
    if (!isOwnProgress && !isParentOrAdmin) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only update your own progress',
      });
    }

    participant.contribution += body.contribution;
    participant.progress = Math.min(100, (participant.contribution / challenge.goal.target) * 100);
    challenge.goal.current += body.contribution;

    // Check completion
    if (challenge.goal.current >= challenge.goal.target && challenge.status === 'active') {
      challenge.status = 'completed';
    }

    challenges.set(householdId, householdChallenges);
    return { success: true, challenge, progressPercentage: getChallengeProgress(challenge) };
  });

  // DELETE /api/households/:householdId/challenges/:challengeId - Delete challenge
  fastify.delete('/:challengeId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, challengeId } = request.params as { householdId: string; challengeId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership || (membership.role !== 'parent' && membership.role !== 'admin')) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can delete challenges' });
    }

    const householdChallenges = challenges.get(householdId) || [];
    const filtered = householdChallenges.filter((c) => c.id !== challengeId);

    if (filtered.length === householdChallenges.length) {
      return reply.status(404).send({ error: 'Challenge not found' });
    }

    challenges.set(householdId, filtered);
    return { success: true };
  });
}
