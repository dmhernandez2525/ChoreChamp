import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  boolean,
  jsonb,
  real,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// F17.1 Smart Scheduling
export const smartScheduleConfigs = pgTable(
  'smart_schedule_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: text('household_id').notNull(),
    strategy: text('strategy').notNull().default('balanced'),
    maxChoresPerMemberPerDay: integer('max_chores_per_member_per_day').notNull().default(5),
    respectAvailability: boolean('respect_availability').notNull().default(true),
    balanceWorkload: boolean('balance_workload').notNull().default(true),
    considerPreferences: boolean('consider_preferences').notNull().default(true),
    avoidBackToBack: boolean('avoid_back_to_back').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('smart_schedule_configs_household_idx').on(table.householdId)]
);

export const scheduleOptimizations = pgTable(
  'schedule_optimizations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: text('household_id').notNull(),
    strategy: text('strategy').notNull(),
    originalScore: real('original_score').notNull(),
    optimizedScore: real('optimized_score').notNull(),
    improvementPercent: real('improvement_percent').notNull(),
    conflicts: jsonb('conflicts').notNull().default('[]'),
    suggestions: jsonb('suggestions').notNull().default('[]'),
    generatedAt: timestamp('generated_at').notNull().defaultNow(),
  },
  (table) => [index('schedule_optimizations_household_idx').on(table.householdId)]
);

// F17.2 AI Chore Suggestions
export const aiChoreSuggestions = pgTable(
  'ai_chore_suggestions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: text('household_id').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    source: text('source').notNull(),
    priority: text('priority').notNull().default('medium'),
    suggestedMemberId: text('suggested_member_id'),
    suggestedFrequency: text('suggested_frequency'),
    suggestedPoints: integer('suggested_points').notNull().default(10),
    confidence: real('confidence').notNull(),
    reasoning: text('reasoning').notNull(),
    isAccepted: boolean('is_accepted'),
    dismissedAt: timestamp('dismissed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('ai_chore_suggestions_household_idx').on(table.householdId),
    index('ai_chore_suggestions_source_idx').on(table.source),
  ]
);

export const suggestionPreferences = pgTable(
  'suggestion_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: text('household_id').notNull(),
    enableSuggestions: boolean('enable_suggestions').notNull().default(true),
    sources: jsonb('sources').notNull().default('[]'),
    maxSuggestionsPerWeek: integer('max_suggestions_per_week').notNull().default(10),
    minConfidence: real('min_confidence').notNull().default(0.7),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('suggestion_preferences_household_idx').on(table.householdId)]
);

// F17.3 Automation Rules
export const automationRules = pgTable(
  'automation_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: text('household_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    trigger: jsonb('trigger').notNull(),
    actions: jsonb('actions').notNull().default('[]'),
    status: text('status').notNull().default('active'),
    executionCount: integer('execution_count').notNull().default(0),
    lastExecutedAt: timestamp('last_executed_at'),
    createdById: text('created_by_id').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('automation_rules_household_idx').on(table.householdId),
    index('automation_rules_status_idx').on(table.status),
  ]
);

export const automationExecutionLogs = pgTable(
  'automation_execution_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ruleId: text('rule_id').notNull(),
    triggeredAt: timestamp('triggered_at').notNull().defaultNow(),
    triggerData: jsonb('trigger_data').notNull().default('{}'),
    actionsExecuted: jsonb('actions_executed').notNull().default('[]'),
    success: boolean('success').notNull(),
    duration: integer('duration').notNull(),
  },
  (table) => [
    index('automation_execution_logs_rule_idx').on(table.ruleId),
    index('automation_execution_logs_triggered_idx').on(table.triggeredAt),
  ]
);

// F17.4 Predictive Analytics
export const predictions = pgTable(
  'predictions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: text('household_id').notNull(),
    type: text('type').notNull(),
    timeframe: text('timeframe').notNull(),
    memberId: text('member_id'),
    prediction: jsonb('prediction').notNull().default('{}'),
    confidence: real('confidence').notNull(),
    factors: jsonb('factors').notNull().default('[]'),
    generatedAt: timestamp('generated_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => [
    index('predictions_household_idx').on(table.householdId),
    index('predictions_type_idx').on(table.type),
    index('predictions_member_idx').on(table.memberId),
  ]
);

export const predictiveInsights = pgTable(
  'predictive_insights',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: text('household_id').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(),
    severity: text('severity').notNull().default('info'),
    actionable: boolean('actionable').notNull().default(false),
    suggestedAction: text('suggested_action'),
    memberId: text('member_id'),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('predictive_insights_household_idx').on(table.householdId),
    index('predictive_insights_severity_idx').on(table.severity),
  ]
);

export const predictiveAnalyticsConfigs = pgTable(
  'predictive_analytics_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: text('household_id').notNull(),
    enablePredictions: boolean('enable_predictions').notNull().default(true),
    enabledTypes: jsonb('enabled_types').notNull().default('[]'),
    notifyOnCritical: boolean('notify_on_critical').notNull().default(true),
    dataRetentionDays: integer('data_retention_days').notNull().default(90),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('predictive_analytics_configs_household_idx').on(table.householdId)]
);

// F17.5 Natural Language Commands
export const naturalLanguageCommands = pgTable(
  'natural_language_commands',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: text('household_id').notNull(),
    memberId: text('member_id').notNull(),
    input: text('input').notNull(),
    parsedIntent: text('parsed_intent').notNull(),
    parsedEntities: jsonb('parsed_entities').notNull().default('{}'),
    category: text('category').notNull(),
    status: text('status').notNull().default('pending'),
    result: jsonb('result'),
    error: text('error'),
    confidence: real('confidence').notNull(),
    processingTime: integer('processing_time').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('natural_language_commands_household_idx').on(table.householdId),
    index('natural_language_commands_member_idx').on(table.memberId),
    index('natural_language_commands_category_idx').on(table.category),
  ]
);

// Relations
export const automationRulesRelations = relations(automationRules, ({ many }) => ({
  executionLogs: many(automationExecutionLogs),
}));

export const automationExecutionLogsRelations = relations(automationExecutionLogs, ({ one }) => ({
  rule: one(automationRules, {
    fields: [automationExecutionLogs.ruleId],
    references: [automationRules.id],
  }),
}));
