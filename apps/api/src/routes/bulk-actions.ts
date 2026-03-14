import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../lib/db';
import { chores, choreActivityLog, members } from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { emitToHousehold } from '../lib/socket';

const bulkUpdateSchema = z.object({
  choreIds: z.array(z.string().uuid()).min(1).max(50),
  changes: z.object({
    assignedTo: z.array(z.string().uuid()).optional(),
    category: z.string().max(50).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  }),
  dueDate: z.string().optional(),
});

const bulkReorderSchema = z.object({
  updates: z.array(z.object({
    choreId: z.string().uuid(),
    boardOrder: z.number().min(0),
  })).min(1).max(100),
});

const bulkDeleteSchema = z.object({
  choreIds: z.array(z.string().uuid()).min(1).max(50),
});

async function verifyParentMembership(
  userId: string,
  householdId: string
): Promise<typeof members.$inferSelect | null> {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(
      eq(members.householdId, householdId),
      eq(members.userId, userId),
      eq(members.role, 'parent')
    ));
  return membership || null;
}

export async function bulkActionRoutes(fastify: FastifyInstance) {
  // Bulk update chores (assign, change category/priority)
  fastify.patch('/bulk', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = bulkUpdateSchema.parse(request.body);

    const membership = await verifyParentMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can perform bulk actions',
      });
    }

    // Verify all chores belong to this household
    const existingChores = await db
      .select({ id: chores.id })
      .from(chores)
      .where(and(
        inArray(chores.id, body.choreIds),
        eq(chores.householdId, householdId)
      ));

    if (existingChores.length !== body.choreIds.length) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Some chore IDs do not belong to this household',
      });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.changes.assignedTo !== undefined) updateData.assignedTo = body.changes.assignedTo;
    if (body.changes.category !== undefined) updateData.category = body.changes.category;
    if (body.changes.priority !== undefined) updateData.priority = body.changes.priority;

    const updated = await db
      .update(chores)
      .set(updateData)
      .where(and(
        inArray(chores.id, body.choreIds),
        eq(chores.householdId, householdId)
      ))
      .returning();

    // Log activity for each chore
    const activityEntries = body.choreIds.map(choreId => ({
      choreId,
      memberId: membership.id,
      action: 'edited' as const,
      oldValue: null,
      newValue: body.changes,
    }));

    if (activityEntries.length > 0) {
      await db.insert(choreActivityLog).values(activityEntries);
    }

    emitToHousehold(fastify, householdId, 'chores:bulk:updated', {
      choreIds: body.choreIds,
      changes: body.changes,
    });

    return reply.send({ updated: updated.length, chores: updated });
  });

  // Bulk reorder chores (drag-and-drop board positions)
  fastify.patch('/reorder', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = bulkReorderSchema.parse(request.body);

    const membership = await verifyParentMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can reorder chores',
      });
    }

    // Update each chore's board order
    const results = await Promise.all(
      body.updates.map(update =>
        db
          .update(chores)
          .set({ boardOrder: update.boardOrder, updatedAt: new Date() })
          .where(and(
            eq(chores.id, update.choreId),
            eq(chores.householdId, householdId)
          ))
          .returning({ id: chores.id, boardOrder: chores.boardOrder })
      )
    );

    emitToHousehold(fastify, householdId, 'chores:reordered', {
      updates: body.updates,
    });

    return reply.send({ updated: results.flat().length });
  });

  // Bulk soft-delete chores
  fastify.post('/bulk-delete', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = bulkDeleteSchema.parse(request.body);

    const membership = await verifyParentMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can delete chores',
      });
    }

    const updated = await db
      .update(chores)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        inArray(chores.id, body.choreIds),
        eq(chores.householdId, householdId)
      ))
      .returning({ id: chores.id });

    emitToHousehold(fastify, householdId, 'chores:bulk:deleted', {
      choreIds: updated.map(c => c.id),
    });

    return reply.send({ deleted: updated.length });
  });
}
