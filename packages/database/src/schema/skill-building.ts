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

/**
 * Skill Trees - categories of skills
 */
export const skillTrees = pgTable('skill_trees', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  category: text('category').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  iconUrl: text('icon_url'),
  colorTheme: text('color_theme').notNull().default('#3b82f6'),

  totalSkills: integer('total_skills').notNull().default(0),
  totalXp: integer('total_xp').notNull().default(0),

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  householdIdx: index('skill_trees_household_idx').on(table.householdId),
  categoryIdx: index('skill_trees_category_idx').on(table.householdId, table.category),
}));

/**
 * Skills - individual skills within a tree
 */
export const skills = pgTable('skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  skillTreeId: uuid('skill_tree_id')
    .notNull()
    .references(() => skillTrees.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  description: text('description').notNull(),
  iconUrl: text('icon_url'),

  level: integer('level').notNull().default(1),
  tier: integer('tier').notNull().default(1),
  xpRequired: integer('xp_required').notNull().default(100),

  prerequisites: jsonb('prerequisites').$type<string[]>().notNull().default([]),
  ageMinimum: integer('age_minimum'),
  estimatedPracticeTime: integer('estimated_practice_time').notNull().default(30),

  videoTutorialUrl: text('video_tutorial_url'),
  articleUrl: text('article_url'),
  tips: jsonb('tips').$type<string[]>().notNull().default([]),
  safetyNotes: text('safety_notes'),

  linkedChoreIds: jsonb('linked_chore_ids').$type<string[]>().notNull().default([]),
  isCore: boolean('is_core').notNull().default(false),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  treeIdx: index('skills_tree_idx').on(table.skillTreeId),
  levelIdx: index('skills_level_idx').on(table.skillTreeId, table.level),
}));

/**
 * Member Skill Progress - tracks member's progress in each skill
 */
export const memberSkillProgress = pgTable('member_skill_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  skillId: uuid('skill_id')
    .notNull()
    .references(() => skills.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  status: text('status').notNull().default('locked'),
  masteryLevel: text('mastery_level').notNull().default('novice'),

  currentXp: integer('current_xp').notNull().default(0),
  practiceCount: integer('practice_count').notNull().default(0),
  totalPracticeMinutes: integer('total_practice_minutes').notNull().default(0),

  lastPracticedAt: timestamp('last_practiced_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  masteredAt: timestamp('mastered_at'),

  mentorId: uuid('mentor_id').references(() => members.id, { onDelete: 'set null' }),
  notes: text('notes'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  memberSkillIdx: index('member_skill_progress_member_skill_idx').on(table.memberId, table.skillId),
  statusIdx: index('member_skill_progress_status_idx').on(table.memberId, table.status),
}));

/**
 * Skill Practice Logs - individual practice sessions
 */
export const skillPracticeLogs = pgTable('skill_practice_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberSkillProgressId: uuid('member_skill_progress_id')
    .notNull()
    .references(() => memberSkillProgress.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  skillId: uuid('skill_id')
    .notNull()
    .references(() => skills.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  choreCompletionId: uuid('chore_completion_id'),
  durationMinutes: integer('duration_minutes').notNull(),
  xpEarned: integer('xp_earned').notNull().default(0),

  qualityRating: integer('quality_rating'),
  selfAssessment: integer('self_assessment'),
  mentorAssessment: integer('mentor_assessment'),
  mentorId: uuid('mentor_id').references(() => members.id, { onDelete: 'set null' }),
  mentorFeedback: text('mentor_feedback'),

  photoProofUrl: text('photo_proof_url'),
  notes: text('notes'),

  practicedAt: timestamp('practiced_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  memberDateIdx: index('skill_practice_logs_member_date_idx').on(table.memberId, table.practicedAt),
}));

/**
 * Skill Certifications - earned certifications
 */
export const skillCertifications = pgTable('skill_certifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  skillId: uuid('skill_id')
    .notNull()
    .references(() => skills.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  certificationName: text('certification_name').notNull(),
  status: text('status').notNull().default('not_started'),

  assessmentScore: integer('assessment_score'),
  assessmentPassingScore: integer('assessment_passing_score').notNull().default(70),
  assessmentAttempts: integer('assessment_attempts').notNull().default(0),

  certifiedAt: timestamp('certified_at'),
  certifiedById: uuid('certified_by_id').references(() => members.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at'),

  certificateUrl: text('certificate_url'),
  badgeIconUrl: text('badge_icon_url'),
  notes: text('notes'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  memberSkillIdx: index('skill_certifications_member_skill_idx').on(table.memberId, table.skillId),
  statusIdx: index('skill_certifications_status_idx').on(table.memberId, table.status),
}));

/**
 * Skill Challenges - challenges to complete
 */
export const skillChallenges = pgTable('skill_challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  skillId: uuid('skill_id')
    .notNull()
    .references(() => skills.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  title: text('title').notNull(),
  description: text('description').notNull(),
  challengeType: text('challenge_type').notNull(),
  difficulty: text('difficulty').notNull(),

  requirements: jsonb('requirements').$type<Array<{
    type: string;
    value: number;
    description: string;
  }>>().notNull(),

  xpReward: integer('xp_reward').notNull(),
  bonusReward: integer('bonus_reward'),
  badgeReward: text('badge_reward'),
  timeLimit: integer('time_limit'),
  maxAttempts: integer('max_attempts'),

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  skillIdx: index('skill_challenges_skill_idx').on(table.skillId),
}));

/**
 * Member Challenge Progress - tracks challenge attempts
 */
export const memberChallengeProgress = pgTable('member_challenge_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  challengeId: uuid('challenge_id')
    .notNull()
    .references(() => skillChallenges.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  status: text('status').notNull().default('not_started'),
  currentProgress: integer('current_progress').notNull().default(0),
  targetProgress: integer('target_progress').notNull(),
  attempts: integer('attempts').notNull().default(0),

  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  xpEarned: integer('xp_earned').notNull().default(0),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  memberChallengeIdx: index('member_challenge_progress_member_challenge_idx').on(table.memberId, table.challengeId),
}));

/**
 * Mentorship Relations - mentor/mentee pairs
 */
export const mentorshipRelations = pgTable('mentorship_relations', {
  id: uuid('id').primaryKey().defaultRandom(),
  mentorId: uuid('mentor_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  menteeId: uuid('mentee_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  skillId: uuid('skill_id')
    .notNull()
    .references(() => skills.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  status: text('status').notNull().default('pending'),
  sessionsCompleted: integer('sessions_completed').notNull().default(0),
  totalSessionMinutes: integer('total_session_minutes').notNull().default(0),
  mentorXpEarned: integer('mentor_xp_earned').notNull().default(0),
  menteeXpEarned: integer('mentee_xp_earned').notNull().default(0),

  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  notes: text('notes'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  mentorIdx: index('mentorship_relations_mentor_idx').on(table.mentorId),
  menteeIdx: index('mentorship_relations_mentee_idx').on(table.menteeId),
  skillIdx: index('mentorship_relations_skill_idx').on(table.skillId),
}));

/**
 * Skill Badges - badges for achievements
 */
export const skillBadges = pgTable('skill_badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  skillId: uuid('skill_id').references(() => skills.id, { onDelete: 'cascade' }),
  skillTreeId: uuid('skill_tree_id').references(() => skillTrees.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  description: text('description').notNull(),
  iconUrl: text('icon_url').notNull(),
  rarity: text('rarity').notNull().default('common'),
  requirement: text('requirement').notNull(),
  xpValue: integer('xp_value').notNull().default(0),
  isSecret: boolean('is_secret').notNull().default(false),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  householdIdx: index('skill_badges_household_idx').on(table.householdId),
}));

/**
 * Member Skill Badges - earned badges
 */
export const memberSkillBadges = pgTable('member_skill_badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  badgeId: uuid('badge_id')
    .notNull()
    .references(() => skillBadges.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  earnedAt: timestamp('earned_at').notNull().defaultNow(),
  showcased: boolean('showcased').notNull().default(false),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  memberIdx: index('member_skill_badges_member_idx').on(table.memberId),
}));

/**
 * Expert Tips - tips for skills
 */
export const expertTips = pgTable('expert_tips', {
  id: uuid('id').primaryKey().defaultRandom(),
  skillId: uuid('skill_id')
    .notNull()
    .references(() => skills.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(),
  authorName: text('author_name'),
  sourceUrl: text('source_url'),

  isVerified: boolean('is_verified').notNull().default(false),
  helpfulCount: integer('helpful_count').notNull().default(0),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  skillIdx: index('expert_tips_skill_idx').on(table.skillId),
}));

// Relations
export const skillTreesRelations = relations(skillTrees, ({ one, many }) => ({
  household: one(households, {
    fields: [skillTrees.householdId],
    references: [households.id],
  }),
  skills: many(skills),
  badges: many(skillBadges),
}));

export const skillsRelations = relations(skills, ({ one, many }) => ({
  household: one(households, {
    fields: [skills.householdId],
    references: [households.id],
  }),
  skillTree: one(skillTrees, {
    fields: [skills.skillTreeId],
    references: [skillTrees.id],
  }),
  memberProgress: many(memberSkillProgress),
  practiceLogs: many(skillPracticeLogs),
  certifications: many(skillCertifications),
  challenges: many(skillChallenges),
  mentorships: many(mentorshipRelations),
  badges: many(skillBadges),
  tips: many(expertTips),
}));

export const memberSkillProgressRelations = relations(memberSkillProgress, ({ one, many }) => ({
  household: one(households, {
    fields: [memberSkillProgress.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [memberSkillProgress.memberId],
    references: [members.id],
  }),
  skill: one(skills, {
    fields: [memberSkillProgress.skillId],
    references: [skills.id],
  }),
  mentor: one(members, {
    fields: [memberSkillProgress.mentorId],
    references: [members.id],
  }),
  practiceLogs: many(skillPracticeLogs),
}));

export const skillPracticeLogsRelations = relations(skillPracticeLogs, ({ one }) => ({
  household: one(households, {
    fields: [skillPracticeLogs.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [skillPracticeLogs.memberId],
    references: [members.id],
  }),
  skill: one(skills, {
    fields: [skillPracticeLogs.skillId],
    references: [skills.id],
  }),
  progress: one(memberSkillProgress, {
    fields: [skillPracticeLogs.memberSkillProgressId],
    references: [memberSkillProgress.id],
  }),
  mentor: one(members, {
    fields: [skillPracticeLogs.mentorId],
    references: [members.id],
  }),
}));

export const skillCertificationsRelations = relations(skillCertifications, ({ one }) => ({
  household: one(households, {
    fields: [skillCertifications.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [skillCertifications.memberId],
    references: [members.id],
  }),
  skill: one(skills, {
    fields: [skillCertifications.skillId],
    references: [skills.id],
  }),
  certifiedBy: one(members, {
    fields: [skillCertifications.certifiedById],
    references: [members.id],
  }),
}));

export const skillChallengesRelations = relations(skillChallenges, ({ one, many }) => ({
  household: one(households, {
    fields: [skillChallenges.householdId],
    references: [households.id],
  }),
  skill: one(skills, {
    fields: [skillChallenges.skillId],
    references: [skills.id],
  }),
  memberProgress: many(memberChallengeProgress),
}));

export const memberChallengeProgressRelations = relations(memberChallengeProgress, ({ one }) => ({
  household: one(households, {
    fields: [memberChallengeProgress.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [memberChallengeProgress.memberId],
    references: [members.id],
  }),
  challenge: one(skillChallenges, {
    fields: [memberChallengeProgress.challengeId],
    references: [skillChallenges.id],
  }),
}));

export const mentorshipRelationsRelations = relations(mentorshipRelations, ({ one }) => ({
  household: one(households, {
    fields: [mentorshipRelations.householdId],
    references: [households.id],
  }),
  mentor: one(members, {
    fields: [mentorshipRelations.mentorId],
    references: [members.id],
  }),
  mentee: one(members, {
    fields: [mentorshipRelations.menteeId],
    references: [members.id],
  }),
  skill: one(skills, {
    fields: [mentorshipRelations.skillId],
    references: [skills.id],
  }),
}));

export const skillBadgesRelations = relations(skillBadges, ({ one, many }) => ({
  household: one(households, {
    fields: [skillBadges.householdId],
    references: [households.id],
  }),
  skill: one(skills, {
    fields: [skillBadges.skillId],
    references: [skills.id],
  }),
  skillTree: one(skillTrees, {
    fields: [skillBadges.skillTreeId],
    references: [skillTrees.id],
  }),
  memberBadges: many(memberSkillBadges),
}));

export const memberSkillBadgesRelations = relations(memberSkillBadges, ({ one }) => ({
  household: one(households, {
    fields: [memberSkillBadges.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [memberSkillBadges.memberId],
    references: [members.id],
  }),
  badge: one(skillBadges, {
    fields: [memberSkillBadges.badgeId],
    references: [skillBadges.id],
  }),
}));

export const expertTipsRelations = relations(expertTips, ({ one }) => ({
  household: one(households, {
    fields: [expertTips.householdId],
    references: [households.id],
  }),
  skill: one(skills, {
    fields: [expertTips.skillId],
    references: [skills.id],
  }),
}));
