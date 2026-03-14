import { pgTable, uuid, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { chores } from './chores';
import { members } from './members';

export const timeLogs = pgTable(
  'time_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    choreId: uuid('chore_id')
      .notNull()
      .references(() => chores.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    stoppedAt: timestamp('stopped_at', { withTimezone: true }),
    durationSeconds: integer('duration_seconds'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_time_logs_chore').on(table.choreId),
    index('idx_time_logs_member').on(table.memberId),
  ]
);

export const timeLogsRelations = relations(timeLogs, ({ one }) => ({
  chore: one(chores, {
    fields: [timeLogs.choreId],
    references: [chores.id],
  }),
  member: one(members, {
    fields: [timeLogs.memberId],
    references: [members.id],
  }),
}));
