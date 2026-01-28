import { pgTable, uuid, varchar, integer, timestamp, boolean, text, date, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';
import { chores } from './chores';

// Chore completions
export const choreCompletions = pgTable(
  'chore_completions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    choreId: uuid('chore_id')
      .notNull()
      .references(() => chores.id, { onDelete: 'cascade' }),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),

    scheduledDate: date('scheduled_date').notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull(),

    status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'approved', 'rejected'
    approvedBy: uuid('approved_by').references(() => members.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),

    photoUrl: text('photo_url'),

    pointsAwarded: integer('points_awarded').default(0),
    streakDay: integer('streak_day'), // Which day of streak this was

    // Time tracking
    startedAt: timestamp('started_at', { withTimezone: true }),
    durationSeconds: integer('duration_seconds'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_completions_chore').on(table.choreId),
    index('idx_completions_member').on(table.memberId),
    index('idx_completions_date').on(table.householdId, table.scheduledDate),
    index('idx_completions_status').on(table.householdId, table.status),
  ]
);

// Chore schedules - generated daily assignments
export const choreSchedules = pgTable(
  'chore_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    choreId: uuid('chore_id')
      .notNull()
      .references(() => chores.id, { onDelete: 'cascade' }),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    scheduledDate: date('scheduled_date').notNull(),
    assignedTo: uuid('assigned_to')
      .notNull()
      .references(() => members.id),
    isCompleted: boolean('is_completed').default(false),
    completionId: uuid('completion_id').references(() => choreCompletions.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_schedules_date').on(table.householdId, table.scheduledDate),
    index('idx_schedules_member').on(table.assignedTo, table.scheduledDate),
    unique('unique_chore_date_member').on(table.choreId, table.scheduledDate, table.assignedTo),
  ]
);

// Relations
export const choreCompletionsRelations = relations(choreCompletions, ({ one }) => ({
  chore: one(chores, {
    fields: [choreCompletions.choreId],
    references: [chores.id],
  }),
  household: one(households, {
    fields: [choreCompletions.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [choreCompletions.memberId],
    references: [members.id],
  }),
  approver: one(members, {
    fields: [choreCompletions.approvedBy],
    references: [members.id],
  }),
}));

export const choreSchedulesRelations = relations(choreSchedules, ({ one }) => ({
  chore: one(chores, {
    fields: [choreSchedules.choreId],
    references: [chores.id],
  }),
  household: one(households, {
    fields: [choreSchedules.householdId],
    references: [households.id],
  }),
  assignee: one(members, {
    fields: [choreSchedules.assignedTo],
    references: [members.id],
  }),
  completion: one(choreCompletions, {
    fields: [choreSchedules.completionId],
    references: [choreCompletions.id],
  }),
}));
