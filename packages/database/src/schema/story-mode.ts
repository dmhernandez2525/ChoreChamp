// Story Mode Adventure Schema (F9.5)

import { pgTable, uuid, varchar, text, integer, timestamp, boolean, smallint, index, unique, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';

// Story characters (NPCs)
export const storyCharacters = pgTable(
  'story_characters',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    title: varchar('title', { length: 100 }).notNull(),
    description: text('description').notNull(),
    avatar: text('avatar').notNull(),
    personality: text('personality').notNull(),
    unlockCondition: text('unlock_condition'),
    isDefault: boolean('is_default').default(false),  // Available from start
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  }
);

// Story chapters (main story divisions)
export const storyChapters = pgTable(
  'story_chapters',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    number: smallint('number').notNull(),
    title: varchar('title', { length: 100 }).notNull(),
    description: text('description').notNull(),
    artwork: text('artwork').notNull(),
    theme: varchar('theme', { length: 50 }).notNull(),
    difficulty: varchar('difficulty', { length: 20 }).notNull().default('medium'),
    requiredLevel: smallint('required_level').default(1),
    prerequisiteChapterId: varchar('prerequisite_chapter_id', { length: 50 }),
    rewards: jsonb('rewards').notNull(),  // ChapterReward JSON
    estimatedDuration: integer('estimated_duration').default(30),  // Minutes
    isActive: boolean('is_active').default(true),
    releasedAt: timestamp('released_at', { withTimezone: true }).defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_story_chapters_number').on(table.number),
    index('idx_story_chapters_prerequisite').on(table.prerequisiteChapterId),
  ]
);

// Chapter-character relationship
export const chapterCharacters = pgTable(
  'chapter_characters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chapterId: varchar('chapter_id', { length: 50 })
      .notNull()
      .references(() => storyChapters.id),
    characterId: varchar('character_id', { length: 50 })
      .notNull()
      .references(() => storyCharacters.id),
    role: varchar('role', { length: 30 }).default('supporting'),  // 'main', 'supporting', 'cameo'
    sortOrder: integer('sort_order').default(0),
  },
  (table) => [
    unique('unique_chapter_character').on(table.chapterId, table.characterId),
  ]
);

// Story quests within chapters
export const storyQuests = pgTable(
  'story_quests',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    chapterId: varchar('chapter_id', { length: 50 })
      .notNull()
      .references(() => storyChapters.id),
    orderInChapter: smallint('order_in_chapter').notNull(),
    title: varchar('title', { length: 100 }).notNull(),
    description: text('description').notNull(),
    briefing: text('briefing').notNull(),
    debriefing: text('debriefing').notNull(),
    objectives: jsonb('objectives').notNull(),  // QuestObjective[] JSON
    rewards: jsonb('rewards').notNull(),  // QuestReward JSON
    timeLimit: integer('time_limit'),  // Minutes, null = no limit
    isOptional: boolean('is_optional').default(false),
    isBonusQuest: boolean('is_bonus_quest').default(false),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_story_quests_chapter').on(table.chapterId),
    unique('unique_quest_order').on(table.chapterId, table.orderInChapter),
  ]
);

// Story dialogues
export const storyDialogues = pgTable(
  'story_dialogues',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    questId: varchar('quest_id', { length: 50 })
      .notNull()
      .references(() => storyQuests.id),
    orderInQuest: smallint('order_in_quest').notNull(),
    triggerType: varchar('trigger_type', { length: 30 }).notNull(),  // 'quest_start', 'quest_end', etc.
    triggerId: varchar('trigger_id', { length: 50 }),
    lines: jsonb('lines').notNull(),  // DialogueLine[] JSON
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_story_dialogues_quest').on(table.questId),
    index('idx_story_dialogues_trigger').on(table.triggerType, table.triggerId),
  ]
);

// Member's overall story progress
export const memberStoryProgress = pgTable(
  'member_story_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' })
      .unique(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    currentChapterId: varchar('current_chapter_id', { length: 50 })
      .references(() => storyChapters.id),
    currentQuestId: varchar('current_quest_id', { length: 50 })
      .references(() => storyQuests.id),
    chaptersCompleted: integer('chapters_completed').default(0),
    questsCompleted: integer('quests_completed').default(0),
    totalPlayTime: integer('total_play_time').default(0),  // Minutes
    choicesMade: integer('choices_made').default(0),
    unlockedCharacters: text('unlocked_characters').array().default([]),
    earnedTitles: text('earned_titles').array().default([]),
    lastPlayedAt: timestamp('last_played_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_member_story_progress_member').on(table.memberId),
    index('idx_member_story_progress_household').on(table.householdId),
  ]
);

// Member's progress on individual chapters
export const memberChapterProgress = pgTable(
  'member_chapter_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    chapterId: varchar('chapter_id', { length: 50 })
      .notNull()
      .references(() => storyChapters.id),
    status: varchar('status', { length: 20 }).notNull().default('locked'),
    questsCompleted: integer('quests_completed').default(0),
    starsEarned: smallint('stars_earned').default(0),  // 0-3
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    bestTime: integer('best_time'),  // Minutes
    playCount: integer('play_count').default(0),
  },
  (table) => [
    index('idx_member_chapter_progress_member').on(table.memberId),
    index('idx_member_chapter_progress_chapter').on(table.chapterId),
    unique('unique_member_chapter').on(table.memberId, table.chapterId),
  ]
);

// Member's progress on individual quests
export const memberQuestProgress = pgTable(
  'member_quest_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    questId: varchar('quest_id', { length: 50 })
      .notNull()
      .references(() => storyQuests.id),
    status: varchar('status', { length: 20 }).notNull().default('locked'),
    objectiveProgress: jsonb('objective_progress').default([]),  // Tracks completion of each objective
    currentDialogueId: varchar('current_dialogue_id', { length: 50 }),
    dialoguesViewed: text('dialogues_viewed').array().default([]),
    choicesMade: jsonb('choices_made').default({}),  // dialogueId -> choiceId
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    timeSpent: integer('time_spent').default(0),  // Minutes
  },
  (table) => [
    index('idx_member_quest_progress_member').on(table.memberId),
    index('idx_member_quest_progress_quest').on(table.questId),
    unique('unique_member_quest').on(table.memberId, table.questId),
  ]
);

// Unlocked characters per member
export const memberUnlockedCharacters = pgTable(
  'member_unlocked_characters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    characterId: varchar('character_id', { length: 50 })
      .notNull()
      .references(() => storyCharacters.id),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }).defaultNow(),
    unlockedBy: varchar('unlocked_by', { length: 50 }),  // Quest ID or chapter ID that unlocked
  },
  (table) => [
    index('idx_member_unlocked_characters_member').on(table.memberId),
    unique('unique_member_character_unlock').on(table.memberId, table.characterId),
  ]
);

// Relations
export const storyCharactersRelations = relations(storyCharacters, ({ many }) => ({
  chapterAppearances: many(chapterCharacters),
  memberUnlocks: many(memberUnlockedCharacters),
}));

export const storyChaptersRelations = relations(storyChapters, ({ one, many }) => ({
  prerequisite: one(storyChapters, {
    fields: [storyChapters.prerequisiteChapterId],
    references: [storyChapters.id],
  }),
  quests: many(storyQuests),
  characters: many(chapterCharacters),
  memberProgress: many(memberChapterProgress),
}));

export const chapterCharactersRelations = relations(chapterCharacters, ({ one }) => ({
  chapter: one(storyChapters, {
    fields: [chapterCharacters.chapterId],
    references: [storyChapters.id],
  }),
  character: one(storyCharacters, {
    fields: [chapterCharacters.characterId],
    references: [storyCharacters.id],
  }),
}));

export const storyQuestsRelations = relations(storyQuests, ({ one, many }) => ({
  chapter: one(storyChapters, {
    fields: [storyQuests.chapterId],
    references: [storyChapters.id],
  }),
  dialogues: many(storyDialogues),
  memberProgress: many(memberQuestProgress),
}));

export const storyDialoguesRelations = relations(storyDialogues, ({ one }) => ({
  quest: one(storyQuests, {
    fields: [storyDialogues.questId],
    references: [storyQuests.id],
  }),
}));

export const memberStoryProgressRelations = relations(memberStoryProgress, ({ one }) => ({
  member: one(members, {
    fields: [memberStoryProgress.memberId],
    references: [members.id],
  }),
  household: one(households, {
    fields: [memberStoryProgress.householdId],
    references: [households.id],
  }),
  currentChapter: one(storyChapters, {
    fields: [memberStoryProgress.currentChapterId],
    references: [storyChapters.id],
  }),
  currentQuest: one(storyQuests, {
    fields: [memberStoryProgress.currentQuestId],
    references: [storyQuests.id],
  }),
}));

export const memberChapterProgressRelations = relations(memberChapterProgress, ({ one }) => ({
  member: one(members, {
    fields: [memberChapterProgress.memberId],
    references: [members.id],
  }),
  chapter: one(storyChapters, {
    fields: [memberChapterProgress.chapterId],
    references: [storyChapters.id],
  }),
}));

export const memberQuestProgressRelations = relations(memberQuestProgress, ({ one }) => ({
  member: one(members, {
    fields: [memberQuestProgress.memberId],
    references: [members.id],
  }),
  quest: one(storyQuests, {
    fields: [memberQuestProgress.questId],
    references: [storyQuests.id],
  }),
}));

export const memberUnlockedCharactersRelations = relations(memberUnlockedCharacters, ({ one }) => ({
  member: one(members, {
    fields: [memberUnlockedCharacters.memberId],
    references: [members.id],
  }),
  character: one(storyCharacters, {
    fields: [memberUnlockedCharacters.characterId],
    references: [storyCharacters.id],
  }),
}));
