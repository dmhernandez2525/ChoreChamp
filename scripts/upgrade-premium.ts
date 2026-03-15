import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, sql } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL || '';

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client);

async function main() {
  // Update all households to premium
  const result = await db.execute(sql`
    UPDATE households
    SET subscription_tier = 'premium',
        subscription_status = 'active',
        subscription_member_limit = 999
    RETURNING id, name, subscription_tier, subscription_status, subscription_member_limit
  `);

  console.log('Updated households to premium:', result);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
