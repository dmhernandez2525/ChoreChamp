import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, gte, lte } from 'drizzle-orm';
import { db } from '../lib/db';
import { chores, choreSchedules, choreCompletions, members } from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  memberId: z.string().uuid().optional(),
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

export async function calendarRoutes(fastify: FastifyInstance) {
  // Get chores for a date range (calendar view)
  fastify.get('/', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const query = dateRangeSchema.parse(request.query);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get scheduled chores in date range
    const schedules = await db
      .select({
        schedule: choreSchedules,
        chore: chores,
        completion: choreCompletions,
      })
      .from(choreSchedules)
      .innerJoin(chores, eq(choreSchedules.choreId, chores.id))
      .leftJoin(choreCompletions, eq(choreSchedules.completionId, choreCompletions.id))
      .where(and(
        eq(choreSchedules.householdId, householdId),
        gte(choreSchedules.scheduledDate, query.startDate),
        lte(choreSchedules.scheduledDate, query.endDate),
        ...(query.memberId ? [eq(choreSchedules.assignedTo, query.memberId)] : [])
      ));

    // Group by date for calendar rendering
    const byDate: Record<string, typeof schedules> = {};
    for (const entry of schedules) {
      const date = entry.schedule.scheduledDate;
      if (!byDate[date]) {
        byDate[date] = [];
      }
      byDate[date].push(entry);
    }

    return reply.send({
      startDate: query.startDate,
      endDate: query.endDate,
      dates: byDate,
      totalScheduled: schedules.length,
      totalCompleted: schedules.filter(s => s.schedule.isCompleted).length,
    });
  });

  // Get chore counts per day for a month (mini calendar)
  fastify.get('/counts', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const query = dateRangeSchema.parse(request.query);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const schedules = await db
      .select({
        date: choreSchedules.scheduledDate,
        isCompleted: choreSchedules.isCompleted,
      })
      .from(choreSchedules)
      .where(and(
        eq(choreSchedules.householdId, householdId),
        gte(choreSchedules.scheduledDate, query.startDate),
        lte(choreSchedules.scheduledDate, query.endDate),
      ));

    const counts: Record<string, { total: number; completed: number }> = {};
    for (const s of schedules) {
      if (!counts[s.date]) {
        counts[s.date] = { total: 0, completed: 0 };
      }
      counts[s.date].total++;
      if (s.isCompleted) {
        counts[s.date].completed++;
      }
    }

    return reply.send(counts);
  });
}
