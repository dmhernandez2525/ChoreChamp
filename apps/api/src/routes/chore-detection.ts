import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { db } from '@chorechamp/database';
import {
  detectionRules,
  detectionEvents,
  cleanlinessMetrics,
  sensorReadings,
  detectionPatterns,
  smartDevices,
  members,
} from '@chorechamp/database/schema';
import { DETECTION_TEMPLATES } from '@chorechamp/types';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership } from '../lib/membership';

// Zod schemas for validation
const detectionConditionSchema = z.object({
  sensorAttribute: z.string(),
  operator: z.enum([
    'equals',
    'not_equals',
    'greater_than',
    'less_than',
    'greater_or_equal',
    'less_or_equal',
    'contains',
    'changed_to',
    'changed_from',
    'changed',
    'stayed_for',
  ]),
  value: z.union([z.string(), z.number(), z.boolean()]),
  duration: z.number().optional(),
});

const createDetectionRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  deviceId: z.string().uuid(),
  sensorType: z.enum([
    'motion',
    'contact',
    'humidity',
    'temperature',
    'air_quality',
    'water_leak',
    'vibration',
    'light',
    'sound',
    'occupancy',
    'vacuum_state',
    'appliance_state',
    'power_consumption',
    'camera_ai',
  ]),
  conditions: z.array(detectionConditionSchema).min(1),
  conditionLogic: z.enum(['all', 'any']).default('all'),
  choreType: z.enum([
    'vacuuming',
    'mopping',
    'dusting',
    'dishes',
    'laundry',
    'trash_out',
    'bed_making',
    'room_tidying',
    'bathroom_cleaning',
    'kitchen_cleaning',
    'pet_feeding',
    'plant_watering',
    'window_cleaning',
    'floor_sweeping',
    'surface_wiping',
    'custom',
  ]),
  linkedChoreId: z.string().uuid().optional(),
  zoneName: z.string().max(100).optional(),
  detectionMode: z.enum(['completion', 'needed', 'both']),
  completionConfidence: z.number().min(0).max(100).default(80),
  requireManualConfirm: z.boolean().default(false),
  cooldownMinutes: z.number().min(1).max(10080).default(60), // Max 1 week
  needThreshold: z.number().optional(),
  needCheckInterval: z.number().min(1).max(1440).optional(), // Max 24 hours
  bonusPointsOnAutoDetect: z.number().min(0).max(100).default(5),
});

const updateDetectionRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  isEnabled: z.boolean().optional(),
  conditions: z.array(detectionConditionSchema).min(1).optional(),
  conditionLogic: z.enum(['all', 'any']).optional(),
  linkedChoreId: z.string().uuid().nullable().optional(),
  zoneName: z.string().max(100).nullable().optional(),
  detectionMode: z.enum(['completion', 'needed', 'both']).optional(),
  completionConfidence: z.number().min(0).max(100).optional(),
  requireManualConfirm: z.boolean().optional(),
  cooldownMinutes: z.number().min(1).max(10080).optional(),
  needThreshold: z.number().nullable().optional(),
  needCheckInterval: z.number().min(1).max(1440).nullable().optional(),
  bonusPointsOnAutoDetect: z.number().min(0).max(100).optional(),
});

const confirmDetectionSchema = z.object({
  wasAccurate: z.boolean(),
  feedbackNote: z.string().max(500).optional(),
});

const recordSensorReadingSchema = z.object({
  deviceId: z.string().uuid(),
  sensorType: z.string(),
  attribute: z.string(),
  value: z.union([z.number(), z.string(), z.boolean()]),
  unit: z.string().optional(),
});

const simulateDetectionSchema = z.object({
  ruleId: z.string().uuid(),
  sensorData: z.record(z.unknown()),
});

export async function choreDetectionRoutes(fastify: FastifyInstance) {
  // ========================================
  // Detection Templates
  // ========================================

  /**
   * GET /detection/templates - Get predefined detection templates
   */
  fastify.get('/detection/templates', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    return {
      templates: DETECTION_TEMPLATES,
    };
  });

  // ========================================
  // Detection Rules CRUD
  // ========================================

  /**
   * GET /detection/rules - List all detection rules for household
   */
  fastify.get<{
    Params: { householdId: string };
    Querystring: { choreType?: string; zoneName?: string; enabled?: string };
  }>('/detection/rules', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { choreType, zoneName, enabled } = request.query;

    const conditions = [eq(detectionRules.householdId, householdId)];

    if (choreType) {
      conditions.push(eq(detectionRules.choreType, choreType));
    }
    if (zoneName) {
      conditions.push(eq(detectionRules.zoneName, zoneName));
    }
    if (enabled !== undefined) {
      conditions.push(eq(detectionRules.isEnabled, enabled === 'true'));
    }

    const rules = await db
      .select({
        rule: detectionRules,
        device: {
          id: smartDevices.id,
          name: smartDevices.name,
          category: smartDevices.category,
        },
      })
      .from(detectionRules)
      .leftJoin(smartDevices, eq(detectionRules.deviceId, smartDevices.id))
      .where(and(...conditions))
      .orderBy(desc(detectionRules.createdAt));

    return {
      rules: rules.map((r) => ({
        ...r.rule,
        device: r.device,
      })),
    };
  });

  /**
   * POST /detection/rules - Create a new detection rule
   */
  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof createDetectionRuleSchema>;
  }>('/detection/rules', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const data = createDetectionRuleSchema.parse(request.body);

    // Verify device exists and belongs to household
    const device = await db.query.smartDevices.findFirst({
      where: and(
        eq(smartDevices.id, data.deviceId),
        eq(smartDevices.householdId, householdId)
      ),
    });

    if (!device) {
      return reply.status(404).send({ error: 'Device not found' });
    }

    const [rule] = await db
      .insert(detectionRules)
      .values({
        householdId,
        name: data.name,
        description: data.description,
        deviceId: data.deviceId,
        sensorType: data.sensorType,
        conditions: data.conditions,
        conditionLogic: data.conditionLogic,
        choreType: data.choreType,
        linkedChoreId: data.linkedChoreId,
        zoneName: data.zoneName,
        detectionMode: data.detectionMode,
        completionConfidence: data.completionConfidence,
        requireManualConfirm: data.requireManualConfirm,
        cooldownMinutes: data.cooldownMinutes,
        needThreshold: data.needThreshold,
        needCheckInterval: data.needCheckInterval,
        bonusPointsOnAutoDetect: data.bonusPointsOnAutoDetect,
      })
      .returning();

    // Initialize cleanliness metric for zone if needed
    if (data.zoneName) {
      const existingMetric = await db.query.cleanlinessMetrics.findFirst({
        where: and(
          eq(cleanlinessMetrics.householdId, householdId),
          eq(cleanlinessMetrics.zoneName, data.zoneName)
        ),
      });

      if (!existingMetric) {
        await db.insert(cleanlinessMetrics).values({
          householdId,
          zoneName: data.zoneName,
          overallScore: 100,
        });
      }
    }

    return reply.status(201).send({ rule });
  });

  /**
   * GET /detection/rules/:ruleId - Get a specific detection rule
   */
  fastify.get<{
    Params: { householdId: string; ruleId: string };
  }>('/detection/rules/:ruleId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { ruleId } = request.params;

    const rule = await db.query.detectionRules.findFirst({
      where: and(
        eq(detectionRules.id, ruleId),
        eq(detectionRules.householdId, householdId)
      ),
    });

    if (!rule) {
      return reply.status(404).send({ error: 'Detection rule not found' });
    }

    // Get device info
    const device = await db.query.smartDevices.findFirst({
      where: eq(smartDevices.id, rule.deviceId),
    });

    // Get recent events
    const recentEvents = await db
      .select()
      .from(detectionEvents)
      .where(eq(detectionEvents.ruleId, ruleId))
      .orderBy(desc(detectionEvents.createdAt))
      .limit(10);

    return {
      rule: {
        ...rule,
        device,
        recentEvents,
      },
    };
  });

  /**
   * PATCH /detection/rules/:ruleId - Update a detection rule
   */
  fastify.patch<{
    Params: { householdId: string; ruleId: string };
    Body: z.infer<typeof updateDetectionRuleSchema>;
  }>('/detection/rules/:ruleId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { ruleId } = request.params;
    const data = updateDetectionRuleSchema.parse(request.body);

    const existing = await db.query.detectionRules.findFirst({
      where: and(
        eq(detectionRules.id, ruleId),
        eq(detectionRules.householdId, householdId)
      ),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Detection rule not found' });
    }

    const [updated] = await db
      .update(detectionRules)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(detectionRules.id, ruleId))
      .returning();

    return { rule: updated };
  });

  /**
   * DELETE /detection/rules/:ruleId - Delete a detection rule
   */
  fastify.delete<{
    Params: { householdId: string; ruleId: string };
  }>('/detection/rules/:ruleId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { ruleId } = request.params;

    const existing = await db.query.detectionRules.findFirst({
      where: and(
        eq(detectionRules.id, ruleId),
        eq(detectionRules.householdId, householdId)
      ),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Detection rule not found' });
    }

    await db.delete(detectionRules).where(eq(detectionRules.id, ruleId));

    return { success: true };
  });

  // ========================================
  // Detection Events
  // ========================================

  /**
   * GET /detection/events - List detection events
   */
  fastify.get<{
    Params: { householdId: string };
    Querystring: {
      ruleId?: string;
      eventType?: string;
      pending?: string;
      limit?: string;
      offset?: string;
    };
  }>('/detection/events', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { ruleId, eventType, pending, limit = '50', offset = '0' } = request.query;

    const conditions = [eq(detectionEvents.householdId, householdId)];

    if (ruleId) {
      conditions.push(eq(detectionEvents.ruleId, ruleId));
    }
    if (eventType) {
      conditions.push(eq(detectionEvents.eventType, eventType));
    }
    if (pending === 'true') {
      conditions.push(sql`${detectionEvents.wasConfirmed} IS NULL`);
    }

    const events = await db
      .select({
        event: detectionEvents,
        rule: {
          id: detectionRules.id,
          name: detectionRules.name,
        },
        device: {
          id: smartDevices.id,
          name: smartDevices.name,
        },
      })
      .from(detectionEvents)
      .leftJoin(detectionRules, eq(detectionEvents.ruleId, detectionRules.id))
      .leftJoin(smartDevices, eq(detectionEvents.deviceId, smartDevices.id))
      .where(and(...conditions))
      .orderBy(desc(detectionEvents.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(detectionEvents)
      .where(and(...conditions));

    return {
      events: events.map((e) => ({
        ...e.event,
        rule: e.rule,
        device: e.device,
      })),
      total: count,
    };
  });

  /**
   * POST /detection/events/:eventId/confirm - Confirm or reject a detection
   */
  fastify.post<{
    Params: { householdId: string; eventId: string };
    Body: z.infer<typeof confirmDetectionSchema>;
  }>('/detection/events/:eventId/confirm', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { eventId } = request.params;
    const { wasAccurate, feedbackNote } = confirmDetectionSchema.parse(request.body);
    // Derive memberId from authenticated user's membership
    const memberId = membership.id;

    const event = await db.query.detectionEvents.findFirst({
      where: and(
        eq(detectionEvents.id, eventId),
        eq(detectionEvents.householdId, householdId)
      ),
    });

    if (!event) {
      return reply.status(404).send({ error: 'Detection event not found' });
    }

    if (event.wasConfirmed !== null) {
      return reply.status(400).send({ error: 'Event already confirmed' });
    }

    // Update event
    const [updated] = await db
      .update(detectionEvents)
      .set({
        wasConfirmed: wasAccurate,
        confirmedBy: memberId || null,
        feedbackNote,
        processedAt: new Date(),
        eventType: wasAccurate ? event.eventType : 'false_positive',
      })
      .where(eq(detectionEvents.id, eventId))
      .returning();

    // Update pattern accuracy
    const rule = await db.query.detectionRules.findFirst({
      where: eq(detectionRules.id, event.ruleId),
    });

    if (rule?.zoneName) {
      const pattern = await db.query.detectionPatterns.findFirst({
        where: and(
          eq(detectionPatterns.householdId, householdId),
          eq(detectionPatterns.choreType, event.choreType),
          eq(detectionPatterns.zoneName, rule.zoneName)
        ),
      });

      if (pattern) {
        const newTotal = pattern.totalDetections + 1;
        const newConfirmed = wasAccurate
          ? pattern.confirmedDetections + 1
          : pattern.confirmedDetections;
        const newFalsePositives = wasAccurate
          ? pattern.falsePositives
          : pattern.falsePositives + 1;

        await db
          .update(detectionPatterns)
          .set({
            totalDetections: newTotal,
            confirmedDetections: newConfirmed,
            falsePositives: newFalsePositives,
            accuracyRate: (newConfirmed / newTotal) * 100,
            updatedAt: new Date(),
          })
          .where(eq(detectionPatterns.id, pattern.id));
      } else {
        // Create new pattern
        await db.insert(detectionPatterns).values({
          householdId,
          choreType: event.choreType,
          zoneName: rule.zoneName,
          totalDetections: 1,
          confirmedDetections: wasAccurate ? 1 : 0,
          falsePositives: wasAccurate ? 0 : 1,
          accuracyRate: wasAccurate ? 100 : 0,
        });
      }
    }

    // Award points if confirmed
    if (wasAccurate && event.pointsAwarded > 0 && memberId) {
      await db
        .update(members)
        .set({
          pointsCurrent: sql`points_current + ${event.pointsAwarded}`,
          pointsLifetime: sql`points_lifetime + ${event.pointsAwarded}`,
        })
        .where(and(eq(members.id, memberId), eq(members.householdId, householdId)));
    }

    return { event: updated };
  });

  // ========================================
  // Sensor Readings
  // ========================================

  /**
   * POST /detection/readings - Record a sensor reading
   */
  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof recordSensorReadingSchema>;
  }>('/detection/readings', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const data = recordSensorReadingSchema.parse(request.body);

    // Verify device belongs to household
    const device = await db.query.smartDevices.findFirst({
      where: and(
        eq(smartDevices.id, data.deviceId),
        eq(smartDevices.householdId, householdId)
      ),
    });

    if (!device) {
      return reply.status(404).send({ error: 'Device not found' });
    }

    // Store the reading
    const valueNumeric = typeof data.value === 'number' ? data.value : null;
    const valueText = typeof data.value === 'string' ? data.value : null;
    const valueBoolean = typeof data.value === 'boolean' ? data.value : null;

    const [reading] = await db
      .insert(sensorReadings)
      .values({
        deviceId: data.deviceId,
        householdId,
        sensorType: data.sensorType,
        attribute: data.attribute,
        valueNumeric,
        valueText,
        valueBoolean,
        unit: data.unit,
      })
      .returning();

    // Check if any detection rules match
    const matchingRules = await db
      .select()
      .from(detectionRules)
      .where(
        and(
          eq(detectionRules.deviceId, data.deviceId),
          eq(detectionRules.isEnabled, true)
        )
      );

    const triggeredEvents = [];

    for (const rule of matchingRules) {
      const shouldTrigger = evaluateConditions(
        rule.conditions as Array<{
          sensorAttribute: string;
          operator: string;
          value: string | number | boolean;
        }>,
        rule.conditionLogic,
        { [data.attribute]: data.value }
      );

      if (shouldTrigger) {
        // Check cooldown
        const recentEvent = await db.query.detectionEvents.findFirst({
          where: and(
            eq(detectionEvents.ruleId, rule.id),
            gte(
              detectionEvents.createdAt,
              new Date(Date.now() - rule.cooldownMinutes * 60 * 1000)
            )
          ),
        });

        if (!recentEvent) {
          // Create detection event
          const [event] = await db
            .insert(detectionEvents)
            .values({
              ruleId: rule.id,
              householdId,
              deviceId: data.deviceId,
              eventType:
                rule.detectionMode === 'needed'
                  ? 'need_detected'
                  : 'completion_detected',
              choreType: rule.choreType,
              zoneName: rule.zoneName,
              sensorData: { [data.attribute]: data.value },
              confidence: rule.completionConfidence,
              pointsAwarded: rule.requireManualConfirm
                ? 0
                : rule.bonusPointsOnAutoDetect,
              wasConfirmed: rule.requireManualConfirm ? null : true,
              processedAt: rule.requireManualConfirm ? null : new Date(),
            })
            .returning();

          triggeredEvents.push(event);

          // Update cleanliness metric
          if (rule.zoneName) {
            const isCompletion = rule.detectionMode !== 'needed';
            await db
              .update(cleanlinessMetrics)
              .set({
                lastCleanedAt: isCompletion ? new Date() : undefined,
                overallScore: isCompletion
                  ? sql`LEAST(overall_score + 10, 100)`
                  : sql`GREATEST(overall_score - 5, 0)`,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(cleanlinessMetrics.householdId, householdId),
                  eq(cleanlinessMetrics.zoneName, rule.zoneName)
                )
              );
          }
        }
      }
    }

    return {
      reading,
      triggeredEvents,
    };
  });

  /**
   * GET /detection/readings - Get sensor reading history
   */
  fastify.get<{
    Params: { householdId: string };
    Querystring: {
      deviceId?: string;
      sensorType?: string;
      attribute?: string;
      from?: string;
      to?: string;
      limit?: string;
    };
  }>('/detection/readings', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const {
      deviceId,
      sensorType,
      attribute,
      from,
      to,
      limit = '100',
    } = request.query;

    const conditions = [eq(sensorReadings.householdId, householdId)];

    if (deviceId) {
      conditions.push(eq(sensorReadings.deviceId, deviceId));
    }
    if (sensorType) {
      conditions.push(eq(sensorReadings.sensorType, sensorType));
    }
    if (attribute) {
      conditions.push(eq(sensorReadings.attribute, attribute));
    }
    if (from) {
      conditions.push(gte(sensorReadings.recordedAt, new Date(from)));
    }
    if (to) {
      conditions.push(lte(sensorReadings.recordedAt, new Date(to)));
    }

    const readings = await db
      .select()
      .from(sensorReadings)
      .where(and(...conditions))
      .orderBy(desc(sensorReadings.recordedAt))
      .limit(parseInt(limit));

    return { readings };
  });

  // ========================================
  // Cleanliness Metrics
  // ========================================

  /**
   * GET /detection/cleanliness - Get cleanliness metrics for all zones
   */
  fastify.get<{
    Params: { householdId: string };
  }>('/detection/cleanliness', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }

    const metrics = await db
      .select()
      .from(cleanlinessMetrics)
      .where(eq(cleanlinessMetrics.householdId, householdId))
      .orderBy(cleanlinessMetrics.zoneName);

    // Calculate average score
    const averageScore =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.overallScore, 0) / metrics.length
        : 100;

    return {
      metrics,
      summary: {
        averageScore: Math.round(averageScore),
        totalZones: metrics.length,
        zonesNeedingAttention: metrics.filter((m) => m.overallScore < 70).length,
      },
    };
  });

  /**
   * GET /detection/cleanliness/:zoneName - Get cleanliness for specific zone
   */
  fastify.get<{
    Params: { householdId: string; zoneName: string };
  }>('/detection/cleanliness/:zoneName', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { zoneName } = request.params;

    const metric = await db.query.cleanlinessMetrics.findFirst({
      where: and(
        eq(cleanlinessMetrics.householdId, householdId),
        eq(cleanlinessMetrics.zoneName, zoneName)
      ),
    });

    if (!metric) {
      return reply.status(404).send({ error: 'Zone not found' });
    }

    // Get related detection rules
    const rules = await db
      .select()
      .from(detectionRules)
      .where(
        and(
          eq(detectionRules.householdId, householdId),
          eq(detectionRules.zoneName, zoneName)
        )
      );

    // Get recent events for this zone
    const recentEvents = await db
      .select()
      .from(detectionEvents)
      .where(
        and(
          eq(detectionEvents.householdId, householdId),
          eq(detectionEvents.zoneName, zoneName)
        )
      )
      .orderBy(desc(detectionEvents.createdAt))
      .limit(10);

    return {
      metric,
      rules,
      recentEvents,
    };
  });

  // ========================================
  // Detection Patterns
  // ========================================

  /**
   * GET /detection/patterns - Get learned detection patterns
   */
  fastify.get<{
    Params: { householdId: string };
  }>('/detection/patterns', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }

    const patterns = await db
      .select()
      .from(detectionPatterns)
      .where(eq(detectionPatterns.householdId, householdId))
      .orderBy(desc(detectionPatterns.accuracyRate));

    return { patterns };
  });

  // ========================================
  // Simulation & Testing
  // ========================================

  /**
   * POST /detection/simulate - Simulate a detection with test data
   */
  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof simulateDetectionSchema>;
  }>('/detection/simulate', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { ruleId, sensorData } = simulateDetectionSchema.parse(request.body);

    const rule = await db.query.detectionRules.findFirst({
      where: and(
        eq(detectionRules.id, ruleId),
        eq(detectionRules.householdId, householdId)
      ),
    });

    if (!rule) {
      return reply.status(404).send({ error: 'Detection rule not found' });
    }

    const conditions = rule.conditions as Array<{
      sensorAttribute: string;
      operator: string;
      value: string | number | boolean;
    }>;

    const wouldTrigger = evaluateConditions(
      conditions,
      rule.conditionLogic,
      sensorData as Record<string, unknown>
    );

    const conditionResults = conditions.map((cond) => ({
      condition: cond,
      matches: evaluateSingleCondition(
        cond,
        sensorData[cond.sensorAttribute]
      ),
    }));

    return {
      wouldTrigger,
      rule: {
        id: rule.id,
        name: rule.name,
        conditionLogic: rule.conditionLogic,
      },
      conditionResults,
      sensorData,
    };
  });

  // ========================================
  // Analytics
  // ========================================

  /**
   * GET /detection/analytics - Get detection analytics
   */
  fastify.get<{
    Params: { householdId: string };
    Querystring: { days?: string };
  }>('/detection/analytics', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const days = parseInt(request.query.days || '30');
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get all events in period
    const events = await db
      .select()
      .from(detectionEvents)
      .where(
        and(
          eq(detectionEvents.householdId, householdId),
          gte(detectionEvents.createdAt, since)
        )
      );

    const totalDetections = events.length;
    const confirmedCompletions = events.filter(
      (e) => e.eventType === 'completion_detected' && e.wasConfirmed === true
    ).length;
    const suggestedNeeds = events.filter(
      (e) => e.eventType === 'need_detected'
    ).length;
    const falsePositives = events.filter(
      (e) => e.wasConfirmed === false
    ).length;

    const accuracyRate =
      totalDetections > 0
        ? ((totalDetections - falsePositives) / totalDetections) * 100
        : 0;

    const totalBonusPointsAwarded = events.reduce(
      (sum, e) => sum + e.pointsAwarded,
      0
    );

    // Group by chore type
    const byChoreType: Record<string, { detections: number; falsePositives: number }> = {};
    for (const event of events) {
      if (!byChoreType[event.choreType]) {
        byChoreType[event.choreType] = { detections: 0, falsePositives: 0 };
      }
      byChoreType[event.choreType].detections++;
      if (event.wasConfirmed === false) {
        byChoreType[event.choreType].falsePositives++;
      }
    }

    // Get cleanliness by zone
    const metrics = await db
      .select()
      .from(cleanlinessMetrics)
      .where(eq(cleanlinessMetrics.householdId, householdId));

    const byZone = metrics.map((m) => {
      const zoneEvents = events.filter((e) => e.zoneName === m.zoneName);
      return {
        zoneName: m.zoneName,
        cleanlinessScore: m.overallScore,
        detections: zoneEvents.length,
      };
    });

    // Recent events
    const recentDetections = events
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return {
      analytics: {
        totalDetections,
        confirmedCompletions,
        suggestedNeeds,
        falsePositives,
        accuracyRate: Math.round(accuracyRate),
        totalBonusPointsAwarded,
        byChoreType: Object.entries(byChoreType).map(([choreType, data]) => ({
          choreType,
          detections: data.detections,
          accuracy: Math.round(
            ((data.detections - data.falsePositives) / data.detections) * 100
          ),
        })),
        byZone,
        recentDetections,
      },
    };
  });
}

// Helper function to evaluate detection conditions
function evaluateConditions(
  conditions: Array<{
    sensorAttribute: string;
    operator: string;
    value: string | number | boolean;
  }>,
  logic: string,
  sensorData: Record<string, unknown>
): boolean {
  const results = conditions.map((cond) =>
    evaluateSingleCondition(cond, sensorData[cond.sensorAttribute])
  );

  if (logic === 'all') {
    return results.every((r) => r);
  } else {
    return results.some((r) => r);
  }
}

function evaluateSingleCondition(
  condition: {
    sensorAttribute: string;
    operator: string;
    value: string | number | boolean;
  },
  actualValue: unknown
): boolean {
  const { operator, value: expectedValue } = condition;

  if (actualValue === undefined || actualValue === null) {
    return false;
  }

  switch (operator) {
    case 'equals':
      return actualValue === expectedValue;
    case 'not_equals':
      return actualValue !== expectedValue;
    case 'greater_than':
      return (
        typeof actualValue === 'number' &&
        typeof expectedValue === 'number' &&
        actualValue > expectedValue
      );
    case 'less_than':
      return (
        typeof actualValue === 'number' &&
        typeof expectedValue === 'number' &&
        actualValue < expectedValue
      );
    case 'greater_or_equal':
      return (
        typeof actualValue === 'number' &&
        typeof expectedValue === 'number' &&
        actualValue >= expectedValue
      );
    case 'less_or_equal':
      return (
        typeof actualValue === 'number' &&
        typeof expectedValue === 'number' &&
        actualValue <= expectedValue
      );
    case 'contains':
      return (
        typeof actualValue === 'string' &&
        typeof expectedValue === 'string' &&
        actualValue.includes(expectedValue)
      );
    case 'changed_to':
      // In real-time, this would compare with previous state
      return actualValue === expectedValue;
    case 'changed_from':
      // In real-time, this would compare with previous state
      return true; // Simplified for now
    case 'changed':
      return true; // Simplified for now
    case 'stayed_for':
      // Duration check would be handled at a higher level
      return actualValue === expectedValue;
    default:
      return false;
  }
}
