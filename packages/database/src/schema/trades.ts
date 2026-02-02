import { pgTable, uuid, varchar, integer, timestamp, text, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';
import { choreSchedules } from './completions';

// Chore trades table
export const choreTrades = pgTable(
  'chore_trades',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),

    // Trade participants
    initiatorMemberId: uuid('initiator_member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    recipientMemberId: uuid('recipient_member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),

    // Chores involved
    offeredChoreScheduleId: uuid('offered_chore_schedule_id')
      .notNull()
      .references(() => choreSchedules.id, { onDelete: 'cascade' }),
    requestedChoreScheduleId: uuid('requested_chore_schedule_id')
      .references(() => choreSchedules.id, { onDelete: 'cascade' }),

    // Points negotiation
    pointsOffered: integer('points_offered').default(0).notNull(),
    pointsRequested: integer('points_requested').default(0).notNull(),

    // Optional message
    message: text('message'),

    // Status tracking
    status: varchar('status', { length: 30 }).default('pending_recipient').notNull(),

    // Recipient response
    recipientRespondedAt: timestamp('recipient_responded_at', { withTimezone: true }),

    // Parent approval
    approvedBy: uuid('approved_by').references(() => members.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),

    // Expiration
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_trades_household').on(table.householdId),
    index('idx_trades_initiator').on(table.initiatorMemberId),
    index('idx_trades_recipient').on(table.recipientMemberId),
    index('idx_trades_status').on(table.householdId, table.status),
    index('idx_trades_expires').on(table.expiresAt),
  ]
);

// Relations
export const choreTradesRelations = relations(choreTrades, ({ one }) => ({
  household: one(households, {
    fields: [choreTrades.householdId],
    references: [households.id],
  }),
  initiator: one(members, {
    fields: [choreTrades.initiatorMemberId],
    references: [members.id],
    relationName: 'tradeInitiator',
  }),
  recipient: one(members, {
    fields: [choreTrades.recipientMemberId],
    references: [members.id],
    relationName: 'tradeRecipient',
  }),
  offeredChoreSchedule: one(choreSchedules, {
    fields: [choreTrades.offeredChoreScheduleId],
    references: [choreSchedules.id],
    relationName: 'offeredSchedule',
  }),
  requestedChoreSchedule: one(choreSchedules, {
    fields: [choreTrades.requestedChoreScheduleId],
    references: [choreSchedules.id],
    relationName: 'requestedSchedule',
  }),
  approver: one(members, {
    fields: [choreTrades.approvedBy],
    references: [members.id],
    relationName: 'tradeApprover',
  }),
}));
