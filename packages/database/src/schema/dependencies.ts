import { pgTable, uuid, varchar, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { chores } from './chores';

export const choreDependencies = pgTable(
  'chore_dependencies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    choreId: uuid('chore_id')
      .notNull()
      .references(() => chores.id, { onDelete: 'cascade' }),
    dependsOnChoreId: uuid('depends_on_chore_id')
      .notNull()
      .references(() => chores.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 20 }).notNull().default('blocks'), // blocks, blocked_by, relates_to
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_chore_deps_unique').on(table.choreId, table.dependsOnChoreId),
    index('idx_chore_deps_chore').on(table.choreId),
    index('idx_chore_deps_depends_on').on(table.dependsOnChoreId),
  ]
);

export const choreDependenciesRelations = relations(choreDependencies, ({ one }) => ({
  chore: one(chores, {
    fields: [choreDependencies.choreId],
    references: [chores.id],
  }),
  dependsOn: one(chores, {
    fields: [choreDependencies.dependsOnChoreId],
    references: [chores.id],
  }),
}));
