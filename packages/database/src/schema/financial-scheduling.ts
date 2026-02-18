import { pgTable, uuid, text, integer, boolean, timestamp, real, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// F19.1 Banking Integration
export const bankingConnections = pgTable('banking_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull(),
  parentMemberId: uuid('parent_member_id').notNull(),
  provider: text('provider').notNull(), // plaid, stripe, manual
  accountName: text('account_name').notNull(),
  accountMask: text('account_mask').notNull(),
  institutionName: text('institution_name').notNull(),
  encryptedAccessToken: text('encrypted_access_token'),
  isActive: boolean('is_active').notNull().default(true),
  lastVerifiedAt: timestamp('last_verified_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('banking_conn_household_idx').on(table.householdId),
]);

export const allowanceDeposits = pgTable('allowance_deposits', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull(),
  memberId: uuid('member_id').notNull(),
  memberName: text('member_name').notNull(),
  bankingConnectionId: uuid('banking_connection_id').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('pending'), // pending, processing, completed, failed, cancelled
  scheduledAt: timestamp('scheduled_at').notNull(),
  processedAt: timestamp('processed_at'),
  failureReason: text('failure_reason'),
  externalTransactionId: text('external_transaction_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('allowance_deposit_household_idx').on(table.householdId),
  index('allowance_deposit_member_idx').on(table.memberId),
  index('allowance_deposit_status_idx').on(table.status),
]);

export const allowanceDepositConfigs = pgTable('allowance_deposit_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull(),
  memberId: uuid('member_id').notNull(),
  bankingConnectionId: uuid('banking_connection_id').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  frequency: text('frequency').notNull(), // weekly, biweekly, monthly, on_demand
  dayOfWeek: integer('day_of_week'),
  dayOfMonth: integer('day_of_month'),
  isActive: boolean('is_active').notNull().default(true),
  nextScheduledAt: timestamp('next_scheduled_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('deposit_config_household_idx').on(table.householdId),
  index('deposit_config_member_idx').on(table.memberId),
]);

// F19.2 Rotation System
export const choreRotations = pgTable('chore_rotations', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull(),
  choreId: uuid('chore_id').notNull(),
  choreName: text('chore_name').notNull(),
  rotationType: text('rotation_type').notNull(), // round_robin, weighted, random, skill_based
  frequency: text('frequency').notNull(), // daily, weekly, biweekly, monthly
  participantIds: jsonb('participant_ids').notNull().$type<string[]>(),
  currentAssigneeId: uuid('current_assignee_id').notNull(),
  nextRotationAt: timestamp('next_rotation_at').notNull(),
  skipWeekends: boolean('skip_weekends').notNull().default(false),
  fairnessScore: real('fairness_score').notNull().default(100),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('rotation_household_idx').on(table.householdId),
  index('rotation_chore_idx').on(table.choreId),
]);

export const rotationHistory = pgTable('rotation_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  rotationId: uuid('rotation_id').notNull(),
  memberId: uuid('member_id').notNull(),
  memberName: text('member_name').notNull(),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  wasSkipped: boolean('was_skipped').notNull().default(false),
  skipReason: text('skip_reason'),
}, (table) => [
  index('rotation_history_rotation_idx').on(table.rotationId),
  index('rotation_history_member_idx').on(table.memberId),
]);

export const choreRotationsRelations = relations(choreRotations, ({ many }) => ({
  history: many(rotationHistory),
}));

export const rotationHistoryRelations = relations(rotationHistory, ({ one }) => ({
  rotation: one(choreRotations, {
    fields: [rotationHistory.rotationId],
    references: [choreRotations.id],
  }),
}));

// F19.3 Chore Chains
export const choreChains = pgTable('chore_chains', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  totalSteps: integer('total_steps').notNull().default(0),
  completedSteps: integer('completed_steps').notNull().default(0),
  status: text('status').notNull().default('pending'), // pending, in_progress, completed, blocked
  bonusPoints: integer('bonus_points').notNull().default(0),
  deadlineAt: timestamp('deadline_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('chain_household_idx').on(table.householdId),
  index('chain_status_idx').on(table.status),
]);

export const choreChainSteps = pgTable('chore_chain_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  chainId: uuid('chain_id').notNull(),
  choreId: uuid('chore_id').notNull(),
  choreName: text('chore_name').notNull(),
  stepOrder: integer('step_order').notNull(),
  dependencyType: text('dependency_type').notNull().default('must_complete_before'),
  dependsOnStepId: uuid('depends_on_step_id'),
  assigneeId: uuid('assignee_id'),
  assigneeName: text('assignee_name'),
  isCompleted: boolean('is_completed').notNull().default(false),
  completedAt: timestamp('completed_at'),
}, (table) => [
  index('chain_step_chain_idx').on(table.chainId),
  index('chain_step_chore_idx').on(table.choreId),
]);

export const choreChainsRelations = relations(choreChains, ({ many }) => ({
  steps: many(choreChainSteps),
}));

export const choreChainStepsRelations = relations(choreChainSteps, ({ one }) => ({
  chain: one(choreChains, {
    fields: [choreChainSteps.chainId],
    references: [choreChains.id],
  }),
}));

// F19.4 Responsibilities vs Jobs
export const responsibilityConfigs = pgTable('responsibility_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull().unique(),
  defaultClassification: text('default_classification').notNull().default('responsibility'),
  responsibilityLabel: text('responsibility_label').notNull().default('Responsibility'),
  jobLabel: text('job_label').notNull().default('Job'),
  showClassificationBadge: boolean('show_classification_badge').notNull().default(true),
  allowMemberToggle: boolean('allow_member_toggle').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const choreClassifications = pgTable('chore_classifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  choreId: uuid('chore_id').notNull(),
  householdId: uuid('household_id').notNull(),
  classification: text('classification').notNull(), // responsibility, job
  reason: text('reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('classification_household_idx').on(table.householdId),
  index('classification_chore_idx').on(table.choreId),
]);

// F19.5 Chore Marketplace
export const marketplaceListings = pgTable('marketplace_listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull(),
  choreId: uuid('chore_id').notNull(),
  choreName: text('chore_name').notNull(),
  listedById: uuid('listed_by_id').notNull(),
  listedByName: text('listed_by_name').notNull(),
  claimedById: uuid('claimed_by_id'),
  claimedByName: text('claimed_by_name'),
  pointBounty: integer('point_bounty').notNull(),
  bonusCondition: text('bonus_condition'),
  bonusPoints: integer('bonus_points').notNull().default(0),
  status: text('status').notNull().default('open'), // open, claimed, completed, expired, cancelled
  expiresAt: timestamp('expires_at').notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('listing_household_idx').on(table.householdId),
  index('listing_status_idx').on(table.status),
  index('listing_chore_idx').on(table.choreId),
]);

export const marketplaceConfigs = pgTable('marketplace_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull().unique(),
  isEnabled: boolean('is_enabled').notNull().default(true),
  maxBountyPoints: integer('max_bounty_points').notNull().default(500),
  minBountyPoints: integer('min_bounty_points').notNull().default(5),
  defaultExpirationHours: integer('default_expiration_hours').notNull().default(48),
  requireParentApproval: boolean('require_parent_approval').notNull().default(true),
  allowSelfListing: boolean('allow_self_listing').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
