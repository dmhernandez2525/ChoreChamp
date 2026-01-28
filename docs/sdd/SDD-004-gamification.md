# SDD-004: Gamification Engine

**Status:** Draft
**Priority:** P0 (MVP)
**Author:** ChoreChamp Team
**Last Updated:** 2026-01-28

---

## 1. Overview

### 1.1 Purpose
Implement a comprehensive gamification system including points, streaks, badges, and family party mechanics. This is ChoreChamp's primary differentiator based on research showing competitors lack deep gamification.

### 1.2 Scope
- Points economy with earning and spending
- Streak tracking with freeze protection
- Badge system (15 MVP, expandable to 50+)
- Family party system (collective accountability)
- Celebration animations and feedback
- Leaderboard (collaborative framing)

### 1.3 Research Justification
- **7-day streak = 3.6x retention** (Duolingo data)
- **Streak freeze reduces churn by 21%** (Duolingo)
- **Badges boost completion by 30%** when meaningful (Duolingo)
- **Party accountability** is Habitica's most transferable mechanic
- **Frequent immediate rewards** essential for ADHD users (clinical evidence)

---

## 2. Architecture

### 2.1 Gamification Flow

```
┌─────────────────┐
│  Chore Complete │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Points Award   │──────────┐
└────────┬────────┘          │
         │                   │
         ▼                   ▼
┌─────────────────┐  ┌─────────────────┐
│  Streak Update  │  │  Badge Check    │
└────────┬────────┘  └────────┬────────┘
         │                    │
         └────────┬───────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Celebration    │
         │  Animation      │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Push to Family │
         │  Real-time      │
         └─────────────────┘
```

---

## 3. Points System

### 3.1 Database Schema

```sql
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  amount INTEGER NOT NULL, -- Positive = earn, Negative = spend
  balance_after INTEGER NOT NULL,

  transaction_type VARCHAR(50) NOT NULL,
  -- 'chore_completion', 'streak_bonus', 'badge_bonus',
  -- 'family_goal', 'reward_redemption', 'manual_adjustment'

  reference_id UUID, -- chore_id, badge_id, reward_id, etc.
  reference_type VARCHAR(50), -- 'chore', 'badge', 'reward'

  description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_member ON point_transactions(member_id);
CREATE INDEX idx_transactions_household ON point_transactions(household_id, created_at);
```

### 3.2 Point Values

```typescript
const POINT_CONFIG = {
  // Base chore values
  CHORE_BASE: 10,

  // Difficulty multipliers
  DIFFICULTY: {
    easy: 1.0,
    medium: 1.5,
    hard: 2.0,
  },

  // Bonuses
  PHOTO_PROOF_BONUS: 5,
  EARLY_COMPLETION_BONUS: 0.1, // 10% bonus

  // Streak bonuses (milestone rewards)
  STREAK_BONUS: {
    7: 50,    // 7-day streak
    14: 75,   // 2-week streak
    30: 200,  // Month streak
    60: 400,  // 2-month streak
    100: 500, // 100-day streak
    365: 1000, // Year streak!
  },

  // Badge bonuses
  BADGE_BONUS: {
    common: 10,
    rare: 25,
    epic: 50,
    legendary: 100,
  },

  // Family goals
  FAMILY_GOAL_BONUS: 100,
  BOSS_BATTLE_WIN: 200,
};
```

### 3.3 Points Service

```typescript
// packages/gamification/src/points.ts
export class PointsService {
  async awardPoints(
    memberId: string,
    amount: number,
    type: TransactionType,
    referenceId?: string,
    description?: string
  ): Promise<PointTransaction> {
    return db.transaction(async (tx) => {
      // Get current balance
      const member = await tx.query.members.findFirst({
        where: eq(members.id, memberId),
      });

      const newBalance = member.pointsCurrent + amount;

      // Update member points
      await tx.update(members)
        .set({
          pointsCurrent: newBalance,
          pointsLifetime: sql`points_lifetime + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(members.id, memberId));

      // Record transaction
      const [transaction] = await tx.insert(pointTransactions).values({
        householdId: member.householdId,
        memberId,
        amount,
        balanceAfter: newBalance,
        transactionType: type,
        referenceId,
        referenceType: getReferenceType(type),
        description,
      }).returning();

      return transaction;
    });
  }

  async spendPoints(
    memberId: string,
    amount: number,
    type: TransactionType,
    referenceId: string
  ): Promise<PointTransaction> {
    const member = await db.query.members.findFirst({
      where: eq(members.id, memberId),
    });

    if (member.pointsCurrent < amount) {
      throw new BadRequestError('Insufficient points');
    }

    return this.awardPoints(
      memberId,
      -amount, // Negative for spending
      type,
      referenceId
    );
  }

  calculateChorePoints(chore: Chore, completion: ChoreCompletion): number {
    let points = chore.pointValue;

    // Difficulty multiplier
    points *= POINT_CONFIG.DIFFICULTY[chore.difficulty];

    // Photo bonus
    if (completion.photoUrl) {
      points += POINT_CONFIG.PHOTO_PROOF_BONUS;
    }

    // Early completion bonus (completed before due time)
    if (chore.dueTime && completion.completedAt < combineDateAndTime(completion.scheduledDate, chore.dueTime)) {
      points *= (1 + POINT_CONFIG.EARLY_COMPLETION_BONUS);
    }

    return Math.round(points);
  }
}
```

---

## 4. Streak System

### 4.1 Streak Logic

```typescript
// packages/gamification/src/streaks.ts
export class StreakService {
  async updateStreak(memberId: string): Promise<StreakResult> {
    const member = await db.query.members.findFirst({
      where: eq(members.id, memberId),
    });

    const today = getLocalDate(member.householdId);
    const yesterday = subDays(today, 1);

    // Check if already completed today
    if (member.streakLastCompletedDate === today) {
      return {
        streakCurrent: member.streakCurrent,
        isNewDay: false,
        milestoneReached: null,
      };
    }

    let newStreak: number;
    let milestoneReached: number | null = null;

    if (member.streakLastCompletedDate === yesterday) {
      // Continuing streak
      newStreak = member.streakCurrent + 1;
    } else if (member.streakLastCompletedDate === null) {
      // First completion ever
      newStreak = 1;
    } else {
      // Streak broken - check for freeze
      const freezeUsed = await this.tryUseStreakFreeze(memberId, member);
      if (freezeUsed) {
        newStreak = member.streakCurrent + 1;
      } else {
        newStreak = 1; // Reset
      }
    }

    // Check for milestone
    if (POINT_CONFIG.STREAK_BONUS[newStreak]) {
      milestoneReached = newStreak;
    }

    // Update member
    await db.update(members)
      .set({
        streakCurrent: newStreak,
        streakLongest: Math.max(newStreak, member.streakLongest),
        streakLastCompletedDate: today,
        updatedAt: new Date(),
      })
      .where(eq(members.id, memberId));

    // Award streak bonus if milestone
    if (milestoneReached) {
      await this.awardStreakBonus(memberId, milestoneReached);
    }

    return {
      streakCurrent: newStreak,
      isNewDay: true,
      milestoneReached,
    };
  }

  private async tryUseStreakFreeze(memberId: string, member: Member): Promise<boolean> {
    if (member.streakFreezesAvailable <= 0) {
      return false;
    }

    // Check if missed only 1 day (can freeze)
    const missedDays = daysBetween(member.streakLastCompletedDate, getLocalDate());
    if (missedDays > 2) {
      // Missed too many days, can't freeze
      return false;
    }

    // Use freeze
    await db.update(members)
      .set({
        streakFreezesAvailable: member.streakFreezesAvailable - 1,
        streakFreezesUsed: member.streakFreezesUsed + 1,
      })
      .where(eq(members.id, memberId));

    return true;
  }

  async purchaseStreakFreeze(memberId: string): Promise<void> {
    const FREEZE_COST = 50; // Points

    const member = await db.query.members.findFirst({
      where: eq(members.id, memberId),
    });

    if (member.pointsCurrent < FREEZE_COST) {
      throw new BadRequestError('Insufficient points');
    }

    await db.transaction(async (tx) => {
      await tx.update(members)
        .set({
          streakFreezesAvailable: member.streakFreezesAvailable + 1,
          pointsCurrent: member.pointsCurrent - FREEZE_COST,
        })
        .where(eq(members.id, memberId));

      await tx.insert(pointTransactions).values({
        memberId,
        householdId: member.householdId,
        amount: -FREEZE_COST,
        balanceAfter: member.pointsCurrent - FREEZE_COST,
        transactionType: 'streak_freeze_purchase',
        description: 'Purchased streak freeze',
      });
    });
  }

  private async awardStreakBonus(memberId: string, milestone: number): Promise<void> {
    const bonus = POINT_CONFIG.STREAK_BONUS[milestone];
    if (!bonus) return;

    await this.pointsService.awardPoints(
      memberId,
      bonus,
      'streak_bonus',
      null,
      `${milestone}-day streak bonus!`
    );
  }

  // Reset streak freezes weekly (called by cron job)
  async resetWeeklyFreezes(householdId: string): Promise<void> {
    await db.update(members)
      .set({ streakFreezesAvailable: 1 })
      .where(eq(members.householdId, householdId));
  }
}
```

### 4.2 Family Streak

```typescript
async updateFamilyStreak(householdId: string): Promise<void> {
  const today = getLocalDate(householdId);

  // Get all active members who have chores
  const membersWithChores = await db.query.members.findMany({
    where: and(
      eq(members.householdId, householdId),
      eq(members.isActive, true),
      eq(members.role, 'child'), // Only track children's streaks for family
    ),
  });

  // Check if ALL members completed today
  const allCompleted = membersWithChores.every(
    m => m.streakLastCompletedDate === today
  );

  if (!allCompleted) return;

  const household = await db.query.households.findFirst({
    where: eq(households.id, householdId),
  });

  // Update family streak
  const newStreak = household.currentFamilyStreak + 1;

  await db.update(households)
    .set({
      currentFamilyStreak: newStreak,
      longestFamilyStreak: Math.max(newStreak, household.longestFamilyStreak),
    })
    .where(eq(households.id, householdId));

  // Award family bonus if milestone
  if (POINT_CONFIG.STREAK_BONUS[newStreak]) {
    // Award bonus to all family members
    for (const member of membersWithChores) {
      await this.pointsService.awardPoints(
        member.id,
        POINT_CONFIG.FAMILY_GOAL_BONUS,
        'family_streak',
        householdId,
        `Family ${newStreak}-day streak!`
      );
    }
  }
}
```

---

## 5. Badge System

### 5.1 Badge Definitions

```typescript
// packages/gamification/src/badges.ts
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'volume' | 'time' | 'family' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  criteria: BadgeCriteria;
  isHidden?: boolean; // Secret badges
}

interface BadgeCriteria {
  type: string;
  threshold: number;
  timeframe?: 'day' | 'week' | 'month' | 'all-time';
  conditions?: Record<string, any>;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ===== STREAK BADGES =====
  {
    id: 'flame_keeper',
    name: 'Flame Keeper',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    criteria: { type: 'streak', threshold: 7 },
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Maintain a 30-day streak',
    icon: '⚡',
    category: 'streak',
    rarity: 'rare',
    criteria: { type: 'streak', threshold: 30 },
  },
  {
    id: 'legendary_streak',
    name: 'Legendary',
    description: 'Maintain a 100-day streak',
    icon: '👑',
    category: 'streak',
    rarity: 'legendary',
    criteria: { type: 'streak', threshold: 100 },
  },

  // ===== VOLUME BADGES =====
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first chore',
    icon: '👣',
    category: 'volume',
    rarity: 'common',
    criteria: { type: 'total_completions', threshold: 1 },
  },
  {
    id: 'getting_started',
    name: 'Getting Started',
    description: 'Complete 10 chores',
    icon: '🌟',
    category: 'volume',
    rarity: 'common',
    criteria: { type: 'total_completions', threshold: 10 },
  },
  {
    id: 'chore_champion',
    name: 'Chore Champion',
    description: 'Complete 50 chores',
    icon: '🏆',
    category: 'volume',
    rarity: 'rare',
    criteria: { type: 'total_completions', threshold: 50 },
  },
  {
    id: 'century_club',
    name: 'Century Club',
    description: 'Complete 100 chores',
    icon: '💯',
    category: 'volume',
    rarity: 'epic',
    criteria: { type: 'total_completions', threshold: 100 },
  },
  {
    id: 'chore_master',
    name: 'Chore Master',
    description: 'Complete 500 chores',
    icon: '🎖️',
    category: 'volume',
    rarity: 'legendary',
    criteria: { type: 'total_completions', threshold: 500 },
  },

  // ===== TIME BADGES =====
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete a chore before 8am',
    icon: '🐦',
    category: 'time',
    rarity: 'common',
    criteria: { type: 'completion_time', threshold: 8, conditions: { before: true } },
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete a chore after 8pm',
    icon: '🦉',
    category: 'time',
    rarity: 'common',
    criteria: { type: 'completion_time', threshold: 20, conditions: { after: true } },
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Complete all weekend chores',
    icon: '⚔️',
    category: 'time',
    rarity: 'rare',
    criteria: { type: 'weekend_completion', threshold: 1 },
  },

  // ===== FAMILY BADGES =====
  {
    id: 'team_player',
    name: 'Team Player',
    description: 'Help achieve a family goal',
    icon: '🤝',
    category: 'family',
    rarity: 'common',
    criteria: { type: 'family_goal', threshold: 1 },
  },
  {
    id: 'helpful_hero',
    name: 'Helpful Hero',
    description: 'Complete 10 "anyone can do" chores',
    icon: '🦸',
    category: 'family',
    rarity: 'rare',
    criteria: { type: 'anyone_chores', threshold: 10 },
  },
  {
    id: 'family_mvp',
    name: 'Family MVP',
    description: 'Earn the most points in a week',
    icon: '🌟',
    category: 'family',
    rarity: 'rare',
    criteria: { type: 'weekly_leader', threshold: 1 },
  },

  // ===== SPECIAL/MILESTONE BADGES =====
  {
    id: 'week_one',
    name: 'Week One',
    description: 'Use ChoreChamp for a week',
    icon: '📅',
    category: 'special',
    rarity: 'common',
    criteria: { type: 'account_age', threshold: 7 },
  },
  {
    id: 'completionist',
    name: 'Completionist',
    description: 'Earn all other badges',
    icon: '🏅',
    category: 'special',
    rarity: 'legendary',
    criteria: { type: 'all_badges', threshold: 1 },
    isHidden: true,
  },
];
```

### 5.2 Badge Evaluation Engine

```typescript
export class BadgeService {
  async evaluateBadges(
    memberId: string,
    trigger: 'chore_completed' | 'streak_updated' | 'daily_check'
  ): Promise<BadgeDefinition[]> {
    const member = await db.query.members.findFirst({
      where: eq(members.id, memberId),
    });

    const earnedBadgeIds = member.badges || [];
    const newlyEarnedBadges: BadgeDefinition[] = [];

    for (const badge of BADGE_DEFINITIONS) {
      // Skip if already earned
      if (earnedBadgeIds.includes(badge.id)) continue;

      // Check eligibility
      const isEligible = await this.checkCriteria(member, badge.criteria);

      if (isEligible) {
        newlyEarnedBadges.push(badge);
        await this.awardBadge(memberId, badge);
      }
    }

    return newlyEarnedBadges;
  }

  private async checkCriteria(member: Member, criteria: BadgeCriteria): Promise<boolean> {
    switch (criteria.type) {
      case 'streak':
        return member.streakCurrent >= criteria.threshold;

      case 'total_completions':
        const completions = await db.query.choreCompletions.findMany({
          where: and(
            eq(choreCompletions.memberId, member.id),
            eq(choreCompletions.status, 'approved'),
          ),
        });
        return completions.length >= criteria.threshold;

      case 'completion_time':
        const recentCompletion = await db.query.choreCompletions.findFirst({
          where: eq(choreCompletions.memberId, member.id),
          orderBy: desc(choreCompletions.completedAt),
        });
        if (!recentCompletion) return false;
        const hour = new Date(recentCompletion.completedAt).getHours();
        if (criteria.conditions?.before) {
          return hour < criteria.threshold;
        }
        if (criteria.conditions?.after) {
          return hour >= criteria.threshold;
        }
        return false;

      case 'anyone_chores':
        const anyoneCompletions = await this.countAnyoneChoreCompletions(member.id);
        return anyoneCompletions >= criteria.threshold;

      case 'account_age':
        const daysSinceCreation = daysBetween(member.createdAt, new Date());
        return daysSinceCreation >= criteria.threshold;

      case 'family_goal':
        // Check if participated in family goal achievement
        return await this.hasAchievedFamilyGoal(member.id);

      case 'weekly_leader':
        return await this.wasWeeklyLeader(member.id);

      case 'weekend_completion':
        return await this.completedAllWeekendChores(member.id);

      case 'all_badges':
        const totalBadges = BADGE_DEFINITIONS.filter(b => !b.isHidden).length;
        return member.badges.length >= totalBadges - 1; // Exclude this badge

      default:
        return false;
    }
  }

  private async awardBadge(memberId: string, badge: BadgeDefinition): Promise<void> {
    const member = await db.query.members.findFirst({
      where: eq(members.id, memberId),
    });

    // Add badge to member
    await db.update(members)
      .set({
        badges: [...(member.badges || []), badge.id],
        updatedAt: new Date(),
      })
      .where(eq(members.id, memberId));

    // Award points bonus
    const bonus = POINT_CONFIG.BADGE_BONUS[badge.rarity];
    await this.pointsService.awardPoints(
      memberId,
      bonus,
      'badge_bonus',
      badge.id,
      `Earned "${badge.name}" badge!`
    );

    // Emit celebration event
    this.emitToMember(memberId, 'badge:earned', { badge });
  }
}
```

---

## 6. Family Party System (P1)

### 6.1 Party Health Concept

```typescript
interface FamilyParty {
  householdId: string;
  healthCurrent: number;  // 0-100
  healthMax: number;      // 100
  weeklyGoal: number;     // Point target for the week
  weeklyProgress: number; // Current week's points
}

// When a member misses their daily chores, family loses health
async function onMissedChores(memberId: string): Promise<void> {
  const HEALTH_LOSS_PER_MISS = 10;

  const household = await getHousehold(memberId);

  await db.update(familyParties)
    .set({
      healthCurrent: sql`GREATEST(health_current - ${HEALTH_LOSS_PER_MISS}, 0)`,
    })
    .where(eq(familyParties.householdId, household.id));

  // Notify family
  this.emitToHousehold(household.id, 'party:health_lost', {
    memberId,
    healthLost: HEALTH_LOSS_PER_MISS,
  });
}

// When someone completes chores, party heals
async function onChoreCompleted(memberId: string, points: number): Promise<void> {
  const HEALTH_GAIN_PER_CHORE = 5;

  const household = await getHousehold(memberId);

  await db.update(familyParties)
    .set({
      healthCurrent: sql`LEAST(health_current + ${HEALTH_GAIN_PER_CHORE}, health_max)`,
      weeklyProgress: sql`weekly_progress + ${points}`,
    })
    .where(eq(familyParties.householdId, household.id));
}
```

---

## 7. Celebration System

### 7.1 Celebration Events

```typescript
interface CelebrationEvent {
  type: 'chore_completed' | 'streak_milestone' | 'badge_earned' | 'family_goal' | 'boss_defeated';
  memberId: string;
  data: {
    points?: number;
    streak?: number;
    badge?: BadgeDefinition;
    goalName?: string;
  };
  animationType: 'confetti' | 'fireworks' | 'stars' | 'trophy';
  sound?: string;
}

// Emit celebration to client
function triggerCelebration(event: CelebrationEvent): void {
  // Determine animation intensity based on achievement
  let intensity: 'small' | 'medium' | 'large' = 'small';

  if (event.type === 'streak_milestone' && event.data.streak >= 30) {
    intensity = 'large';
  } else if (event.type === 'badge_earned' && event.data.badge.rarity === 'legendary') {
    intensity = 'large';
  } else if (event.type === 'streak_milestone' || event.type === 'badge_earned') {
    intensity = 'medium';
  }

  this.emitToMember(event.memberId, 'celebration', {
    ...event,
    intensity,
  });
}
```

### 7.2 Client-Side Animation Config

```typescript
// packages/ui/src/animations/celebrations.ts
export const CELEBRATION_CONFIG = {
  confetti: {
    small: { particles: 50, duration: 2000 },
    medium: { particles: 100, duration: 3000 },
    large: { particles: 200, duration: 4000 },
  },
  sounds: {
    chore_completed: '/sounds/chime.mp3',
    streak_milestone: '/sounds/fanfare.mp3',
    badge_earned: '/sounds/achievement.mp3',
    boss_defeated: '/sounds/victory.mp3',
  },
};
```

---

## 8. Leaderboard (P1)

### 8.1 Weekly Leaderboard

```typescript
async function getWeeklyLeaderboard(householdId: string): Promise<LeaderboardEntry[]> {
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());

  const results = await db
    .select({
      memberId: members.id,
      memberName: members.name,
      memberColor: members.color,
      totalPoints: sql<number>`COALESCE(SUM(${pointTransactions.amount}), 0)`,
      completedChores: sql<number>`COUNT(DISTINCT ${choreCompletions.id})`,
    })
    .from(members)
    .leftJoin(
      pointTransactions,
      and(
        eq(pointTransactions.memberId, members.id),
        gte(pointTransactions.createdAt, weekStart),
        lte(pointTransactions.createdAt, weekEnd),
        gt(pointTransactions.amount, 0), // Only earnings
      )
    )
    .leftJoin(
      choreCompletions,
      and(
        eq(choreCompletions.memberId, members.id),
        eq(choreCompletions.status, 'approved'),
        gte(choreCompletions.completedAt, weekStart),
        lte(choreCompletions.completedAt, weekEnd),
      )
    )
    .where(
      and(
        eq(members.householdId, householdId),
        eq(members.isActive, true),
        inArray(members.role, ['child', 'teen']), // Only show kids
      )
    )
    .groupBy(members.id)
    .orderBy(desc(sql`COALESCE(SUM(${pointTransactions.amount}), 0)`));

  return results.map((r, index) => ({
    rank: index + 1,
    ...r,
  }));
}
```

### 8.2 Collaborative Framing

Instead of showing "1st, 2nd, 3rd" we show:
- "Family contribution this week"
- "Everyone's helping out!"
- Weekly MVP rotates through all active members

---

## 9. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/households/:id/gamification/stats` | Member's gamification stats |
| GET | `/api/households/:id/gamification/leaderboard` | Weekly leaderboard |
| GET | `/api/households/:id/gamification/badges` | Available badges |
| POST | `/api/households/:id/gamification/streak-freeze` | Purchase streak freeze |
| GET | `/api/households/:id/gamification/party` | Family party status |

---

## 10. Real-Time Events

| Event | Payload | Description |
|-------|---------|-------------|
| `points:earned` | `{ memberId, amount, total, type }` | Points awarded |
| `points:spent` | `{ memberId, amount, total, type }` | Points spent |
| `streak:updated` | `{ memberId, current, longest }` | Streak changed |
| `streak:broken` | `{ memberId, previous }` | Streak lost |
| `badge:earned` | `{ memberId, badge }` | New badge unlocked |
| `celebration` | `{ type, data, intensity }` | Trigger celebration |
| `party:health_changed` | `{ current, max, delta }` | Family health change |
| `leaderboard:updated` | `{ leaderboard }` | Rankings changed |

---

## 11. ADHD Considerations

Based on clinical research, ADHD users need:

1. **Frequent immediate rewards** - Award points instantly, not delayed
2. **Visual progress** - Show streaks, points, badges prominently
3. **Smaller, achievable goals** - Task chunking built into chore steps
4. **Forgiving systems** - Streak freeze, no harsh punishments
5. **Consistent feedback** - Same celebration pattern every time

---

**Document Version:** 1.0.0
**Next Review:** After Phase 1 implementation
