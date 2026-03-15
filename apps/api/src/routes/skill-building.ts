import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '@chorechamp/database';
import {
  skillTrees,
  skills,
  memberSkillProgress,
  skillPracticeLogs,
  skillCertifications,
  skillChallenges,
  memberChallengeProgress,
  mentorshipRelations,
  skillBadges,
  memberSkillBadges,
  expertTips,
  members,
} from '@chorechamp/database/schema';
import {
  MASTERY_LEVELS,
  XP_PER_PRACTICE_MINUTE,
  XP_BONUS_QUALITY_MULTIPLIER,
  XP_MENTOR_BONUS,
  XP_MENTEE_BONUS,
} from '@chorechamp/types';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership } from '../lib/membership';

// Zod schemas
const skillCategorySchema = z.enum(['cooking', 'cleaning', 'organization', 'laundry', 'maintenance', 'gardening', 'pet_care', 'first_aid', 'budgeting', 'time_management']);
const masteryLevelSchema = z.enum(['novice', 'beginner', 'intermediate', 'advanced', 'expert', 'master']);
const challengeTypeSchema = z.enum(['time_trial', 'quality_check', 'streak', 'teaching', 'assessment']);

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for type inference
const createSkillTreeSchema = z.object({
  category: skillCategorySchema,
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  iconUrl: z.string().url().optional(),
  colorTheme: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for type inference
const createSkillSchema = z.object({
  skillTreeId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  iconUrl: z.string().url().optional(),
  level: z.number().int().min(1).max(10).default(1),
  tier: z.number().int().min(1).max(5).default(1),
  xpRequired: z.number().int().positive().default(100),
  prerequisites: z.array(z.string().uuid()).optional(),
  ageMinimum: z.number().int().min(3).max(18).optional(),
  estimatedPracticeTime: z.number().int().positive().default(30),
  videoTutorialUrl: z.string().url().optional(),
  articleUrl: z.string().url().optional(),
  tips: z.array(z.string()).optional(),
  safetyNotes: z.string().optional(),
  linkedChoreIds: z.array(z.string().uuid()).optional(),
  isCore: z.boolean().optional(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for type inference
const logPracticeSchema = z.object({
  skillId: z.string().uuid(),
  memberId: z.string().uuid(),
  durationMinutes: z.number().int().positive(),
  choreCompletionId: z.string().uuid().optional(),
  qualityRating: z.number().int().min(1).max(5).optional(),
  selfAssessment: z.number().int().min(1).max(5).optional(),
  mentorId: z.string().uuid().optional(),
  mentorAssessment: z.number().int().min(1).max(5).optional(),
  mentorFeedback: z.string().optional(),
  photoProofUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for type inference
const createChallengeSchema = z.object({
  skillId: z.string().uuid(),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  challengeType: challengeTypeSchema,
  difficulty: masteryLevelSchema,
  requirements: z.array(z.object({
    type: z.string(),
    value: z.number(),
    description: z.string(),
  })),
  xpReward: z.number().int().positive(),
  bonusReward: z.number().int().positive().optional(),
  badgeReward: z.string().optional(),
  timeLimit: z.number().int().positive().optional(),
  maxAttempts: z.number().int().positive().optional(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for type inference
const createMentorshipSchema = z.object({
  mentorId: z.string().uuid(),
  menteeId: z.string().uuid(),
  skillId: z.string().uuid(),
});

// Helper functions
function getMasteryLevelFromXp(xp: number): string {
  const levels = Object.entries(MASTERY_LEVELS).reverse();
  for (const [level, config] of levels) {
    if (xp >= config.minXp) {
      return level;
    }
  }
  return 'novice';
}

function calculateXpEarned(
  durationMinutes: number,
  qualityRating?: number,
  hasMentor?: boolean
): number {
  let xp = durationMinutes * XP_PER_PRACTICE_MINUTE;

  if (qualityRating) {
    xp += xp * (qualityRating / 5) * XP_BONUS_QUALITY_MULTIPLIER;
  }

  if (hasMentor) {
    xp *= XP_MENTEE_BONUS;
  }

  return Math.round(xp);
}

export async function skillBuildingRoutes(fastify: FastifyInstance) {
  // === SKILL TREES ===

  // Get all skill trees
  fastify.get('/trees', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }

    const trees = await db.select().from(skillTrees)
      .where(eq(skillTrees.householdId, householdId))
      .orderBy(asc(skillTrees.category));

    return trees;
  });

  // Get single skill tree with skills
  fastify.get('/trees/:treeId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { treeId } = request.params as { treeId: string };

    const [tree] = await db.select().from(skillTrees)
      .where(and(
        eq(skillTrees.id, treeId),
        eq(skillTrees.householdId, householdId)
      ));

    if (!tree) {
      throw { statusCode: 404, message: 'Skill tree not found' };
    }

    const treeSkills = await db.select().from(skills)
      .where(eq(skills.skillTreeId, treeId))
      .orderBy(asc(skills.tier), asc(skills.level));

    return { ...tree, skills: treeSkills };
  });

  // Create skill tree
  fastify.post('/trees', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = request.body as z.infer<typeof createSkillTreeSchema>;

    const [newTree] = await db.insert(skillTrees).values({
      householdId,
      ...body,
    }).returning();

    return newTree;
  });

  // Update skill tree
  fastify.patch('/trees/:treeId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { treeId } = request.params as { treeId: string };
    const body = request.body as Partial<z.infer<typeof createSkillTreeSchema>> & { isActive?: boolean };

    const [updated] = await db.update(skillTrees)
      .set({ ...body, updatedAt: new Date() })
      .where(and(
        eq(skillTrees.id, treeId),
        eq(skillTrees.householdId, householdId)
      ))
      .returning();

    return updated;
  });

  // === SKILLS ===

  // Get all skills
  fastify.get('/skills', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { treeId } = request.query as { treeId?: string };

    const conditions = [eq(skills.householdId, householdId)];
    if (treeId) conditions.push(eq(skills.skillTreeId, treeId));

    const allSkills = await db.select().from(skills)
      .where(and(...conditions))
      .orderBy(asc(skills.tier), asc(skills.level));

    return allSkills;
  });

  // Get single skill
  fastify.get('/:skillId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { skillId } = request.params as { skillId: string };

    const [skill] = await db.select().from(skills)
      .where(and(
        eq(skills.id, skillId),
        eq(skills.householdId, householdId)
      ));

    if (!skill) {
      throw { statusCode: 404, message: 'Skill not found' };
    }

    // Get tips for the skill
    const tips = await db.select().from(expertTips)
      .where(eq(expertTips.skillId, skillId))
      .orderBy(desc(expertTips.helpfulCount));

    // Get challenges
    const challenges = await db.select().from(skillChallenges)
      .where(and(
        eq(skillChallenges.skillId, skillId),
        eq(skillChallenges.isActive, true)
      ));

    return { ...skill, expertTips: tips, challenges };
  });

  // Create skill
  fastify.post('/skills', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = request.body as z.infer<typeof createSkillSchema>;

    const [newSkill] = await db.insert(skills).values({
      householdId,
      ...body,
      prerequisites: body.prerequisites || [],
      tips: body.tips || [],
      linkedChoreIds: body.linkedChoreIds || [],
      isCore: body.isCore ?? false,
    }).returning();

    // Update skill tree counts
    const treeSkills = await db.select().from(skills).where(eq(skills.skillTreeId, body.skillTreeId));
    await db.update(skillTrees)
      .set({
        totalSkills: treeSkills.length,
        updatedAt: new Date(),
      })
      .where(eq(skillTrees.id, body.skillTreeId));

    return newSkill;
  });

  // Update skill
  fastify.patch('/:skillId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { skillId } = request.params as { skillId: string };
    const body = request.body as Partial<z.infer<typeof createSkillSchema>>;

    const [updated] = await db.update(skills)
      .set({ ...body, updatedAt: new Date() })
      .where(and(
        eq(skills.id, skillId),
        eq(skills.householdId, householdId)
      ))
      .returning();

    return updated;
  });

  // === MEMBER PROGRESS ===

  // Get member's skill progress
  fastify.get('/members/:memberId/skills', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { memberId } = request.params as { memberId: string };

    const progress = await db.select({
      progress: memberSkillProgress,
      skill: skills,
    }).from(memberSkillProgress)
      .innerJoin(skills, eq(memberSkillProgress.skillId, skills.id))
      .where(and(
        eq(memberSkillProgress.memberId, memberId),
        eq(memberSkillProgress.householdId, householdId)
      ))
      .orderBy(desc(memberSkillProgress.lastPracticedAt));

    return progress;
  });

  // Start/unlock a skill for a member
  fastify.post('/members/:memberId/skills/:skillId/start', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { memberId, skillId } = request.params as { memberId: string; skillId: string };

    // Check if progress already exists
    const [existing] = await db.select().from(memberSkillProgress)
      .where(and(
        eq(memberSkillProgress.memberId, memberId),
        eq(memberSkillProgress.skillId, skillId)
      ));

    if (existing) {
      // Update status to in_progress if it was available
      if (existing.status === 'available') {
        const [updated] = await db.update(memberSkillProgress)
          .set({ status: 'in_progress', startedAt: new Date(), updatedAt: new Date() })
          .where(eq(memberSkillProgress.id, existing.id))
          .returning();
        return updated;
      }
      return existing;
    }

    // Create new progress record
    const [progress] = await db.insert(memberSkillProgress).values({
      memberId,
      skillId,
      householdId,
      status: 'in_progress',
      masteryLevel: 'novice',
      startedAt: new Date(),
    }).returning();

    return progress;
  });

  // Log practice session
  fastify.post('/practice', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = request.body as z.infer<typeof logPracticeSchema>;

    // Verify target member belongs to household
    const [targetMember] = await db.select({ id: members.id }).from(members)
      .where(and(eq(members.id, body.memberId), eq(members.householdId, householdId)));
    if (!targetMember) {
      return reply.status(404).send({ error: 'Not Found', message: 'Member not found in this household' });
    }

    // All writes in a single transaction
    const result = await db.transaction(async (tx) => {
      // Get or create progress record
      let [progress] = await tx.select().from(memberSkillProgress)
        .where(and(
          eq(memberSkillProgress.memberId, body.memberId),
          eq(memberSkillProgress.skillId, body.skillId),
          eq(memberSkillProgress.householdId, householdId)
        ));

      if (!progress) {
        [progress] = await tx.insert(memberSkillProgress).values({
          memberId: body.memberId,
          skillId: body.skillId,
          householdId,
          status: 'in_progress',
          masteryLevel: 'novice',
          startedAt: new Date(),
        }).returning();
      }

      // Calculate XP earned
      const xpEarned = calculateXpEarned(
        body.durationMinutes,
        body.qualityRating || body.mentorAssessment,
        !!body.mentorId
      );

      // Create practice log
      const [log] = await tx.insert(skillPracticeLogs).values({
        memberSkillProgressId: progress.id,
        memberId: body.memberId,
        skillId: body.skillId,
        householdId,
        choreCompletionId: body.choreCompletionId,
        durationMinutes: body.durationMinutes,
        xpEarned,
        qualityRating: body.qualityRating,
        selfAssessment: body.selfAssessment,
        mentorId: body.mentorId,
        mentorAssessment: body.mentorAssessment,
        mentorFeedback: body.mentorFeedback,
        photoProofUrl: body.photoProofUrl,
        notes: body.notes,
      }).returning();

      // Update progress
      const newXp = progress.currentXp + xpEarned;
      const newMasteryLevel = getMasteryLevelFromXp(newXp);

      // Get skill to check XP requirement for completion
      const [skill] = await tx.select().from(skills)
        .where(eq(skills.id, body.skillId));

      const isCompleted = newXp >= skill.xpRequired;
      const isMastered = newMasteryLevel === 'master';

      const [updatedProgress] = await tx.update(memberSkillProgress)
        .set({
          currentXp: newXp,
          masteryLevel: newMasteryLevel,
          practiceCount: progress.practiceCount + 1,
          totalPracticeMinutes: progress.totalPracticeMinutes + body.durationMinutes,
          lastPracticedAt: new Date(),
          status: isMastered ? 'mastered' : isCompleted ? 'completed' : 'in_progress',
          completedAt: isCompleted && !progress.completedAt ? new Date() : progress.completedAt,
          masteredAt: isMastered && !progress.masteredAt ? new Date() : progress.masteredAt,
          mentorId: body.mentorId || progress.mentorId,
          updatedAt: new Date(),
        })
        .where(eq(memberSkillProgress.id, progress.id))
        .returning();

      // If mentor was involved, update mentorship and award mentor XP
      if (body.mentorId) {
        const [mentorship] = await tx.select().from(mentorshipRelations)
          .where(and(
            eq(mentorshipRelations.mentorId, body.mentorId),
            eq(mentorshipRelations.menteeId, body.memberId),
            eq(mentorshipRelations.skillId, body.skillId),
            eq(mentorshipRelations.householdId, householdId)
          ));

        if (mentorship) {
          const mentorXp = Math.round(xpEarned * (XP_MENTOR_BONUS - 1));
          await tx.update(mentorshipRelations)
            .set({
              sessionsCompleted: mentorship.sessionsCompleted + 1,
              totalSessionMinutes: mentorship.totalSessionMinutes + body.durationMinutes,
              mentorXpEarned: mentorship.mentorXpEarned + mentorXp,
              menteeXpEarned: mentorship.menteeXpEarned + xpEarned,
              updatedAt: new Date(),
            })
            .where(eq(mentorshipRelations.id, mentorship.id));
        }
      }

      return { log, progress: updatedProgress };
    });

    return result;
  });

  // Get practice history
  fastify.get('/members/:memberId/practice-history', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { memberId } = request.params as { memberId: string };
    const { skillId, limit } = request.query as { skillId?: string; limit: number };

    const conditions = [
      eq(skillPracticeLogs.memberId, memberId),
      eq(skillPracticeLogs.householdId, householdId),
    ];
    if (skillId) conditions.push(eq(skillPracticeLogs.skillId, skillId));

    const logs = await db.select().from(skillPracticeLogs)
      .where(and(...conditions))
      .orderBy(desc(skillPracticeLogs.practicedAt))
      .limit(limit);

    return logs;
  });

  // === CERTIFICATIONS ===

  // Get member's certifications
  fastify.get('/members/:memberId/certifications', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { memberId } = request.params as { memberId: string };

    const certs = await db.select({
      certification: skillCertifications,
      skill: skills,
    }).from(skillCertifications)
      .innerJoin(skills, eq(skillCertifications.skillId, skills.id))
      .where(and(
        eq(skillCertifications.memberId, memberId),
        eq(skillCertifications.householdId, householdId)
      ))
      .orderBy(desc(skillCertifications.certifiedAt));

    return certs;
  });

  // Start certification assessment
  fastify.post('/certifications/start', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { memberId, skillId } = request.body as { memberId: string; skillId: string };

    // Check if certification already exists
    const [existing] = await db.select().from(skillCertifications)
      .where(and(
        eq(skillCertifications.memberId, memberId),
        eq(skillCertifications.skillId, skillId)
      ));

    if (existing && existing.status === 'certified') {
      throw { statusCode: 400, message: 'Already certified for this skill' };
    }

    // Get skill name for certification
    const [skill] = await db.select().from(skills)
      .where(eq(skills.id, skillId));

    if (existing) {
      const [updated] = await db.update(skillCertifications)
        .set({
          status: 'in_progress',
          assessmentAttempts: existing.assessmentAttempts + 1,
          updatedAt: new Date(),
        })
        .where(eq(skillCertifications.id, existing.id))
        .returning();
      return updated;
    }

    const [cert] = await db.insert(skillCertifications).values({
      memberId,
      skillId,
      householdId,
      certificationName: `${skill.name} Certification`,
      status: 'in_progress',
      assessmentAttempts: 1,
    }).returning();

    return cert;
  });

  // Submit certification assessment
  fastify.post('/certifications/:certId/submit', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { certId } = request.params as { certId: string };
    const { score, certifiedById } = request.body as { score: number; certifiedById?: string };

    const [cert] = await db.select().from(skillCertifications)
      .where(and(
        eq(skillCertifications.id, certId),
        eq(skillCertifications.householdId, householdId)
      ));

    if (!cert) {
      throw { statusCode: 404, message: 'Certification not found' };
    }

    const passed = score >= cert.assessmentPassingScore;

    const [updated] = await db.update(skillCertifications)
      .set({
        assessmentScore: score,
        status: passed ? 'certified' : 'pending_review',
        certifiedAt: passed ? new Date() : null,
        certifiedById: passed ? certifiedById : null,
        updatedAt: new Date(),
      })
      .where(eq(skillCertifications.id, certId))
      .returning();

    return updated;
  });

  // === CHALLENGES ===

  // Get skill challenges
  fastify.get('/challenges', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { skillId, difficulty } = request.query as { skillId?: string; difficulty?: string };

    const conditions = [
      eq(skillChallenges.householdId, householdId),
      eq(skillChallenges.isActive, true),
    ];
    if (skillId) conditions.push(eq(skillChallenges.skillId, skillId));
    if (difficulty) conditions.push(eq(skillChallenges.difficulty, difficulty));

    const challenges = await db.select().from(skillChallenges)
      .where(and(...conditions))
      .orderBy(asc(skillChallenges.difficulty));

    return challenges;
  });

  // Create challenge
  fastify.post('/challenges', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = request.body as z.infer<typeof createChallengeSchema>;

    const [challenge] = await db.insert(skillChallenges).values({
      householdId,
      ...body,
    }).returning();

    return challenge;
  });

  // Start challenge
  fastify.post('/challenges/:challengeId/start', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { challengeId } = request.params as { challengeId: string };
    const { memberId } = request.body as { memberId: string };

    const [challenge] = await db.select().from(skillChallenges)
      .where(eq(skillChallenges.id, challengeId));

    if (!challenge) {
      throw { statusCode: 404, message: 'Challenge not found' };
    }

    // Check max attempts
    const [existing] = await db.select().from(memberChallengeProgress)
      .where(and(
        eq(memberChallengeProgress.memberId, memberId),
        eq(memberChallengeProgress.challengeId, challengeId)
      ));

    if (existing && challenge.maxAttempts && existing.attempts >= challenge.maxAttempts) {
      throw { statusCode: 400, message: 'Maximum attempts reached' };
    }

    if (existing) {
      const [updated] = await db.update(memberChallengeProgress)
        .set({
          status: 'in_progress',
          currentProgress: 0,
          attempts: existing.attempts + 1,
          startedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(memberChallengeProgress.id, existing.id))
        .returning();
      return updated;
    }

    // Calculate target progress from requirements
    const targetProgress = challenge.requirements.reduce((sum, req) => sum + req.value, 0);

    const [progress] = await db.insert(memberChallengeProgress).values({
      memberId,
      challengeId,
      householdId,
      status: 'in_progress',
      targetProgress,
      attempts: 1,
      startedAt: new Date(),
    }).returning();

    return progress;
  });

  // Update challenge progress
  fastify.patch('/challenges/:challengeId/progress/:memberId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { challengeId, memberId } = request.params as { challengeId: string; memberId: string };
    const { progressIncrement } = request.body as { progressIncrement: number };

    const [progress] = await db.select().from(memberChallengeProgress)
      .where(and(
        eq(memberChallengeProgress.memberId, memberId),
        eq(memberChallengeProgress.challengeId, challengeId)
      ));

    if (!progress) {
      throw { statusCode: 404, message: 'Challenge progress not found' };
    }

    const newProgress = progress.currentProgress + progressIncrement;
    const isCompleted = newProgress >= progress.targetProgress;

    const [challenge] = await db.select().from(skillChallenges)
      .where(eq(skillChallenges.id, challengeId));

    const xpEarned = isCompleted ? challenge.xpReward : 0;

    const [updated] = await db.update(memberChallengeProgress)
      .set({
        currentProgress: newProgress,
        status: isCompleted ? 'completed' : 'in_progress',
        completedAt: isCompleted ? new Date() : null,
        xpEarned: progress.xpEarned + xpEarned,
        updatedAt: new Date(),
      })
      .where(eq(memberChallengeProgress.id, progress.id))
      .returning();

    return { progress: updated, xpEarned };
  });

  // === MENTORSHIP ===

  // Get mentorships
  fastify.get('/mentorships', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { memberId, role, status } = request.query as { memberId?: string; role?: string; status?: string };

    const conditions = [eq(mentorshipRelations.householdId, householdId)];

    if (memberId && role === 'mentor') {
      conditions.push(eq(mentorshipRelations.mentorId, memberId));
    } else if (memberId && role === 'mentee') {
      conditions.push(eq(mentorshipRelations.menteeId, memberId));
    } else if (memberId) {
      // Either role - this is a simplification
      conditions.push(eq(mentorshipRelations.mentorId, memberId));
    }

    if (status) conditions.push(eq(mentorshipRelations.status, status));

    const mentorships = await db.select().from(mentorshipRelations)
      .where(and(...conditions))
      .orderBy(desc(mentorshipRelations.createdAt));

    return mentorships;
  });

  // Create mentorship
  fastify.post('/mentorships', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const body = request.body as z.infer<typeof createMentorshipSchema>;

    // Check that mentor has the skill at advanced level or higher
    const [mentorProgress] = await db.select().from(memberSkillProgress)
      .where(and(
        eq(memberSkillProgress.memberId, body.mentorId),
        eq(memberSkillProgress.skillId, body.skillId)
      ));

    const advancedLevels = ['advanced', 'expert', 'master'];
    if (!mentorProgress || !advancedLevels.includes(mentorProgress.masteryLevel)) {
      throw { statusCode: 400, message: 'Mentor must have advanced level or higher in this skill' };
    }

    const [mentorship] = await db.insert(mentorshipRelations).values({
      householdId,
      ...body,
      status: 'pending',
    }).returning();

    return mentorship;
  });

  // Update mentorship status
  fastify.patch('/mentorships/:mentorshipId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { mentorshipId } = request.params as { mentorshipId: string };
    const { status, notes } = request.body as { status?: string; notes?: string };

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (status) {
      updateData.status = status;
      if (status === 'active') updateData.startedAt = new Date();
      if (status === 'completed') updateData.completedAt = new Date();
    }
    if (notes) updateData.notes = notes;

    const [updated] = await db.update(mentorshipRelations)
      .set(updateData)
      .where(and(
        eq(mentorshipRelations.id, mentorshipId),
        eq(mentorshipRelations.householdId, householdId)
      ))
      .returning();

    return updated;
  });

  // === BADGES ===

  // Get member's skill badges
  fastify.get('/members/:memberId/badges', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { memberId } = request.params as { memberId: string };

    const badges = await db.select({
      memberBadge: memberSkillBadges,
      badge: skillBadges,
    }).from(memberSkillBadges)
      .innerJoin(skillBadges, eq(memberSkillBadges.badgeId, skillBadges.id))
      .where(and(
        eq(memberSkillBadges.memberId, memberId),
        eq(memberSkillBadges.householdId, householdId)
      ))
      .orderBy(desc(memberSkillBadges.earnedAt));

    return badges;
  });

  // Award badge to member
  fastify.post('/members/:memberId/badges', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { memberId } = request.params as { memberId: string };
    const { badgeId } = request.body as { badgeId: string };

    // Check if already awarded
    const [existing] = await db.select().from(memberSkillBadges)
      .where(and(
        eq(memberSkillBadges.memberId, memberId),
        eq(memberSkillBadges.badgeId, badgeId)
      ));

    if (existing) {
      throw { statusCode: 400, message: 'Badge already awarded' };
    }

    const [memberBadge] = await db.insert(memberSkillBadges).values({
      memberId,
      badgeId,
      householdId,
    }).returning();

    return memberBadge;
  });

  // === EXPERT TIPS ===

  // Get tips for a skill
  fastify.get('/:skillId/tips', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { skillId } = request.params as { skillId: string };

    const tips = await db.select().from(expertTips)
      .where(eq(expertTips.skillId, skillId))
      .orderBy(desc(expertTips.helpfulCount));

    return tips;
  });

  // Add tip
  fastify.post('/:skillId/tips', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { skillId } = request.params as { skillId: string };
    const body = request.body as {
      title: string;
      content: string;
      category: string;
      authorName?: string;
      sourceUrl?: string;
    };

    const [tip] = await db.insert(expertTips).values({
      skillId,
      householdId,
      ...body,
    }).returning();

    return tip;
  });

  // Mark tip as helpful
  fastify.post('/tips/:tipId/helpful', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { tipId } = request.params as { tipId: string };

    const [tip] = await db.select().from(expertTips)
      .where(eq(expertTips.id, tipId));

    if (!tip) {
      throw { statusCode: 404, message: 'Tip not found' };
    }

    const [updated] = await db.update(expertTips)
      .set({
        helpfulCount: tip.helpfulCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(expertTips.id, tipId))
      .returning();

    return updated;
  });

  // === STATS ===

  // Get skill building stats for member
  fastify.get('/members/:memberId/stats', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { memberId } = request.params as { memberId: string };

    // Get all progress
    const progress = await db.select().from(memberSkillProgress)
      .where(and(
        eq(memberSkillProgress.memberId, memberId),
        eq(memberSkillProgress.householdId, householdId)
      ));

    // Calculate stats
    let totalXp = 0;
    let totalPracticeMinutes = 0;
    let totalPracticeCount = 0;
    const skillsByStatus: Record<string, number> = {
      locked: 0,
      available: 0,
      in_progress: 0,
      completed: 0,
      mastered: 0,
    };
    const skillsByMastery: Record<string, number> = {};

    for (const p of progress) {
      totalXp += p.currentXp;
      totalPracticeMinutes += p.totalPracticeMinutes;
      totalPracticeCount += p.practiceCount;
      skillsByStatus[p.status] = (skillsByStatus[p.status] || 0) + 1;
      skillsByMastery[p.masteryLevel] = (skillsByMastery[p.masteryLevel] || 0) + 1;
    }

    // Get certifications count
    const certifications = await db.select().from(skillCertifications)
      .where(and(
        eq(skillCertifications.memberId, memberId),
        eq(skillCertifications.status, 'certified')
      ));

    // Get badges count
    const badges = await db.select().from(memberSkillBadges)
      .where(eq(memberSkillBadges.memberId, memberId));

    // Get mentorships
    const mentorships = await db.select().from(mentorshipRelations)
      .where(and(
        eq(mentorshipRelations.mentorId, memberId),
        eq(mentorshipRelations.status, 'active')
      ));

    return {
      totalXp,
      totalPracticeMinutes,
      totalPracticeCount,
      totalSkillsStarted: progress.length,
      skillsByStatus,
      skillsByMastery,
      certificationsEarned: certifications.length,
      badgesEarned: badges.length,
      activeMentorships: mentorships.length,
    };
  });
}
