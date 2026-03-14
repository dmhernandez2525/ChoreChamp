import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, or } from 'drizzle-orm';
import { db } from '../lib/db';
import { savedChoreFilters, members } from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const choreFilterSchema = z.object({
  field: z.string(),
  operator: z.enum([
    'equals', 'not_equals', 'contains', 'starts_with',
    'in', 'not_in', 'gt', 'lt', 'gte', 'lte', 'between',
    'is_true', 'is_false', 'before', 'after',
    'is_overdue', 'is_today', 'is_this_week',
  ]),
  value: z.unknown(),
});

const createSavedFilterSchema = z.object({
  name: z.string().min(1).max(100),
  filters: z.array(choreFilterSchema).min(1),
  sort: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']),
  }).optional(),
  groupBy: z.string().optional(),
  visibility: z.enum(['private', 'household']).default('private'),
});

const updateSavedFilterSchema = createSavedFilterSchema.partial();

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

export async function savedFilterRoutes(fastify: FastifyInstance) {
  // Get all saved filters (own + household-visible)
  fastify.get('/filters', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const filters = await db
      .select()
      .from(savedChoreFilters)
      .where(and(
        eq(savedChoreFilters.householdId, householdId),
        or(
          eq(savedChoreFilters.memberId, membership.id),
          eq(savedChoreFilters.visibility, 'household')
        )
      ));

    return reply.send(filters);
  });

  // Create a saved filter
  fastify.post('/filters', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = createSavedFilterSchema.parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const [filter] = await db
      .insert(savedChoreFilters)
      .values({
        householdId,
        memberId: membership.id,
        name: body.name,
        filters: body.filters,
        sort: body.sort || {},
        groupBy: body.groupBy,
        visibility: body.visibility,
      })
      .returning();

    return reply.status(201).send(filter);
  });

  // Update a saved filter
  fastify.put('/filters/:filterId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, filterId } = request.params as { householdId: string; filterId: string };
    const body = updateSavedFilterSchema.parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const [existing] = await db
      .select()
      .from(savedChoreFilters)
      .where(and(
        eq(savedChoreFilters.id, filterId),
        eq(savedChoreFilters.memberId, membership.id)
      ));

    if (!existing) {
      return reply.status(404).send({ error: 'Not Found', message: 'Filter not found' });
    }

    const [updated] = await db
      .update(savedChoreFilters)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(savedChoreFilters.id, filterId))
      .returning();

    return reply.send(updated);
  });

  // Delete a saved filter
  fastify.delete('/filters/:filterId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, filterId } = request.params as { householdId: string; filterId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const [existing] = await db
      .select()
      .from(savedChoreFilters)
      .where(and(
        eq(savedChoreFilters.id, filterId),
        eq(savedChoreFilters.memberId, membership.id)
      ));

    if (!existing) {
      return reply.status(404).send({ error: 'Not Found', message: 'Filter not found' });
    }

    await db
      .delete(savedChoreFilters)
      .where(eq(savedChoreFilters.id, filterId));

    return reply.status(204).send();
  });
}
