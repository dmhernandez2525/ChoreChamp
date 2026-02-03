import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '../lib/db';
import { supportThreads, supportMessages, members, households } from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { getEffectiveTierForHousehold, isTierAtLeast } from '../lib/subscription';
import type { SupportPriority, SupportThreadStatus } from '@chorechamp/types';

const createThreadSchema = z.object({
  subject: z.string().min(1).max(150),
  message: z.string().min(1).max(2000),
});

const createMessageSchema = z.object({
  message: z.string().min(1).max(2000),
});

const closeThreadSchema = z.object({
  status: z.enum(['open', 'pending', 'closed']).optional(),
});

async function getMembership(userId: string, householdId: string) {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(eq(members.householdId, householdId), eq(members.userId, userId)));
  return membership || null;
}

async function getSupportTier(householdId: string) {
  const [household] = await db.select().from(households).where(eq(households.id, householdId));
  if (!household) return { effectiveTier: 'free' as const, isPremium: false };
  const effectiveTier = getEffectiveTierForHousehold(household);
  return { effectiveTier, isPremium: isTierAtLeast(effectiveTier, 'premium') };
}

export async function supportRoutes(fastify: FastifyInstance) {
  // List threads
  fastify.get('/support/threads', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await getMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const threads = await db
      .select()
      .from(supportThreads)
      .where(eq(supportThreads.householdId, householdId))
      .orderBy(desc(supportThreads.lastMessageAt));

    return threads;
  });

  // Get thread with messages
  fastify.get('/support/threads/:threadId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, threadId } = request.params as { householdId: string; threadId: string };

    const membership = await getMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const [thread] = await db
      .select()
      .from(supportThreads)
      .where(and(eq(supportThreads.householdId, householdId), eq(supportThreads.id, threadId)));

    if (!thread) {
      return reply.status(404).send({ error: 'Not found', message: 'Thread not found' });
    }

    const messages = await db
      .select()
      .from(supportMessages)
      .where(and(eq(supportMessages.householdId, householdId), eq(supportMessages.threadId, threadId)))
      .orderBy(supportMessages.createdAt);

    return { thread, messages };
  });

  // Create thread
  fastify.post('/support/threads', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = createThreadSchema.parse(request.body);

    const membership = await getMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const { isPremium } = await getSupportTier(householdId);
    const priority: SupportPriority = isPremium ? 'priority' : 'standard';

    const [thread] = await db
      .insert(supportThreads)
      .values({
        householdId,
        createdByMemberId: membership.id,
        subject: body.subject,
        status: 'open',
        priority,
        lastMessageAt: new Date(),
      })
      .returning();

    const [message] = await db
      .insert(supportMessages)
      .values({
        threadId: thread.id,
        householdId,
        senderMemberId: membership.id,
        senderRole: 'member',
        body: body.message,
      })
      .returning();

    await db
      .insert(supportMessages)
      .values({
        threadId: thread.id,
        householdId,
        senderMemberId: null,
        senderRole: 'system',
        body: isPremium
          ? 'Thanks for reaching out. A support specialist will be with you shortly.'
          : 'Thanks for contacting support. We will reply to this request via email.',
      });

    return reply.status(201).send({ thread, message });
  });

  // Add message to thread (premium chat)
  fastify.post('/support/threads/:threadId/messages', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, threadId } = request.params as { householdId: string; threadId: string };
    const body = createMessageSchema.parse(request.body);

    const membership = await getMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const { isPremium } = await getSupportTier(householdId);
    if (!isPremium) {
      return reply.status(403).send({ error: 'Forbidden', message: 'In-app chat is available on Premium.' });
    }

    const [thread] = await db
      .select()
      .from(supportThreads)
      .where(and(eq(supportThreads.householdId, householdId), eq(supportThreads.id, threadId)));

    if (!thread) {
      return reply.status(404).send({ error: 'Not found', message: 'Thread not found' });
    }

    if (thread.status === 'closed') {
      return reply.status(400).send({ error: 'Closed', message: 'This thread is closed.' });
    }

    const [message] = await db
      .insert(supportMessages)
      .values({
        threadId,
        householdId,
        senderMemberId: membership.id,
        senderRole: 'member',
        body: body.message,
      })
      .returning();

    await db
      .update(supportThreads)
      .set({ lastMessageAt: new Date(), status: 'open' })
      .where(eq(supportThreads.id, threadId));

    return reply.status(201).send(message);
  });

  // Update thread status
  fastify.post('/support/threads/:threadId/status', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, threadId } = request.params as { householdId: string; threadId: string };
    const body = closeThreadSchema.parse(request.body);

    const membership = await getMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member' });
    }

    const [thread] = await db
      .select()
      .from(supportThreads)
      .where(and(eq(supportThreads.householdId, householdId), eq(supportThreads.id, threadId)));

    if (!thread) {
      return reply.status(404).send({ error: 'Not found', message: 'Thread not found' });
    }

    const status = (body.status || 'closed') as SupportThreadStatus;

    const [updated] = await db
      .update(supportThreads)
      .set({ status, updatedAt: new Date() })
      .where(eq(supportThreads.id, threadId))
      .returning();

    return updated;
  });
}
