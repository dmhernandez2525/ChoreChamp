import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { db } from '../lib/db';
import { choreComments, choreActivityLog, chores, members } from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { emitToHousehold } from '../lib/socket';
import { Server } from 'socket.io';

const addCommentSchema = z.object({
  comment: z.string().min(1).max(5000),
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

async function verifyChoreInHousehold(
  choreId: string,
  householdId: string
): Promise<boolean> {
  const [chore] = await db
    .select({ id: chores.id })
    .from(chores)
    .where(and(eq(chores.id, choreId), eq(chores.householdId, householdId)));
  return !!chore;
}

export async function choreCommentRoutes(fastify: FastifyInstance) {
  // Get comments for a chore
  fastify.get('/:choreId/comments', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId } = request.params as { householdId: string; choreId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    if (!await verifyChoreInHousehold(choreId, householdId)) {
      return reply.status(404).send({ error: 'Not Found', message: 'Chore not found' });
    }

    const comments = await db
      .select()
      .from(choreComments)
      .where(and(
        eq(choreComments.choreId, choreId),
        isNull(choreComments.deletedAt)
      ))
      .orderBy(desc(choreComments.createdAt));

    return reply.send(comments);
  });

  // Add a comment
  fastify.post('/:choreId/comments', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId } = request.params as { householdId: string; choreId: string };
    const body = addCommentSchema.parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    if (!await verifyChoreInHousehold(choreId, householdId)) {
      return reply.status(404).send({ error: 'Not Found', message: 'Chore not found' });
    }

    const [comment] = await db
      .insert(choreComments)
      .values({
        choreId,
        memberId: membership.id,
        comment: body.comment,
      })
      .returning();

    // Log activity
    await db.insert(choreActivityLog).values({
      choreId,
      memberId: membership.id,
      action: 'commented',
      newValue: { commentId: comment.id },
    });

    const io = fastify.io as Server;
    if (io) {
      emitToHousehold(io, householdId, 'chore:comment:added', {
        choreId,
        comment,
      });
    }

    return reply.status(201).send(comment);
  });

  // Soft-delete a comment
  fastify.delete('/:choreId/comments/:commentId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId, commentId } = request.params as {
      householdId: string;
      choreId: string;
      commentId: string;
    };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const [comment] = await db
      .select()
      .from(choreComments)
      .where(and(
        eq(choreComments.id, commentId),
        eq(choreComments.choreId, choreId)
      ));

    if (!comment) {
      return reply.status(404).send({ error: 'Not Found', message: 'Comment not found' });
    }

    // Only the author or a parent can delete comments
    if (comment.memberId !== membership.id && membership.role !== 'parent') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Cannot delete this comment' });
    }

    await db
      .update(choreComments)
      .set({ deletedAt: new Date() })
      .where(eq(choreComments.id, commentId));

    return reply.status(204).send();
  });
}
