import { FastifyInstance } from 'fastify';
import { eq, and, gte, lte } from 'drizzle-orm';
import { db } from '../lib/db';
import { choreSchedules, chores, members, choreCompletions } from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership } from '../lib/membership';
import { validateUUID } from '../lib/validate-params';

export async function scheduleRoutes(fastify: FastifyInstance) {
  // Get schedule for a date range
  fastify.get('/', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    validateUUID(householdId, 'householdId');
    const { startDate, endDate, memberId } = request.query as {
      startDate?: string;
      endDate?: string;
      memberId?: string;
    };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Default to today if no dates provided
    const today = new Date().toISOString().split('T')[0];
    const start = startDate || today;
    const end = endDate || today;

    // Build conditions array
    const conditions = [
      eq(choreSchedules.householdId, householdId),
      gte(choreSchedules.scheduledDate, start),
      lte(choreSchedules.scheduledDate, end),
    ];

    if (memberId) {
      conditions.push(eq(choreSchedules.assignedTo, memberId));
    }

    const schedules = await db
      .select({
        schedule: choreSchedules,
        chore: chores,
        assignee: members,
      })
      .from(choreSchedules)
      .innerJoin(chores, eq(choreSchedules.choreId, chores.id))
      .innerJoin(members, eq(choreSchedules.assignedTo, members.id))
      .where(and(...conditions));

    return reply.send(schedules);
  });

  // Get today's schedule (convenience endpoint)
  fastify.get('/today', {
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

    const today = new Date().toISOString().split('T')[0];

    const schedules = await db
      .select({
        schedule: choreSchedules,
        chore: chores,
        assignee: members,
      })
      .from(choreSchedules)
      .innerJoin(chores, eq(choreSchedules.choreId, chores.id))
      .innerJoin(members, eq(choreSchedules.assignedTo, members.id))
      .where(and(
        eq(choreSchedules.householdId, householdId),
        eq(choreSchedules.scheduledDate, today)
      ));

    // Separate into completed and pending
    const completed = schedules.filter(s => s.schedule.isCompleted);
    const pending = schedules.filter(s => !s.schedule.isCompleted);

    return reply.send({
      date: today,
      completed,
      pending,
      totalCount: schedules.length,
      completedCount: completed.length,
    });
  });

  // Get my chores for today
  fastify.get('/my-chores', {
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

    const today = new Date().toISOString().split('T')[0];

    const mySchedules = await db
      .select({
        schedule: choreSchedules,
        chore: chores,
      })
      .from(choreSchedules)
      .innerJoin(chores, eq(choreSchedules.choreId, chores.id))
      .where(and(
        eq(choreSchedules.householdId, householdId),
        eq(choreSchedules.assignedTo, membership.id),
        eq(choreSchedules.scheduledDate, today)
      ));

    return reply.send(mySchedules);
  });

  // Get pending approvals (for parents)
  fastify.get('/pending-approvals', {
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

    if (membership.role !== 'parent') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can view pending approvals',
      });
    }

    const pendingCompletions = await db
      .select({
        completion: choreCompletions,
        chore: chores,
        member: members,
      })
      .from(choreCompletions)
      .innerJoin(chores, eq(choreCompletions.choreId, chores.id))
      .innerJoin(members, eq(choreCompletions.memberId, members.id))
      .where(and(
        eq(choreCompletions.householdId, householdId),
        eq(choreCompletions.status, 'pending')
      ));

    return reply.send(pendingCompletions);
  });
}
