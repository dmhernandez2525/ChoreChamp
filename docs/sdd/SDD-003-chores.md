# SDD-003: Chore Management

**Status:** Draft
**Priority:** P0 (MVP)
**Author:** ChoreChamp Team
**Last Updated:** 2026-01-28

---

## 1. Overview

### 1.1 Purpose
Implement comprehensive chore management including creation, scheduling, assignment, and completion tracking with support for recurring chores and the completion approval workflow.

### 1.2 Scope
- Chore CRUD operations
- Pre-built chore templates (50+)
- Recurring scheduling (daily, weekly, monthly, custom)
- Assignment (specific member, anyone, rotation)
- Completion workflow with optional approval
- Photo proof submission
- Completion history

### 1.3 Research Justification
- **"After last done" scheduling:** OurHome's most praised feature
- **Photo proof:** Universally praised in S'moresUp/Homey reviews
- **Quick setup with templates:** Reduces abandonment from complex onboarding

---

## 2. Database Schema

### 2.1 Chores Table
```sql
CREATE TABLE chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,

  title VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- Emoji or icon identifier
  category VARCHAR(50), -- 'kitchen', 'bathroom', 'bedroom', etc.

  -- Points
  point_value INTEGER NOT NULL DEFAULT 10,
  difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'

  -- Assignment
  assigned_to UUID[], -- Array of member IDs, empty = unassigned
  assignment_type VARCHAR(20) DEFAULT 'specific', -- 'specific', 'anyone', 'rotation'
  rotation_index INTEGER DEFAULT 0, -- For rotation tracking

  -- Scheduling
  recurrence_type VARCHAR(20) DEFAULT 'once', -- 'once', 'daily', 'weekly', 'monthly', 'after_completion', 'custom'
  recurrence_days INTEGER[], -- Days of week (0-6) for weekly
  recurrence_interval INTEGER, -- Every X days for custom
  recurrence_after_days INTEGER, -- Days after last completion
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  due_time TIME, -- Preferred completion time
  time_window_minutes INTEGER, -- Flexibility window

  -- Requirements
  requires_approval BOOLEAN DEFAULT FALSE,
  requires_photo BOOLEAN DEFAULT FALSE,
  estimated_minutes INTEGER, -- Estimated time to complete

  -- ADHD settings
  show_timer BOOLEAN DEFAULT FALSE,
  steps JSONB, -- Array of step strings for task breakdown

  -- Metadata
  created_by UUID NOT NULL REFERENCES members(id),
  is_active BOOLEAN DEFAULT TRUE,
  is_template BOOLEAN DEFAULT FALSE, -- For household-specific templates
  template_id UUID REFERENCES chore_templates(id), -- Source template if any

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chores_household ON chores(household_id);
CREATE INDEX idx_chores_active ON chores(household_id, is_active);
CREATE INDEX idx_chores_assigned ON chores USING GIN(assigned_to);
```

### 2.2 Chore Templates Table (Global)
```sql
CREATE TABLE chore_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  category VARCHAR(50) NOT NULL,
  point_value INTEGER DEFAULT 10,
  difficulty VARCHAR(20) DEFAULT 'medium',
  estimated_minutes INTEGER,
  min_age INTEGER, -- Minimum recommended age
  max_age INTEGER, -- Maximum recommended age (NULL = no max)
  steps JSONB,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_templates_category ON chore_templates(category);
CREATE INDEX idx_templates_age ON chore_templates(min_age, max_age);
```

### 2.3 Chore Completions Table
```sql
CREATE TABLE chore_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chore_id UUID NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  scheduled_date DATE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES members(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  photo_url TEXT,

  points_awarded INTEGER DEFAULT 0,
  streak_day INTEGER, -- Which day of user's streak this was

  -- Time tracking
  started_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_completions_chore ON chore_completions(chore_id);
CREATE INDEX idx_completions_member ON chore_completions(member_id);
CREATE INDEX idx_completions_date ON chore_completions(household_id, scheduled_date);
CREATE INDEX idx_completions_status ON chore_completions(household_id, status);
```

### 2.4 Chore Schedules View (Generated Daily Assignments)
```sql
CREATE TABLE chore_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chore_id UUID NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  assigned_to UUID NOT NULL REFERENCES members(id),
  is_completed BOOLEAN DEFAULT FALSE,
  completion_id UUID REFERENCES chore_completions(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(chore_id, scheduled_date, assigned_to)
);

CREATE INDEX idx_schedules_date ON chore_schedules(household_id, scheduled_date);
CREATE INDEX idx_schedules_member ON chore_schedules(assigned_to, scheduled_date);
```

---

## 3. Chore Templates

### 3.1 Categories
| Category | Icon | Count |
|----------|------|-------|
| Kitchen | 🍳 | 12 |
| Bathroom | 🚿 | 8 |
| Bedroom | 🛏️ | 8 |
| Living Room | 🛋️ | 6 |
| Outdoor | 🌳 | 8 |
| Pet Care | 🐕 | 6 |
| Laundry | 👕 | 5 |
| General | 🏠 | 7 |

### 3.2 Sample Templates

```typescript
const CHORE_TEMPLATES = [
  // Kitchen
  { title: 'Empty dishwasher', category: 'kitchen', icon: '🍽️', pointValue: 15, difficulty: 'easy', estimatedMinutes: 10, minAge: 6 },
  { title: 'Load dishwasher', category: 'kitchen', icon: '🍽️', pointValue: 15, difficulty: 'easy', estimatedMinutes: 10, minAge: 8 },
  { title: 'Wipe counters', category: 'kitchen', icon: '🧽', pointValue: 10, difficulty: 'easy', estimatedMinutes: 5, minAge: 5 },
  { title: 'Sweep kitchen floor', category: 'kitchen', icon: '🧹', pointValue: 15, difficulty: 'medium', estimatedMinutes: 10, minAge: 7 },
  { title: 'Take out trash', category: 'kitchen', icon: '🗑️', pointValue: 10, difficulty: 'easy', estimatedMinutes: 5, minAge: 8 },
  { title: 'Set the table', category: 'kitchen', icon: '🍴', pointValue: 10, difficulty: 'easy', estimatedMinutes: 5, minAge: 4 },
  { title: 'Clear the table', category: 'kitchen', icon: '🍴', pointValue: 10, difficulty: 'easy', estimatedMinutes: 5, minAge: 4 },
  { title: 'Wash dishes', category: 'kitchen', icon: '🧼', pointValue: 20, difficulty: 'medium', estimatedMinutes: 15, minAge: 10 },
  { title: 'Clean microwave', category: 'kitchen', icon: '📦', pointValue: 15, difficulty: 'medium', estimatedMinutes: 10, minAge: 10 },
  { title: 'Organize pantry', category: 'kitchen', icon: '🥫', pointValue: 25, difficulty: 'hard', estimatedMinutes: 20, minAge: 10 },
  { title: 'Clean refrigerator', category: 'kitchen', icon: '❄️', pointValue: 30, difficulty: 'hard', estimatedMinutes: 30, minAge: 12 },
  { title: 'Mop kitchen floor', category: 'kitchen', icon: '🧹', pointValue: 25, difficulty: 'hard', estimatedMinutes: 15, minAge: 10 },

  // Bathroom
  { title: 'Clean toilet', category: 'bathroom', icon: '🚽', pointValue: 20, difficulty: 'medium', estimatedMinutes: 10, minAge: 10 },
  { title: 'Clean sink', category: 'bathroom', icon: '🚰', pointValue: 10, difficulty: 'easy', estimatedMinutes: 5, minAge: 8 },
  { title: 'Clean mirror', category: 'bathroom', icon: '🪞', pointValue: 10, difficulty: 'easy', estimatedMinutes: 5, minAge: 7 },
  { title: 'Take out bathroom trash', category: 'bathroom', icon: '🗑️', pointValue: 5, difficulty: 'easy', estimatedMinutes: 2, minAge: 6 },
  { title: 'Organize bathroom cabinet', category: 'bathroom', icon: '🗄️', pointValue: 15, difficulty: 'medium', estimatedMinutes: 10, minAge: 10 },
  { title: 'Clean shower/tub', category: 'bathroom', icon: '🛁', pointValue: 25, difficulty: 'hard', estimatedMinutes: 20, minAge: 12 },
  { title: 'Replace toilet paper', category: 'bathroom', icon: '🧻', pointValue: 5, difficulty: 'easy', estimatedMinutes: 1, minAge: 5 },
  { title: 'Hang up towels', category: 'bathroom', icon: '🛀', pointValue: 5, difficulty: 'easy', estimatedMinutes: 2, minAge: 4 },

  // Bedroom
  { title: 'Make bed', category: 'bedroom', icon: '🛏️', pointValue: 10, difficulty: 'easy', estimatedMinutes: 3, minAge: 4 },
  { title: 'Pick up toys', category: 'bedroom', icon: '🧸', pointValue: 10, difficulty: 'easy', estimatedMinutes: 10, minAge: 3 },
  { title: 'Put away clothes', category: 'bedroom', icon: '👚', pointValue: 10, difficulty: 'easy', estimatedMinutes: 10, minAge: 5 },
  { title: 'Organize closet', category: 'bedroom', icon: '🚪', pointValue: 25, difficulty: 'hard', estimatedMinutes: 30, minAge: 10 },
  { title: 'Dust bedroom', category: 'bedroom', icon: '🧹', pointValue: 15, difficulty: 'medium', estimatedMinutes: 10, minAge: 8 },
  { title: 'Vacuum bedroom', category: 'bedroom', icon: '🧹', pointValue: 20, difficulty: 'medium', estimatedMinutes: 15, minAge: 10 },
  { title: 'Change bed sheets', category: 'bedroom', icon: '🛏️', pointValue: 20, difficulty: 'medium', estimatedMinutes: 15, minAge: 10 },
  { title: 'Organize desk', category: 'bedroom', icon: '📚', pointValue: 15, difficulty: 'medium', estimatedMinutes: 15, minAge: 8 },

  // Living Room
  { title: 'Tidy up living room', category: 'living_room', icon: '🛋️', pointValue: 15, difficulty: 'easy', estimatedMinutes: 10, minAge: 5 },
  { title: 'Dust living room', category: 'living_room', icon: '🧹', pointValue: 15, difficulty: 'medium', estimatedMinutes: 15, minAge: 8 },
  { title: 'Vacuum living room', category: 'living_room', icon: '🧹', pointValue: 20, difficulty: 'medium', estimatedMinutes: 15, minAge: 10 },
  { title: 'Organize bookshelf', category: 'living_room', icon: '📚', pointValue: 20, difficulty: 'medium', estimatedMinutes: 20, minAge: 8 },
  { title: 'Fluff pillows', category: 'living_room', icon: '🛋️', pointValue: 5, difficulty: 'easy', estimatedMinutes: 3, minAge: 4 },
  { title: 'Fold blankets', category: 'living_room', icon: '🛋️', pointValue: 5, difficulty: 'easy', estimatedMinutes: 3, minAge: 5 },

  // Outdoor
  { title: 'Water plants', category: 'outdoor', icon: '🌱', pointValue: 10, difficulty: 'easy', estimatedMinutes: 10, minAge: 5 },
  { title: 'Pull weeds', category: 'outdoor', icon: '🌿', pointValue: 20, difficulty: 'medium', estimatedMinutes: 20, minAge: 8 },
  { title: 'Rake leaves', category: 'outdoor', icon: '🍂', pointValue: 25, difficulty: 'hard', estimatedMinutes: 30, minAge: 10 },
  { title: 'Mow lawn', category: 'outdoor', icon: '🌳', pointValue: 40, difficulty: 'hard', estimatedMinutes: 45, minAge: 14 },
  { title: 'Sweep porch', category: 'outdoor', icon: '🧹', pointValue: 15, difficulty: 'medium', estimatedMinutes: 10, minAge: 8 },
  { title: 'Take out recycling', category: 'outdoor', icon: '♻️', pointValue: 10, difficulty: 'easy', estimatedMinutes: 5, minAge: 8 },
  { title: 'Bring in mail', category: 'outdoor', icon: '📬', pointValue: 5, difficulty: 'easy', estimatedMinutes: 2, minAge: 6 },
  { title: 'Wash car', category: 'outdoor', icon: '🚗', pointValue: 35, difficulty: 'hard', estimatedMinutes: 45, minAge: 12 },

  // Pet Care
  { title: 'Feed pet', category: 'pet_care', icon: '🐕', pointValue: 10, difficulty: 'easy', estimatedMinutes: 5, minAge: 5 },
  { title: 'Give pet water', category: 'pet_care', icon: '💧', pointValue: 5, difficulty: 'easy', estimatedMinutes: 2, minAge: 4 },
  { title: 'Walk dog', category: 'pet_care', icon: '🦮', pointValue: 25, difficulty: 'medium', estimatedMinutes: 20, minAge: 10 },
  { title: 'Clean litter box', category: 'pet_care', icon: '🐱', pointValue: 20, difficulty: 'medium', estimatedMinutes: 10, minAge: 10 },
  { title: 'Brush pet', category: 'pet_care', icon: '🐕', pointValue: 15, difficulty: 'easy', estimatedMinutes: 10, minAge: 7 },
  { title: 'Clean pet area', category: 'pet_care', icon: '🏠', pointValue: 20, difficulty: 'medium', estimatedMinutes: 15, minAge: 8 },

  // Laundry
  { title: 'Sort laundry', category: 'laundry', icon: '👕', pointValue: 10, difficulty: 'easy', estimatedMinutes: 5, minAge: 6 },
  { title: 'Load washing machine', category: 'laundry', icon: '🧺', pointValue: 15, difficulty: 'medium', estimatedMinutes: 10, minAge: 10 },
  { title: 'Move laundry to dryer', category: 'laundry', icon: '🧺', pointValue: 10, difficulty: 'easy', estimatedMinutes: 5, minAge: 8 },
  { title: 'Fold laundry', category: 'laundry', icon: '👚', pointValue: 15, difficulty: 'medium', estimatedMinutes: 15, minAge: 7 },
  { title: 'Put away laundry', category: 'laundry', icon: '👕', pointValue: 10, difficulty: 'easy', estimatedMinutes: 10, minAge: 6 },

  // General
  { title: 'Brush teeth', category: 'general', icon: '🦷', pointValue: 5, difficulty: 'easy', estimatedMinutes: 3, minAge: 3 },
  { title: 'Get ready for school', category: 'general', icon: '🎒', pointValue: 15, difficulty: 'easy', estimatedMinutes: 20, minAge: 5 },
  { title: 'Do homework', category: 'general', icon: '📖', pointValue: 25, difficulty: 'medium', estimatedMinutes: 30, minAge: 6 },
  { title: 'Practice instrument', category: 'general', icon: '🎵', pointValue: 20, difficulty: 'medium', estimatedMinutes: 20, minAge: 6 },
  { title: 'Read for 20 minutes', category: 'general', icon: '📚', pointValue: 15, difficulty: 'easy', estimatedMinutes: 20, minAge: 5 },
  { title: 'Pack lunch', category: 'general', icon: '🥪', pointValue: 15, difficulty: 'medium', estimatedMinutes: 10, minAge: 8 },
  { title: 'Get ready for bed', category: 'general', icon: '😴', pointValue: 10, difficulty: 'easy', estimatedMinutes: 15, minAge: 4 },
];
```

---

## 4. API Endpoints

### 4.1 Chore Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/households/:id/chores` | Create chore | Parent |
| GET | `/api/households/:id/chores` | List all chores | Member |
| GET | `/api/households/:id/chores/today` | Today's chores | Member |
| GET | `/api/households/:id/chores/:choreId` | Get chore details | Member |
| PATCH | `/api/households/:id/chores/:choreId` | Update chore | Parent |
| DELETE | `/api/households/:id/chores/:choreId` | Delete chore | Parent |

### 4.2 Template Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/chore-templates` | List all templates | Public |
| GET | `/api/chore-templates/categories` | List categories | Public |
| GET | `/api/chore-templates/age/:age` | Templates for age | Public |

### 4.3 Completion Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/households/:id/chores/:choreId/complete` | Mark complete | Member |
| GET | `/api/households/:id/completions` | List completions | Member |
| POST | `/api/households/:id/completions/:id/approve` | Approve | Parent |
| POST | `/api/households/:id/completions/:id/reject` | Reject | Parent |

---

## 5. Business Logic

### 5.1 Recurrence Calculation

```typescript
function getNextOccurrence(chore: Chore, lastCompletion?: Date): Date {
  const now = new Date();

  switch (chore.recurrenceType) {
    case 'once':
      return chore.startDate;

    case 'daily':
      return now; // Due every day

    case 'weekly':
      // Find next matching day of week
      const today = now.getDay();
      for (let i = 0; i < 7; i++) {
        const checkDay = (today + i) % 7;
        if (chore.recurrenceDays.includes(checkDay)) {
          const nextDate = new Date(now);
          nextDate.setDate(now.getDate() + i);
          return nextDate;
        }
      }
      break;

    case 'monthly':
      // Same day each month
      const nextMonth = new Date(now);
      if (now.getDate() > chore.startDate.getDate()) {
        nextMonth.setMonth(nextMonth.getMonth() + 1);
      }
      nextMonth.setDate(chore.startDate.getDate());
      return nextMonth;

    case 'after_completion':
      if (!lastCompletion) return now;
      const afterDate = new Date(lastCompletion);
      afterDate.setDate(afterDate.getDate() + chore.recurrenceAfterDays);
      return afterDate;

    case 'custom':
      if (!lastCompletion) return now;
      const customDate = new Date(lastCompletion);
      customDate.setDate(customDate.getDate() + chore.recurrenceInterval);
      return customDate;
  }

  return now;
}
```

### 5.2 Assignment Rotation

```typescript
function getNextAssignee(chore: Chore, members: Member[]): string {
  switch (chore.assignmentType) {
    case 'specific':
      // Return first assigned member
      return chore.assignedTo[0];

    case 'anyone':
      // Return null - anyone can claim
      return null;

    case 'rotation':
      // Round-robin through assigned members
      const validMembers = members.filter(m => chore.assignedTo.includes(m.id));
      const nextIndex = (chore.rotationIndex + 1) % validMembers.length;
      return validMembers[nextIndex].id;
  }
}
```

### 5.3 Points Calculation

```typescript
const DIFFICULTY_MULTIPLIERS = {
  easy: 1.0,
  medium: 1.5,
  hard: 2.0,
};

function calculatePoints(chore: Chore, completion: ChoreCompletion): number {
  let points = chore.pointValue;

  // Apply difficulty multiplier
  points *= DIFFICULTY_MULTIPLIERS[chore.difficulty];

  // Bonus for photo proof
  if (completion.photoUrl) {
    points += 5;
  }

  // Streak bonuses applied in gamification service

  return Math.round(points);
}
```

---

## 6. Implementation

### 6.1 Chore Service

```typescript
// apps/api/src/services/chore.service.ts
export class ChoreService {
  async createChore(householdId: string, userId: string, data: CreateChoreRequest) {
    const member = await this.verifyParentAccess(householdId, userId);

    const [chore] = await db.insert(chores).values({
      householdId,
      title: data.title,
      description: data.description,
      icon: data.icon || '✅',
      category: data.category || 'general',
      pointValue: data.pointValue || 10,
      difficulty: data.difficulty || 'medium',
      assignedTo: data.assignedTo || [],
      assignmentType: data.assignmentType || 'specific',
      recurrenceType: data.recurrenceType || 'once',
      recurrenceDays: data.recurrenceDays,
      recurrenceInterval: data.recurrenceInterval,
      recurrenceAfterDays: data.recurrenceAfterDays,
      startDate: data.startDate || new Date(),
      endDate: data.endDate,
      dueTime: data.dueTime,
      requiresApproval: data.requiresApproval || false,
      requiresPhoto: data.requiresPhoto || false,
      estimatedMinutes: data.estimatedMinutes,
      showTimer: data.showTimer || false,
      steps: data.steps,
      createdBy: member.id,
    }).returning();

    // Generate initial schedule if recurring
    if (chore.recurrenceType !== 'once') {
      await this.generateSchedule(chore);
    }

    // Emit real-time update
    this.emitToHousehold(householdId, 'chore:created', { chore });

    return chore;
  }

  async completeChore(
    householdId: string,
    choreId: string,
    memberId: string,
    data: CompleteChoreRequest
  ) {
    const chore = await db.query.chores.findFirst({
      where: and(
        eq(chores.id, choreId),
        eq(chores.householdId, householdId)
      ),
    });

    if (!chore) throw new NotFoundError('Chore not found');

    // Calculate points
    const points = calculatePoints(chore, { photoUrl: data.photoUrl });

    // Determine initial status
    const status = chore.requiresApproval ? 'pending' : 'approved';

    const [completion] = await db.insert(choreCompletions).values({
      choreId,
      householdId,
      memberId,
      scheduledDate: data.scheduledDate || new Date(),
      completedAt: new Date(),
      status,
      photoUrl: data.photoUrl,
      pointsAwarded: status === 'approved' ? points : 0,
      startedAt: data.startedAt,
      durationSeconds: data.durationSeconds,
    }).returning();

    // If auto-approved, award points immediately
    if (status === 'approved') {
      await this.awardPoints(memberId, points, 'chore_completion', choreId);
      await this.updateStreak(memberId);
      await this.checkBadges(memberId);
    }

    // Update schedule if exists
    await this.markScheduleCompleted(choreId, data.scheduledDate, memberId, completion.id);

    // Emit real-time update
    this.emitToHousehold(householdId, 'chore:completed', {
      completion,
      chore,
      memberId,
    });

    return completion;
  }

  async approveCompletion(householdId: string, completionId: string, approverId: string) {
    const completion = await db.query.choreCompletions.findFirst({
      where: eq(choreCompletions.id, completionId),
      with: { chore: true },
    });

    if (!completion) throw new NotFoundError('Completion not found');
    if (completion.status !== 'pending') {
      throw new BadRequestError('Completion already processed');
    }

    const points = calculatePoints(completion.chore, completion);

    await db.update(choreCompletions)
      .set({
        status: 'approved',
        approvedBy: approverId,
        approvedAt: new Date(),
        pointsAwarded: points,
      })
      .where(eq(choreCompletions.id, completionId));

    // Award points
    await this.awardPoints(completion.memberId, points, 'chore_completion', completion.choreId);
    await this.updateStreak(completion.memberId);
    await this.checkBadges(completion.memberId);

    // Emit real-time update
    this.emitToHousehold(householdId, 'completion:approved', {
      completionId,
      memberId: completion.memberId,
      points,
    });
  }

  async getTodaysChores(householdId: string, memberId?: string) {
    const today = new Date().toISOString().split('T')[0];

    let query = db.query.choreSchedules.findMany({
      where: and(
        eq(choreSchedules.householdId, householdId),
        eq(choreSchedules.scheduledDate, today),
        memberId ? eq(choreSchedules.assignedTo, memberId) : undefined,
      ),
      with: {
        chore: true,
        completion: true,
      },
      orderBy: [asc(choreSchedules.chore.dueTime)],
    });

    return query;
  }
}
```

---

## 7. Scheduling Job

### 7.1 Daily Schedule Generator

```typescript
// apps/api/src/jobs/generateSchedules.ts
import { CronJob } from 'cron';

// Run at midnight in each timezone
export const scheduleGeneratorJob = new CronJob('0 0 * * *', async () => {
  const households = await db.query.households.findMany({
    where: eq(households.isActive, true),
  });

  for (const household of households) {
    await generateDailySchedule(household.id);
  }
});

async function generateDailySchedule(householdId: string) {
  const today = new Date();
  const activeChores = await db.query.chores.findMany({
    where: and(
      eq(chores.householdId, householdId),
      eq(chores.isActive, true),
    ),
  });

  const members = await db.query.members.findMany({
    where: and(
      eq(members.householdId, householdId),
      eq(members.isActive, true),
    ),
  });

  for (const chore of activeChores) {
    if (!isDueToday(chore, today)) continue;

    const assignee = getNextAssignee(chore, members);

    // Check if schedule already exists
    const existing = await db.query.choreSchedules.findFirst({
      where: and(
        eq(choreSchedules.choreId, chore.id),
        eq(choreSchedules.scheduledDate, today),
        assignee ? eq(choreSchedules.assignedTo, assignee) : undefined,
      ),
    });

    if (!existing) {
      await db.insert(choreSchedules).values({
        choreId: chore.id,
        householdId,
        scheduledDate: today,
        assignedTo: assignee,
      });

      // Update rotation index
      if (chore.assignmentType === 'rotation') {
        await db.update(chores)
          .set({ rotationIndex: chore.rotationIndex + 1 })
          .where(eq(chores.id, chore.id));
      }
    }
  }
}
```

---

## 8. Real-Time Events

| Event | Payload | Description |
|-------|---------|-------------|
| `chore:created` | `{ chore }` | New chore created |
| `chore:updated` | `{ chore }` | Chore modified |
| `chore:deleted` | `{ choreId }` | Chore removed |
| `chore:completed` | `{ completion, chore, memberId }` | Chore marked complete |
| `completion:approved` | `{ completionId, memberId, points }` | Completion approved |
| `completion:rejected` | `{ completionId, memberId, reason }` | Completion rejected |
| `schedule:generated` | `{ date, count }` | Daily schedules created |

---

## 9. Error Handling

| Error Code | Message | HTTP Status |
|------------|---------|-------------|
| `CHORE_NOT_FOUND` | Chore not found | 404 |
| `CHORE_NOT_ASSIGNED` | Not assigned to this chore | 403 |
| `COMPLETION_NOT_FOUND` | Completion not found | 404 |
| `COMPLETION_ALREADY_PROCESSED` | Already approved/rejected | 400 |
| `INVALID_RECURRENCE` | Invalid recurrence configuration | 400 |

---

## 10. Photo Upload

### 10.1 Upload Flow

```typescript
// Pre-signed URL approach for S3/R2
async function getPhotoUploadUrl(householdId: string, choreId: string) {
  const key = `completions/${householdId}/${choreId}/${Date.now()}.jpg`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: 'image/jpeg',
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  const publicUrl = `${process.env.CDN_URL}/${key}`;

  return { uploadUrl, publicUrl };
}
```

---

**Document Version:** 1.0.0
**Next Review:** After Phase 1 implementation
