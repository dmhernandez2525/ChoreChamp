import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@chorechamp/database';
import {
  reportCards,
  reportCardGrades,
  gradeBonusConfigs,
  academicGoals,
  academicAchievements,
  attendanceRecords,
  academicTrends,
  honorRollConfigs,
  members,
} from '@chorechamp/database/schema';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership } from '../lib/membership';

// Zod schemas
const letterGradeSchema = z.enum(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F']);
const periodTypeSchema = z.enum(['quarter', 'trimester', 'semester', 'year']);
const bonusTypeSchema = z.enum(['per_grade', 'gpa_threshold', 'improvement', 'perfect_attendance', 'honor_roll']);
const goalTypeSchema = z.enum(['gpa', 'grade', 'attendance', 'improvement', 'honor_roll']);

const createReportCardGradeSchema = z.object({
  subjectId: z.string().uuid().optional(),
  subjectName: z.string().min(1),
  letterGrade: letterGradeSchema.optional(),
  percentageGrade: z.number().min(0).max(100).optional(),
  gpaValue: z.number().min(0).max(4).optional(),
  credits: z.number().positive().optional(),
  teacherComments: z.string().optional(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for type inference
const createReportCardSchema = z.object({
  memberId: z.string().uuid(),
  schoolYear: z.string().min(1),
  periodType: periodTypeSchema,
  periodNumber: z.number().int().positive(),
  periodName: z.string().min(1),
  issueDate: z.string(),
  imageUrl: z.string().url().optional(),
  grades: z.array(createReportCardGradeSchema),
  attendance: z.object({
    totalDays: z.number().int().positive(),
    daysPresent: z.number().int().min(0),
    daysAbsent: z.number().int().min(0),
    daysExcused: z.number().int().min(0),
    daysTardy: z.number().int().min(0),
  }).optional(),
  notes: z.string().optional(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for type inference
const updateReportCardSchema = z.object({
  periodName: z.string().min(1).optional(),
  issueDate: z.string().optional(),
  notes: z.string().optional(),
  parentAcknowledged: z.boolean().optional(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for type inference
const createBonusConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  bonusType: bonusTypeSchema,
  gradeThreshold: z.string().optional(),
  gpaThreshold: z.number().min(0).max(4).optional(),
  improvementThreshold: z.number().optional(),
  bonusPoints: z.number().int().positive(),
  bonusMultiplier: z.number().positive().optional(),
  maxBonusPerCard: z.number().int().positive().optional(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for type inference
const createGoalSchema = z.object({
  memberId: z.string().uuid(),
  goalType: goalTypeSchema,
  targetValue: z.number(),
  targetGrade: z.string().optional(),
  subjectId: z.string().uuid().optional(),
  subjectName: z.string().optional(),
  schoolYear: z.string().min(1),
  periodType: periodTypeSchema,
  periodNumber: z.number().int().positive().optional(),
  bonusOnAchievement: z.number().int().min(0),
  deadline: z.string().optional(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for type inference
const createHonorRollConfigSchema = z.object({
  name: z.string().min(1),
  minGpa: z.number().min(0).max(4),
  requiresNoFailingGrades: z.boolean().optional(),
  requiresPerfectAttendance: z.boolean().optional(),
  bonusPoints: z.number().int().positive(),
  badgeTitle: z.string().min(1),
  badgeIcon: z.string().min(1),
  badgeColor: z.string().min(1),
});

// Default grade definitions for bonus calculations
const defaultGradeDefinitions = [
  { label: 'A+', minValue: 97, maxValue: 100, gpaValue: 4.0, bonusMultiplier: 2.0, color: '#22c55e' },
  { label: 'A', minValue: 93, maxValue: 96.99, gpaValue: 4.0, bonusMultiplier: 1.8, color: '#22c55e' },
  { label: 'A-', minValue: 90, maxValue: 92.99, gpaValue: 3.7, bonusMultiplier: 1.6, color: '#4ade80' },
  { label: 'B+', minValue: 87, maxValue: 89.99, gpaValue: 3.3, bonusMultiplier: 1.4, color: '#3b82f6' },
  { label: 'B', minValue: 83, maxValue: 86.99, gpaValue: 3.0, bonusMultiplier: 1.2, color: '#3b82f6' },
  { label: 'B-', minValue: 80, maxValue: 82.99, gpaValue: 2.7, bonusMultiplier: 1.1, color: '#60a5fa' },
  { label: 'C+', minValue: 77, maxValue: 79.99, gpaValue: 2.3, bonusMultiplier: 1.0, color: '#eab308' },
  { label: 'C', minValue: 73, maxValue: 76.99, gpaValue: 2.0, bonusMultiplier: 0.9, color: '#eab308' },
  { label: 'C-', minValue: 70, maxValue: 72.99, gpaValue: 1.7, bonusMultiplier: 0.8, color: '#facc15' },
  { label: 'D+', minValue: 67, maxValue: 69.99, gpaValue: 1.3, bonusMultiplier: 0.5, color: '#f97316' },
  { label: 'D', minValue: 63, maxValue: 66.99, gpaValue: 1.0, bonusMultiplier: 0.3, color: '#f97316' },
  { label: 'D-', minValue: 60, maxValue: 62.99, gpaValue: 0.7, bonusMultiplier: 0.1, color: '#fb923c' },
  { label: 'F', minValue: 0, maxValue: 59.99, gpaValue: 0.0, bonusMultiplier: 0.0, color: '#ef4444' },
];

// Helper functions
function getGpaFromLetterGrade(letterGrade: string): number {
  const grade = defaultGradeDefinitions.find(g => g.label === letterGrade);
  return grade?.gpaValue ?? 0;
}

function getBonusMultiplierFromGrade(letterGrade: string): number {
  const grade = defaultGradeDefinitions.find(g => g.label === letterGrade);
  return grade?.bonusMultiplier ?? 0;
}

async function calculateReportCardBonus(
  householdId: string,
  grades: Array<{ letterGrade?: string | null; gpaValue?: number | null; gradeImprovement?: number | null }>,
  gpa: number | null,
  hasFailingGrades: boolean,
  isPerfectAttendance: boolean
): Promise<number> {
  // Get active bonus configs for this household
  const bonusConfigs = await db.select().from(gradeBonusConfigs)
    .where(and(
      eq(gradeBonusConfigs.householdId, householdId),
      eq(gradeBonusConfigs.isActive, true)
    ));

  let totalBonus = 0;

  for (const config of bonusConfigs) {
    let configBonus = 0;

    switch (config.bonusType) {
      case 'per_grade':
        // Award bonus for each grade that meets threshold
        for (const grade of grades) {
          if (grade.letterGrade && config.gradeThreshold) {
            const gradeIndex = defaultGradeDefinitions.findIndex(g => g.label === grade.letterGrade);
            const thresholdIndex = defaultGradeDefinitions.findIndex(g => g.label === config.gradeThreshold);
            if (gradeIndex !== -1 && thresholdIndex !== -1 && gradeIndex <= thresholdIndex) {
              const multiplier = getBonusMultiplierFromGrade(grade.letterGrade);
              configBonus += Math.round(config.bonusPoints * multiplier);
            }
          }
        }
        break;

      case 'gpa_threshold':
        if (gpa && config.gpaThreshold && gpa >= config.gpaThreshold) {
          configBonus = Math.round(config.bonusPoints * config.bonusMultiplier);
        }
        break;

      case 'improvement':
        // Award bonus for each grade that improved
        for (const grade of grades) {
          if (grade.gradeImprovement && config.improvementThreshold &&
              grade.gradeImprovement >= config.improvementThreshold) {
            configBonus += config.bonusPoints;
          }
        }
        break;

      case 'perfect_attendance':
        if (isPerfectAttendance) {
          configBonus = config.bonusPoints;
        }
        break;

      case 'honor_roll': {
        // Check honor roll configs
        const honorRolls = await db.select().from(honorRollConfigs)
          .where(and(
            eq(honorRollConfigs.householdId, householdId),
            eq(honorRollConfigs.isActive, true)
          ));

        for (const hr of honorRolls) {
          if (gpa && gpa >= hr.minGpa) {
            if (hr.requiresNoFailingGrades && hasFailingGrades) continue;
            if (hr.requiresPerfectAttendance && !isPerfectAttendance) continue;
            configBonus += hr.bonusPoints;
          }
        }
        break;
      }
    }

    // Apply max bonus per card if configured
    if (config.maxBonusPerCard && configBonus > config.maxBonusPerCard) {
      configBonus = config.maxBonusPerCard;
    }

    totalBonus += configBonus;
  }

  return totalBonus;
}

export async function reportCardRoutes(fastify: FastifyInstance) {
  // Get all report cards for a member
  fastify.get('/', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { memberId, schoolYear } = request.query as { memberId?: string; schoolYear?: string };

    const conditions = [eq(reportCards.householdId, householdId)];
    if (memberId) conditions.push(eq(reportCards.memberId, memberId));
    if (schoolYear) conditions.push(eq(reportCards.schoolYear, schoolYear));

    const cards = await db.select().from(reportCards)
      .where(and(...conditions))
      .orderBy(desc(reportCards.issueDate));

    // Get grades for each card
    const cardsWithGrades = await Promise.all(cards.map(async (card) => {
      const grades = await db.select().from(reportCardGrades)
        .where(eq(reportCardGrades.reportCardId, card.id));
      return { ...card, grades };
    }));

    return cardsWithGrades;
  });

  // Get single report card
  fastify.get('/:reportCardId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { reportCardId } = request.params as { reportCardId: string };

    const [card] = await db.select().from(reportCards)
      .where(and(
        eq(reportCards.id, reportCardId),
        eq(reportCards.householdId, householdId)
      ));

    if (!card) {
      throw { statusCode: 404, message: 'Report card not found' };
    }

    const grades = await db.select().from(reportCardGrades)
      .where(eq(reportCardGrades.reportCardId, reportCardId));

    const achievements = await db.select().from(academicAchievements)
      .where(eq(academicAchievements.reportCardId, reportCardId));

    return { ...card, grades, achievements };
  });

  // Create report card
  fastify.post('/', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }

    if (membership.role !== 'parent' && membership.role !== 'admin') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can create report cards' });
    }

    const body = request.body as z.infer<typeof createReportCardSchema>;

    // Verify target member belongs to household
    const [targetMember] = await db.select({ id: members.id }).from(members)
      .where(and(eq(members.id, body.memberId), eq(members.householdId, householdId)));
    if (!targetMember) {
      return reply.status(404).send({ error: 'Not Found', message: 'Member not found in this household' });
    }

    // Calculate GPA from grades
    let totalGpaPoints = 0;
    let totalCredits = 0;
    const hasFailingGrades = body.grades.some(g => g.letterGrade === 'F');

    const processedGrades = body.grades.map(grade => {
      const gpaValue = grade.gpaValue ?? (grade.letterGrade ? getGpaFromLetterGrade(grade.letterGrade) : null);
      const credits = grade.credits ?? 1;
      if (gpaValue !== null) {
        totalGpaPoints += gpaValue * credits;
        totalCredits += credits;
      }
      return { ...grade, gpaValue, credits };
    });

    const calculatedGpa = totalCredits > 0 ? Math.round((totalGpaPoints / totalCredits) * 100) / 100 : null;

    // Check perfect attendance
    let isPerfectAttendance = false;
    if (body.attendance) {
      isPerfectAttendance = body.attendance.daysAbsent === 0 && body.attendance.daysTardy === 0;
    }

    // Calculate bonus
    const totalBonus = await calculateReportCardBonus(
      householdId,
      processedGrades.map(g => ({ letterGrade: g.letterGrade, gpaValue: g.gpaValue, gradeImprovement: null })),
      calculatedGpa,
      hasFailingGrades,
      isPerfectAttendance
    );

    // Create report card and related records atomically
    const result = await db.transaction(async (tx) => {
      const [newCard] = await tx.insert(reportCards).values({
        householdId,
        memberId: body.memberId,
        schoolYear: body.schoolYear,
        periodType: body.periodType,
        periodNumber: body.periodNumber,
        periodName: body.periodName,
        issueDate: body.issueDate,
        imageUrl: body.imageUrl,
        gpa: calculatedGpa,
        totalBonusEarned: totalBonus,
      }).returning();

      // Insert grades
      const gradeInserts = processedGrades.map(grade => ({
        reportCardId: newCard.id,
        subjectId: grade.subjectId,
        subjectName: grade.subjectName,
        letterGrade: grade.letterGrade,
        percentageGrade: grade.percentageGrade,
        gpaValue: grade.gpaValue,
        credits: grade.credits,
        teacherComments: grade.teacherComments,
        bonusEarned: grade.letterGrade ? Math.round(10 * getBonusMultiplierFromGrade(grade.letterGrade)) : 0,
      }));

      await tx.insert(reportCardGrades).values(gradeInserts);

      // Insert attendance record if provided
      if (body.attendance) {
        const attendancePercentage = Math.round((body.attendance.daysPresent / body.attendance.totalDays) * 100 * 100) / 100;
        await tx.insert(attendanceRecords).values({
          householdId,
          memberId: body.memberId,
          schoolYear: body.schoolYear,
          periodType: body.periodType,
          periodNumber: body.periodNumber,
          totalDays: body.attendance.totalDays,
          daysPresent: body.attendance.daysPresent,
          daysAbsent: body.attendance.daysAbsent,
          daysExcused: body.attendance.daysExcused,
          daysTardy: body.attendance.daysTardy,
          attendancePercentage,
          isPerfect: isPerfectAttendance,
          bonusEarned: isPerfectAttendance ? 50 : 0,
        });
      }

      // Create academic trends
      if (calculatedGpa !== null) {
        const previousCards = await tx.select().from(reportCards)
          .where(and(
            eq(reportCards.memberId, body.memberId),
            eq(reportCards.householdId, householdId),
            eq(reportCards.schoolYear, body.schoolYear)
          ))
          .orderBy(desc(reportCards.periodNumber))
          .limit(1);

        const previousGpa = previousCards[0]?.gpa;
        const changePercent = previousGpa ? Math.round(((calculatedGpa - previousGpa) / previousGpa) * 100 * 100) / 100 : null;
        const trendDirection = changePercent === null ? 'stable' : changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'stable';

        await tx.insert(academicTrends).values({
          householdId,
          memberId: body.memberId,
          metricType: 'gpa',
          schoolYear: body.schoolYear,
          periodType: body.periodType,
          periodNumber: body.periodNumber,
          value: calculatedGpa,
          previousValue: previousGpa,
          changePercent,
          trendDirection,
        });
      }

      // Check for achievements
      const achievementsToCreate: Array<{
        memberId: string;
        householdId: string;
        reportCardId: string;
        achievementType: string;
        title: string;
        description: string;
        schoolYear: string;
        periodType: string;
        periodNumber: number;
        bonusEarned: number;
      }> = [];

      const honorRolls = await tx.select().from(honorRollConfigs)
        .where(and(
          eq(honorRollConfigs.householdId, householdId),
          eq(honorRollConfigs.isActive, true)
        ))
        .orderBy(desc(honorRollConfigs.minGpa));

      for (const hr of honorRolls) {
        if (calculatedGpa && calculatedGpa >= hr.minGpa) {
          if (hr.requiresNoFailingGrades && hasFailingGrades) continue;
          if (hr.requiresPerfectAttendance && !isPerfectAttendance) continue;

          achievementsToCreate.push({
            memberId: body.memberId,
            householdId,
            reportCardId: newCard.id,
            achievementType: 'honor_roll',
            title: hr.badgeTitle,
            description: `Achieved ${hr.name} with GPA of ${calculatedGpa}`,
            schoolYear: body.schoolYear,
            periodType: body.periodType,
            periodNumber: body.periodNumber,
            bonusEarned: hr.bonusPoints,
          });
          break;
        }
      }

      if (isPerfectAttendance) {
        achievementsToCreate.push({
          memberId: body.memberId,
          householdId,
          reportCardId: newCard.id,
          achievementType: 'perfect_attendance',
          title: 'Perfect Attendance',
          description: `Perfect attendance for ${body.periodName} ${body.schoolYear}`,
          schoolYear: body.schoolYear,
          periodType: body.periodType,
          periodNumber: body.periodNumber,
          bonusEarned: 50,
        });
      }

      if (achievementsToCreate.length > 0) {
        await tx.insert(academicAchievements).values(achievementsToCreate);
      }

      const grades = await tx.select().from(reportCardGrades)
        .where(eq(reportCardGrades.reportCardId, newCard.id));

      return { ...newCard, grades, achievementsEarned: achievementsToCreate.length };
    });

    return result;
  });

  // Update report card
  fastify.patch('/:reportCardId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }

    if (membership.role !== 'parent' && membership.role !== 'admin') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can update report cards' });
    }

    const { reportCardId } = request.params as { reportCardId: string };
    const body = request.body as z.infer<typeof updateReportCardSchema>;

    const updateData: Record<string, unknown> = { ...body, updatedAt: new Date() };

    if (body.parentAcknowledged) {
      updateData.parentAcknowledgedAt = new Date();
    }

    const [updated] = await db.update(reportCards)
      .set(updateData)
      .where(and(
        eq(reportCards.id, reportCardId),
        eq(reportCards.householdId, householdId)
      ))
      .returning();

    return updated;
  });

  // Delete report card
  fastify.delete('/:reportCardId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }

    if (membership.role !== 'parent' && membership.role !== 'admin') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only parents can delete report cards' });
    }

    const { reportCardId } = request.params as { reportCardId: string };

    await db.delete(reportCards)
      .where(and(
        eq(reportCards.id, reportCardId),
        eq(reportCards.householdId, householdId)
      ));

    return { success: true };
  });

  // === BONUS CONFIGS ===

  // Get bonus configs
  fastify.get('/bonus-configs', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }

    const configs = await db.select().from(gradeBonusConfigs)
      .where(eq(gradeBonusConfigs.householdId, householdId))
      .orderBy(desc(gradeBonusConfigs.createdAt));

    return configs;
  });

  // Create bonus config
  fastify.post('/bonus-configs', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = request.body as z.infer<typeof createBonusConfigSchema>;

    const [config] = await db.insert(gradeBonusConfigs).values({
      householdId,
      ...body,
      bonusMultiplier: body.bonusMultiplier ?? 1.0,
    }).returning();

    return config;
  });

  // Update bonus config
  fastify.patch('/bonus-configs/:configId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { configId } = request.params as { configId: string };
    const body = request.body as Partial<z.infer<typeof createBonusConfigSchema>> & { isActive?: boolean };

    const [updated] = await db.update(gradeBonusConfigs)
      .set({ ...body, updatedAt: new Date() })
      .where(and(
        eq(gradeBonusConfigs.id, configId),
        eq(gradeBonusConfigs.householdId, householdId)
      ))
      .returning();

    return updated;
  });

  // Delete bonus config
  fastify.delete('/bonus-configs/:configId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { configId } = request.params as { configId: string };

    await db.delete(gradeBonusConfigs)
      .where(and(
        eq(gradeBonusConfigs.id, configId),
        eq(gradeBonusConfigs.householdId, householdId)
      ));

    return { success: true };
  });

  // === ACADEMIC GOALS ===

  // Get academic goals
  fastify.get('/goals', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { memberId, schoolYear } = request.query as { memberId?: string; schoolYear?: string };

    const conditions = [eq(academicGoals.householdId, householdId)];
    if (memberId) conditions.push(eq(academicGoals.memberId, memberId));
    if (schoolYear) conditions.push(eq(academicGoals.schoolYear, schoolYear));

    const goals = await db.select().from(academicGoals)
      .where(and(...conditions))
      .orderBy(desc(academicGoals.createdAt));

    return goals;
  });

  // Create academic goal
  fastify.post('/goals', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = request.body as z.infer<typeof createGoalSchema>;

    const [goal] = await db.insert(academicGoals).values({
      householdId,
      ...body,
      deadline: body.deadline ? new Date(body.deadline) : null,
    }).returning();

    return goal;
  });

  // Update academic goal
  fastify.patch('/goals/:goalId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { goalId } = request.params as { goalId: string };
    const body = request.body as Partial<z.infer<typeof createGoalSchema>> & { currentProgress?: number; isAchieved?: boolean };

    const updateData: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (body.isAchieved) {
      updateData.achievedAt = new Date();
    }

    const [updated] = await db.update(academicGoals)
      .set(updateData)
      .where(and(
        eq(academicGoals.id, goalId),
        eq(academicGoals.householdId, householdId)
      ))
      .returning();

    return updated;
  });

  // Delete academic goal
  fastify.delete('/goals/:goalId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { goalId } = request.params as { goalId: string };

    await db.delete(academicGoals)
      .where(and(
        eq(academicGoals.id, goalId),
        eq(academicGoals.householdId, householdId)
      ));

    return { success: true };
  });

  // === ACHIEVEMENTS ===

  // Get academic achievements
  fastify.get('/achievements', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { memberId, schoolYear, achievementType } = request.query as { memberId?: string; schoolYear?: string; achievementType?: string };

    const conditions = [eq(academicAchievements.householdId, householdId)];
    if (memberId) conditions.push(eq(academicAchievements.memberId, memberId));
    if (schoolYear) conditions.push(eq(academicAchievements.schoolYear, schoolYear));
    if (achievementType) conditions.push(eq(academicAchievements.achievementType, achievementType));

    const achievements = await db.select().from(academicAchievements)
      .where(and(...conditions))
      .orderBy(desc(academicAchievements.earnedAt));

    return achievements;
  });

  // Mark achievement celebration as shown
  fastify.patch('/achievements/:achievementId/celebrate', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { achievementId } = request.params as { achievementId: string };

    const [updated] = await db.update(academicAchievements)
      .set({ celebrationShown: true })
      .where(and(
        eq(academicAchievements.id, achievementId),
        eq(academicAchievements.householdId, householdId)
      ))
      .returning();

    return updated;
  });

  // === ATTENDANCE ===

  // Get attendance records
  fastify.get('/attendance', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { memberId, schoolYear } = request.query as { memberId?: string; schoolYear?: string };

    const conditions = [eq(attendanceRecords.householdId, householdId)];
    if (memberId) conditions.push(eq(attendanceRecords.memberId, memberId));
    if (schoolYear) conditions.push(eq(attendanceRecords.schoolYear, schoolYear));

    const records = await db.select().from(attendanceRecords)
      .where(and(...conditions))
      .orderBy(desc(attendanceRecords.createdAt));

    return records;
  });

  // === TRENDS ===

  // Get academic trends
  fastify.get('/trends', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { memberId, schoolYear, metricType } = request.query as { memberId?: string; schoolYear?: string; metricType?: string };

    const conditions = [eq(academicTrends.householdId, householdId)];
    if (memberId) conditions.push(eq(academicTrends.memberId, memberId));
    if (schoolYear) conditions.push(eq(academicTrends.schoolYear, schoolYear));
    if (metricType) conditions.push(eq(academicTrends.metricType, metricType));

    const trends = await db.select().from(academicTrends)
      .where(and(...conditions))
      .orderBy(academicTrends.periodNumber);

    return trends;
  });

  // === HONOR ROLL CONFIGS ===

  // Get honor roll configs
  fastify.get('/honor-roll-configs', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }

    const configs = await db.select().from(honorRollConfigs)
      .where(eq(honorRollConfigs.householdId, householdId))
      .orderBy(desc(honorRollConfigs.minGpa));

    return configs;
  });

  // Create honor roll config
  fastify.post('/honor-roll-configs', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = request.body as z.infer<typeof createHonorRollConfigSchema>;

    const [config] = await db.insert(honorRollConfigs).values({
      householdId,
      ...body,
      requiresNoFailingGrades: body.requiresNoFailingGrades ?? true,
      requiresPerfectAttendance: body.requiresPerfectAttendance ?? false,
    }).returning();

    return config;
  });

  // Update honor roll config
  fastify.patch('/honor-roll-configs/:configId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { configId } = request.params as { configId: string };
    const body = request.body as Partial<z.infer<typeof createHonorRollConfigSchema>> & { isActive?: boolean };

    const [updated] = await db.update(honorRollConfigs)
      .set({ ...body, updatedAt: new Date() })
      .where(and(
        eq(honorRollConfigs.id, configId),
        eq(honorRollConfigs.householdId, householdId)
      ))
      .returning();

    return updated;
  });

  // Delete honor roll config
  fastify.delete('/honor-roll-configs/:configId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { configId } = request.params as { configId: string };

    await db.delete(honorRollConfigs)
      .where(and(
        eq(honorRollConfigs.id, configId),
        eq(honorRollConfigs.householdId, householdId)
      ));

    return { success: true };
  });

  // === STATISTICS ===

  // Get report card statistics
  fastify.get('/stats', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { memberId, schoolYear } = request.query as { memberId?: string; schoolYear?: string };

    const conditions = [eq(reportCards.householdId, householdId)];
    if (memberId) conditions.push(eq(reportCards.memberId, memberId));
    if (schoolYear) conditions.push(eq(reportCards.schoolYear, schoolYear));

    const cards = await db.select().from(reportCards)
      .where(and(...conditions));

    // Calculate stats
    const totalCards = cards.length;
    const cardsWithGpa = cards.filter(card => card.gpa !== null);
    let gpaSum = 0;
    for (const card of cardsWithGpa) {
      gpaSum += card.gpa || 0;
    }
    const avgGpa = cardsWithGpa.length > 0 ? gpaSum / cardsWithGpa.length : 0;

    let totalBonus = 0;
    for (const card of cards) {
      totalBonus += card.totalBonusEarned;
    }

    // Get achievement counts
    const achievementConditions = [eq(academicAchievements.householdId, householdId)];
    if (memberId) achievementConditions.push(eq(academicAchievements.memberId, memberId));
    if (schoolYear) achievementConditions.push(eq(academicAchievements.schoolYear, schoolYear));

    const achievements = await db.select().from(academicAchievements)
      .where(and(...achievementConditions));

    const achievementsByType: Record<string, number> = {};
    for (const achievement of achievements) {
      achievementsByType[achievement.achievementType] = (achievementsByType[achievement.achievementType] || 0) + 1;
    }

    // Get attendance stats
    const attendanceConditions = [eq(attendanceRecords.householdId, householdId)];
    if (memberId) attendanceConditions.push(eq(attendanceRecords.memberId, memberId));
    if (schoolYear) attendanceConditions.push(eq(attendanceRecords.schoolYear, schoolYear));

    const attendance = await db.select().from(attendanceRecords)
      .where(and(...attendanceConditions));

    let attendanceSum = 0;
    let perfectAttendancePeriods = 0;
    for (const record of attendance) {
      attendanceSum += record.attendancePercentage;
      if (record.isPerfect) perfectAttendancePeriods++;
    }
    const avgAttendance = attendance.length > 0 ? attendanceSum / attendance.length : 0;

    return {
      totalReportCards: totalCards,
      averageGpa: Math.round(avgGpa * 100) / 100,
      totalBonusEarned: totalBonus,
      achievements: {
        total: achievements.length,
        byType: achievementsByType,
      },
      attendance: {
        averagePercentage: Math.round(avgAttendance * 100) / 100,
        perfectPeriods: perfectAttendancePeriods,
        totalPeriods: attendance.length,
      },
    };
  });
}
