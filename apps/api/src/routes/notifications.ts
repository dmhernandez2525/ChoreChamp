import { FastifyInstance } from 'fastify';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../lib/db';
import {
  deviceTokens,
  notificationPreferences,
  notificationLog,
} from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

// Pagination constants
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

export async function notificationRoutes(fastify: FastifyInstance) {
  // Register push token
  fastify.post('/push-token', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { token, platform, deviceName } = request.body as {
      token: string;
      platform: 'ios' | 'android' | 'web';
      deviceName?: string;
    };

    if (!token || !platform) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Token and platform are required',
      });
    }

    // Check if token already exists
    const [existing] = await db
      .select()
      .from(deviceTokens)
      .where(eq(deviceTokens.token, token));

    if (existing) {
      // Update existing token
      await db
        .update(deviceTokens)
        .set({
          userId: user.id,
          platform,
          deviceName,
          isActive: true,
          lastUsedAt: new Date(),
        })
        .where(eq(deviceTokens.token, token));
    } else {
      // Insert new token
      await db.insert(deviceTokens).values({
        userId: user.id,
        token,
        platform,
        deviceName,
        isActive: true,
      });
    }

    return reply.send({ success: true });
  });

  // Unregister push token
  fastify.delete('/push-token', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { token } = request.body as { token: string };

    if (!token) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Token is required',
      });
    }

    await db
      .update(deviceTokens)
      .set({ isActive: false })
      .where(and(
        eq(deviceTokens.token, token),
        eq(deviceTokens.userId, user.id)
      ));

    return reply.send({ success: true });
  });

  // Get notification preferences
  fastify.get('/preferences', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;

    let [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, user.id));

    // Create default preferences if none exist
    if (!prefs) {
      const [newPrefs] = await db
        .insert(notificationPreferences)
        .values({ userId: user.id })
        .returning();
      prefs = newPrefs;
    }

    return reply.send(prefs);
  });

  // Update notification preferences
  fastify.patch('/preferences', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const updates = request.body as Partial<{
      pushEnabled: boolean;
      choreReminders: boolean;
      streakReminders: boolean;
      approvalRequests: boolean;
      familyUpdates: boolean;
      celebrations: boolean;
      weeklySummary: boolean;
      quietHoursEnabled: boolean;
      quietHoursStart: string;
      quietHoursEnd: string;
      maxDailyNotifications: number;
    }>;

    // Ensure preferences exist
    const [existing] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, user.id));

    if (!existing) {
      await db.insert(notificationPreferences).values({ userId: user.id });
    }

    // Update preferences
    const [updatedPrefs] = await db
      .update(notificationPreferences)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(notificationPreferences.userId, user.id))
      .returning();

    return reply.send(updatedPrefs);
  });

  // Get notification history
  fastify.get('/history', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    try {
      const { user } = request as AuthenticatedRequest;
      const queryParams = request.query as { limit?: string; offset?: string };

      // Validate pagination
      const limitNum = Math.min(
        Math.max(1, parseInt(queryParams.limit || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
        MAX_LIMIT
      );
      const offsetNum = Math.max(0, parseInt(queryParams.offset || '0', 10) || 0);

      const notifications = await db
        .select()
        .from(notificationLog)
        .where(eq(notificationLog.userId, user.id))
        .orderBy(desc(notificationLog.createdAt))
        .limit(limitNum)
        .offset(offsetNum);

      return reply.send({
        notifications,
        limit: limitNum,
        offset: offsetNum,
      });
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch notification history');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch notification history',
      });
    }
  });

  // Mark notification as clicked (for analytics)
  fastify.post('/clicked/:notificationId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { notificationId } = request.params as { notificationId: string };

    await db
      .update(notificationLog)
      .set({
        status: 'clicked',
        clickedAt: new Date(),
      })
      .where(and(
        eq(notificationLog.id, notificationId),
        eq(notificationLog.userId, user.id)
      ));

    return reply.send({ success: true });
  });

  // Test notification (development only)
  if (process.env.NODE_ENV !== 'production') {
    fastify.post('/test', {
      preHandler: [requireAuth],
    }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { sendNotification } = await import('../services/push-notifications');

      const result = await sendNotification({
        userId: user.id,
        type: 'chore_reminder',
        title: 'Test Notification',
        body: 'This is a test notification from ChoreChamp!',
        data: { test: true },
      });

      return reply.send({ success: result });
    });
  }
}
