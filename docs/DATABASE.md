# ChoreChamp Database Guide

## Overview

ChoreChamp uses PostgreSQL with Drizzle ORM for type-safe database operations. The schema is defined in TypeScript and includes 29 tables organized across 7 domains.

## Quick Commands

```bash
# Push schema changes to database
pnpm db:push

# Generate SQL migrations (for version control)
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed templates and badges
pnpm db:seed

# Verify database setup
pnpm db:verify

# Open Drizzle Studio (GUI)
pnpm db:studio
```

## Schema Overview

### User Management (5 tables)

| Table | Description |
|-------|-------------|
| `users` | Parent accounts with email/password |
| `accounts` | OAuth provider connections (Google, Apple) |
| `sessions` | Active user sessions |
| `coppa_consents` | COPPA parental consent records |
| `password_reset_tokens` | Password reset flow |

### Household Management (4 tables)

| Table | Description |
|-------|-------------|
| `households` | Family households with settings |
| `members` | Family members (parents and children) |
| `user_households` | Users can belong to multiple households |
| `invite_codes` | Join codes for new members |

Key subscription fields stored on `households`:
- `subscription_tier` (`free`, `family`, `premium`)
- `subscription_status` (`trialing`, `active`, `past_due`, `grace_period`, `canceled`, `expired`)
- `subscription_current_period_start` / `subscription_current_period_end`
- `subscription_trial_ends_at` / `subscription_grace_period_ends_at`
- `stripe_customer_id` / `stripe_subscription_id`
- `revenuecat_app_user_id`

### Chore Management (4 tables)

| Table | Description |
|-------|-------------|
| `chores` | Chore definitions with scheduling |
| `chore_templates` | 70 pre-built chore templates |
| `chore_completions` | Individual completion records |
| `chore_schedules` | Daily scheduled assignments |

### Gamification (4 tables)

| Table | Description |
|-------|-------------|
| `badges` | 15 badge definitions |
| `point_transactions` | Point audit log |
| `family_parties` | Family collective goals |
| `boss_battles` | Weekly family challenges |

### Rewards (2 tables)

| Table | Description |
|-------|-------------|
| `rewards` | Custom reward catalog |
| `reward_redemptions` | Redemption requests/history |

### Notifications (3 tables)

| Table | Description |
|-------|-------------|
| `notification_preferences` | User notification settings |
| `device_tokens` | Push notification tokens |
| `notification_log` | Notification history |

### In-App Store (7 tables)

| Table | Description |
|-------|-------------|
| `store_catalog_items` | Store catalog definitions and sale windows |
| `store_wallets` | Member ChoreCoin balances |
| `store_purchases` | Purchase history with digital receipt references |
| `store_member_entitlements` | Owned unlocks and boosters |
| `store_refund_requests` | Refund request workflow |
| `store_purchase_controls` | Parent approval, PIN, and spend limits |
| `store_gift_cards` | Gift premium codes and redemption state |

## Seed Data

### Chore Templates (70 total)

Categories:
- Bedroom (10): Make bed, pick up toys, vacuum, etc.
- Bathroom (8): Clean toilet, wipe counter, etc.
- Kitchen (12): Load dishwasher, set table, etc.
- Living Room (6): Dust, vacuum, organize, etc.
- Outdoor (8): Water plants, rake leaves, etc.
- Pets (6): Feed pet, walk dog, etc.
- Laundry (5): Sort, fold, put away, etc.
- School (5): Pack bag, homework, reading, etc.
- Self-Care (5): Brush teeth, shower, etc.
- Helping (5): Carry groceries, get mail, etc.

### Badges (15 total)

Categories:
- Streak (3): 7-day, 30-day, 100-day streaks
- Volume (4): 1, 10, 50, 100 chores completed
- Time (3): Early bird, night owl, weekend warrior
- Family (3): Team player, helpful hero, MVP
- Special (2): Week one, completionist

## Environment Setup

### Local Development

Create a `.env` file in `packages/database/`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/chorechamp
```

### Production (Render)

The `DATABASE_URL` is automatically set from the Render database service.

## CI/CD Migrations

Migrations run automatically during Render deployment via `preDeployCommand` in `render.yaml`:

```yaml
preDeployCommand: pnpm db:push && pnpm db:seed
```

For manual migrations, use the script:

```bash
./scripts/db-migrate.sh        # Push schema only
./scripts/db-migrate.sh --seed # Push schema + seed data
```

## Schema Patterns

### UUIDs

All tables use UUID primary keys with `defaultRandom()`:

```typescript
id: uuid('id').primaryKey().defaultRandom()
```

### Timestamps

Standard `createdAt` and `updatedAt` fields with timezone:

```typescript
createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
```

### Soft Deletes

Use `isActive` boolean instead of hard deletes:

```typescript
isActive: boolean('is_active').default(true)
```

### Cascade Deletes

Foreign keys cascade on delete for data integrity:

```typescript
householdId: uuid('household_id')
  .notNull()
  .references(() => households.id, { onDelete: 'cascade' })
```

### JSONB for Flexible Data

Use JSONB for array/object fields:

```typescript
steps: jsonb('steps'), // Array of step strings
data: jsonb('data'),   // Notification metadata
```

## Indexes

Performance indexes are defined on frequently queried columns:

```typescript
(table) => [
  index('idx_chores_household').on(table.householdId),
  index('idx_chores_active').on(table.householdId, table.isActive),
]
```

## Unique Constraints

Prevent duplicate data:

```typescript
unique('unique_chore_date_member').on(table.choreId, table.scheduledDate, table.assignedTo)
```

## Common Queries

### Get household with members

```typescript
const household = await db.query.households.findFirst({
  where: eq(households.id, householdId),
  with: {
    members: true,
    chores: true,
  },
});
```

### Get today's schedule

```typescript
const schedule = await db.query.choreSchedules.findMany({
  where: and(
    eq(choreSchedules.householdId, householdId),
    eq(choreSchedules.scheduledDate, today)
  ),
  with: {
    chore: true,
    assignee: true,
  },
});
```

### Award points

```typescript
await db.transaction(async (tx) => {
  // Update member points
  await tx.update(members)
    .set({
      pointsCurrent: sql`${members.pointsCurrent} + ${points}`,
      pointsLifetime: sql`${members.pointsLifetime} + ${points}`,
    })
    .where(eq(members.id, memberId));

  // Log transaction
  await tx.insert(pointTransactions).values({
    householdId,
    memberId,
    amount: points,
    balanceAfter: newBalance,
    transactionType: 'chore_completion',
    description: `Completed: ${choreName}`,
  });
});
```

## Troubleshooting

### Connection Issues

1. Verify `DATABASE_URL` is set correctly
2. Check PostgreSQL is running
3. Ensure database exists

```bash
# Test connection
pnpm db:verify
```

### Schema Sync Issues

1. Run push to sync schema:
```bash
pnpm db:push
```

2. If conflicts occur, check Drizzle Studio:
```bash
pnpm db:studio
```

### Missing Seed Data

```bash
pnpm db:seed
```

## Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Schema Files](../packages/database/src/schema/)
