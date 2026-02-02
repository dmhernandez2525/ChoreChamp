import { FastifyInstance } from 'fastify';
import { db } from '@chorechamp/database';
import { members } from '@chorechamp/database/schema';
import { eq, and } from 'drizzle-orm';
import type {
  SeasonalEvent,
  EventCalendar,
  EventParticipation,
  HouseholdEventStats,
  EventLeaderboardEntry,
  ClaimRewardRequest,
  UpdateChallengeProgressRequest,
} from '@chorechamp/types';
import { SEASONAL_EVENTS, getEventStatus } from '@chorechamp/types';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

// In-memory storage
const eventParticipations = new Map<string, EventParticipation[]>();
const claimedRewards = new Map<string, Set<string>>();

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

// Generate mock event data
function generateActiveEvents(): SeasonalEvent[] {
  const now = new Date();

  // Create a current active event based on templates
  return SEASONAL_EVENTS.map((template) => {
    const startDate = new Date(template.startDate);
    const endDate = new Date(template.endDate);

    // Adjust dates to make some events active for demo
    const status = getEventStatus(template);
    const adjustedStart = status === 'ended' ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) : startDate;
    const adjustedEnd = status === 'ended' ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) : endDate;

    return {
      ...template,
      startDate: adjustedStart.toISOString(),
      endDate: adjustedEnd.toISOString(),
      status: getEventStatus({ startDate: adjustedStart.toISOString(), endDate: adjustedEnd.toISOString() }),
      isParticipating: false,
      progress: {
        totalChallengesCompleted: 0,
        totalChallenges: template.challenges.length,
        pointsEarned: 0,
        rewardsClaimed: 0,
        totalRewards: template.rewards.length,
      },
      createdAt: new Date().toISOString(),
    };
  });
}

export async function seasonalEventRoutes(fastify: FastifyInstance) {
  // GET /api/households/:householdId/events - Get event calendar
  fastify.get('/', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const events = generateActiveEvents();
    const participationKey = `${householdId}-${membership.id}`;
    const participations = eventParticipations.get(participationKey) || [];

    // Update participation status
    const eventsWithParticipation = events.map((event) => {
      const participation = participations.find((p) => p.eventId === event.id);
      return {
        ...event,
        isParticipating: !!participation,
        progress: participation?.progress || event.progress,
      };
    });

    const calendar: EventCalendar = {
      currentEvents: eventsWithParticipation.filter((e) => e.status === 'active'),
      upcomingEvents: eventsWithParticipation.filter((e) => e.status === 'upcoming'),
      pastEvents: eventsWithParticipation.filter((e) => e.status === 'ended').slice(0, 5),
      nextEvent: eventsWithParticipation.find((e) => e.status === 'upcoming'),
    };

    return calendar;
  });

  // GET /api/households/:householdId/events/:eventId - Get event details
  fastify.get('/:eventId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, eventId } = request.params as { householdId: string; eventId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const events = generateActiveEvents();
    const event = events.find((e) => e.id === eventId);

    if (!event) {
      return reply.status(404).send({ error: 'Event not found' });
    }

    // Check participation
    const participationKey = `${householdId}-${membership.id}`;
    const participations = eventParticipations.get(participationKey) || [];
    const participation = participations.find((p) => p.eventId === eventId);

    // Check claimed rewards
    const memberClaimed = claimedRewards.get(membership.id) || new Set();

    // Update event with participation data
    const eventWithProgress: SeasonalEvent = {
      ...event,
      isParticipating: !!participation,
      progress: participation?.progress || event.progress,
      challenges: event.challenges.map((c) => ({
        ...c,
        goal: {
          ...c.goal,
          current: participation?.challengeProgress.find((cp) => cp.challengeId === c.id)?.current || 0,
        },
        isCompleted: (participation?.challengeProgress.find((cp) => cp.challengeId === c.id)?.current || 0) >= c.goal.target,
      })),
      rewards: event.rewards.map((r) => ({
        ...r,
        claimed: memberClaimed.has(r.id),
      })),
      achievements: event.achievements.map((a) => ({
        ...a,
        isUnlocked: participation?.achievementsUnlocked.includes(a.id) || false,
      })),
    };

    return { event: eventWithProgress };
  });

  // POST /api/households/:householdId/events/:eventId/join - Join event
  fastify.post('/:eventId/join', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, eventId } = request.params as { householdId: string; eventId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const events = generateActiveEvents();
    const event = events.find((e) => e.id === eventId);

    if (!event) {
      return reply.status(404).send({ error: 'Event not found' });
    }

    if (event.status !== 'active') {
      return reply.status(400).send({ error: 'Event is not active' });
    }

    const participationKey = `${householdId}-${membership.id}`;
    const participations = eventParticipations.get(participationKey) || [];

    // Check if already participating
    if (participations.some((p) => p.eventId === eventId)) {
      return reply.status(400).send({ error: 'Already participating in this event' });
    }

    const participation: EventParticipation = {
      eventId,
      memberId: membership.id,
      memberName: membership.name,
      joinedAt: new Date().toISOString(),
      progress: {
        totalChallengesCompleted: 0,
        totalChallenges: event.challenges.length,
        pointsEarned: 0,
        rewardsClaimed: 0,
        totalRewards: event.rewards.length,
      },
      challengeProgress: event.challenges.map((c) => ({
        challengeId: c.id,
        current: 0,
        target: c.goal.target,
      })),
      rewardsClaimed: [],
      achievementsUnlocked: [],
    };

    participations.push(participation);
    eventParticipations.set(participationKey, participations);

    return { success: true, participation };
  });

  // POST /api/households/:householdId/events/:eventId/progress - Update challenge progress
  fastify.post('/:eventId/progress', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, eventId } = request.params as { householdId: string; eventId: string };
    const body = request.body as UpdateChallengeProgressRequest;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const participationKey = `${householdId}-${membership.id}`;
    const participations = eventParticipations.get(participationKey) || [];
    const participation = participations.find((p) => p.eventId === eventId);

    if (!participation) {
      return reply.status(400).send({ error: 'Not participating in this event' });
    }

    const challengeProgress = participation.challengeProgress.find((cp) => cp.challengeId === body.challengeId);
    if (!challengeProgress) {
      return reply.status(404).send({ error: 'Challenge not found' });
    }

    challengeProgress.current = Math.min(challengeProgress.current + body.increment, challengeProgress.target);

    // Check if challenge completed
    const wasCompleted = challengeProgress.current >= challengeProgress.target;
    if (wasCompleted) {
      participation.progress.totalChallengesCompleted = participation.challengeProgress.filter(
        (cp) => cp.current >= cp.target
      ).length;
    }

    participation.progress.pointsEarned += body.increment * 10;
    eventParticipations.set(participationKey, participations);

    return {
      success: true,
      challengeProgress,
      challengeCompleted: wasCompleted,
      totalProgress: participation.progress,
    };
  });

  // POST /api/households/:householdId/events/:eventId/claim - Claim reward
  fastify.post('/:eventId/claim', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, eventId } = request.params as { householdId: string; eventId: string };
    const body = request.body as ClaimRewardRequest;

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const participationKey = `${householdId}-${membership.id}`;
    const participations = eventParticipations.get(participationKey) || [];
    const participation = participations.find((p) => p.eventId === eventId);

    if (!participation) {
      return reply.status(400).send({ error: 'Not participating in this event' });
    }

    // Check if reward already claimed
    const memberClaimed = claimedRewards.get(membership.id) || new Set();
    if (memberClaimed.has(body.rewardId)) {
      return reply.status(400).send({ error: 'Reward already claimed' });
    }

    // Claim reward
    memberClaimed.add(body.rewardId);
    claimedRewards.set(membership.id, memberClaimed);
    participation.rewardsClaimed.push(body.rewardId);
    participation.progress.rewardsClaimed++;

    eventParticipations.set(participationKey, participations);

    return { success: true, rewardId: body.rewardId };
  });

  // GET /api/households/:householdId/events/:eventId/leaderboard - Get event leaderboard
  fastify.get('/:eventId/leaderboard', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, eventId } = request.params as { householdId: string; eventId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    // Get all household members
    const householdMembers = await db.query.members.findMany({
      where: eq(members.householdId, householdId),
    });

    // Build leaderboard
    const entries: EventLeaderboardEntry[] = householdMembers.map((m, index) => {
      const participationKey = `${householdId}-${m.id}`;
      const participations = eventParticipations.get(participationKey) || [];
      const participation = participations.find((p) => p.eventId === eventId);

      return {
        rank: 0,
        memberId: m.id,
        memberName: m.name,
        avatarUrl: m.avatarUrl || undefined,
        points: participation?.progress.pointsEarned || (index * 50), // Mock points for demo
        challengesCompleted: participation?.progress.totalChallengesCompleted || 0,
        isCurrentUser: m.id === membership.id,
      };
    });

    // Sort by points and assign ranks
    entries.sort((a, b) => b.points - a.points);
    entries.forEach((e, i) => {
      e.rank = i + 1;
    });

    const stats: HouseholdEventStats = {
      householdId,
      eventId,
      totalParticipants: entries.filter((e) => e.points > 0).length,
      totalChoresCompleted: entries.reduce((sum, e) => sum + e.challengesCompleted * 5, 0),
      totalPointsEarned: entries.reduce((sum, e) => sum + e.points, 0),
      challengesCompleted: entries.reduce((sum, e) => sum + e.challengesCompleted, 0),
      leaderboard: entries,
    };

    return stats;
  });
}
