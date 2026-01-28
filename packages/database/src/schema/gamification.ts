import { pgTable, uuid, varchar, integer, timestamp, boolean, text, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';

// Point transactions (audit log)
export const pointTransactions = pgTable(
  'point_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),

    amount: integer('amount').notNull(), // Positive = earn, Negative = spend
    balanceAfter: integer('balance_after').notNull(),

    transactionType: varchar('transaction_type', { length: 50 }).notNull(),
    referenceId: uuid('reference_id'),
    referenceType: varchar('reference_type', { length: 50 }),

    description: text('description'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_transactions_member').on(table.memberId),
    index('idx_transactions_household').on(table.householdId, table.createdAt),
  ]
);

// Badge definitions (global)
export const badges = pgTable('badges', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  category: varchar('category', { length: 20 }).notNull(), // 'streak', 'volume', 'time', 'family', 'special'
  rarity: varchar('rarity', { length: 20 }).notNull(), // 'common', 'rare', 'epic', 'legendary'
  criteriaType: varchar('criteria_type', { length: 50 }).notNull(),
  criteriaThreshold: integer('criteria_threshold').notNull(),
  criteriaTimeframe: varchar('criteria_timeframe', { length: 20 }),
  isHidden: boolean('is_hidden').default(false),
  sortOrder: integer('sort_order').default(0),
});

// Family party system (collective accountability)
export const familyParties = pgTable('family_parties', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' })
    .unique(),

  healthCurrent: integer('health_current').default(100),
  healthMax: integer('health_max').default(100),

  weeklyGoal: integer('weekly_goal').default(500),
  weeklyProgress: integer('weekly_progress').default(0),
  weekStartedAt: timestamp('week_started_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Boss battles (weekly challenges)
export const bossBattles = pgTable(
  'boss_battles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    icon: varchar('icon', { length: 50 }),

    healthMax: integer('health_max').notNull(),
    healthCurrent: integer('health_current').notNull(),
    pointReward: integer('point_reward').notNull(),

    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    defeatedAt: timestamp('defeated_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_boss_battles_household').on(table.householdId),
    index('idx_boss_battles_active').on(table.householdId, table.defeatedAt),
  ]
);

// Relations
export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
  household: one(households, {
    fields: [pointTransactions.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [pointTransactions.memberId],
    references: [members.id],
  }),
}));

export const familyPartiesRelations = relations(familyParties, ({ one }) => ({
  household: one(households, {
    fields: [familyParties.householdId],
    references: [households.id],
  }),
}));

export const bossBattlesRelations = relations(bossBattles, ({ one }) => ({
  household: one(households, {
    fields: [bossBattles.householdId],
    references: [households.id],
  }),
}));
