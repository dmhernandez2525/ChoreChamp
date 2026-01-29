import { pgTable, uuid, varchar, smallint, integer, timestamp, boolean, index, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { members } from './members';
import { chores } from './chores';

// Households table
export const households = pgTable(
  'households',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),
    timezone: varchar('timezone', { length: 50 }).default('America/New_York'),
    weekStartsOn: smallint('week_starts_on').default(0), // 0 = Sunday
    pointsName: varchar('points_name', { length: 50 }).default('Stars'),
    currency: varchar('currency', { length: 3 }).default('USD'),

    // Subscription
    subscriptionTier: varchar('subscription_tier', { length: 20 }).default('free'),
    subscriptionExpiresAt: timestamp('subscription_expires_at', { withTimezone: true }),
    subscriptionProvider: varchar('subscription_provider', { length: 20 }),

    // Stats (denormalized for performance)
    totalChoresCompleted: integer('total_chores_completed').default(0),
    currentFamilyStreak: integer('current_family_streak').default(0),
    longestFamilyStreak: integer('longest_family_streak').default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_households_created_by').on(table.createdBy),
  ]
);

// Invite codes for joining households
export const inviteCodes = pgTable(
  'invite_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 8 }).unique().notNull(),
    role: varchar('role', { length: 20 }).default('child'),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    maxUses: integer('max_uses'),
    useCount: integer('use_count').default(0),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_invite_codes_code').on(table.code),
    index('idx_invite_codes_household').on(table.householdId),
  ]
);

// Junction table for users belonging to multiple households
export const userHouseholds = pgTable('user_households', {
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
});

// Relations
export const householdsRelations = relations(households, ({ one, many }) => ({
  creator: one(users, {
    fields: [households.createdBy],
    references: [users.id],
  }),
  members: many(members),
  chores: many(chores),
  inviteCodes: many(inviteCodes),
}));

export const inviteCodesRelations = relations(inviteCodes, ({ one }) => ({
  household: one(households, {
    fields: [inviteCodes.householdId],
    references: [households.id],
  }),
  creator: one(users, {
    fields: [inviteCodes.createdBy],
    references: [users.id],
  }),
}));
