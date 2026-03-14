import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';

// Automation rules belonging to a household
export const automationRules = pgTable(
  'automation_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    trigger: varchar('trigger', { length: 50 }).notNull(), // 'chore_completed' | 'chore_created' | 'due_date_passed' | 'status_changed' | 'assigned'
    triggerConfig: jsonb('trigger_config').notNull().default({}),
    action: varchar('action', { length: 50 }).notNull(), // 'assign' | 'change_status' | 'add_tag' | 'send_notification' | 'set_priority' | 'create_chore'
    actionConfig: jsonb('action_config').notNull().default({}),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_automation_rules_household').on(table.householdId),
  ]
);

// Relations
export const automationRulesRelations = relations(automationRules, ({ one }) => ({
  household: one(households, {
    fields: [automationRules.householdId],
    references: [households.id],
  }),
}));
