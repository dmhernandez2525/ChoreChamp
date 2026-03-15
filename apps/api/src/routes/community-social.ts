import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership } from '../lib/membership';

const forumCategoryValues = [
  'general', 'tips', 'questions', 'showcase', 'feedback', 'off_topic',
] as const;

const challengeTypeValues = ['competitive', 'collaborative', 'milestone'] as const;

const shareTypeValues = [
  'achievement', 'milestone', 'streak', 'badge', 'challenge_win', 'custom',
] as const;

const visibilityValues = ['public', 'friends', 'private'] as const;

const eventTypeValues = [
  'cleanup', 'fundraiser', 'competition', 'workshop', 'social', 'other',
] as const;

const connectionStatusValues = ['accepted', 'declined'] as const;

// ===== Community Forums (F16.1) =====

const createForumPostSchema = z.object({
  category: z.enum(forumCategoryValues),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  tags: z.array(z.string()).optional().nullable(),
});

const createForumReplySchema = z.object({
  content: z.string().min(1).max(2000),
  parentReplyId: z.string().uuid().optional().nullable(),
});

// ===== Social Challenges (F16.2) =====

const createSocialChallengeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  challengeType: z.enum(challengeTypeValues),
  targetValue: z.number().int().min(1),
  metric: z.string().min(1).max(64),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

const updateChallengeProgressSchema = z.object({
  value: z.number().int().min(0),
});

// ===== Social Sharing (F16.3) =====

const createSocialPostSchema = z.object({
  shareType: z.enum(shareTypeValues),
  visibility: z.enum(visibilityValues),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
});

const createCommentSchema = z.object({
  content: z.string().min(1).max(500),
});

// ===== Friend System (F16.4) =====

const createFriendRequestSchema = z.object({
  recipientHouseholdId: z.string().uuid(),
  message: z.string().min(1).max(500).optional().nullable(),
});

const respondToFriendRequestSchema = z.object({
  status: z.enum(connectionStatusValues),
});

// ===== Community Events (F16.5) =====

const createCommunityEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  eventType: z.enum(eventTypeValues),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  location: z.string().min(1).max(500).optional().nullable(),
  isVirtual: z.boolean().optional().nullable(),
  maxParticipants: z.number().int().min(1).optional().nullable(),
});

export async function communitySocialRoutes(fastify: FastifyInstance) {

  // ===== F16.1: Community Forums =====

  fastify.get('/forums/posts', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { category, limit, offset } = request.query as Record<string, string | undefined>;
    return {
      posts: [],
      total: 0,
      filters: { category, limit, offset },
    };
  });

  fastify.post('/forums/posts', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = createForumPostSchema.parse(request.body);
    return reply.status(201).send({
      id: crypto.randomUUID(),
      ...body,
      tags: body.tags ?? [],
      likeCount: 0,
      replyCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  fastify.get('/forums/posts/:postId', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string; postId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { postId } = request.params as { postId: string };
    return {
      post: {
        id: postId,
        category: 'general',
        title: 'Sample Post',
        content: 'Post content',
        tags: [],
        likeCount: 0,
        replyCount: 0,
        createdAt: new Date().toISOString(),
      },
      replies: [],
    };
  });

  fastify.post('/forums/posts/:postId/replies', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string; postId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { postId } = request.params as { postId: string };
    const body = createForumReplySchema.parse(request.body);
    return reply.status(201).send({
      id: crypto.randomUUID(),
      postId,
      ...body,
      parentReplyId: body.parentReplyId ?? null,
      likeCount: 0,
      createdAt: new Date().toISOString(),
    });
  });

  fastify.post('/forums/posts/:postId/like', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string; postId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { postId } = request.params as { postId: string };
    return {
      postId,
      liked: true,
      likeCount: 1,
    };
  });

  fastify.delete('/forums/posts/:postId', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.status(204).send();
  });

  // ===== F16.2: Social Challenges =====

  fastify.get('/social-challenges', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { status } = request.query as Record<string, string | undefined>;
    return {
      challenges: [],
      total: 0,
      filters: { status },
    };
  });

  fastify.post('/social-challenges', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = createSocialChallengeSchema.parse(request.body);
    return reply.status(201).send({
      id: crypto.randomUUID(),
      ...body,
      participantCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  fastify.get('/social-challenges/:challengeId', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string; challengeId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { challengeId } = request.params as { challengeId: string };
    return {
      challenge: {
        id: challengeId,
        title: 'Sample Challenge',
        description: 'Challenge description',
        challengeType: 'competitive',
        targetValue: 100,
        metric: 'points',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        participantCount: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      },
      participants: [],
    };
  });

  fastify.post('/social-challenges/:challengeId/join', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string; challengeId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { challengeId } = request.params as { challengeId: string };
    return {
      challengeId,
      success: true,
    };
  });

  fastify.post('/social-challenges/:challengeId/progress', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string; challengeId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { challengeId } = request.params as { challengeId: string };
    const body = updateChallengeProgressSchema.parse(request.body);
    return {
      challengeId,
      currentValue: body.value,
      rank: 1,
      updatedAt: new Date().toISOString(),
    };
  });

  // ===== F16.3: Social Sharing =====

  fastify.get('/social/feed', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { visibility, limit, offset } = request.query as Record<string, string | undefined>;
    return {
      posts: [],
      total: 0,
      filters: { visibility, limit, offset },
    };
  });

  fastify.post('/social/posts', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = createSocialPostSchema.parse(request.body);
    return reply.status(201).send({
      id: crypto.randomUUID(),
      ...body,
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  fastify.get('/social/posts/:postId', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string; postId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { postId } = request.params as { postId: string };
    return {
      post: {
        id: postId,
        shareType: 'achievement',
        visibility: 'public',
        title: 'Sample Post',
        content: 'Post content',
        likeCount: 0,
        commentCount: 0,
        createdAt: new Date().toISOString(),
      },
      comments: [],
    };
  });

  fastify.post('/social/posts/:postId/comments', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string; postId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { postId } = request.params as { postId: string };
    const body = createCommentSchema.parse(request.body);
    return reply.status(201).send({
      id: crypto.randomUUID(),
      postId,
      ...body,
      createdAt: new Date().toISOString(),
    });
  });

  fastify.post('/social/posts/:postId/like', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string; postId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { postId } = request.params as { postId: string };
    return {
      postId,
      liked: true,
      likeCount: 1,
    };
  });

  fastify.delete('/social/posts/:postId', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.status(204).send();
  });

  // ===== F16.4: Friend System =====

  fastify.get('/friends', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return {
      friends: [],
      pending: [],
      total: 0,
    };
  });

  fastify.post('/friends/request', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = createFriendRequestSchema.parse(request.body);
    return reply.status(201).send({
      id: crypto.randomUUID(),
      ...body,
      message: body.message ?? null,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  });

  fastify.patch('/friends/:connectionId/respond', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string; connectionId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { connectionId } = request.params as { connectionId: string };
    const body = respondToFriendRequestSchema.parse(request.body);
    return {
      id: connectionId,
      status: body.status,
      updatedAt: new Date().toISOString(),
    };
  });

  fastify.delete('/friends/:connectionId', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.status(204).send();
  });

  fastify.get('/friends/suggestions', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return {
      suggestions: [],
    };
  });

  // ===== F16.5: Community Events =====

  fastify.get('/community-events', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { status, eventType } = request.query as Record<string, string | undefined>;
    return {
      events: [],
      total: 0,
      filters: { status, eventType },
    };
  });

  fastify.post('/community-events', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = createCommunityEventSchema.parse(request.body);
    return reply.status(201).send({
      id: crypto.randomUUID(),
      ...body,
      location: body.location ?? null,
      isVirtual: body.isVirtual ?? false,
      maxParticipants: body.maxParticipants ?? null,
      participantCount: 0,
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  fastify.get('/community-events/:eventId', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string; eventId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { eventId } = request.params as { eventId: string };
    return {
      event: {
        id: eventId,
        title: 'Sample Event',
        description: 'Event description',
        eventType: 'social',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        location: null,
        isVirtual: false,
        maxParticipants: null,
        participantCount: 0,
        status: 'upcoming',
        createdAt: new Date().toISOString(),
      },
      participants: [],
    };
  });

  fastify.post('/community-events/:eventId/join', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string; eventId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { eventId } = request.params as { eventId: string };
    return {
      eventId,
      success: true,
    };
  });

  fastify.patch('/community-events/:eventId', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string; eventId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { eventId } = request.params as { eventId: string };
    const body = request.body as Record<string, unknown>;
    return {
      id: eventId,
      ...body,
      updatedAt: new Date().toISOString(),
    };
  });

  fastify.delete('/community-events/:eventId', async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.status(204).send();
  });
}
