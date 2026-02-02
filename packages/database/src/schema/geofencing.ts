import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  real,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';

/**
 * Geofences - defined location zones
 */
export const geofences = pgTable('geofences', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  type: text('type').notNull(), // GeofenceType
  description: text('description'),

  // Location
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  radiusMeters: real('radius_meters').notNull(),
  address: text('address'),

  // Settings
  isEnabled: boolean('is_enabled').notNull().default(true),
  notifyOnEntry: boolean('notify_on_entry').notNull().default(false),
  notifyOnExit: boolean('notify_on_exit').notNull().default(true),
  dwellTimeMinutes: integer('dwell_time_minutes'),

  // Linked entities
  linkedZoneName: text('linked_zone_name'),
  linkedChoreIds: jsonb('linked_chore_ids').$type<string[]>(),

  // Restrictions
  activeForMemberIds: jsonb('active_for_member_ids').$type<string[]>(),
  activeHoursStart: text('active_hours_start'), // HH:MM
  activeHoursEnd: text('active_hours_end'),
  activeDays: jsonb('active_days').$type<number[]>(), // 0-6

  // Stats
  totalEntries: integer('total_entries').notNull().default(0),
  totalExits: integer('total_exits').notNull().default(0),
  lastTriggeredAt: timestamp('last_triggered_at'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  householdIdx: index('geofences_household_idx').on(table.householdId),
}));

/**
 * Geofence Events - entry/exit/dwell occurrences
 */
export const geofenceEvents = pgTable('geofence_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  geofenceId: uuid('geofence_id')
    .notNull()
    .references(() => geofences.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),

  eventType: text('event_type').notNull(), // 'enter' | 'exit' | 'dwell'
  occurredAt: timestamp('occurred_at').notNull().defaultNow(),

  // Location at event time
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  accuracy: real('accuracy').notNull(),

  // Context
  deviceId: text('device_id'),
  batteryLevel: integer('battery_level'),

  // Actions triggered
  actionsTriggered: jsonb('actions_triggered').$type<Array<{
    type: string;
    result: 'success' | 'failed';
    details?: string;
  }>>().default([]),

  // Notification sent
  notificationSent: boolean('notification_sent').notNull().default(false),
}, (table) => ({
  memberIdx: index('geofence_events_member_idx').on(table.memberId),
  geofenceIdx: index('geofence_events_geofence_idx').on(table.geofenceId),
  timeIdx: index('geofence_events_time_idx').on(table.occurredAt),
}));

/**
 * Member Locations - current location of each member
 */
export const memberLocations = pgTable('member_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' })
    .unique(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  // Current location
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  accuracy: real('accuracy').notNull(),
  altitude: real('altitude'),
  speed: real('speed'),
  heading: real('heading'),

  // Geofence status
  currentGeofenceId: uuid('current_geofence_id').references(() => geofences.id, { onDelete: 'set null' }),
  currentGeofenceName: text('current_geofence_name'),
  enteredCurrentAt: timestamp('entered_current_at'),

  // Status
  isAtHome: boolean('is_at_home').notNull().default(false),
  lastUpdatedAt: timestamp('last_updated_at').notNull().defaultNow(),

  // Device info
  deviceId: text('device_id'),
  batteryLevel: integer('battery_level'),
});

/**
 * Location History - historical location data
 */
export const locationHistory = pgTable('location_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  accuracy: real('accuracy').notNull(),

  // Geofence at this point
  geofenceId: uuid('geofence_id').references(() => geofences.id, { onDelete: 'set null' }),
  geofenceName: text('geofence_name'),

  recordedAt: timestamp('recorded_at').notNull().defaultNow(),
}, (table) => ({
  memberTimeIdx: index('location_history_member_time_idx').on(table.memberId, table.recordedAt),
}));

/**
 * Geofence Automations - rules triggered by geofence events
 */
export const geofenceAutomations = pgTable('geofence_automations', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  description: text('description'),
  isEnabled: boolean('is_enabled').notNull().default(true),

  // Trigger
  geofenceId: uuid('geofence_id')
    .notNull()
    .references(() => geofences.id, { onDelete: 'cascade' }),
  triggerType: text('trigger_type').notNull(), // 'enter' | 'exit' | 'dwell'
  triggerMemberIds: jsonb('trigger_member_ids').$type<string[]>(),

  // Conditions
  requireAllMembers: boolean('require_all_members').notNull().default(false),
  requireMinDwellMinutes: integer('require_min_dwell_minutes'),
  timeConditions: jsonb('time_conditions').$type<{
    startTime: string | null;
    endTime: string | null;
    daysOfWeek: number[] | null;
  }>(),

  // Actions
  actions: jsonb('actions').notNull().$type<Array<{
    type: string;
    config: Record<string, unknown>;
    delay?: number;
  }>>(),

  // Stats
  timesTriggered: integer('times_triggered').notNull().default(0),
  lastTriggeredAt: timestamp('last_triggered_at'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Away Mode Config - settings for members who are away
 */
export const awayModeConfigs = pgTable('away_mode_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' })
    .unique(),

  isActive: boolean('is_active').notNull().default(false),
  activatedAt: timestamp('activated_at'),
  reason: text('reason'),

  // Settings
  pauseChoreDeadlines: boolean('pause_chore_deadlines').notNull().default(true),
  pauseStreakTracking: boolean('pause_streak_tracking').notNull().default(false),
  autoReactivateOnReturn: boolean('auto_reactivate_on_return').notNull().default(true),

  // Scheduled
  scheduledEndAt: timestamp('scheduled_end_at'),
  expectedReturnGeofenceId: uuid('expected_return_geofence_id').references(() => geofences.id, { onDelete: 'set null' }),
});

/**
 * Location Settings - privacy and tracking preferences
 */
export const locationSettings = pgTable('location_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' })
    .unique(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  trackingMode: text('tracking_mode').notNull().default('geofence_only'),
  shareLocationWithHousehold: boolean('share_location_with_household').notNull().default(true),
  allowLocationHistory: boolean('allow_location_history').notNull().default(true),
  historyRetentionDays: integer('history_retention_days').notNull().default(30),

  // Privacy
  blurLocationWhenNotHome: boolean('blur_location_when_not_home').notNull().default(false),
  hideFromSpecificMembers: jsonb('hide_from_specific_members').$type<string[]>(),
});

// Relations
export const geofencesRelations = relations(geofences, ({ one, many }) => ({
  household: one(households, {
    fields: [geofences.householdId],
    references: [households.id],
  }),
  events: many(geofenceEvents),
  automations: many(geofenceAutomations),
  currentMembers: many(memberLocations),
}));

export const geofenceEventsRelations = relations(geofenceEvents, ({ one }) => ({
  geofence: one(geofences, {
    fields: [geofenceEvents.geofenceId],
    references: [geofences.id],
  }),
  household: one(households, {
    fields: [geofenceEvents.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [geofenceEvents.memberId],
    references: [members.id],
  }),
}));

export const memberLocationsRelations = relations(memberLocations, ({ one }) => ({
  member: one(members, {
    fields: [memberLocations.memberId],
    references: [members.id],
  }),
  household: one(households, {
    fields: [memberLocations.householdId],
    references: [households.id],
  }),
  currentGeofence: one(geofences, {
    fields: [memberLocations.currentGeofenceId],
    references: [geofences.id],
  }),
}));

export const locationHistoryRelations = relations(locationHistory, ({ one }) => ({
  member: one(members, {
    fields: [locationHistory.memberId],
    references: [members.id],
  }),
  household: one(households, {
    fields: [locationHistory.householdId],
    references: [households.id],
  }),
  geofence: one(geofences, {
    fields: [locationHistory.geofenceId],
    references: [geofences.id],
  }),
}));

export const geofenceAutomationsRelations = relations(geofenceAutomations, ({ one }) => ({
  household: one(households, {
    fields: [geofenceAutomations.householdId],
    references: [households.id],
  }),
  geofence: one(geofences, {
    fields: [geofenceAutomations.geofenceId],
    references: [geofences.id],
  }),
}));

export const awayModeConfigsRelations = relations(awayModeConfigs, ({ one }) => ({
  household: one(households, {
    fields: [awayModeConfigs.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [awayModeConfigs.memberId],
    references: [members.id],
  }),
  expectedReturnGeofence: one(geofences, {
    fields: [awayModeConfigs.expectedReturnGeofenceId],
    references: [geofences.id],
  }),
}));

export const locationSettingsRelations = relations(locationSettings, ({ one }) => ({
  member: one(members, {
    fields: [locationSettings.memberId],
    references: [members.id],
  }),
  household: one(households, {
    fields: [locationSettings.householdId],
    references: [households.id],
  }),
}));
