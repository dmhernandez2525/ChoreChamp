import { pgTable, uuid, varchar, smallint, integer, timestamp, boolean, text, date, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { households } from './households';
import { choreCompletions } from './completions';

// Members table - family members within a household
export const members = pgTable(
  'members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => users.id), // NULL for child profiles

    name: varchar('name', { length: 100 }).notNull(),
    role: varchar('role', { length: 20 }).notNull(), // 'parent', 'child', 'teen', 'viewer'
    color: varchar('color', { length: 7 }).notNull(), // Hex color
    avatarUrl: text('avatar_url'),
    birthYear: smallint('birth_year'),

    // Points
    pointsCurrent: integer('points_current').default(0),
    pointsLifetime: integer('points_lifetime').default(0),

    // Streaks
    streakCurrent: integer('streak_current').default(0),
    streakLongest: integer('streak_longest').default(0),
    streakLastCompletedDate: date('streak_last_completed_date'),
    streakFreezesAvailable: integer('streak_freezes_available').default(1),
    streakFreezesUsed: integer('streak_freezes_used').default(0),

    // Badges (array of badge IDs)
    badges: text('badges').array().default([]),

    // Settings
    canRedeemRewards: boolean('can_redeem_rewards').default(true),
    requiresApproval: boolean('requires_approval').default(true),

    // Notification tracking
    lastReminderAt: timestamp('last_reminder_at', { withTimezone: true }),

    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_members_household').on(table.householdId),
    index('idx_members_user').on(table.userId),
    unique('unique_user_household').on(table.householdId, table.userId),
  ]
);

// Relations
export const membersRelations = relations(members, ({ one, many }) => ({
  household: one(households, {
    fields: [members.householdId],
    references: [households.id],
  }),
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
  completions: many(choreCompletions),
}));
