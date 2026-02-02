import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@chorechamp/database';
import {
  educationalChoreTemplates,
  educationalQuestions,
  educationalSessions,
  educationalAnswers,
  memberEducationalProgress,
  educationalAchievements,
  choreEducationalLinks,
  learningPaths,
  memberLearningPathProgress,
  members,
} from '@chorechamp/database/schema';
import { CONTENT_TYPE_CONFIG } from '@chorechamp/types';

// Zod schemas
const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  contentType: z.enum([
    'math_facts', 'spelling', 'vocabulary', 'reading', 'trivia',
    'science', 'history', 'geography', 'language', 'life_skills', 'custom',
  ]),
  difficulty: z.enum(['easy', 'medium', 'hard', 'adaptive']).default('medium'),
  timing: z.enum(['before_chore', 'during_chore', 'after_chore', 'any']).default('after_chore'),
  questionsRequired: z.number().min(1).max(50).default(5),
  minimumCorrectPercent: z.number().min(0).max(100).default(70),
  timeLimit: z.number().min(1).max(60).optional(),
  allowRetry: z.boolean().default(true),
  maxRetries: z.number().min(1).max(10).default(3),
  retryDelay: z.number().min(0).max(60).default(5),
  bonusPointsForPerfect: z.number().min(0).max(100).default(10),
  bonusScreenTimeMinutes: z.number().min(0).max(60).optional(),
  minAge: z.number().min(3).max(18).optional(),
  maxAge: z.number().min(3).max(18).optional(),
  gradeLevel: z.string().max(20).optional(),
});

const createQuestionSchema = z.object({
  contentType: z.enum([
    'math_facts', 'spelling', 'vocabulary', 'reading', 'trivia',
    'science', 'history', 'geography', 'language', 'life_skills', 'custom',
  ]),
  difficulty: z.enum(['easy', 'medium', 'hard', 'adaptive']),
  gradeLevel: z.string().max(20).optional(),
  question: z.string().min(1).max(1000),
  questionType: z.enum(['multiple_choice', 'true_false', 'fill_blank', 'short_answer', 'matching']).default('multiple_choice'),
  options: z.array(z.string()).min(2).max(6).optional(),
  correctAnswer: z.string().min(1).max(500),
  explanation: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  topic: z.string().max(100).optional(),
  subtopic: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
});

const startSessionSchema = z.object({
  memberId: z.string().uuid(),
  choreId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  contentType: z.enum([
    'math_facts', 'spelling', 'vocabulary', 'reading', 'trivia',
    'science', 'history', 'geography', 'language', 'life_skills', 'custom',
  ]),
  difficulty: z.enum(['easy', 'medium', 'hard', 'adaptive']),
  questionCount: z.number().min(1).max(50).default(5),
  timeLimitMinutes: z.number().min(1).max(60).optional(),
});

const submitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  answer: z.string().min(1),
  timeSpentSeconds: z.number().min(0).default(0),
});

const createLearningPathSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  contentType: z.enum([
    'math_facts', 'spelling', 'vocabulary', 'reading', 'trivia',
    'science', 'history', 'geography', 'language', 'life_skills', 'custom',
  ]),
  levels: z.array(z.object({
    levelNumber: z.number().min(1),
    name: z.string().min(1).max(100),
    description: z.string().max(500).nullable(),
    difficulty: z.enum(['easy', 'medium', 'hard', 'adaptive']),
    questionsToPass: z.number().min(1).max(50),
    passingPercent: z.number().min(0).max(100),
    topics: z.array(z.string()),
    rewardPoints: z.number().min(0),
    rewardBadge: z.string().nullable(),
  })),
  requireSequential: z.boolean().default(true),
  allowSkipAhead: z.boolean().default(false),
});

export async function educationalChoreRoutes(fastify: FastifyInstance) {
  // ========================================
  // Configuration
  // ========================================

  fastify.get('/educational/content-types', async () => {
    return { contentTypes: CONTENT_TYPE_CONFIG };
  });

  // ========================================
  // Templates
  // ========================================

  fastify.get<{
    Params: { householdId: string };
    Querystring: { contentType?: string };
  }>('/educational/templates', async (request) => {
    const { householdId } = request.params;
    const { contentType } = request.query;

    const conditions = [eq(educationalChoreTemplates.householdId, householdId)];
    if (contentType) {
      conditions.push(eq(educationalChoreTemplates.contentType, contentType));
    }

    const templates = await db.query.educationalChoreTemplates.findMany({
      where: and(...conditions),
      orderBy: [desc(educationalChoreTemplates.createdAt)],
    });

    return { templates };
  });

  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof createTemplateSchema>;
  }>('/educational/templates', async (request, reply) => {
    const { householdId } = request.params;
    const data = createTemplateSchema.parse(request.body);

    const [template] = await db
      .insert(educationalChoreTemplates)
      .values({
        householdId,
        ...data,
      })
      .returning();

    return reply.status(201).send({ template });
  });

  fastify.patch<{
    Params: { householdId: string; templateId: string };
    Body: Partial<z.infer<typeof createTemplateSchema>> & { isEnabled?: boolean };
  }>('/educational/templates/:templateId', async (request, reply) => {
    const { householdId, templateId } = request.params;
    const data = request.body;

    const existing = await db.query.educationalChoreTemplates.findFirst({
      where: and(
        eq(educationalChoreTemplates.id, templateId),
        eq(educationalChoreTemplates.householdId, householdId)
      ),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    const [updated] = await db
      .update(educationalChoreTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(educationalChoreTemplates.id, templateId))
      .returning();

    return { template: updated };
  });

  // ========================================
  // Questions
  // ========================================

  fastify.get<{
    Params: { householdId: string };
    Querystring: { contentType?: string; difficulty?: string; limit?: string };
  }>('/educational/questions', async (request) => {
    const { contentType, difficulty, limit } = request.query;

    const conditions = [];
    // Include system questions and household-specific
    if (contentType) conditions.push(eq(educationalQuestions.contentType, contentType));
    if (difficulty) conditions.push(eq(educationalQuestions.difficulty, difficulty));
    conditions.push(eq(educationalQuestions.isActive, true));

    const questions = await db.query.educationalQuestions.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      limit: limit ? parseInt(limit) : 50,
    });

    return { questions };
  });

  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof createQuestionSchema>;
  }>('/educational/questions', async (request, reply) => {
    const { householdId } = request.params;
    const data = createQuestionSchema.parse(request.body);

    const [question] = await db
      .insert(educationalQuestions)
      .values({
        householdId,
        ...data,
      })
      .returning();

    return reply.status(201).send({ question });
  });

  fastify.post<{
    Params: { householdId: string };
    Body: { questions: z.infer<typeof createQuestionSchema>[] };
  }>('/educational/questions/bulk', async (request, reply) => {
    const { householdId } = request.params;
    const { questions: questionsInput } = request.body;

    const validatedQuestions = questionsInput.map((q) => ({
      householdId,
      ...createQuestionSchema.parse(q),
    }));

    const questions = await db
      .insert(educationalQuestions)
      .values(validatedQuestions)
      .returning();

    return reply.status(201).send({ questions, count: questions.length });
  });

  // ========================================
  // Sessions
  // ========================================

  fastify.get<{
    Params: { householdId: string };
    Querystring: { memberId?: string; status?: string; limit?: string };
  }>('/educational/sessions', async (request) => {
    const { householdId } = request.params;
    const { memberId, status, limit } = request.query;

    const conditions = [eq(educationalSessions.householdId, householdId)];
    if (memberId) conditions.push(eq(educationalSessions.memberId, memberId));
    if (status) conditions.push(eq(educationalSessions.status, status));

    const sessions = await db
      .select({
        session: educationalSessions,
        member: {
          id: members.id,
          name: members.name,
        },
      })
      .from(educationalSessions)
      .leftJoin(members, eq(educationalSessions.memberId, members.id))
      .where(and(...conditions))
      .orderBy(desc(educationalSessions.createdAt))
      .limit(limit ? parseInt(limit) : 50);

    return {
      sessions: sessions.map((s) => ({
        ...s.session,
        member: s.member,
      })),
    };
  });

  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof startSessionSchema>;
  }>('/educational/sessions/start', async (request, reply) => {
    const { householdId } = request.params;
    const data = startSessionSchema.parse(request.body);

    // Get questions for this session
    const questions = await db.query.educationalQuestions.findMany({
      where: and(
        eq(educationalQuestions.contentType, data.contentType),
        eq(educationalQuestions.difficulty, data.difficulty),
        eq(educationalQuestions.isActive, true)
      ),
      limit: data.questionCount * 2, // Get more to randomize
    });

    if (questions.length < data.questionCount) {
      return reply.status(400).send({
        error: 'Not enough questions available',
        available: questions.length,
        requested: data.questionCount,
      });
    }

    // Randomize and select
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, data.questionCount);

    const [session] = await db
      .insert(educationalSessions)
      .values({
        householdId,
        memberId: data.memberId,
        choreId: data.choreId,
        templateId: data.templateId,
        contentType: data.contentType,
        difficulty: data.difficulty,
        totalQuestions: data.questionCount,
        timeLimitMinutes: data.timeLimitMinutes,
        minimumRequired: Math.ceil(data.questionCount * 0.7), // 70% default
      })
      .returning();

    return reply.status(201).send({
      session,
      questions: selectedQuestions.map((q) => ({
        id: q.id,
        question: q.question,
        questionType: q.questionType,
        options: q.options,
        imageUrl: q.imageUrl,
      })),
    });
  });

  fastify.post<{
    Params: { householdId: string; sessionId: string };
    Body: z.infer<typeof submitAnswerSchema>;
  }>('/educational/sessions/:sessionId/answer', async (request, reply) => {
    const { householdId, sessionId } = request.params;
    const data = submitAnswerSchema.parse(request.body);

    const session = await db.query.educationalSessions.findFirst({
      where: and(
        eq(educationalSessions.id, sessionId),
        eq(educationalSessions.householdId, householdId)
      ),
    });

    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    if (session.status !== 'in_progress') {
      return reply.status(400).send({ error: 'Session is not in progress' });
    }

    // Get the question
    const question = await db.query.educationalQuestions.findFirst({
      where: eq(educationalQuestions.id, data.questionId),
    });

    if (!question) {
      return reply.status(404).send({ error: 'Question not found' });
    }

    // Check answer
    const isCorrect = data.answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();

    // Record answer
    await db.insert(educationalAnswers).values({
      sessionId,
      questionId: data.questionId,
      answer: data.answer,
      isCorrect,
      timeSpentSeconds: data.timeSpentSeconds,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    });

    // Update question stats
    await db
      .update(educationalQuestions)
      .set({
        timesAsked: question.timesAsked + 1,
        timesCorrect: isCorrect ? question.timesCorrect + 1 : question.timesCorrect,
      })
      .where(eq(educationalQuestions.id, data.questionId));

    // Update session
    const newAnswered = session.questionsAnswered + 1;
    const newCorrect = isCorrect ? session.correctAnswers + 1 : session.correctAnswers;
    const newIncorrect = !isCorrect ? session.incorrectAnswers + 1 : session.incorrectAnswers;
    const newTimeSpent = session.timeSpentSeconds + data.timeSpentSeconds;

    const isComplete = newAnswered >= session.totalQuestions;
    let scorePercent = null;
    let passed = null;
    let pointsEarned = 0;
    let bonusPointsEarned = 0;

    if (isComplete) {
      scorePercent = Math.round((newCorrect / session.totalQuestions) * 100);
      passed = newCorrect >= session.minimumRequired;
      pointsEarned = newCorrect * 2; // 2 points per correct answer
      if (scorePercent === 100) {
        bonusPointsEarned = 10; // Perfect score bonus
      }
    }

    const [updatedSession] = await db
      .update(educationalSessions)
      .set({
        questionsAnswered: newAnswered,
        correctAnswers: newCorrect,
        incorrectAnswers: newIncorrect,
        timeSpentSeconds: newTimeSpent,
        status: isComplete ? (passed ? 'completed' : 'failed') : 'in_progress',
        completedAt: isComplete ? new Date() : null,
        scorePercent,
        passed,
        pointsEarned,
        bonusPointsEarned,
        canRetry: !passed && session.attemptNumber < 3,
      })
      .where(eq(educationalSessions.id, sessionId))
      .returning();

    // If complete, update member progress
    if (isComplete) {
      await updateMemberProgress(session.memberId, householdId, {
        contentType: session.contentType,
        correct: newCorrect,
        total: session.totalQuestions,
        points: pointsEarned + bonusPointsEarned,
      });
    }

    return {
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      session: updatedSession,
      isComplete,
    };
  });

  fastify.post<{
    Params: { householdId: string; sessionId: string };
  }>('/educational/sessions/:sessionId/complete', async (request, reply) => {
    const { householdId, sessionId } = request.params;

    const session = await db.query.educationalSessions.findFirst({
      where: and(
        eq(educationalSessions.id, sessionId),
        eq(educationalSessions.householdId, householdId)
      ),
    });

    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    const scorePercent = session.questionsAnswered > 0
      ? Math.round((session.correctAnswers / session.questionsAnswered) * 100)
      : 0;
    const passed = session.correctAnswers >= session.minimumRequired;

    const [updated] = await db
      .update(educationalSessions)
      .set({
        status: passed ? 'completed' : 'failed',
        completedAt: new Date(),
        scorePercent,
        passed,
        pointsEarned: session.correctAnswers * 2,
        bonusPointsEarned: scorePercent === 100 ? 10 : 0,
      })
      .where(eq(educationalSessions.id, sessionId))
      .returning();

    return { session: updated };
  });

  // ========================================
  // Chore Links
  // ========================================

  fastify.get<{
    Params: { householdId: string; choreId: string };
  }>('/educational/chore-links/:choreId', async (request) => {
    const { householdId, choreId } = request.params;

    const links = await db
      .select({
        link: choreEducationalLinks,
        template: educationalChoreTemplates,
      })
      .from(choreEducationalLinks)
      .leftJoin(educationalChoreTemplates, eq(choreEducationalLinks.templateId, educationalChoreTemplates.id))
      .where(and(
        eq(choreEducationalLinks.choreId, choreId),
        eq(choreEducationalLinks.householdId, householdId)
      ));

    return {
      links: links.map((l) => ({
        ...l.link,
        template: l.template,
      })),
    };
  });

  fastify.post<{
    Params: { householdId: string };
    Body: { choreId: string; templateId: string; isRequired?: boolean };
  }>('/educational/chore-links', async (request, reply) => {
    const { householdId } = request.params;
    const { choreId, templateId, isRequired = true } = request.body;

    const [link] = await db
      .insert(choreEducationalLinks)
      .values({
        householdId,
        choreId,
        templateId,
        isRequired,
      })
      .returning();

    return reply.status(201).send({ link });
  });

  // ========================================
  // Member Progress
  // ========================================

  fastify.get<{
    Params: { householdId: string; memberId: string };
  }>('/educational/progress/:memberId', async (request) => {
    const { householdId, memberId } = request.params;

    let progress = await db.query.memberEducationalProgress.findFirst({
      where: and(
        eq(memberEducationalProgress.memberId, memberId),
        eq(memberEducationalProgress.householdId, householdId)
      ),
    });

    if (!progress) {
      [progress] = await db
        .insert(memberEducationalProgress)
        .values({
          memberId,
          householdId,
        })
        .returning();
    }

    return { progress };
  });

  // ========================================
  // Achievements
  // ========================================

  fastify.get<{
    Params: { householdId: string };
    Querystring: { memberId?: string };
  }>('/educational/achievements', async (request) => {
    const { householdId } = request.params;
    const { memberId } = request.query;

    const conditions = [eq(educationalAchievements.householdId, householdId)];
    if (memberId) conditions.push(eq(educationalAchievements.memberId, memberId));

    const achievements = await db.query.educationalAchievements.findMany({
      where: and(...conditions),
      orderBy: [desc(educationalAchievements.earnedAt)],
    });

    return { achievements };
  });

  // ========================================
  // Learning Paths
  // ========================================

  fastify.get<{
    Params: { householdId: string };
    Querystring: { contentType?: string };
  }>('/educational/paths', async (request) => {
    const { householdId } = request.params;
    const { contentType } = request.query;

    const conditions = [
      eq(learningPaths.householdId, householdId),
      eq(learningPaths.isActive, true),
    ];
    if (contentType) conditions.push(eq(learningPaths.contentType, contentType));

    const paths = await db.query.learningPaths.findMany({
      where: and(...conditions),
      orderBy: [desc(learningPaths.createdAt)],
    });

    return { paths };
  });

  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof createLearningPathSchema>;
  }>('/educational/paths', async (request, reply) => {
    const { householdId } = request.params;
    const data = createLearningPathSchema.parse(request.body);

    const [path] = await db
      .insert(learningPaths)
      .values({
        householdId,
        ...data,
      })
      .returning();

    return reply.status(201).send({ path });
  });

  fastify.get<{
    Params: { householdId: string; memberId: string; pathId: string };
  }>('/educational/paths/:pathId/progress/:memberId', async (request) => {
    const { householdId, memberId, pathId } = request.params;

    let progress = await db.query.memberLearningPathProgress.findFirst({
      where: and(
        eq(memberLearningPathProgress.memberId, memberId),
        eq(memberLearningPathProgress.pathId, pathId)
      ),
    });

    if (!progress) {
      [progress] = await db
        .insert(memberLearningPathProgress)
        .values({
          memberId,
          pathId,
          householdId,
        })
        .returning();
    }

    return { progress };
  });
}

// Helper function to update member progress
async function updateMemberProgress(
  memberId: string,
  householdId: string,
  data: { contentType: string; correct: number; total: number; points: number }
) {
  let progress = await db.query.memberEducationalProgress.findFirst({
    where: eq(memberEducationalProgress.memberId, memberId),
  });

  if (!progress) {
    await db.insert(memberEducationalProgress).values({
      memberId,
      householdId,
    });
    progress = await db.query.memberEducationalProgress.findFirst({
      where: eq(memberEducationalProgress.memberId, memberId),
    });
  }

  if (!progress) return;

  const progressByType = (progress.progressByType || {}) as Record<string, {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    currentStreak: number;
    bestStreak: number;
    averageTimeSeconds: number;
    masteryLevel: number;
  }>;

  const typeProgress = progressByType[data.contentType] || {
    totalQuestions: 0,
    correctAnswers: 0,
    accuracy: 0,
    currentStreak: 0,
    bestStreak: 0,
    averageTimeSeconds: 0,
    masteryLevel: 0,
  };

  typeProgress.totalQuestions += data.total;
  typeProgress.correctAnswers += data.correct;
  typeProgress.accuracy = Math.round((typeProgress.correctAnswers / typeProgress.totalQuestions) * 100);

  if (data.correct === data.total) {
    typeProgress.currentStreak += 1;
    typeProgress.bestStreak = Math.max(typeProgress.bestStreak, typeProgress.currentStreak);
  } else {
    typeProgress.currentStreak = 0;
  }

  typeProgress.masteryLevel = Math.min(100, Math.floor(typeProgress.accuracy * (typeProgress.totalQuestions / 100)));

  progressByType[data.contentType] = typeProgress;

  const totalQuestions = progress.totalQuestionsAnswered + data.total;
  const totalCorrect = progress.totalCorrect + data.correct;

  await db
    .update(memberEducationalProgress)
    .set({
      progressByType,
      totalSessions: progress.totalSessions + 1,
      totalQuestionsAnswered: totalQuestions,
      totalCorrect,
      overallAccuracy: Math.round((totalCorrect / totalQuestions) * 100),
      totalPointsEarned: progress.totalPointsEarned + data.points,
      lastActivityDate: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(memberEducationalProgress.id, progress.id));
}
