import { pgTable, uuid, varchar, integer, timestamp, boolean, text, index, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { members } from './members';
import { households } from './households';

// Advanced Reports table
export const advancedReports = pgTable(
  'advanced_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),

    reportType: varchar('report_type', { length: 32 }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    config: jsonb('config').notNull(),
    schedule: varchar('schedule', { length: 32 }),
    lastGeneratedAt: timestamp('last_generated_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_advanced_reports_household').on(table.householdId),
    index('idx_advanced_reports_created_by').on(table.createdById),
    index('idx_advanced_reports_type').on(table.reportType),
  ]
);

// Generated Reports table
export const generatedReports = pgTable(
  'generated_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reportId: uuid('report_id')
      .notNull()
      .references(() => advancedReports.id, { onDelete: 'cascade' }),

    format: varchar('format', { length: 16 }).notNull(),
    fileUrl: text('file_url'),
    fileSize: integer('file_size').notNull().default(0),
    generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_generated_reports_report').on(table.reportId),
    index('idx_generated_reports_generated_at').on(table.generatedAt),
  ]
);

// Data Exports table
export const dataExports = pgTable(
  'data_exports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    requestedById: uuid('requested_by_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),

    scope: jsonb('scope').notNull(),
    format: varchar('format', { length: 16 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('pending'),
    fileUrl: text('file_url'),
    fileSize: integer('file_size'),
    includeAttachments: boolean('include_attachments').notNull().default(false),
    requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    error: text('error'),
  },
  (table) => [
    index('idx_data_exports_household').on(table.householdId),
    index('idx_data_exports_requested_by').on(table.requestedById),
    index('idx_data_exports_status').on(table.status),
  ]
);

// Audit Logs table
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),

    actorName: varchar('actor_name', { length: 200 }).notNull(),
    action: varchar('action', { length: 64 }).notNull(),
    resourceType: varchar('resource_type', { length: 64 }).notNull(),
    resourceId: uuid('resource_id'),
    description: text('description').notNull(),
    metadata: jsonb('metadata').notNull().default('{}'),
    ipAddress: varchar('ip_address', { length: 64 }),
    userAgent: text('user_agent'),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_audit_logs_household').on(table.householdId),
    index('idx_audit_logs_actor').on(table.actorId),
    index('idx_audit_logs_action').on(table.action),
    index('idx_audit_logs_timestamp').on(table.timestamp),
    index('idx_audit_logs_resource_type').on(table.resourceType),
  ]
);

// Performance Metrics table
export const performanceMetrics = pgTable(
  'performance_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),

    period: varchar('period', { length: 32 }).notNull(),
    apiResponseTimeP50: integer('api_response_time_p50').notNull().default(0),
    apiResponseTimeP95: integer('api_response_time_p95').notNull().default(0),
    apiResponseTimeP99: integer('api_response_time_p99').notNull().default(0),
    errorRate: integer('error_rate').notNull().default(0),
    requestsPerMinute: integer('requests_per_minute').notNull().default(0),
    activeUsers: integer('active_users').notNull().default(0),
    peakConcurrentUsers: integer('peak_concurrent_users').notNull().default(0),
    databaseQueryTimeAvg: integer('database_query_time_avg').notNull().default(0),
    cacheHitRate: integer('cache_hit_rate').notNull().default(0),
    uptimePercentage: integer('uptime_percentage').notNull().default(100),
    measuredAt: timestamp('measured_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_performance_metrics_household').on(table.householdId),
    index('idx_performance_metrics_period').on(table.period),
    index('idx_performance_metrics_measured_at').on(table.measuredAt),
  ]
);

// Relations
export const advancedReportsRelations = relations(advancedReports, ({ one, many }) => ({
  household: one(households, {
    fields: [advancedReports.householdId],
    references: [households.id],
  }),
  createdBy: one(members, {
    fields: [advancedReports.createdById],
    references: [members.id],
  }),
  generatedReports: many(generatedReports),
}));

export const generatedReportsRelations = relations(generatedReports, ({ one }) => ({
  report: one(advancedReports, {
    fields: [generatedReports.reportId],
    references: [advancedReports.id],
  }),
}));

export const dataExportsRelations = relations(dataExports, ({ one }) => ({
  household: one(households, {
    fields: [dataExports.householdId],
    references: [households.id],
  }),
  requestedBy: one(members, {
    fields: [dataExports.requestedById],
    references: [members.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  household: one(households, {
    fields: [auditLogs.householdId],
    references: [households.id],
  }),
  actor: one(members, {
    fields: [auditLogs.actorId],
    references: [members.id],
  }),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  household: one(households, {
    fields: [performanceMetrics.householdId],
    references: [households.id],
  }),
}));
