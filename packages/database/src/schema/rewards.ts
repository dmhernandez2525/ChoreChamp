import { pgTable, uuid, varchar, integer, timestamp, boolean, text, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';

// Rewards catalog
export const rewards = pgTable(
  'rewards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),

    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    icon: varchar('icon', { length: 50 }).default('🎁'),
    type: varchar('type', { length: 50 }).default('custom'), // 'screen_time', 'money', 'privilege', 'activity', 'custom'

    pointCost: integer('point_cost').notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => members.id),

    // Quantity limits
    quantity: integer('quantity'), // NULL = unlimited
    quantityRemaining: integer('quantity_remaining'),

    // Availability
    isActive: boolean('is_active').default(true),
    availableFrom: timestamp('available_from', { withTimezone: true }),
    availableUntil: timestamp('available_until', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_rewards_household').on(table.householdId),
    index('idx_rewards_active').on(table.householdId, table.isActive),
  ]
);

// Reward redemptions
export const rewardRedemptions = pgTable(
  'reward_redemptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    rewardId: uuid('reward_id')
      .notNull()
      .references(() => rewards.id, { onDelete: 'cascade' }),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),

    pointsSpent: integer('points_spent').notNull(),
    status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'approved', 'fulfilled', 'rejected'

    requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow(),
    approvedBy: uuid('approved_by').references(() => members.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    fulfilledBy: uuid('fulfilled_by').references(() => members.id),
    fulfilledAt: timestamp('fulfilled_at', { withTimezone: true }),
    rejectedBy: uuid('rejected_by').references(() => members.id),
    rejectedAt: timestamp('rejected_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),

    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_redemptions_reward').on(table.rewardId),
    index('idx_redemptions_member').on(table.memberId),
    index('idx_redemptions_status').on(table.householdId, table.status),
  ]
);

// Relations
export const rewardsRelations = relations(rewards, ({ one, many }) => ({
  household: one(households, {
    fields: [rewards.householdId],
    references: [households.id],
  }),
  creator: one(members, {
    fields: [rewards.createdBy],
    references: [members.id],
  }),
  redemptions: many(rewardRedemptions),
}));

export const rewardRedemptionsRelations = relations(rewardRedemptions, ({ one }) => ({
  reward: one(rewards, {
    fields: [rewardRedemptions.rewardId],
    references: [rewards.id],
  }),
  household: one(households, {
    fields: [rewardRedemptions.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [rewardRedemptions.memberId],
    references: [members.id],
  }),
  approver: one(members, {
    fields: [rewardRedemptions.approvedBy],
    references: [members.id],
  }),
  fulfiller: one(members, {
    fields: [rewardRedemptions.fulfilledBy],
    references: [members.id],
  }),
}));
