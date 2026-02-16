# SDD-024: Financial Integration & Advanced Scheduling

**Status:** Draft
**Priority:** P2 (Phase 19)
**Author:** ChoreChamp Team
**Last Updated:** 2026-02-15

---

## 1. Overview

### 1.1 Purpose
Implement financial integration (banking connections, automated allowance deposits) and advanced scheduling features (chore rotations, task dependency chains, chore classification, marketplace) to deepen ChoreChamp's value proposition around financial literacy and equitable chore distribution.

### 1.2 Scope
- **F19.1** Banking Integration: Connect to Plaid, Stripe, or manual entry for automated allowance deposits with configurable frequency
- **F19.2** Rotation System: Round robin, weighted, random, and skill-based chore rotation with fairness tracking
- **F19.3** Chore Chains: Task dependency chains with step ordering, bonus points, and completion tracking
- **F19.4** Responsibilities vs Jobs: Classify chores as unpaid duties or paid tasks to teach financial literacy
- **F19.5** Chore Marketplace: Point-bounty listings where members can post, claim, and complete extra chores with parent approval controls

### 1.3 Research Justification
- **Allowance automation** is the #1 requested premium feature in competitor reviews (OurHome, S'moresUp)
- **Fair chore distribution** is cited as the top parental pain point in family app surveys
- **Financial literacy** programs that distinguish earning from responsibility show higher engagement among 8-14 year olds (Junior Achievement research)
- **Marketplace mechanics** drive 2.4x more voluntary chore completions in gamified household apps (Habitica community data)

---

## 2. Architecture

### 2.1 Types Package

All TypeScript types live in `packages/types/src/financial-scheduling.ts` and include interfaces for banking connections, allowance deposits, deposit configs, chore rotations, rotation history, chore chains, chain steps, responsibility configs, chore classifications, marketplace listings, and marketplace configs. Request/response types are colocated with their domain types.

### 2.2 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Web UI                               │
│  Banking  │ Rotations │ Chains │ Classification │ Marketplace│
└──────┬────┴─────┬─────┴───┬────┴───────┬────────┴─────┬──────┘
       │          │         │            │              │
       ▼          ▼         ▼            ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                       API Server (Fastify)                    │
│  /banking/*  /rotations/*  /chains/*  /classification/*      │
│                    /marketplace/*                             │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐  │
│  │ Financial Svc  │  │ Rotation Svc   │  │ Chain Svc     │  │
│  │ (Plaid/Stripe) │  │ (Fairness Eng) │  │ (Dep Graph)   │  │
│  └───────┬────────┘  └───────┬────────┘  └──────┬────────┘  │
│          │                   │                   │           │
│          ▼                   ▼                   ▼           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           BullMQ (Deposit Processing,               │    │
│  │           Rotation Scheduling, Chain Monitoring)     │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        PostgreSQL                            │
│  bankingConnections │ allowanceDeposits │ depositConfigs     │
│  choreRotations │ rotationHistory │ choreChains │ chainSteps │
│  responsibilityConfigs │ choreClassifications                │
│  marketplaceListings │ marketplaceConfigs                    │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 External Dependencies

| Service | Purpose | Required For |
|---------|---------|--------------|
| Plaid | Bank account linking and ACH transfers | F19.1 automated deposits |
| Stripe | Payment processing fallback | F19.1 card-based deposits |
| BullMQ / Redis | Job scheduling for deposits and rotations | F19.1, F19.2 |

---

## 3. Feature Details

### 3.1 F19.1 Banking Integration

**Goal:** Let parents connect a bank account and automate allowance deposits to children based on configurable schedules.

**Providers:**
- **Plaid:** Full bank account linking via Plaid Link. Supports ACH transfers for direct deposits.
- **Stripe:** Card-based deposits for parents who prefer not to link bank accounts directly.
- **Manual:** Record-keeping mode with no actual transfer. Parents mark deposits as completed manually.

**Automated Deposits:**
- Parents configure a deposit schedule per child (weekly, biweekly, monthly, or on-demand).
- A BullMQ cron job runs daily, checks `allowanceDepositConfigs` for due deposits, and enqueues them.
- Each deposit moves through statuses: `pending` -> `processing` -> `completed` or `failed`.
- Failed deposits are retried up to 3 times with exponential backoff, then marked `failed` with a reason.

**Deposit Config Options:**
- `frequency`: weekly, biweekly, monthly, on_demand
- `dayOfWeek`: 0-6 (for weekly/biweekly schedules)
- `dayOfMonth`: 1-31 (for monthly schedules)
- `amount` and `currency`: configurable per child

### 3.2 F19.2 Rotation System

**Goal:** Automatically rotate chore assignments among household members using configurable strategies, with built-in fairness tracking.

**Rotation Types:**

| Type | Algorithm | Best For |
|------|-----------|----------|
| `round_robin` | Cycles through participants in fixed order | Equal distribution of simple chores |
| `weighted` | Assigns based on configurable weight ratios | Age-appropriate distribution |
| `random` | Random selection with no-repeat-until-cycled constraint | Variety without predictability |
| `skill_based` | Matches chore difficulty/category to member skills and age | Complex households with mixed ages |

**Fairness Tracking:**
- Each rotation maintains a `fairnessScore` (0-100) that measures deviation from ideal equal distribution.
- `rotationHistory` logs every assignment, completion, and skip.
- The fairness engine recalculates scores after each rotation and flags imbalances.
- If fairness drops below 70, the system generates a recommendation (e.g., "Consider assigning 'Dishes' to Jamie next 2 rotations to rebalance").

**Rotation Frequency:**
- `daily`, `weekly`, `biweekly`, `monthly`
- `skipWeekends` option for school-week-only rotations

### 3.3 F19.3 Chore Chains

**Goal:** Define ordered sequences of related chores (e.g., "Saturday Deep Clean") where steps must be completed in order, with bonus points awarded for completing the full chain.

**Chain Structure:**
- A `ChoreChain` groups multiple `ChoreChainStep` records.
- Each step references an existing chore, has a `stepOrder`, and optionally `dependsOnStepId`.
- Steps can have different `dependencyType` values:
  - `must_complete_before`: Hard dependency; the next step is blocked until this completes.
  - `should_complete_before`: Soft dependency; the next step shows a warning but is not blocked.
  - `can_start_after`: The next step becomes available once this one starts (not necessarily completes).

**Completion Tracking:**
- Chain status transitions: `pending` -> `in_progress` (first step started) -> `completed` (all steps done) or `blocked` (a required step failed/stalled).
- `completedSteps` increments as steps finish. `percentComplete` is derived.
- When all steps complete before `deadlineAt`, the configured `bonusPoints` are awarded to all participants.

**Example Chain: "Saturday Deep Clean"**
1. Pick up clutter (anyone, must_complete_before)
2. Vacuum all rooms (member A, must_complete_before)
3. Mop kitchen (member B, can_start_after step 2)
4. Clean bathrooms (member C, can_start_after step 1)
5. Take out trash (anyone, must_complete_before, depends on steps 2-4)

### 3.4 F19.4 Responsibilities vs Jobs

**Goal:** Allow parents to classify chores as either unpaid "responsibilities" (duties expected of household members) or paid "jobs" (tasks that earn monetary value), teaching children the difference between obligation and earning.

**Configuration:**
- `ResponsibilityConfig` is household-level and controls defaults, labels, and visibility.
- Parents can customize the labels (e.g., "Duty" / "Gig" instead of "Responsibility" / "Job").
- `showClassificationBadge` controls whether a visual badge appears on chore cards.
- `allowMemberToggle` lets older children propose reclassification (subject to parent approval).

**Classification Rules:**
- Each chore gets a `ChoreClassification` record with an optional `reason`.
- Unclassified chores default to the household's `defaultClassification`.
- "Jobs" accumulate monetary value through the allowance system; "Responsibilities" earn gamification points only.
- The `ClassificationSummary` endpoint provides a breakdown of chore types per member, including total job earnings.

**Financial Literacy Integration:**
- Dashboard shows a split view: "What you do because you're part of the family" vs. "What you earn by going above and beyond."
- Weekly summaries include a financial literacy callout highlighting the responsibility/job balance.

### 3.5 F19.5 Chore Marketplace

**Goal:** Create an internal marketplace where household members can post chores with point bounties for others to claim and complete.

**Listing Lifecycle:**

```
Parent/Member posts listing (status: open)
    │
    ├── Member claims listing (status: claimed)
    │       │
    │       ├── Member completes + parent approves (status: completed)
    │       │       └── Points transferred to completer
    │       │
    │       └── Listing unclaimed after timeout (status: open again)
    │
    ├── Listing expires (status: expired)
    │
    └── Parent cancels listing (status: cancelled)
```

**Marketplace Controls (`MarketplaceConfig`):**
- `isEnabled`: Master toggle for the household
- `maxBountyPoints` / `minBountyPoints`: Guardrails on bounty values (default 5-500)
- `defaultExpirationHours`: How long listings stay open (default 48 hours)
- `requireParentApproval`: Whether completed marketplace tasks need parent sign-off (default true)
- `allowSelfListing`: Whether a member can list and claim their own chores (default false)

**Bonus Conditions:**
- Listings can include a `bonusCondition` (e.g., "Complete before noon") and `bonusPoints` awarded on top of the base bounty if the condition is met. Bonus condition evaluation is manual (parent confirms).

---

## 4. Database Schema

### 4.1 bankingConnections
```sql
CREATE TABLE banking_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL,
  parent_member_id UUID NOT NULL,
  provider TEXT NOT NULL,              -- 'plaid', 'stripe', 'manual'
  account_name TEXT NOT NULL,
  account_mask TEXT NOT NULL,          -- Last 4 digits
  institution_name TEXT NOT NULL,
  encrypted_access_token TEXT,         -- AES-256-GCM encrypted
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX banking_conn_household_idx ON banking_connections(household_id);
```

### 4.2 allowanceDeposits
```sql
CREATE TABLE allowance_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL,
  member_id UUID NOT NULL,
  member_name TEXT NOT NULL,
  banking_connection_id UUID NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, processing, completed, failed, cancelled
  scheduled_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  failure_reason TEXT,
  external_transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX allowance_deposit_household_idx ON allowance_deposits(household_id);
CREATE INDEX allowance_deposit_member_idx ON allowance_deposits(member_id);
CREATE INDEX allowance_deposit_status_idx ON allowance_deposits(status);
```

### 4.3 allowanceDepositConfigs
```sql
CREATE TABLE allowance_deposit_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL,
  member_id UUID NOT NULL,
  banking_connection_id UUID NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  frequency TEXT NOT NULL,             -- weekly, biweekly, monthly, on_demand
  day_of_week INTEGER,                 -- 0-6 for weekly/biweekly
  day_of_month INTEGER,                -- 1-31 for monthly
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  next_scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX deposit_config_household_idx ON allowance_deposit_configs(household_id);
CREATE INDEX deposit_config_member_idx ON allowance_deposit_configs(member_id);
```

### 4.4 choreRotations
```sql
CREATE TABLE chore_rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL,
  chore_id UUID NOT NULL,
  chore_name TEXT NOT NULL,
  rotation_type TEXT NOT NULL,         -- round_robin, weighted, random, skill_based
  frequency TEXT NOT NULL,             -- daily, weekly, biweekly, monthly
  participant_ids JSONB NOT NULL,      -- string[] of member IDs
  current_assignee_id UUID NOT NULL,
  next_rotation_at TIMESTAMPTZ NOT NULL,
  skip_weekends BOOLEAN NOT NULL DEFAULT FALSE,
  fairness_score REAL NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX rotation_household_idx ON chore_rotations(household_id);
CREATE INDEX rotation_chore_idx ON chore_rotations(chore_id);
```

### 4.5 rotationHistory
```sql
CREATE TABLE rotation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotation_id UUID NOT NULL,
  member_id UUID NOT NULL,
  member_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  was_skipped BOOLEAN NOT NULL DEFAULT FALSE,
  skip_reason TEXT
);

CREATE INDEX rotation_history_rotation_idx ON rotation_history(rotation_id);
CREATE INDEX rotation_history_member_idx ON rotation_history(member_id);
```

### 4.6 choreChains
```sql
CREATE TABLE chore_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  total_steps INTEGER NOT NULL DEFAULT 0,
  completed_steps INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, in_progress, completed, blocked
  bonus_points INTEGER NOT NULL DEFAULT 0,
  deadline_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX chain_household_idx ON chore_chains(household_id);
CREATE INDEX chain_status_idx ON chore_chains(status);
```

### 4.7 choreChainSteps
```sql
CREATE TABLE chore_chain_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID NOT NULL,
  chore_id UUID NOT NULL,
  chore_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  dependency_type TEXT NOT NULL DEFAULT 'must_complete_before',
  depends_on_step_id UUID,
  assignee_id UUID,
  assignee_name TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ
);

CREATE INDEX chain_step_chain_idx ON chore_chain_steps(chain_id);
CREATE INDEX chain_step_chore_idx ON chore_chain_steps(chore_id);
```

### 4.8 responsibilityConfigs
```sql
CREATE TABLE responsibility_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL UNIQUE,
  default_classification TEXT NOT NULL DEFAULT 'responsibility',
  responsibility_label TEXT NOT NULL DEFAULT 'Responsibility',
  job_label TEXT NOT NULL DEFAULT 'Job',
  show_classification_badge BOOLEAN NOT NULL DEFAULT TRUE,
  allow_member_toggle BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.9 choreClassifications
```sql
CREATE TABLE chore_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chore_id UUID NOT NULL,
  household_id UUID NOT NULL,
  classification TEXT NOT NULL,        -- responsibility, job
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX classification_household_idx ON chore_classifications(household_id);
CREATE INDEX classification_chore_idx ON chore_classifications(chore_id);
```

### 4.10 marketplaceListings
```sql
CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL,
  chore_id UUID NOT NULL,
  chore_name TEXT NOT NULL,
  listed_by_id UUID NOT NULL,
  listed_by_name TEXT NOT NULL,
  claimed_by_id UUID,
  claimed_by_name TEXT,
  point_bounty INTEGER NOT NULL,
  bonus_condition TEXT,
  bonus_points INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open', -- open, claimed, completed, expired, cancelled
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX listing_household_idx ON marketplace_listings(household_id);
CREATE INDEX listing_status_idx ON marketplace_listings(status);
CREATE INDEX listing_chore_idx ON marketplace_listings(chore_id);
```

### 4.11 marketplaceConfigs
```sql
CREATE TABLE marketplace_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  max_bounty_points INTEGER NOT NULL DEFAULT 500,
  min_bounty_points INTEGER NOT NULL DEFAULT 5,
  default_expiration_hours INTEGER NOT NULL DEFAULT 48,
  require_parent_approval BOOLEAN NOT NULL DEFAULT TRUE,
  allow_self_listing BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 5. API Endpoints

All endpoints are scoped under `/api/households/:householdId/financial`.

### 5.1 Banking Integration (F19.1)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/banking/connections` | List banking connections | Parent |
| POST | `/banking/connections` | Create banking connection | Parent |
| DELETE | `/banking/connections/:connectionId` | Remove banking connection | Parent |
| POST | `/banking/connections/:connectionId/verify` | Re-verify connection | Parent |
| GET | `/banking/deposits` | List allowance deposits | Parent |
| POST | `/banking/deposits/trigger` | Trigger manual deposit | Parent |
| GET | `/banking/deposit-configs` | List deposit configurations | Parent |
| POST | `/banking/deposit-configs` | Create deposit config | Parent |
| PUT | `/banking/deposit-configs/:configId` | Update deposit config | Parent |
| DELETE | `/banking/deposit-configs/:configId` | Delete deposit config | Parent |
| GET | `/banking/summary` | Deposit summary and stats | Parent |

### 5.2 Rotation System (F19.2)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/rotations` | List chore rotations | Member |
| POST | `/rotations` | Create rotation | Parent |
| GET | `/rotations/:rotationId` | Get rotation details | Member |
| PUT | `/rotations/:rotationId` | Update rotation | Parent |
| DELETE | `/rotations/:rotationId` | Delete rotation | Parent |
| POST | `/rotations/:rotationId/advance` | Manually advance rotation | Parent |
| POST | `/rotations/:rotationId/skip` | Skip current member with reason | Parent |
| GET | `/rotations/:rotationId/history` | Get rotation history | Member |
| GET | `/rotations/:rotationId/fairness` | Get fairness report | Parent |

### 5.3 Chore Chains (F19.3)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/chains` | List chore chains | Member |
| POST | `/chains` | Create chore chain | Parent |
| GET | `/chains/:chainId` | Get chain with progress | Member |
| PUT | `/chains/:chainId` | Update chain | Parent |
| DELETE | `/chains/:chainId` | Delete chain | Parent |
| POST | `/chains/:chainId/steps/:stepId/complete` | Complete a chain step | Member |

### 5.4 Responsibilities vs Jobs (F19.4)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/classification/config` | Get responsibility config | Member |
| PUT | `/classification/config` | Update responsibility config | Parent |
| GET | `/classification/chores` | List all classifications | Member |
| POST | `/classification/chores` | Classify a chore | Parent |
| PUT | `/classification/chores/:choreId` | Update classification | Parent |
| GET | `/classification/summary` | Classification breakdown | Parent |

### 5.5 Chore Marketplace (F19.5)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/marketplace/listings` | List marketplace listings | Member |
| POST | `/marketplace/listings` | Create listing | Member |
| POST | `/marketplace/listings/:listingId/claim` | Claim a listing | Member |
| POST | `/marketplace/listings/:listingId/complete` | Mark listing complete | Member |
| POST | `/marketplace/listings/:listingId/cancel` | Cancel listing | Parent |
| GET | `/marketplace/stats` | Marketplace statistics | Member |
| GET | `/marketplace/config` | Get marketplace config | Member |
| PUT | `/marketplace/config` | Update marketplace config | Parent |

**Total: 35 endpoints**

---

## 6. Business Logic

### 6.1 Deposit Scheduling Job

```typescript
// apps/api/src/jobs/processDeposits.ts
import { CronJob } from 'cron';

export const depositProcessorJob = new CronJob('0 6 * * *', async () => {
  const now = new Date();

  const dueConfigs = await db.query.allowanceDepositConfigs.findMany({
    where: and(
      eq(allowanceDepositConfigs.isActive, true),
      lte(allowanceDepositConfigs.nextScheduledAt, now),
    ),
  });

  for (const config of dueConfigs) {
    const connection = await db.query.bankingConnections.findFirst({
      where: and(
        eq(bankingConnections.id, config.bankingConnectionId),
        eq(bankingConnections.isActive, true),
      ),
    });

    if (!connection) continue;

    // Create deposit record
    const [deposit] = await db.insert(allowanceDeposits).values({
      householdId: config.householdId,
      memberId: config.memberId,
      memberName: await getMemberName(config.memberId),
      bankingConnectionId: config.bankingConnectionId,
      amount: config.amount,
      currency: config.currency,
      status: 'processing',
      scheduledAt: now,
    }).returning();

    // Process via provider
    await depositQueue.add('process', {
      depositId: deposit.id,
      provider: connection.provider,
      amount: config.amount,
      currency: config.currency,
    });

    // Update next scheduled date
    const nextDate = calculateNextScheduledDate(config);
    await db.update(allowanceDepositConfigs)
      .set({ nextScheduledAt: nextDate })
      .where(eq(allowanceDepositConfigs.id, config.id));
  }
});
```

### 6.2 Rotation Engine

```typescript
// apps/api/src/services/rotation.service.ts
export class RotationService {
  getNextAssignee(rotation: ChoreRotation, members: Member[]): string {
    const participants = members.filter(
      m => rotation.participantIds.includes(m.id)
    );

    const handlers: Record<RotationType, () => string> = {
      round_robin: () => this.roundRobin(rotation, participants),
      weighted: () => this.weighted(rotation, participants),
      random: () => this.random(rotation, participants),
      skill_based: () => this.skillBased(rotation, participants),
    };

    return handlers[rotation.rotationType]();
  }

  private roundRobin(rotation: ChoreRotation, participants: Member[]): string {
    const currentIdx = participants.findIndex(
      p => p.id === rotation.currentAssigneeId
    );
    const nextIdx = (currentIdx + 1) % participants.length;
    return participants[nextIdx].id;
  }

  private weighted(rotation: ChoreRotation, participants: Member[]): string {
    // Weight by inverse of recent assignment count for rebalancing
    const history = this.getRecentHistory(rotation.id, 30);
    const counts = this.countAssignments(history, participants);
    const totalAssignments = Object.values(counts).reduce((a, b) => a + b, 0);

    if (totalAssignments === 0) return participants[0].id;

    // Assign to the member with fewest recent assignments
    const sorted = participants.sort(
      (a, b) => (counts[a.id] || 0) - (counts[b.id] || 0)
    );
    return sorted[0].id;
  }

  private random(rotation: ChoreRotation, participants: Member[]): string {
    // Exclude current assignee to avoid immediate repeats
    const eligible = participants.filter(
      p => p.id !== rotation.currentAssigneeId
    );
    if (eligible.length === 0) return participants[0].id;
    return eligible[Math.floor(Math.random() * eligible.length)].id;
  }

  private skillBased(rotation: ChoreRotation, participants: Member[]): string {
    // Match chore category/difficulty to member age and skill ratings
    // Fall back to weighted if no skill data available
    return this.weighted(rotation, participants);
  }

  calculateFairnessScore(
    history: RotationHistory[],
    participantCount: number
  ): number {
    if (history.length === 0) return 100;

    const counts: Record<string, number> = {};
    for (const entry of history) {
      counts[entry.memberId] = (counts[entry.memberId] || 0) + 1;
    }

    const ideal = history.length / participantCount;
    const deviations = Object.values(counts).map(
      c => Math.abs(c - ideal) / ideal
    );
    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;

    // Score: 100 = perfectly fair, 0 = maximally unfair
    return Math.max(0, Math.round(100 * (1 - avgDeviation)));
  }
}
```

### 6.3 Chain Dependency Resolution

```typescript
// apps/api/src/services/chain.service.ts
export class ChainService {
  async completeStep(chainId: string, stepId: string, memberId: string) {
    const chain = await db.query.choreChains.findFirst({
      where: eq(choreChains.id, chainId),
      with: { steps: true },
    });

    if (!chain) throw new NotFoundError('Chain not found');

    const step = chain.steps.find(s => s.id === stepId);
    if (!step) throw new NotFoundError('Step not found');
    if (step.isCompleted) throw new BadRequestError('Step already completed');

    // Check dependencies
    if (step.dependsOnStepId && step.dependencyType === 'must_complete_before') {
      const dependency = chain.steps.find(s => s.id === step.dependsOnStepId);
      if (dependency && !dependency.isCompleted) {
        throw new BadRequestError('Dependency not yet completed');
      }
    }

    // Mark step complete
    await db.update(choreChainSteps)
      .set({ isCompleted: true, completedAt: new Date() })
      .where(eq(choreChainSteps.id, stepId));

    const newCompletedCount = chain.completedSteps + 1;
    const allDone = newCompletedCount === chain.totalSteps;

    // Update chain status
    await db.update(choreChains)
      .set({
        completedSteps: newCompletedCount,
        status: allDone ? 'completed' : 'in_progress',
        updatedAt: new Date(),
      })
      .where(eq(choreChains.id, chainId));

    // Award bonus if chain completed
    if (allDone && chain.bonusPoints > 0) {
      const participantIds = [...new Set(
        chain.steps.filter(s => s.assigneeId).map(s => s.assigneeId!)
      )];
      for (const pid of participantIds) {
        await pointsService.awardPoints(
          pid,
          chain.bonusPoints,
          'chain_bonus',
          chainId,
          `Completed chain: ${chain.name}`
        );
      }
    }

    return { chainCompleted: allDone, completedSteps: newCompletedCount };
  }

  getNextAvailableSteps(chain: ChoreChain, steps: ChoreChainStep[]): ChoreChainStep[] {
    return steps.filter(step => {
      if (step.isCompleted) return false;
      if (!step.dependsOnStepId) return true;

      const dep = steps.find(s => s.id === step.dependsOnStepId);
      if (!dep) return true;

      if (step.dependencyType === 'must_complete_before') {
        return dep.isCompleted;
      }
      if (step.dependencyType === 'can_start_after') {
        // Available if dependency has started (has a started_at or is completed)
        return true; // Simplified; in practice, check if dep has been started
      }
      return true; // should_complete_before is advisory only
    });
  }
}
```

---

## 7. Web UI Components

### 7.1 Banking Dashboard
- **Connection Manager:** Card for each linked account showing institution name, masked account number, provider badge, and verification status. "Add Account" button triggers Plaid Link or Stripe setup flow.
- **Deposit Schedule:** Table view of all active deposit configs with child name, amount, frequency, and next deposit date. Inline edit for amount and frequency.
- **Deposit History:** Paginated list of past deposits with status badges (completed/failed/pending).

### 7.2 Rotation Manager
- **Rotation List:** Cards showing chore name, rotation type, current assignee, and next rotation date.
- **Fairness Dashboard:** Bar chart per rotation showing assignment distribution across members. Color-coded fairness score indicator.
- **Rotation History:** Timeline view of past assignments with completion/skip status.

### 7.3 Chain Builder
- **Visual Chain Editor:** Drag-and-drop interface for ordering chain steps. Lines connecting dependent steps. Color-coded completion status per step.
- **Chain Progress View:** Progress bar with step indicators. Current step highlighted. Blocked steps shown with lock icon.

### 7.4 Classification View
- **Split View:** Two columns showing "Responsibilities" and "Jobs" with chore cards. Drag-and-drop between columns to reclassify.
- **Summary Dashboard:** Pie chart of responsibility/job breakdown per member. Earnings tracker for "Jobs" column.

### 7.5 Marketplace
- **Listing Feed:** Card grid of open listings sorted by bounty (highest first). Each card shows chore name, bounty points, bonus condition, expiration countdown, and "Claim" button.
- **My Listings:** Tab showing listings created by the current member with status filters.
- **Stats Panel:** Leaderboard of top marketplace contributors. Total points traded metric.

---

## 8. Security Considerations

### 8.1 Token Encryption
- All banking access tokens (Plaid, Stripe) are encrypted at rest using AES-256-GCM.
- Encryption keys are stored in environment variables, never in the database.
- The `encryptedAccessToken` column stores the ciphertext; raw tokens are never logged or exposed in API responses.
- Token rotation: Plaid tokens are refreshed every 30 days via a background job.

### 8.2 PCI Compliance
- ChoreChamp never stores raw card numbers. All card data is handled by Stripe's PCI-compliant infrastructure.
- Plaid Link handles bank credential capture entirely client-side; credentials never touch ChoreChamp servers.
- API responses for banking connections only include `accountMask` (last 4 digits), never full account numbers.

### 8.3 Parent Approval Requirements
- All banking CRUD operations require `Parent` role authentication.
- Marketplace listing completion with `requireParentApproval` enabled requires explicit parent sign-off before points transfer.
- Classification changes require `Parent` role unless `allowMemberToggle` is enabled, in which case child-initiated changes queue for parent review.
- Deposit config creation and modification are parent-only operations.

### 8.4 Rate Limiting

| Endpoint Group | Limit |
|----------------|-------|
| Banking connections | 10/hour per household |
| Deposit triggers | 5/day per household |
| Marketplace listings | 20/day per member |
| Marketplace claims | 10/day per member |

### 8.5 Data Access Controls
- Banking connection details are visible only to the parent who created them.
- Deposit history is visible to parents; children see only their own deposit records.
- Marketplace listings are visible to all household members.
- Fairness reports are parent-only by default.

---

## 9. Error Handling

| Error Code | Message | HTTP Status |
|------------|---------|-------------|
| `BANKING_CONNECTION_NOT_FOUND` | Banking connection not found | 404 |
| `BANKING_VERIFICATION_FAILED` | Unable to verify banking connection | 400 |
| `DEPOSIT_PROCESSING_FAILED` | Deposit processing failed | 500 |
| `DEPOSIT_CONFIG_DUPLICATE` | Deposit config already exists for this member | 409 |
| `ROTATION_NOT_FOUND` | Rotation not found | 404 |
| `ROTATION_MIN_PARTICIPANTS` | Rotation requires at least 2 participants | 400 |
| `ROTATION_FAIRNESS_UNAVAILABLE` | Not enough history to calculate fairness | 400 |
| `CHAIN_NOT_FOUND` | Chore chain not found | 404 |
| `CHAIN_STEP_BLOCKED` | Step is blocked by an incomplete dependency | 400 |
| `CHAIN_STEP_ALREADY_COMPLETE` | Step has already been completed | 400 |
| `CHAIN_DEADLINE_PASSED` | Chain deadline has passed | 400 |
| `CLASSIFICATION_NOT_FOUND` | Classification not found | 404 |
| `LISTING_NOT_FOUND` | Marketplace listing not found | 404 |
| `LISTING_ALREADY_CLAIMED` | Listing has already been claimed | 409 |
| `LISTING_EXPIRED` | Listing has expired | 400 |
| `LISTING_SELF_CLAIM` | Cannot claim your own listing | 400 |
| `BOUNTY_OUT_OF_RANGE` | Bounty must be between min and max configured values | 400 |
| `MARKETPLACE_DISABLED` | Marketplace is disabled for this household | 403 |

---

## 10. Real-Time Events

| Event | Payload | Description |
|-------|---------|-------------|
| `deposit:processed` | `{ depositId, memberId, amount, status }` | Deposit completed or failed |
| `deposit:scheduled` | `{ configId, memberId, nextDate }` | New deposit scheduled |
| `rotation:advanced` | `{ rotationId, choreId, newAssigneeId }` | Rotation moved to next member |
| `rotation:skipped` | `{ rotationId, memberId, reason }` | Member skipped in rotation |
| `chain:step_completed` | `{ chainId, stepId, completedSteps, totalSteps }` | Chain step finished |
| `chain:completed` | `{ chainId, bonusPoints, participantIds }` | Full chain completed |
| `chain:blocked` | `{ chainId, blockedStepId, reason }` | Chain step blocked |
| `classification:changed` | `{ choreId, classification }` | Chore reclassified |
| `listing:created` | `{ listingId, choreId, bounty }` | New marketplace listing |
| `listing:claimed` | `{ listingId, claimedById }` | Listing claimed |
| `listing:completed` | `{ listingId, pointsAwarded }` | Listing completed and paid |
| `listing:expired` | `{ listingId }` | Listing expired |

---

## 11. Testing Strategy

### 11.1 Unit Tests
- Rotation algorithm correctness (round robin ordering, weighted distribution, random no-repeat)
- Fairness score calculation with various distribution scenarios
- Chain dependency resolution (blocking, non-blocking, mixed)
- Deposit scheduling date calculations (weekly, biweekly, monthly edge cases)
- Classification summary aggregation logic

### 11.2 Integration Tests
- Full deposit lifecycle: config creation -> scheduled trigger -> processing -> completion
- Rotation lifecycle: creation -> advance -> skip -> fairness check
- Chain lifecycle: creation -> step completion in order -> bonus award
- Marketplace lifecycle: listing -> claim -> complete -> points transfer
- Parent approval flows for marketplace and classification changes

### 11.3 E2E Tests
- Parent connects bank account via Plaid Link, configures weekly deposit, verifies deposit appears
- Parent creates round-robin rotation, advances through all members, checks fairness report
- Family completes a 5-step chain before deadline and receives bonus points
- Child posts a marketplace listing, sibling claims and completes it, parent approves
- Parent classifies chores as responsibilities/jobs, verifies dashboard split view

---

## 12. Future Enhancements

- **Plaid Balance Checks:** Verify sufficient funds before processing deposits to reduce failures.
- **Smart Rotation Suggestions:** ML-based recommendations for rotation type based on household patterns and member ages.
- **Chain Templates:** Pre-built chain templates (e.g., "Morning Routine," "Saturday Deep Clean") that parents can import and customize.
- **Marketplace Bidding:** Allow members to bid on listings with counter-offers instead of fixed bounties.
- **Cross-Household Marketplace:** Enable marketplace listings visible to extended family or friend households.
- **Financial Reports:** Monthly/quarterly financial literacy reports showing earning trends, savings goals, and responsibility balance over time.
- **Allowance Splitting:** Automatic split of job earnings into save/spend/give buckets for teaching budgeting.
- **Calendar Integration:** Sync rotation schedules and chain deadlines to family calendar (ties into Phase 18).

---

## 13. Dependencies

### 13.1 External Services
- Plaid API (bank linking, ACH transfers)
- Stripe API (card-based payments)
- Redis / BullMQ (job scheduling)

### 13.2 Internal Packages
- `@chorechamp/database` (Drizzle schema in `schema/financial-scheduling.ts`)
- `@chorechamp/types` (TypeScript interfaces in `src/financial-scheduling.ts`)
- `@chorechamp/gamification` (points awarding for chain bonuses and marketplace payouts)

### 13.3 Prerequisite Phases
- Phase 1 (Authentication, SDD-001): Parent role verification
- Phase 1 (Chore Management, SDD-003): Chore records referenced by rotations, chains, classifications, and listings
- Phase 1 (Gamification, SDD-004): Points system for chain bonuses and marketplace bounties

---

**Document Version:** 1.0.0
**Next Review:** After Phase 19 implementation
