import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, gte, lte, sql, asc, desc, ilike, arrayContains } from 'drizzle-orm';
import { db } from '../lib/db';
import { chores, choreCompletions, members, households } from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { calculateChorePoints, getStreakBonus } from '@chorechamp/gamification';
import type { Difficulty } from '@chorechamp/gamification';
import { Server } from 'socket.io';
import { emitToHousehold } from '../lib/socket';
import { verifyMembership, verifyParentMembership } from '../lib/membership';
import { validateUUID } from '../lib/validate-params';

// Validation schemas
const createChoreSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  icon: z.string().max(50).default('✅'),
  category: z.string().max(50).default('general'),
  pointValue: z.number().min(1).max(1000).default(10),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard', 'epic']).default('medium'),
  assignedTo: z.array(z.string().uuid()).default([]),
  assignmentType: z.enum(['specific', 'rotating', 'anyone']).default('specific'),
  recurrenceType: z.enum(['once', 'daily', 'weekly', 'monthly', 'custom']).default('once'),
  recurrenceDays: z.array(z.number().min(0).max(6)).optional(),
  recurrenceInterval: z.number().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  dueTime: z.string().optional(),
  timeWindowMinutes: z.number().min(1).optional(),
  requiresApproval: z.boolean().default(false),
  requiresPhoto: z.boolean().default(false),
  estimatedMinutes: z.number().min(1).optional(),
  showTimer: z.boolean().default(false),
  steps: z.array(z.string()).optional(),
});

const updateChoreSchema = createChoreSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Query params for listing chores with sort/filter/search
const listChoresQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().uuid().optional(),
  difficulty: z.enum(['trivial', 'easy', 'medium', 'hard', 'epic']).optional(),
  sortBy: z.enum(['title', 'priority', 'boardOrder', 'createdAt', 'dueTime', 'pointValue']).default('boardOrder'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
  limit: z.coerce.number().min(1).max(200).default(100),
  offset: z.coerce.number().min(0).default(0),
});

const completeChoreSchema = z.object({
  scheduledDate: z.string(),
  photoUrl: z.string().url().optional(),
  startedAt: z.string().optional(),
  durationSeconds: z.number().min(0).optional(),
});

// Map chore difficulty to gamification difficulty
function mapDifficulty(choreDifficulty: string | null): Difficulty {
  const map: Record<string, Difficulty> = {
    'trivial': 'easy',
    'easy': 'easy',
    'medium': 'medium',
    'hard': 'hard',
    'epic': 'hard',
  };
  return map[choreDifficulty || 'medium'] || 'medium';
}

export async function choreRoutes(fastify: FastifyInstance) {
  // Get pending completions awaiting approval
  fastify.get('/pending-completions', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    validateUUID(householdId, 'householdId');

    const isParent = await verifyParentMembership(user.id, householdId);
    if (!isParent) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can view pending completions',
      });
    }

    const pendingCompletions = await db
      .select({
        id: choreCompletions.id,
        choreId: choreCompletions.choreId,
        householdId: choreCompletions.householdId,
        memberId: choreCompletions.memberId,
        scheduledDate: choreCompletions.scheduledDate,
        completedAt: choreCompletions.completedAt,
        status: choreCompletions.status,
        photoUrl: choreCompletions.photoUrl,
        pointsAwarded: choreCompletions.pointsAwarded,
        startedAt: choreCompletions.startedAt,
        durationSeconds: choreCompletions.durationSeconds,
        createdAt: choreCompletions.createdAt,
        choreName: chores.title,
        choreIcon: chores.icon,
        memberName: members.name,
        memberColor: members.color,
      })
      .from(choreCompletions)
      .innerJoin(chores, eq(choreCompletions.choreId, chores.id))
      .innerJoin(members, eq(choreCompletions.memberId, members.id))
      .where(and(
        eq(choreCompletions.householdId, householdId),
        eq(choreCompletions.status, 'pending')
      ))
      .orderBy(desc(choreCompletions.completedAt));

    return reply.send(pendingCompletions);
  });

  // Get all chores for a household
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

    const query = listChoresQuerySchema.parse(request.query);

    // Build where conditions
    const conditions = [
      eq(chores.householdId, householdId),
      eq(chores.isActive, true),
    ];

    if (query.search) {
      const escapedSearch = query.search.replace(/[%_\\]/g, '\\$&');
      conditions.push(ilike(chores.title, `%${escapedSearch}%`));
    }
    if (query.category) {
      conditions.push(eq(chores.category, query.category));
    }
    if (query.priority) {
      conditions.push(eq(chores.priority, query.priority));
    }
    if (query.assignedTo) {
      conditions.push(arrayContains(chores.assignedTo, [query.assignedTo]));
    }
    if (query.difficulty) {
      conditions.push(eq(chores.difficulty, query.difficulty));
    }

    // Build sort
    const sortColumn = {
      title: chores.title,
      priority: chores.priority,
      boardOrder: chores.boardOrder,
      createdAt: chores.createdAt,
      dueTime: chores.dueTime,
      pointValue: chores.pointValue,
    }[query.sortBy];

    const sortFn = query.sortDir === 'desc' ? desc : asc;

    const householdChores = await db
      .select()
      .from(chores)
      .where(and(...conditions))
      .orderBy(sortFn(sortColumn))
      .limit(query.limit)
      .offset(query.offset);

    return reply.send(householdChores);
  });

  // Create a new chore
  fastify.post('/', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    validateUUID(householdId, 'householdId');
    const body = createChoreSchema.parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Only parents can create chores
    if (membership.role !== 'parent') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can create chores',
      });
    }

    const [chore] = await db
      .insert(chores)
      .values({
        householdId,
        title: body.title,
        description: body.description,
        icon: body.icon,
        category: body.category,
        pointValue: body.pointValue,
        difficulty: body.difficulty,
        assignedTo: body.assignedTo,
        assignmentType: body.assignmentType,
        recurrenceType: body.recurrenceType,
        recurrenceDays: body.recurrenceDays,
        recurrenceInterval: body.recurrenceInterval,
        startDate: body.startDate || new Date().toISOString().split('T')[0],
        endDate: body.endDate,
        dueTime: body.dueTime,
        timeWindowMinutes: body.timeWindowMinutes,
        requiresApproval: body.requiresApproval,
        requiresPhoto: body.requiresPhoto,
        estimatedMinutes: body.estimatedMinutes,
        showTimer: body.showTimer,
        steps: body.steps,
        createdBy: membership.id,
      })
      .returning();

    return reply.status(201).send(chore);
  });

  // Get a specific chore
  fastify.get('/:choreId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId } = request.params as { householdId: string; choreId: string };
    validateUUID(householdId, 'householdId');
    validateUUID(choreId, 'choreId');

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const [chore] = await db
      .select()
      .from(chores)
      .where(and(
        eq(chores.id, choreId),
        eq(chores.householdId, householdId)
      ));

    if (!chore) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Chore not found',
      });
    }

    return reply.send(chore);
  });

  // Update a chore
  fastify.patch('/:choreId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId } = request.params as { householdId: string; choreId: string };
    validateUUID(householdId, 'householdId');
    validateUUID(choreId, 'choreId');
    const body = updateChoreSchema.parse(request.body);

    const isParent = await verifyParentMembership(user.id, householdId);
    if (!isParent) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can update chores',
      });
    }

    const [chore] = await db
      .update(chores)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(and(
        eq(chores.id, choreId),
        eq(chores.householdId, householdId)
      ))
      .returning();

    if (!chore) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Chore not found',
      });
    }

    return reply.send(chore);
  });

  // Delete a chore
  fastify.delete('/:choreId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId } = request.params as { householdId: string; choreId: string };
    validateUUID(householdId, 'householdId');
    validateUUID(choreId, 'choreId');

    const isParent = await verifyParentMembership(user.id, householdId);
    if (!isParent) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can delete chores',
      });
    }

    // Soft delete by setting isActive to false
    const [chore] = await db
      .update(chores)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(
        eq(chores.id, choreId),
        eq(chores.householdId, householdId)
      ))
      .returning();

    if (!chore) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Chore not found',
      });
    }

    return reply.status(204).send();
  });

  // Complete a chore
  fastify.post('/:choreId/complete', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId } = request.params as { householdId: string; choreId: string };
    validateUUID(householdId, 'householdId');
    validateUUID(choreId, 'choreId');
    const body = completeChoreSchema.parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get the chore
    const [chore] = await db
      .select()
      .from(chores)
      .where(and(
        eq(chores.id, choreId),
        eq(chores.householdId, householdId),
        eq(chores.isActive, true)
      ));

    if (!chore) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Chore not found',
      });
    }

    // Check if photo is required
    if (chore.requiresPhoto && !body.photoUrl) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Photo is required for this chore',
      });
    }

    // Calculate points
    const memberCurrentStreak = membership.streakCurrent || 0;
    const memberLongestStreak = membership.streakLongest || 0;
    const memberCurrentPoints = membership.pointsCurrent || 0;
    const memberLifetimePoints = membership.pointsLifetime || 0;

    const basePoints = calculateChorePoints({
      basePoints: chore.pointValue,
      difficulty: mapDifficulty(chore.difficulty),
      hasPhoto: !!body.photoUrl,
    });
    // getStreakBonus returns milestone bonus points, not a multiplier
    const milestoneBonus = getStreakBonus(memberCurrentStreak + 1);
    const totalPoints = basePoints + milestoneBonus;

    // Determine initial status
    const status = chore.requiresApproval ? 'pending' : 'approved';

    // Wrap insert + point/streak updates in a transaction to prevent race conditions
    const { completion } = await db.transaction(async (tx) => {
      const [comp] = await tx
        .insert(choreCompletions)
        .values({
          choreId,
          householdId,
          memberId: membership.id,
          scheduledDate: body.scheduledDate,
          status,
          photoUrl: body.photoUrl,
          pointsAwarded: status === 'approved' ? totalPoints : 0,
          streakDay: memberCurrentStreak + 1,
          startedAt: body.startedAt ? new Date(body.startedAt) : undefined,
          durationSeconds: body.durationSeconds,
        })
        .returning();

      if (status === 'approved') {
        const today = new Date().toISOString().split('T')[0];
        const lastCompleted = membership.streakLastCompletedDate;
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        let newStreak = memberCurrentStreak;
        if (lastCompleted === yesterday || lastCompleted === today) {
          newStreak = memberCurrentStreak + 1;
        } else if (lastCompleted !== today) {
          newStreak = 1;
        }

        await tx
          .update(members)
          .set({
            pointsCurrent: memberCurrentPoints + totalPoints,
            pointsLifetime: memberLifetimePoints + totalPoints,
            streakCurrent: newStreak,
            streakLongest: Math.max(memberLongestStreak, newStreak),
            streakLastCompletedDate: today,
            updatedAt: new Date(),
          })
          .where(eq(members.id, membership.id));

        await tx
          .update(households)
          .set({
            totalChoresCompleted: sql`${households.totalChoresCompleted} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(households.id, householdId));
      }

      return { completion: comp };
    });

    // Emit real-time event
    const io = fastify.io as Server;
    if (io) {
      emitToHousehold(io, householdId, 'chore:completed', {
        choreId,
        choreTitle: chore.title,
        completionId: completion.id,
        memberId: membership.id,
        memberName: membership.name,
        pointsAwarded: status === 'approved' ? totalPoints : 0,
        status,
        timestamp: new Date().toISOString(),
      });
    }

    return reply.status(201).send({
      completion,
      pointsAwarded: status === 'approved' ? totalPoints : 0,
      requiresApproval: status === 'pending',
    });
  });

  // Get chore completions
  fastify.get('/:choreId/completions', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId } = request.params as { householdId: string; choreId: string };
    validateUUID(householdId, 'householdId');
    validateUUID(choreId, 'choreId');
    const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Build conditions
    const conditions = [eq(choreCompletions.choreId, choreId)];
    if (startDate) {
      conditions.push(gte(choreCompletions.scheduledDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(choreCompletions.scheduledDate, endDate));
    }

    const completions = await db
      .select()
      .from(choreCompletions)
      .where(and(...conditions));

    return reply.send(completions);
  });

  // Approve a completion
  fastify.post('/:choreId/completions/:completionId/approve', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, completionId } = request.params as { householdId: string; completionId: string };
    validateUUID(householdId, 'householdId');
    validateUUID(completionId, 'completionId');

    const isParent = await verifyParentMembership(user.id, householdId);
    if (!isParent) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can approve completions',
      });
    }

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get the completion
    const [completion] = await db
      .select()
      .from(choreCompletions)
      .where(and(
        eq(choreCompletions.id, completionId),
        eq(choreCompletions.householdId, householdId),
        eq(choreCompletions.status, 'pending')
      ));

    if (!completion) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Pending completion not found',
      });
    }

    // Get the chore for point calculation
    const [chore] = await db
      .select()
      .from(chores)
      .where(eq(chores.id, completion.choreId));

    if (!chore) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Chore not found',
      });
    }

    // Get the member who completed it
    const [completingMember] = await db
      .select()
      .from(members)
      .where(eq(members.id, completion.memberId));

    if (!completingMember) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Completing member not found',
      });
    }

    // Extract member stats with null handling
    const currentStreak = completingMember.streakCurrent || 0;
    const longestStreak = completingMember.streakLongest || 0;
    const currentPoints = completingMember.pointsCurrent || 0;
    const lifetimePoints = completingMember.pointsLifetime || 0;

    // Calculate points
    const basePoints = calculateChorePoints({
      basePoints: chore.pointValue,
      difficulty: mapDifficulty(chore.difficulty),
    });
    const milestoneBonus = getStreakBonus(currentStreak + 1);
    const totalPoints = basePoints + milestoneBonus;

    // Wrap approval + point/streak updates in a transaction
    const { updatedCompletion } = await db.transaction(async (tx) => {
      const [comp] = await tx
        .update(choreCompletions)
        .set({
          status: 'approved',
          approvedBy: membership.id,
          approvedAt: new Date(),
          pointsAwarded: totalPoints,
        })
        .where(eq(choreCompletions.id, completionId))
        .returning();

      const today = new Date().toISOString().split('T')[0];
      const lastCompleted = completingMember.streakLastCompletedDate;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let newStreak = currentStreak;
      if (lastCompleted === yesterday || lastCompleted === today) {
        newStreak = currentStreak + 1;
      } else if (lastCompleted !== today) {
        newStreak = 1;
      }

      await tx
        .update(members)
        .set({
          pointsCurrent: currentPoints + totalPoints,
          pointsLifetime: lifetimePoints + totalPoints,
          streakCurrent: newStreak,
          streakLongest: Math.max(longestStreak, newStreak),
          streakLastCompletedDate: today,
          updatedAt: new Date(),
        })
        .where(eq(members.id, completion.memberId));

      await tx
        .update(households)
        .set({
          totalChoresCompleted: sql`${households.totalChoresCompleted} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(households.id, householdId));

      return { updatedCompletion: comp };
    });

    // Emit real-time event
    const io = fastify.io as Server;
    if (io) {
      emitToHousehold(io, householdId, 'chore:approved', {
        completionId,
        choreId: completion.choreId,
        memberId: completion.memberId,
        memberName: completingMember.name,
        pointsAwarded: totalPoints,
        approvedBy: membership.name,
        timestamp: new Date().toISOString(),
      });
    }

    return reply.send({
      completion: updatedCompletion,
      pointsAwarded: totalPoints,
    });
  });

  // Reject a completion
  fastify.post('/:choreId/completions/:completionId/reject', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, completionId } = request.params as { householdId: string; completionId: string };
    validateUUID(householdId, 'householdId');
    validateUUID(completionId, 'completionId');
    const { reason } = request.body as { reason?: string };

    const isParent = await verifyParentMembership(user.id, householdId);
    if (!isParent) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can reject completions',
      });
    }

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const [completion] = await db
      .update(choreCompletions)
      .set({
        status: 'rejected',
        approvedBy: membership.id,
        approvedAt: new Date(),
        rejectionReason: reason,
      })
      .where(and(
        eq(choreCompletions.id, completionId),
        eq(choreCompletions.householdId, householdId),
        eq(choreCompletions.status, 'pending')
      ))
      .returning();

    if (!completion) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Pending completion not found',
      });
    }

    // Emit real-time event
    const io = fastify.io as Server;
    if (io) {
      emitToHousehold(io, householdId, 'chore:rejected', {
        completionId,
        choreId: completion.choreId,
        memberId: completion.memberId,
        reason,
        rejectedBy: membership.name,
        timestamp: new Date().toISOString(),
      });
    }

    return reply.send(completion);
  });
}
