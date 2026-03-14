import { pgTable, uuid, varchar, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { chores } from './chores';

// Tags belonging to a household
export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 50 }).notNull(),
    color: varchar('color', { length: 7 }).notNull().default('#6b7280'), // hex color
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_tags_household_name').on(table.householdId, table.name),
    index('idx_tags_household').on(table.householdId),
  ]
);

// Many-to-many: chores <-> tags
export const choreTags = pgTable(
  'chore_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    choreId: uuid('chore_id')
      .notNull()
      .references(() => chores.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_chore_tags_unique').on(table.choreId, table.tagId),
    index('idx_chore_tags_chore').on(table.choreId),
    index('idx_chore_tags_tag').on(table.tagId),
  ]
);

// Relations
export const tagsRelations = relations(tags, ({ one, many }) => ({
  household: one(households, {
    fields: [tags.householdId],
    references: [households.id],
  }),
  choreTags: many(choreTags),
}));

export const choreTagsRelations = relations(choreTags, ({ one }) => ({
  chore: one(chores, {
    fields: [choreTags.choreId],
    references: [chores.id],
  }),
  tag: one(tags, {
    fields: [choreTags.tagId],
    references: [tags.id],
  }),
}));
