import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { db } from '@chorechamp/database';
import {
  trackedDevices,
  screenTimeLimits,
  screenTimeUsage,
  screenTimeRewards,
  screenTimeExtensionRequests,
  choreScreenTimeRewards,
  members,
} from '@chorechamp/database/schema';
import { DEVICE_CATEGORIES, PLATFORM_CONFIGS } from '@chorechamp/types';

// Zod schemas
const createDeviceSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    'smartphone', 'tablet', 'computer', 'gaming_console', 'smart_tv',
    'streaming_device', 'handheld_gaming', 'vr_headset', 'other',
  ]),
  platform: z.enum([
    'apple_screen_time', 'google_family_link', 'microsoft_family',
    'amazon_parent_dashboard', 'nintendo_parental', 'playstation_family',
    'xbox_family', 'samsung_kids_mode', 'custom_integration', 'manual',
  ]),
  memberId: z.string().uuid(),
  platformDeviceId: z.string().optional(),
  iconUrl: z.string().url().optional(),
});

const updateLimitSchema = z.object({
  dailyLimitMinutes: z.number().min(0).max(1440).optional(),
  weekendLimitMinutes: z.number().min(0).max(1440).nullable().optional(),
  allowedStartTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  allowedEndTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  bedtimeStart: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  bedtimeEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  dayLimits: z.array(z.object({
    day: z.number().min(0).max(6),
    limitMinutes: z.number().min(0).max(1440),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  })).nullable().optional(),
  appLimits: z.array(z.object({
    appId: z.string().nullable(),
    appName: z.string(),
    categoryId: z.string().nullable(),
    categoryName: z.string().nullable(),
    limitMinutes: z.number().min(0).max(1440),
  })).nullable().optional(),
  allowExtensions: z.boolean().optional(),
  pauseOnSchoolDays: z.boolean().optional(),
  requireChoreCompletion: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
});

const recordUsageSchema = z.object({
  memberId: z.string().uuid(),
  minutesUsed: z.number().min(0),
  deviceId: z.string().uuid().optional(),
  deviceName: z.string().optional(),
  appName: z.string().optional(),
  categoryName: z.string().optional(),
});

const requestExtensionSchema = z.object({
  requestedMinutes: z.number().min(5).max(240),
  reason: z.string().max(500).optional(),
});

const respondExtensionSchema = z.object({
  approved: z.boolean(),
  grantedMinutes: z.number().min(0).max(240).optional(),
  responseNote: z.string().max(500).optional(),
});

const createChoreRewardSchema = z.object({
  choreId: z.string().uuid().optional(),
  choreName: z.string().max(100).optional(),
  choreCategory: z.string().max(50).optional(),
  rewardType: z.enum([
    'bonus_minutes', 'extend_bedtime', 'unlock_app',
    'unlock_device', 'weekend_bonus', 'streaming_access',
  ]),
  minutesAmount: z.number().min(1).max(240),
  requirePerfectCompletion: z.boolean().default(false),
  requirePhotoProof: z.boolean().default(false),
  onlyOnWeekdays: z.boolean().default(false),
  maxPerDay: z.number().min(1).optional(),
  maxPerWeek: z.number().min(1).optional(),
});

export async function screenTimeRoutes(fastify: FastifyInstance) {
  // ========================================
  // Configuration Data
  // ========================================

  /**
   * GET /screen-time/device-types - Get device type options
   */
  fastify.get('/screen-time/device-types', async () => {
    return { deviceTypes: DEVICE_CATEGORIES };
  });

  /**
   * GET /screen-time/platforms - Get platform options
   */
  fastify.get('/screen-time/platforms', async () => {
    return { platforms: PLATFORM_CONFIGS };
  });

  // ========================================
  // Device Management
  // ========================================

  /**
   * GET /screen-time/devices - List all tracked devices
   */
  fastify.get<{
    Params: { householdId: string };
    Querystring: { memberId?: string };
  }>('/screen-time/devices', async (request) => {
    const { householdId } = request.params;
    const { memberId } = request.query;

    const conditions = [eq(trackedDevices.householdId, householdId)];
    if (memberId) {
      conditions.push(eq(trackedDevices.memberId, memberId));
    }

    const devices = await db
      .select({
        device: trackedDevices,
        member: {
          id: members.id,
          name: members.name,
        },
      })
      .from(trackedDevices)
      .leftJoin(members, eq(trackedDevices.memberId, members.id))
      .where(and(...conditions))
      .orderBy(desc(trackedDevices.createdAt));

    return {
      devices: devices.map((d) => ({
        ...d.device,
        member: d.member,
      })),
    };
  });

  /**
   * POST /screen-time/devices - Add a tracked device
   */
  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof createDeviceSchema>;
  }>('/screen-time/devices', async (request, reply) => {
    const { householdId } = request.params;
    const data = createDeviceSchema.parse(request.body);

    const [device] = await db
      .insert(trackedDevices)
      .values({
        householdId,
        ...data,
      })
      .returning();

    return reply.status(201).send({ device });
  });

  /**
   * DELETE /screen-time/devices/:deviceId - Remove a device
   */
  fastify.delete<{
    Params: { householdId: string; deviceId: string };
  }>('/screen-time/devices/:deviceId', async (request, reply) => {
    const { householdId, deviceId } = request.params;

    const existing = await db.query.trackedDevices.findFirst({
      where: and(
        eq(trackedDevices.id, deviceId),
        eq(trackedDevices.householdId, householdId)
      ),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Device not found' });
    }

    await db.delete(trackedDevices).where(eq(trackedDevices.id, deviceId));

    return { success: true };
  });

  // ========================================
  // Screen Time Limits
  // ========================================

  /**
   * GET /screen-time/limits/:memberId - Get limits for a member
   */
  fastify.get<{
    Params: { householdId: string; memberId: string };
  }>('/screen-time/limits/:memberId', async (request) => {
    const { householdId, memberId } = request.params;

    let limit = await db.query.screenTimeLimits.findFirst({
      where: and(
        eq(screenTimeLimits.memberId, memberId),
        eq(screenTimeLimits.householdId, householdId)
      ),
    });

    // Create default if not exists
    if (!limit) {
      [limit] = await db
        .insert(screenTimeLimits)
        .values({
          householdId,
          memberId,
          dailyLimitMinutes: 120,
        })
        .returning();
    }

    return { limit };
  });

  /**
   * PATCH /screen-time/limits/:memberId - Update limits
   */
  fastify.patch<{
    Params: { householdId: string; memberId: string };
    Body: z.infer<typeof updateLimitSchema>;
  }>('/screen-time/limits/:memberId', async (request, reply) => {
    const { householdId, memberId } = request.params;
    const data = updateLimitSchema.parse(request.body);

    const existing = await db.query.screenTimeLimits.findFirst({
      where: and(
        eq(screenTimeLimits.memberId, memberId),
        eq(screenTimeLimits.householdId, householdId)
      ),
    });

    if (existing) {
      const [updated] = await db
        .update(screenTimeLimits)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(screenTimeLimits.id, existing.id))
        .returning();

      return { limit: updated };
    } else {
      const [created] = await db
        .insert(screenTimeLimits)
        .values({
          householdId,
          memberId,
          ...data,
        })
        .returning();

      return reply.status(201).send({ limit: created });
    }
  });

  // ========================================
  // Usage Tracking
  // ========================================

  /**
   * GET /screen-time/usage - Get usage records
   */
  fastify.get<{
    Params: { householdId: string };
    Querystring: { memberId?: string; from?: string; to?: string };
  }>('/screen-time/usage', async (request) => {
    const { householdId } = request.params;
    const { memberId, from, to } = request.query;

    const conditions = [eq(screenTimeUsage.householdId, householdId)];
    if (memberId) {
      conditions.push(eq(screenTimeUsage.memberId, memberId));
    }
    if (from) {
      conditions.push(gte(screenTimeUsage.date, from));
    }
    if (to) {
      conditions.push(lte(screenTimeUsage.date, to));
    }

    const usage = await db
      .select()
      .from(screenTimeUsage)
      .where(and(...conditions))
      .orderBy(desc(screenTimeUsage.date));

    return { usage };
  });

  /**
   * POST /screen-time/usage - Record usage
   */
  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof recordUsageSchema>;
  }>('/screen-time/usage', async (request, reply) => {
    const { householdId } = request.params;
    const data = recordUsageSchema.parse(request.body);
    const today = new Date().toISOString().split('T')[0];

    // Get or create today's usage record
    const usage = await db.query.screenTimeUsage.findFirst({
      where: and(
        eq(screenTimeUsage.memberId, data.memberId),
        eq(screenTimeUsage.date, today)
      ),
    });

    // Get member's limit
    const limit = await db.query.screenTimeLimits.findFirst({
      where: eq(screenTimeLimits.memberId, data.memberId),
    });

    const dailyLimit = limit?.dailyLimitMinutes || 120;

    if (usage) {
      const newTotal = usage.totalMinutesUsed + data.minutesUsed;
      const deviceUsage = (usage.deviceUsage || []) as Array<{
        deviceId: string;
        deviceName: string;
        minutesUsed: number;
      }>;
      const appUsage = (usage.appUsage || []) as Array<{
        appId: string | null;
        appName: string;
        categoryName: string | null;
        minutesUsed: number;
      }>;

      // Update device usage
      if (data.deviceId && data.deviceName) {
        const existingDevice = deviceUsage.find((d) => d.deviceId === data.deviceId);
        if (existingDevice) {
          existingDevice.minutesUsed += data.minutesUsed;
        } else {
          deviceUsage.push({
            deviceId: data.deviceId,
            deviceName: data.deviceName,
            minutesUsed: data.minutesUsed,
          });
        }
      }

      // Update app usage
      if (data.appName) {
        const existingApp = appUsage.find((a) => a.appName === data.appName);
        if (existingApp) {
          existingApp.minutesUsed += data.minutesUsed;
        } else {
          appUsage.push({
            appId: null,
            appName: data.appName,
            categoryName: data.categoryName || null,
            minutesUsed: data.minutesUsed,
          });
        }
      }

      const [updated] = await db
        .update(screenTimeUsage)
        .set({
          totalMinutesUsed: newTotal,
          deviceUsage,
          appUsage,
          limitReached: newTotal >= dailyLimit + usage.bonusMinutesEarned,
          lastUpdatedAt: new Date(),
        })
        .where(eq(screenTimeUsage.id, usage.id))
        .returning();

      return { usage: updated };
    } else {
      const deviceUsage = data.deviceId && data.deviceName
        ? [{ deviceId: data.deviceId, deviceName: data.deviceName, minutesUsed: data.minutesUsed }]
        : [];

      const appUsage = data.appName
        ? [{ appId: null, appName: data.appName, categoryName: data.categoryName || null, minutesUsed: data.minutesUsed }]
        : [];

      const [created] = await db
        .insert(screenTimeUsage)
        .values({
          memberId: data.memberId,
          householdId,
          date: today,
          totalMinutesUsed: data.minutesUsed,
          limitMinutes: dailyLimit,
          deviceUsage,
          appUsage,
          limitReached: data.minutesUsed >= dailyLimit,
        })
        .returning();

      return reply.status(201).send({ usage: created });
    }
  });

  /**
   * GET /screen-time/usage/today/:memberId - Get today's usage
   */
  fastify.get<{
    Params: { householdId: string; memberId: string };
  }>('/screen-time/usage/today/:memberId', async (request) => {
    const { householdId, memberId } = request.params;
    const today = new Date().toISOString().split('T')[0];

    const usage = await db.query.screenTimeUsage.findFirst({
      where: and(
        eq(screenTimeUsage.memberId, memberId),
        eq(screenTimeUsage.householdId, householdId),
        eq(screenTimeUsage.date, today)
      ),
    });

    // Get limit
    const limit = await db.query.screenTimeLimits.findFirst({
      where: eq(screenTimeLimits.memberId, memberId),
    });

    // Get unused rewards
    const rewards = await db
      .select()
      .from(screenTimeRewards)
      .where(
        and(
          eq(screenTimeRewards.memberId, memberId),
          eq(screenTimeRewards.isUsed, false)
        )
      );

    const availableBonusMinutes = rewards.reduce(
      (sum, r) => sum + (r.minutesAmount || 0),
      0
    );

    return {
      usage: usage || {
        totalMinutesUsed: 0,
        limitMinutes: limit?.dailyLimitMinutes || 120,
        bonusMinutesEarned: 0,
        bonusMinutesUsed: 0,
        deviceUsage: [],
        appUsage: [],
        limitReached: false,
      },
      limit,
      availableBonusMinutes,
      unusedRewards: rewards,
    };
  });

  // ========================================
  // Rewards
  // ========================================

  /**
   * GET /screen-time/rewards/:memberId - Get rewards for a member
   */
  fastify.get<{
    Params: { householdId: string; memberId: string };
    Querystring: { unused?: string };
  }>('/screen-time/rewards/:memberId', async (request) => {
    const { memberId } = request.params;
    const { unused } = request.query;

    const conditions = [eq(screenTimeRewards.memberId, memberId)];
    if (unused === 'true') {
      conditions.push(eq(screenTimeRewards.isUsed, false));
    }

    const rewards = await db
      .select()
      .from(screenTimeRewards)
      .where(and(...conditions))
      .orderBy(desc(screenTimeRewards.createdAt));

    return { rewards };
  });

  /**
   * POST /screen-time/rewards/:memberId/use/:rewardId - Use a reward
   */
  fastify.post<{
    Params: { householdId: string; memberId: string; rewardId: string };
  }>('/screen-time/rewards/:memberId/use/:rewardId', async (request, reply) => {
    const { memberId, rewardId } = request.params;

    const reward = await db.query.screenTimeRewards.findFirst({
      where: and(
        eq(screenTimeRewards.id, rewardId),
        eq(screenTimeRewards.memberId, memberId),
        eq(screenTimeRewards.isUsed, false)
      ),
    });

    if (!reward) {
      return reply.status(404).send({ error: 'Reward not found or already used' });
    }

    // Check expiration
    if (reward.expiresAt && new Date(reward.expiresAt) < new Date()) {
      return reply.status(400).send({ error: 'Reward has expired' });
    }

    // Mark as used
    const [updated] = await db
      .update(screenTimeRewards)
      .set({
        isUsed: true,
        usedAt: new Date(),
      })
      .where(eq(screenTimeRewards.id, rewardId))
      .returning();

    // Add to today's bonus
    const today = new Date().toISOString().split('T')[0];
    const usage = await db.query.screenTimeUsage.findFirst({
      where: and(
        eq(screenTimeUsage.memberId, memberId),
        eq(screenTimeUsage.date, today)
      ),
    });

    if (usage && reward.minutesAmount) {
      await db
        .update(screenTimeUsage)
        .set({
          bonusMinutesUsed: sql`${screenTimeUsage.bonusMinutesUsed} + ${reward.minutesAmount}`,
        })
        .where(eq(screenTimeUsage.id, usage.id));
    }

    return { reward: updated };
  });

  // ========================================
  // Extension Requests
  // ========================================

  /**
   * GET /screen-time/extensions - Get extension requests
   */
  fastify.get<{
    Params: { householdId: string };
    Querystring: { status?: string; memberId?: string };
  }>('/screen-time/extensions', async (request) => {
    const { householdId } = request.params;
    const { status, memberId } = request.query;

    const conditions = [eq(screenTimeExtensionRequests.householdId, householdId)];
    if (status) {
      conditions.push(eq(screenTimeExtensionRequests.status, status));
    }
    if (memberId) {
      conditions.push(eq(screenTimeExtensionRequests.memberId, memberId));
    }

    const requests = await db
      .select({
        request: screenTimeExtensionRequests,
        member: {
          id: members.id,
          name: members.name,
        },
      })
      .from(screenTimeExtensionRequests)
      .leftJoin(members, eq(screenTimeExtensionRequests.memberId, members.id))
      .where(and(...conditions))
      .orderBy(desc(screenTimeExtensionRequests.requestedAt));

    return {
      requests: requests.map((r) => ({
        ...r.request,
        member: r.member,
      })),
    };
  });

  /**
   * POST /screen-time/extensions - Request an extension
   */
  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof requestExtensionSchema>;
  }>('/screen-time/extensions', async (request, reply) => {
    const { householdId } = request.params;
    const memberId = request.headers['x-member-id'] as string;
    const data = requestExtensionSchema.parse(request.body);

    if (!memberId) {
      return reply.status(400).send({ error: 'Member ID required' });
    }

    const [extensionRequest] = await db
      .insert(screenTimeExtensionRequests)
      .values({
        householdId,
        memberId,
        requestedMinutes: data.requestedMinutes,
        reason: data.reason,
      })
      .returning();

    return reply.status(201).send({ request: extensionRequest });
  });

  /**
   * POST /screen-time/extensions/:requestId/respond - Respond to request
   */
  fastify.post<{
    Params: { householdId: string; requestId: string };
    Body: z.infer<typeof respondExtensionSchema>;
  }>('/screen-time/extensions/:requestId/respond', async (request, reply) => {
    const { householdId, requestId } = request.params;
    const responderId = request.headers['x-member-id'] as string;
    const data = respondExtensionSchema.parse(request.body);

    const existing = await db.query.screenTimeExtensionRequests.findFirst({
      where: and(
        eq(screenTimeExtensionRequests.id, requestId),
        eq(screenTimeExtensionRequests.householdId, householdId),
        eq(screenTimeExtensionRequests.status, 'pending')
      ),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Request not found or already responded' });
    }

    const [updated] = await db
      .update(screenTimeExtensionRequests)
      .set({
        status: data.approved ? 'approved' : 'denied',
        respondedBy: responderId,
        respondedAt: new Date(),
        responseNote: data.responseNote,
        grantedMinutes: data.approved ? (data.grantedMinutes || existing.requestedMinutes) : null,
      })
      .where(eq(screenTimeExtensionRequests.id, requestId))
      .returning();

    // If approved, create a reward
    if (data.approved && updated.grantedMinutes) {
      await db.insert(screenTimeRewards).values({
        memberId: existing.memberId,
        householdId,
        rewardType: 'bonus_minutes',
        minutesAmount: updated.grantedMinutes,
        description: `Extension request approved: +${updated.grantedMinutes} minutes`,
        earnedFrom: 'parent_grant',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24h
      });
    }

    return { request: updated };
  });

  // ========================================
  // Chore Rewards Configuration
  // ========================================

  /**
   * GET /screen-time/chore-rewards - Get chore reward configurations
   */
  fastify.get<{
    Params: { householdId: string };
  }>('/screen-time/chore-rewards', async (request) => {
    const { householdId } = request.params;

    const rewards = await db
      .select()
      .from(choreScreenTimeRewards)
      .where(eq(choreScreenTimeRewards.householdId, householdId))
      .orderBy(choreScreenTimeRewards.choreName);

    return { rewards };
  });

  /**
   * POST /screen-time/chore-rewards - Create chore reward config
   */
  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof createChoreRewardSchema>;
  }>('/screen-time/chore-rewards', async (request, reply) => {
    const { householdId } = request.params;
    const data = createChoreRewardSchema.parse(request.body);

    const [reward] = await db
      .insert(choreScreenTimeRewards)
      .values({
        householdId,
        ...data,
      })
      .returning();

    return reply.status(201).send({ reward });
  });

  /**
   * DELETE /screen-time/chore-rewards/:rewardId - Delete chore reward
   */
  fastify.delete<{
    Params: { householdId: string; rewardId: string };
  }>('/screen-time/chore-rewards/:rewardId', async (request, reply) => {
    const { householdId, rewardId } = request.params;

    const existing = await db.query.choreScreenTimeRewards.findFirst({
      where: and(
        eq(choreScreenTimeRewards.id, rewardId),
        eq(choreScreenTimeRewards.householdId, householdId)
      ),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Reward configuration not found' });
    }

    await db.delete(choreScreenTimeRewards).where(eq(choreScreenTimeRewards.id, rewardId));

    return { success: true };
  });

  // ========================================
  // Analytics
  // ========================================

  /**
   * GET /screen-time/analytics/:memberId - Get analytics for a member
   */
  fastify.get<{
    Params: { householdId: string; memberId: string };
    Querystring: { period?: string };
  }>('/screen-time/analytics/:memberId', async (request) => {
    const { householdId, memberId } = request.params;
    const period = (request.query.period as 'week' | 'month') || 'week';

    const days = period === 'month' ? 30 : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const usage = await db
      .select()
      .from(screenTimeUsage)
      .where(
        and(
          eq(screenTimeUsage.memberId, memberId),
          eq(screenTimeUsage.householdId, householdId),
          gte(screenTimeUsage.date, since)
        )
      )
      .orderBy(screenTimeUsage.date);

    const totalMinutesUsed = usage.reduce((sum, u) => sum + u.totalMinutesUsed, 0);
    const totalLimitMinutes = usage.reduce((sum, u) => sum + u.limitMinutes, 0);
    const totalBonusEarned = usage.reduce((sum, u) => sum + u.bonusMinutesEarned, 0);
    const averageDailyUsage = usage.length > 0 ? totalMinutesUsed / usage.length : 0;

    // Aggregate by device
    const deviceTotals: Record<string, { name: string; minutes: number }> = {};
    for (const day of usage) {
      for (const device of (day.deviceUsage || []) as Array<{ deviceId: string; deviceName: string; minutesUsed: number }>) {
        if (!deviceTotals[device.deviceId]) {
          deviceTotals[device.deviceId] = { name: device.deviceName, minutes: 0 };
        }
        deviceTotals[device.deviceId].minutes += device.minutesUsed;
      }
    }

    // Aggregate by category
    const categoryTotals: Record<string, number> = {};
    for (const day of usage) {
      for (const app of (day.appUsage || []) as Array<{ categoryName: string | null; minutesUsed: number }>) {
        const category = app.categoryName || 'Other';
        categoryTotals[category] = (categoryTotals[category] || 0) + app.minutesUsed;
      }
    }

    const daysUnderLimit = usage.filter((u) => !u.limitReached).length;
    const daysOverLimit = usage.filter((u) => u.limitReached).length;

    return {
      analytics: {
        memberId,
        period,
        totalMinutesUsed,
        totalLimitMinutes,
        totalBonusEarned,
        averageDailyUsage: Math.round(averageDailyUsage),
        usageTrend: 'stable' as const,
        comparedToPrevious: 0,
        byDevice: Object.entries(deviceTotals).map(([deviceId, data]) => ({
          deviceId,
          deviceName: data.name,
          deviceType: 'other' as const,
          totalMinutes: data.minutes,
          percentageOfTotal: totalMinutesUsed > 0 ? Math.round((data.minutes / totalMinutesUsed) * 100) : 0,
        })),
        byCategory: Object.entries(categoryTotals).map(([category, minutes]) => ({
          category,
          totalMinutes: minutes,
          percentageOfTotal: totalMinutesUsed > 0 ? Math.round((minutes / totalMinutesUsed) * 100) : 0,
        })),
        choresCompleted: 0,
        bonusMinutesEarned: totalBonusEarned,
        bonusMinutesUsed: usage.reduce((sum, u) => sum + u.bonusMinutesUsed, 0),
        daysUnderLimit,
        daysOverLimit,
        averageOverageMinutes: 0,
      },
    };
  });

  /**
   * GET /screen-time/overview - Get household overview
   */
  fastify.get<{
    Params: { householdId: string };
  }>('/screen-time/overview', async (request) => {
    const { householdId } = request.params;
    const today = new Date().toISOString().split('T')[0];

    // Get all members with usage today
    const todayUsage = await db
      .select({
        usage: screenTimeUsage,
        member: {
          id: members.id,
          name: members.name,
        },
      })
      .from(screenTimeUsage)
      .leftJoin(members, eq(screenTimeUsage.memberId, members.id))
      .where(
        and(
          eq(screenTimeUsage.householdId, householdId),
          eq(screenTimeUsage.date, today)
        )
      );

    // Get pending extension requests
    const pendingRequests = await db
      .select()
      .from(screenTimeExtensionRequests)
      .where(
        and(
          eq(screenTimeExtensionRequests.householdId, householdId),
          eq(screenTimeExtensionRequests.status, 'pending')
        )
      );

    // Get all devices
    const devices = await db
      .select()
      .from(trackedDevices)
      .where(eq(trackedDevices.householdId, householdId));

    return {
      overview: {
        todayUsage: todayUsage.map((u) => ({
          ...u.usage,
          member: u.member,
        })),
        pendingExtensionRequests: pendingRequests.length,
        totalDevices: devices.length,
        connectedDevices: devices.filter((d) => d.isConnected).length,
      },
    };
  });
}
