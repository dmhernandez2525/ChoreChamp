// Smart Home Hub Integration Schema (F10.1)

import { pgTable, uuid, varchar, text, integer, timestamp, boolean, index, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';

// Smart Home Hubs
export const smartHomeHubs = pgTable(
  'smart_home_hubs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    platform: varchar('platform', { length: 30 }).notNull(), // 'home_assistant', 'smartthings', etc.
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    hostUrl: text('host_url'),
    encryptedCredentials: text('encrypted_credentials'), // Encrypted access tokens, API keys
    status: varchar('status', { length: 20 }).notNull().default('pending'), // 'connected', 'disconnected', 'error', 'pending'
    lastConnectedAt: timestamp('last_connected_at', { withTimezone: true }),
    lastError: text('last_error'),
    capabilities: text('capabilities').array().default([]),
    metadata: jsonb('metadata').default({}),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_smart_home_hubs_household').on(table.householdId),
    index('idx_smart_home_hubs_platform').on(table.platform),
    index('idx_smart_home_hubs_status').on(table.status),
  ]
);

// Smart Devices
export const smartDevices = pgTable(
  'smart_devices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    hubId: uuid('hub_id')
      .notNull()
      .references(() => smartHomeHubs.id, { onDelete: 'cascade' }),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    externalId: varchar('external_id', { length: 255 }).notNull(), // ID in external system
    name: varchar('name', { length: 100 }).notNull(),
    category: varchar('category', { length: 30 }).notNull(), // 'light', 'switch', 'sensor', etc.
    manufacturer: varchar('manufacturer', { length: 100 }),
    model: varchar('model', { length: 100 }),
    location: varchar('location', { length: 100 }), // Room/area
    capabilities: text('capabilities').array().default([]),
    currentState: jsonb('current_state').default({}),
    isOnline: boolean('is_online').default(false),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    choreRelatedZone: varchar('chore_related_zone', { length: 100 }),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_smart_devices_hub').on(table.hubId),
    index('idx_smart_devices_household').on(table.householdId),
    index('idx_smart_devices_category').on(table.category),
    index('idx_smart_devices_location').on(table.location),
    index('idx_smart_devices_zone').on(table.choreRelatedZone),
  ]
);

// Smart Home Automations
export const smartHomeAutomations = pgTable(
  'smart_home_automations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    isEnabled: boolean('is_enabled').default(true),
    trigger: jsonb('trigger').notNull(), // AutomationTrigger JSON
    conditions: jsonb('conditions').default([]), // AutomationCondition[] JSON
    actions: jsonb('actions').notNull(), // AutomationAction[] JSON
    lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
    triggerCount: integer('trigger_count').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_smart_home_automations_household').on(table.householdId),
    index('idx_smart_home_automations_enabled').on(table.isEnabled),
  ]
);

// Automation Execution Logs
export const automationLogs = pgTable(
  'automation_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    automationId: uuid('automation_id')
      .notNull()
      .references(() => smartHomeAutomations.id, { onDelete: 'cascade' }),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    triggeredAt: timestamp('triggered_at', { withTimezone: true }).notNull().defaultNow(),
    triggerData: jsonb('trigger_data').default({}),
    actionsExecuted: jsonb('actions_executed').default([]), // ActionExecutionResult[] JSON
    status: varchar('status', { length: 20 }).notNull(), // 'success', 'partial', 'failed'
    errorMessage: text('error_message'),
  },
  (table) => [
    index('idx_automation_logs_automation').on(table.automationId),
    index('idx_automation_logs_household').on(table.householdId),
    index('idx_automation_logs_triggered').on(table.triggeredAt),
    index('idx_automation_logs_status').on(table.status),
  ]
);

// Chore Zone to Device Mappings
export const choreZoneDevices = pgTable(
  'chore_zone_devices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    zoneName: varchar('zone_name', { length: 100 }).notNull(),
    deviceIds: uuid('device_ids').array().default([]),
    choreCategories: text('chore_categories').array().default([]),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_chore_zone_devices_household').on(table.householdId),
    index('idx_chore_zone_devices_zone').on(table.zoneName),
  ]
);

// Device Activity Log
export const deviceActivityLogs = pgTable(
  'device_activity_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    deviceId: uuid('device_id')
      .notNull()
      .references(() => smartDevices.id, { onDelete: 'cascade' }),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    activityType: varchar('activity_type', { length: 30 }).notNull(), // 'state_change', 'usage', 'motion', 'energy_spike'
    previousState: jsonb('previous_state'),
    newState: jsonb('new_state'),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
    duration: integer('duration'), // ms
    choreId: uuid('chore_id'), // Linked chore if detected
  },
  (table) => [
    index('idx_device_activity_device').on(table.deviceId),
    index('idx_device_activity_household').on(table.householdId),
    index('idx_device_activity_detected').on(table.detectedAt),
    index('idx_device_activity_type').on(table.activityType),
    index('idx_device_activity_chore').on(table.choreId),
  ]
);

// Relations
export const smartHomeHubsRelations = relations(smartHomeHubs, ({ one, many }) => ({
  household: one(households, {
    fields: [smartHomeHubs.householdId],
    references: [households.id],
  }),
  devices: many(smartDevices),
}));

export const smartDevicesRelations = relations(smartDevices, ({ one, many }) => ({
  hub: one(smartHomeHubs, {
    fields: [smartDevices.hubId],
    references: [smartHomeHubs.id],
  }),
  household: one(households, {
    fields: [smartDevices.householdId],
    references: [households.id],
  }),
  activityLogs: many(deviceActivityLogs),
}));

export const smartHomeAutomationsRelations = relations(smartHomeAutomations, ({ one, many }) => ({
  household: one(households, {
    fields: [smartHomeAutomations.householdId],
    references: [households.id],
  }),
  logs: many(automationLogs),
}));

export const automationLogsRelations = relations(automationLogs, ({ one }) => ({
  automation: one(smartHomeAutomations, {
    fields: [automationLogs.automationId],
    references: [smartHomeAutomations.id],
  }),
  household: one(households, {
    fields: [automationLogs.householdId],
    references: [households.id],
  }),
}));

export const choreZoneDevicesRelations = relations(choreZoneDevices, ({ one }) => ({
  household: one(households, {
    fields: [choreZoneDevices.householdId],
    references: [households.id],
  }),
}));

export const deviceActivityLogsRelations = relations(deviceActivityLogs, ({ one }) => ({
  device: one(smartDevices, {
    fields: [deviceActivityLogs.deviceId],
    references: [smartDevices.id],
  }),
  household: one(households, {
    fields: [deviceActivityLogs.householdId],
    references: [households.id],
  }),
}));
