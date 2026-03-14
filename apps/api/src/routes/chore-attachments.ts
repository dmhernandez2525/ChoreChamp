import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../lib/db';
import { choreAttachments, choreActivityLog, chores, members } from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { emitToHousehold } from '../lib/socket';

const addAttachmentSchema = z.object({
  fileName: z.string().min(1).max(500),
  fileUrl: z.string().url(),
  fileSize: z.number().min(0).default(0),
  mimeType: z.string().max(100).optional(),
  isPhotoProof: z.boolean().default(false),
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

export async function choreAttachmentRoutes(fastify: FastifyInstance) {
  // Get attachments for a chore
  fastify.get('/:choreId/attachments', {
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

    const attachments = await db
      .select()
      .from(choreAttachments)
      .where(eq(choreAttachments.choreId, choreId))
      .orderBy(desc(choreAttachments.createdAt));

    return reply.send(attachments);
  });

  // Add an attachment
  fastify.post('/:choreId/attachments', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId } = request.params as { householdId: string; choreId: string };
    const body = addAttachmentSchema.parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    if (!await verifyChoreInHousehold(choreId, householdId)) {
      return reply.status(404).send({ error: 'Not Found', message: 'Chore not found' });
    }

    const [attachment] = await db
      .insert(choreAttachments)
      .values({
        choreId,
        memberId: membership.id,
        fileName: body.fileName,
        fileUrl: body.fileUrl,
        fileSize: body.fileSize,
        mimeType: body.mimeType,
        isPhotoProof: body.isPhotoProof,
      })
      .returning();

    // Log activity
    await db.insert(choreActivityLog).values({
      choreId,
      memberId: membership.id,
      action: 'attachment_added',
      newValue: { attachmentId: attachment.id, fileName: body.fileName },
    });

    emitToHousehold(fastify, householdId, 'chore:attachment:added', {
      choreId,
      attachment,
    });

    return reply.status(201).send(attachment);
  });

  // Delete an attachment
  fastify.delete('/:choreId/attachments/:attachmentId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId, attachmentId } = request.params as {
      householdId: string;
      choreId: string;
      attachmentId: string;
    };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const [attachment] = await db
      .select()
      .from(choreAttachments)
      .where(and(
        eq(choreAttachments.id, attachmentId),
        eq(choreAttachments.choreId, choreId)
      ));

    if (!attachment) {
      return reply.status(404).send({ error: 'Not Found', message: 'Attachment not found' });
    }

    // Only the uploader or a parent can delete
    if (attachment.memberId !== membership.id && membership.role !== 'parent') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Cannot delete this attachment' });
    }

    await db
      .delete(choreAttachments)
      .where(eq(choreAttachments.id, attachmentId));

    return reply.status(204).send();
  });
}
