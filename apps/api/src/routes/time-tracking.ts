import { FastifyInstance } from 'fastify';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { timeLogs } from '@chorechamp/database/schema';
import { requireAuth } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';

export async function timeTrackingRoutes(app: FastifyInstance) {
  // POST /:householdId/chores/:choreId/time/start - Start timer
  app.post('/:householdId/chores/:choreId/time/start', {
    preHandler: [requireAuth],
  }, async (request: AuthenticatedRequest, reply) => {
    const { choreId } = request.params as { householdId: string; choreId: string };
    const memberId = request.user.memberId;
    const db = request.server.db;

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
  }, async (request: AuthenticatedRequest, reply) => {
    const { choreId } = request.params as { householdId: string; choreId: string };
    const memberId = request.user.memberId;
    const db = request.server.db;

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

    return updated;
  });

  // GET /:householdId/chores/:choreId/time - Get time logs
  app.get('/:householdId/chores/:choreId/time', {
    preHandler: [requireAuth],
  }, async (request: AuthenticatedRequest) => {
    const { choreId } = request.params as { householdId: string; choreId: string };
    const db = request.server.db;

    const logs = await db
      .select()
      .from(timeLogs)
      .where(eq(timeLogs.choreId, choreId))
      .orderBy(desc(timeLogs.startedAt));

    return logs;
  });
}
