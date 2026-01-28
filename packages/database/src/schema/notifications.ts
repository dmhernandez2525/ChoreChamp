import { pgTable, uuid, varchar, integer, timestamp, boolean, text, time, index, unique, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// Notification preferences
export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Push toggles
    pushEnabled: boolean('push_enabled').default(true),
    choreReminders: boolean('chore_reminders').default(true),
    streakReminders: boolean('streak_reminders').default(true),
    approvalRequests: boolean('approval_requests').default(true),
    familyUpdates: boolean('family_updates').default(true),
    celebrations: boolean('celebrations').default(true),
    weeklySummary: boolean('weekly_summary').default(true),

    // Quiet hours
    quietHoursEnabled: boolean('quiet_hours_enabled').default(true),
    quietHoursStart: time('quiet_hours_start').default('21:00'),
    quietHoursEnd: time('quiet_hours_end').default('08:00'),

    // Limits
    maxDailyNotifications: integer('max_daily_notifications').default(10),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique('unique_user_prefs').on(table.userId),
  ]
);

// Device tokens for push notifications
export const deviceTokens = pgTable(
  'device_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    token: text('token').unique().notNull(),
    platform: varchar('platform', { length: 20 }).notNull(), // 'ios', 'android', 'web'
    deviceName: varchar('device_name', { length: 100 }),

    isActive: boolean('is_active').default(true),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).defaultNow(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_device_tokens_user').on(table.userId, table.isActive),
  ]
);

// Notification log
export const notificationLog = pgTable(
  'notification_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    notificationType: varchar('notification_type', { length: 50 }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    body: text('body'),
    data: jsonb('data'),

    platform: varchar('platform', { length: 20 }),
    status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'sent', 'failed', 'clicked'

    sentAt: timestamp('sent_at', { withTimezone: true }),
    clickedAt: timestamp('clicked_at', { withTimezone: true }),
    errorMessage: text('error_message'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_notification_log_user').on(table.userId, table.createdAt),
    index('idx_notification_log_type').on(table.notificationType, table.createdAt),
  ]
);

// Relations
export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

export const deviceTokensRelations = relations(deviceTokens, ({ one }) => ({
  user: one(users, {
    fields: [deviceTokens.userId],
    references: [users.id],
  }),
}));

export const notificationLogRelations = relations(notificationLog, ({ one }) => ({
  user: one(users, {
    fields: [notificationLog.userId],
    references: [users.id],
  }),
}));
