# SDD-032: Rule-Based Chore Automation

**Status:** Draft
**Priority:** P2
**Author:** ChoreChamp Team
**Last Updated:** 2026-03-14

---

## 1. Overview

### 1.1 Purpose
Implement a visual rule builder that lets parents create "when X happens, do Y" automation rules for chore management workflows. This extends the automation capabilities introduced in SDD-022 (Smart Automation & AI, F17.3) with a concrete, production-ready rule engine and a user-friendly builder interface.

### 1.2 Scope
- Rule structure with triggers, conditions, and actions
- Five trigger types (chore completed, chore overdue, status changed, time-based, member joined)
- Four condition filters (category, assignee, priority, difficulty)
- Six action types (assign chore, change status, send notification, award bonus points, create chore, escalate)
- Visual rule builder UI with drag-and-drop condition/action cards
- Rule testing with dry-run capability
- Enable/disable toggle per rule
- Server-side rule evaluation engine
- Client-side real-time feedback via Socket.io

### 1.3 Research Justification
- **IFTTT-style "recipes":** The most approachable automation pattern for non-technical users. Parents understand "When [this] then [that]" without needing to think in terms of code.
- **Overdue escalation:** Top feature request in chore app reviews. Parents want automatic reminders and reassignment when chores slip past deadlines.
- **Bonus points automation:** Gamification works best when rewards feel immediate and consistent. Manual bonus awarding is easy to forget.

---

## 2. Database Schema

### 2.1 Automation Rules Table

This table extends the `automationRules` schema defined in SDD-022. If the existing table from SDD-022 is suitable, reuse it. Otherwise, create this table:

```typescript
// packages/database/src/schema/automation-rules.ts
import { pgTable, uuid, varchar, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';
import { households } from './households';

export const automationRules = pgTable('automation_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  triggerType: varchar('trigger_type', { length: 50 }).notNull(),
  triggerConfig: jsonb('trigger_config').default({}),
  conditions: jsonb('conditions').default([]),
  actions: jsonb('actions').default([]),
  enabled: boolean('enabled').default(true),
  lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
```

```sql
CREATE INDEX idx_automation_rules_household ON automation_rules(household_id);
CREATE INDEX idx_automation_rules_trigger ON automation_rules(household_id, trigger_type);
CREATE INDEX idx_automation_rules_enabled ON automation_rules(household_id) WHERE enabled = TRUE;
```

### 2.2 Rule Execution Log Table

Reuses the `automationExecutionLogs` table from SDD-022 if available. Otherwise:

```typescript
export const automationExecutionLogs = pgTable('automation_execution_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  ruleId: uuid('rule_id').notNull().references(() => automationRules.id, { onDelete: 'cascade' }),
  triggerData: jsonb('trigger_data').notNull(),
  actionsExecuted: jsonb('actions_executed').notNull(),
  success: boolean('success').default(true),
  errorMessage: text('error_message'),
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
```

```sql
CREATE INDEX idx_execution_logs_rule ON automation_execution_logs(rule_id);
CREATE INDEX idx_execution_logs_created ON automation_execution_logs(rule_id, created_at DESC);
```

---

## 3. Rule Structure

### 3.1 Rule Schema

```typescript
interface AutomationRule {
  id: string;
  name: string;
  trigger: RuleTrigger;
  conditions: RuleCondition[];
  actions: RuleAction[];
  enabled: boolean;
  householdId: string;
}
```

### 3.2 Trigger Types

| Trigger | Key | Description | Config |
|---------|-----|-------------|--------|
| Chore Completed | `chore_completed` | Fires when any chore is marked complete | none |
| Chore Overdue | `chore_overdue` | Fires when a chore passes its due date/time without completion | `{ gracePeriodMinutes?: number }` |
| Status Changed | `status_changed` | Fires when a chore status changes to a specific value | `{ toStatus: string }` |
| Time-Based | `time_based` | Fires at a scheduled time (cron) | `{ cron: string, timezone: string }` |
| Member Joined | `member_joined` | Fires when a new member joins the household | none |

```typescript
type RuleTrigger =
  | { type: 'chore_completed' }
  | { type: 'chore_overdue'; config: { gracePeriodMinutes?: number } }
  | { type: 'status_changed'; config: { toStatus: string } }
  | { type: 'time_based'; config: { cron: string; timezone: string } }
  | { type: 'member_joined' };
```

### 3.3 Condition Filters

Conditions narrow which chores or members the rule applies to. Multiple conditions are combined with AND logic.

| Condition | Key | Operators | Values |
|-----------|-----|-----------|--------|
| Category | `chore_category` | `equals`, `in` | Single category or array of categories |
| Assignee | `chore_assignee` | `equals`, `in` | Single member ID or array of member IDs |
| Priority | `chore_priority` | `equals`, `in` | `low`, `medium`, `high`, `urgent` |
| Difficulty | `chore_difficulty` | `equals`, `in` | `easy`, `medium`, `hard` |

```typescript
interface RuleCondition {
  field: 'chore_category' | 'chore_assignee' | 'chore_priority' | 'chore_difficulty';
  operator: 'equals' | 'in';
  value: string | string[];
}
```

### 3.4 Action Types

| Action | Key | Description | Config |
|--------|-----|-------------|--------|
| Assign Chore | `assign_chore` | Assign a specific chore to a member | `{ choreId: string, memberId: string }` |
| Change Status | `change_status` | Move chore to a different status | `{ status: string }` |
| Send Notification | `send_notification` | Push notification to specific member(s) | `{ memberIds: string[], message: string }` |
| Award Bonus Points | `award_bonus_points` | Add extra points beyond normal completion | `{ points: number, reason: string }` |
| Create Chore | `create_chore` | Create a new chore (e.g., follow-up task) | `{ title: string, category: string, assignedTo?: string, pointValue?: number }` |
| Escalate | `escalate` | If chore overdue by X hours, reassign or notify parent | `{ afterHours: number, action: 'reassign' \| 'notify_parent', reassignTo?: string }` |

```typescript
type RuleAction =
  | { type: 'assign_chore'; config: { choreId: string; memberId: string } }
  | { type: 'change_status'; config: { status: string } }
  | { type: 'send_notification'; config: { memberIds: string[]; message: string } }
  | { type: 'award_bonus_points'; config: { points: number; reason: string } }
  | { type: 'create_chore'; config: { title: string; category: string; assignedTo?: string; pointValue?: number } }
  | { type: 'escalate'; config: { afterHours: number; action: 'reassign' | 'notify_parent'; reassignTo?: string } };
```

---

## 4. API Endpoints

### 4.1 Automation Rule Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/households/:id/automation-rules` | List all rules | Parent |
| POST | `/api/households/:id/automation-rules` | Create rule | Parent |
| GET | `/api/households/:id/automation-rules/:ruleId` | Get rule details | Parent |
| PATCH | `/api/households/:id/automation-rules/:ruleId` | Update rule | Parent |
| DELETE | `/api/households/:id/automation-rules/:ruleId` | Delete rule | Parent |
| POST | `/api/households/:id/automation-rules/:ruleId/test` | Dry-run test | Parent |
| GET | `/api/households/:id/automation-rules/:ruleId/logs` | Get execution logs | Parent |

### 4.2 Request/Response Examples

#### POST `/api/households/:id/automation-rules`

```typescript
// Request: "When a kitchen chore is completed, award 5 bonus points"
{
  name: "Kitchen bonus points",
  trigger: { type: "chore_completed" },
  conditions: [
    { field: "chore_category", operator: "equals", value: "kitchen" }
  ],
  actions: [
    { type: "award_bonus_points", config: { points: 5, reason: "Kitchen chore bonus" } }
  ],
  enabled: true
}
```

#### POST `/api/households/:id/automation-rules/:ruleId/test`

```typescript
// Response: dry-run against last 10 chore events
{
  ruleId: "rule-uuid",
  testResults: [
    {
      event: {
        type: "chore_completed",
        choreId: "chore-uuid",
        choreTitle: "Wash dishes",
        memberId: "member-uuid",
        memberName: "Emma",
        occurredAt: "2026-03-13T18:30:00Z"
      },
      conditionsMet: true,
      actionsWouldExecute: [
        { type: "award_bonus_points", config: { points: 5, reason: "Kitchen chore bonus" } }
      ]
    },
    {
      event: {
        type: "chore_completed",
        choreId: "chore-uuid-2",
        choreTitle: "Make bed",
        memberId: "member-uuid",
        memberName: "Emma",
        occurredAt: "2026-03-13T08:00:00Z"
      },
      conditionsMet: false,
      conditionsFailedReason: "chore_category 'bedroom' does not equal 'kitchen'"
    }
  ],
  matchCount: 1,
  totalEventsChecked: 10
}
```

---

## 5. Implementation

### 5.1 Rule Evaluation Engine (Server)

The rule engine runs server-side and is invoked in two contexts:

1. **Event-driven:** When a chore event occurs (completion, status change, overdue detection), the engine queries enabled rules matching that trigger type for the household and evaluates conditions against the event payload.
2. **Time-based:** A cron job runs every minute, checks for `time_based` rules whose cron expression matches the current time, and executes them.

```typescript
// apps/api/src/services/automation-engine.service.ts
export class AutomationEngineService {
  async evaluateEvent(householdId: string, event: ChoreEvent): Promise<void> {
    const rules = await db.query.automationRules.findMany({
      where: and(
        eq(automationRules.householdId, householdId),
        eq(automationRules.triggerType, event.type),
        eq(automationRules.enabled, true),
      ),
    });

    for (const rule of rules) {
      const startTime = Date.now();
      try {
        if (!this.checkConditions(rule.conditions, event)) continue;
        await this.executeActions(rule.actions, event, householdId);
        await this.logExecution(rule.id, event, rule.actions, true, null, Date.now() - startTime);
        await db.update(automationRules)
          .set({ lastTriggeredAt: new Date() })
          .where(eq(automationRules.id, rule.id));
      } catch (error) {
        await this.logExecution(rule.id, event, rule.actions, false, error.message, Date.now() - startTime);
      }
    }
  }

  private checkConditions(conditions: RuleCondition[], event: ChoreEvent): boolean {
    return conditions.every(condition => {
      const eventValue = this.getEventField(event, condition.field);
      if (condition.operator === 'equals') return eventValue === condition.value;
      if (condition.operator === 'in') return (condition.value as string[]).includes(eventValue);
      return false;
    });
  }

  private async executeActions(
    actions: RuleAction[],
    event: ChoreEvent,
    householdId: string,
  ): Promise<void> {
    for (const action of actions) {
      await this.executeAction(action, event, householdId);
    }
  }

  private async executeAction(
    action: RuleAction,
    event: ChoreEvent,
    householdId: string,
  ): Promise<void> {
    const handlers: Record<string, () => Promise<void>> = {
      assign_chore: () => this.handleAssignChore(action.config, householdId),
      change_status: () => this.handleChangeStatus(action.config, event),
      send_notification: () => this.handleSendNotification(action.config, householdId),
      award_bonus_points: () => this.handleAwardBonusPoints(action.config, event),
      create_chore: () => this.handleCreateChore(action.config, householdId),
      escalate: () => this.handleEscalate(action.config, event, householdId),
    };

    const handler = handlers[action.type];
    if (handler) await handler();
  }

  private getEventField(event: ChoreEvent, field: string): string {
    const fieldMap: Record<string, string> = {
      chore_category: event.chore?.category,
      chore_assignee: event.chore?.assignedTo?.[0],
      chore_priority: event.chore?.priority,
      chore_difficulty: event.chore?.difficulty,
    };
    return fieldMap[field] ?? '';
  }
}
```

### 5.2 Overdue Detection Job

A cron job runs every 15 minutes, queries chores that are past their due date/time and have not been completed, and fires `chore_overdue` events for each.

```typescript
// apps/api/src/jobs/overdueChecker.ts
import { CronJob } from 'cron';

export const overdueCheckerJob = new CronJob('*/15 * * * *', async () => {
  const now = new Date();
  const overdueChores = await db.query.choreSchedules.findMany({
    where: and(
      eq(choreSchedules.isCompleted, false),
      lt(choreSchedules.scheduledDate, now),
    ),
    with: { chore: true },
  });

  for (const schedule of overdueChores) {
    const event: ChoreEvent = {
      type: 'chore_overdue',
      choreId: schedule.choreId,
      chore: schedule.chore,
      scheduledDate: schedule.scheduledDate,
      householdId: schedule.householdId,
    };
    await automationEngine.evaluateEvent(schedule.householdId, event);
  }
});
```

### 5.3 Dry-Run Test

The test endpoint replays the last 10 chore events for the household through the specified rule without executing actions. It returns which events would have matched and what actions would have fired.

```typescript
async testRule(householdId: string, ruleId: string): Promise<TestResult[]> {
  const rule = await db.query.automationRules.findFirst({
    where: and(eq(automationRules.id, ruleId), eq(automationRules.householdId, householdId)),
  });

  if (!rule) throw new NotFoundError('Rule not found');

  const recentEvents = await this.getRecentEvents(householdId, rule.triggerType, 10);

  return recentEvents.map(event => {
    const conditionsMet = this.checkConditions(rule.conditions, event);
    return {
      event: {
        type: event.type,
        choreId: event.choreId,
        choreTitle: event.chore?.title,
        memberId: event.memberId,
        memberName: event.member?.displayName,
        occurredAt: event.createdAt,
      },
      conditionsMet,
      conditionsFailedReason: conditionsMet ? null : this.getFailureReason(rule.conditions, event),
      actionsWouldExecute: conditionsMet ? rule.actions : [],
    };
  });
}
```

### 5.4 Client-Side Real-Time Feedback

The `useAutomationEngine` hook listens to Socket.io events and evaluates rules locally for immediate UI feedback (toast notifications, optimistic UI updates), while the server handles the actual execution.

```typescript
// apps/web/src/hooks/useAutomationEngine.ts
export function useAutomationEngine(householdId: string) {
  const { socket } = useSocket();
  const { data: rules } = useAutomationRules(householdId);
  const { showToast } = useToast();

  useEffect(() => {
    if (!socket || !rules) return;

    const handleEvent = (event: ChoreEvent) => {
      const matchingRules = rules.filter(rule => {
        if (!rule.enabled) return false;
        if (rule.triggerType !== event.type) return false;
        return rule.conditions.every(cond => checkConditionLocally(cond, event));
      });

      for (const rule of matchingRules) {
        showToast({
          title: `Automation: ${rule.name}`,
          description: `Rule triggered by "${event.chore?.title}"`,
          variant: 'info',
        });
      }
    };

    socket.on('chore:completed', handleEvent);
    socket.on('chore:overdue', handleEvent);
    socket.on('chore:statusChanged', handleEvent);

    return () => {
      socket.off('chore:completed', handleEvent);
      socket.off('chore:overdue', handleEvent);
      socket.off('chore:statusChanged', handleEvent);
    };
  }, [socket, rules, showToast]);
}
```

### 5.5 Components

```
apps/web/src/components/automation/
  AutomationRuleBuilder.tsx   -- Full rule creation/editing form
  RuleCard.tsx                -- Summary card for rule list view
  TriggerSelector.tsx         -- Dropdown to pick trigger type with config fields
  ConditionCard.tsx           -- Removable card showing field/operator/value with edit controls
  ActionCard.tsx              -- Removable card showing action type with config fields
  RuleTestResults.tsx         -- Display dry-run test results
  AutomationRulesPage.tsx     -- List view with create button, integrates into Settings or dedicated page
```

### 5.6 Rule Builder UI Flow

The builder uses a sentence-style layout: **"When** [trigger dropdown] **and** [condition cards] **then** [action cards]**"**. Each condition and action is a removable card with inline editing.

1. Parent clicks "Create Rule" button
2. Names the rule (e.g., "Kitchen bonus for Emma")
3. Selects a trigger from the dropdown
4. Optionally adds condition cards (click "+ Add Condition")
5. Adds one or more action cards (click "+ Add Action")
6. Clicks "Test Rule" to see dry-run results against recent events
7. Clicks "Save" to create the rule (enabled by default)

---

## 6. Real-Time Events

| Event | Payload | Description |
|-------|---------|-------------|
| `automation:triggered` | `{ ruleId, ruleName, event, actions }` | Rule was triggered and executed |
| `automation:failed` | `{ ruleId, ruleName, error }` | Rule execution failed |

---

## 7. Error Handling

| Error Code | Message | HTTP Status |
|------------|---------|-------------|
| `RULE_NOT_FOUND` | Automation rule not found | 404 |
| `INVALID_TRIGGER_TYPE` | Unsupported trigger type | 400 |
| `INVALID_CONDITION` | Condition field or operator not recognized | 400 |
| `INVALID_ACTION` | Action type not recognized or config incomplete | 400 |
| `INVALID_CRON` | Cron expression is not valid | 400 |
| `MAX_RULES_REACHED` | Household has reached the maximum number of rules (50) | 429 |
| `RULE_EXECUTION_FAILED` | Rule action failed during execution | 500 |

---

## 8. Constraints and Limits

| Constraint | Value | Rationale |
|------------|-------|-----------|
| Max rules per household | 50 | Prevent runaway rule chains |
| Max conditions per rule | 10 | Keep rules understandable |
| Max actions per rule | 5 | Limit blast radius per trigger |
| Max bonus points per action | 100 | Prevent point inflation |
| Overdue check interval | 15 minutes | Balance between responsiveness and server load |
| Time-based cron minimum interval | 1 hour | Prevent rules firing every minute |
| Execution log retention | 90 days | Keep logs queryable without unbounded growth |

---

## 9. Testing Strategy

### 9.1 Unit Tests
- `checkConditions`: verify AND logic, each operator (equals, in), each field type
- `executeAction`: verify each action type calls the correct service method with correct arguments
- `getEventField`: verify field mapping for all condition fields
- Cron expression validation: verify valid/invalid cron strings
- Dry-run test: verify it returns correct match/no-match results without executing actions

### 9.2 Integration Tests
- Rule CRUD: create, read, update, delete, verify cascade delete of execution logs
- Rule evaluation end-to-end: create rule, fire matching event, verify action executed and log recorded
- Condition filtering: create rule with conditions, fire events that match and don't match, verify correct filtering
- Time-based rules: verify cron job picks up rules and fires them at the correct time
- Dry-run test endpoint: verify it returns results without side effects

### 9.3 Component Tests
- AutomationRuleBuilder: renders trigger/condition/action sections, adding/removing cards works
- TriggerSelector: changing trigger type shows correct config fields
- ConditionCard: changing field updates operator and value options
- ActionCard: changing action type shows correct config fields
- RuleTestResults: renders match/no-match results correctly

### 9.4 E2E Tests
- Create a "kitchen bonus points" rule, complete a kitchen chore, verify bonus points awarded
- Create an "overdue escalation" rule, let a chore go overdue, verify notification sent to parent
- Disable a rule, trigger matching event, verify rule does not fire
- Use "Test Rule" button, verify dry-run results display without side effects

---

**Document Version:** 1.0.0
**Next Review:** After implementation sprint
