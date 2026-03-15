import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership } from '../lib/membership';

export async function communicationCalendarRoutes(fastify: FastifyInstance) {
  // F18.1 Calendar Sync

  // GET /calendar/connections - List calendar connections
  fastify.get('/calendar/connections', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.send({ connections: [], householdId });
  });

  // POST /calendar/connections - Create a calendar connection
  fastify.post('/calendar/connections', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = z
      .object({
        provider: z.enum(['google', 'apple', 'outlook', 'ical']),
        calendarId: z.string().min(1),
        calendarName: z.string().min(1),
        syncDirection: z.enum(['push', 'pull', 'bidirectional']),
        accessToken: z.string().min(1),
        refreshToken: z.string().optional(),
      })
      .parse(request.body);

    return reply.status(201).send({
      id: 'conn-1',
      ...body,
      status: 'active',
      lastSyncAt: null,
      syncErrors: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  // DELETE /calendar/connections/:connectionId - Remove a calendar connection
  fastify.delete('/calendar/connections/:connectionId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.status(204).send();
  });

  // POST /calendar/connections/:connectionId/sync - Trigger manual sync
  fastify.post('/calendar/connections/:connectionId/sync', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, connectionId } = request.params as { householdId: string; connectionId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.send({
      connectionId,
      status: 'active',
      lastSyncAt: new Date().toISOString(),
      syncedEvents: 0,
    });
  });

  // GET /calendar/events - List synced calendar events
  fastify.get('/calendar/events', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.send({ events: [], total: 0 });
  });

  // GET /calendar/config - Get calendar sync config
  fastify.get('/calendar/config', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.send({
      id: 'cal-config-1',
      householdId,
      includeChoreDetails: true,
      includeAssignee: true,
      includePoints: false,
      reminderMinutes: 30,
      colorCode: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  // PUT /calendar/config - Update calendar sync config
  fastify.put('/calendar/config', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = z
      .object({
        includeChoreDetails: z.boolean().optional(),
        includeAssignee: z.boolean().optional(),
        includePoints: z.boolean().optional(),
        reminderMinutes: z.number().min(0).max(1440).optional(),
        colorCode: z.string().nullable().optional(),
      })
      .parse(request.body);

    return reply.send({ id: 'cal-config-1', ...body, updatedAt: new Date().toISOString() });
  });

  // F18.2 Family Chat/Messaging

  // GET /chat/channels - List chat channels
  fastify.get('/chat/channels', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.send({ channels: [], total: 0 });
  });

  // POST /chat/channels - Create a chat channel
  fastify.post('/chat/channels', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = z
      .object({
        name: z.string().min(1).max(100),
        type: z.enum(['household', 'direct', 'chore_discussion']),
        participantIds: z.array(z.string()),
        choreId: z.string().optional(),
      })
      .parse(request.body);

    return reply.status(201).send({
      id: 'channel-1',
      ...body,
      lastMessageAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  // GET /chat/channels/:channelId/messages - Get messages for a channel
  fastify.get('/chat/channels/:channelId/messages', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.send({ messages: [], total: 0 });
  });

  // POST /chat/channels/:channelId/messages - Send a message
  fastify.post('/chat/channels/:channelId/messages', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, channelId } = request.params as { householdId: string; channelId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = z
      .object({
        content: z.string().min(1).max(2000),
        type: z.enum(['text', 'image', 'chore_share', 'achievement', 'system']),
        imageUrl: z.string().optional(),
        referenceId: z.string().optional(),
      })
      .parse(request.body);

    return reply.status(201).send({
      id: 'msg-1',
      channelId,
      ...body,
      senderId: 'current-user',
      senderName: 'User',
      isEdited: false,
      readBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  // PUT /chat/channels/:channelId/messages/:messageId - Edit a message
  fastify.put('/chat/channels/:channelId/messages/:messageId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, messageId } = request.params as { householdId: string; messageId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = z.object({ content: z.string().min(1).max(2000) }).parse(request.body);

    return reply.send({ id: messageId, content: body.content, isEdited: true, updatedAt: new Date().toISOString() });
  });

  // DELETE /chat/channels/:channelId/messages/:messageId - Delete a message
  fastify.delete('/chat/channels/:channelId/messages/:messageId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.status(204).send();
  });

  // POST /chat/channels/:channelId/read - Mark channel as read
  fastify.post('/chat/channels/:channelId/read', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, channelId } = request.params as { householdId: string; channelId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.send({ channelId, readAt: new Date().toISOString() });
  });

  // GET /chat/unread - Get unread message counts
  fastify.get('/chat/unread', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.send({ unread: [], totalUnread: 0 });
  });

  // F18.3 Family Photo Album

  // GET /albums - List photo albums
  fastify.get('/albums', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.send({ albums: [], total: 0 });
  });

  // POST /albums - Create a photo album
  fastify.post('/albums', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = z
      .object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        type: z.enum(['chore_completions', 'achievements', 'milestones', 'general', 'auto_generated']),
      })
      .parse(request.body);

    return reply.status(201).send({
      id: 'album-1',
      ...body,
      coverPhotoUrl: null,
      photoCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  // GET /albums/:albumId - Get album with photos
  fastify.get('/albums/:albumId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, albumId } = request.params as { householdId: string; albumId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.send({ album: { id: albumId, name: 'Album', photos: [] }, total: 0 });
  });

  // POST /albums/:albumId/photos - Upload a photo to an album
  fastify.post('/albums/:albumId/photos', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, albumId } = request.params as { householdId: string; albumId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = z
      .object({
        url: z.string().min(1),
        thumbnailUrl: z.string().min(1),
        caption: z.string().optional(),
        choreId: z.string().optional(),
        takenAt: z.string().optional(),
      })
      .parse(request.body);

    return reply.status(201).send({
      id: 'photo-1',
      albumId,
      ...body,
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
    });
  });

  // POST /albums/:albumId/photos/:photoId/like - Like a photo
  fastify.post('/albums/:albumId/photos/:photoId/like', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, photoId } = request.params as { householdId: string; photoId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.send({ photoId, liked: true });
  });

  // DELETE /albums/:albumId/photos/:photoId - Delete a photo
  fastify.delete('/albums/:albumId/photos/:photoId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.status(204).send();
  });

  // DELETE /albums/:albumId - Delete an album
  fastify.delete('/albums/:albumId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.status(204).send();
  });

  // F18.4 Shareable Achievements

  // GET /achievements/shareable - List shareable achievements
  fastify.get('/achievements/shareable', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.send({ achievements: [], total: 0 });
  });

  // POST /achievements/shareable - Create a shareable achievement card
  fastify.post('/achievements/shareable', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = z
      .object({
        achievementType: z.string().min(1),
        title: z.string().min(1).max(100),
        description: z.string().min(1).max(500),
        cardStyle: z.enum(['minimal', 'colorful', 'animated', 'classic']),
        imageUrl: z.string().optional(),
        expiresInDays: z.number().min(1).max(365).optional(),
      })
      .parse(request.body);

    return reply.status(201).send({
      id: 'share-ach-1',
      ...body,
      shareUrl: `https://chorechamp.com/share/share-ach-1`,
      viewCount: 0,
      shareCount: 0,
      createdAt: new Date().toISOString(),
      expiresAt: body.expiresInDays
        ? new Date(Date.now() + body.expiresInDays * 86400000).toISOString()
        : null,
    });
  });

  // POST /achievements/shareable/:achievementId/share - Record a share action
  fastify.post('/achievements/shareable/:achievementId/share', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, achievementId } = request.params as { householdId: string; achievementId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = z
      .object({ platform: z.enum(['facebook', 'twitter', 'instagram', 'whatsapp', 'link', 'email']) })
      .parse(request.body);

    return reply.send({ achievementId, platform: body.platform, sharedAt: new Date().toISOString() });
  });

  // GET /achievements/share-settings - Get share settings
  fastify.get('/achievements/share-settings', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.send({
      id: 'share-settings-1',
      householdId,
      enableSharing: true,
      defaultCardStyle: 'colorful',
      includeHouseholdName: false,
      includeMemberAvatar: true,
      autoShareBadges: false,
      autoShareStreakMilestones: false,
      parentApprovalRequired: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  // PUT /achievements/share-settings - Update share settings
  fastify.put('/achievements/share-settings', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = z
      .object({
        enableSharing: z.boolean().optional(),
        defaultCardStyle: z.enum(['minimal', 'colorful', 'animated', 'classic']).optional(),
        includeHouseholdName: z.boolean().optional(),
        includeMemberAvatar: z.boolean().optional(),
        autoShareBadges: z.boolean().optional(),
        autoShareStreakMilestones: z.boolean().optional(),
        parentApprovalRequired: z.boolean().optional(),
      })
      .parse(request.body);

    return reply.send({ id: 'share-settings-1', ...body, updatedAt: new Date().toISOString() });
  });

  // F18.5 Progressive Unlocks

  // GET /unlocks - List all progressive unlocks
  fastify.get('/unlocks', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.send({ unlocks: [], total: 0 });
  });

  // GET /unlocks/progress - Get member's unlock progress
  fastify.get('/unlocks/progress', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.send({
      totalUnlocks: 0,
      unlockedCount: 0,
      nextUnlock: null,
      nextUnlockProgress: 0,
      recentlyUnlocked: [],
    });
  });

  // GET /unlocks/progress/:memberId - Get specific member's unlock progress
  fastify.get('/unlocks/progress/:memberId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.send({
      memberId,
      totalUnlocks: 0,
      unlockedCount: 0,
      nextUnlock: null,
      nextUnlockProgress: 0,
      recentlyUnlocked: [],
    });
  });

  // POST /unlocks/:unlockId/notify - Mark unlock notification as seen
  fastify.post('/unlocks/:unlockId/notify', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, unlockId } = request.params as { householdId: string; unlockId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return reply.send({ unlockId, notifiedAt: new Date().toISOString() });
  });
}
