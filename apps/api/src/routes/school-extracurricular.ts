import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '@chorechamp/database';
import {
  schoolSchedules,
  classPeriods,
  extracurricularActivities,
  activitySchedules,
  activityEvents,
  practiceLogs,
  volunteerLogs,
  collegePrepActivities,
  scheduleConflicts,
  balanceRecommendations,
  teamRosters,
} from '@chorechamp/database/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Validation schemas
const dayOfWeekSchema = z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
const activityCategorySchema = z.enum(['sports', 'music', 'arts', 'academic', 'volunteer', 'club', 'religious', 'other']);
const eventTypeSchema = z.enum(['practice', 'game', 'competition', 'performance', 'meeting', 'class', 'volunteer', 'other']);
const seasonTypeSchema = z.enum(['fall', 'winter', 'spring', 'summer', 'year_round']);
const commitmentLevelSchema = z.enum(['low', 'medium', 'high', 'competitive']);

const breakTimeSchema = z.object({
  name: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});

const createSchoolScheduleSchema = z.object({
  memberId: z.string().uuid(),
  schoolName: z.string().min(1),
  schoolYear: z.string().min(1),
  gradeLevel: z.string().min(1),
  startTime: z.string(),
  endTime: z.string(),
  timezone: z.string().optional().default('America/New_York'),
  schoolDays: z.array(dayOfWeekSchema).min(1),
  lunchTime: z.string().optional(),
  breakTimes: z.array(breakTimeSchema).optional(),
});

const createClassPeriodSchema = z.object({
  scheduleId: z.string().uuid(),
  memberId: z.string().uuid(),
  className: z.string().min(1),
  teacherName: z.string().optional(),
  roomNumber: z.string().optional(),
  periodNumber: z.number().int().positive(),
  dayOfWeek: dayOfWeekSchema,
  startTime: z.string(),
  endTime: z.string(),
  color: z.string().optional(),
  notes: z.string().optional(),
});

const createActivitySchema = z.object({
  memberId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  category: activityCategorySchema,
  organization: z.string().optional(),
  coachName: z.string().optional(),
  coachContact: z.string().optional(),
  location: z.string().optional(),
  season: seasonTypeSchema,
  seasonStartDate: z.string().optional(),
  seasonEndDate: z.string().optional(),
  commitmentLevel: commitmentLevelSchema,
  weeklyHours: z.number().positive(),
  cost: z.number().optional(),
  equipmentNeeded: z.array(z.string()).optional(),
  choreAdjustmentPercent: z.number().min(0).max(100).optional().default(0),
});

const createActivityScheduleSchema = z.object({
  activityId: z.string().uuid(),
  memberId: z.string().uuid(),
  dayOfWeek: dayOfWeekSchema,
  startTime: z.string(),
  endTime: z.string(),
  eventType: eventTypeSchema,
  location: z.string().optional(),
  isRecurring: z.boolean().default(true),
  notes: z.string().optional(),
});

const createEventSchema = z.object({
  activityId: z.string().uuid(),
  memberId: z.string().uuid(),
  title: z.string().min(1),
  eventType: eventTypeSchema,
  eventDate: z.string(),
  startTime: z.string(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  opponent: z.string().optional(),
  isHomeGame: z.boolean().optional(),
  attendanceRequired: z.boolean().default(true),
  choreExemption: z.boolean().default(false),
  notes: z.string().optional(),
});

const logPracticeSchema = z.object({
  activityId: z.string().uuid(),
  memberId: z.string().uuid(),
  practiceDate: z.string(),
  durationMinutes: z.number().int().positive(),
  practiceType: z.enum(['team', 'individual', 'lesson', 'game']),
  intensityLevel: z.number().int().min(1).max(10),
  skillsFocused: z.array(z.string()).optional(),
  notes: z.string().optional(),
  coachFeedback: z.string().optional(),
  selfRating: z.number().int().min(1).max(5).optional(),
});

const logVolunteerSchema = z.object({
  memberId: z.string().uuid(),
  organizationName: z.string().min(1),
  activityDescription: z.string().min(1),
  volunteerDate: z.string(),
  hoursCompleted: z.number().positive(),
  supervisorName: z.string().optional(),
  supervisorContact: z.string().optional(),
  notes: z.string().optional(),
});

const createCollegePrepSchema = z.object({
  memberId: z.string().uuid(),
  activityType: z.enum(['test_prep', 'college_visit', 'application', 'essay', 'recommendation', 'interview', 'scholarship', 'other']),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  relatedCollege: z.string().optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

const createTeamRosterSchema = z.object({
  activityId: z.string().uuid(),
  memberName: z.string().min(1),
  position: z.string().optional(),
  jerseyNumber: z.number().int().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  parentName: z.string().optional(),
  notes: z.string().optional(),
});

// Helper to format date as ISO string for database
function toDateString(date: Date | string): string {
  if (typeof date === 'string') return date.split('T')[0];
  return date.toISOString().split('T')[0];
}

export async function schoolExtracurricularRoutes(fastify: FastifyInstance) {
  // ===== SCHOOL SCHEDULES =====

  // Get all school schedules for household
  fastify.get('/school-schedules', async (request) => {
    const { householdId } = request.params as { householdId: string };
    const { memberId } = request.query as { memberId?: string };

    const conditions = [eq(schoolSchedules.householdId, householdId)];
    if (memberId) {
      conditions.push(eq(schoolSchedules.memberId, memberId));
    }

    const schedules = await db.query.schoolSchedules.findMany({
      where: and(...conditions),
      orderBy: [desc(schoolSchedules.createdAt)],
    });

    return schedules;
  });

  // Create school schedule
  fastify.post('/school-schedules', async (request, reply) => {
    const { householdId } = request.params as { householdId: string };
    const input = createSchoolScheduleSchema.parse(request.body);

    const id = randomUUID();
    const now = new Date();

    await db.insert(schoolSchedules).values({
      id,
      householdId,
      memberId: input.memberId,
      schoolName: input.schoolName,
      schoolYear: input.schoolYear,
      gradeLevel: input.gradeLevel,
      startTime: input.startTime,
      endTime: input.endTime,
      timezone: input.timezone || 'America/New_York',
      schoolDays: input.schoolDays,
      lunchTime: input.lunchTime || null,
      breakTimes: input.breakTimes || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const schedule = await db.query.schoolSchedules.findFirst({
      where: eq(schoolSchedules.id, id),
    });

    return reply.status(201).send(schedule);
  });

  // Update school schedule
  fastify.patch('/school-schedules/:scheduleId', async (request) => {
    const { householdId, scheduleId } = request.params as { householdId: string; scheduleId: string };
    const updates = request.body as Record<string, unknown>;

    await db.update(schoolSchedules)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(
        eq(schoolSchedules.id, scheduleId),
        eq(schoolSchedules.householdId, householdId)
      ));

    const schedule = await db.query.schoolSchedules.findFirst({
      where: eq(schoolSchedules.id, scheduleId),
    });

    return schedule;
  });

  // Delete school schedule
  fastify.delete('/school-schedules/:scheduleId', async (request) => {
    const { householdId, scheduleId } = request.params as { householdId: string; scheduleId: string };

    await db.delete(schoolSchedules)
      .where(and(
        eq(schoolSchedules.id, scheduleId),
        eq(schoolSchedules.householdId, householdId)
      ));

    return { success: true };
  });

  // ===== CLASS PERIODS =====

  // Get class periods for a schedule
  fastify.get('/class-periods', async (request) => {
    const { householdId } = request.params as { householdId: string };
    const { scheduleId, memberId, dayOfWeek } = request.query as {
      scheduleId?: string;
      memberId?: string;
      dayOfWeek?: string;
    };

    const conditions = [eq(classPeriods.householdId, householdId)];
    if (scheduleId) conditions.push(eq(classPeriods.scheduleId, scheduleId));
    if (memberId) conditions.push(eq(classPeriods.memberId, memberId));
    if (dayOfWeek) conditions.push(eq(classPeriods.dayOfWeek, dayOfWeek as typeof classPeriods.dayOfWeek._.data));

    const periods = await db.query.classPeriods.findMany({
      where: and(...conditions),
      orderBy: [classPeriods.periodNumber],
    });

    return periods;
  });

  // Create class period
  fastify.post('/class-periods', async (request, reply) => {
    const { householdId } = request.params as { householdId: string };
    const input = createClassPeriodSchema.parse(request.body);

    const id = randomUUID();
    const now = new Date();

    await db.insert(classPeriods).values({
      id,
      householdId,
      scheduleId: input.scheduleId,
      memberId: input.memberId,
      className: input.className,
      teacherName: input.teacherName || null,
      roomNumber: input.roomNumber || null,
      periodNumber: input.periodNumber,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      color: input.color || null,
      notes: input.notes || null,
      createdAt: now,
      updatedAt: now,
    });

    const period = await db.query.classPeriods.findFirst({
      where: eq(classPeriods.id, id),
    });

    return reply.status(201).send(period);
  });

  // Bulk create class periods
  fastify.post('/class-periods/bulk', async (request, reply) => {
    const { householdId } = request.params as { householdId: string };
    const { periods } = request.body as { periods: z.infer<typeof createClassPeriodSchema>[] };

    const now = new Date();
    const createdPeriods = [];

    for (const input of periods) {
      const id = randomUUID();
      await db.insert(classPeriods).values({
        id,
        householdId,
        scheduleId: input.scheduleId,
        memberId: input.memberId,
        className: input.className,
        teacherName: input.teacherName || null,
        roomNumber: input.roomNumber || null,
        periodNumber: input.periodNumber,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        color: input.color || null,
        notes: input.notes || null,
        createdAt: now,
        updatedAt: now,
      });
      createdPeriods.push(id);
    }

    return reply.status(201).send({ created: createdPeriods.length });
  });

  // Delete class period
  fastify.delete('/class-periods/:periodId', async (request) => {
    const { householdId, periodId } = request.params as { householdId: string; periodId: string };

    await db.delete(classPeriods)
      .where(and(
        eq(classPeriods.id, periodId),
        eq(classPeriods.householdId, householdId)
      ));

    return { success: true };
  });

  // ===== EXTRACURRICULAR ACTIVITIES =====

  // Get all activities for household
  fastify.get('/activities', async (request) => {
    const { householdId } = request.params as { householdId: string };
    const { memberId, category, season, isActive } = request.query as {
      memberId?: string;
      category?: string;
      season?: string;
      isActive?: string;
    };

    const conditions = [eq(extracurricularActivities.householdId, householdId)];
    if (memberId) conditions.push(eq(extracurricularActivities.memberId, memberId));
    if (category) conditions.push(eq(extracurricularActivities.category, category as typeof extracurricularActivities.category._.data));
    if (season) conditions.push(eq(extracurricularActivities.season, season as typeof extracurricularActivities.season._.data));
    if (isActive !== undefined) conditions.push(eq(extracurricularActivities.isActive, isActive === 'true'));

    const activities = await db.query.extracurricularActivities.findMany({
      where: and(...conditions),
      orderBy: [desc(extracurricularActivities.createdAt)],
    });

    return activities;
  });

  // Get activity by ID
  fastify.get('/activities/:activityId', async (request, reply) => {
    const { householdId, activityId } = request.params as { householdId: string; activityId: string };

    const activity = await db.query.extracurricularActivities.findFirst({
      where: and(
        eq(extracurricularActivities.id, activityId),
        eq(extracurricularActivities.householdId, householdId)
      ),
    });

    if (!activity) {
      return reply.status(404).send({ error: 'Activity not found' });
    }

    return activity;
  });

  // Create activity
  fastify.post('/activities', async (request, reply) => {
    const { householdId } = request.params as { householdId: string };
    const input = createActivitySchema.parse(request.body);

    const now = new Date();

    // Calculate chore adjustment based on commitment level if not provided
    let choreAdjustment = input.choreAdjustmentPercent;
    if (!choreAdjustment) {
      const adjustments: Record<string, number> = {
        low: 0,
        medium: 15,
        high: 25,
        competitive: 40,
      };
      choreAdjustment = adjustments[input.commitmentLevel] || 0;
    }

    await db.insert(extracurricularActivities).values({
      householdId,
      memberId: input.memberId,
      name: input.name,
      description: input.description || null,
      category: input.category,
      organization: input.organization || null,
      coachName: input.coachName || null,
      coachContact: input.coachContact || null,
      location: input.location || null,
      season: input.season,
      seasonStartDate: input.seasonStartDate || null,
      seasonEndDate: input.seasonEndDate || null,
      commitmentLevel: input.commitmentLevel,
      weeklyHours: input.weeklyHours,
      cost: input.cost || null,
      equipmentNeeded: input.equipmentNeeded || null,
      choreAdjustmentPercent: choreAdjustment,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const activity = await db.query.extracurricularActivities.findFirst({
      where: eq(extracurricularActivities.name, input.name),
      orderBy: [desc(extracurricularActivities.createdAt)],
    });

    return reply.status(201).send(activity);
  });

  // Update activity
  fastify.patch('/activities/:activityId', async (request) => {
    const { householdId, activityId } = request.params as { householdId: string; activityId: string };
    const updates = request.body as Record<string, unknown>;

    await db.update(extracurricularActivities)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(
        eq(extracurricularActivities.id, activityId),
        eq(extracurricularActivities.householdId, householdId)
      ));

    const activity = await db.query.extracurricularActivities.findFirst({
      where: eq(extracurricularActivities.id, activityId),
    });

    return activity;
  });

  // Delete activity
  fastify.delete('/activities/:activityId', async (request) => {
    const { householdId, activityId } = request.params as { householdId: string; activityId: string };

    await db.delete(extracurricularActivities)
      .where(and(
        eq(extracurricularActivities.id, activityId),
        eq(extracurricularActivities.householdId, householdId)
      ));

    return { success: true };
  });

  // ===== ACTIVITY SCHEDULES =====

  // Get activity schedules
  fastify.get('/activity-schedules', async (request) => {
    const { householdId } = request.params as { householdId: string };
    const { activityId, memberId, dayOfWeek } = request.query as {
      activityId?: string;
      memberId?: string;
      dayOfWeek?: string;
    };

    const conditions = [eq(activitySchedules.householdId, householdId)];
    if (activityId) conditions.push(eq(activitySchedules.activityId, activityId));
    if (memberId) conditions.push(eq(activitySchedules.memberId, memberId));
    if (dayOfWeek) conditions.push(eq(activitySchedules.dayOfWeek, dayOfWeek as typeof activitySchedules.dayOfWeek._.data));

    const schedules = await db.query.activitySchedules.findMany({
      where: and(...conditions),
      orderBy: [activitySchedules.dayOfWeek, activitySchedules.startTime],
    });

    return schedules;
  });

  // Create activity schedule
  fastify.post('/activity-schedules', async (request, reply) => {
    const { householdId } = request.params as { householdId: string };
    const input = createActivityScheduleSchema.parse(request.body);

    await db.insert(activitySchedules).values({
      householdId,
      activityId: input.activityId,
      memberId: input.memberId,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      eventType: input.eventType,
      location: input.location || null,
      isRecurring: input.isRecurring,
      notes: input.notes || null,
      createdAt: new Date(),
    });

    const schedule = await db.query.activitySchedules.findFirst({
      where: and(
        eq(activitySchedules.activityId, input.activityId),
        eq(activitySchedules.dayOfWeek, input.dayOfWeek)
      ),
      orderBy: [desc(activitySchedules.createdAt)],
    });

    return reply.status(201).send(schedule);
  });

  // Delete activity schedule
  fastify.delete('/activity-schedules/:scheduleId', async (request) => {
    const { householdId, scheduleId } = request.params as { householdId: string; scheduleId: string };

    await db.delete(activitySchedules)
      .where(and(
        eq(activitySchedules.id, scheduleId),
        eq(activitySchedules.householdId, householdId)
      ));

    return { success: true };
  });

  // ===== ACTIVITY EVENTS =====

  // Get activity events
  fastify.get('/events', async (request) => {
    const { householdId } = request.params as { householdId: string };
    const { activityId, memberId, startDate, endDate, eventType } = request.query as {
      activityId?: string;
      memberId?: string;
      startDate?: string;
      endDate?: string;
      eventType?: string;
    };

    const conditions = [eq(activityEvents.householdId, householdId)];
    if (activityId) conditions.push(eq(activityEvents.activityId, activityId));
    if (memberId) conditions.push(eq(activityEvents.memberId, memberId));
    if (startDate) conditions.push(gte(activityEvents.eventDate, startDate));
    if (endDate) conditions.push(lte(activityEvents.eventDate, endDate));
    if (eventType) conditions.push(eq(activityEvents.eventType, eventType as typeof activityEvents.eventType._.data));

    const events = await db.query.activityEvents.findMany({
      where: and(...conditions),
      orderBy: [activityEvents.eventDate, activityEvents.startTime],
    });

    return events;
  });

  // Create event
  fastify.post('/events', async (request, reply) => {
    const { householdId } = request.params as { householdId: string };
    const input = createEventSchema.parse(request.body);

    const now = new Date();

    await db.insert(activityEvents).values({
      householdId,
      activityId: input.activityId,
      memberId: input.memberId,
      title: input.title,
      eventType: input.eventType,
      eventDate: toDateString(input.eventDate),
      startTime: input.startTime,
      endTime: input.endTime || null,
      location: input.location || null,
      opponent: input.opponent || null,
      isHomeGame: input.isHomeGame || null,
      attendanceRequired: input.attendanceRequired,
      choreExemption: input.choreExemption,
      notes: input.notes || null,
      reminderSent: false,
      createdAt: now,
      updatedAt: now,
    });

    const event = await db.query.activityEvents.findFirst({
      where: eq(activityEvents.title, input.title),
      orderBy: [desc(activityEvents.createdAt)],
    });

    // Check for conflicts
    await detectConflicts(householdId, input.memberId, input.eventDate);

    return reply.status(201).send(event);
  });

  // Update event
  fastify.patch('/events/:eventId', async (request) => {
    const { householdId, eventId } = request.params as { householdId: string; eventId: string };
    const updates = request.body as Record<string, unknown>;

    if (updates.eventDate && typeof updates.eventDate === 'string') {
      updates.eventDate = toDateString(updates.eventDate);
    }

    await db.update(activityEvents)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(
        eq(activityEvents.id, eventId),
        eq(activityEvents.householdId, householdId)
      ));

    const event = await db.query.activityEvents.findFirst({
      where: eq(activityEvents.id, eventId),
    });

    return event;
  });

  // Delete event
  fastify.delete('/events/:eventId', async (request) => {
    const { householdId, eventId } = request.params as { householdId: string; eventId: string };

    await db.delete(activityEvents)
      .where(and(
        eq(activityEvents.id, eventId),
        eq(activityEvents.householdId, householdId)
      ));

    return { success: true };
  });

  // ===== PRACTICE LOGS =====

  // Get practice logs
  fastify.get('/practice-logs', async (request) => {
    const { householdId } = request.params as { householdId: string };
    const { activityId, memberId, startDate, endDate } = request.query as {
      activityId?: string;
      memberId?: string;
      startDate?: string;
      endDate?: string;
    };

    const conditions = [eq(practiceLogs.householdId, householdId)];
    if (activityId) conditions.push(eq(practiceLogs.activityId, activityId));
    if (memberId) conditions.push(eq(practiceLogs.memberId, memberId));
    if (startDate) conditions.push(gte(practiceLogs.practiceDate, startDate));
    if (endDate) conditions.push(lte(practiceLogs.practiceDate, endDate));

    const logs = await db.query.practiceLogs.findMany({
      where: and(...conditions),
      orderBy: [desc(practiceLogs.practiceDate)],
    });

    return logs;
  });

  // Log practice
  fastify.post('/practice-logs', async (request, reply) => {
    const { householdId } = request.params as { householdId: string };
    const input = logPracticeSchema.parse(request.body);

    await db.insert(practiceLogs).values({
      householdId,
      activityId: input.activityId,
      memberId: input.memberId,
      practiceDate: toDateString(input.practiceDate),
      durationMinutes: input.durationMinutes,
      practiceType: input.practiceType,
      intensityLevel: input.intensityLevel,
      skillsFocused: input.skillsFocused || null,
      notes: input.notes || null,
      coachFeedback: input.coachFeedback || null,
      selfRating: input.selfRating || null,
      createdAt: new Date(),
    });

    const log = await db.query.practiceLogs.findFirst({
      where: eq(practiceLogs.activityId, input.activityId),
      orderBy: [desc(practiceLogs.createdAt)],
    });

    return reply.status(201).send(log);
  });

  // Get practice statistics
  fastify.get('/practice-logs/stats', async (request) => {
    const { householdId } = request.params as { householdId: string };
    const { memberId, activityId } = request.query as { memberId?: string; activityId?: string };

    const conditions = [eq(practiceLogs.householdId, householdId)];
    if (memberId) conditions.push(eq(practiceLogs.memberId, memberId));
    if (activityId) conditions.push(eq(practiceLogs.activityId, activityId));

    const logs = await db.query.practiceLogs.findMany({
      where: and(...conditions),
    });

    let totalMinutes = 0;
    const totalSessions = logs.length;
    let totalIntensity = 0;

    for (const log of logs) {
      totalMinutes += log.durationMinutes;
      totalIntensity += log.intensityLevel;
    }

    return {
      totalSessions,
      totalMinutes,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      averageIntensity: totalSessions > 0 ? Math.round(totalIntensity / totalSessions * 10) / 10 : 0,
      averageSessionLength: totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0,
    };
  });

  // ===== VOLUNTEER LOGS =====

  // Get volunteer logs
  fastify.get('/volunteer-logs', async (request) => {
    const { householdId } = request.params as { householdId: string };
    const { memberId, verified, startDate, endDate } = request.query as {
      memberId?: string;
      verified?: string;
      startDate?: string;
      endDate?: string;
    };

    const conditions = [eq(volunteerLogs.householdId, householdId)];
    if (memberId) conditions.push(eq(volunteerLogs.memberId, memberId));
    if (verified !== undefined) conditions.push(eq(volunteerLogs.verified, verified === 'true'));
    if (startDate) conditions.push(gte(volunteerLogs.volunteerDate, startDate));
    if (endDate) conditions.push(lte(volunteerLogs.volunteerDate, endDate));

    const logs = await db.query.volunteerLogs.findMany({
      where: and(...conditions),
      orderBy: [desc(volunteerLogs.volunteerDate)],
    });

    return logs;
  });

  // Log volunteer hours
  fastify.post('/volunteer-logs', async (request, reply) => {
    const { householdId } = request.params as { householdId: string };
    const input = logVolunteerSchema.parse(request.body);

    const now = new Date();

    await db.insert(volunteerLogs).values({
      householdId,
      memberId: input.memberId,
      organizationName: input.organizationName,
      activityDescription: input.activityDescription,
      volunteerDate: toDateString(input.volunteerDate),
      hoursCompleted: input.hoursCompleted,
      supervisorName: input.supervisorName || null,
      supervisorContact: input.supervisorContact || null,
      verified: false,
      notes: input.notes || null,
      createdAt: now,
      updatedAt: now,
    });

    const log = await db.query.volunteerLogs.findFirst({
      where: eq(volunteerLogs.memberId, input.memberId),
      orderBy: [desc(volunteerLogs.createdAt)],
    });

    return reply.status(201).send(log);
  });

  // Verify volunteer hours
  fastify.post('/volunteer-logs/:logId/verify', async (request) => {
    const { householdId, logId } = request.params as { householdId: string; logId: string };
    const { verifiedBy } = request.body as { verifiedBy: string };

    await db.update(volunteerLogs)
      .set({
        verified: true,
        verifiedAt: new Date(),
        verifiedBy,
        updatedAt: new Date(),
      })
      .where(and(
        eq(volunteerLogs.id, logId),
        eq(volunteerLogs.householdId, householdId)
      ));

    const log = await db.query.volunteerLogs.findFirst({
      where: eq(volunteerLogs.id, logId),
    });

    return log;
  });

  // Get volunteer statistics
  fastify.get('/volunteer-logs/stats', async (request) => {
    const { householdId } = request.params as { householdId: string };
    const { memberId } = request.query as { memberId?: string };

    const conditions = [eq(volunteerLogs.householdId, householdId)];
    if (memberId) conditions.push(eq(volunteerLogs.memberId, memberId));

    const logs = await db.query.volunteerLogs.findMany({
      where: and(...conditions),
    });

    let totalHours = 0;
    let verifiedHours = 0;
    const organizations = new Set<string>();

    for (const log of logs) {
      totalHours += log.hoursCompleted;
      if (log.verified) {
        verifiedHours += log.hoursCompleted;
      }
      organizations.add(log.organizationName);
    }

    return {
      totalEntries: logs.length,
      totalHours: Math.round(totalHours * 10) / 10,
      verifiedHours: Math.round(verifiedHours * 10) / 10,
      unverifiedHours: Math.round((totalHours - verifiedHours) * 10) / 10,
      uniqueOrganizations: organizations.size,
    };
  });

  // ===== COLLEGE PREP ACTIVITIES =====

  // Get college prep activities
  fastify.get('/college-prep', async (request) => {
    const { householdId } = request.params as { householdId: string };
    const { memberId, status, activityType } = request.query as {
      memberId?: string;
      status?: string;
      activityType?: string;
    };

    const conditions = [eq(collegePrepActivities.householdId, householdId)];
    if (memberId) conditions.push(eq(collegePrepActivities.memberId, memberId));
    if (status) conditions.push(eq(collegePrepActivities.status, status as typeof collegePrepActivities.status._.data));
    if (activityType) conditions.push(eq(collegePrepActivities.activityType, activityType as typeof collegePrepActivities.activityType._.data));

    const activities = await db.query.collegePrepActivities.findMany({
      where: and(...conditions),
      orderBy: [collegePrepActivities.dueDate, desc(collegePrepActivities.createdAt)],
    });

    return activities;
  });

  // Create college prep activity
  fastify.post('/college-prep', async (request, reply) => {
    const { householdId } = request.params as { householdId: string };
    const input = createCollegePrepSchema.parse(request.body);

    const now = new Date();

    await db.insert(collegePrepActivities).values({
      householdId,
      memberId: input.memberId,
      activityType: input.activityType,
      title: input.title,
      description: input.description || null,
      dueDate: input.dueDate || null,
      status: 'not_started',
      priority: input.priority,
      relatedCollege: input.relatedCollege || null,
      notes: input.notes || null,
      attachments: input.attachments || null,
      createdAt: now,
      updatedAt: now,
    });

    const activity = await db.query.collegePrepActivities.findFirst({
      where: eq(collegePrepActivities.title, input.title),
      orderBy: [desc(collegePrepActivities.createdAt)],
    });

    return reply.status(201).send(activity);
  });

  // Update college prep activity
  fastify.patch('/college-prep/:activityId', async (request) => {
    const { householdId, activityId } = request.params as { householdId: string; activityId: string };
    const updates = request.body as Record<string, unknown>;

    if (updates.status === 'completed' && !updates.completedAt) {
      updates.completedAt = new Date();
    }

    await db.update(collegePrepActivities)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(
        eq(collegePrepActivities.id, activityId),
        eq(collegePrepActivities.householdId, householdId)
      ));

    const activity = await db.query.collegePrepActivities.findFirst({
      where: eq(collegePrepActivities.id, activityId),
    });

    return activity;
  });

  // Delete college prep activity
  fastify.delete('/college-prep/:activityId', async (request) => {
    const { householdId, activityId } = request.params as { householdId: string; activityId: string };

    await db.delete(collegePrepActivities)
      .where(and(
        eq(collegePrepActivities.id, activityId),
        eq(collegePrepActivities.householdId, householdId)
      ));

    return { success: true };
  });

  // ===== SCHEDULE CONFLICTS =====

  // Get schedule conflicts
  fastify.get('/conflicts', async (request) => {
    const { householdId } = request.params as { householdId: string };
    const { memberId, resolved, startDate, endDate } = request.query as {
      memberId?: string;
      resolved?: string;
      startDate?: string;
      endDate?: string;
    };

    const conditions = [eq(scheduleConflicts.householdId, householdId)];
    if (memberId) conditions.push(eq(scheduleConflicts.memberId, memberId));
    if (resolved !== undefined) conditions.push(eq(scheduleConflicts.resolved, resolved === 'true'));
    if (startDate) conditions.push(gte(scheduleConflicts.conflictDate, startDate));
    if (endDate) conditions.push(lte(scheduleConflicts.conflictDate, endDate));

    const conflicts = await db.query.scheduleConflicts.findMany({
      where: and(...conditions),
      orderBy: [scheduleConflicts.conflictDate],
    });

    return conflicts;
  });

  // Resolve conflict
  fastify.post('/conflicts/:conflictId/resolve', async (request) => {
    const { householdId, conflictId } = request.params as { householdId: string; conflictId: string };
    const { resolution } = request.body as { resolution: string };

    await db.update(scheduleConflicts)
      .set({
        resolved: true,
        resolution,
      })
      .where(and(
        eq(scheduleConflicts.id, conflictId),
        eq(scheduleConflicts.householdId, householdId)
      ));

    const conflict = await db.query.scheduleConflicts.findFirst({
      where: eq(scheduleConflicts.id, conflictId),
    });

    return conflict;
  });

  // ===== BALANCE RECOMMENDATIONS =====

  // Get balance recommendations
  fastify.get('/recommendations', async (request) => {
    const { householdId } = request.params as { householdId: string };
    const { memberId, acknowledged } = request.query as {
      memberId?: string;
      acknowledged?: string;
    };

    const conditions = [eq(balanceRecommendations.householdId, householdId)];
    if (memberId) conditions.push(eq(balanceRecommendations.memberId, memberId));
    if (acknowledged !== undefined) conditions.push(eq(balanceRecommendations.acknowledged, acknowledged === 'true'));

    const recommendations = await db.query.balanceRecommendations.findMany({
      where: and(...conditions),
      orderBy: [desc(balanceRecommendations.createdAt)],
    });

    return recommendations;
  });

  // Generate balance recommendations for a member
  fastify.post('/recommendations/generate', async (request) => {
    const { householdId } = request.params as { householdId: string };
    const { memberId } = request.body as { memberId: string };

    // Calculate balance metrics
    const metrics = await calculateBalanceMetrics(householdId, memberId);
    const recommendations: string[] = [];

    // Check for overcommitment
    const totalCommittedHours = metrics.weeklySchoolHours + metrics.weeklyActivityHours + metrics.weeklyChoreHours;
    const recommendedMaxHours = 50; // Reasonable max for a student

    if (totalCommittedHours > recommendedMaxHours) {
      await db.insert(balanceRecommendations).values({
        householdId,
        memberId,
        recommendationType: 'reduce_activities',
        title: 'Schedule Overload Detected',
        description: `Weekly committed hours (${totalCommittedHours}) exceed recommended maximum. Consider reducing activities or adjusting chore load.`,
        priority: 'high',
        metrics,
        acknowledged: false,
        createdAt: new Date(),
      });
      recommendations.push('reduce_activities');
    }

    // Check for low free time
    const totalWeekHours = 168;
    const sleepHours = metrics.sleepHoursAverage * 7;
    const freeTime = totalWeekHours - totalCommittedHours - sleepHours;

    if (freeTime < 20) {
      await db.insert(balanceRecommendations).values({
        householdId,
        memberId,
        recommendationType: 'rest_day',
        title: 'Limited Free Time',
        description: `Estimated free time (${Math.round(freeTime)} hours/week) is below recommended minimum. Consider scheduling dedicated rest days.`,
        priority: 'medium',
        metrics,
        acknowledged: false,
        createdAt: new Date(),
      });
      recommendations.push('rest_day');
    }

    return { generated: recommendations.length, recommendations };
  });

  // Acknowledge recommendation
  fastify.post('/recommendations/:recommendationId/acknowledge', async (request) => {
    const { householdId, recommendationId } = request.params as { householdId: string; recommendationId: string };

    await db.update(balanceRecommendations)
      .set({
        acknowledged: true,
        acknowledgedAt: new Date(),
      })
      .where(and(
        eq(balanceRecommendations.id, recommendationId),
        eq(balanceRecommendations.householdId, householdId)
      ));

    const recommendation = await db.query.balanceRecommendations.findFirst({
      where: eq(balanceRecommendations.id, recommendationId),
    });

    return recommendation;
  });

  // ===== TEAM ROSTERS =====

  // Get team roster
  fastify.get('/team-rosters', async (request) => {
    const { householdId } = request.params as { householdId: string };
    const { activityId } = request.query as { activityId?: string };

    const conditions = [eq(teamRosters.householdId, householdId)];
    if (activityId) conditions.push(eq(teamRosters.activityId, activityId));

    const roster = await db.query.teamRosters.findMany({
      where: and(...conditions),
      orderBy: [teamRosters.memberName],
    });

    return roster;
  });

  // Add team member
  fastify.post('/team-rosters', async (request, reply) => {
    const { householdId } = request.params as { householdId: string };
    const input = createTeamRosterSchema.parse(request.body);

    await db.insert(teamRosters).values({
      householdId,
      activityId: input.activityId,
      memberName: input.memberName,
      position: input.position || null,
      jerseyNumber: input.jerseyNumber || null,
      contactEmail: input.contactEmail || null,
      contactPhone: input.contactPhone || null,
      parentName: input.parentName || null,
      notes: input.notes || null,
      createdAt: new Date(),
    });

    const member = await db.query.teamRosters.findFirst({
      where: eq(teamRosters.memberName, input.memberName),
      orderBy: [desc(teamRosters.createdAt)],
    });

    return reply.status(201).send(member);
  });

  // Update team member
  fastify.patch('/team-rosters/:rosterId', async (request) => {
    const { householdId, rosterId } = request.params as { householdId: string; rosterId: string };
    const updates = request.body as Record<string, unknown>;

    await db.update(teamRosters)
      .set(updates)
      .where(and(
        eq(teamRosters.id, rosterId),
        eq(teamRosters.householdId, householdId)
      ));

    const member = await db.query.teamRosters.findFirst({
      where: eq(teamRosters.id, rosterId),
    });

    return member;
  });

  // Delete team member
  fastify.delete('/team-rosters/:rosterId', async (request) => {
    const { householdId, rosterId } = request.params as { householdId: string; rosterId: string };

    await db.delete(teamRosters)
      .where(and(
        eq(teamRosters.id, rosterId),
        eq(teamRosters.householdId, householdId)
      ));

    return { success: true };
  });

  // ===== WEEKLY CALENDAR =====

  // Get combined weekly schedule
  fastify.get('/weekly-calendar', async (request) => {
    const { householdId } = request.params as { householdId: string };
    const { memberId, weekStart } = request.query as { memberId?: string; weekStart?: string };

    const startDate = weekStart ? new Date(weekStart) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    // Get school schedule
    const schoolConditions = [eq(schoolSchedules.householdId, householdId), eq(schoolSchedules.isActive, true)];
    if (memberId) schoolConditions.push(eq(schoolSchedules.memberId, memberId));

    const schools = await db.query.schoolSchedules.findMany({
      where: and(...schoolConditions),
    });

    // Get class periods
    const classConditions = [eq(classPeriods.householdId, householdId)];
    if (memberId) classConditions.push(eq(classPeriods.memberId, memberId));

    const classes = await db.query.classPeriods.findMany({
      where: and(...classConditions),
    });

    // Get activity schedules
    const activitySchedConditions = [eq(activitySchedules.householdId, householdId)];
    if (memberId) activitySchedConditions.push(eq(activitySchedules.memberId, memberId));

    const activityScheds = await db.query.activitySchedules.findMany({
      where: and(...activitySchedConditions),
    });

    // Get events in date range
    const eventConditions = [
      eq(activityEvents.householdId, householdId),
      gte(activityEvents.eventDate, toDateString(startDate)),
      lte(activityEvents.eventDate, toDateString(endDate)),
    ];
    if (memberId) eventConditions.push(eq(activityEvents.memberId, memberId));

    const events = await db.query.activityEvents.findMany({
      where: and(...eventConditions),
    });

    return {
      weekStart: startDate.toISOString(),
      weekEnd: endDate.toISOString(),
      schoolSchedules: schools,
      classPeriods: classes,
      activitySchedules: activityScheds,
      events,
    };
  });

  // ===== HELPER FUNCTIONS =====

  async function detectConflicts(householdId: string, memberId: string, dateStr: string) {
    // Get all events on this date
    const events = await db.query.activityEvents.findMany({
      where: and(
        eq(activityEvents.householdId, householdId),
        eq(activityEvents.memberId, memberId),
        eq(activityEvents.eventDate, toDateString(dateStr))
      ),
    });

    // Check for time overlaps
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];

        if (timeOverlaps(event1.startTime, event1.endTime, event2.startTime, event2.endTime)) {
          // Create conflict record
          await db.insert(scheduleConflicts).values({
            householdId,
            memberId,
            conflictDate: toDateString(dateStr),
            conflictType: 'activity_activity',
            item1Type: 'event',
            item1Id: event1.id,
            item1Name: event1.title,
            item2Type: 'event',
            item2Id: event2.id,
            item2Name: event2.title,
            resolved: false,
            createdAt: new Date(),
          });
        }
      }
    }
  }

  function timeOverlaps(start1: string, end1: string | null, start2: string, end2: string | null): boolean {
    const s1 = parseTime(start1);
    const e1 = end1 ? parseTime(end1) : s1 + 60;
    const s2 = parseTime(start2);
    const e2 = end2 ? parseTime(end2) : s2 + 60;

    return s1 < e2 && s2 < e1;
  }

  function parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  async function calculateBalanceMetrics(householdId: string, memberId: string) {
    // Get school schedule
    const school = await db.query.schoolSchedules.findFirst({
      where: and(
        eq(schoolSchedules.householdId, householdId),
        eq(schoolSchedules.memberId, memberId),
        eq(schoolSchedules.isActive, true)
      ),
    });

    let weeklySchoolHours = 0;
    if (school) {
      const schoolStart = parseTime(school.startTime);
      const schoolEnd = parseTime(school.endTime);
      const hoursPerDay = (schoolEnd - schoolStart) / 60;
      weeklySchoolHours = hoursPerDay * school.schoolDays.length;
    }

    // Get activities
    const activities = await db.query.extracurricularActivities.findMany({
      where: and(
        eq(extracurricularActivities.householdId, householdId),
        eq(extracurricularActivities.memberId, memberId),
        eq(extracurricularActivities.isActive, true)
      ),
    });

    let weeklyActivityHours = 0;
    for (const activity of activities) {
      weeklyActivityHours += activity.weeklyHours;
    }

    // Estimate chore hours (roughly 5-10 hours per week for typical household)
    const weeklyChoreHours = 7;

    // Estimate sleep hours
    const sleepHoursAverage = 8;

    // Calculate free time
    const totalWeekHours = 168;
    const committedHours = weeklySchoolHours + weeklyActivityHours + weeklyChoreHours + (sleepHoursAverage * 7);
    const weeklyFreeTimeHours = totalWeekHours - committedHours;

    // Determine stress indicators
    const stressIndicators: string[] = [];
    if (weeklyActivityHours > 20) stressIndicators.push('High activity hours');
    if (weeklyFreeTimeHours < 20) stressIndicators.push('Limited free time');
    if (activities.length > 3) stressIndicators.push('Multiple concurrent activities');

    return {
      weeklySchoolHours: Math.round(weeklySchoolHours * 10) / 10,
      weeklyActivityHours: Math.round(weeklyActivityHours * 10) / 10,
      weeklyChoreHours,
      weeklyFreeTimeHours: Math.round(weeklyFreeTimeHours * 10) / 10,
      sleepHoursAverage,
      stressIndicators,
    };
  }
}
