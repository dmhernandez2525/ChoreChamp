// Gamification types

export type BadgeCategory = 'streak' | 'volume' | 'time' | 'family' | 'special';
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type TransactionType =
  | 'chore_completion'
  | 'streak_bonus'
  | 'badge_bonus'
  | 'family_goal'
  | 'boss_battle'
  | 'reward_redemption'
  | 'streak_freeze_purchase'
  | 'manual_adjustment';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  criteria: BadgeCriteria;
  isHidden?: boolean;
}

export interface BadgeCriteria {
  type: string;
  threshold: number;
  timeframe?: 'day' | 'week' | 'month' | 'all-time';
  conditions?: Record<string, unknown>;
}

export interface PointTransaction {
  id: string;
  householdId: string;
  memberId: string;

  amount: number;
  balanceAfter: number;

  transactionType: TransactionType;
  referenceId: string | null;
  referenceType: string | null;

  description: string | null;

  createdAt: Date;
}

export interface StreakData {
  current: number;
  longest: number;
  lastCompletedDate: string | null;
  freezesAvailable: number;
  freezesUsed: number;
}

export interface LeaderboardEntry {
  rank: number;
  memberId: string;
  memberName: string;
  memberColor: string;
  totalPoints: number;
  completedChores: number;
}

export interface GamificationStats {
  pointsCurrent: number;
  pointsLifetime: number;
  streakCurrent: number;
  streakLongest: number;
  badgesEarned: number;
  badgesTotal: number;
  choresCompletedToday: number;
  choresCompletedWeek: number;
  choresCompletedTotal: number;
}

// Family Party System
export interface FamilyParty {
  householdId: string;
  healthCurrent: number;
  healthMax: number;
  weeklyGoal: number;
  weeklyProgress: number;
  bossActive: boolean;
  bossId: string | null;
}

export interface BossBattle {
  id: string;
  householdId: string;
  name: string;
  description: string;
  icon: string;
  healthMax: number;
  healthCurrent: number;
  pointReward: number;
  startedAt: Date;
  endsAt: Date;
  defeatedAt: Date | null;
}

// Celebration Events
export type CelebrationType =
  | 'chore_completed'
  | 'streak_milestone'
  | 'badge_earned'
  | 'family_goal'
  | 'boss_defeated';

export type AnimationType = 'confetti' | 'fireworks' | 'stars' | 'trophy';
export type AnimationIntensity = 'small' | 'medium' | 'large';

export interface CelebrationEvent {
  type: CelebrationType;
  memberId: string;
  data: {
    points?: number;
    streak?: number;
    badge?: Badge;
    goalName?: string;
  };
  animationType: AnimationType;
  intensity: AnimationIntensity;
  sound?: string;
}

// API Response types
export interface StreakUpdateResult {
  streakCurrent: number;
  isNewDay: boolean;
  milestoneReached: number | null;
  bonusAwarded: number;
}

export interface BadgeEarnedResult {
  badge: Badge;
  bonusAwarded: number;
}
