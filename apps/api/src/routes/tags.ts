import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { tags, choreTags, chores } from '@chorechamp/database/schema';
import { db } from '../lib/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership } from '../lib/membership';

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6b7280'),
});

const addChoreTagSchema = z.object({
  tagId: z.string().uuid(),
});

export async function tagRoutes(app: FastifyInstance) {
  // GET /:householdId/tags - List all tags for household
  app.get('/:householdId/tags', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }

    const result = await db
      .select()
      .from(tags)
      .where(eq(tags.householdId, householdId))
      .orderBy(tags.name);

    return reply.send(result);
  });

  // POST /:householdId/tags - Create a new tag
  app.post('/:householdId/tags', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = createTagSchema.parse(request.body);

    const [tag] = await db
      .insert(tags)
      .values({
        householdId,
        name: body.name,
        color: body.color,
      })
      .returning();

    return reply.status(201).send(tag);
  });

  // DELETE /:householdId/tags/:tagId - Delete a tag
  app.delete('/:householdId/tags/:tagId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, tagId } = request.params as { householdId: string; tagId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }

    await db
      .delete(tags)
      .where(and(eq(tags.id, tagId), eq(tags.householdId, householdId)));

    return reply.status(204).send();
  });

  // GET /:householdId/chores/:choreId/tags - Get tags for a chore
  app.get('/:householdId/chores/:choreId/tags', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId } = request.params as { householdId: string; choreId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }

    const result = await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
        choreTagId: choreTags.id,
      })
      .from(choreTags)
      .innerJoin(tags, eq(choreTags.tagId, tags.id))
      .where(eq(choreTags.choreId, choreId));

    return reply.send(result);
  });

  // POST /:householdId/chores/:choreId/tags - Add tag to chore
  app.post('/:householdId/chores/:choreId/tags', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId } = request.params as { householdId: string; choreId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = addChoreTagSchema.parse(request.body);

    // Verify chore belongs to this household
    const [chore] = await db
      .select({ id: chores.id })
      .from(chores)
      .where(and(eq(chores.id, choreId), eq(chores.householdId, householdId)));

    if (!chore) {
      return reply.status(404).send({ error: 'Chore not found in this household' });
    }

    const [choreTag] = await db
      .insert(choreTags)
      .values({
        choreId,
        tagId: body.tagId,
      })
      .onConflictDoNothing()
      .returning();

    return reply.status(201).send(choreTag ?? { choreId, tagId: body.tagId });
  });

  // DELETE /:householdId/chores/:choreId/tags/:tagId - Remove tag from chore
  app.delete('/:householdId/chores/:choreId/tags/:tagId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId, tagId } = request.params as { householdId: string; choreId: string; tagId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }

    await db
      .delete(choreTags)
      .where(and(eq(choreTags.choreId, choreId), eq(choreTags.tagId, tagId)));

    return reply.status(204).send();
  });
}
