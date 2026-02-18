import { pgTable, uuid, varchar, integer, timestamp, boolean, text, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { members } from './members';

export const activityLogs = pgTable(
  'activity_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id').notNull(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    category: varchar('category', { length: 32 }).notNull(),
    activityName: varchar('activity_name', { length: 200 }).notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    caloriesEstimate: integer('calories_estimate'),
    note: text('note'),
    loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_activity_logs_household').on(table.householdId),
    index('idx_activity_logs_member').on(table.memberId),
    index('idx_activity_logs_logged_at').on(table.loggedAt),
    index('idx_activity_logs_category').on(table.category),
  ]
);

export const activityLogRelations = relations(activityLogs, ({ one }) => ({
  member: one(members, {
    fields: [activityLogs.memberId],
    references: [members.id],
  }),
}));

export const activityGoals = pgTable(
  'activity_goals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id').notNull(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    category: varchar('category', { length: 32 }).notNull().default('all'),
    targetMinutesPerDay: integer('target_minutes_per_day').notNull().default(60),
    targetMinutesPerWeek: integer('target_minutes_per_week').notNull().default(300),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_activity_goals_household').on(table.householdId),
    index('idx_activity_goals_member').on(table.memberId),
  ]
);

export const activityGoalRelations = relations(activityGoals, ({ one }) => ({
  member: one(members, {
    fields: [activityGoals.memberId],
    references: [members.id],
  }),
}));

export const wellnessCheckIns = pgTable(
  'wellness_check_ins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id').notNull(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    moodScore: integer('mood_score').notNull(),
    energyScore: integer('energy_score').notNull(),
    stressScore: integer('stress_score'),
    sleepQualityScore: integer('sleep_quality_score'),
    note: text('note'),
    checkedInAt: timestamp('checked_in_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_wellness_checkins_household').on(table.householdId),
    index('idx_wellness_checkins_member').on(table.memberId),
    index('idx_wellness_checkins_date').on(table.checkedInAt),
  ]
);

export const wellnessCheckInRelations = relations(wellnessCheckIns, ({ one }) => ({
  member: one(members, {
    fields: [wellnessCheckIns.memberId],
    references: [members.id],
  }),
}));

export const sleepLogs = pgTable(
  'sleep_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id').notNull(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    bedtime: timestamp('bedtime', { withTimezone: true }).notNull(),
    wakeTime: timestamp('wake_time', { withTimezone: true }).notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    qualityScore: integer('quality_score'),
    note: text('note'),
    logDate: timestamp('log_date', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_sleep_logs_household').on(table.householdId),
    index('idx_sleep_logs_member').on(table.memberId),
    index('idx_sleep_logs_date').on(table.logDate),
  ]
);

export const sleepLogRelations = relations(sleepLogs, ({ one }) => ({
  member: one(members, {
    fields: [sleepLogs.memberId],
    references: [members.id],
  }),
}));

export const mealPlans = pgTable(
  'meal_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id').notNull(),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    mealType: varchar('meal_type', { length: 32 }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    servings: integer('servings').default(4),
    prepTimeMinutes: integer('prep_time_minutes'),
    cookTimeMinutes: integer('cook_time_minutes'),
    calories: integer('calories'),
    plannedDate: timestamp('planned_date', { withTimezone: true }).notNull(),
    isCompleted: boolean('is_completed').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_meal_plans_household').on(table.householdId),
    index('idx_meal_plans_date').on(table.plannedDate),
  ]
);

export const mealPlanRelations = relations(mealPlans, ({ one }) => ({
  createdBy: one(members, {
    fields: [mealPlans.createdById],
    references: [members.id],
  }),
}));

export const mentalHealthResources = pgTable(
  'mental_health_resources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id').notNull(),
    category: varchar('category', { length: 64 }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    resourceUrl: text('resource_url'),
    ageRange: varchar('age_range', { length: 32 }),
    isPinned: boolean('is_pinned').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_mental_health_household').on(table.householdId),
    index('idx_mental_health_category').on(table.category),
  ]
);

export const gratitudeEntries = pgTable(
  'gratitude_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id').notNull(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_gratitude_household').on(table.householdId),
    index('idx_gratitude_member').on(table.memberId),
  ]
);

export const gratitudeEntryRelations = relations(gratitudeEntries, ({ one }) => ({
  member: one(members, {
    fields: [gratitudeEntries.memberId],
    references: [members.id],
  }),
}));
