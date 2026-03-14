import { FastifyInstance } from 'fastify';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { timeLogs, members } from '@chorechamp/database/schema';
import { db } from '../lib/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

export async function timeTrackingRoutes(app: FastifyInstance) {
  // POST /:householdId/chores/:choreId/time/start - Start timer
  app.post('/:householdId/chores/:choreId/time/start', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId } = request.params as { householdId: string; choreId: string };

    // Look up member for this user in this household
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

    const memberId = membership.id;

    // Check if there's already an active timer for this member
    const active = await db
      .select()
      .from(timeLogs)
      .where(and(
        eq(timeLogs.choreId, choreId),
        eq(timeLogs.memberId, memberId),
        isNull(timeLogs.stoppedAt)
      ))
      .limit(1);

    if (active.length > 0) {
      return reply.status(409).send({ error: 'Timer already running for this chore' });
    }

    const [log] = await db
      .insert(timeLogs)
      .values({ choreId, memberId })
      .returning();

    return reply.status(201).send(log);
  });

  // POST /:householdId/chores/:choreId/time/stop - Stop timer
  app.post('/:householdId/chores/:choreId/time/stop', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId } = request.params as { householdId: string; choreId: string };

    // Look up member for this user in this household
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

    const memberId = membership.id;

    const [active] = await db
      .select()
      .from(timeLogs)
      .where(and(
        eq(timeLogs.choreId, choreId),
        eq(timeLogs.memberId, memberId),
        isNull(timeLogs.stoppedAt)
      ))
      .limit(1);

    if (!active) {
      return reply.status(404).send({ error: 'No active timer found' });
    }

    const stoppedAt = new Date();
    const durationSeconds = Math.round((stoppedAt.getTime() - new Date(active.startedAt).getTime()) / 1000);

    const [updated] = await db
      .update(timeLogs)
      .set({ stoppedAt, durationSeconds })
      .where(eq(timeLogs.id, active.id))
      .returning();

    return reply.send(updated);
  });

  // GET /:householdId/chores/:choreId/time - Get time logs
  app.get('/:householdId/chores/:choreId/time', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { choreId } = request.params as { householdId: string; choreId: string };

    const logs = await db
      .select()
      .from(timeLogs)
      .where(eq(timeLogs.choreId, choreId))
      .orderBy(desc(timeLogs.startedAt));

    return reply.send(logs);
  });
}
