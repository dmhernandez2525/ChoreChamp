import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

const activityCategoryValues = [
  'chores', 'physical', 'creative', 'educational', 'social', 'self_care', 'outdoor', 'other',
] as const;

const mealTypeValues = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

const mentalHealthCategoryValues = [
  'mindfulness', 'coping_skills', 'breathing', 'journaling', 'crisis_support', 'family_therapy', 'other',
] as const;

// ===== Activity Tracking (F14.1) =====

const createActivityLogSchema = z.object({
  memberId: z.string().uuid(),
  category: z.enum(activityCategoryValues),
  activityName: z.string().min(1).max(200),
  durationMinutes: z.number().int().min(1).max(1440),
  caloriesEstimate: z.number().int().min(0).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  loggedAt: z.string().datetime().optional(),
});

const activityGoalSchema = z.object({
  category: z.enum([...activityCategoryValues, 'all']).optional(),
  targetMinutesPerDay: z.number().int().min(1).max(1440).optional(),
  targetMinutesPerWeek: z.number().int().min(1).max(10080).optional(),
  isActive: z.boolean().optional(),
});

// ===== Wellness Check-ins (F14.2) =====

const createCheckInSchema = z.object({
  memberId: z.string().uuid(),
  moodScore: z.number().int().min(1).max(5),
  energyScore: z.number().int().min(1).max(5),
  stressScore: z.number().int().min(1).max(5).optional(),
  sleepQualityScore: z.number().int().min(1).max(5).optional(),
  note: z.string().max(500).optional().nullable(),
});

// ===== Sleep Logs (F14.3) =====

const createSleepLogSchema = z.object({
  memberId: z.string().uuid(),
  bedtime: z.string().datetime(),
  wakeTime: z.string().datetime(),
  qualityScore: z.number().int().min(1).max(5).optional(),
  note: z.string().max(500).optional().nullable(),
});

// ===== Meal Plans (F14.4) =====

const createMealPlanSchema = z.object({
  mealType: z.enum(mealTypeValues),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  servings: z.number().int().min(1).max(20).optional(),
  prepTimeMinutes: z.number().int().min(0).max(480).optional(),
  cookTimeMinutes: z.number().int().min(0).max(480).optional(),
  calories: z.number().int().min(0).max(5000).optional(),
  plannedDate: z.string().datetime(),
});

// ===== Mental Health Resources (F14.5) =====

const createResourceSchema = z.object({
  category: z.enum(mentalHealthCategoryValues),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  resourceUrl: z.string().url().optional().nullable(),
  ageRange: z.string().max(32).optional().nullable(),
});

const createGratitudeSchema = z.object({
  memberId: z.string().uuid(),
  content: z.string().min(1).max(500),
});

function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!request.headers.authorization) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
}

export async function healthWellnessRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', requireAuth);

  // ===== F14.1: Activity Tracking =====

  fastify.get('/activity-logs', async (request) => {
    const { memberId, startDate, endDate } = request.query as Record<string, string | undefined>;
    return {
      logs: [],
      total: 0,
      filters: { memberId, startDate, endDate },
    };
  });

  fastify.post('/activity-logs', async (request, reply) => {
    const body = createActivityLogSchema.parse(request.body);
    const id = crypto.randomUUID();
    return reply.status(201).send({
      id,
      ...body,
      durationMinutes: body.durationMinutes,
      caloriesEstimate: body.caloriesEstimate ?? null,
      note: body.note ?? null,
      loggedAt: body.loggedAt ?? new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  });

  fastify.get('/activity-stats', async (request) => {
    const { memberId } = request.query as Record<string, string | undefined>;
    return {
      members: [],
      householdTotalMinutesToday: 0,
      householdTotalMinutesThisWeek: 0,
      mostActiveCategory: 'chores',
      averageMinutesPerMember: 0,
      filters: { memberId },
    };
  });

  fastify.get('/activity-goals', async () => {
    return { goals: [] };
  });

  fastify.post('/activity-goals', async (request, reply) => {
    const body = activityGoalSchema.parse(request.body);
    return reply.status(201).send({
      id: crypto.randomUUID(),
      ...body,
      category: body.category ?? 'all',
      targetMinutesPerDay: body.targetMinutesPerDay ?? 60,
      targetMinutesPerWeek: body.targetMinutesPerWeek ?? 300,
      isActive: body.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  fastify.patch('/activity-goals/:goalId', async (request) => {
    const { goalId } = request.params as { goalId: string };
    const body = activityGoalSchema.parse(request.body);
    return { id: goalId, ...body, updatedAt: new Date().toISOString() };
  });

  // ===== F14.2: Wellness Check-ins =====

  fastify.get('/wellness/check-ins', async (request) => {
    const { memberId, limit } = request.query as Record<string, string | undefined>;
    return { checkIns: [], total: 0, filters: { memberId, limit } };
  });

  fastify.post('/wellness/check-ins', async (request, reply) => {
    const body = createCheckInSchema.parse(request.body);
    return reply.status(201).send({
      id: crypto.randomUUID(),
      ...body,
      stressScore: body.stressScore ?? null,
      sleepQualityScore: body.sleepQualityScore ?? null,
      note: body.note ?? null,
      checkedInAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  });

  fastify.get('/wellness/trends', async (request) => {
    const { memberId, days } = request.query as Record<string, string | undefined>;
    return {
      moodTrend: [],
      energyTrend: [],
      stressTrend: [],
      averageMood: 0,
      averageEnergy: 0,
      filters: { memberId, days: days ?? '30' },
    };
  });

  // ===== F14.3: Sleep & Routine Management =====

  fastify.get('/sleep-logs', async (request) => {
    const { memberId } = request.query as Record<string, string | undefined>;
    return { logs: [], total: 0, filters: { memberId } };
  });

  fastify.post('/sleep-logs', async (request, reply) => {
    const body = createSleepLogSchema.parse(request.body);
    const bedtime = new Date(body.bedtime);
    const wakeTime = new Date(body.wakeTime);
    const durationMinutes = Math.round((wakeTime.getTime() - bedtime.getTime()) / 60000);
    return reply.status(201).send({
      id: crypto.randomUUID(),
      ...body,
      durationMinutes: Math.max(0, durationMinutes),
      qualityScore: body.qualityScore ?? null,
      note: body.note ?? null,
      logDate: body.bedtime,
      createdAt: new Date().toISOString(),
    });
  });

  fastify.get('/sleep-stats', async (request) => {
    const { memberId, days } = request.query as Record<string, string | undefined>;
    return {
      averageDurationMinutes: 0,
      averageQuality: 0,
      averageBedtime: null,
      averageWakeTime: null,
      consistencyScore: 0,
      weeklyTrend: [],
      filters: { memberId, days: days ?? '14' },
    };
  });

  // ===== F14.4: Nutrition & Meal Planning =====

  fastify.get('/meal-plans', async (request) => {
    const { startDate, endDate } = request.query as Record<string, string | undefined>;
    return { plans: [], total: 0, filters: { startDate, endDate } };
  });

  fastify.post('/meal-plans', async (request, reply) => {
    const body = createMealPlanSchema.parse(request.body);
    return reply.status(201).send({
      id: crypto.randomUUID(),
      ...body,
      description: body.description ?? null,
      servings: body.servings ?? 4,
      prepTimeMinutes: body.prepTimeMinutes ?? null,
      cookTimeMinutes: body.cookTimeMinutes ?? null,
      calories: body.calories ?? null,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    });
  });

  fastify.patch('/meal-plans/:planId', async (request) => {
    const { planId } = request.params as { planId: string };
    const body = request.body as Record<string, unknown>;
    return { id: planId, ...body, updatedAt: new Date().toISOString() };
  });

  fastify.delete('/meal-plans/:planId', async (_request, reply) => {
    return reply.status(204).send();
  });

  // ===== F14.5: Mental Health Support =====

  fastify.get('/mental-health/resources', async (request) => {
    const { category } = request.query as Record<string, string | undefined>;
    return { resources: [], total: 0, filters: { category } };
  });

  fastify.post('/mental-health/resources', async (request, reply) => {
    const body = createResourceSchema.parse(request.body);
    return reply.status(201).send({
      id: crypto.randomUUID(),
      ...body,
      description: body.description ?? null,
      resourceUrl: body.resourceUrl ?? null,
      ageRange: body.ageRange ?? null,
      isPinned: false,
      createdAt: new Date().toISOString(),
    });
  });

  fastify.get('/mental-health/gratitude', async (request) => {
    const { memberId } = request.query as Record<string, string | undefined>;
    return { entries: [], total: 0, filters: { memberId } };
  });

  fastify.post('/mental-health/gratitude', async (request, reply) => {
    const body = createGratitudeSchema.parse(request.body);
    return reply.status(201).send({
      id: crypto.randomUUID(),
      ...body,
      createdAt: new Date().toISOString(),
    });
  });

  fastify.get('/mental-health/mood-journal', async (request) => {
    const { memberId, days } = request.query as Record<string, string | undefined>;
    return {
      entries: [],
      streakDays: 0,
      averageMood: 0,
      filters: { memberId, days: days ?? '30' },
    };
  });
}
