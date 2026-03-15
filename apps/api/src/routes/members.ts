import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../lib/db';
import { households, members, pointTransactions } from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { getEffectiveMemberLimit } from '../lib/subscription';
import { verifyMembership, verifyParentMembership } from '../lib/membership';
import { validateUUID } from '../lib/validate-params';

// Validation schemas
const createMemberSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.enum(['parent', 'child', 'teen', 'viewer']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  avatarUrl: z.string().url().optional(),
  birthYear: z.number().min(1900).max(new Date().getFullYear()).optional(),
  canRedeemRewards: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
});

const updateMemberSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['parent', 'child', 'teen', 'viewer']).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  birthYear: z.number().min(1900).max(new Date().getFullYear()).nullable().optional(),
  canRedeemRewards: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function memberRoutes(fastify: FastifyInstance) {
  // Get all members of a household
  fastify.get('/', {
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

    const householdMembers = await db
      .select()
      .from(members)
      .where(eq(members.householdId, householdId));

    return reply.send(householdMembers);
  });

  // Create a new member (for child profiles without user accounts)
  fastify.post('/', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    validateUUID(householdId, 'householdId');
    const body = createMemberSchema.parse(request.body);

    const isParent = await verifyParentMembership(user.id, householdId);
    if (!isParent) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can add members',
      });
    }

    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.id, householdId));

    if (!household) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Household not found',
      });
    }

    const memberLimit = getEffectiveMemberLimit(household);
    if (memberLimit !== null) {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(members)
        .where(and(eq(members.householdId, householdId), eq(members.isActive, true)));

      if (Number(count) >= memberLimit) {
        return reply.status(403).send({
          error: 'Limit Reached',
          message: `Your plan allows up to ${memberLimit} family members.`,
        });
      }
    }

    const [member] = await db
      .insert(members)
      .values({
        householdId,
        name: body.name,
        role: body.role,
        color: body.color,
        avatarUrl: body.avatarUrl,
        birthYear: body.birthYear,
        canRedeemRewards: body.canRedeemRewards,
        requiresApproval: body.requiresApproval,
      })
      .returning();

    return reply.status(201).send(member);
  });

  // Get a specific member
  fastify.get('/:memberId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };
    validateUUID(householdId, 'householdId');
    validateUUID(memberId, 'memberId');

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const [member] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.id, memberId),
        eq(members.householdId, householdId)
      ));

    if (!member) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Member not found',
      });
    }

    return reply.send(member);
  });

  // Update a member
  fastify.patch('/:memberId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };
    validateUUID(householdId, 'householdId');
    validateUUID(memberId, 'memberId');
    const body = updateMemberSchema.parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get target member
    const [targetMember] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.id, memberId),
        eq(members.householdId, householdId)
      ));

    if (!targetMember) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Member not found',
      });
    }

    // Check permissions
    const isSelf = targetMember.userId === user.id;
    const isParent = membership.role === 'parent';

    // Only parents can change roles or permissions
    if ((body.role || body.canRedeemRewards !== undefined || body.requiresApproval !== undefined) && !isParent) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can change roles and permissions',
      });
    }

    // Non-parents can only edit themselves
    if (!isParent && !isSelf) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only edit your own profile',
      });
    }

    const [member] = await db
      .update(members)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(members.id, memberId))
      .returning();

    return reply.send(member);
  });

  // Delete a member
  fastify.delete('/:memberId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };
    validateUUID(householdId, 'householdId');
    validateUUID(memberId, 'memberId');

    const isParent = await verifyParentMembership(user.id, householdId);
    if (!isParent) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can remove members',
      });
    }

    // Prevent deleting self
    const [targetMember] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.id, memberId),
        eq(members.householdId, householdId)
      ));

    if (!targetMember) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Member not found',
      });
    }

    if (targetMember.userId === user.id) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Cannot remove yourself from the household',
      });
    }

    await db.delete(members).where(eq(members.id, memberId));

    return reply.status(204).send();
  });

  // Award bonus points to a member
  fastify.post('/:memberId/points', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };
    validateUUID(householdId, 'householdId');
    validateUUID(memberId, 'memberId');
    const bonusSchema = z.object({
      amount: z.number().int().min(-1000).max(10000),
      reason: z.string().max(500).optional(),
    });
    const parseResult = bonusSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: parseResult.error.issues.map(i => i.message).join(', '),
      });
    }
    const { amount, reason } = parseResult.data;

    const isParent = await verifyParentMembership(user.id, householdId);
    if (!isParent) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can award bonus points',
      });
    }

    const [targetMember] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.id, memberId),
        eq(members.householdId, householdId)
      ));

    if (!targetMember) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Member not found',
      });
    }

    const [member] = await db
      .update(members)
      .set({
        pointsCurrent: (targetMember.pointsCurrent || 0) + amount,
        pointsLifetime: (targetMember.pointsLifetime || 0) + Math.max(0, amount),
        updatedAt: new Date(),
      })
      .where(eq(members.id, memberId))
      .returning();

    await db.insert(pointTransactions).values({
      householdId,
      memberId,
      amount,
      balanceAfter: member.pointsCurrent || 0,
      transactionType: 'bonus',
      referenceId: null,
      referenceType: null,
      description: reason || 'Bonus points awarded',
    });

    return reply.send({
      member,
      bonus: { amount, reason },
    });
  });

  // Use a streak freeze
  fastify.post('/:memberId/streak-freeze', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };
    validateUUID(householdId, 'householdId');
    validateUUID(memberId, 'memberId');

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get target member
    const [targetMember] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.id, memberId),
        eq(members.householdId, householdId)
      ));

    if (!targetMember) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Member not found',
      });
    }

    // Check if user can use freeze (self or parent)
    const isSelf = targetMember.userId === user.id;
    const isParent = membership.role === 'parent';

    if (!isSelf && !isParent) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only use streak freezes for yourself or your children',
      });
    }

    const freezesAvailable = targetMember.streakFreezesAvailable || 0;
    const freezesUsed = targetMember.streakFreezesUsed || 0;

    if (freezesAvailable <= 0) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'No streak freezes available',
      });
    }

    const [member] = await db
      .update(members)
      .set({
        streakFreezesAvailable: freezesAvailable - 1,
        streakFreezesUsed: freezesUsed + 1,
        updatedAt: new Date(),
      })
      .where(eq(members.id, memberId))
      .returning();

    return reply.send(member);
  });
}
