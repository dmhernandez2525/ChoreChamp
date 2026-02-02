import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';
import { chores } from './chores';

/**
 * Educational Chore Templates - defines educational requirements for chores
 */
export const educationalChoreTemplates = pgTable('educational_chore_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),

  // Educational content requirements
  contentType: text('content_type').notNull(),
  difficulty: text('difficulty').notNull().default('medium'),

  // When to present educational content
  timing: text('timing').notNull().default('after_chore'),

  // Requirements
  questionsRequired: integer('questions_required').notNull().default(5),
  minimumCorrectPercent: integer('minimum_correct_percent').notNull().default(70),
  timeLimit: integer('time_limit'), // Minutes

  // If failed
  allowRetry: boolean('allow_retry').notNull().default(true),
  maxRetries: integer('max_retries').notNull().default(3),
  retryDelay: integer('retry_delay').notNull().default(5), // Minutes

  // Rewards
  bonusPointsForPerfect: integer('bonus_points_for_perfect').notNull().default(10),
  bonusScreenTimeMinutes: integer('bonus_screen_time_minutes'),

  // Age targeting
  minAge: integer('min_age'),
  maxAge: integer('max_age'),
  gradeLevel: text('grade_level'),

  isEnabled: boolean('is_enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Educational Questions - question bank
 */
export const educationalQuestions = pgTable('educational_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }),

  contentType: text('content_type').notNull(),
  difficulty: text('difficulty').notNull(),
  gradeLevel: text('grade_level'),

  question: text('question').notNull(),
  questionType: text('question_type').notNull().default('multiple_choice'),

  // For multiple choice
  options: jsonb('options').$type<string[]>(),
  correctAnswer: text('correct_answer').notNull(),
  explanation: text('explanation'),

  // Media
  imageUrl: text('image_url'),
  audioUrl: text('audio_url'),

  // Metadata
  topic: text('topic'),
  subtopic: text('subtopic'),
  tags: jsonb('tags').$type<string[]>(),

  // Stats
  timesAsked: integer('times_asked').notNull().default(0),
  timesCorrect: integer('times_correct').notNull().default(0),

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  contentTypeIdx: index('edu_questions_content_type_idx').on(table.contentType, table.difficulty),
}));

/**
 * Educational Sessions - tracks quiz/learning sessions
 */
export const educationalSessions = pgTable('educational_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  choreId: uuid('chore_id').references(() => chores.id, { onDelete: 'set null' }),
  templateId: uuid('template_id').references(() => educationalChoreTemplates.id, { onDelete: 'set null' }),

  contentType: text('content_type').notNull(),
  difficulty: text('difficulty').notNull(),

  // Status
  status: text('status').notNull().default('in_progress'),

  // Questions
  totalQuestions: integer('total_questions').notNull(),
  questionsAnswered: integer('questions_answered').notNull().default(0),
  correctAnswers: integer('correct_answers').notNull().default(0),
  incorrectAnswers: integer('incorrect_answers').notNull().default(0),

  // Timing
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  timeLimitMinutes: integer('time_limit_minutes'),
  timeSpentSeconds: integer('time_spent_seconds').notNull().default(0),

  // Results
  scorePercent: integer('score_percent'),
  passed: boolean('passed'),
  minimumRequired: integer('minimum_required').notNull(),

  // Rewards earned
  pointsEarned: integer('points_earned').notNull().default(0),
  bonusPointsEarned: integer('bonus_points_earned').notNull().default(0),
  screenTimeEarned: integer('screen_time_earned').notNull().default(0),

  // Retry info
  attemptNumber: integer('attempt_number').notNull().default(1),
  canRetry: boolean('can_retry').notNull().default(true),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  memberIdx: index('edu_sessions_member_idx').on(table.memberId, table.createdAt),
}));

/**
 * Educational Answers - individual answer records
 */
export const educationalAnswers = pgTable('educational_answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => educationalSessions.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id')
    .notNull()
    .references(() => educationalQuestions.id, { onDelete: 'cascade' }),

  answer: text('answer').notNull(),
  isCorrect: boolean('is_correct').notNull(),
  timeSpentSeconds: integer('time_spent_seconds').notNull().default(0),

  // For review
  correctAnswer: text('correct_answer').notNull(),
  explanation: text('explanation'),

  answeredAt: timestamp('answered_at').notNull().defaultNow(),
}, (table) => ({
  sessionIdx: index('edu_answers_session_idx').on(table.sessionId),
}));

/**
 * Member Educational Progress - tracks overall educational progress
 */
export const memberEducationalProgress = pgTable('member_educational_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' })
    .unique(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  // Progress by content type
  progressByType: jsonb('progress_by_type').$type<Record<string, {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    currentStreak: number;
    bestStreak: number;
    averageTimeSeconds: number;
    masteryLevel: number;
  }>>().notNull().default({}),

  // Overall stats
  totalSessions: integer('total_sessions').notNull().default(0),
  totalQuestionsAnswered: integer('total_questions_answered').notNull().default(0),
  totalCorrect: integer('total_correct').notNull().default(0),
  overallAccuracy: integer('overall_accuracy').notNull().default(0),

  // Streaks
  currentDayStreak: integer('current_day_streak').notNull().default(0),
  longestDayStreak: integer('longest_day_streak').notNull().default(0),
  lastActivityDate: timestamp('last_activity_date'),

  // Points
  totalPointsEarned: integer('total_points_earned').notNull().default(0),
  totalBonusEarned: integer('total_bonus_earned').notNull().default(0),

  // Levels
  overallLevel: integer('overall_level').notNull().default(1),
  experiencePoints: integer('experience_points').notNull().default(0),
  nextLevelXp: integer('next_level_xp').notNull().default(100),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Educational Achievements - earned achievements
 */
export const educationalAchievements = pgTable('educational_achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  achievementType: text('achievement_type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  iconUrl: text('icon_url'),

  // What triggered it
  contentType: text('content_type'),
  threshold: integer('threshold').notNull(),
  value: integer('value').notNull(),

  pointsAwarded: integer('points_awarded').notNull().default(0),
  earnedAt: timestamp('earned_at').notNull().defaultNow(),
}, (table) => ({
  memberIdx: index('edu_achievements_member_idx').on(table.memberId),
}));

/**
 * Chore Educational Links - connects chores to educational content
 */
export const choreEducationalLinks = pgTable('chore_educational_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  choreId: uuid('chore_id')
    .notNull()
    .references(() => chores.id, { onDelete: 'cascade' }),
  templateId: uuid('template_id')
    .notNull()
    .references(() => educationalChoreTemplates.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  // Override template settings
  questionsRequired: integer('questions_required'),
  minimumCorrectPercent: integer('minimum_correct_percent'),
  bonusPointsForPerfect: integer('bonus_points_for_perfect'),

  // Completion status
  isRequired: boolean('is_required').notNull().default(true),
  isCompleted: boolean('is_completed').notNull().default(false),
  completedSessionId: uuid('completed_session_id').references(() => educationalSessions.id, { onDelete: 'set null' }),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  choreIdx: index('chore_edu_links_chore_idx').on(table.choreId),
}));

/**
 * Learning Paths - structured learning sequences
 */
export const learningPaths = pgTable('learning_paths', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  description: text('description'),
  contentType: text('content_type').notNull(),

  // Path structure
  levels: jsonb('levels').$type<Array<{
    levelNumber: number;
    name: string;
    description: string | null;
    difficulty: string;
    questionsToPass: number;
    passingPercent: number;
    topics: string[];
    rewardPoints: number;
    rewardBadge: string | null;
  }>>().notNull().default([]),

  // Settings
  requireSequential: boolean('require_sequential').notNull().default(true),
  allowSkipAhead: boolean('allow_skip_ahead').notNull().default(false),

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Member Learning Path Progress
 */
export const memberLearningPathProgress = pgTable('member_learning_path_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  pathId: uuid('path_id')
    .notNull()
    .references(() => learningPaths.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  currentLevel: integer('current_level').notNull().default(1),
  highestLevelCompleted: integer('highest_level_completed').notNull().default(0),

  // Level completions
  levelCompletions: jsonb('level_completions').$type<Array<{
    level: number;
    completedAt: string;
    score: number;
    attempts: number;
  }>>().notNull().default([]),

  // Stats
  totalAttempts: integer('total_attempts').notNull().default(0),
  totalTimeMinutes: integer('total_time_minutes').notNull().default(0),
  averageScore: integer('average_score').notNull().default(0),

  isCompleted: boolean('is_completed').notNull().default(false),
  completedAt: timestamp('completed_at'),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  lastActivityAt: timestamp('last_activity_at').notNull().defaultNow(),
}, (table) => ({
  memberPathIdx: index('member_path_progress_idx').on(table.memberId, table.pathId),
}));

// Relations
export const educationalChoreTemplatesRelations = relations(educationalChoreTemplates, ({ one, many }) => ({
  household: one(households, {
    fields: [educationalChoreTemplates.householdId],
    references: [households.id],
  }),
  choreLinks: many(choreEducationalLinks),
  sessions: many(educationalSessions),
}));

export const educationalQuestionsRelations = relations(educationalQuestions, ({ one, many }) => ({
  household: one(households, {
    fields: [educationalQuestions.householdId],
    references: [households.id],
  }),
  answers: many(educationalAnswers),
}));

export const educationalSessionsRelations = relations(educationalSessions, ({ one, many }) => ({
  household: one(households, {
    fields: [educationalSessions.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [educationalSessions.memberId],
    references: [members.id],
  }),
  chore: one(chores, {
    fields: [educationalSessions.choreId],
    references: [chores.id],
  }),
  template: one(educationalChoreTemplates, {
    fields: [educationalSessions.templateId],
    references: [educationalChoreTemplates.id],
  }),
  answers: many(educationalAnswers),
}));

export const educationalAnswersRelations = relations(educationalAnswers, ({ one }) => ({
  session: one(educationalSessions, {
    fields: [educationalAnswers.sessionId],
    references: [educationalSessions.id],
  }),
  question: one(educationalQuestions, {
    fields: [educationalAnswers.questionId],
    references: [educationalQuestions.id],
  }),
}));

export const memberEducationalProgressRelations = relations(memberEducationalProgress, ({ one }) => ({
  household: one(households, {
    fields: [memberEducationalProgress.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [memberEducationalProgress.memberId],
    references: [members.id],
  }),
}));

export const educationalAchievementsRelations = relations(educationalAchievements, ({ one }) => ({
  household: one(households, {
    fields: [educationalAchievements.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [educationalAchievements.memberId],
    references: [members.id],
  }),
}));

export const choreEducationalLinksRelations = relations(choreEducationalLinks, ({ one }) => ({
  household: one(households, {
    fields: [choreEducationalLinks.householdId],
    references: [households.id],
  }),
  chore: one(chores, {
    fields: [choreEducationalLinks.choreId],
    references: [chores.id],
  }),
  template: one(educationalChoreTemplates, {
    fields: [choreEducationalLinks.templateId],
    references: [educationalChoreTemplates.id],
  }),
  completedSession: one(educationalSessions, {
    fields: [choreEducationalLinks.completedSessionId],
    references: [educationalSessions.id],
  }),
}));

export const learningPathsRelations = relations(learningPaths, ({ one, many }) => ({
  household: one(households, {
    fields: [learningPaths.householdId],
    references: [households.id],
  }),
  memberProgress: many(memberLearningPathProgress),
}));

export const memberLearningPathProgressRelations = relations(memberLearningPathProgress, ({ one }) => ({
  household: one(households, {
    fields: [memberLearningPathProgress.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [memberLearningPathProgress.memberId],
    references: [members.id],
  }),
  path: one(learningPaths, {
    fields: [memberLearningPathProgress.pathId],
    references: [learningPaths.id],
  }),
}));
