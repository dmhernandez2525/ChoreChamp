import { pgTable, uuid, varchar, integer, timestamp, boolean, text, date, index, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';

// Allowance settings per member
export const allowanceSettings = pgTable(
  'allowance_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),

    // Conversion rate
    pointsPerDollar: integer('points_per_dollar').default(100).notNull(),
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),

    // Payout settings
    payoutFrequency: varchar('payout_frequency', { length: 20 }).default('weekly').notNull(),
    payoutDayOfWeek: integer('payout_day_of_week'), // 0-6 for weekly/biweekly
    payoutDayOfMonth: integer('payout_day_of_month'), // 1-31 for monthly

    // Limits
    minimumPayout: decimal('minimum_payout', { precision: 10, scale: 2 }).default('1.00').notNull(),
    maximumPayout: decimal('maximum_payout', { precision: 10, scale: 2 }),

    // Reserve
    reservePoints: integer('reserve_points').default(0).notNull(),

    isActive: boolean('is_active').default(true),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_allowance_settings_household').on(table.householdId),
    index('idx_allowance_settings_member').on(table.memberId),
  ]
);

// Allowance payouts
export const allowancePayouts = pgTable(
  'allowance_payouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    settingsId: uuid('settings_id')
      .notNull()
      .references(() => allowanceSettings.id, { onDelete: 'cascade' }),

    // Payout period
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),

    // Points and money
    pointsConverted: integer('points_converted').notNull(),
    amountDue: decimal('amount_due', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),

    // Status
    status: varchar('status', { length: 20 }).default('pending').notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    paidBy: uuid('paid_by').references(() => members.id),

    // Notes
    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_allowance_payouts_household').on(table.householdId),
    index('idx_allowance_payouts_member').on(table.memberId),
    index('idx_allowance_payouts_status').on(table.householdId, table.status),
    index('idx_allowance_payouts_period').on(table.periodStart, table.periodEnd),
  ]
);

// Relations
export const allowanceSettingsRelations = relations(allowanceSettings, ({ one, many }) => ({
  household: one(households, {
    fields: [allowanceSettings.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [allowanceSettings.memberId],
    references: [members.id],
  }),
  payouts: many(allowancePayouts),
}));

export const allowancePayoutsRelations = relations(allowancePayouts, ({ one }) => ({
  household: one(households, {
    fields: [allowancePayouts.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [allowancePayouts.memberId],
    references: [members.id],
  }),
  settings: one(allowanceSettings, {
    fields: [allowancePayouts.settingsId],
    references: [allowanceSettings.id],
  }),
  paidByMember: one(members, {
    fields: [allowancePayouts.paidBy],
    references: [members.id],
    relationName: 'payoutPaidBy',
  }),
}));
