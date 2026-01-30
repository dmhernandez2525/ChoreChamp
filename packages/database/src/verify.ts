import 'dotenv/config';
import { db } from './index';
import { sql } from 'drizzle-orm';
import {
  users,
  accounts,
  sessions,
  coppaConsents,
  passwordResetTokens,
  households,
  inviteCodes,
  userHouseholds,
  members,
  chores,
  choreTemplates,
  choreCompletions,
  choreSchedules,
  pointTransactions,
  badges,
  familyParties,
  bossBattles,
  rewards,
  rewardRedemptions,
  notificationPreferences,
  deviceTokens,
  notificationLog,
} from './schema';

const expectedTables = [
  { name: 'users', schema: users },
  { name: 'accounts', schema: accounts },
  { name: 'sessions', schema: sessions },
  { name: 'coppa_consents', schema: coppaConsents },
  { name: 'password_reset_tokens', schema: passwordResetTokens },
  { name: 'households', schema: households },
  { name: 'invite_codes', schema: inviteCodes },
  { name: 'user_households', schema: userHouseholds },
  { name: 'members', schema: members },
  { name: 'chores', schema: chores },
  { name: 'chore_templates', schema: choreTemplates },
  { name: 'chore_completions', schema: choreCompletions },
  { name: 'chore_schedules', schema: choreSchedules },
  { name: 'point_transactions', schema: pointTransactions },
  { name: 'badges', schema: badges },
  { name: 'family_parties', schema: familyParties },
  { name: 'boss_battles', schema: bossBattles },
  { name: 'rewards', schema: rewards },
  { name: 'reward_redemptions', schema: rewardRedemptions },
  { name: 'notification_preferences', schema: notificationPreferences },
  { name: 'device_tokens', schema: deviceTokens },
  { name: 'notification_log', schema: notificationLog },
];

async function verify() {
  console.log('Verifying database connection and schema...\n');

  // Test connection
  try {
    await db.execute(sql`SELECT 1 as connected`);
    console.log('Database connection: OK');
  } catch (error) {
    console.error('Database connection: FAILED');
    console.error(error);
    process.exit(1);
  }

  // Check each table exists
  console.log('\nVerifying tables:');
  let allTablesExist = true;

  for (const { name } of expectedTables) {
    try {
      const queryResult = await db.execute(
        sql`SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = ${name}
        ) as exists`
      );
      const exists = queryResult[0]?.exists;
      if (exists) {
        console.log(`  ${name}: OK`);
      } else {
        console.log(`  ${name}: MISSING`);
        allTablesExist = false;
      }
    } catch {
      console.log(`  ${name}: ERROR`);
      allTablesExist = false;
    }
  }

  // Check chore templates count
  console.log('\nVerifying seed data:');
  try {
    const templateCount = await db.select().from(choreTemplates);
    console.log(`  Chore templates: ${templateCount.length}/70`);
    if (templateCount.length < 70) {
      console.log('  Warning: Run seed to add missing templates');
    }
  } catch {
    console.log('  Chore templates: Cannot query (table may not exist)');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (allTablesExist) {
    console.log('Verification complete: All 22 tables present');
  } else {
    console.log('Verification complete: Some tables missing');
    console.log('Run migrations to create missing tables:');
    console.log('  pnpm --filter @chorechamp/database push');
  }

  process.exit(allTablesExist ? 0 : 1);
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
