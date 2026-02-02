import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, desc, sql, inArray, gte } from 'drizzle-orm';
import { db } from '../lib/db';
import {
  characterProfiles,
  characterClasses,
  characterSkills,
  avatarItems,
  memberSkills,
  xpTransactions,
  members,
} from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import {
  getDefaultAvatar,
  getDefaultStats,
  getXPProgress,
  getLevelInfo,
  getAvailableTitles,
  checkLevelUp,
  canChangeClass,
  validateStatAllocation,
  CHARACTER_CONFIG,
} from '@chorechamp/gamification';
import type { CharacterClass, CharacterStat, AvatarCustomization } from '@chorechamp/types';

// Constants for validation
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

// Validation schemas
const createCharacterSchema = z.object({
  characterClass: z.enum(['cleaner', 'organizer', 'helper', 'chef', 'guardian']),
  avatar: z.object({
    skinTone: z.string().optional(),
    hairStyle: z.string().optional(),
    hairColor: z.string().optional(),
    eyeColor: z.string().optional(),
    faceShape: z.string().optional(),
    outfit: z.string().optional(),
    outfitColor: z.string().optional(),
    accessories: z.array(z.string()).optional(),
    background: z.string().optional(),
    frame: z.string().optional(),
  }).optional(),
});

const updateAvatarSchema = z.object({
  avatar: z.object({
    skinTone: z.string().optional(),
    hairStyle: z.string().optional(),
    hairColor: z.string().optional(),
    eyeColor: z.string().optional(),
    faceShape: z.string().optional(),
    outfit: z.string().optional(),
    outfitColor: z.string().optional(),
    accessories: z.array(z.string()).optional(),
    background: z.string().optional(),
    frame: z.string().optional(),
  }),
});

const updateClassSchema = z.object({
  characterClass: z.enum(['cleaner', 'organizer', 'helper', 'chef', 'guardian']),
});

const allocateStatSchema = z.object({
  stat: z.enum(['speed', 'quality', 'consistency', 'teamwork']),
  points: z.number().int().min(1).max(10),
});

const setTitleSchema = z.object({
  title: z.string().nullable(),
});

// Helper functions
async function verifyMembership(
  userId: string,
  householdId: string
): Promise<typeof members.$inferSelect | null> {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(
      eq(members.householdId, householdId),
      eq(members.userId, userId)
    ));
  return membership || null;
}

async function getMemberById(
  memberId: string,
  householdId: string
): Promise<typeof members.$inferSelect | null> {
  const [member] = await db
    .select()
    .from(members)
    .where(and(
      eq(members.id, memberId),
      eq(members.householdId, householdId)
    ));
  return member || null;
}

async function verifyParentOrSelf(
  userId: string,
  memberId: string,
  householdId: string
): Promise<boolean> {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(
      eq(members.householdId, householdId),
      eq(members.userId, userId)
    ));

  if (!membership) return false;

  // User is accessing their own character
  if (membership.id === memberId) return true;

  // User is a parent
  return membership.role === 'parent';
}

export async function rpgCharacterRoutes(fastify: FastifyInstance) {
  // Get all character classes
  fastify.get('/classes', {
    preHandler: [requireAuth],
  }, async (_request, reply) => {
    const classes = await db
      .select()
      .from(characterClasses)
      .orderBy(characterClasses.sortOrder);

    // Get skills for each class
    const skills = await db
      .select()
      .from(characterSkills)
      .orderBy(characterSkills.sortOrder);

    const classesWithSkills = classes.map(cls => ({
      ...cls,
      skills: skills.filter(s => s.classId === cls.id),
    }));

    return reply.send(classesWithSkills);
  });

  // Get all avatar items
  fastify.get('/avatar-items', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    try {
      const { category } = request.query as { category?: string };

      const items = category
        ? await db
            .select()
            .from(avatarItems)
            .where(eq(avatarItems.category, category))
            .orderBy(avatarItems.category, avatarItems.sortOrder)
        : await db
            .select()
            .from(avatarItems)
            .orderBy(avatarItems.category, avatarItems.sortOrder);

      return reply.send(items);
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch avatar items');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch avatar items',
      });
    }
  });

  // Get character profile for a member
  fastify.get('/:memberId', {
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

    // Get the character profile
    const [profile] = await db
      .select()
      .from(characterProfiles)
      .where(eq(characterProfiles.memberId, memberId));

    if (!profile) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Character profile not found. Create one first.',
      });
    }

    // Get class info
    const [classInfo] = await db
      .select()
      .from(characterClasses)
      .where(eq(characterClasses.id, profile.classId));

    // Get learned skills
    const skills = await db
      .select({
        memberSkill: memberSkills,
        skillDef: characterSkills,
      })
      .from(memberSkills)
      .innerJoin(characterSkills, eq(memberSkills.skillId, characterSkills.id))
      .where(eq(memberSkills.memberId, memberId));

    // Get XP progress
    const xpProgress = getXPProgress(profile.xpLifetime, profile.level);
    const levelInfo = getLevelInfo(profile.level);
    const nextLevelInfo = getLevelInfo(profile.level + 1);

    // Get recent XP transactions
    const recentXP = await db
      .select()
      .from(xpTransactions)
      .where(eq(xpTransactions.memberId, memberId))
      .orderBy(desc(xpTransactions.createdAt))
      .limit(10);

    return reply.send({
      profile: {
        ...profile,
        characterClass: classInfo,
        stats: {
          speed: profile.statSpeed,
          quality: profile.statQuality,
          consistency: profile.statConsistency,
          teamwork: profile.statTeamwork,
        },
        xpToNextLevel: xpProgress.xpNeeded - xpProgress.xpInLevel,
        xpProgress: xpProgress.percentage,
      },
      skills: skills.map(s => ({
        ...s.memberSkill,
        definition: s.skillDef,
      })),
      levelInfo,
      nextUnlocks: nextLevelInfo.unlocks,
      recentXP,
      availableTitles: getAvailableTitles(profile.level),
    });
  });

  // Create character profile for a member
  fastify.post('/:memberId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };
    const body = createCharacterSchema.parse(request.body);

    const canEdit = await verifyParentOrSelf(user.id, memberId, householdId);
    if (!canEdit) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only create a character for yourself or your children',
      });
    }

    // Check member exists
    const member = await getMemberById(memberId, householdId);
    if (!member) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Member not found',
      });
    }

    // Check if character already exists
    const [existing] = await db
      .select()
      .from(characterProfiles)
      .where(eq(characterProfiles.memberId, memberId));

    if (existing) {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'Character profile already exists',
      });
    }

    // Create default avatar with any provided customization
    const defaultAvatar = getDefaultAvatar();
    const avatar = {
      ...defaultAvatar,
      ...body.avatar,
    } as AvatarCustomization;

    // Create the character profile
    const defaultStats = getDefaultStats();
    const [profile] = await db
      .insert(characterProfiles)
      .values({
        memberId,
        householdId,
        classId: body.characterClass,
        level: 1,
        xp: 0,
        xpLifetime: 0,
        statSpeed: defaultStats.speed,
        statQuality: defaultStats.quality,
        statConsistency: defaultStats.consistency,
        statTeamwork: defaultStats.teamwork,
        statPointsAvailable: 0,
        avatar,
        unlockedItems: [],
        titles: ['Newcomer'],
        activeTitle: 'Newcomer',
      })
      .returning();

    // Emit character created event
    const io = fastify.io;
    if (io) {
      io.to(`household:${householdId}`).emit('character:created', {
        memberId,
        memberName: member.name,
        characterClass: body.characterClass,
      });
    }

    return reply.status(201).send(profile);
  });

  // Update avatar customization
  fastify.put('/:memberId/avatar', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };
    const body = updateAvatarSchema.parse(request.body);

    const canEdit = await verifyParentOrSelf(user.id, memberId, householdId);
    if (!canEdit) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only edit your own character or your children\'s',
      });
    }

    // Get current profile
    const [profile] = await db
      .select()
      .from(characterProfiles)
      .where(eq(characterProfiles.memberId, memberId));

    if (!profile) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Character profile not found',
      });
    }

    // Merge avatar updates
    const currentAvatar = profile.avatar as AvatarCustomization;
    const newAvatar = {
      ...currentAvatar,
      ...body.avatar,
    };

    // Validate that all items are either default or unlocked
    const allItems = [
      newAvatar.skinTone,
      newAvatar.hairStyle,
      newAvatar.hairColor,
      newAvatar.eyeColor,
      newAvatar.faceShape,
      newAvatar.outfit,
      newAvatar.outfitColor,
      newAvatar.background,
      newAvatar.frame,
      ...(newAvatar.accessories || []),
    ].filter((item): item is string => Boolean(item));

    const itemsData = allItems.length > 0
      ? await db
          .select()
          .from(avatarItems)
          .where(inArray(avatarItems.id, allItems))
      : [];

    for (const item of itemsData) {
      if (!item.isDefault && !(profile.unlockedItems || []).includes(item.id)) {
        // Check if unlockable by level
        if (item.unlockType === 'level' && item.unlockLevel && profile.level >= item.unlockLevel) {
          continue; // Allowed
        }
        return reply.status(400).send({
          error: 'Bad Request',
          message: `Item "${item.name}" is not unlocked`,
        });
      }
    }

    // Update avatar
    const [updated] = await db
      .update(characterProfiles)
      .set({
        avatar: newAvatar,
        updatedAt: new Date(),
      })
      .where(eq(characterProfiles.memberId, memberId))
      .returning();

    // Emit avatar updated event
    const io = fastify.io;
    if (io) {
      io.to(`household:${householdId}`).emit('character:avatar-changed', {
        memberId,
        avatar: newAvatar,
      });
    }

    return reply.send(updated);
  });

  // Change character class
  fastify.put('/:memberId/class', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };
    const body = updateClassSchema.parse(request.body);

    const canEdit = await verifyParentOrSelf(user.id, memberId, householdId);
    if (!canEdit) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only change your own character class or your children\'s',
      });
    }

    // Get current profile
    const [profile] = await db
      .select()
      .from(characterProfiles)
      .where(eq(characterProfiles.memberId, memberId));

    if (!profile) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Character profile not found',
      });
    }

    // Check cooldown
    const cooldownCheck = canChangeClass(profile.classChangedAt);
    if (!cooldownCheck.allowed) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Class change is on cooldown',
        cooldownEndsAt: cooldownCheck.cooldownEndsAt,
      });
    }

    // Update class
    const [updated] = await db
      .update(characterProfiles)
      .set({
        classId: body.characterClass,
        classChangedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(characterProfiles.memberId, memberId))
      .returning();

    return reply.send(updated);
  });

  // Allocate stat points
  fastify.post('/:memberId/stats', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };
    const body = allocateStatSchema.parse(request.body);

    const canEdit = await verifyParentOrSelf(user.id, memberId, householdId);
    if (!canEdit) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only allocate stats for yourself or your children',
      });
    }

    // Get current profile
    const [profile] = await db
      .select()
      .from(characterProfiles)
      .where(eq(characterProfiles.memberId, memberId));

    if (!profile) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Character profile not found',
      });
    }

    // Validate allocation
    const currentStats = {
      speed: profile.statSpeed,
      quality: profile.statQuality,
      consistency: profile.statConsistency,
      teamwork: profile.statTeamwork,
    };

    const validation = validateStatAllocation(
      currentStats,
      body.stat as CharacterStat,
      body.points,
      profile.statPointsAvailable
    );

    if (!validation.valid) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: validation.error,
      });
    }

    // Update stats
    const statColumn = `stat${body.stat.charAt(0).toUpperCase() + body.stat.slice(1)}` as
      'statSpeed' | 'statQuality' | 'statConsistency' | 'statTeamwork';

    const [updated] = await db
      .update(characterProfiles)
      .set({
        [statColumn]: currentStats[body.stat] + body.points,
        statPointsAvailable: profile.statPointsAvailable - body.points,
        updatedAt: new Date(),
      })
      .where(eq(characterProfiles.memberId, memberId))
      .returning();

    // Emit stats updated event
    const io = fastify.io;
    if (io) {
      io.to(`household:${householdId}`).emit('character:stats-updated', {
        memberId,
        stat: body.stat,
        newValue: currentStats[body.stat] + body.points,
      });
    }

    return reply.send(updated);
  });

  // Set active title
  fastify.put('/:memberId/title', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };
    const body = setTitleSchema.parse(request.body);

    const canEdit = await verifyParentOrSelf(user.id, memberId, householdId);
    if (!canEdit) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only set your own title or your children\'s',
      });
    }

    // Get current profile
    const [profile] = await db
      .select()
      .from(characterProfiles)
      .where(eq(characterProfiles.memberId, memberId));

    if (!profile) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Character profile not found',
      });
    }

    // Validate title is available
    if (body.title !== null) {
      const availableTitles = getAvailableTitles(profile.level);
      if (!availableTitles.includes(body.title)) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Title is not available at your current level',
        });
      }
    }

    // Update title
    const [updated] = await db
      .update(characterProfiles)
      .set({
        activeTitle: body.title,
        updatedAt: new Date(),
      })
      .where(eq(characterProfiles.memberId, memberId))
      .returning();

    return reply.send(updated);
  });

  // Get character leaderboard for household
  fastify.get('/leaderboard', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { householdId } = request.params as { householdId: string };
      const { period = 'week' } = request.query as { period?: 'week' | 'month' | 'all-time' };

      const membership = await verifyMembership(user.id, householdId);
      if (!membership) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You are not a member of this household',
        });
      }

      // Get all character profiles for household
      const profiles = await db
        .select({
          profile: characterProfiles,
          member: members,
          class: characterClasses,
        })
        .from(characterProfiles)
        .innerJoin(members, eq(characterProfiles.memberId, members.id))
        .innerJoin(characterClasses, eq(characterProfiles.classId, characterClasses.id))
        .where(eq(characterProfiles.householdId, householdId))
        .orderBy(desc(characterProfiles.level), desc(characterProfiles.xpLifetime));

      // Calculate period start date
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0); // All time
      }

      // Batch query: Get XP earned by all members in period (avoids N+1)
      const memberIds = profiles.map(p => p.profile.memberId);
      const xpByMember: Record<string, number> = {};

      if (memberIds.length > 0) {
        const xpTotals = await db
          .select({
            memberId: xpTransactions.memberId,
            total: sql<number>`COALESCE(SUM(${xpTransactions.amount}), 0)`,
          })
          .from(xpTransactions)
          .where(and(
            inArray(xpTransactions.memberId, memberIds),
            gte(xpTransactions.createdAt, startDate),
            sql`${xpTransactions.amount} > 0`
          ))
          .groupBy(xpTransactions.memberId);

        for (const row of xpTotals) {
          xpByMember[row.memberId] = Number(row.total);
        }
      }

      // Build leaderboard entries
      const entries = profiles.map((p, index) => ({
        rank: index + 1,
        card: {
          memberId: p.member.id,
          memberName: p.member.name,
          memberColor: p.member.color,
          characterClass: p.class.id as CharacterClass,
          level: p.profile.level,
          title: p.profile.activeTitle,
          avatar: p.profile.avatar as AvatarCustomization,
          stats: {
            speed: p.profile.statSpeed,
            quality: p.profile.statQuality,
            consistency: p.profile.statConsistency,
            teamwork: p.profile.statTeamwork,
          },
          topSkills: [],
          achievements: (p.member.badges || []).length,
          streakCurrent: p.member.streakCurrent || 0,
        },
        xpThisWeek: xpByMember[p.profile.memberId] || 0,
        levelsGained: 0,
      }));

      // Find current user's rank
      const myRank = entries.findIndex(e => e.card.memberId === membership.id) + 1;

      return reply.send({
        entries,
        myRank: myRank > 0 ? myRank : null,
        period,
      });
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch leaderboard');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch leaderboard',
      });
    }
  });

  // Award XP to a member (internal use, called when chores are completed)
  fastify.post('/:memberId/xp', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };
    const body = z.object({
      amount: z.number().int().min(1),
      transactionType: z.string(),
      referenceId: z.string().uuid().optional(),
      referenceType: z.string().optional(),
      description: z.string().optional(),
    }).parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get current profile
    const [profile] = await db
      .select()
      .from(characterProfiles)
      .where(eq(characterProfiles.memberId, memberId));

    if (!profile) {
      // Character doesn't exist yet, skip XP award
      return reply.send({ skipped: true, reason: 'No character profile' });
    }

    const previousXP = profile.xpLifetime;
    const newXP = previousXP + body.amount;

    // Check for level up
    const levelUpResult = checkLevelUp(previousXP, newXP);
    const statPointsEarned = levelUpResult.leveledUp
      ? (levelUpResult.newLevel - levelUpResult.previousLevel) * CHARACTER_CONFIG.statPointsPerLevel
      : 0;

    // Update profile
    const [updated] = await db
      .update(characterProfiles)
      .set({
        xp: profile.xp + body.amount,
        xpLifetime: newXP,
        level: levelUpResult.newLevel,
        statPointsAvailable: profile.statPointsAvailable + statPointsEarned,
        updatedAt: new Date(),
      })
      .where(eq(characterProfiles.memberId, memberId))
      .returning();

    // Record transaction
    await db.insert(xpTransactions).values({
      householdId,
      memberId,
      amount: body.amount,
      balanceAfter: newXP,
      transactionType: body.transactionType,
      referenceId: body.referenceId,
      referenceType: body.referenceType,
      description: body.description,
    });

    // Emit events
    const io = fastify.io;
    if (io) {
      if (levelUpResult.leveledUp) {
        const member = await getMemberById(memberId, householdId);
        io.to(`household:${householdId}`).emit('character:leveled-up', {
          memberId,
          memberName: member?.name,
          previousLevel: levelUpResult.previousLevel,
          newLevel: levelUpResult.newLevel,
          unlocks: levelUpResult.unlocks,
        });
      }
    }

    return reply.send({
      profile: updated,
      xpAwarded: body.amount,
      leveledUp: levelUpResult.leveledUp,
      previousLevel: levelUpResult.previousLevel,
      newLevel: levelUpResult.newLevel,
      unlocks: levelUpResult.unlocks,
    });
  });

  // Get XP history for a member
  fastify.get('/:memberId/xp-history', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const { householdId, memberId } = request.params as { householdId: string; memberId: string };
      const queryParams = request.query as { limit?: string; offset?: string };

      // Validate and sanitize pagination params
      const limitNum = Math.min(
        Math.max(1, parseInt(queryParams.limit || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
        MAX_LIMIT
      );
      const offsetNum = Math.max(0, parseInt(queryParams.offset || '0', 10) || 0);

      const membership = await verifyMembership(user.id, householdId);
      if (!membership) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You are not a member of this household',
        });
      }

      const transactions = await db
        .select()
        .from(xpTransactions)
        .where(eq(xpTransactions.memberId, memberId))
        .orderBy(desc(xpTransactions.createdAt))
        .limit(limitNum)
        .offset(offsetNum);

      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(xpTransactions)
        .where(eq(xpTransactions.memberId, memberId));

      const total = Number(countResult?.count || 0);

      return reply.send({
        transactions,
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + transactions.length < total,
      });
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch XP history');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch XP history',
      });
    }
  });
}
