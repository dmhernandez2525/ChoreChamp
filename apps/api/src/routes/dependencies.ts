import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, or, sql } from 'drizzle-orm';
import { choreDependencies, chores } from '@chorechamp/database/schema';
import { db } from '../lib/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership } from '../lib/membership';

const addDependencySchema = z.object({
  dependsOnChoreId: z.string().uuid(),
  type: z.enum(['blocks', 'blocked_by', 'relates_to']).default('blocks'),
});

export async function dependencyRoutes(app: FastifyInstance) {
  // GET /:householdId/chores/:choreId/dependencies
  app.get('/:householdId/chores/:choreId/dependencies', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId } = request.params as { householdId: string; choreId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }

    // Join to the "other" chore in the relationship so the UI can display
    // the related chore's title. When choreId is the source, join on
    // dependsOnChoreId; when choreId is the target, join on choreId.
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
        sql`CASE WHEN ${choreDependencies.choreId} = ${choreId} THEN ${choreDependencies.dependsOnChoreId} ELSE ${choreDependencies.choreId} END`
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
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId } = request.params as { householdId: string; choreId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = addDependencySchema.parse(request.body);

    // Prevent self-dependency
    if (choreId === body.dependsOnChoreId) {
      return reply.status(400).send({ error: 'A chore cannot depend on itself' });
    }

    // BFS cycle detection: walk the dependency graph starting from
    // dependsOnChoreId. If we can reach choreId, adding the edge
    // choreId -> dependsOnChoreId would create a cycle.
    const visited = new Set<string>();
    const queue = [body.dependsOnChoreId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === choreId) {
        return reply.status(400).send({ error: 'Circular dependency detected' });
      }
      if (visited.has(current)) continue;
      visited.add(current);

      const downstream = await db
        .select({ target: choreDependencies.dependsOnChoreId })
        .from(choreDependencies)
        .where(eq(choreDependencies.choreId, current));

      for (const row of downstream) {
        if (!visited.has(row.target)) {
          queue.push(row.target);
        }
      }
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
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId, depId } = request.params as { householdId: string; choreId: string; depId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }

    await db
      .delete(choreDependencies)
      .where(and(
        eq(choreDependencies.id, depId),
        eq(choreDependencies.choreId, choreId)
      ));

    return reply.status(204).send();
  });
}
