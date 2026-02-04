import { pgTable, uuid, varchar, timestamp, text, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';

export const supportThreads = pgTable(
  'support_threads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    createdByMemberId: uuid('created_by_member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    subject: varchar('subject', { length: 150 }).notNull(),
    status: varchar('status', { length: 20 }).default('open'),
    priority: varchar('priority', { length: 20 }).default('standard'),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }).defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_support_threads_household').on(table.householdId),
    index('idx_support_threads_status').on(table.householdId, table.status),
  ]
);

export const supportMessages = pgTable(
  'support_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => supportThreads.id, { onDelete: 'cascade' }),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    senderMemberId: uuid('sender_member_id').references(() => members.id, { onDelete: 'set null' }),
    senderRole: varchar('sender_role', { length: 20 }).default('member'),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_support_messages_thread').on(table.threadId),
    index('idx_support_messages_household').on(table.householdId),
  ]
);

export const supportThreadsRelations = relations(supportThreads, ({ one, many }) => ({
  household: one(households, {
    fields: [supportThreads.householdId],
    references: [households.id],
  }),
  creator: one(members, {
    fields: [supportThreads.createdByMemberId],
    references: [members.id],
  }),
  messages: many(supportMessages),
}));

export const supportMessagesRelations = relations(supportMessages, ({ one }) => ({
  thread: one(supportThreads, {
    fields: [supportMessages.threadId],
    references: [supportThreads.id],
  }),
  household: one(households, {
    fields: [supportMessages.householdId],
    references: [households.id],
  }),
  sender: one(members, {
    fields: [supportMessages.senderMemberId],
    references: [members.id],
  }),
}));
