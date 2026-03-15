import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, desc, sql, gt, inArray } from 'drizzle-orm';
import { db } from '../lib/db';
import {
  miniGames,
  gameConfigs,
  gameUnlocks,
  gameSessions,
  sessionPlayers,
  gameScores,
  familyGameNights,
  familyNightGames,
  familyNightParticipants,
  members,
  choreCompletions,
  characterProfiles,
} from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import {
  GAME_CONFIG,
  calculateGameResult,
  checkGameUnlock,
  getUnlockRequirementText,
  getDifficultyInfo,
  getCategoryInfo,
} from '@chorechamp/gamification';
import type { GameDifficulty, UnlockType } from '@chorechamp/types';
import { verifyMembership } from '../lib/membership';

// Constants for pagination
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

// Validation schemas
const startGameSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
  playerIds: z.array(z.string().uuid()).optional(),
});

const completeGameSchema = z.object({
  finalState: z.record(z.unknown()),
  timeElapsed: z.number().int().min(0),
  score: z.number().int().min(0),
  accuracy: z.number().int().min(0).max(100),
  combo: z.number().int().min(0),
});

const createFamilyNightSchema = z.object({
  name: z.string().min(1).max(100),
  scheduledAt: z.string().datetime(),
  gameIds: z.array(z.string()).min(1).max(10),
  participantIds: z.array(z.string().uuid()).min(2).max(10),
});

// Helper functions
async function getMemberStats(memberId: string): Promise<{
  choreCount: number;
  points: number;
  streakDays: number;
  level: number;
  achievements: string[];
}> {
  // Get member data
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId));

  // Count completed chores
  const [choreCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(choreCompletions)
    .where(eq(choreCompletions.memberId, memberId));

  // Get character profile for level
  const [profile] = await db
    .select()
    .from(characterProfiles)
    .where(eq(characterProfiles.memberId, memberId));

  return {
    choreCount: choreCountResult?.count || 0,
    points: member?.pointsCurrent || 0,
    streakDays: member?.streakCurrent || 0,
    level: profile?.level || 1,
    achievements: (member?.badges as string[]) || [],
  };
}

export async function miniGamesRoutes(fastify: FastifyInstance) {
  // Get all games with unlock status for member
  fastify.get('/games', {
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

    // Get all active games
    const games = await db
      .select()
      .from(miniGames)
      .where(eq(miniGames.isActive, true))
      .orderBy(miniGames.sortOrder);

    // Get member's unlocks
    const unlocks = await db
      .select()
      .from(gameUnlocks)
      .where(eq(gameUnlocks.memberId, membership.id));

    const unlocksMap = new Map(unlocks.map(u => [u.gameId, u]));

    // Get member stats for unlock checks
    const memberStats = await getMemberStats(membership.id);

    // Build response with unlock status
    const gamesWithStatus = games.map(game => {
      const unlock = unlocksMap.get(game.id);
      const unlockCheck = checkGameUnlock(
        game.unlockType as UnlockType,
        game.unlockValue,
        memberStats,
        game.unlockAchievementId
      );

      const categoryInfo = getCategoryInfo(game.category as Parameters<typeof getCategoryInfo>[0]);

      return {
        ...game,
        categoryInfo,
        isUnlocked: unlock !== undefined || unlockCheck.isUnlocked,
        unlockProgress: unlockCheck.progress,
        unlockRequired: unlockCheck.required,
        unlockText: getUnlockRequirementText(
          game.unlockType as UnlockType,
          game.unlockValue,
          unlockCheck.progress
        ),
        highScore: unlock?.highScore || 0,
        playCount: unlock?.playCount || 0,
        lastPlayedAt: unlock?.lastPlayedAt,
        bestDifficulty: unlock?.bestDifficulty || null,
      };
    });

    return reply.send(gamesWithStatus);
  });

  // Get game details with configs
  fastify.get('/games/:gameId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, gameId } = request.params as { householdId: string; gameId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get game
    const [game] = await db
      .select()
      .from(miniGames)
      .where(eq(miniGames.id, gameId));

    if (!game) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Game not found',
      });
    }

    // Get configs for each difficulty
    const configs = await db
      .select()
      .from(gameConfigs)
      .where(eq(gameConfigs.gameId, gameId));

    // Get member's unlock
    const [unlock] = await db
      .select()
      .from(gameUnlocks)
      .where(and(
        eq(gameUnlocks.gameId, gameId),
        eq(gameUnlocks.memberId, membership.id)
      ));

    // Get member stats
    const memberStats = await getMemberStats(membership.id);
    const unlockCheck = checkGameUnlock(
      game.unlockType as UnlockType,
      game.unlockValue,
      memberStats,
      game.unlockAchievementId
    );

    // Get leaderboard (top 10)
    const leaderboard = await db
      .select({
        score: gameScores,
        member: members,
      })
      .from(gameScores)
      .innerJoin(members, eq(gameScores.memberId, members.id))
      .where(and(
        eq(gameScores.gameId, gameId),
        eq(gameScores.householdId, householdId)
      ))
      .orderBy(desc(gameScores.score))
      .limit(10);

    const categoryInfo = getCategoryInfo(game.category as Parameters<typeof getCategoryInfo>[0]);

    return reply.send({
      game: {
        ...game,
        categoryInfo,
        isUnlocked: unlock !== undefined || unlockCheck.isUnlocked,
        unlockProgress: unlockCheck.progress,
        unlockText: getUnlockRequirementText(
          game.unlockType as UnlockType,
          game.unlockValue,
          unlockCheck.progress
        ),
        highScore: unlock?.highScore || 0,
        playCount: unlock?.playCount || 0,
        bestDifficulty: unlock?.bestDifficulty,
        totalXPEarned: unlock?.totalXPEarned || 0,
        perfectGames: unlock?.perfectGames || 0,
      },
      configs: configs.map(c => ({
        ...c,
        difficultyInfo: getDifficultyInfo(c.difficulty as GameDifficulty),
      })),
      leaderboard: leaderboard.map((entry, index) => ({
        rank: index + 1,
        memberId: entry.member.id,
        memberName: entry.member.name,
        memberColor: entry.member.color,
        score: entry.score.score,
        difficulty: entry.score.difficulty,
        playedAt: entry.score.createdAt,
      })),
    });
  });

  // Start a game session
  fastify.post('/games/:gameId/start', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, gameId } = request.params as { householdId: string; gameId: string };
    const body = startGameSchema.parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get game
    const [game] = await db
      .select()
      .from(miniGames)
      .where(eq(miniGames.id, gameId));

    if (!game) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Game not found',
      });
    }

    // Check unlock status
    const memberStats = await getMemberStats(membership.id);
    const unlockCheck = checkGameUnlock(
      game.unlockType as UnlockType,
      game.unlockValue,
      memberStats,
      game.unlockAchievementId
    );

    // Check if already unlocked in database
    const [existingUnlock] = await db
      .select()
      .from(gameUnlocks)
      .where(and(
        eq(gameUnlocks.gameId, gameId),
        eq(gameUnlocks.memberId, membership.id)
      ));

    if (!existingUnlock && !unlockCheck.isUnlocked) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Game is not unlocked',
        unlockProgress: unlockCheck.progress,
        unlockRequired: unlockCheck.required,
      });
    }

    // Create unlock record if first time
    if (!existingUnlock && unlockCheck.isUnlocked) {
      await db.insert(gameUnlocks).values({
        gameId,
        memberId: membership.id,
        householdId,
      });
    }

    // Get config for difficulty
    const [config] = await db
      .select()
      .from(gameConfigs)
      .where(and(
        eq(gameConfigs.gameId, gameId),
        eq(gameConfigs.difficulty, body.difficulty)
      ));

    if (!config) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid difficulty for this game',
      });
    }

    // Validate player count for multiplayer
    const playerIds = body.playerIds || [membership.id];
    if (playerIds.length < game.minPlayers || playerIds.length > game.maxPlayers) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: `This game requires ${game.minPlayers}-${game.maxPlayers} players`,
      });
    }

    // Create session
    const [session] = await db
      .insert(gameSessions)
      .values({
        gameId,
        householdId,
        difficulty: body.difficulty,
        status: 'active',
        totalRounds: 1,
        gameState: {},
      })
      .returning();

    // Add players
    await db.insert(sessionPlayers).values(
      playerIds.map((playerId, index) => ({
        sessionId: session.id,
        memberId: playerId,
        isHost: index === 0,
      }))
    );

    // Emit session started event
    const io = fastify.io;
    if (io) {
      io.to(`household:${householdId}`).emit('game:session-started', {
        sessionId: session.id,
        gameId,
        gameName: game.name,
        difficulty: body.difficulty,
        players: playerIds,
      });
    }

    return reply.status(201).send({
      session,
      config,
      game,
      initialState: config.config,
    });
  });

  // Complete a game session
  fastify.post('/games/:gameId/sessions/:sessionId/complete', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, gameId, sessionId } = request.params as {
      householdId: string;
      gameId: string;
      sessionId: string;
    };
    const body = completeGameSchema.parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get session
    const [session] = await db
      .select()
      .from(gameSessions)
      .where(and(
        eq(gameSessions.id, sessionId),
        eq(gameSessions.gameId, gameId),
        eq(gameSessions.householdId, householdId)
      ));

    if (!session) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Session not found',
      });
    }

    if (session.status !== 'active') {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Session is not active',
      });
    }

    // Get game and config
    const [game] = await db
      .select()
      .from(miniGames)
      .where(eq(miniGames.id, gameId));

    const [config] = await db
      .select()
      .from(gameConfigs)
      .where(and(
        eq(gameConfigs.gameId, gameId),
        eq(gameConfigs.difficulty, session.difficulty)
      ));

    if (!game || !config) {
      return reply.status(500).send({
        error: 'Internal Error',
        message: 'Game configuration not found',
      });
    }

    // Get member's unlock record
    const [unlock] = await db
      .select()
      .from(gameUnlocks)
      .where(and(
        eq(gameUnlocks.gameId, gameId),
        eq(gameUnlocks.memberId, membership.id)
      ));

    const isFirstTime = !unlock || unlock.playCount === 0;
    const previousHighScore = unlock?.highScore || 0;

    // Check if part of family night
    const isFamilyNight = Boolean(session.familyNightId);
    // Winner logic would be determined by comparing scores with other players in a family night
    const isWinner = false;

    // Calculate result
    const result = calculateGameResult(
      body.score,
      config.targetScore,
      body.timeElapsed,
      body.accuracy,
      body.combo,
      game.baseXPReward,
      game.basePointReward,
      session.difficulty as GameDifficulty,
      previousHighScore,
      isFirstTime,
      isFamilyNight,
      isWinner
    );

    const isPerfect = body.accuracy === 100 && result.stars === 3;

    // Update session
    await db
      .update(gameSessions)
      .set({
        status: 'completed',
        completedAt: new Date(),
        gameState: body.finalState,
      })
      .where(eq(gameSessions.id, sessionId));

    // Update player score
    await db
      .update(sessionPlayers)
      .set({ score: body.score })
      .where(and(
        eq(sessionPlayers.sessionId, sessionId),
        eq(sessionPlayers.memberId, membership.id)
      ));

    // Record score
    await db.insert(gameScores).values({
      gameId,
      memberId: membership.id,
      householdId,
      sessionId,
      difficulty: session.difficulty,
      score: body.score,
      timeElapsed: body.timeElapsed,
      accuracy: body.accuracy,
      combo: body.combo,
      stars: result.stars,
      xpEarned: result.xpEarned,
      pointsEarned: result.pointsEarned,
      isPerfect,
    });

    // Update unlock record
    const updateUnlock: Record<string, unknown> = {
      playCount: sql`${gameUnlocks.playCount} + 1`,
      totalXPEarned: sql`${gameUnlocks.totalXPEarned} + ${result.xpEarned}`,
      totalPointsEarned: sql`${gameUnlocks.totalPointsEarned} + ${result.pointsEarned}`,
      lastPlayedAt: new Date(),
    };

    if (result.newHighScore) {
      updateUnlock.highScore = body.score;
    }

    if (isPerfect) {
      updateUnlock.perfectGames = sql`${gameUnlocks.perfectGames} + 1`;
    }

    // Update best difficulty if higher
    const difficultyOrder = ['easy', 'medium', 'hard', 'expert'];
    const currentBestIndex = difficultyOrder.indexOf(unlock?.bestDifficulty || 'easy');
    const newDifficultyIndex = difficultyOrder.indexOf(session.difficulty);
    if (newDifficultyIndex > currentBestIndex && result.stars > 0) {
      updateUnlock.bestDifficulty = session.difficulty;
    }

    await db
      .update(gameUnlocks)
      .set(updateUnlock)
      .where(and(
        eq(gameUnlocks.gameId, gameId),
        eq(gameUnlocks.memberId, membership.id)
      ));

    // Update member points and XP would be handled here
    // This would integrate with the character/points system

    // Emit completion event
    const io = fastify.io;
    if (io) {
      io.to(`household:${householdId}`).emit('game:completed', {
        sessionId,
        gameId,
        gameName: game.name,
        memberId: membership.id,
        memberName: membership.name,
        result,
      });

      if (result.newHighScore) {
        io.to(`household:${householdId}`).emit('game:new-high-score', {
          gameId,
          gameName: game.name,
          memberId: membership.id,
          memberName: membership.name,
          score: body.score,
          previousScore: previousHighScore,
        });
      }
    }

    return reply.send({
      result,
      session: {
        ...session,
        status: 'completed',
        completedAt: new Date(),
      },
    });
  });

  // Get game leaderboard
  fastify.get('/games/:gameId/leaderboard', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { householdId, gameId } = request.params as { householdId: string; gameId: string };
      const queryParams = request.query as { difficulty?: string; limit?: string };

      // Validate pagination
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

      // Build query conditions
      const conditions = [
        eq(gameScores.gameId, gameId),
        eq(gameScores.householdId, householdId),
      ];

      if (queryParams.difficulty) {
        conditions.push(eq(gameScores.difficulty, queryParams.difficulty));
      }

      // Get top scores
      const scores = await db
        .select({
          score: gameScores,
          member: members,
        })
        .from(gameScores)
        .innerJoin(members, eq(gameScores.memberId, members.id))
        .where(and(...conditions))
        .orderBy(desc(gameScores.score))
        .limit(limitNum);

      // Get member's best score
      const memberBestConditions = [
        eq(gameScores.gameId, gameId),
        eq(gameScores.memberId, membership.id),
      ];
      if (queryParams.difficulty) {
        memberBestConditions.push(eq(gameScores.difficulty, queryParams.difficulty));
      }

      const [memberBest] = await db
        .select()
        .from(gameScores)
        .where(and(...memberBestConditions))
        .orderBy(desc(gameScores.score))
        .limit(1);

      // Find member's rank
      let memberRank: number | null = null;
      scores.forEach((entry, index) => {
        if (entry.member.id === membership.id) {
          memberRank = index + 1;
        }
      });

      return reply.send({
        leaderboard: scores.map((entry, index) => ({
          rank: index + 1,
          memberId: entry.member.id,
          memberName: entry.member.name,
          memberColor: entry.member.color,
          score: entry.score.score,
          difficulty: entry.score.difficulty,
          stars: entry.score.stars,
          playedAt: entry.score.createdAt,
        })),
        memberBest: memberBest ? {
          score: memberBest.score,
          difficulty: memberBest.difficulty,
          stars: memberBest.stars,
          playedAt: memberBest.createdAt,
          rank: memberRank,
        } : null,
        limit: limitNum,
      });
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch game leaderboard');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch game leaderboard',
      });
    }
  });

  // Create family game night
  fastify.post('/family-nights', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = createFamilyNightSchema.parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Verify all game IDs are valid
    const games = await db
      .select()
      .from(miniGames)
      .where(inArray(miniGames.id, body.gameIds));

    if (games.length !== body.gameIds.length) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'One or more games not found',
      });
    }

    // Verify all participant IDs are household members
    const participants = await db
      .select()
      .from(members)
      .where(and(
        eq(members.householdId, householdId),
        inArray(members.id, body.participantIds)
      ));

    if (participants.length !== body.participantIds.length) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'One or more participants not found in household',
      });
    }

    // Create family night
    const [familyNight] = await db
      .insert(familyGameNights)
      .values({
        householdId,
        name: body.name,
        scheduledAt: new Date(body.scheduledAt),
        hostMemberId: membership.id,
        bonusMultiplier: GAME_CONFIG.familyNight.participationBonus * 100,
      })
      .returning();

    // Add games
    await db.insert(familyNightGames).values(
      body.gameIds.map((gameId, index) => ({
        familyNightId: familyNight.id,
        gameId,
        order: index + 1,
      }))
    );

    // Add participants
    await db.insert(familyNightParticipants).values(
      body.participantIds.map(participantId => ({
        familyNightId: familyNight.id,
        memberId: participantId,
      }))
    );

    // Emit family night created event
    const io = fastify.io;
    if (io) {
      io.to(`household:${householdId}`).emit('game:family-night-created', {
        familyNightId: familyNight.id,
        name: body.name,
        scheduledAt: familyNight.scheduledAt,
        hostName: membership.name,
        games: games.map(g => ({ id: g.id, name: g.name, icon: g.icon })),
        participants: participants.map(p => ({ id: p.id, name: p.name })),
      });
    }

    return reply.status(201).send({
      familyNight,
      games,
      participants,
    });
  });

  // Get family nights
  fastify.get('/family-nights', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const { status, upcoming } = request.query as { status?: string; upcoming?: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const conditions = [eq(familyGameNights.householdId, householdId)];

    if (status) {
      conditions.push(eq(familyGameNights.status, status));
    }

    if (upcoming === 'true') {
      conditions.push(gt(familyGameNights.scheduledAt, new Date()));
    }

    const nights = await db
      .select()
      .from(familyGameNights)
      .where(and(...conditions))
      .orderBy(desc(familyGameNights.scheduledAt));

    // Get games and participants for each night
    const nightsWithDetails = await Promise.all(nights.map(async (night) => {
      const nightGames = await db
        .select({
          nightGame: familyNightGames,
          game: miniGames,
        })
        .from(familyNightGames)
        .innerJoin(miniGames, eq(familyNightGames.gameId, miniGames.id))
        .where(eq(familyNightGames.familyNightId, night.id))
        .orderBy(familyNightGames.order);

      const nightParticipants = await db
        .select({
          participant: familyNightParticipants,
          member: members,
        })
        .from(familyNightParticipants)
        .innerJoin(members, eq(familyNightParticipants.memberId, members.id))
        .where(eq(familyNightParticipants.familyNightId, night.id));

      return {
        ...night,
        games: nightGames.map(ng => ({
          ...ng.nightGame,
          game: ng.game,
        })),
        participants: nightParticipants.map(np => ({
          ...np.participant,
          member: {
            id: np.member.id,
            name: np.member.name,
            color: np.member.color,
          },
        })),
      };
    }));

    return reply.send(nightsWithDetails);
  });

  // Get specific family night
  fastify.get('/family-nights/:nightId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, nightId } = request.params as { householdId: string; nightId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const [night] = await db
      .select()
      .from(familyGameNights)
      .where(and(
        eq(familyGameNights.id, nightId),
        eq(familyGameNights.householdId, householdId)
      ));

    if (!night) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Family night not found',
      });
    }

    // Get games
    const nightGames = await db
      .select({
        nightGame: familyNightGames,
        game: miniGames,
      })
      .from(familyNightGames)
      .innerJoin(miniGames, eq(familyNightGames.gameId, miniGames.id))
      .where(eq(familyNightGames.familyNightId, nightId))
      .orderBy(familyNightGames.order);

    // Get participants with scores
    const nightParticipants = await db
      .select({
        participant: familyNightParticipants,
        member: members,
      })
      .from(familyNightParticipants)
      .innerJoin(members, eq(familyNightParticipants.memberId, members.id))
      .where(eq(familyNightParticipants.familyNightId, nightId))
      .orderBy(desc(familyNightParticipants.totalScore));

    // Get host info
    const [host] = await db
      .select()
      .from(members)
      .where(eq(members.id, night.hostMemberId));

    return reply.send({
      ...night,
      host: {
        id: host.id,
        name: host.name,
        color: host.color,
      },
      games: nightGames.map(ng => ({
        ...ng.nightGame,
        game: {
          id: ng.game.id,
          name: ng.game.name,
          icon: ng.game.icon,
          category: ng.game.category,
          minPlayers: ng.game.minPlayers,
          maxPlayers: ng.game.maxPlayers,
        },
      })),
      participants: nightParticipants.map((np, index) => ({
        ...np.participant,
        rank: index + 1,
        member: {
          id: np.member.id,
          name: np.member.name,
          color: np.member.color,
        },
      })),
    });
  });

  // Start family night
  fastify.post('/family-nights/:nightId/start', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, nightId } = request.params as { householdId: string; nightId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const [night] = await db
      .select()
      .from(familyGameNights)
      .where(and(
        eq(familyGameNights.id, nightId),
        eq(familyGameNights.householdId, householdId)
      ));

    if (!night) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Family night not found',
      });
    }

    if (night.hostMemberId !== membership.id) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only the host can start the family night',
      });
    }

    if (night.status !== 'scheduled') {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Family night is not in scheduled status',
      });
    }

    // Update status
    const [updated] = await db
      .update(familyGameNights)
      .set({
        status: 'active',
        startedAt: new Date(),
      })
      .where(eq(familyGameNights.id, nightId))
      .returning();

    // Emit start event
    const io = fastify.io;
    if (io) {
      io.to(`household:${householdId}`).emit('game:family-night-started', {
        familyNightId: nightId,
        name: night.name,
      });
    }

    return reply.send(updated);
  });

  // Toggle ready status for family night
  fastify.post('/family-nights/:nightId/ready', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, nightId } = request.params as { householdId: string; nightId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get participant record
    const [participant] = await db
      .select()
      .from(familyNightParticipants)
      .where(and(
        eq(familyNightParticipants.familyNightId, nightId),
        eq(familyNightParticipants.memberId, membership.id)
      ));

    if (!participant) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a participant in this family night',
      });
    }

    // Toggle ready status
    const [updated] = await db
      .update(familyNightParticipants)
      .set({ isReady: !participant.isReady })
      .where(eq(familyNightParticipants.id, participant.id))
      .returning();

    // Emit ready status change
    const io = fastify.io;
    if (io) {
      io.to(`household:${householdId}`).emit('game:participant-ready', {
        familyNightId: nightId,
        memberId: membership.id,
        memberName: membership.name,
        isReady: updated.isReady,
      });
    }

    return reply.send(updated);
  });
}
