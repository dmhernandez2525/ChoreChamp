import { pgTable, uuid, varchar, timestamp, index, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';

export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    keyHash: text('key_hash').notNull(),
    keyPrefix: varchar('key_prefix', { length: 12 }).notNull(),
    createdByMemberId: uuid('created_by_member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_api_keys_household').on(table.householdId),
    index('idx_api_keys_prefix').on(table.keyPrefix),
  ]
);

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  household: one(households, {
    fields: [apiKeys.householdId],
    references: [households.id],
  }),
  creator: one(members, {
    fields: [apiKeys.createdByMemberId],
    references: [members.id],
  }),
}));
