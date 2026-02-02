import { FastifyInstance } from 'fastify';
import { db } from '@chorechamp/database';
import { members } from '@chorechamp/database/schema';
import { eq, and } from 'drizzle-orm';
import type {
  FamilyChallenge,
  ChallengeParticipant,
  ChallengeSummary,
  ChallengeLeaderboardEntry,
  HouseholdChallengesOverview,
  CreateChallengeRequest,
  UpdateChallengeRequest,
  JoinChallengeRequest,
  ChallengeSettings,
} from '@chorechamp/types';
import { getChallengeProgress, getChallengeTimeRemaining, CHALLENGE_TEMPLATES } from '@chorechamp/types';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { randomUUID } from 'crypto';

// In-memory storage
const challenges = new Map<string, FamilyChallenge[]>();

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
    const now = new Date().toISOString();

    const overview: HouseholdChallengesOverview = {
      householdId,
      activeChallenges: householdChallenges.filter((c) => c.status === 'active'),
      upcomingChallenges: householdChallenges.filter((c) => c.status === 'draft' && c.startDate > now),
      completedChallenges: householdChallenges.filter((c) => c.status === 'completed').slice(0, 5),
      stats: {
        totalChallengesCreated: householdChallenges.length,
        totalChallengesCompleted: householdChallenges.filter((c) => c.status === 'completed').length,
        totalChallengesWon: Math.floor(householdChallenges.filter((c) => c.status === 'completed').length * 0.7),
        averageParticipation: 85,
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
    const body = request.body as CreateChallengeRequest;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership || (membership.role !== 'parent' && membership.role !== 'admin')) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can create challenges' });
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
    const body = request.body as UpdateChallengeRequest;

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
    const body = request.body as JoinChallengeRequest;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const householdChallenges = challenges.get(householdId) || [];
    const challenge = householdChallenges.find((c) => c.id === challengeId);

    if (!challenge) {
      return reply.status(404).send({ error: 'Challenge not found' });
    }

    if (challenge.status !== 'active' && !challenge.settings.allowLateJoin) {
      return reply.status(400).send({ error: 'Cannot join this challenge' });
    }

    const [joiningMember] = await db.query.members.findMany({
      where: eq(members.id, body.memberId),
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
    const body = request.body as { memberId: string; contribution: number };

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
