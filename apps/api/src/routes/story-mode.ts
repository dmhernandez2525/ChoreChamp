// Story Mode Adventure Routes (F9.5)

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, asc, inArray, sql } from 'drizzle-orm';
import { db } from '@chorechamp/database';
import {
  storyCharacters,
  storyChapters,
  chapterCharacters,
  storyQuests,
  storyDialogues,
  memberStoryProgress,
  memberChapterProgress,
  memberQuestProgress,
  memberUnlockedCharacters,
  members,
  characterProfiles,
} from '@chorechamp/database/schema';
import {
  getChapterStatus,
  getQuestStatus,
  areAllObjectivesComplete,
  updateObjectiveProgress,
  calculateChapterCompletion,
  applyDifficultyToRewards,
  processChoiceEffect,
  formatPlayTime,
} from '@chorechamp/gamification';
import type {
  StoryChapter,
  StoryQuest,
  StoryDialogue,
  StoryProgress,
  ChapterProgress,
  QuestProgress,
  QuestObjective,
  QuestReward,
  ChapterReward,
  DialogueLine,
  ChoiceEffect,
  StoryDifficulty,
  QuestStatus,
} from '@chorechamp/types';

// Helper to get or create member story progress
async function getOrCreateStoryProgress(memberId: string, householdId: string) {
  const [existing] = await db
    .select()
    .from(memberStoryProgress)
    .where(eq(memberStoryProgress.memberId, memberId));

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(memberStoryProgress)
    .values({
      memberId,
      householdId,
      chaptersCompleted: 0,
      questsCompleted: 0,
      totalPlayTime: 0,
      choicesMade: 0,
      unlockedCharacters: [],
      earnedTitles: [],
    })
    .returning();

  return created;
}

// Helper to get member's level
async function getMemberLevel(memberId: string): Promise<number> {
  const [profile] = await db
    .select({ level: characterProfiles.level })
    .from(characterProfiles)
    .where(eq(characterProfiles.memberId, memberId));

  return profile?.level || 1;
}

// Helper to get completed chapter IDs
async function getCompletedChapterIds(memberId: string): Promise<Set<string>> {
  const completed = await db
    .select({ chapterId: memberChapterProgress.chapterId })
    .from(memberChapterProgress)
    .where(
      and(
        eq(memberChapterProgress.memberId, memberId),
        eq(memberChapterProgress.status, 'completed')
      )
    );

  return new Set(completed.map(c => c.chapterId));
}

// Helper to get started chapter IDs
async function getStartedChapterIds(memberId: string): Promise<Set<string>> {
  const started = await db
    .select({ chapterId: memberChapterProgress.chapterId })
    .from(memberChapterProgress)
    .where(
      and(
        eq(memberChapterProgress.memberId, memberId),
        eq(memberChapterProgress.status, 'in_progress')
      )
    );

  return new Set(started.map(c => c.chapterId));
}

// Helper to format chapter with progress
async function formatChapterWithProgress(
  chapter: typeof storyChapters.$inferSelect,
  memberId: string,
  memberLevel: number,
  completedChapterIds: Set<string>,
  startedChapterIds: Set<string>
): Promise<{ chapter: StoryChapter; progress: ChapterProgress }> {
  // Get chapter progress
  const [chapterProgress] = await db
    .select()
    .from(memberChapterProgress)
    .where(
      and(
        eq(memberChapterProgress.memberId, memberId),
        eq(memberChapterProgress.chapterId, chapter.id)
      )
    );

  // Get quests for this chapter
  const quests = await db
    .select()
    .from(storyQuests)
    .where(eq(storyQuests.chapterId, chapter.id))
    .orderBy(asc(storyQuests.orderInChapter));

  // Get characters for this chapter
  const chapterChars = await db
    .select({
      character: storyCharacters,
      role: chapterCharacters.role,
    })
    .from(chapterCharacters)
    .innerJoin(storyCharacters, eq(chapterCharacters.characterId, storyCharacters.id))
    .where(eq(chapterCharacters.chapterId, chapter.id))
    .orderBy(asc(chapterCharacters.sortOrder));

  // Determine status
  const status = getChapterStatus(
    chapter.id,
    chapter.prerequisiteChapterId,
    chapter.requiredLevel || 1,
    memberLevel,
    completedChapterIds,
    startedChapterIds
  );

  const totalQuests = quests.length;
  const questsCompleted = chapterProgress?.questsCompleted || 0;

  return {
    chapter: {
      id: chapter.id,
      number: chapter.number,
      title: chapter.title,
      description: chapter.description,
      artwork: chapter.artwork,
      theme: chapter.theme,
      difficulty: chapter.difficulty as StoryDifficulty,
      requiredLevel: chapter.requiredLevel || 1,
      prerequisiteChapterId: chapter.prerequisiteChapterId,
      quests: quests.map(q => formatQuest(q)),
      characters: chapterChars.map(cc => ({
        id: cc.character.id,
        name: cc.character.name,
        title: cc.character.title,
        description: cc.character.description,
        avatar: cc.character.avatar,
        personality: cc.character.personality,
        unlockCondition: cc.character.unlockCondition,
        isUnlocked: true,  // Will be checked separately
      })),
      rewards: chapter.rewards as ChapterReward,
      estimatedDuration: chapter.estimatedDuration || 30,
      isActive: chapter.isActive ?? true,
      releasedAt: chapter.releasedAt!,
    },
    progress: {
      chapterId: chapter.id,
      status,
      questsCompleted,
      totalQuests,
      completionPercentage: calculateChapterCompletion(questsCompleted, totalQuests),
      startedAt: chapterProgress?.startedAt || null,
      completedAt: chapterProgress?.completedAt || null,
      bestTime: chapterProgress?.bestTime || null,
      starsEarned: chapterProgress?.starsEarned || 0,
    },
  };
}

// Helper to format quest
function formatQuest(quest: typeof storyQuests.$inferSelect): StoryQuest {
  return {
    id: quest.id,
    chapterId: quest.chapterId,
    orderInChapter: quest.orderInChapter,
    title: quest.title,
    description: quest.description,
    briefing: quest.briefing,
    debriefing: quest.debriefing,
    objectives: quest.objectives as QuestObjective[],
    dialogues: [],  // Loaded separately
    rewards: quest.rewards as QuestReward,
    timeLimit: quest.timeLimit,
    isOptional: quest.isOptional ?? false,
    isBonusQuest: quest.isBonusQuest ?? false,
  };
}

// Helper to format dialogue
function formatDialogue(dialogue: typeof storyDialogues.$inferSelect): StoryDialogue {
  return {
    id: dialogue.id,
    questId: dialogue.questId,
    orderInQuest: dialogue.orderInQuest,
    triggerType: dialogue.triggerType as StoryDialogue['triggerType'],
    triggerId: dialogue.triggerId,
    lines: dialogue.lines as DialogueLine[],
  };
}

export async function storyModeRoutes(app: FastifyInstance) {
  // Get all chapters with progress
  app.get('/story/chapters', {
    schema: {
      querystring: z.object({
        memberId: z.string().uuid(),
        householdId: z.string().uuid(),
      }),
    },
  }, async (request, reply) => {
    const { memberId, householdId } = request.query as { memberId: string; householdId: string };

    // Ensure story progress exists
    await getOrCreateStoryProgress(memberId, householdId);

    // Get member level
    const memberLevel = await getMemberLevel(memberId);

    // Get completion data
    const completedChapterIds = await getCompletedChapterIds(memberId);
    const startedChapterIds = await getStartedChapterIds(memberId);

    // Get all active chapters
    const chapters = await db
      .select()
      .from(storyChapters)
      .where(eq(storyChapters.isActive, true))
      .orderBy(asc(storyChapters.number));

    // Format chapters with progress
    const chaptersWithProgress = await Promise.all(
      chapters.map(chapter =>
        formatChapterWithProgress(chapter, memberId, memberLevel, completedChapterIds, startedChapterIds)
      )
    );

    return reply.send({
      chapters: chaptersWithProgress,
      memberLevel,
      totalChapters: chapters.length,
      completedChapters: completedChapterIds.size,
    });
  });

  // Get specific chapter details
  app.get('/story/chapters/:chapterId', {
    schema: {
      params: z.object({
        chapterId: z.string(),
      }),
      querystring: z.object({
        memberId: z.string().uuid(),
        householdId: z.string().uuid(),
      }),
    },
  }, async (request, reply) => {
    const { chapterId } = request.params as { chapterId: string };
    const { memberId, householdId } = request.query as { memberId: string; householdId: string };

    // Ensure story progress exists
    await getOrCreateStoryProgress(memberId, householdId);

    // Get chapter
    const [chapter] = await db
      .select()
      .from(storyChapters)
      .where(eq(storyChapters.id, chapterId));

    if (!chapter) {
      return reply.status(404).send({ error: 'Chapter not found' });
    }

    // Get member level and completion data
    const memberLevel = await getMemberLevel(memberId);
    const completedChapterIds = await getCompletedChapterIds(memberId);
    const startedChapterIds = await getStartedChapterIds(memberId);

    // Get chapter with progress
    const chapterWithProgress = await formatChapterWithProgress(
      chapter,
      memberId,
      memberLevel,
      completedChapterIds,
      startedChapterIds
    );

    // Get quest progress for this chapter
    const quests = await db
      .select()
      .from(storyQuests)
      .where(eq(storyQuests.chapterId, chapterId))
      .orderBy(asc(storyQuests.orderInChapter));

    // Get completed/started quest IDs
    const questProgressData = await db
      .select()
      .from(memberQuestProgress)
      .where(
        and(
          eq(memberQuestProgress.memberId, memberId),
          inArray(memberQuestProgress.questId, quests.map(q => q.id))
        )
      );

    const completedQuestIds = new Set(
      questProgressData.filter(p => p.status === 'completed').map(p => p.questId)
    );
    const startedQuestIds = new Set(
      questProgressData.filter(p => p.status === 'in_progress').map(p => p.questId)
    );

    // Find highest completed order
    let highestCompletedOrder = 0;
    for (const quest of quests) {
      if (completedQuestIds.has(quest.id)) {
        highestCompletedOrder = Math.max(highestCompletedOrder, quest.orderInChapter);
      }
    }

    // Format quests with progress
    const questsWithProgress = quests.map(quest => {
      const progress = questProgressData.find(p => p.questId === quest.id);
      const status = getQuestStatus(
        quest.id,
        quest.orderInChapter,
        chapterWithProgress.progress.status,
        completedQuestIds,
        startedQuestIds,
        highestCompletedOrder
      );

      return {
        quest: formatQuest(quest),
        progress: {
          questId: quest.id,
          status,
          objectives: (progress?.objectiveProgress as QuestObjective[]) || quest.objectives,
          currentDialogueId: progress?.currentDialogueId || null,
          dialoguesViewed: (progress?.dialoguesViewed || []) as string[],
          choicesMade: (progress?.choicesMade || {}) as Record<string, string>,
          startedAt: progress?.startedAt || null,
          completedAt: progress?.completedAt || null,
          timeSpent: progress?.timeSpent || 0,
        } as QuestProgress,
      };
    });

    return reply.send({
      chapter: chapterWithProgress.chapter,
      progress: chapterWithProgress.progress,
      quests: questsWithProgress,
    });
  });

  // Get story progress overview
  app.get('/story/progress', {
    schema: {
      querystring: z.object({
        memberId: z.string().uuid(),
        householdId: z.string().uuid(),
      }),
    },
  }, async (request, reply) => {
    const { memberId, householdId } = request.query as { memberId: string; householdId: string };

    // Get or create progress
    const progress = await getOrCreateStoryProgress(memberId, householdId);

    // Get unlocked characters
    const unlockedCharacters = await db
      .select({
        character: storyCharacters,
        unlockedAt: memberUnlockedCharacters.unlockedAt,
      })
      .from(memberUnlockedCharacters)
      .innerJoin(storyCharacters, eq(memberUnlockedCharacters.characterId, storyCharacters.id))
      .where(eq(memberUnlockedCharacters.memberId, memberId));

    // Get default characters (always unlocked)
    const defaultCharacters = await db
      .select()
      .from(storyCharacters)
      .where(eq(storyCharacters.isDefault, true));

    // Get total play time formatted
    const formattedPlayTime = formatPlayTime(progress.totalPlayTime || 0);

    // Get active quest if any
    let activeQuest = null;
    if (progress.currentQuestId) {
      const [quest] = await db
        .select()
        .from(storyQuests)
        .where(eq(storyQuests.id, progress.currentQuestId));

      if (quest) {
        const [questProgress] = await db
          .select()
          .from(memberQuestProgress)
          .where(
            and(
              eq(memberQuestProgress.memberId, memberId),
              eq(memberQuestProgress.questId, quest.id)
            )
          );

        activeQuest = {
          quest: formatQuest(quest),
          progress: questProgress ? {
            questId: quest.id,
            status: questProgress.status as QuestStatus,
            objectives: questProgress.objectiveProgress as QuestObjective[],
            currentDialogueId: questProgress.currentDialogueId,
            dialoguesViewed: questProgress.dialoguesViewed as string[],
            choicesMade: questProgress.choicesMade as Record<string, string>,
            startedAt: questProgress.startedAt,
            completedAt: questProgress.completedAt,
            timeSpent: questProgress.timeSpent || 0,
          } : null,
        };
      }
    }

    return reply.send({
      progress: {
        memberId: progress.memberId,
        currentChapterId: progress.currentChapterId,
        currentQuestId: progress.currentQuestId,
        chaptersCompleted: progress.chaptersCompleted || 0,
        questsCompleted: progress.questsCompleted || 0,
        totalPlayTime: progress.totalPlayTime || 0,
        choicesMade: progress.choicesMade || 0,
        unlockedCharacters: progress.unlockedCharacters || [],
        earnedTitles: progress.earnedTitles || [],
        lastPlayedAt: progress.lastPlayedAt || new Date(),
      } as StoryProgress,
      formattedPlayTime,
      characters: [
        ...defaultCharacters.map(c => ({
          ...c,
          isUnlocked: true,
          unlockedAt: null,
        })),
        ...unlockedCharacters.map(uc => ({
          ...uc.character,
          isUnlocked: true,
          unlockedAt: uc.unlockedAt,
        })),
      ],
      activeQuest,
    });
  });

  // Start a quest
  app.post('/story/quests/:questId/start', {
    schema: {
      params: z.object({
        questId: z.string(),
      }),
      body: z.object({
        memberId: z.string().uuid(),
        householdId: z.string().uuid(),
      }),
    },
  }, async (request, reply) => {
    const { questId } = request.params as { questId: string };
    const { memberId } = request.body as { memberId: string; householdId: string };

    // Get quest
    const [quest] = await db
      .select()
      .from(storyQuests)
      .where(eq(storyQuests.id, questId));

    if (!quest) {
      return reply.status(404).send({ error: 'Quest not found' });
    }

    // Check if quest is already started
    const [existingProgress] = await db
      .select()
      .from(memberQuestProgress)
      .where(
        and(
          eq(memberQuestProgress.memberId, memberId),
          eq(memberQuestProgress.questId, questId)
        )
      );

    if (existingProgress && existingProgress.status !== 'locked') {
      return reply.status(400).send({ error: 'Quest already started or completed' });
    }

    // Create or update quest progress
    const objectives = quest.objectives as QuestObjective[];
    const initialObjectives = objectives.map(obj => ({
      ...obj,
      current: 0,
      isCompleted: false,
    }));

    if (existingProgress) {
      await db
        .update(memberQuestProgress)
        .set({
          status: 'in_progress',
          objectiveProgress: initialObjectives,
          startedAt: new Date(),
        })
        .where(eq(memberQuestProgress.id, existingProgress.id));
    } else {
      await db.insert(memberQuestProgress).values({
        memberId,
        questId,
        status: 'in_progress',
        objectiveProgress: initialObjectives,
        startedAt: new Date(),
      });
    }

    // Update story progress
    await db
      .update(memberStoryProgress)
      .set({
        currentQuestId: questId,
        currentChapterId: quest.chapterId,
        lastPlayedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(memberStoryProgress.memberId, memberId));

    // Update chapter progress if not started
    const [chapterProgress] = await db
      .select()
      .from(memberChapterProgress)
      .where(
        and(
          eq(memberChapterProgress.memberId, memberId),
          eq(memberChapterProgress.chapterId, quest.chapterId)
        )
      );

    if (!chapterProgress) {
      await db.insert(memberChapterProgress).values({
        memberId,
        chapterId: quest.chapterId,
        status: 'in_progress',
        startedAt: new Date(),
      });
    } else if (chapterProgress.status === 'locked') {
      await db
        .update(memberChapterProgress)
        .set({
          status: 'in_progress',
          startedAt: new Date(),
        })
        .where(eq(memberChapterProgress.id, chapterProgress.id));
    }

    // Get opening dialogue
    const [openingDialogue] = await db
      .select()
      .from(storyDialogues)
      .where(
        and(
          eq(storyDialogues.questId, questId),
          eq(storyDialogues.triggerType, 'quest_start')
        )
      )
      .orderBy(asc(storyDialogues.orderInQuest))
      .limit(1);

    return reply.send({
      quest: {
        quest: formatQuest(quest),
        progress: {
          questId: quest.id,
          status: 'in_progress' as QuestStatus,
          objectives: initialObjectives,
          currentDialogueId: openingDialogue?.id || null,
          dialoguesViewed: [],
          choicesMade: {},
          startedAt: new Date(),
          completedAt: null,
          timeSpent: 0,
        },
      },
      openingDialogue: openingDialogue ? formatDialogue(openingDialogue) : null,
    });
  });

  // Update quest objective progress
  app.post('/story/quests/:questId/objectives/:objectiveId/progress', {
    schema: {
      params: z.object({
        questId: z.string(),
        objectiveId: z.string(),
      }),
      body: z.object({
        memberId: z.string().uuid(),
        progressAmount: z.number().int().positive().default(1),
      }),
    },
  }, async (request, reply) => {
    const { questId, objectiveId } = request.params as { questId: string; objectiveId: string };
    const { memberId, progressAmount } = request.body as { memberId: string; progressAmount: number };

    // Get quest progress
    const [questProgress] = await db
      .select()
      .from(memberQuestProgress)
      .where(
        and(
          eq(memberQuestProgress.memberId, memberId),
          eq(memberQuestProgress.questId, questId)
        )
      );

    if (!questProgress || questProgress.status !== 'in_progress') {
      return reply.status(400).send({ error: 'Quest not in progress' });
    }

    // Update objective
    const objectives = questProgress.objectiveProgress as QuestObjective[];
    const objectiveIndex = objectives.findIndex(o => o.id === objectiveId);

    if (objectiveIndex === -1) {
      return reply.status(404).send({ error: 'Objective not found' });
    }

    const updatedObjective = updateObjectiveProgress(objectives[objectiveIndex], progressAmount);
    objectives[objectiveIndex] = updatedObjective;

    await db
      .update(memberQuestProgress)
      .set({ objectiveProgress: objectives })
      .where(eq(memberQuestProgress.id, questProgress.id));

    // Check if objective triggered a dialogue
    let triggeredDialogue = null;
    if (updatedObjective.isCompleted) {
      const [dialogue] = await db
        .select()
        .from(storyDialogues)
        .where(
          and(
            eq(storyDialogues.questId, questId),
            eq(storyDialogues.triggerType, 'objective_complete'),
            eq(storyDialogues.triggerId, objectiveId)
          )
        );

      if (dialogue) {
        triggeredDialogue = formatDialogue(dialogue);
      }
    }

    // Check if all objectives complete
    const allComplete = areAllObjectivesComplete(objectives);

    return reply.send({
      objective: updatedObjective,
      questProgress: {
        questId,
        status: 'in_progress' as QuestStatus,
        objectives,
        currentDialogueId: questProgress.currentDialogueId,
        dialoguesViewed: questProgress.dialoguesViewed as string[],
        choicesMade: questProgress.choicesMade as Record<string, string>,
        startedAt: questProgress.startedAt,
        completedAt: null,
        timeSpent: questProgress.timeSpent || 0,
      },
      triggeredDialogue,
      allObjectivesComplete: allComplete,
    });
  });

  // Complete a quest
  app.post('/story/quests/:questId/complete', {
    schema: {
      params: z.object({
        questId: z.string(),
      }),
      body: z.object({
        memberId: z.string().uuid(),
        householdId: z.string().uuid(),
      }),
    },
  }, async (request, reply) => {
    const { questId } = request.params as { questId: string };
    const { memberId } = request.body as { memberId: string; householdId: string };

    // Get quest
    const [quest] = await db
      .select()
      .from(storyQuests)
      .where(eq(storyQuests.id, questId));

    if (!quest) {
      return reply.status(404).send({ error: 'Quest not found' });
    }

    // Get quest progress
    const [questProgress] = await db
      .select()
      .from(memberQuestProgress)
      .where(
        and(
          eq(memberQuestProgress.memberId, memberId),
          eq(memberQuestProgress.questId, questId)
        )
      );

    if (!questProgress || questProgress.status !== 'in_progress') {
      return reply.status(400).send({ error: 'Quest not in progress' });
    }

    // Verify all objectives complete
    const objectives = questProgress.objectiveProgress as QuestObjective[];
    if (!areAllObjectivesComplete(objectives)) {
      return reply.status(400).send({ error: 'Not all objectives completed' });
    }

    // Calculate time spent
    const startedAt = questProgress.startedAt || new Date();
    const timeSpent = Math.floor((Date.now() - startedAt.getTime()) / 60000);

    // Update quest progress
    await db
      .update(memberQuestProgress)
      .set({
        status: 'completed',
        completedAt: new Date(),
        timeSpent,
      })
      .where(eq(memberQuestProgress.id, questProgress.id));

    // Get chapter info
    const [chapter] = await db
      .select()
      .from(storyChapters)
      .where(eq(storyChapters.id, quest.chapterId));

    // Apply difficulty to rewards
    const baseRewards = quest.rewards as QuestReward;
    const rewards = applyDifficultyToRewards(baseRewards, (chapter?.difficulty || 'medium') as StoryDifficulty);

    // Award points to member
    await db
      .update(members)
      .set({
        pointsCurrent: sql`points_current + ${rewards.points}`,
        pointsLifetime: sql`points_lifetime + ${rewards.points}`,
      })
      .where(eq(members.id, memberId));

    // Award XP to character profile
    await db
      .update(characterProfiles)
      .set({
        xp: sql`xp + ${rewards.xp}`,
        xpLifetime: sql`xp_lifetime + ${rewards.xp}`,
      })
      .where(eq(characterProfiles.memberId, memberId));

    // Update chapter progress
    const [chapterProgress] = await db
      .select()
      .from(memberChapterProgress)
      .where(
        and(
          eq(memberChapterProgress.memberId, memberId),
          eq(memberChapterProgress.chapterId, quest.chapterId)
        )
      );

    const newQuestsCompleted = (chapterProgress?.questsCompleted || 0) + 1;

    // Get total quests in chapter
    const [questCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(storyQuests)
      .where(
        and(
          eq(storyQuests.chapterId, quest.chapterId),
          eq(storyQuests.isOptional, false)
        )
      );

    const totalRequiredQuests = questCountResult?.count || 0;
    const chapterCompleted = newQuestsCompleted >= totalRequiredQuests;

    // Update chapter progress
    if (chapterProgress) {
      await db
        .update(memberChapterProgress)
        .set({
          questsCompleted: newQuestsCompleted,
          status: chapterCompleted ? 'completed' : 'in_progress',
          completedAt: chapterCompleted ? new Date() : null,
        })
        .where(eq(memberChapterProgress.id, chapterProgress.id));
    }

    // Update story progress
    const [storyProgress] = await db
      .select()
      .from(memberStoryProgress)
      .where(eq(memberStoryProgress.memberId, memberId));

    await db
      .update(memberStoryProgress)
      .set({
        questsCompleted: (storyProgress?.questsCompleted || 0) + 1,
        chaptersCompleted: chapterCompleted
          ? (storyProgress?.chaptersCompleted || 0) + 1
          : storyProgress?.chaptersCompleted || 0,
        totalPlayTime: (storyProgress?.totalPlayTime || 0) + timeSpent,
        currentQuestId: null,
        lastPlayedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(memberStoryProgress.memberId, memberId));

    // Get closing dialogue
    const [closingDialogue] = await db
      .select()
      .from(storyDialogues)
      .where(
        and(
          eq(storyDialogues.questId, questId),
          eq(storyDialogues.triggerType, 'quest_end')
        )
      )
      .orderBy(asc(storyDialogues.orderInQuest))
      .limit(1);

    // Calculate chapter rewards if completed
    let chapterRewards = null;
    if (chapterCompleted && chapter) {
      chapterRewards = chapter.rewards as ChapterReward;

      // Award chapter rewards - points to member
      await db
        .update(members)
        .set({
          pointsCurrent: sql`points_current + ${chapterRewards.points}`,
          pointsLifetime: sql`points_lifetime + ${chapterRewards.points}`,
        })
        .where(eq(members.id, memberId));

      // Award XP to character profile
      await db
        .update(characterProfiles)
        .set({
          xp: sql`xp + ${chapterRewards.xp}`,
          xpLifetime: sql`xp_lifetime + ${chapterRewards.xp}`,
        })
        .where(eq(characterProfiles.memberId, memberId));

      // Unlock character if specified
      if (chapterRewards.characterUnlock) {
        await db.insert(memberUnlockedCharacters).values({
          memberId,
          characterId: chapterRewards.characterUnlock,
          unlockedBy: chapter.id,
        }).onConflictDoNothing();
      }

      // Add earned title if specified
      if (chapterRewards.title) {
        await db
          .update(memberStoryProgress)
          .set({
            earnedTitles: sql`array_append(earned_titles, ${chapterRewards.title})`,
          })
          .where(eq(memberStoryProgress.memberId, memberId));
      }
    }

    // Find next quest
    const [nextQuest] = await db
      .select()
      .from(storyQuests)
      .where(
        and(
          eq(storyQuests.chapterId, quest.chapterId),
          sql`${storyQuests.orderInChapter} > ${quest.orderInChapter}`
        )
      )
      .orderBy(asc(storyQuests.orderInChapter))
      .limit(1);

    // Find next chapter if current completed
    let nextChapter = null;
    if (chapterCompleted) {
      const [next] = await db
        .select()
        .from(storyChapters)
        .where(eq(storyChapters.prerequisiteChapterId, quest.chapterId))
        .limit(1);

      if (next) {
        nextChapter = {
          id: next.id,
          number: next.number,
          title: next.title,
          description: next.description,
          artwork: next.artwork,
          theme: next.theme,
          difficulty: next.difficulty as StoryDifficulty,
          requiredLevel: next.requiredLevel || 1,
          prerequisiteChapterId: next.prerequisiteChapterId,
          quests: [],
          characters: [],
          rewards: next.rewards as ChapterReward,
          estimatedDuration: next.estimatedDuration || 30,
          isActive: next.isActive ?? true,
          releasedAt: next.releasedAt!,
        };
      }
    }

    return reply.send({
      quest: {
        quest: formatQuest(quest),
        progress: {
          questId: quest.id,
          status: 'completed' as QuestStatus,
          objectives,
          currentDialogueId: null,
          dialoguesViewed: questProgress.dialoguesViewed as string[],
          choicesMade: questProgress.choicesMade as Record<string, string>,
          startedAt: questProgress.startedAt,
          completedAt: new Date(),
          timeSpent,
        },
      },
      rewards,
      closingDialogue: closingDialogue ? formatDialogue(closingDialogue) : null,
      chapterCompleted,
      chapterRewards,
      unlockedQuest: nextQuest ? formatQuest(nextQuest) : null,
      unlockedChapter: nextChapter,
    });
  });

  // Make a dialogue choice
  app.post('/story/dialogues/:dialogueId/choice', {
    schema: {
      params: z.object({
        dialogueId: z.string(),
      }),
      body: z.object({
        memberId: z.string().uuid(),
        choiceId: z.string(),
      }),
    },
  }, async (request, reply) => {
    const { dialogueId } = request.params as { dialogueId: string };
    const { memberId, choiceId } = request.body as { memberId: string; choiceId: string };

    // Get dialogue
    const [dialogue] = await db
      .select()
      .from(storyDialogues)
      .where(eq(storyDialogues.id, dialogueId));

    if (!dialogue) {
      return reply.status(404).send({ error: 'Dialogue not found' });
    }

    // Find the choice in the dialogue lines
    const lines = dialogue.lines as DialogueLine[];
    let foundChoice = null;
    for (const line of lines) {
      if (line.choices) {
        const choice = line.choices.find(c => c.id === choiceId);
        if (choice) {
          foundChoice = choice;
          break;
        }
      }
    }

    if (!foundChoice) {
      return reply.status(404).send({ error: 'Choice not found in dialogue' });
    }

    // Get quest progress
    const [questProgress] = await db
      .select()
      .from(memberQuestProgress)
      .where(
        and(
          eq(memberQuestProgress.memberId, memberId),
          eq(memberQuestProgress.questId, dialogue.questId)
        )
      );

    if (questProgress) {
      // Update choices made
      const choicesMade = (questProgress.choicesMade || {}) as Record<string, string>;
      choicesMade[dialogueId] = choiceId;

      // Add dialogue to viewed
      const dialoguesViewed = (questProgress.dialoguesViewed || []) as string[];
      if (!dialoguesViewed.includes(dialogueId)) {
        dialoguesViewed.push(dialogueId);
      }

      await db
        .update(memberQuestProgress)
        .set({
          choicesMade,
          dialoguesViewed,
          currentDialogueId: foundChoice.nextDialogueId,
        })
        .where(eq(memberQuestProgress.id, questProgress.id));
    }

    // Update story progress choice count
    await db
      .update(memberStoryProgress)
      .set({
        choicesMade: sql`choices_made + 1`,
        lastPlayedAt: new Date(),
      })
      .where(eq(memberStoryProgress.memberId, memberId));

    // Process choice effect
    const [storyProgress] = await db
      .select()
      .from(memberStoryProgress)
      .where(eq(memberStoryProgress.memberId, memberId));

    const effectResult = processChoiceEffect(
      foundChoice.effect as ChoiceEffect | null,
      storyProgress as unknown as StoryProgress
    );

    // Apply point changes
    if (effectResult.pointsDelta !== 0) {
      await db
        .update(members)
        .set({
          pointsCurrent: sql`points_current + ${effectResult.pointsDelta}`,
          pointsLifetime: effectResult.pointsDelta > 0
            ? sql`points_lifetime + ${effectResult.pointsDelta}`
            : sql`points_lifetime`,
        })
        .where(eq(members.id, memberId));
    }

    // Get next dialogue if any
    let nextDialogue = null;
    if (foundChoice.nextDialogueId) {
      const [next] = await db
        .select()
        .from(storyDialogues)
        .where(eq(storyDialogues.id, foundChoice.nextDialogueId));

      if (next) {
        nextDialogue = formatDialogue(next);
      }
    }

    return reply.send({
      choice: foundChoice,
      effect: foundChoice.effect,
      effectResult,
      nextDialogue,
    });
  });

  // Mark dialogue as viewed
  app.post('/story/dialogues/:dialogueId/view', {
    schema: {
      params: z.object({
        dialogueId: z.string(),
      }),
      body: z.object({
        memberId: z.string().uuid(),
      }),
    },
  }, async (request, reply) => {
    const { dialogueId } = request.params as { dialogueId: string };
    const { memberId } = request.body as { memberId: string };

    // Get dialogue
    const [dialogue] = await db
      .select()
      .from(storyDialogues)
      .where(eq(storyDialogues.id, dialogueId));

    if (!dialogue) {
      return reply.status(404).send({ error: 'Dialogue not found' });
    }

    // Get quest progress
    const [questProgress] = await db
      .select()
      .from(memberQuestProgress)
      .where(
        and(
          eq(memberQuestProgress.memberId, memberId),
          eq(memberQuestProgress.questId, dialogue.questId)
        )
      );

    if (questProgress) {
      const dialoguesViewed = (questProgress.dialoguesViewed || []) as string[];
      if (!dialoguesViewed.includes(dialogueId)) {
        dialoguesViewed.push(dialogueId);
        await db
          .update(memberQuestProgress)
          .set({ dialoguesViewed })
          .where(eq(memberQuestProgress.id, questProgress.id));
      }
    }

    return reply.send({ success: true });
  });

  // Get all characters
  app.get('/story/characters', {
    schema: {
      querystring: z.object({
        memberId: z.string().uuid(),
      }),
    },
  }, async (request, reply) => {
    const { memberId } = request.query as { memberId: string };

    // Get all characters
    const allCharacters = await db
      .select()
      .from(storyCharacters)
      .orderBy(asc(storyCharacters.sortOrder));

    // Get unlocked characters for member
    const unlockedCharacterIds = await db
      .select({ characterId: memberUnlockedCharacters.characterId })
      .from(memberUnlockedCharacters)
      .where(eq(memberUnlockedCharacters.memberId, memberId));

    const unlockedSet = new Set(unlockedCharacterIds.map(u => u.characterId));

    // Format characters with unlock status
    const characters = allCharacters.map(char => ({
      id: char.id,
      name: char.name,
      title: char.title,
      description: char.description,
      avatar: char.avatar,
      personality: char.personality,
      unlockCondition: char.unlockCondition,
      isUnlocked: char.isDefault || unlockedSet.has(char.id),
    }));

    return reply.send({
      characters,
      totalCharacters: characters.length,
      unlockedCount: characters.filter(c => c.isUnlocked).length,
    });
  });
}
