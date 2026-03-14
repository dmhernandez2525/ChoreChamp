import { pgTable, uuid, varchar, timestamp, boolean, text, jsonb, index, bigint, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';
import { chores } from './chores';

// Board preferences per member per household
export const choreBoardPreferences = pgTable(
  'chore_board_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),

    viewMode: varchar('view_mode', { length: 20 }).default('dashboard'), // kanban, calendar, list, dashboard
    columnSettings: jsonb('column_settings').default('{}'), // { columnId: { color, wipLimit, hidden, order } }
    defaultGroupBy: varchar('default_group_by', { length: 30 }), // member, category, priority, due_date, none
    defaultSort: jsonb('default_sort').default('{}'), // { field, direction }

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_board_prefs_member_household').on(table.memberId, table.householdId),
  ]
);

// Saved filter views
export const savedChoreFilters = pgTable(
  'saved_chore_filters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 100 }).notNull(),
    filters: jsonb('filters').default('[]'), // Array of { field, operator, value }
    sort: jsonb('sort').default('{}'), // { field, direction }
    groupBy: varchar('group_by', { length: 30 }),
    visibility: varchar('visibility', { length: 20 }).default('private'), // private, household

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_saved_filters_household').on(table.householdId),
    index('idx_saved_filters_member').on(table.memberId),
  ]
);

// Comments on chores
export const choreComments = pgTable(
  'chore_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    choreId: uuid('chore_id')
      .notNull()
      .references(() => chores.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),

    comment: text('comment').notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }), // soft delete

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_chore_comments_chore').on(table.choreId),
    index('idx_chore_comments_member').on(table.memberId),
  ]
);

// Attachments on chores
export const choreAttachments = pgTable(
  'chore_attachments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    choreId: uuid('chore_id')
      .notNull()
      .references(() => chores.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),

    fileName: varchar('file_name', { length: 500 }).notNull(),
    fileUrl: text('file_url').notNull(),
    fileSize: bigint('file_size', { mode: 'number' }).default(0),
    mimeType: varchar('mime_type', { length: 100 }),
    isPhotoProof: boolean('is_photo_proof').default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_chore_attachments_chore').on(table.choreId),
  ]
);

// Activity log for chore changes
export const choreActivityLog = pgTable(
  'chore_activity_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    choreId: uuid('chore_id')
      .notNull()
      .references(() => chores.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),

    action: varchar('action', { length: 50 }).notNull(), // created, status_changed, assigned, unassigned, edited, commented, attachment_added
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_chore_activity_chore').on(table.choreId),
    index('idx_chore_activity_created').on(table.createdAt),
  ]
);

// Relations
export const choreBoardPreferencesRelations = relations(choreBoardPreferences, ({ one }) => ({
  household: one(households, {
    fields: [choreBoardPreferences.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [choreBoardPreferences.memberId],
    references: [members.id],
  }),
}));

export const savedChoreFiltersRelations = relations(savedChoreFilters, ({ one }) => ({
  household: one(households, {
    fields: [savedChoreFilters.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [savedChoreFilters.memberId],
    references: [members.id],
  }),
}));

export const choreCommentsRelations = relations(choreComments, ({ one }) => ({
  chore: one(chores, {
    fields: [choreComments.choreId],
    references: [chores.id],
  }),
  member: one(members, {
    fields: [choreComments.memberId],
    references: [members.id],
  }),
}));

export const choreAttachmentsRelations = relations(choreAttachments, ({ one }) => ({
  chore: one(chores, {
    fields: [choreAttachments.choreId],
    references: [chores.id],
  }),
  member: one(members, {
    fields: [choreAttachments.memberId],
    references: [members.id],
  }),
}));

export const choreActivityLogRelations = relations(choreActivityLog, ({ one }) => ({
  chore: one(chores, {
    fields: [choreActivityLog.choreId],
    references: [chores.id],
  }),
  member: one(members, {
    fields: [choreActivityLog.memberId],
    references: [members.id],
  }),
}));
