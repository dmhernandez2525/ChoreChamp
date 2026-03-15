import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../lib/db';
import { choreActivityLog, chores } from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership } from '../lib/membership';

const activityQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export async function choreActivityRoutes(fastify: FastifyInstance) {
  // Get activity log for a specific chore
  fastify.get('/:choreId/activity', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId } = request.params as { householdId: string; choreId: string };
    const query = activityQuerySchema.parse(request.query);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    // Verify chore belongs to household
    const [chore] = await db
      .select({ id: chores.id })
      .from(chores)
      .where(and(eq(chores.id, choreId), eq(chores.householdId, householdId)));

    if (!chore) {
      return reply.status(404).send({ error: 'Not Found', message: 'Chore not found' });
    }

    const activities = await db
      .select()
      .from(choreActivityLog)
      .where(eq(choreActivityLog.choreId, choreId))
      .orderBy(desc(choreActivityLog.createdAt))
      .limit(query.limit)
      .offset(query.offset);

    return reply.send(activities);
  });
}
