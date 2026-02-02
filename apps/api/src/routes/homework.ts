import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, desc, gte, lte, asc } from 'drizzle-orm';
import { db } from '@chorechamp/database';
import {
  subjects,
  assignments,
  studySessions,
  studyGoals,
  studyStreaks,
  studyPlans,
  members,
} from '@chorechamp/database/schema';
import { SUBJECT_COLORS, STUDY_METHODS } from '@chorechamp/types';

// Zod schemas
const createSubjectSchema = z.object({
  name: z.string().min(1).max(100),
  shortName: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  icon: z.string().max(50).optional(),
  teacherName: z.string().max(100).optional(),
  roomNumber: z.string().max(50).optional(),
  schedule: z.string().max(200).optional(),
  targetGrade: z.string().max(10).optional(),
  notifyBeforeClass: z.boolean().default(false),
  notifyMinutesBefore: z.number().min(5).max(120).default(15),
});

const createAssignmentSchema = z.object({
  memberId: z.string().uuid(),
  subjectId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  instructions: z.string().max(5000).optional(),
  assignmentType: z.enum([
    'homework', 'quiz', 'test', 'project', 'essay', 'reading', 'worksheet', 'other',
  ]).default('homework'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignedDate: z.string().optional(),
  dueDate: z.string(),
  estimatedMinutes: z.number().min(1).max(480).optional(),
  maxPoints: z.number().min(0).optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
  })).optional(),
  resourceLinks: z.array(z.string().url()).optional(),
  notes: z.string().max(2000).optional(),
});

const updateAssignmentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  instructions: z.string().max(5000).optional(),
  assignmentType: z.enum([
    'homework', 'quiz', 'test', 'project', 'essay', 'reading', 'worksheet', 'other',
  ]).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'overdue', 'submitted']).optional(),
  dueDate: z.string().optional(),
  estimatedMinutes: z.number().min(1).max(480).optional(),
  actualMinutes: z.number().min(0).optional(),
  maxPoints: z.number().min(0).optional(),
  earnedPoints: z.number().min(0).optional(),
  grade: z.string().max(10).optional(),
  notes: z.string().max(2000).optional(),
  parentNotes: z.string().max(2000).optional(),
});

const startSessionSchema = z.object({
  memberId: z.string().uuid(),
  subjectId: z.string().uuid().optional(),
  assignmentId: z.string().uuid().optional(),
  sessionType: z.enum([
    'homework', 'reading', 'practice', 'review', 'project', 'research', 'tutoring', 'group_study',
  ]),
  title: z.string().max(200).optional(),
  plannedDurationMinutes: z.number().min(5).max(240).optional(),
  studyMethod: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
});

const endSessionSchema = z.object({
  accomplishments: z.string().max(1000).optional(),
  pagesCovered: z.string().max(100).optional(),
  problemsCompleted: z.number().min(0).optional(),
  productivityRating: z.number().min(1).max(5).optional(),
  difficultyRating: z.number().min(1).max(5).optional(),
  comprehensionRating: z.number().min(1).max(5).optional(),
});

const createGoalSchema = z.object({
  memberId: z.string().uuid(),
  subjectId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  goalType: z.enum(['daily_minutes', 'weekly_minutes', 'assignments_per_week', 'grade_target', 'custom']),
  targetValue: z.number().min(1),
  periodType: z.enum(['daily', 'weekly', 'monthly', 'semester', 'custom']),
  startDate: z.string(),
  endDate: z.string().optional(),
  rewardPoints: z.number().min(0).optional(),
  rewardScreenTime: z.number().min(0).optional(),
  rewardDescription: z.string().max(200).optional(),
});

const createPlanSchema = z.object({
  memberId: z.string().uuid(),
  planType: z.enum(['daily', 'weekly']),
  date: z.string(),
  endDate: z.string().optional(),
  plannedItems: z.array(z.object({
    subjectId: z.string().uuid().nullable(),
    subjectName: z.string().nullable(),
    assignmentId: z.string().uuid().nullable(),
    assignmentTitle: z.string().nullable(),
    plannedMinutes: z.number().min(5),
    scheduledTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    notes: z.string().nullable(),
    isCompleted: z.boolean().default(false),
  })),
});

export async function homeworkRoutes(fastify: FastifyInstance) {
  // ========================================
  // Configuration Data
  // ========================================

  fastify.get('/homework/colors', async () => {
    return { colors: SUBJECT_COLORS };
  });

  fastify.get('/homework/study-methods', async () => {
    return { methods: STUDY_METHODS };
  });

  // ========================================
  // Subjects
  // ========================================

  fastify.get<{
    Params: { householdId: string };
    Querystring: { memberId?: string; includeArchived?: string };
  }>('/homework/subjects', async (request) => {
    const { householdId } = request.params;
    const { memberId, includeArchived } = request.query;

    const conditions = [eq(subjects.householdId, householdId)];
    if (memberId) {
      conditions.push(eq(subjects.memberId, memberId));
    }
    if (includeArchived !== 'true') {
      conditions.push(eq(subjects.isArchived, false));
    }

    const result = await db
      .select({
        subject: subjects,
        member: {
          id: members.id,
          name: members.name,
        },
      })
      .from(subjects)
      .leftJoin(members, eq(subjects.memberId, members.id))
      .where(and(...conditions))
      .orderBy(subjects.name);

    return {
      subjects: result.map((r) => ({
        ...r.subject,
        member: r.member,
      })),
    };
  });

  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof createSubjectSchema> & { memberId: string };
  }>('/homework/subjects', async (request, reply) => {
    const { householdId } = request.params;
    const { memberId, ...data } = createSubjectSchema.extend({
      memberId: z.string().uuid(),
    }).parse(request.body);

    const [subject] = await db
      .insert(subjects)
      .values({
        householdId,
        memberId,
        ...data,
      })
      .returning();

    return reply.status(201).send({ subject });
  });

  fastify.patch<{
    Params: { householdId: string; subjectId: string };
    Body: Partial<z.infer<typeof createSubjectSchema>> & { isArchived?: boolean; currentGrade?: string };
  }>('/homework/subjects/:subjectId', async (request, reply) => {
    const { householdId, subjectId } = request.params;
    const data = request.body;

    const existing = await db.query.subjects.findFirst({
      where: and(
        eq(subjects.id, subjectId),
        eq(subjects.householdId, householdId)
      ),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Subject not found' });
    }

    const [updated] = await db
      .update(subjects)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(subjects.id, subjectId))
      .returning();

    return { subject: updated };
  });

  fastify.delete<{
    Params: { householdId: string; subjectId: string };
  }>('/homework/subjects/:subjectId', async (request, reply) => {
    const { householdId, subjectId } = request.params;

    const existing = await db.query.subjects.findFirst({
      where: and(
        eq(subjects.id, subjectId),
        eq(subjects.householdId, householdId)
      ),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Subject not found' });
    }

    await db.delete(subjects).where(eq(subjects.id, subjectId));

    return { success: true };
  });

  // ========================================
  // Assignments
  // ========================================

  fastify.get<{
    Params: { householdId: string };
    Querystring: {
      memberId?: string;
      subjectId?: string;
      status?: string;
      dueBefore?: string;
      dueAfter?: string;
    };
  }>('/homework/assignments', async (request) => {
    const { householdId } = request.params;
    const { memberId, subjectId, status, dueBefore, dueAfter } = request.query;

    const conditions = [eq(assignments.householdId, householdId)];
    if (memberId) conditions.push(eq(assignments.memberId, memberId));
    if (subjectId) conditions.push(eq(assignments.subjectId, subjectId));
    if (status) conditions.push(eq(assignments.status, status));
    if (dueBefore) conditions.push(lte(assignments.dueDate, new Date(dueBefore)));
    if (dueAfter) conditions.push(gte(assignments.dueDate, new Date(dueAfter)));

    const result = await db
      .select({
        assignment: assignments,
        subject: {
          id: subjects.id,
          name: subjects.name,
          color: subjects.color,
        },
        member: {
          id: members.id,
          name: members.name,
        },
      })
      .from(assignments)
      .leftJoin(subjects, eq(assignments.subjectId, subjects.id))
      .leftJoin(members, eq(assignments.memberId, members.id))
      .where(and(...conditions))
      .orderBy(asc(assignments.dueDate));

    return {
      assignments: result.map((r) => ({
        ...r.assignment,
        subject: r.subject,
        member: r.member,
      })),
    };
  });

  fastify.get<{
    Params: { householdId: string; assignmentId: string };
  }>('/homework/assignments/:assignmentId', async (request, reply) => {
    const { householdId, assignmentId } = request.params;

    const result = await db
      .select({
        assignment: assignments,
        subject: {
          id: subjects.id,
          name: subjects.name,
          color: subjects.color,
        },
        member: {
          id: members.id,
          name: members.name,
        },
      })
      .from(assignments)
      .leftJoin(subjects, eq(assignments.subjectId, subjects.id))
      .leftJoin(members, eq(assignments.memberId, members.id))
      .where(and(
        eq(assignments.id, assignmentId),
        eq(assignments.householdId, householdId)
      ))
      .limit(1);

    if (result.length === 0) {
      return reply.status(404).send({ error: 'Assignment not found' });
    }

    return {
      assignment: {
        ...result[0].assignment,
        subject: result[0].subject,
        member: result[0].member,
      },
    };
  });

  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof createAssignmentSchema>;
  }>('/homework/assignments', async (request, reply) => {
    const { householdId } = request.params;
    const data = createAssignmentSchema.parse(request.body);

    const [assignment] = await db
      .insert(assignments)
      .values({
        householdId,
        memberId: data.memberId,
        subjectId: data.subjectId,
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        assignmentType: data.assignmentType,
        priority: data.priority,
        assignedDate: data.assignedDate,
        dueDate: new Date(data.dueDate),
        estimatedMinutes: data.estimatedMinutes,
        maxPoints: data.maxPoints,
        attachments: data.attachments,
        resourceLinks: data.resourceLinks,
        notes: data.notes,
      })
      .returning();

    return reply.status(201).send({ assignment });
  });

  fastify.patch<{
    Params: { householdId: string; assignmentId: string };
    Body: z.infer<typeof updateAssignmentSchema>;
  }>('/homework/assignments/:assignmentId', async (request, reply) => {
    const { householdId, assignmentId } = request.params;
    const data = updateAssignmentSchema.parse(request.body);

    const existing = await db.query.assignments.findFirst({
      where: and(
        eq(assignments.id, assignmentId),
        eq(assignments.householdId, householdId)
      ),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Assignment not found' });
    }

    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };

    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }

    // If status changed to completed, set completedAt
    if (data.status === 'completed' && existing.status !== 'completed') {
      updateData.completedAt = new Date();
    }

    // If status changed to submitted, set submittedAt
    if (data.status === 'submitted' && existing.status !== 'submitted') {
      updateData.submittedAt = new Date();
    }

    const [updated] = await db
      .update(assignments)
      .set(updateData)
      .where(eq(assignments.id, assignmentId))
      .returning();

    return { assignment: updated };
  });

  fastify.delete<{
    Params: { householdId: string; assignmentId: string };
  }>('/homework/assignments/:assignmentId', async (request, reply) => {
    const { householdId, assignmentId } = request.params;

    const existing = await db.query.assignments.findFirst({
      where: and(
        eq(assignments.id, assignmentId),
        eq(assignments.householdId, householdId)
      ),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Assignment not found' });
    }

    await db.delete(assignments).where(eq(assignments.id, assignmentId));

    return { success: true };
  });

  // ========================================
  // Study Sessions
  // ========================================

  fastify.get<{
    Params: { householdId: string };
    Querystring: {
      memberId?: string;
      subjectId?: string;
      startAfter?: string;
      startBefore?: string;
      limit?: string;
    };
  }>('/homework/sessions', async (request) => {
    const { householdId } = request.params;
    const { memberId, subjectId, startAfter, startBefore, limit } = request.query;

    const conditions = [eq(studySessions.householdId, householdId)];
    if (memberId) conditions.push(eq(studySessions.memberId, memberId));
    if (subjectId) conditions.push(eq(studySessions.subjectId, subjectId));
    if (startAfter) conditions.push(gte(studySessions.startedAt, new Date(startAfter)));
    if (startBefore) conditions.push(lte(studySessions.startedAt, new Date(startBefore)));

    const result = await db
      .select({
        session: studySessions,
        subject: {
          id: subjects.id,
          name: subjects.name,
          color: subjects.color,
        },
        assignment: {
          id: assignments.id,
          title: assignments.title,
        },
      })
      .from(studySessions)
      .leftJoin(subjects, eq(studySessions.subjectId, subjects.id))
      .leftJoin(assignments, eq(studySessions.assignmentId, assignments.id))
      .where(and(...conditions))
      .orderBy(desc(studySessions.startedAt))
      .limit(limit ? parseInt(limit) : 50);

    return {
      sessions: result.map((r) => ({
        ...r.session,
        subject: r.subject,
        assignment: r.assignment,
      })),
    };
  });

  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof startSessionSchema>;
  }>('/homework/sessions/start', async (request, reply) => {
    const { householdId } = request.params;
    const data = startSessionSchema.parse(request.body);

    const [session] = await db
      .insert(studySessions)
      .values({
        householdId,
        memberId: data.memberId,
        subjectId: data.subjectId,
        assignmentId: data.assignmentId,
        sessionType: data.sessionType,
        title: data.title,
        startedAt: new Date(),
        plannedDurationMinutes: data.plannedDurationMinutes,
        studyMethod: data.studyMethod,
        location: data.location,
      })
      .returning();

    return reply.status(201).send({ session });
  });

  fastify.patch<{
    Params: { householdId: string; sessionId: string };
    Body: z.infer<typeof endSessionSchema>;
  }>('/homework/sessions/:sessionId/end', async (request, reply) => {
    const { householdId, sessionId } = request.params;
    const data = endSessionSchema.parse(request.body);

    const existing = await db.query.studySessions.findFirst({
      where: and(
        eq(studySessions.id, sessionId),
        eq(studySessions.householdId, householdId)
      ),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    if (existing.endedAt) {
      return reply.status(400).send({ error: 'Session already ended' });
    }

    const endedAt = new Date();
    const durationMinutes = Math.round(
      (endedAt.getTime() - new Date(existing.startedAt).getTime()) / 60000
    );

    // Calculate points (1 point per 5 minutes of study)
    const pointsEarned = Math.floor(durationMinutes / 5);
    const bonusPointsEarned = data.productivityRating && data.productivityRating >= 4
      ? Math.floor(pointsEarned * 0.2)
      : 0;

    const [updated] = await db
      .update(studySessions)
      .set({
        endedAt,
        durationMinutes,
        accomplishments: data.accomplishments,
        pagesCovered: data.pagesCovered,
        problemsCompleted: data.problemsCompleted,
        productivityRating: data.productivityRating,
        difficultyRating: data.difficultyRating,
        comprehensionRating: data.comprehensionRating,
        pointsEarned,
        bonusPointsEarned,
      })
      .where(eq(studySessions.id, sessionId))
      .returning();

    // Update streak
    await updateStudyStreak(existing.memberId, householdId, durationMinutes);

    return { session: updated };
  });

  fastify.post<{
    Params: { householdId: string; sessionId: string };
  }>('/homework/sessions/:sessionId/break', async (request, reply) => {
    const { householdId, sessionId } = request.params;

    const existing = await db.query.studySessions.findFirst({
      where: and(
        eq(studySessions.id, sessionId),
        eq(studySessions.householdId, householdId)
      ),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    const [updated] = await db
      .update(studySessions)
      .set({
        breaksTaken: (existing.breaksTaken || 0) + 1,
      })
      .where(eq(studySessions.id, sessionId))
      .returning();

    return { session: updated };
  });

  // ========================================
  // Study Goals
  // ========================================

  fastify.get<{
    Params: { householdId: string };
    Querystring: { memberId?: string; activeOnly?: string };
  }>('/homework/goals', async (request) => {
    const { householdId } = request.params;
    const { memberId, activeOnly } = request.query;

    const conditions = [eq(studyGoals.householdId, householdId)];
    if (memberId) conditions.push(eq(studyGoals.memberId, memberId));
    if (activeOnly === 'true') conditions.push(eq(studyGoals.isActive, true));

    const result = await db
      .select({
        goal: studyGoals,
        subject: {
          id: subjects.id,
          name: subjects.name,
          color: subjects.color,
        },
      })
      .from(studyGoals)
      .leftJoin(subjects, eq(studyGoals.subjectId, subjects.id))
      .where(and(...conditions))
      .orderBy(desc(studyGoals.createdAt));

    return {
      goals: result.map((r) => ({
        ...r.goal,
        subject: r.subject,
      })),
    };
  });

  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof createGoalSchema>;
  }>('/homework/goals', async (request, reply) => {
    const { householdId } = request.params;
    const data = createGoalSchema.parse(request.body);

    const [goal] = await db
      .insert(studyGoals)
      .values({
        householdId,
        memberId: data.memberId,
        subjectId: data.subjectId,
        title: data.title,
        description: data.description,
        goalType: data.goalType,
        targetValue: data.targetValue,
        periodType: data.periodType,
        startDate: data.startDate,
        endDate: data.endDate,
        rewardPoints: data.rewardPoints,
        rewardScreenTime: data.rewardScreenTime,
        rewardDescription: data.rewardDescription,
      })
      .returning();

    return reply.status(201).send({ goal });
  });

  fastify.patch<{
    Params: { householdId: string; goalId: string };
    Body: { currentValue?: number; isActive?: boolean; isCompleted?: boolean };
  }>('/homework/goals/:goalId', async (request, reply) => {
    const { householdId, goalId } = request.params;
    const data = request.body;

    const existing = await db.query.studyGoals.findFirst({
      where: and(
        eq(studyGoals.id, goalId),
        eq(studyGoals.householdId, householdId)
      ),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Goal not found' });
    }

    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };

    if (data.isCompleted && !existing.isCompleted) {
      updateData.completedAt = new Date();
    }

    const [updated] = await db
      .update(studyGoals)
      .set(updateData)
      .where(eq(studyGoals.id, goalId))
      .returning();

    return { goal: updated };
  });

  // ========================================
  // Study Streaks
  // ========================================

  fastify.get<{
    Params: { householdId: string; memberId: string };
  }>('/homework/streaks/:memberId', async (request) => {
    const { householdId, memberId } = request.params;

    let streak = await db.query.studyStreaks.findFirst({
      where: and(
        eq(studyStreaks.memberId, memberId),
        eq(studyStreaks.householdId, householdId)
      ),
    });

    if (!streak) {
      [streak] = await db
        .insert(studyStreaks)
        .values({
          memberId,
          householdId,
        })
        .returning();
    }

    return { streak };
  });

  // ========================================
  // Study Plans
  // ========================================

  fastify.get<{
    Params: { householdId: string };
    Querystring: { memberId?: string; date?: string; planType?: string };
  }>('/homework/plans', async (request) => {
    const { householdId } = request.params;
    const { memberId, date, planType } = request.query;

    const conditions = [eq(studyPlans.householdId, householdId)];
    if (memberId) conditions.push(eq(studyPlans.memberId, memberId));
    if (date) conditions.push(eq(studyPlans.date, date));
    if (planType) conditions.push(eq(studyPlans.planType, planType));

    const plans = await db.query.studyPlans.findMany({
      where: and(...conditions),
      orderBy: [desc(studyPlans.date)],
    });

    return { plans };
  });

  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof createPlanSchema>;
  }>('/homework/plans', async (request, reply) => {
    const { householdId } = request.params;
    const data = createPlanSchema.parse(request.body);

    const totalPlannedMinutes = data.plannedItems.reduce(
      (sum, item) => sum + item.plannedMinutes, 0
    );

    const [plan] = await db
      .insert(studyPlans)
      .values({
        householdId,
        memberId: data.memberId,
        planType: data.planType,
        date: data.date,
        endDate: data.endDate,
        plannedItems: data.plannedItems,
        totalPlannedMinutes,
      })
      .returning();

    return reply.status(201).send({ plan });
  });

  fastify.patch<{
    Params: { householdId: string; planId: string };
    Body: {
      plannedItems?: z.infer<typeof createPlanSchema>['plannedItems'];
    };
  }>('/homework/plans/:planId', async (request, reply) => {
    const { householdId, planId } = request.params;
    const { plannedItems } = request.body;

    const existing = await db.query.studyPlans.findFirst({
      where: and(
        eq(studyPlans.id, planId),
        eq(studyPlans.householdId, householdId)
      ),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    if (plannedItems) {
      const totalPlannedMinutes = plannedItems.reduce(
        (sum, item) => sum + item.plannedMinutes, 0
      );
      const totalCompletedMinutes = plannedItems
        .filter((item) => item.isCompleted)
        .reduce((sum, item) => sum + item.plannedMinutes, 0);
      const completionPercentage = totalPlannedMinutes > 0
        ? Math.round((totalCompletedMinutes / totalPlannedMinutes) * 100)
        : 0;
      const isCompleted = completionPercentage === 100;

      const [updated] = await db
        .update(studyPlans)
        .set({
          plannedItems,
          totalPlannedMinutes,
          totalCompletedMinutes,
          completionPercentage,
          isCompleted,
          updatedAt: new Date(),
        })
        .where(eq(studyPlans.id, planId))
        .returning();

      return { plan: updated };
    }

    return { plan: existing };
  });

  // ========================================
  // Statistics
  // ========================================

  fastify.get<{
    Params: { householdId: string; memberId: string };
    Querystring: { period?: string; startDate?: string; endDate?: string };
  }>('/homework/stats/:memberId', async (request) => {
    const { householdId, memberId } = request.params;
    const { period = 'week', startDate, endDate } = request.query;

    let start: Date;
    let end: Date = new Date();

    switch (period) {
      case 'day':
        start = new Date();
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start = new Date();
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start = new Date();
        start.setMonth(start.getMonth() - 1);
        break;
      default:
        start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (endDate) end = new Date(endDate);
    }

    // Get sessions in period
    const sessions = await db.query.studySessions.findMany({
      where: and(
        eq(studySessions.memberId, memberId),
        eq(studySessions.householdId, householdId),
        gte(studySessions.startedAt, start),
        lte(studySessions.startedAt, end)
      ),
    });

    // Get completed assignments in period
    const completedAssignments = await db.query.assignments.findMany({
      where: and(
        eq(assignments.memberId, memberId),
        eq(assignments.householdId, householdId),
        eq(assignments.status, 'completed'),
        gte(assignments.completedAt, start),
        lte(assignments.completedAt, end)
      ),
    });

    // Get streak
    const streak = await db.query.studyStreaks.findFirst({
      where: eq(studyStreaks.memberId, memberId),
    });

    // Get goals
    const goals = await db.query.studyGoals.findMany({
      where: and(
        eq(studyGoals.memberId, memberId),
        eq(studyGoals.isActive, true)
      ),
    });

    // Calculate stats
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    const totalSessions = sessions.length;
    const daysInPeriod = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
    const averageDailyMinutes = Math.round(totalMinutes / daysInPeriod);
    const longestSession = sessions.reduce((max, s) => Math.max(max, s.durationMinutes || 0), 0);
    const averageSessionLength = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

    // Sessions by type
    const sessionsByType: Record<string, number> = {};
    sessions.forEach((s) => {
      sessionsByType[s.sessionType] = (sessionsByType[s.sessionType] || 0) + 1;
    });

    // Productivity average
    const productivityRatings = sessions
      .map((s) => s.productivityRating)
      .filter((r): r is number => r !== null);
    const averageProductivityRating = productivityRatings.length > 0
      ? productivityRatings.reduce((sum, r) => sum + r, 0) / productivityRatings.length
      : null;

    return {
      statistics: {
        memberId,
        period,
        startDate: start,
        endDate: end,
        totalMinutes,
        averageDailyMinutes,
        longestSession,
        totalSessions,
        averageSessionLength,
        sessionsByType,
        assignmentsCompleted: completedAssignments.length,
        assignmentsOnTime: completedAssignments.filter((a) =>
          a.completedAt && a.dueDate && new Date(a.completedAt) <= new Date(a.dueDate)
        ).length,
        goalsCompleted: goals.filter((g) => g.isCompleted).length,
        goalsInProgress: goals.filter((g) => !g.isCompleted).length,
        averageProductivityRating,
        currentStreak: streak?.currentStreak || 0,
        longestStreak: streak?.longestStreak || 0,
      },
    };
  });
}

// Helper function to update study streak
async function updateStudyStreak(memberId: string, householdId: string, minutesStudied: number) {
  const today = new Date().toISOString().split('T')[0];

  const streak = await db.query.studyStreaks.findFirst({
    where: eq(studyStreaks.memberId, memberId),
  });

  if (!streak) {
    await db.insert(studyStreaks).values({
      memberId,
      householdId,
      currentStreak: 1,
      longestStreak: 1,
      lastStudyDate: today,
      totalMinutes: minutesStudied,
      totalSessions: 1,
      weeklyMinutes: minutesStudied,
      weeklySessionCount: 1,
      monthlyMinutes: minutesStudied,
      monthlySessionCount: 1,
    });
    return;
  }

  const lastStudy = streak.lastStudyDate;
  let newStreak = streak.currentStreak;

  if (lastStudy) {
    const lastDate = new Date(lastStudy);
    const todayDate = new Date(today);
    const diffDays = Math.floor(
      (todayDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }
    // If same day, don't change streak
  } else {
    newStreak = 1;
  }

  const longestStreak = Math.max(newStreak, streak.longestStreak);

  await db
    .update(studyStreaks)
    .set({
      currentStreak: newStreak,
      longestStreak,
      lastStudyDate: today,
      totalMinutes: streak.totalMinutes + minutesStudied,
      totalSessions: streak.totalSessions + 1,
      weeklyMinutes: streak.weeklyMinutes + minutesStudied,
      weeklySessionCount: streak.weeklySessionCount + 1,
      monthlyMinutes: streak.monthlyMinutes + minutesStudied,
      monthlySessionCount: streak.monthlySessionCount + 1,
      updatedAt: new Date(),
    })
    .where(eq(studyStreaks.id, streak.id));
}
