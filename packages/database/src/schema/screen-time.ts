import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  date,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';
import { chores } from './chores';

/**
 * Tracked Devices - devices with screen time monitoring
 */
export const trackedDevices = pgTable('tracked_devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  type: text('type').notNull(), // DeviceType
  platform: text('platform').notNull(), // ScreenTimePlatform
  platformDeviceId: text('platform_device_id'),

  // Status
  isActive: boolean('is_active').notNull().default(true),
  isConnected: boolean('is_connected').notNull().default(false),
  lastSyncAt: timestamp('last_sync_at'),

  // Icon
  iconUrl: text('icon_url'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  memberIdx: index('tracked_devices_member_idx').on(table.memberId),
}));

/**
 * Screen Time Limits - daily limits per member
 */
export const screenTimeLimits = pgTable('screen_time_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' })
    .unique(),

  // Daily limits
  dailyLimitMinutes: integer('daily_limit_minutes').notNull().default(120),
  weekendLimitMinutes: integer('weekend_limit_minutes'),

  // Time windows
  allowedStartTime: text('allowed_start_time'), // HH:MM
  allowedEndTime: text('allowed_end_time'),
  bedtimeStart: text('bedtime_start'),
  bedtimeEnd: text('bedtime_end'),

  // Day-specific limits
  dayLimits: jsonb('day_limits').$type<Array<{
    day: number;
    limitMinutes: number;
    startTime: string | null;
    endTime: string | null;
  }>>(),

  // App/category limits
  appLimits: jsonb('app_limits').$type<Array<{
    appId: string | null;
    appName: string;
    categoryId: string | null;
    categoryName: string | null;
    limitMinutes: number;
  }>>(),

  // Settings
  allowExtensions: boolean('allow_extensions').notNull().default(true),
  pauseOnSchoolDays: boolean('pause_on_school_days').notNull().default(false),
  requireChoreCompletion: boolean('require_chore_completion').notNull().default(false),

  isEnabled: boolean('is_enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Screen Time Usage - daily usage records
 */
export const screenTimeUsage = pgTable('screen_time_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),

  // Usage
  totalMinutesUsed: integer('total_minutes_used').notNull().default(0),
  limitMinutes: integer('limit_minutes').notNull(),
  bonusMinutesEarned: integer('bonus_minutes_earned').notNull().default(0),
  bonusMinutesUsed: integer('bonus_minutes_used').notNull().default(0),

  // By device
  deviceUsage: jsonb('device_usage').$type<Array<{
    deviceId: string;
    deviceName: string;
    minutesUsed: number;
  }>>().default([]),

  // By app
  appUsage: jsonb('app_usage').$type<Array<{
    appId: string | null;
    appName: string;
    categoryName: string | null;
    minutesUsed: number;
  }>>().default([]),

  // Status
  limitReached: boolean('limit_reached').notNull().default(false),
  limitExtended: boolean('limit_extended').notNull().default(false),

  lastUpdatedAt: timestamp('last_updated_at').notNull().defaultNow(),
}, (table) => ({
  memberDateIdx: index('screen_time_usage_member_date_idx').on(table.memberId, table.date),
}));

/**
 * Screen Time Rewards - earned screen time bonuses
 */
export const screenTimeRewards = pgTable('screen_time_rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  rewardType: text('reward_type').notNull(), // ScreenTimeRewardType
  minutesAmount: integer('minutes_amount'),
  description: text('description').notNull(),

  // Source
  earnedFrom: text('earned_from').notNull(), // chore_completion, bonus_chore, etc.
  sourceId: uuid('source_id'),
  sourceName: text('source_name'),

  // Status
  isUsed: boolean('is_used').notNull().default(false),
  usedAt: timestamp('used_at'),
  expiresAt: timestamp('expires_at'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  memberIdx: index('screen_time_rewards_member_idx').on(table.memberId, table.isUsed),
}));

/**
 * Screen Time Extension Requests
 */
export const screenTimeExtensionRequests = pgTable('screen_time_extension_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  requestedMinutes: integer('requested_minutes').notNull(),
  reason: text('reason'),
  requestedAt: timestamp('requested_at').notNull().defaultNow(),

  // Response
  status: text('status').notNull().default('pending'), // pending, approved, denied
  respondedBy: uuid('responded_by').references(() => members.id, { onDelete: 'set null' }),
  respondedAt: timestamp('responded_at'),
  responseNote: text('response_note'),

  // If approved
  grantedMinutes: integer('granted_minutes'),
});

/**
 * Chore Screen Time Rewards - mapping chores to screen time bonuses
 */
export const choreScreenTimeRewards = pgTable('chore_screen_time_rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  choreId: uuid('chore_id').references(() => chores.id, { onDelete: 'cascade' }),
  choreName: text('chore_name'),
  choreCategory: text('chore_category'),

  // Reward configuration
  rewardType: text('reward_type').notNull(),
  minutesAmount: integer('minutes_amount').notNull(),

  // Conditions
  requirePerfectCompletion: boolean('require_perfect_completion').notNull().default(false),
  requirePhotoProof: boolean('require_photo_proof').notNull().default(false),
  onlyOnWeekdays: boolean('only_on_weekdays').notNull().default(false),

  // Limits
  maxPerDay: integer('max_per_day'),
  maxPerWeek: integer('max_per_week'),

  isEnabled: boolean('is_enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Device Access Schedules
 */
export const deviceAccessSchedules = pgTable('device_access_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  deviceId: uuid('device_id').references(() => trackedDevices.id, { onDelete: 'cascade' }),

  // Schedule
  dayOfWeek: integer('day_of_week').notNull(), // 0-6
  startTime: text('start_time').notNull(), // HH:MM
  endTime: text('end_time').notNull(),

  // Conditions
  requireDailyChores: boolean('require_daily_chores').notNull().default(false),
  requiredChoreIds: jsonb('required_chore_ids').$type<string[]>(),

  isEnabled: boolean('is_enabled').notNull().default(true),
});

// Relations
export const trackedDevicesRelations = relations(trackedDevices, ({ one, many }) => ({
  household: one(households, {
    fields: [trackedDevices.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [trackedDevices.memberId],
    references: [members.id],
  }),
  schedules: many(deviceAccessSchedules),
}));

export const screenTimeLimitsRelations = relations(screenTimeLimits, ({ one }) => ({
  household: one(households, {
    fields: [screenTimeLimits.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [screenTimeLimits.memberId],
    references: [members.id],
  }),
}));

export const screenTimeUsageRelations = relations(screenTimeUsage, ({ one }) => ({
  household: one(households, {
    fields: [screenTimeUsage.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [screenTimeUsage.memberId],
    references: [members.id],
  }),
}));

export const screenTimeRewardsRelations = relations(screenTimeRewards, ({ one }) => ({
  household: one(households, {
    fields: [screenTimeRewards.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [screenTimeRewards.memberId],
    references: [members.id],
  }),
}));

export const screenTimeExtensionRequestsRelations = relations(
  screenTimeExtensionRequests,
  ({ one }) => ({
    household: one(households, {
      fields: [screenTimeExtensionRequests.householdId],
      references: [households.id],
    }),
    member: one(members, {
      fields: [screenTimeExtensionRequests.memberId],
      references: [members.id],
    }),
    responder: one(members, {
      fields: [screenTimeExtensionRequests.respondedBy],
      references: [members.id],
    }),
  })
);

export const choreScreenTimeRewardsRelations = relations(choreScreenTimeRewards, ({ one }) => ({
  household: one(households, {
    fields: [choreScreenTimeRewards.householdId],
    references: [households.id],
  }),
  chore: one(chores, {
    fields: [choreScreenTimeRewards.choreId],
    references: [chores.id],
  }),
}));

export const deviceAccessSchedulesRelations = relations(deviceAccessSchedules, ({ one }) => ({
  household: one(households, {
    fields: [deviceAccessSchedules.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [deviceAccessSchedules.memberId],
    references: [members.id],
  }),
  device: one(trackedDevices, {
    fields: [deviceAccessSchedules.deviceId],
    references: [trackedDevices.id],
  }),
}));
