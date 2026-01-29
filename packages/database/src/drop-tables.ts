import 'dotenv/config';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(connectionString);

async function dropTables() {
  console.log('Dropping all tables to allow schema migration...');

  await sql`
    DROP TABLE IF EXISTS
      notification_log,
      notification_preferences,
      device_tokens,
      coppa_consents,
      password_reset_tokens,
      sessions,
      accounts,
      user_households,
      invite_codes,
      members,
      chore_completions,
      chores,
      households,
      users
    CASCADE
  `;

  console.log('Tables dropped successfully');
  await sql.end();
}

dropTables().catch((err) => {
  console.error('Failed to drop tables:', err);
  process.exit(1);
});
