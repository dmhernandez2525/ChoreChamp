import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../lib/db';
import { choreBoardPreferences } from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership } from '../lib/membership';

const updateBoardPreferencesSchema = z.object({
  viewMode: z.enum(['kanban', 'calendar', 'list', 'dashboard']).optional(),
  columnSettings: z.record(z.object({
    color: z.string().optional(),
    wipLimit: z.number().min(0).optional(),
    hidden: z.boolean().optional(),
    order: z.number().optional(),
  })).optional(),
  defaultGroupBy: z.enum(['member', 'category', 'priority', 'due_date', 'none']).nullable().optional(),
  defaultSort: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']),
  }).optional(),
});

export async function boardRoutes(fastify: FastifyInstance) {
  // Get board preferences for current member
  fastify.get('/preferences', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const [prefs] = await db
      .select()
      .from(choreBoardPreferences)
      .where(and(
        eq(choreBoardPreferences.householdId, householdId),
        eq(choreBoardPreferences.memberId, membership.id)
      ));

    if (!prefs) {
      // Return defaults if no preferences saved yet
      return reply.send({
        viewMode: 'dashboard',
        columnSettings: {},
        defaultGroupBy: null,
        defaultSort: { field: 'boardOrder', direction: 'asc' },
      });
    }

    return reply.send(prefs);
  });

  // Update board preferences
  fastify.put('/preferences', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = updateBoardPreferencesSchema.parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Upsert preferences
    const [existing] = await db
      .select()
      .from(choreBoardPreferences)
      .where(and(
        eq(choreBoardPreferences.householdId, householdId),
        eq(choreBoardPreferences.memberId, membership.id)
      ));

    if (existing) {
      const [updated] = await db
        .update(choreBoardPreferences)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(choreBoardPreferences.id, existing.id))
        .returning();
      return reply.send(updated);
    }

    const [created] = await db
      .insert(choreBoardPreferences)
      .values({
        householdId,
        memberId: membership.id,
        viewMode: body.viewMode || 'dashboard',
        columnSettings: body.columnSettings || {},
        defaultGroupBy: body.defaultGroupBy || null,
        defaultSort: body.defaultSort || { field: 'boardOrder', direction: 'asc' },
      })
      .returning();

    return reply.status(201).send(created);
  });
}
