import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  real,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';
import { chores } from './chores';

/**
 * QR Codes - codes that can be scanned for verification
 */
export const qrCodes = pgTable('qr_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  type: text('type').notNull(), // QRCodeType
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').notNull().default('active'), // QRCodeStatus

  // Code data
  codeData: text('code_data').notNull().unique(),
  codeUrl: text('code_url').notNull(),

  // Location
  locationName: text('location_name'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  radiusMeters: real('radius_meters'),

  // Linked entities
  linkedChoreId: uuid('linked_chore_id').references(() => chores.id, { onDelete: 'set null' }),
  linkedZoneName: text('linked_zone_name'),

  // Verification settings
  verificationRequirement: text('verification_requirement').notNull().default('scan_only'),
  requiresPhoto: boolean('requires_photo').notNull().default(false),
  expiresAt: timestamp('expires_at'),

  // Checkpoint settings
  checkpointOrder: integer('checkpoint_order'),
  checkpointGroupId: text('checkpoint_group_id'),

  // Stats
  totalScans: integer('total_scans').notNull().default(0),
  lastScannedAt: timestamp('last_scanned_at'),
  lastScannedBy: uuid('last_scanned_by').references(() => members.id, { onDelete: 'set null' }),

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => members.id, { onDelete: 'set null' }),
}, (table) => ({
  codeDataIdx: uniqueIndex('qr_codes_code_data_idx').on(table.codeData),
  householdIdx: uniqueIndex('qr_codes_household_idx').on(table.householdId, table.status),
}));

/**
 * QR Code Scans - record of all scan attempts
 */
export const qrCodeScans = pgTable('qr_code_scans', {
  id: uuid('id').primaryKey().defaultRandom(),
  qrCodeId: uuid('qr_code_id')
    .notNull()
    .references(() => qrCodes.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),

  // Scan details
  scannedAt: timestamp('scanned_at').notNull().defaultNow(),
  scanLocation: jsonb('scan_location').$type<{
    latitude: number;
    longitude: number;
    accuracy: number;
  }>(),

  // Verification result
  verificationStatus: text('verification_status').notNull(), // 'success' | 'failed' | 'pending'
  failureReason: text('failure_reason'),

  // Photo proof
  photoUrl: text('photo_url'),
  photoVerified: boolean('photo_verified'),

  // GPS verification
  gpsVerified: boolean('gps_verified'),
  gpsDistanceMeters: real('gps_distance_meters'),

  // Linked completion
  choreCompletionId: uuid('chore_completion_id'),

  // Points awarded
  bonusPointsAwarded: integer('bonus_points_awarded').notNull().default(0),

  // Device info
  deviceInfo: jsonb('device_info').$type<{
    platform: string;
    deviceModel: string;
    appVersion: string;
  }>(),
});

/**
 * Checkpoint Progress - tracks progress through sequential checkpoints
 */
export const checkpointProgress = pgTable('checkpoint_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  checkpointGroupId: text('checkpoint_group_id').notNull(),
  choreId: uuid('chore_id').references(() => chores.id, { onDelete: 'set null' }),

  // Progress
  totalCheckpoints: integer('total_checkpoints').notNull(),
  completedCheckpoints: integer('completed_checkpoints').notNull().default(0),
  completedCheckpointIds: jsonb('completed_checkpoint_ids').$type<string[]>().default([]),

  // Status
  status: text('status').notNull().default('in_progress'),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at'),

  // Points
  bonusPointsAwarded: integer('bonus_points_awarded').notNull().default(0),
});

/**
 * Equipment Checkouts - track equipment borrowed and returned
 */
export const equipmentCheckouts = pgTable('equipment_checkouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  qrCodeId: uuid('qr_code_id')
    .notNull()
    .references(() => qrCodes.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),

  // Equipment details
  equipmentName: text('equipment_name').notNull(),
  checkedOutAt: timestamp('checked_out_at').notNull().defaultNow(),
  checkedInAt: timestamp('checked_in_at'),

  // Status
  status: text('status').notNull().default('checked_out'),
  dueAt: timestamp('due_at'),

  // Notes
  checkoutNotes: text('checkout_notes'),
  checkinNotes: text('checkin_notes'),
  conditionOnCheckout: text('condition_on_checkout').notNull().default('good'),
  conditionOnCheckin: text('condition_on_checkin'),
});

// Relations
export const qrCodesRelations = relations(qrCodes, ({ one, many }) => ({
  household: one(households, {
    fields: [qrCodes.householdId],
    references: [households.id],
  }),
  linkedChore: one(chores, {
    fields: [qrCodes.linkedChoreId],
    references: [chores.id],
  }),
  lastScanner: one(members, {
    fields: [qrCodes.lastScannedBy],
    references: [members.id],
    relationName: 'lastScanner',
  }),
  creator: one(members, {
    fields: [qrCodes.createdBy],
    references: [members.id],
    relationName: 'creator',
  }),
  scans: many(qrCodeScans),
  checkouts: many(equipmentCheckouts),
}));

export const qrCodeScansRelations = relations(qrCodeScans, ({ one }) => ({
  qrCode: one(qrCodes, {
    fields: [qrCodeScans.qrCodeId],
    references: [qrCodes.id],
  }),
  household: one(households, {
    fields: [qrCodeScans.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [qrCodeScans.memberId],
    references: [members.id],
  }),
}));

export const checkpointProgressRelations = relations(checkpointProgress, ({ one }) => ({
  member: one(members, {
    fields: [checkpointProgress.memberId],
    references: [members.id],
  }),
  household: one(households, {
    fields: [checkpointProgress.householdId],
    references: [households.id],
  }),
  chore: one(chores, {
    fields: [checkpointProgress.choreId],
    references: [chores.id],
  }),
}));

export const equipmentCheckoutsRelations = relations(equipmentCheckouts, ({ one }) => ({
  qrCode: one(qrCodes, {
    fields: [equipmentCheckouts.qrCodeId],
    references: [qrCodes.id],
  }),
  household: one(households, {
    fields: [equipmentCheckouts.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [equipmentCheckouts.memberId],
    references: [members.id],
  }),
}));
