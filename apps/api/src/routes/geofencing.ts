import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { db } from '@chorechamp/database';
import {
  geofences,
  geofenceEvents,
  memberLocations,
  locationHistory,
  geofenceAutomations,
  awayModeConfigs,
  locationSettings,
  members,
} from '@chorechamp/database/schema';
import { GEOFENCE_PRESETS } from '@chorechamp/types';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership } from '../lib/membership';

// Helper to calculate distance between two GPS coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check if point is within geofence
function isWithinGeofence(
  lat: number,
  lon: number,
  geofenceLat: number,
  geofenceLon: number,
  radiusMeters: number
): boolean {
  return calculateDistance(lat, lon, geofenceLat, geofenceLon) <= radiusMeters;
}

// Zod schemas
const createGeofenceSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['home', 'school', 'work', 'relative', 'activity', 'friend', 'store', 'custom']),
  description: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().min(10).max(10000),
  address: z.string().max(500).optional(),
  notifyOnEntry: z.boolean().default(false),
  notifyOnExit: z.boolean().default(true),
  dwellTimeMinutes: z.number().min(1).max(1440).optional(),
  linkedZoneName: z.string().max(100).optional(),
  linkedChoreIds: z.array(z.string().uuid()).optional(),
  activeForMemberIds: z.array(z.string().uuid()).optional(),
  activeHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  activeHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  activeDays: z.array(z.number().min(0).max(6)).optional(),
});

const updateGeofenceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  isEnabled: z.boolean().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusMeters: z.number().min(10).max(10000).optional(),
  address: z.string().max(500).nullable().optional(),
  notifyOnEntry: z.boolean().optional(),
  notifyOnExit: z.boolean().optional(),
  dwellTimeMinutes: z.number().min(1).max(1440).nullable().optional(),
  linkedZoneName: z.string().max(100).nullable().optional(),
  linkedChoreIds: z.array(z.string().uuid()).nullable().optional(),
  activeForMemberIds: z.array(z.string().uuid()).nullable().optional(),
  activeHoursStart: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  activeHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  activeDays: z.array(z.number().min(0).max(6)).nullable().optional(),
});

const reportLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0),
  altitude: z.number().optional(),
  speed: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
  deviceId: z.string().optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
});

const reportGeofenceEventSchema = z.object({
  geofenceId: z.string().uuid(),
  eventType: z.enum(['enter', 'exit', 'dwell']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0),
  deviceId: z.string().optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
});

const createAutomationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  geofenceId: z.string().uuid(),
  triggerType: z.enum(['enter', 'exit', 'dwell']),
  triggerMemberIds: z.array(z.string().uuid()).optional(),
  requireAllMembers: z.boolean().default(false),
  requireMinDwellMinutes: z.number().min(1).optional(),
  timeConditions: z.object({
    startTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    daysOfWeek: z.array(z.number().min(0).max(6)).nullable(),
  }).optional(),
  actions: z.array(z.object({
    type: z.enum([
      'send_notification',
      'create_chore_reminder',
      'auto_assign_chore',
      'enable_away_mode',
      'disable_away_mode',
      'smart_home_action',
      'award_points',
      'webhook',
    ]),
    config: z.record(z.unknown()),
    delay: z.number().min(0).optional(),
  })).min(1),
});

const updateAwayModeSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().max(200).optional(),
  pauseChoreDeadlines: z.boolean().optional(),
  pauseStreakTracking: z.boolean().optional(),
  autoReactivateOnReturn: z.boolean().optional(),
  scheduledEndAt: z.string().datetime().optional(),
  expectedReturnGeofenceId: z.string().uuid().optional(),
});

const updateLocationSettingsSchema = z.object({
  trackingMode: z.enum(['off', 'geofence_only', 'continuous_low', 'continuous_high']).optional(),
  shareLocationWithHousehold: z.boolean().optional(),
  allowLocationHistory: z.boolean().optional(),
  historyRetentionDays: z.number().min(1).max(365).optional(),
  blurLocationWhenNotHome: z.boolean().optional(),
  hideFromSpecificMembers: z.array(z.string().uuid()).nullable().optional(),
});

export async function geofencingRoutes(fastify: FastifyInstance) {
  // ========================================
  // Geofence Presets
  // ========================================

  /**
   * GET /location/presets - Get geofence presets
   */
  fastify.get('/location/presets', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return { presets: GEOFENCE_PRESETS };
  });

  // ========================================
  // Geofence CRUD
  // ========================================

  /**
   * GET /location/geofences - List all geofences
   */
  fastify.get<{
    Params: { householdId: string };
    Querystring: { type?: string; enabled?: string };
  }>('/location/geofences', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { type, enabled } = request.query;

    const conditions = [eq(geofences.householdId, householdId)];

    if (type) {
      conditions.push(eq(geofences.type, type));
    }
    if (enabled !== undefined) {
      conditions.push(eq(geofences.isEnabled, enabled === 'true'));
    }

    const fences = await db
      .select()
      .from(geofences)
      .where(and(...conditions))
      .orderBy(desc(geofences.createdAt));

    return { geofences: fences };
  });

  /**
   * POST /location/geofences - Create a geofence
   */
  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof createGeofenceSchema>;
  }>('/location/geofences', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const data = createGeofenceSchema.parse(request.body);

    const [fence] = await db
      .insert(geofences)
      .values({
        householdId,
        ...data,
      })
      .returning();

    return reply.status(201).send({ geofence: fence });
  });

  /**
   * GET /location/geofences/:geofenceId - Get a geofence
   */
  fastify.get<{
    Params: { householdId: string; geofenceId: string };
  }>('/location/geofences/:geofenceId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { geofenceId } = request.params;

    const fence = await db.query.geofences.findFirst({
      where: and(
        eq(geofences.id, geofenceId),
        eq(geofences.householdId, householdId)
      ),
    });

    if (!fence) {
      return reply.status(404).send({ error: 'Geofence not found' });
    }

    // Get recent events
    const recentEvents = await db
      .select({
        event: geofenceEvents,
        member: {
          id: members.id,
          name: members.name,
        },
      })
      .from(geofenceEvents)
      .leftJoin(members, eq(geofenceEvents.memberId, members.id))
      .where(eq(geofenceEvents.geofenceId, geofenceId))
      .orderBy(desc(geofenceEvents.occurredAt))
      .limit(20);

    // Get members currently at this geofence
    const currentMembers = await db
      .select({
        location: memberLocations,
        member: {
          id: members.id,
          name: members.name,
        },
      })
      .from(memberLocations)
      .leftJoin(members, eq(memberLocations.memberId, members.id))
      .where(eq(memberLocations.currentGeofenceId, geofenceId));

    return {
      geofence: fence,
      recentEvents: recentEvents.map((e) => ({
        ...e.event,
        member: e.member,
      })),
      currentMembers: currentMembers.map((m) => ({
        ...m.location,
        member: m.member,
      })),
    };
  });

  /**
   * PATCH /location/geofences/:geofenceId - Update a geofence
   */
  fastify.patch<{
    Params: { householdId: string; geofenceId: string };
    Body: z.infer<typeof updateGeofenceSchema>;
  }>('/location/geofences/:geofenceId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { geofenceId } = request.params;
    const data = updateGeofenceSchema.parse(request.body);

    const existing = await db.query.geofences.findFirst({
      where: and(
        eq(geofences.id, geofenceId),
        eq(geofences.householdId, householdId)
      ),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Geofence not found' });
    }

    const [updated] = await db
      .update(geofences)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(geofences.id, geofenceId))
      .returning();

    return { geofence: updated };
  });

  /**
   * DELETE /location/geofences/:geofenceId - Delete a geofence
   */
  fastify.delete<{
    Params: { householdId: string; geofenceId: string };
  }>('/location/geofences/:geofenceId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { geofenceId } = request.params;

    const existing = await db.query.geofences.findFirst({
      where: and(
        eq(geofences.id, geofenceId),
        eq(geofences.householdId, householdId)
      ),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Geofence not found' });
    }

    await db.delete(geofences).where(eq(geofences.id, geofenceId));

    return { success: true };
  });

  // ========================================
  // Location Reporting
  // ========================================

  /**
   * POST /location/report - Report current location
   */
  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof reportLocationSchema>;
  }>('/location/report', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const memberId = request.headers['x-member-id'] as string;
    const data = reportLocationSchema.parse(request.body);

    if (!memberId) {
      return reply.status(400).send({ error: 'Member ID required' });
    }

    // Check location settings
    const settings = await db.query.locationSettings.findFirst({
      where: eq(locationSettings.memberId, memberId),
    });

    if (settings?.trackingMode === 'off') {
      return { updated: false, message: 'Location tracking is disabled' };
    }

    // Get all enabled geofences
    const fences = await db
      .select()
      .from(geofences)
      .where(
        and(
          eq(geofences.householdId, householdId),
          eq(geofences.isEnabled, true)
        )
      );

    // Find which geofence the member is in
    let currentGeofence = null;
    for (const fence of fences) {
      if (
        isWithinGeofence(
          data.latitude,
          data.longitude,
          fence.latitude,
          fence.longitude,
          fence.radiusMeters
        )
      ) {
        // Check if member is active for this geofence
        if (
          !fence.activeForMemberIds ||
          (fence.activeForMemberIds as string[]).includes(memberId)
        ) {
          currentGeofence = fence;
          break;
        }
      }
    }

    // Get previous location
    const previousLocation = await db.query.memberLocations.findFirst({
      where: eq(memberLocations.memberId, memberId),
    });

    // Check for geofence transitions
    const wasInGeofence = previousLocation?.currentGeofenceId;
    const nowInGeofence = currentGeofence?.id || null;

    const events = [];

    // Handle exit event
    if (wasInGeofence && wasInGeofence !== nowInGeofence) {
      const exitedFence = fences.find((f) => f.id === wasInGeofence);
      if (exitedFence?.notifyOnExit) {
        const [event] = await db
          .insert(geofenceEvents)
          .values({
            geofenceId: wasInGeofence,
            householdId,
            memberId,
            eventType: 'exit',
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy,
            deviceId: data.deviceId,
            batteryLevel: data.batteryLevel,
            notificationSent: true,
          })
          .returning();

        events.push({ type: 'exit', geofence: exitedFence, event });

        // Update geofence stats
        await db
          .update(geofences)
          .set({
            totalExits: sql`${geofences.totalExits} + 1`,
            lastTriggeredAt: new Date(),
          })
          .where(eq(geofences.id, wasInGeofence));
      }
    }

    // Handle entry event
    if (nowInGeofence && wasInGeofence !== nowInGeofence && currentGeofence) {
      if (currentGeofence.notifyOnEntry) {
        const [event] = await db
          .insert(geofenceEvents)
          .values({
            geofenceId: nowInGeofence,
            householdId,
            memberId,
            eventType: 'enter',
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy,
            deviceId: data.deviceId,
            batteryLevel: data.batteryLevel,
            notificationSent: true,
          })
          .returning();

        events.push({ type: 'enter', geofence: currentGeofence, event });

        // Update geofence stats
        await db
          .update(geofences)
          .set({
            totalEntries: sql`${geofences.totalEntries} + 1`,
            lastTriggeredAt: new Date(),
          })
          .where(eq(geofences.id, nowInGeofence));
      }
    }

    // Check for home geofence
    const homeGeofence = fences.find((f) => f.type === 'home');
    const isAtHome = homeGeofence
      ? isWithinGeofence(
          data.latitude,
          data.longitude,
          homeGeofence.latitude,
          homeGeofence.longitude,
          homeGeofence.radiusMeters
        )
      : false;

    // Upsert member location
    if (previousLocation) {
      await db
        .update(memberLocations)
        .set({
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          altitude: data.altitude,
          speed: data.speed,
          heading: data.heading,
          currentGeofenceId: nowInGeofence,
          currentGeofenceName: currentGeofence?.name || null,
          enteredCurrentAt:
            nowInGeofence !== wasInGeofence ? new Date() : previousLocation.enteredCurrentAt,
          isAtHome,
          lastUpdatedAt: new Date(),
          deviceId: data.deviceId,
          batteryLevel: data.batteryLevel,
        })
        .where(eq(memberLocations.memberId, memberId));
    } else {
      await db.insert(memberLocations).values({
        memberId,
        householdId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        altitude: data.altitude,
        speed: data.speed,
        heading: data.heading,
        currentGeofenceId: nowInGeofence,
        currentGeofenceName: currentGeofence?.name || null,
        enteredCurrentAt: nowInGeofence ? new Date() : null,
        isAtHome,
        deviceId: data.deviceId,
        batteryLevel: data.batteryLevel,
      });
    }

    // Add to history if enabled
    if (settings?.allowLocationHistory !== false) {
      await db.insert(locationHistory).values({
        memberId,
        householdId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        geofenceId: nowInGeofence,
        geofenceName: currentGeofence?.name || null,
      });
    }

    return {
      updated: true,
      currentGeofence: currentGeofence
        ? { id: currentGeofence.id, name: currentGeofence.name }
        : null,
      isAtHome,
      events,
    };
  });

  /**
   * POST /location/events - Report a geofence event directly
   */
  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof reportGeofenceEventSchema>;
  }>('/location/events', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const memberId = request.headers['x-member-id'] as string;
    const data = reportGeofenceEventSchema.parse(request.body);

    if (!memberId) {
      return reply.status(400).send({ error: 'Member ID required' });
    }

    // Verify geofence exists
    const fence = await db.query.geofences.findFirst({
      where: and(
        eq(geofences.id, data.geofenceId),
        eq(geofences.householdId, householdId)
      ),
    });

    if (!fence) {
      return reply.status(404).send({ error: 'Geofence not found' });
    }

    // Create event
    const [event] = await db
      .insert(geofenceEvents)
      .values({
        geofenceId: data.geofenceId,
        householdId,
        memberId,
        eventType: data.eventType,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        deviceId: data.deviceId,
        batteryLevel: data.batteryLevel,
        notificationSent:
          data.eventType === 'enter' ? fence.notifyOnEntry : fence.notifyOnExit,
      })
      .returning();

    // Update stats
    if (data.eventType === 'enter') {
      await db
        .update(geofences)
        .set({
          totalEntries: sql`${geofences.totalEntries} + 1`,
          lastTriggeredAt: new Date(),
        })
        .where(eq(geofences.id, data.geofenceId));
    } else if (data.eventType === 'exit') {
      await db
        .update(geofences)
        .set({
          totalExits: sql`${geofences.totalExits} + 1`,
          lastTriggeredAt: new Date(),
        })
        .where(eq(geofences.id, data.geofenceId));
    }

    // Check automations
    const automations = await db
      .select()
      .from(geofenceAutomations)
      .where(
        and(
          eq(geofenceAutomations.geofenceId, data.geofenceId),
          eq(geofenceAutomations.triggerType, data.eventType),
          eq(geofenceAutomations.isEnabled, true)
        )
      );

    const triggeredAutomations = [];
    for (const automation of automations) {
      // Check if member matches
      if (
        automation.triggerMemberIds &&
        !(automation.triggerMemberIds as string[]).includes(memberId)
      ) {
        continue;
      }

      // Mark as triggered
      await db
        .update(geofenceAutomations)
        .set({
          timesTriggered: sql`${geofenceAutomations.timesTriggered} + 1`,
          lastTriggeredAt: new Date(),
        })
        .where(eq(geofenceAutomations.id, automation.id));

      triggeredAutomations.push(automation);
    }

    return {
      event,
      geofence: fence,
      triggeredAutomations,
    };
  });

  // ========================================
  // Member Locations
  // ========================================

  /**
   * GET /location/members - Get all member locations
   */
  fastify.get<{
    Params: { householdId: string };
  }>('/location/members', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const requestingMemberId = request.headers['x-member-id'] as string;

    const locations = await db
      .select({
        location: memberLocations,
        member: {
          id: members.id,
          name: members.name,
          avatarUrl: members.avatarUrl,
        },
      })
      .from(memberLocations)
      .leftJoin(members, eq(memberLocations.memberId, members.id))
      .where(eq(memberLocations.householdId, householdId));

    // Filter based on privacy settings
    const filteredLocations = [];
    for (const loc of locations) {
      // Check if member shares location
      const settings = await db.query.locationSettings.findFirst({
        where: eq(locationSettings.memberId, loc.location.memberId),
      });

      if (!settings?.shareLocationWithHousehold) continue;
      if (
        settings?.hideFromSpecificMembers &&
        (settings.hideFromSpecificMembers as string[]).includes(requestingMemberId)
      ) {
        continue;
      }

      filteredLocations.push({
        ...loc.location,
        member: loc.member,
        // Blur location if not at home and setting is enabled
        latitude:
          settings?.blurLocationWhenNotHome && !loc.location.isAtHome
            ? Math.round(loc.location.latitude * 100) / 100
            : loc.location.latitude,
        longitude:
          settings?.blurLocationWhenNotHome && !loc.location.isAtHome
            ? Math.round(loc.location.longitude * 100) / 100
            : loc.location.longitude,
      });
    }

    return { locations: filteredLocations };
  });

  /**
   * GET /location/history - Get location history
   */
  fastify.get<{
    Params: { householdId: string };
    Querystring: { memberId?: string; from?: string; to?: string; limit?: string };
  }>('/location/history', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { memberId, from, to, limit = '100' } = request.query;

    const conditions = [eq(locationHistory.householdId, householdId)];

    if (memberId) {
      conditions.push(eq(locationHistory.memberId, memberId));
    }
    if (from) {
      conditions.push(gte(locationHistory.recordedAt, new Date(from)));
    }
    if (to) {
      conditions.push(lte(locationHistory.recordedAt, new Date(to)));
    }

    const history = await db
      .select()
      .from(locationHistory)
      .where(and(...conditions))
      .orderBy(desc(locationHistory.recordedAt))
      .limit(parseInt(limit));

    return { history };
  });

  // ========================================
  // Geofence Automations
  // ========================================

  /**
   * GET /location/automations - List automations
   */
  fastify.get<{
    Params: { householdId: string };
  }>('/location/automations', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }

    const automations = await db
      .select({
        automation: geofenceAutomations,
        geofence: {
          id: geofences.id,
          name: geofences.name,
        },
      })
      .from(geofenceAutomations)
      .leftJoin(geofences, eq(geofenceAutomations.geofenceId, geofences.id))
      .where(eq(geofenceAutomations.householdId, householdId))
      .orderBy(desc(geofenceAutomations.createdAt));

    return {
      automations: automations.map((a) => ({
        ...a.automation,
        geofence: a.geofence,
      })),
    };
  });

  /**
   * POST /location/automations - Create automation
   */
  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof createAutomationSchema>;
  }>('/location/automations', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const data = createAutomationSchema.parse(request.body);

    // Verify geofence exists
    const fence = await db.query.geofences.findFirst({
      where: and(
        eq(geofences.id, data.geofenceId),
        eq(geofences.householdId, householdId)
      ),
    });

    if (!fence) {
      return reply.status(404).send({ error: 'Geofence not found' });
    }

    const [automation] = await db
      .insert(geofenceAutomations)
      .values({
        householdId,
        ...data,
      })
      .returning();

    return reply.status(201).send({ automation });
  });

  /**
   * DELETE /location/automations/:automationId - Delete automation
   */
  fastify.delete<{
    Params: { householdId: string; automationId: string };
  }>('/location/automations/:automationId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { automationId } = request.params;

    const existing = await db.query.geofenceAutomations.findFirst({
      where: and(
        eq(geofenceAutomations.id, automationId),
        eq(geofenceAutomations.householdId, householdId)
      ),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Automation not found' });
    }

    await db.delete(geofenceAutomations).where(eq(geofenceAutomations.id, automationId));

    return { success: true };
  });

  // ========================================
  // Away Mode
  // ========================================

  /**
   * GET /location/away-mode - Get away mode status for member
   */
  fastify.get<{
    Params: { householdId: string };
  }>('/location/away-mode', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const memberId = request.headers['x-member-id'] as string;

    const config = await db.query.awayModeConfigs.findFirst({
      where: and(
        eq(awayModeConfigs.memberId, memberId),
        eq(awayModeConfigs.householdId, householdId)
      ),
    });

    return { awayMode: config };
  });

  /**
   * PUT /location/away-mode - Update away mode
   */
  fastify.put<{
    Params: { householdId: string };
    Body: z.infer<typeof updateAwayModeSchema>;
  }>('/location/away-mode', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const memberId = request.headers['x-member-id'] as string;
    const data = updateAwayModeSchema.parse(request.body);

    if (!memberId) {
      return reply.status(400).send({ error: 'Member ID required' });
    }

    const existing = await db.query.awayModeConfigs.findFirst({
      where: eq(awayModeConfigs.memberId, memberId),
    });

    if (existing) {
      const [updated] = await db
        .update(awayModeConfigs)
        .set({
          ...data,
          activatedAt: data.isActive && !existing.isActive ? new Date() : existing.activatedAt,
          scheduledEndAt: data.scheduledEndAt ? new Date(data.scheduledEndAt) : undefined,
        })
        .where(eq(awayModeConfigs.id, existing.id))
        .returning();

      return { awayMode: updated };
    } else {
      const [created] = await db
        .insert(awayModeConfigs)
        .values({
          householdId,
          memberId,
          ...data,
          activatedAt: data.isActive ? new Date() : null,
          scheduledEndAt: data.scheduledEndAt ? new Date(data.scheduledEndAt) : undefined,
        })
        .returning();

      return reply.status(201).send({ awayMode: created });
    }
  });

  // ========================================
  // Location Settings
  // ========================================

  /**
   * GET /location/settings - Get location settings
   */
  fastify.get<{
    Params: { householdId: string };
  }>('/location/settings', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const memberId = request.headers['x-member-id'] as string;

    let settings = await db.query.locationSettings.findFirst({
      where: eq(locationSettings.memberId, memberId),
    });

    // Create default settings if not exists
    if (!settings) {
      [settings] = await db
        .insert(locationSettings)
        .values({
          memberId,
          householdId,
        })
        .returning();
    }

    return { settings };
  });

  /**
   * PATCH /location/settings - Update location settings
   */
  fastify.patch<{
    Params: { householdId: string };
    Body: z.infer<typeof updateLocationSettingsSchema>;
  }>('/location/settings', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const memberId = request.headers['x-member-id'] as string;
    const data = updateLocationSettingsSchema.parse(request.body);

    if (!memberId) {
      return reply.status(400).send({ error: 'Member ID required' });
    }

    const existing = await db.query.locationSettings.findFirst({
      where: eq(locationSettings.memberId, memberId),
    });

    if (existing) {
      const [updated] = await db
        .update(locationSettings)
        .set(data)
        .where(eq(locationSettings.id, existing.id))
        .returning();

      return { settings: updated };
    } else {
      const [created] = await db
        .insert(locationSettings)
        .values({
          memberId,
          householdId,
          ...data,
        })
        .returning();

      return reply.status(201).send({ settings: created });
    }
  });

  // ========================================
  // Analytics
  // ========================================

  /**
   * GET /location/analytics - Get geofencing analytics
   */
  fastify.get<{
    Params: { householdId: string };
    Querystring: { days?: string };
  }>('/location/analytics', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const days = parseInt(request.query.days || '30');
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get geofences
    const fences = await db
      .select()
      .from(geofences)
      .where(eq(geofences.householdId, householdId));

    // Get events
    const events = await db
      .select()
      .from(geofenceEvents)
      .where(
        and(
          eq(geofenceEvents.householdId, householdId),
          gte(geofenceEvents.occurredAt, since)
        )
      );

    const eventsByType = {
      enter: events.filter((e) => e.eventType === 'enter').length,
      exit: events.filter((e) => e.eventType === 'exit').length,
      dwell: events.filter((e) => e.eventType === 'dwell').length,
    };

    // Get automations triggered
    const automations = await db
      .select()
      .from(geofenceAutomations)
      .where(eq(geofenceAutomations.householdId, householdId));

    const totalAutomationsTriggered = automations.reduce(
      (sum, a) => sum + a.timesTriggered,
      0
    );

    // By geofence
    const byGeofence = fences.map((fence) => {
      const fenceEvents = events.filter((e) => e.geofenceId === fence.id);
      return {
        id: fence.id,
        name: fence.name,
        type: fence.type,
        entries: fenceEvents.filter((e) => e.eventType === 'enter').length,
        exits: fenceEvents.filter((e) => e.eventType === 'exit').length,
        avgDwellMinutes: 0, // Would need to calculate from entry/exit pairs
      };
    });

    // By member
    const memberData = await db
      .select({ id: members.id, name: members.name })
      .from(members)
      .where(eq(members.householdId, householdId));

    const byMember = memberData.map((member) => {
      const memberEvents = events.filter((e) => e.memberId === member.id);
      const homeGeofence = fences.find((f) => f.type === 'home');
      const homeEvents = homeGeofence
        ? memberEvents.filter((e) => e.geofenceId === homeGeofence.id)
        : [];

      return {
        memberId: member.id,
        memberName: member.name,
        homeTime: homeEvents.length > 0 ? 80 : 0, // Simplified
        events: memberEvents.length,
      };
    });

    // Recent events
    const recentEvents = events
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 20);

    return {
      analytics: {
        totalGeofences: fences.length,
        activeGeofences: fences.filter((f) => f.isEnabled).length,
        totalEvents: events.length,
        eventsByType,
        totalAutomationsTriggered,
        byGeofence,
        byMember,
        recentEvents,
      },
    };
  });
}
