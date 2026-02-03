import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  date,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';

/**
 * Subjects - classes/subjects for homework organization
 */
export const subjects = pgTable('subjects', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  shortName: text('short_name'),
  color: text('color').notNull().default('#3B82F6'),
  icon: text('icon'),

  // Teacher/class info
  teacherName: text('teacher_name'),
  roomNumber: text('room_number'),
  schedule: text('schedule'),

  // Goals
  targetGrade: text('target_grade'),
  currentGrade: text('current_grade'),

  // Settings
  notifyBeforeClass: boolean('notify_before_class').notNull().default(false),
  notifyMinutesBefore: integer('notify_minutes_before').notNull().default(15),

  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  memberIdx: index('subjects_member_idx').on(table.memberId),
}));

/**
 * Assignments - homework assignments
 */
export const assignments = pgTable('assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),

  title: text('title').notNull(),
  description: text('description'),
  instructions: text('instructions'),

  // Categorization
  assignmentType: text('assignment_type').notNull().default('homework'),
  priority: text('priority').notNull().default('medium'),
  status: text('status').notNull().default('not_started'),

  // Dates
  assignedDate: date('assigned_date'),
  dueDate: timestamp('due_date').notNull(),
  completedAt: timestamp('completed_at'),
  submittedAt: timestamp('submitted_at'),

  // Estimated effort
  estimatedMinutes: integer('estimated_minutes'),
  actualMinutes: integer('actual_minutes'),

  // Grading
  maxPoints: integer('max_points'),
  earnedPoints: integer('earned_points'),
  grade: text('grade'),

  // Attachments/links
  attachments: jsonb('attachments').$type<Array<{
    name: string;
    url: string;
    type: string;
  }>>(),
  resourceLinks: jsonb('resource_links').$type<string[]>(),

  // Rewards
  pointsAwarded: integer('points_awarded'),
  screenTimeAwarded: integer('screen_time_awarded'),

  // Notes
  notes: text('notes'),
  parentNotes: text('parent_notes'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  memberDueIdx: index('assignments_member_due_idx').on(table.memberId, table.dueDate),
  statusIdx: index('assignments_status_idx').on(table.memberId, table.status),
}));

/**
 * Study Sessions - tracked study time
 */
export const studySessions = pgTable('study_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  assignmentId: uuid('assignment_id').references(() => assignments.id, { onDelete: 'set null' }),

  sessionType: text('session_type').notNull(),
  title: text('title'),

  // Timing
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at'),
  durationMinutes: integer('duration_minutes').notNull().default(0),
  plannedDurationMinutes: integer('planned_duration_minutes'),

  // Focus tracking
  breaksTaken: integer('breaks_taken').notNull().default(0),
  focusScore: integer('focus_score'),

  // What was accomplished
  accomplishments: text('accomplishments'),
  pagesCovered: text('pages_covered'),
  problemsCompleted: integer('problems_completed'),

  // Self-assessment
  productivityRating: integer('productivity_rating'),
  difficultyRating: integer('difficulty_rating'),
  comprehensionRating: integer('comprehension_rating'),

  // Environment
  location: text('location'),
  studyMethod: text('study_method'),

  // Rewards earned
  pointsEarned: integer('points_earned').notNull().default(0),
  bonusPointsEarned: integer('bonus_points_earned').notNull().default(0),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  memberDateIdx: index('study_sessions_member_date_idx').on(table.memberId, table.startedAt),
}));

/**
 * Study Goals - goals for study time and performance
 */
export const studyGoals = pgTable('study_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),

  title: text('title').notNull(),
  description: text('description'),

  // Goal type
  goalType: text('goal_type').notNull(),
  targetValue: integer('target_value').notNull(),
  currentValue: integer('current_value').notNull().default(0),

  // Time period
  periodType: text('period_type').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),

  // Rewards
  rewardPoints: integer('reward_points'),
  rewardScreenTime: integer('reward_screen_time'),
  rewardDescription: text('reward_description'),

  // Status
  isCompleted: boolean('is_completed').notNull().default(false),
  completedAt: timestamp('completed_at'),
  isActive: boolean('is_active').notNull().default(true),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  memberActiveIdx: index('study_goals_member_active_idx').on(table.memberId, table.isActive),
}));

/**
 * Study Streaks - tracking consecutive study days
 */
export const studyStreaks = pgTable('study_streaks', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' })
    .unique(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastStudyDate: date('last_study_date'),

  // Weekly stats
  weeklyMinutes: integer('weekly_minutes').notNull().default(0),
  weeklyGoalMinutes: integer('weekly_goal_minutes').notNull().default(300),
  weeklySessionCount: integer('weekly_session_count').notNull().default(0),

  // Monthly stats
  monthlyMinutes: integer('monthly_minutes').notNull().default(0),
  monthlySessionCount: integer('monthly_session_count').notNull().default(0),

  // Totals
  totalMinutes: integer('total_minutes').notNull().default(0),
  totalSessions: integer('total_sessions').notNull().default(0),
  totalAssignmentsCompleted: integer('total_assignments_completed').notNull().default(0),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Study Reminders - reminders for study sessions and assignments
 */
export const studyReminders = pgTable('study_reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  assignmentId: uuid('assignment_id').references(() => assignments.id, { onDelete: 'cascade' }),

  reminderType: text('reminder_type').notNull(),
  title: text('title').notNull(),
  message: text('message'),

  // Schedule
  scheduledFor: timestamp('scheduled_for'),
  recurringDays: jsonb('recurring_days').$type<number[]>(),
  recurringTime: text('recurring_time'),

  // Status
  isEnabled: boolean('is_enabled').notNull().default(true),
  lastSentAt: timestamp('last_sent_at'),
  snoozedUntil: timestamp('snoozed_until'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  memberEnabledIdx: index('study_reminders_member_enabled_idx').on(table.memberId, table.isEnabled),
}));

/**
 * Study Plans - daily/weekly study plans
 */
export const studyPlans = pgTable('study_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),

  planType: text('plan_type').notNull(), // daily, weekly
  date: date('date').notNull(),
  endDate: date('end_date'),

  // Planned items
  plannedItems: jsonb('planned_items').$type<Array<{
    subjectId: string | null;
    subjectName: string | null;
    assignmentId: string | null;
    assignmentTitle: string | null;
    plannedMinutes: number;
    scheduledTime: string | null;
    notes: string | null;
    isCompleted: boolean;
  }>>().notNull().default([]),

  // Totals
  totalPlannedMinutes: integer('total_planned_minutes').notNull().default(0),
  totalCompletedMinutes: integer('total_completed_minutes').notNull().default(0),

  // Status
  isCompleted: boolean('is_completed').notNull().default(false),
  completionPercentage: integer('completion_percentage').notNull().default(0),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  memberDateIdx: index('study_plans_member_date_idx').on(table.memberId, table.date),
}));

// Relations
export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  household: one(households, {
    fields: [subjects.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [subjects.memberId],
    references: [members.id],
  }),
  assignments: many(assignments),
  studySessions: many(studySessions),
  studyGoals: many(studyGoals),
  reminders: many(studyReminders),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  household: one(households, {
    fields: [assignments.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [assignments.memberId],
    references: [members.id],
  }),
  subject: one(subjects, {
    fields: [assignments.subjectId],
    references: [subjects.id],
  }),
  studySessions: many(studySessions),
  reminders: many(studyReminders),
}));

export const studySessionsRelations = relations(studySessions, ({ one }) => ({
  household: one(households, {
    fields: [studySessions.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [studySessions.memberId],
    references: [members.id],
  }),
  subject: one(subjects, {
    fields: [studySessions.subjectId],
    references: [subjects.id],
  }),
  assignment: one(assignments, {
    fields: [studySessions.assignmentId],
    references: [assignments.id],
  }),
}));

export const studyGoalsRelations = relations(studyGoals, ({ one }) => ({
  household: one(households, {
    fields: [studyGoals.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [studyGoals.memberId],
    references: [members.id],
  }),
  subject: one(subjects, {
    fields: [studyGoals.subjectId],
    references: [subjects.id],
  }),
}));

export const studyStreaksRelations = relations(studyStreaks, ({ one }) => ({
  household: one(households, {
    fields: [studyStreaks.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [studyStreaks.memberId],
    references: [members.id],
  }),
}));

export const studyRemindersRelations = relations(studyReminders, ({ one }) => ({
  household: one(households, {
    fields: [studyReminders.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [studyReminders.memberId],
    references: [members.id],
  }),
  subject: one(subjects, {
    fields: [studyReminders.subjectId],
    references: [subjects.id],
  }),
  assignment: one(assignments, {
    fields: [studyReminders.assignmentId],
    references: [assignments.id],
  }),
}));

export const studyPlansRelations = relations(studyPlans, ({ one }) => ({
  household: one(households, {
    fields: [studyPlans.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [studyPlans.memberId],
    references: [members.id],
  }),
}));
