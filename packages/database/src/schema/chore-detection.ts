import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  real,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { smartDevices } from './smart-home';
import { members } from './members';

/**
 * Detection rules - configure how sensors detect chore completion/needs
 */
export const detectionRules = pgTable('detection_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  description: text('description'),
  isEnabled: boolean('is_enabled').notNull().default(true),

  // Sensor configuration
  deviceId: uuid('device_id')
    .notNull()
    .references(() => smartDevices.id, { onDelete: 'cascade' }),
  sensorType: text('sensor_type').notNull(), // DetectionSensorType
  conditions: jsonb('conditions').notNull().$type<Array<{
    sensorAttribute: string;
    operator: string;
    value: string | number | boolean;
    duration?: number;
  }>>(),
  conditionLogic: text('condition_logic').notNull().default('all'), // 'all' | 'any'

  // Chore configuration
  choreType: text('chore_type').notNull(), // DetectableChoreType
  linkedChoreId: uuid('linked_chore_id'), // Reference to chore template
  zoneName: text('zone_name'),

  // Detection behavior
  detectionMode: text('detection_mode').notNull(), // 'completion' | 'needed' | 'both'

  // Completion detection settings
  completionConfidence: integer('completion_confidence').notNull().default(80),
  requireManualConfirm: boolean('require_manual_confirm').notNull().default(false),
  cooldownMinutes: integer('cooldown_minutes').notNull().default(60),

  // Need detection settings
  needThreshold: real('need_threshold'),
  needCheckInterval: integer('need_check_interval'), // minutes

  // Rewards
  bonusPointsOnAutoDetect: integer('bonus_points_on_auto_detect').notNull().default(5),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Detection events - log of all detection occurrences
 */
export const detectionEvents = pgTable('detection_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  ruleId: uuid('rule_id')
    .notNull()
    .references(() => detectionRules.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  deviceId: uuid('device_id')
    .notNull()
    .references(() => smartDevices.id, { onDelete: 'cascade' }),

  eventType: text('event_type').notNull(), // 'completion_detected' | 'need_detected' | 'false_positive'
  choreType: text('chore_type').notNull(),
  zoneName: text('zone_name'),

  // Sensor data at time of detection
  sensorData: jsonb('sensor_data').notNull().$type<Record<string, unknown>>(),
  confidence: integer('confidence').notNull(), // 0-100

  // Outcome
  wasConfirmed: boolean('was_confirmed'),
  confirmedBy: uuid('confirmed_by').references(() => members.id, { onDelete: 'set null' }),
  linkedChoreCompletionId: uuid('linked_chore_completion_id'),
  feedbackNote: text('feedback_note'),

  // Points awarded
  pointsAwarded: integer('points_awarded').notNull().default(0),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  processedAt: timestamp('processed_at'),
});

/**
 * Cleanliness metrics - track zone cleanliness over time
 */
export const cleanlinessMetrics = pgTable('cleanliness_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  zoneName: text('zone_name').notNull(),

  // Current metrics
  overallScore: integer('overall_score').notNull().default(100), // 0-100
  dustLevel: real('dust_level'), // 0-100
  humidityLevel: real('humidity_level'), // Percentage
  lastMotionAt: timestamp('last_motion_at'),
  lastCleanedAt: timestamp('last_cleaned_at'),

  // Calculated needs
  suggestedChores: jsonb('suggested_chores').$type<Array<{
    choreType: string;
    urgency: 'low' | 'medium' | 'high';
    reason: string;
  }>>().default([]),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Sensor readings - historical sensor data for pattern analysis
 */
export const sensorReadings = pgTable('sensor_readings', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: uuid('device_id')
    .notNull()
    .references(() => smartDevices.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  sensorType: text('sensor_type').notNull(),
  attribute: text('attribute').notNull(),
  valueNumeric: real('value_numeric'),
  valueText: text('value_text'),
  valueBoolean: boolean('value_boolean'),
  unit: text('unit'),

  recordedAt: timestamp('recorded_at').notNull().defaultNow(),
});

/**
 * Detection patterns - learned patterns from historical data
 */
export const detectionPatterns = pgTable('detection_patterns', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  choreType: text('chore_type').notNull(),
  zoneName: text('zone_name').notNull(),

  // Learned patterns
  typicalDuration: integer('typical_duration'), // seconds
  typicalTimeOfDay: text('typical_time_of_day'),
  typicalDayOfWeek: jsonb('typical_day_of_week').$type<number[]>(),
  typicalMemberId: uuid('typical_member_id').references(() => members.id, { onDelete: 'set null' }),

  // Detection accuracy
  totalDetections: integer('total_detections').notNull().default(0),
  confirmedDetections: integer('confirmed_detections').notNull().default(0),
  falsePositives: integer('false_positives').notNull().default(0),
  accuracyRate: real('accuracy_rate').notNull().default(0),

  // Sensor signatures
  sensorSignatures: jsonb('sensor_signatures').$type<Array<{
    deviceId: string;
    attribute: string;
    expectedPattern: string;
    weight: number;
  }>>().default([]),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations
export const detectionRulesRelations = relations(detectionRules, ({ one, many }) => ({
  household: one(households, {
    fields: [detectionRules.householdId],
    references: [households.id],
  }),
  device: one(smartDevices, {
    fields: [detectionRules.deviceId],
    references: [smartDevices.id],
  }),
  events: many(detectionEvents),
}));

export const detectionEventsRelations = relations(detectionEvents, ({ one }) => ({
  rule: one(detectionRules, {
    fields: [detectionEvents.ruleId],
    references: [detectionRules.id],
  }),
  household: one(households, {
    fields: [detectionEvents.householdId],
    references: [households.id],
  }),
  device: one(smartDevices, {
    fields: [detectionEvents.deviceId],
    references: [smartDevices.id],
  }),
  confirmer: one(members, {
    fields: [detectionEvents.confirmedBy],
    references: [members.id],
  }),
}));

export const cleanlinessMetricsRelations = relations(cleanlinessMetrics, ({ one }) => ({
  household: one(households, {
    fields: [cleanlinessMetrics.householdId],
    references: [households.id],
  }),
}));

export const sensorReadingsRelations = relations(sensorReadings, ({ one }) => ({
  device: one(smartDevices, {
    fields: [sensorReadings.deviceId],
    references: [smartDevices.id],
  }),
  household: one(households, {
    fields: [sensorReadings.householdId],
    references: [households.id],
  }),
}));

export const detectionPatternsRelations = relations(detectionPatterns, ({ one }) => ({
  household: one(households, {
    fields: [detectionPatterns.householdId],
    references: [households.id],
  }),
  typicalMember: one(members, {
    fields: [detectionPatterns.typicalMemberId],
    references: [members.id],
  }),
}));
