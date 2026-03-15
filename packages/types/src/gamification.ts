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

export interface BossBattleContributor {
  memberId: string;
  memberName: string;
  memberColor: string;
  damage: number;
  chores: number;
}

export interface BossBattleStats {
  party: FamilyParty;
  contributors: BossBattleContributor[];
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

// Activity Feed types
export type ActivityType =
  | 'chore_completed'
  | 'chore_approved'
  | 'chore_rejected'
  | 'points_earned'
  | 'points_spent'
  | 'badge_earned'
  | 'streak_milestone';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  memberId: string;
  memberName: string;
  memberColor: string;
  title: string;
  description: string;
  points?: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ActivityFeedResponse {
  activities: ActivityItem[];
  total: number;
  hasMore: boolean;
}

export interface ActivityStats {
  period: 'day' | 'week' | 'month';
  startDate: Date;
  summary: {
    totalCompleted: number;
    totalPoints: number;
    pendingApprovals: number;
  };
  memberStats: Array<{
    memberId: string;
    memberName: string;
    memberColor: string;
    completedCount: number;
    pointsEarned: number;
  }>;
}

// Report types
export interface ReportSummary {
  period: {
    start: Date;
    end: Date;
    days: number;
  };
  overall: {
    totalCompletions: number;
    totalPoints: number;
    approvedCount: number;
    rejectedCount: number;
    pendingCount: number;
    uniqueChores: number;
    uniqueMembers: number;
  };
  members: Array<{
    memberId: string;
    memberName: string;
    memberColor: string;
    memberRole: string;
    completions: number;
    points: number;
    currentStreak: number;
    longestStreak: number;
  }>;
  topChores: Array<{
    choreId: string;
    choreName: string;
    choreCategory: string;
    completions: number;
    totalPoints: number;
  }>;
}

export interface ReportTrend {
  period: {
    start: Date;
    end: Date;
  };
  trend: Array<{
    date: string;
    completions: number;
    points: number;
  }>;
}

export interface ReportCategories {
  period: {
    start: Date;
    end: Date;
  };
  categories: Array<{
    category: string;
    completions: number;
    points: number;
    uniqueChores: number;
  }>;
}

// Boss Battle API types
export interface CreateBossBattleRequest {
  name: string;
  description?: string;
  icon?: string;
  healthMax?: number;
  pointReward?: number;
  durationDays?: number;
}

export interface DamageBossRequest {
  damage: number;
}

export interface DamageBossResponse {
  battle: BossBattle;
  damageDealt: number;
  isDefeated: boolean;
}
