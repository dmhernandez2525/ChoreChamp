import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, or } from 'drizzle-orm';
import { choreDependencies, chores } from '@chorechamp/database/schema';
import { db } from '../lib/db';
import { requireAuth } from '../middleware/auth';

const addDependencySchema = z.object({
  dependsOnChoreId: z.string().uuid(),
  type: z.enum(['blocks', 'blocked_by', 'relates_to']).default('blocks'),
});

export async function dependencyRoutes(app: FastifyInstance) {
  // GET /:householdId/chores/:choreId/dependencies
  app.get('/:householdId/chores/:choreId/dependencies', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { choreId } = request.params as { householdId: string; choreId: string };

    const deps = await db
      .select({
        id: choreDependencies.id,
        choreId: choreDependencies.choreId,
        dependsOnChoreId: choreDependencies.dependsOnChoreId,
        type: choreDependencies.type,
        createdAt: choreDependencies.createdAt,
        relatedChoreTitle: chores.title,
        relatedChoreIcon: chores.icon,
      })
      .from(choreDependencies)
      .innerJoin(chores, eq(
        chores.id,
        // Show the "other" chore in the dependency
        // If this chore is the source, show the target; if target, show the source
        choreDependencies.dependsOnChoreId
      ))
      .where(
        or(
          eq(choreDependencies.choreId, choreId),
          eq(choreDependencies.dependsOnChoreId, choreId)
        )
      );

    return reply.send(deps);
  });

  // POST /:householdId/chores/:choreId/dependencies
  app.post('/:householdId/chores/:choreId/dependencies', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { choreId } = request.params as { householdId: string; choreId: string };
    const body = addDependencySchema.parse(request.body);

    // Prevent self-dependency
    if (choreId === body.dependsOnChoreId) {
      return reply.status(400).send({ error: 'A chore cannot depend on itself' });
    }

    // Check for circular dependency (simple: A->B->A)
    const existing = await db
      .select()
      .from(choreDependencies)
      .where(and(
        eq(choreDependencies.choreId, body.dependsOnChoreId),
        eq(choreDependencies.dependsOnChoreId, choreId)
      ))
      .limit(1);

    if (existing.length > 0) {
      return reply.status(400).send({ error: 'Circular dependency detected' });
    }

    const [dep] = await db
      .insert(choreDependencies)
      .values({
        choreId,
        dependsOnChoreId: body.dependsOnChoreId,
        type: body.type,
      })
      .onConflictDoNothing()
      .returning();

    return reply.status(201).send(dep ?? { choreId, dependsOnChoreId: body.dependsOnChoreId, type: body.type });
  });

  // DELETE /:householdId/chores/:choreId/dependencies/:depId
  app.delete('/:householdId/chores/:choreId/dependencies/:depId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { depId } = request.params as { householdId: string; choreId: string; depId: string };

    await db
      .delete(choreDependencies)
      .where(eq(choreDependencies.id, depId));

    return reply.status(204).send();
  });
}
