import { pgTable, uuid, varchar, integer, timestamp, boolean, text, date, time, index, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';
import { choreCompletions, choreSchedules } from './completions';

// Chores table
export const chores = pgTable(
  'chores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),

    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    icon: varchar('icon', { length: 50 }).default('✅'),
    category: varchar('category', { length: 50 }).default('general'),

    // Points
    pointValue: integer('point_value').default(10).notNull(),
    difficulty: varchar('difficulty', { length: 20 }).default('medium'),

    // Assignment
    assignedTo: uuid('assigned_to').array().default([]), // Array of member IDs
    assignmentType: varchar('assignment_type', { length: 20 }).default('specific'),
    rotationIndex: integer('rotation_index').default(0),

    // Scheduling
    recurrenceType: varchar('recurrence_type', { length: 20 }).default('once'),
    recurrenceDays: integer('recurrence_days').array(), // Days of week 0-6
    recurrenceInterval: integer('recurrence_interval'), // Every X days
    recurrenceAfterDays: integer('recurrence_after_days'), // X days after completion
    startDate: date('start_date').defaultNow().notNull(),
    endDate: date('end_date'),
    dueTime: time('due_time'),
    timeWindowMinutes: integer('time_window_minutes'),

    // Requirements
    requiresApproval: boolean('requires_approval').default(false),
    requiresPhoto: boolean('requires_photo').default(false),
    estimatedMinutes: integer('estimated_minutes'),

    // ADHD settings
    showTimer: boolean('show_timer').default(false),
    steps: jsonb('steps'), // Array of step strings

    // Metadata
    createdBy: uuid('created_by')
      .notNull()
      .references(() => members.id),
    isActive: boolean('is_active').default(true),
    isTemplate: boolean('is_template').default(false),
    templateId: uuid('template_id').references(() => choreTemplates.id),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_chores_household').on(table.householdId),
    index('idx_chores_active').on(table.householdId, table.isActive),
  ]
);

// Global chore templates
export const choreTemplates = pgTable(
  'chore_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    icon: varchar('icon', { length: 50 }),
    category: varchar('category', { length: 50 }).notNull(),
    pointValue: integer('point_value').default(10),
    difficulty: varchar('difficulty', { length: 20 }).default('medium'),
    estimatedMinutes: integer('estimated_minutes'),
    minAge: integer('min_age'),
    maxAge: integer('max_age'),
    steps: jsonb('steps'),
    sortOrder: integer('sort_order').default(0),
    isActive: boolean('is_active').default(true),
  },
  (table) => [
    index('idx_templates_category').on(table.category),
    index('idx_templates_age').on(table.minAge, table.maxAge),
  ]
);

// Relations
export const choresRelations = relations(chores, ({ one, many }) => ({
  household: one(households, {
    fields: [chores.householdId],
    references: [households.id],
  }),
  creator: one(members, {
    fields: [chores.createdBy],
    references: [members.id],
  }),
  template: one(choreTemplates, {
    fields: [chores.templateId],
    references: [choreTemplates.id],
  }),
  completions: many(choreCompletions),
  schedules: many(choreSchedules),
}));
