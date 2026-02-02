import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import type { RecurrenceType } from '@chorechamp/types';

// Sync metadata table - tracks last sync time and status
export const syncMetadata = sqliteTable('sync_metadata', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tableName: text('table_name').notNull().unique(),
  lastSyncAt: text('last_sync_at'), // ISO timestamp
  syncStatus: text('sync_status').$type<'idle' | 'syncing' | 'error'>().default('idle'),
  errorMessage: text('error_message'),
});

// Offline queue for pending operations
export const offlineQueue = sqliteTable('offline_queue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  operationType: text('operation_type').$type<'create' | 'update' | 'delete' | 'complete'>().notNull(),
  entityType: text('entity_type').$type<'chore' | 'reward' | 'completion' | 'redemption'>().notNull(),
  entityId: text('entity_id').notNull(),
  payload: text('payload').notNull(), // JSON string
  createdAt: text('created_at').notNull(), // ISO timestamp
  retryCount: integer('retry_count').default(0),
  lastRetryAt: text('last_retry_at'),
  errorMessage: text('error_message'),
  status: text('status').$type<'pending' | 'processing' | 'failed' | 'completed'>().default('pending'),
});

// Cached user data
export const cachedUsers = sqliteTable('cached_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  cachedAt: text('cached_at').notNull(),
});

// Cached households
export const cachedHouseholds = sqliteTable('cached_households', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  timezone: text('timezone').default('America/New_York'),
  weekStartsOn: integer('week_starts_on').default(0),
  pointsName: text('points_name').default('points'),
  currency: text('currency').default('USD'),
  totalChoresCompleted: integer('total_chores_completed').default(0),
  currentFamilyStreak: integer('current_family_streak').default(0),
  longestFamilyStreak: integer('longest_family_streak').default(0),
  cachedAt: text('cached_at').notNull(),
  syncVersion: integer('sync_version').default(0),
});

// Cached members
export const cachedMembers = sqliteTable('cached_members', {
  id: text('id').primaryKey(),
  householdId: text('household_id').notNull(),
  userId: text('user_id'),
  name: text('name').notNull(),
  role: text('role').$type<'parent' | 'child' | 'teen' | 'viewer' | 'caregiver'>().notNull(),
  color: text('color'),
  avatarUrl: text('avatar_url'),
  pointsCurrent: integer('points_current').default(0),
  pointsLifetime: integer('points_lifetime').default(0),
  streakCurrent: integer('streak_current').default(0),
  streakLongest: integer('streak_longest').default(0),
  streakLastCompletedDate: text('streak_last_completed_date'),
  streakFreezesAvailable: integer('streak_freezes_available').default(1),
  badges: text('badges'), // JSON array string
  // Caregiver-specific permissions (JSON string)
  caregiverPermissions: text('caregiver_permissions'),
  // Cross-household linking
  linkedMemberId: text('linked_member_id'),
  crossHouseholdSettings: text('cross_household_settings'), // JSON string
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  cachedAt: text('cached_at').notNull(),
  syncVersion: integer('sync_version').default(0),
});

// Cached chores
export const cachedChores = sqliteTable('cached_chores', {
  id: text('id').primaryKey(),
  householdId: text('household_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  icon: text('icon'),
  category: text('category'),
  pointValue: integer('point_value').default(10),
  difficulty: text('difficulty').$type<'easy' | 'medium' | 'hard'>().default('medium'),
  assignedTo: text('assigned_to'), // JSON array string
  assignmentType: text('assignment_type').$type<'specific' | 'anyone' | 'rotation'>().default('anyone'),
  recurrenceType: text('recurrence_type').$type<RecurrenceType>().default('once'),
  recurrenceDays: text('recurrence_days'), // JSON array string
  dueTime: text('due_time'),
  requiresApproval: integer('requires_approval', { mode: 'boolean' }).default(false),
  requiresPhoto: integer('requires_photo', { mode: 'boolean' }).default(false),
  estimatedMinutes: integer('estimated_minutes'),
  showTimer: integer('show_timer', { mode: 'boolean' }).default(false),
  steps: text('steps'), // JSON array string
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  cachedAt: text('cached_at').notNull(),
  syncVersion: integer('sync_version').default(0),
});

// Cached today's chore schedules
export const cachedSchedules = sqliteTable('cached_schedules', {
  id: text('id').primaryKey(),
  choreId: text('chore_id').notNull(),
  householdId: text('household_id').notNull(),
  scheduledDate: text('scheduled_date').notNull(),
  assignedTo: text('assigned_to'),
  isCompleted: integer('is_completed', { mode: 'boolean' }).default(false),
  completionId: text('completion_id'),
  cachedAt: text('cached_at').notNull(),
});

// Cached completions
export const cachedCompletions = sqliteTable('cached_completions', {
  id: text('id').primaryKey(),
  choreId: text('chore_id').notNull(),
  householdId: text('household_id').notNull(),
  memberId: text('member_id').notNull(),
  scheduledDate: text('scheduled_date').notNull(),
  completedAt: text('completed_at'),
  status: text('status').$type<'pending' | 'approved' | 'rejected'>().default('pending'),
  approvedBy: text('approved_by'),
  approvedAt: text('approved_at'),
  rejectionReason: text('rejection_reason'),
  photoUrl: text('photo_url'),
  pointsAwarded: integer('points_awarded'),
  durationSeconds: integer('duration_seconds'),
  cachedAt: text('cached_at').notNull(),
  isLocal: integer('is_local', { mode: 'boolean' }).default(false), // True if created offline
  syncVersion: integer('sync_version').default(0),
});

// Cached rewards
export const cachedRewards = sqliteTable('cached_rewards', {
  id: text('id').primaryKey(),
  householdId: text('household_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  icon: text('icon'),
  type: text('type').$type<'screen_time' | 'money' | 'privilege' | 'activity' | 'custom'>().default('custom'),
  pointCost: integer('point_cost').notNull(),
  quantity: integer('quantity'),
  quantityRemaining: integer('quantity_remaining'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  cachedAt: text('cached_at').notNull(),
  syncVersion: integer('sync_version').default(0),
});

// Cached reward redemptions
export const cachedRedemptions = sqliteTable('cached_redemptions', {
  id: text('id').primaryKey(),
  rewardId: text('reward_id').notNull(),
  householdId: text('household_id').notNull(),
  memberId: text('member_id').notNull(),
  pointsSpent: integer('points_spent').notNull(),
  status: text('status').$type<'pending' | 'approved' | 'fulfilled' | 'rejected'>().default('pending'),
  requestedAt: text('requested_at').notNull(),
  approvedAt: text('approved_at'),
  fulfilledAt: text('fulfilled_at'),
  rejectedAt: text('rejected_at'),
  rejectionReason: text('rejection_reason'),
  cachedAt: text('cached_at').notNull(),
  isLocal: integer('is_local', { mode: 'boolean' }).default(false),
  syncVersion: integer('sync_version').default(0),
});

// Cached gamification stats
export const cachedStats = sqliteTable('cached_stats', {
  id: text('id').primaryKey(), // memberId
  householdId: text('household_id').notNull(),
  totalPoints: integer('total_points').default(0),
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  totalChoresCompleted: integer('total_chores_completed').default(0),
  thisWeekChores: integer('this_week_chores').default(0),
  thisMonthChores: integer('this_month_chores').default(0),
  badgeCount: integer('badge_count').default(0),
  cachedAt: text('cached_at').notNull(),
});

// Point transactions cache (recent only)
export const cachedTransactions = sqliteTable('cached_transactions', {
  id: text('id').primaryKey(),
  householdId: text('household_id').notNull(),
  memberId: text('member_id').notNull(),
  amount: integer('amount').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  transactionType: text('transaction_type').notNull(),
  referenceId: text('reference_id'),
  referenceType: text('reference_type'),
  description: text('description'),
  createdAt: text('created_at').notNull(),
  cachedAt: text('cached_at').notNull(),
});

// Export all table names for sync engine
export const SYNCED_TABLES = [
  'cached_households',
  'cached_members',
  'cached_chores',
  'cached_schedules',
  'cached_completions',
  'cached_rewards',
  'cached_redemptions',
  'cached_stats',
  'cached_transactions',
] as const;

export type SyncedTable = (typeof SYNCED_TABLES)[number];
