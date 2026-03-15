import { FastifyInstance } from 'fastify';
import { db } from '../lib/db';
import { members } from '@chorechamp/database';
import { eq } from 'drizzle-orm';
import type {
  Achievement,
  AchievementShowcase,
  AchievementLeaderboard,
  AchievementFeed,
  AchievementShare,
  EarnedAchievement,
  AchievementCategory,
  AchievementRarity,
} from '@chorechamp/types';
import {
  ACHIEVEMENT_DEFINITIONS,
  calculateLevel,
  getTitleForLevel,
  UpdateShowcaseRequestSchema,
  ShareAchievementRequestSchema,
  ReactToShareRequestSchema,
} from '@chorechamp/types';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership } from '../lib/membership';
import { randomUUID } from 'crypto';

// In-memory storage
const _earnedAchievements = new Map<string, EarnedAchievement[]>();
const showcaseSettings = new Map<string, { featuredIds: string[]; title?: string }>();
const achievementShares = new Map<string, AchievementShare[]>();

// Note: _earnedAchievements reserved for future persistent storage
void _earnedAchievements;

// Generate mock achievements for a member
function generateMockAchievements(_memberId: string): Achievement[] {
  // Simulate earning some achievements
  const unlockedIds = ['first-chore', 'chore-apprentice', 'streak-starter', 'challenge-participant'];
  const partialIds = ['chore-expert', 'week-warrior'];

  return ACHIEVEMENT_DEFINITIONS.map((def) => {
    const isUnlocked = unlockedIds.includes(def.id);
    const isPartial = partialIds.includes(def.id);

    return {
      ...def,
      unlockedAt: isUnlocked ? '2024-01-15T10:00:00Z' : null,
      progress: isUnlocked ? 100 : isPartial ? Math.floor(Math.random() * 80) + 10 : 0,
    };
  });
}

export async function achievementShowcaseRoutes(fastify: FastifyInstance) {
  // GET /api/households/:householdId/achievements - Get member's achievements
  fastify.get('/', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const query = request.query as { memberId?: string; category?: AchievementCategory };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const targetMemberId = query.memberId || membership.id;
    let achievements = generateMockAchievements(targetMemberId);

    if (query.category) {
      achievements = achievements.filter((a) => a.category === query.category);
    }

    // Separate unlocked, in-progress, and locked
    const unlocked = achievements.filter((a) => a.unlockedAt !== null);
    const inProgress = achievements.filter((a) => a.unlockedAt === null && a.progress > 0 && !a.isSecret);
    const locked = achievements.filter((a) => a.unlockedAt === null && a.progress === 0 && !a.isSecret);
    const secret = achievements.filter((a) => a.isSecret && a.unlockedAt === null);

    return {
      unlocked,
      inProgress,
      locked,
      secret: secret.length, // Just count for secrets
      stats: {
        total: achievements.length,
        unlocked: unlocked.length,
        totalPoints: unlocked.reduce((sum, a) => sum + a.points, 0),
      },
    };
  });

  // GET /api/households/:householdId/achievements/showcase/:memberId - Get member showcase
  fastify.get('/showcase/:memberId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    // Get member info
    const [member] = await db.query.members.findMany({
      where: eq(members.id, memberId),
      limit: 1,
    });

    if (!member) {
      return reply.status(404).send({ error: 'Member not found' });
    }

    const achievements = generateMockAchievements(memberId);
    const unlocked = achievements.filter((a) => a.unlockedAt !== null);
    const totalPoints = unlocked.reduce((sum, a) => sum + a.points, 0);
    const levelInfo = calculateLevel(totalPoints);

    // Get showcase settings
    const settings = showcaseSettings.get(memberId) || { featuredIds: [] };
    const featuredAchievements = settings.featuredIds
      .map((id) => unlocked.find((a) => a.id === id))
      .filter((a): a is Achievement => a !== undefined)
      .slice(0, 5);

    // If no featured, use first 5 unlocked
    const featured = featuredAchievements.length > 0
      ? featuredAchievements
      : unlocked.slice(0, 5);

    // Count by category and rarity
    const byCategory = {} as Record<AchievementCategory, number>;
    const byRarity = {} as Record<AchievementRarity, number>;

    unlocked.forEach((a) => {
      byCategory[a.category] = (byCategory[a.category] || 0) + 1;
      byRarity[a.rarity] = (byRarity[a.rarity] || 0) + 1;
    });

    const showcase: AchievementShowcase = {
      memberId,
      memberName: member.name,
      avatarUrl: member.avatarUrl || undefined,
      title: settings.title || getTitleForLevel(levelInfo.level),
      level: levelInfo.level,
      totalPoints,
      featuredAchievements: featured,
      recentAchievements: unlocked.slice(0, 3),
      stats: {
        totalAchievements: unlocked.length,
        achievementsByCategory: byCategory,
        achievementsByRarity: byRarity,
        longestStreak: 14,
        totalChoresCompleted: 47,
        challengesWon: 2,
        daysActive: 30,
      },
      badges: [
        {
          id: 'badge-1',
          name: 'Early Adopter',
          description: 'Joined during beta',
          icon: 'rocket',
          color: '#3498DB',
          earnedAt: '2024-01-01T00:00:00Z',
          featured: true,
        },
      ],
    };

    return { showcase, levelProgress: levelInfo };
  });

  // PATCH /api/households/:householdId/achievements/showcase - Update showcase
  fastify.patch('/showcase', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    // Validate request body
    const parseResult = UpdateShowcaseRequestSchema.safeParse(request.body);
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

    const settings = showcaseSettings.get(membership.id) || { featuredIds: [] };

    if (body.featuredAchievementIds) {
      settings.featuredIds = body.featuredAchievementIds.slice(0, 5);
    }
    if (body.title) {
      settings.title = body.title;
    }

    showcaseSettings.set(membership.id, settings);

    return { success: true, settings };
  });

  // GET /api/households/:householdId/achievements/leaderboard - Get leaderboard
  fastify.get('/leaderboard', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const query = request.query as { timeframe?: 'week' | 'month' | 'all-time' };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    // Get all household members
    const householdMembers = await db.query.members.findMany({
      where: eq(members.householdId, householdId),
    });

    // Generate leaderboard entries
    const entries = householdMembers.map((m, index) => {
      const achievements = generateMockAchievements(m.id);
      const unlocked = achievements.filter((a) => a.unlockedAt !== null);
      const points = unlocked.reduce((sum, a) => sum + a.points, 0);

      return {
        rank: 0,
        memberId: m.id,
        memberName: m.name,
        avatarUrl: m.avatarUrl || undefined,
        achievementCount: unlocked.length,
        points: points + (index * 50), // Vary points for demo
        recentAchievement: unlocked[0],
        isCurrentUser: m.id === membership.id,
      };
    });

    // Sort by points and assign ranks
    entries.sort((a, b) => b.points - a.points);
    entries.forEach((e, i) => {
      e.rank = i + 1;
    });

    const leaderboard: AchievementLeaderboard = {
      householdId,
      timeframe: query.timeframe || 'all-time',
      entries,
      myRank: entries.find((e) => e.isCurrentUser)?.rank || null,
    };

    return leaderboard;
  });

  // GET /api/households/:householdId/achievements/feed - Get achievement feed
  fastify.get('/feed', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const query = request.query as { cursor?: string; limit?: number };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    // Get household members for feed
    const householdMembers = await db.query.members.findMany({
      where: eq(members.householdId, householdId),
    });

    // Generate mock feed items
    const feedItems = householdMembers.flatMap((m) => {
      const achievements = generateMockAchievements(m.id).filter((a) => a.unlockedAt !== null);
      return achievements.slice(0, 2).map((a) => ({
        id: randomUUID(),
        type: 'unlock' as const,
        memberId: m.id,
        memberName: m.name,
        achievement: a,
        details: `${m.name} earned the "${a.name}" achievement!`,
        timestamp: a.unlockedAt || new Date().toISOString(),
        celebrationLevel: a.rarity === 'legendary' ? 'epic' as const : a.rarity === 'epic' ? 'special' as const : 'normal' as const,
      }));
    });

    // Sort by timestamp
    feedItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const limit = query.limit || 20;
    const feed: AchievementFeed = {
      items: feedItems.slice(0, limit),
      hasMore: feedItems.length > limit,
      nextCursor: feedItems.length > limit ? 'next-page' : undefined,
    };

    return feed;
  });

  // POST /api/households/:householdId/achievements/share - Share achievement
  fastify.post('/share', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    // Validate request body
    const parseResult = ShareAchievementRequestSchema.safeParse(request.body);
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

    const share: AchievementShare = {
      id: randomUUID(),
      achievementId: body.achievementId,
      memberId: membership.id,
      memberName: membership.name,
      householdId,
      sharedAt: new Date().toISOString(),
      message: body.message,
      reactions: [],
    };

    const householdShares = achievementShares.get(householdId) || [];
    householdShares.push(share);
    achievementShares.set(householdId, householdShares);

    return { success: true, share };
  });

  // POST /api/households/:householdId/achievements/share/:shareId/react - React to share
  fastify.post('/share/:shareId/react', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, shareId } = request.params as { householdId: string; shareId: string };

    // Validate request body
    const parseResult = ReactToShareRequestSchema.safeParse(request.body);
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

    const householdShares = achievementShares.get(householdId) || [];
    const share = householdShares.find((s) => s.id === shareId);

    if (!share) {
      return reply.status(404).send({ error: 'Share not found' });
    }

    // Remove existing reaction from this user
    share.reactions = share.reactions.filter((r) => r.memberId !== membership.id);

    // Add new reaction
    share.reactions.push({
      memberId: membership.id,
      memberName: membership.name,
      emoji: body.emoji,
      createdAt: new Date().toISOString(),
    });

    achievementShares.set(householdId, householdShares);

    return { success: true, reactions: share.reactions };
  });

  // GET /api/households/:householdId/achievements/shares - Get shared achievements
  fastify.get('/shares', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const householdShares = achievementShares.get(householdId) || [];
    const sharesWithAchievements = householdShares.map((share) => {
      const achievement = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === share.achievementId);
      return { ...share, achievement };
    });

    return { shares: sharesWithAchievements };
  });
}
