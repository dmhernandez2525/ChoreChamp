import { FastifyInstance } from 'fastify';
import { db } from '@chorechamp/database';
import { members, chores, choreTemplates } from '@chorechamp/database/schema';
import { eq, and, or, gte, lte, isNull } from 'drizzle-orm';
import type {
  AgeGroup,
  AgeSuitability,
  AgeGuideline,
  AgeAppropriateChore,
  AgeRecommendations,
  AgeGroupConfig,
} from '@chorechamp/types';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

// Age group data constants
const AGE_GROUPS_DATA: AgeGroupConfig[] = [
  { id: 'toddler', label: 'Toddler', minAge: 2, maxAge: 3, description: 'Ages 2-3' },
  { id: 'preschool', label: 'Preschool', minAge: 4, maxAge: 5, description: 'Ages 4-5' },
  { id: 'early_elementary', label: 'Early Elementary', minAge: 6, maxAge: 8, description: 'Ages 6-8' },
  { id: 'late_elementary', label: 'Late Elementary', minAge: 9, maxAge: 11, description: 'Ages 9-11' },
  { id: 'middle_school', label: 'Middle School', minAge: 12, maxAge: 14, description: 'Ages 12-14' },
  { id: 'high_school', label: 'High School', minAge: 15, maxAge: 18, description: 'Ages 15-18' },
];

const AGE_GUIDELINES_DATA: AgeGuideline[] = [
  {
    ageGroup: 'toddler',
    label: 'Toddlers (2-3)',
    ageRange: '2-3 years',
    skills: ['Following simple instructions', 'Imitating adults', 'Basic motor skills'],
    sampleChores: ['Put toys in bin', 'Throw trash away', 'Help feed pets', 'Wipe up small spills'],
    tips: [
      'Keep tasks simple and one-step',
      'Use visual cues and pictures',
      'Make it a game',
      'Lots of praise and encouragement',
    ],
  },
  {
    ageGroup: 'preschool',
    label: 'Preschoolers (4-5)',
    ageRange: '4-5 years',
    skills: ['Following 2-3 step instructions', 'Basic sorting', 'Simple cleaning motions'],
    sampleChores: ['Make bed with help', 'Put clothes in hamper', 'Water plants', 'Set table', 'Dust low surfaces'],
    tips: [
      'Break tasks into small steps',
      'Use checklists with pictures',
      'Be patient with quality',
      'Work alongside them',
    ],
  },
  {
    ageGroup: 'early_elementary',
    label: 'Early Elementary (6-8)',
    ageRange: '6-8 years',
    skills: ['Reading simple instructions', 'Using basic tools', 'Time awareness', 'Working independently'],
    sampleChores: ['Make bed alone', 'Sort laundry', 'Empty dishwasher', 'Vacuum small areas', 'Pack lunch'],
    tips: [
      'Introduce chore charts',
      'Allow them to choose some chores',
      'Set clear expectations',
      'Praise effort, not just results',
    ],
  },
  {
    ageGroup: 'late_elementary',
    label: 'Late Elementary (9-11)',
    ageRange: '9-11 years',
    skills: ['Multi-step tasks', 'Using appliances safely', 'Time management', 'Taking initiative'],
    sampleChores: ['Clean bathroom', 'Mop floors', 'Help with cooking', 'Take out trash', 'Care for pets'],
    tips: [
      'Teach proper techniques',
      'Introduce cleaning products safely',
      'Allow more independence',
      'Connect chores to allowance',
    ],
  },
  {
    ageGroup: 'middle_school',
    label: 'Middle School (12-14)',
    ageRange: '12-14 years',
    skills: ['Complex tasks', 'Problem solving', 'Self-management', 'Teaching others'],
    sampleChores: ['Do laundry', 'Cook simple meals', 'Mow lawn', 'Clean entire rooms', 'Babysit siblings'],
    tips: [
      'Give more responsibility',
      'Allow scheduling flexibility',
      'Discuss why chores matter',
      'Rotate challenging tasks',
    ],
  },
  {
    ageGroup: 'high_school',
    label: 'High School (15-18)',
    ageRange: '15-18 years',
    skills: ['All household tasks', 'Financial responsibility', 'Meal planning', 'Home maintenance'],
    sampleChores: ['Plan and cook meals', 'Manage own laundry', 'Deep cleaning', 'Car maintenance', 'Grocery shopping'],
    tips: [
      'Prepare for independence',
      'Discuss adult responsibilities',
      'Allow ownership of tasks',
      'Connect to life skills',
    ],
  },
];

// Helper to get age from birth year
function getAgeFromBirthYear(birthYear: number | null): number | null {
  if (!birthYear) return null;
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
}

// Helper to get age group
function getAgeGroup(age: number): AgeGroup | null {
  for (const group of AGE_GROUPS_DATA) {
    if (age >= group.minAge && age <= group.maxAge) {
      return group.id;
    }
  }
  return null;
}

// Helper to assess chore suitability for an age
function assessAgeSuitability(
  age: number,
  minAge: number | null,
  maxAge: number | null
): { suitability: AgeSuitability; message: string } {
  // No age restrictions - suitable for all
  if (minAge === null && maxAge === null) {
    return {
      suitability: 'suitable',
      message: 'Suitable for all ages',
    };
  }

  // Check if too young
  if (minAge !== null && age < minAge) {
    const yearsUntil = minAge - age;
    return {
      suitability: 'too_young',
      message: `Recommended for age ${minAge}+ (${yearsUntil} year${yearsUntil !== 1 ? 's' : ''} away)`,
    };
  }

  // Check if too easy (well above max age)
  if (maxAge !== null && age > maxAge + 3) {
    return {
      suitability: 'too_easy',
      message: `May be too easy - designed for ages ${maxAge} and under`,
    };
  }

  // Check if at upper end but still suitable
  if (maxAge !== null && age > maxAge) {
    return {
      suitability: 'suitable',
      message: `Designed for ages up to ${maxAge}, but still appropriate`,
    };
  }

  // Check if challenging (at lower end of age range)
  if (minAge !== null && age === minAge) {
    return {
      suitability: 'challenging',
      message: `At the minimum age - may need extra help`,
    };
  }

  // Perfect match
  return {
    suitability: 'perfect',
    message: 'Perfect for this age',
  };
}

// Helper to verify membership
async function verifyMembership(
  userId: string,
  householdId: string
): Promise<typeof members.$inferSelect | null> {
  const [membership] = await db
    .select()
    .from(members)
    .where(
      and(
        eq(members.householdId, householdId),
        eq(members.userId, userId)
      )
    );
  return membership || null;
}

export async function ageAppropriateRoutes(fastify: FastifyInstance) {
  // GET /api/households/:householdId/age-appropriate/guidelines - Get age guidelines
  fastify.get('/guidelines', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    return AGE_GUIDELINES_DATA;
  });

  // GET /api/households/:householdId/age-appropriate/member/:memberId - Get recommendations for a member
  fastify.get('/member/:memberId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };
    const query = request.query as { includeExisting?: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Only parents can view recommendations for others
    if (membership.role !== 'parent' && membership.id !== memberId) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only view your own recommendations',
      });
    }

    // Get the target member
    const targetMember = await db.query.members.findFirst({
      where: and(
        eq(members.id, memberId),
        eq(members.householdId, householdId)
      ),
    });

    if (!targetMember) {
      return reply.status(404).send({ error: 'Member not found' });
    }

    const memberAge = getAgeFromBirthYear(targetMember.birthYear);
    if (memberAge === null) {
      return reply.status(400).send({
        error: 'No birth year',
        message: 'Member must have a birth year set to get age-appropriate recommendations',
      });
    }

    const ageGroup = getAgeGroup(memberAge);
    const ageGroupConfig = AGE_GROUPS_DATA.find((g) => g.id === ageGroup);

    // Get templates appropriate for this age
    const templates = await db.query.choreTemplates.findMany({
      where: and(
        eq(choreTemplates.isActive, true),
        or(
          // Age range includes member's age
          and(
            or(isNull(choreTemplates.minAge), lte(choreTemplates.minAge, memberAge)),
            or(isNull(choreTemplates.maxAge), gte(choreTemplates.maxAge, memberAge - 2)) // Allow slight overage
          ),
          // No age restrictions
          and(isNull(choreTemplates.minAge), isNull(choreTemplates.maxAge))
        )
      ),
    });

    // Get existing chores for this household to exclude
    const existingChores = await db.query.chores.findMany({
      where: and(
        eq(chores.householdId, householdId),
        eq(chores.isActive, true)
      ),
      columns: { id: true, templateId: true, title: true },
    });

    const existingTemplateIds = new Set(existingChores.map((c) => c.templateId).filter(Boolean));
    const existingTitles = new Set(existingChores.map((c) => c.title.toLowerCase()));

    // Process templates into recommendations
    const includeExisting = query.includeExisting === 'true';
    const recommendedChores: AgeAppropriateChore[] = templates
      .filter((template) => {
        if (includeExisting) return true;
        // Exclude if template already used or title matches
        return !existingTemplateIds.has(template.id) && !existingTitles.has(template.title.toLowerCase());
      })
      .map((template) => {
        const { suitability, message } = assessAgeSuitability(
          memberAge,
          template.minAge,
          template.maxAge
        );

        return {
          id: template.id,
          title: template.title,
          description: template.description,
          icon: template.icon || '✅',
          category: template.category,
          pointValue: template.pointValue || 10,
          difficulty: template.difficulty || 'medium',
          estimatedMinutes: template.estimatedMinutes,
          minAge: template.minAge,
          maxAge: template.maxAge,
          suitability,
          suitabilityMessage: message,
          steps: template.steps as string[] | null,
        };
      })
      .sort((a, b) => {
        // Sort by suitability first
        const suitabilityOrder: Record<AgeSuitability, number> = {
          perfect: 0,
          suitable: 1,
          challenging: 2,
          too_easy: 3,
          too_young: 4,
        };
        const suitDiff = suitabilityOrder[a.suitability] - suitabilityOrder[b.suitability];
        if (suitDiff !== 0) return suitDiff;
        // Then by category
        return a.category.localeCompare(b.category);
      });

    // Group by category
    const byCategory = new Map<string, AgeAppropriateChore[]>();
    for (const chore of recommendedChores) {
      const existing = byCategory.get(chore.category) || [];
      existing.push(chore);
      byCategory.set(chore.category, existing);
    }

    const recommendations = Array.from(byCategory.entries()).map(([category, categoryChores]) => ({
      category,
      chores: categoryChores,
    }));

    const result: AgeRecommendations = {
      memberId: targetMember.id,
      memberName: targetMember.name,
      memberAge,
      ageGroup: ageGroup || 'early_elementary',
      ageGroupLabel: ageGroupConfig?.label || 'Unknown',
      recommendations,
      existingChoreIds: existingChores.map((c) => c.id),
    };

    return result;
  });

  // GET /api/households/:householdId/age-appropriate/assess/:choreId/:memberId - Assess a specific chore for a member
  fastify.get('/assess/:choreId/:memberId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, choreId, memberId } = request.params as {
      householdId: string;
      choreId: string;
      memberId: string;
    };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get the chore
    const chore = await db.query.chores.findFirst({
      where: and(
        eq(chores.id, choreId),
        eq(chores.householdId, householdId)
      ),
    });

    if (!chore) {
      return reply.status(404).send({ error: 'Chore not found' });
    }

    // Get the member
    const targetMember = await db.query.members.findFirst({
      where: and(
        eq(members.id, memberId),
        eq(members.householdId, householdId)
      ),
    });

    if (!targetMember) {
      return reply.status(404).send({ error: 'Member not found' });
    }

    const memberAge = getAgeFromBirthYear(targetMember.birthYear);
    if (memberAge === null) {
      return {
        choreId,
        memberId,
        memberAge: null,
        suitability: 'suitable' as AgeSuitability,
        message: 'No birth year set - unable to assess age appropriateness',
        ageGroup: null,
      };
    }

    // If chore has a template, use template age ranges
    let minAge: number | null = null;
    let maxAge: number | null = null;

    if (chore.templateId) {
      const template = await db.query.choreTemplates.findFirst({
        where: eq(choreTemplates.id, chore.templateId),
        columns: { minAge: true, maxAge: true },
      });
      if (template) {
        minAge = template.minAge;
        maxAge = template.maxAge;
      }
    }

    // Infer from difficulty if no template
    if (minAge === null && maxAge === null && chore.difficulty) {
      const difficultyAgeMap: Record<string, { minAge: number; maxAge: number }> = {
        easy: { minAge: 2, maxAge: 18 },
        medium: { minAge: 6, maxAge: 18 },
        hard: { minAge: 10, maxAge: 18 },
      };
      const diffMap = difficultyAgeMap[chore.difficulty];
      if (diffMap) {
        minAge = diffMap.minAge;
        maxAge = diffMap.maxAge;
      }
    }

    const { suitability, message } = assessAgeSuitability(memberAge, minAge, maxAge);
    const ageGroup = getAgeGroup(memberAge);

    return {
      choreId,
      choreTitle: chore.title,
      memberId,
      memberName: targetMember.name,
      memberAge,
      suitability,
      message,
      ageGroup,
      inferredFromDifficulty: chore.templateId === null,
    };
  });

  // GET /api/households/:householdId/age-appropriate/bulk-assess/:memberId - Assess all household chores for a member
  fastify.get('/bulk-assess/:memberId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get the member
    const targetMember = await db.query.members.findFirst({
      where: and(
        eq(members.id, memberId),
        eq(members.householdId, householdId)
      ),
    });

    if (!targetMember) {
      return reply.status(404).send({ error: 'Member not found' });
    }

    const memberAge = getAgeFromBirthYear(targetMember.birthYear);
    if (memberAge === null) {
      return {
        memberId,
        memberName: targetMember.name,
        memberAge: null,
        assessments: [],
        message: 'No birth year set - unable to assess age appropriateness',
      };
    }

    // Get all active chores
    const householdChores = await db.query.chores.findMany({
      where: and(
        eq(chores.householdId, householdId),
        eq(chores.isActive, true)
      ),
    });

    // Get all templates for chores with templateId
    const templateIds = householdChores.map((c) => c.templateId).filter(Boolean) as string[];
    const templates = templateIds.length > 0
      ? await db.query.choreTemplates.findMany({
          where: eq(choreTemplates.isActive, true),
        })
      : [];
    const templateMap = new Map(templates.map((t) => [t.id, t]));

    // Assess each chore
    const assessments = householdChores.map((chore) => {
      let minAge: number | null = null;
      let maxAge: number | null = null;

      // Use template age ranges if available
      if (chore.templateId) {
        const template = templateMap.get(chore.templateId);
        if (template) {
          minAge = template.minAge;
          maxAge = template.maxAge;
        }
      }

      // Infer from difficulty if no template
      if (minAge === null && maxAge === null && chore.difficulty) {
        const difficultyAgeMap: Record<string, { minAge: number; maxAge: number }> = {
          easy: { minAge: 2, maxAge: 18 },
          medium: { minAge: 6, maxAge: 18 },
          hard: { minAge: 10, maxAge: 18 },
        };
        const diffMap = difficultyAgeMap[chore.difficulty];
        if (diffMap) {
          minAge = diffMap.minAge;
          maxAge = diffMap.maxAge;
        }
      }

      const { suitability, message } = assessAgeSuitability(memberAge, minAge, maxAge);

      return {
        choreId: chore.id,
        choreTitle: chore.title,
        choreIcon: chore.icon || '✅',
        category: chore.category || 'general',
        difficulty: chore.difficulty || 'medium',
        suitability,
        message,
      };
    });

    // Group by suitability
    const bySuitability: Record<AgeSuitability, typeof assessments> = {
      perfect: [],
      suitable: [],
      challenging: [],
      too_young: [],
      too_easy: [],
    };

    for (const assessment of assessments) {
      bySuitability[assessment.suitability].push(assessment);
    }

    return {
      memberId,
      memberName: targetMember.name,
      memberAge,
      ageGroup: getAgeGroup(memberAge),
      assessments,
      summary: {
        perfect: bySuitability.perfect.length,
        suitable: bySuitability.suitable.length,
        challenging: bySuitability.challenging.length,
        tooYoung: bySuitability.too_young.length,
        tooEasy: bySuitability.too_easy.length,
      },
    };
  });
}
