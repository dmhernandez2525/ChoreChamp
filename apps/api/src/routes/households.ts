import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../lib/db';
import { households, members, inviteCodes, userHouseholds } from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { randomBytes } from 'crypto';

// Validation schemas
const createHouseholdSchema = z.object({
  name: z.string().min(1).max(100),
  timezone: z.string().default('America/New_York'),
  weekStartsOn: z.number().min(0).max(6).default(0),
  pointsName: z.string().max(50).default('Stars'),
});

const updateHouseholdSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  timezone: z.string().optional(),
  weekStartsOn: z.number().min(0).max(6).optional(),
  pointsName: z.string().max(50).optional(),
  currency: z.string().length(3).optional(),
});

const createInviteSchema = z.object({
  role: z.enum(['parent', 'child', 'teen', 'viewer']).default('child'),
  maxUses: z.number().min(1).max(100).optional(),
  expiresInDays: z.number().min(1).max(30).default(7),
});

function generateInviteCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

export async function householdRoutes(fastify: FastifyInstance) {
  // Create household
  fastify.post('/', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const body = createHouseholdSchema.parse(request.body);

    // Create household
    const [household] = await db
      .insert(households)
      .values({
        name: body.name,
        createdBy: user.id,
        timezone: body.timezone,
        weekStartsOn: body.weekStartsOn,
        pointsName: body.pointsName,
      })
      .returning();

    // Create member for the creator as parent
    const [member] = await db
      .insert(members)
      .values({
        householdId: household.id,
        userId: user.id,
        name: user.name || user.email.split('@')[0],
        role: 'parent',
        color: '#3B82F6', // Blue
      })
      .returning();

    // Link user to household
    await db.insert(userHouseholds).values({
      userId: user.id,
      householdId: household.id,
    });

    return reply.status(201).send({
      household,
      member,
    });
  });

  // List user's households
  fastify.get('/', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;

    const userHouseholdsData = await db
      .select({
        household: households,
        member: members,
      })
      .from(userHouseholds)
      .innerJoin(households, eq(userHouseholds.householdId, households.id))
      .innerJoin(members, and(
        eq(members.householdId, households.id),
        eq(members.userId, user.id)
      ))
      .where(eq(userHouseholds.userId, user.id));

    return reply.send(userHouseholdsData);
  });

  // Get household by ID
  fastify.get('/:householdId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    // Verify user is a member
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.householdId, householdId),
        eq(members.userId, user.id)
      ));

    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
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

    // Get all members
    const householdMembers = await db
      .select()
      .from(members)
      .where(eq(members.householdId, householdId));

    return reply.send({
      ...household,
      members: householdMembers,
      currentUserRole: membership.role,
    });
  });

  // Update household
  fastify.patch('/:householdId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = updateHouseholdSchema.parse(request.body);

    // Verify user is a parent member
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.householdId, householdId),
        eq(members.userId, user.id),
        eq(members.role, 'parent')
      ));

    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can update household settings',
      });
    }

    const [household] = await db
      .update(households)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(households.id, householdId))
      .returning();

    return reply.send(household);
  });

  // Delete household
  fastify.delete('/:householdId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    // Verify user is the creator
    const [household] = await db
      .select()
      .from(households)
      .where(and(
        eq(households.id, householdId),
        eq(households.createdBy, user.id)
      ));

    if (!household) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only the household creator can delete it',
      });
    }

    await db.delete(households).where(eq(households.id, householdId));

    return reply.status(204).send();
  });

  // Create invite code
  fastify.post('/:householdId/invites', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = createInviteSchema.parse(request.body);

    // Verify user is a parent member
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.householdId, householdId),
        eq(members.userId, user.id),
        eq(members.role, 'parent')
      ));

    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can create invite codes',
      });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + body.expiresInDays);

    const [invite] = await db
      .insert(inviteCodes)
      .values({
        householdId,
        code: generateInviteCode(),
        role: body.role,
        createdBy: user.id,
        expiresAt,
        maxUses: body.maxUses,
      })
      .returning();

    return reply.status(201).send(invite);
  });

  // List invite codes
  fastify.get('/:householdId/invites', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    // Verify user is a parent member
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.householdId, householdId),
        eq(members.userId, user.id),
        eq(members.role, 'parent')
      ));

    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can view invite codes',
      });
    }

    const invites = await db
      .select()
      .from(inviteCodes)
      .where(and(
        eq(inviteCodes.householdId, householdId),
        eq(inviteCodes.isActive, true)
      ));

    return reply.send(invites);
  });

  // Join household with invite code
  fastify.post('/join', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { code } = request.body as { code: string };

    if (!code) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invite code is required',
      });
    }

    // Find invite code
    const [invite] = await db
      .select()
      .from(inviteCodes)
      .where(and(
        eq(inviteCodes.code, code.toUpperCase()),
        eq(inviteCodes.isActive, true)
      ));

    if (!invite) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Invalid invite code',
      });
    }

    // Check expiration
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return reply.status(410).send({
        error: 'Gone',
        message: 'Invite code has expired',
      });
    }

    // Check max uses
    if (invite.maxUses && (invite.useCount || 0) >= invite.maxUses) {
      return reply.status(410).send({
        error: 'Gone',
        message: 'Invite code has reached maximum uses',
      });
    }

    // Check if already a member
    const [existingMember] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.householdId, invite.householdId),
        eq(members.userId, user.id)
      ));

    if (existingMember) {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'You are already a member of this household',
      });
    }

    // Create member
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const [member] = await db
      .insert(members)
      .values({
        householdId: invite.householdId,
        userId: user.id,
        name: user.name || user.email.split('@')[0],
        role: invite.role || 'child',
        color: randomColor,
      })
      .returning();

    // Link user to household
    await db.insert(userHouseholds).values({
      userId: user.id,
      householdId: invite.householdId,
    });

    // Increment use count
    await db
      .update(inviteCodes)
      .set({ useCount: (invite.useCount || 0) + 1 })
      .where(eq(inviteCodes.id, invite.id));

    // Get household
    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.id, invite.householdId));

    return reply.status(201).send({
      household,
      member,
    });
  });
}
