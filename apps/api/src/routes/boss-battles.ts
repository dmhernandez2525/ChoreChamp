import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { db } from '../lib/db';
import { bossBattles, members } from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

// Validation schemas
const createBossBattleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  icon: z.string().max(50).optional(),
  healthMax: z.number().int().min(100).max(10000).default(1000),
  pointReward: z.number().int().min(10).max(1000).default(100),
  durationDays: z.number().int().min(1).max(14).default(7),
});

const damageBossSchema = z.object({
  damage: z.number().int().min(1),
});

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

async function verifyParentMembership(
  userId: string,
  householdId: string
): Promise<boolean> {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(
      eq(members.householdId, householdId),
      eq(members.userId, userId),
      eq(members.role, 'parent')
    ));
  return !!membership;
}

export async function bossBattleRoutes(fastify: FastifyInstance) {
  // Get current active boss battle
  fastify.get('/current', {
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

    // Get active boss battle (not defeated, not expired)
    const [battle] = await db
      .select()
      .from(bossBattles)
      .where(and(
        eq(bossBattles.householdId, householdId),
        isNull(bossBattles.defeatedAt),
        sql`${bossBattles.endsAt} > NOW()`
      ))
      .limit(1);

    if (!battle) {
      return reply.send(null);
    }

    return reply.send(battle);
  });

  // Get boss battle history
  fastify.get('/history', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const { limit = 10 } = request.query as { limit?: number };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const battles = await db
      .select()
      .from(bossBattles)
      .where(eq(bossBattles.householdId, householdId))
      .orderBy(desc(bossBattles.createdAt))
      .limit(Number(limit));

    return reply.send(battles);
  });

  // Create new boss battle (parents only)
  fastify.post('/', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = createBossBattleSchema.parse(request.body);

    const isParent = await verifyParentMembership(user.id, householdId);
    if (!isParent) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can create boss battles',
      });
    }

    // Check if there's already an active battle
    const [existingBattle] = await db
      .select()
      .from(bossBattles)
      .where(and(
        eq(bossBattles.householdId, householdId),
        isNull(bossBattles.defeatedAt),
        sql`${bossBattles.endsAt} > NOW()`
      ))
      .limit(1);

    if (existingBattle) {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'There is already an active boss battle',
      });
    }

    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + body.durationDays);

    const [battle] = await db
      .insert(bossBattles)
      .values({
        householdId,
        name: body.name,
        description: body.description,
        icon: body.icon,
        healthMax: body.healthMax,
        healthCurrent: body.healthMax,
        pointReward: body.pointReward,
        endsAt,
      })
      .returning();

    return reply.status(201).send(battle);
  });

  // Damage boss (called when chores are completed)
  fastify.post('/:battleId/damage', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, battleId } = request.params as { householdId: string; battleId: string };
    const body = damageBossSchema.parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get the battle
    const [battle] = await db
      .select()
      .from(bossBattles)
      .where(and(
        eq(bossBattles.id, battleId),
        eq(bossBattles.householdId, householdId),
        isNull(bossBattles.defeatedAt)
      ));

    if (!battle) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Active boss battle not found',
      });
    }

    // Check if battle has expired
    if (new Date() > battle.endsAt) {
      return reply.status(410).send({
        error: 'Gone',
        message: 'Boss battle has expired',
      });
    }

    // Calculate new health
    const newHealth = Math.max(0, battle.healthCurrent - body.damage);
    const isDefeated = newHealth === 0;

    // Update battle
    const [updatedBattle] = await db
      .update(bossBattles)
      .set({
        healthCurrent: newHealth,
        defeatedAt: isDefeated ? new Date() : null,
      })
      .where(eq(bossBattles.id, battleId))
      .returning();

    // If defeated, award points to all active members
    if (isDefeated) {
      const activeMembers = await db
        .select()
        .from(members)
        .where(and(
          eq(members.householdId, householdId),
          eq(members.isActive, true)
        ));

      // Award points to each member
      const pointsPerMember = Math.floor(battle.pointReward / activeMembers.length);

      for (const member of activeMembers) {
        await db
          .update(members)
          .set({
            pointsCurrent: (member.pointsCurrent || 0) + pointsPerMember,
            pointsLifetime: (member.pointsLifetime || 0) + pointsPerMember,
          })
          .where(eq(members.id, member.id));
      }

      // Emit victory event
      const io = fastify.io;
      if (io) {
        io.to(`household:${householdId}`).emit('boss:defeated', {
          battleId,
          bossName: battle.name,
          pointReward: battle.pointReward,
          pointsPerMember,
          defeatedAt: updatedBattle.defeatedAt,
        });
      }
    }

    return reply.send({
      battle: updatedBattle,
      damageDealt: body.damage,
      isDefeated,
    });
  });

  // Get a specific boss battle
  fastify.get('/:battleId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, battleId } = request.params as { householdId: string; battleId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const [battle] = await db
      .select()
      .from(bossBattles)
      .where(and(
        eq(bossBattles.id, battleId),
        eq(bossBattles.householdId, householdId)
      ));

    if (!battle) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Boss battle not found',
      });
    }

    return reply.send(battle);
  });
}
