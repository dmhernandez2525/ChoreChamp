import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

// Open the SQLite database
const expo = openDatabaseSync('chorechamp.db', { enableChangeListener: true });

// Create the drizzle instance
export const db = drizzle(expo, { schema });

// Initialize database tables
export async function initializeDatabase(): Promise<void> {
  // Create sync_metadata table
  await expo.execAsync(`
    CREATE TABLE IF NOT EXISTS sync_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL UNIQUE,
      last_sync_at TEXT,
      sync_status TEXT DEFAULT 'idle',
      error_message TEXT
    )
  `);

  // Create offline_queue table
  await expo.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      retry_count INTEGER DEFAULT 0,
      last_retry_at TEXT,
      error_message TEXT,
      status TEXT DEFAULT 'pending'
    )
  `);

  // Create cached_users table
  await expo.execAsync(`
    CREATE TABLE IF NOT EXISTS cached_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT,
      avatar_url TEXT,
      cached_at TEXT NOT NULL
    )
  `);

  // Create cached_households table
  await expo.execAsync(`
    CREATE TABLE IF NOT EXISTS cached_households (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      timezone TEXT DEFAULT 'America/New_York',
      week_starts_on INTEGER DEFAULT 0,
      points_name TEXT DEFAULT 'points',
      currency TEXT DEFAULT 'USD',
      total_chores_completed INTEGER DEFAULT 0,
      current_family_streak INTEGER DEFAULT 0,
      longest_family_streak INTEGER DEFAULT 0,
      cached_at TEXT NOT NULL,
      sync_version INTEGER DEFAULT 0
    )
  `);

  // Create cached_members table
  await expo.execAsync(`
    CREATE TABLE IF NOT EXISTS cached_members (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL,
      user_id TEXT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      color TEXT,
      avatar_url TEXT,
      points_current INTEGER DEFAULT 0,
      points_lifetime INTEGER DEFAULT 0,
      streak_current INTEGER DEFAULT 0,
      streak_longest INTEGER DEFAULT 0,
      streak_last_completed_date TEXT,
      streak_freezes_available INTEGER DEFAULT 1,
      badges TEXT,
      is_active INTEGER DEFAULT 1,
      cached_at TEXT NOT NULL,
      sync_version INTEGER DEFAULT 0
    )
  `);

  // Create cached_chores table
  await expo.execAsync(`
    CREATE TABLE IF NOT EXISTS cached_chores (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      category TEXT,
      point_value INTEGER DEFAULT 10,
      difficulty TEXT DEFAULT 'medium',
      assigned_to TEXT,
      assignment_type TEXT DEFAULT 'anyone',
      recurrence_type TEXT DEFAULT 'once',
      recurrence_days TEXT,
      due_time TEXT,
      requires_approval INTEGER DEFAULT 0,
      requires_photo INTEGER DEFAULT 0,
      estimated_minutes INTEGER,
      show_timer INTEGER DEFAULT 0,
      steps TEXT,
      is_active INTEGER DEFAULT 1,
      cached_at TEXT NOT NULL,
      sync_version INTEGER DEFAULT 0
    )
  `);

  // Create cached_schedules table
  await expo.execAsync(`
    CREATE TABLE IF NOT EXISTS cached_schedules (
      id TEXT PRIMARY KEY,
      chore_id TEXT NOT NULL,
      household_id TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      assigned_to TEXT,
      is_completed INTEGER DEFAULT 0,
      completion_id TEXT,
      cached_at TEXT NOT NULL
    )
  `);

  // Create cached_completions table
  await expo.execAsync(`
    CREATE TABLE IF NOT EXISTS cached_completions (
      id TEXT PRIMARY KEY,
      chore_id TEXT NOT NULL,
      household_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      completed_at TEXT,
      status TEXT DEFAULT 'pending',
      approved_by TEXT,
      approved_at TEXT,
      rejection_reason TEXT,
      photo_url TEXT,
      points_awarded INTEGER,
      duration_seconds INTEGER,
      cached_at TEXT NOT NULL,
      is_local INTEGER DEFAULT 0,
      sync_version INTEGER DEFAULT 0
    )
  `);

  // Create cached_rewards table
  await expo.execAsync(`
    CREATE TABLE IF NOT EXISTS cached_rewards (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      type TEXT DEFAULT 'custom',
      point_cost INTEGER NOT NULL,
      quantity INTEGER,
      quantity_remaining INTEGER,
      is_active INTEGER DEFAULT 1,
      cached_at TEXT NOT NULL,
      sync_version INTEGER DEFAULT 0
    )
  `);

  // Create cached_redemptions table
  await expo.execAsync(`
    CREATE TABLE IF NOT EXISTS cached_redemptions (
      id TEXT PRIMARY KEY,
      reward_id TEXT NOT NULL,
      household_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      points_spent INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      requested_at TEXT NOT NULL,
      approved_at TEXT,
      fulfilled_at TEXT,
      rejected_at TEXT,
      rejection_reason TEXT,
      cached_at TEXT NOT NULL,
      is_local INTEGER DEFAULT 0,
      sync_version INTEGER DEFAULT 0
    )
  `);

  // Create cached_stats table
  await expo.execAsync(`
    CREATE TABLE IF NOT EXISTS cached_stats (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL,
      total_points INTEGER DEFAULT 0,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      total_chores_completed INTEGER DEFAULT 0,
      this_week_chores INTEGER DEFAULT 0,
      this_month_chores INTEGER DEFAULT 0,
      badge_count INTEGER DEFAULT 0,
      cached_at TEXT NOT NULL
    )
  `);

  // Create cached_transactions table
  await expo.execAsync(`
    CREATE TABLE IF NOT EXISTS cached_transactions (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      transaction_type TEXT NOT NULL,
      reference_id TEXT,
      reference_type TEXT,
      description TEXT,
      created_at TEXT NOT NULL,
      cached_at TEXT NOT NULL
    )
  `);

  // Create indexes for common queries
  await expo.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_members_household ON cached_members(household_id);
    CREATE INDEX IF NOT EXISTS idx_chores_household ON cached_chores(household_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_household_date ON cached_schedules(household_id, scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_completions_member ON cached_completions(member_id);
    CREATE INDEX IF NOT EXISTS idx_rewards_household ON cached_rewards(household_id);
    CREATE INDEX IF NOT EXISTS idx_redemptions_member ON cached_redemptions(member_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_member ON cached_transactions(member_id);
    CREATE INDEX IF NOT EXISTS idx_offline_queue_status ON offline_queue(status);
  `);
}

// Clear all cached data (for logout)
export async function clearAllCachedData(): Promise<void> {
  await expo.execAsync(`
    DELETE FROM cached_users;
    DELETE FROM cached_households;
    DELETE FROM cached_members;
    DELETE FROM cached_chores;
    DELETE FROM cached_schedules;
    DELETE FROM cached_completions;
    DELETE FROM cached_rewards;
    DELETE FROM cached_redemptions;
    DELETE FROM cached_stats;
    DELETE FROM cached_transactions;
    DELETE FROM offline_queue;
    DELETE FROM sync_metadata;
  `);
}

export { expo };
