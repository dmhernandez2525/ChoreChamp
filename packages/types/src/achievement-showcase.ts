/**
 * Achievement Showcase - F8.3
 * Display and share achievements, badges, and accomplishments
 */
import { z } from 'zod';

// Achievement categories
export type AchievementCategory =
  | 'milestones'
  | 'streaks'
  | 'challenges'
  | 'special'
  | 'seasonal'
  | 'social'
  | 'mastery';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Core achievement structure
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  iconColor: string;
  points: number;
  requirements: AchievementRequirement[];
  unlockedAt: string | null;
  progress: number; // 0-100
  isSecret: boolean;
}

export interface AchievementRequirement {
  type: 'count' | 'streak' | 'time' | 'special';
  description: string;
  current: number;
  target: number;
}

// Earned achievement with context
export interface EarnedAchievement {
  id: string;
  achievementId: string;
  memberId: string;
  memberName: string;
  unlockedAt: string;
  showcased: boolean;
  shareCount: number;
}

// Showcase/profile display
export interface AchievementShowcase {
  memberId: string;
  memberName: string;
  avatarUrl?: string;
  title: string; // Custom title based on achievements
  level: number;
  totalPoints: number;
  featuredAchievements: Achievement[]; // Up to 5 featured
  recentAchievements: Achievement[];
  stats: ShowcaseStats;
  badges: ShowcaseBadge[];
}

export interface ShowcaseStats {
  totalAchievements: number;
  achievementsByCategory: Record<AchievementCategory, number>;
  achievementsByRarity: Record<AchievementRarity, number>;
  longestStreak: number;
  totalChoresCompleted: number;
  challengesWon: number;
  daysActive: number;
}

export interface ShowcaseBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: string;
  featured: boolean;
}

// Social sharing
export interface AchievementShare {
  id: string;
  achievementId: string;
  memberId: string;
  memberName: string;
  householdId: string;
  sharedAt: string;
  message?: string;
  reactions: ShareReaction[];
}

export interface ShareReaction {
  memberId: string;
  memberName: string;
  emoji: string;
  createdAt: string;
}

// Leaderboard for achievements
export interface AchievementLeaderboard {
  householdId: string;
  timeframe: 'week' | 'month' | 'all-time';
  entries: AchievementLeaderboardEntry[];
  myRank: number | null;
}

export interface AchievementLeaderboardEntry {
  rank: number;
  memberId: string;
  memberName: string;
  avatarUrl?: string;
  achievementCount: number;
  points: number;
  recentAchievement?: Achievement;
  isCurrentUser: boolean;
}

// Household achievement feed
export interface AchievementFeed {
  items: AchievementFeedItem[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface AchievementFeedItem {
  id: string;
  type: 'unlock' | 'milestone' | 'challenge_win' | 'level_up';
  memberId: string;
  memberName: string;
  achievement?: Achievement;
  details: string;
  timestamp: string;
  celebrationLevel: 'normal' | 'special' | 'epic';
}

// Request/response types
export interface UpdateShowcaseRequest {
  featuredAchievementIds?: string[];
  title?: string;
}

export interface ShareAchievementRequest {
  achievementId: string;
  message?: string;
}

export interface ReactToShareRequest {
  emoji: string;
}

// Achievement definitions
export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlockedAt' | 'progress'>[] = [
  // Milestones
  {
    id: 'first-chore',
    name: 'First Steps',
    description: 'Complete your first chore',
    category: 'milestones',
    rarity: 'common',
    icon: 'star',
    iconColor: '#FFD700',
    points: 10,
    requirements: [{ type: 'count', description: 'Complete 1 chore', current: 0, target: 1 }],
    isSecret: false,
  },
  {
    id: 'chore-apprentice',
    name: 'Chore Apprentice',
    description: 'Complete 10 chores',
    category: 'milestones',
    rarity: 'common',
    icon: 'award',
    iconColor: '#CD7F32',
    points: 25,
    requirements: [{ type: 'count', description: 'Complete 10 chores', current: 0, target: 10 }],
    isSecret: false,
  },
  {
    id: 'chore-expert',
    name: 'Chore Expert',
    description: 'Complete 50 chores',
    category: 'milestones',
    rarity: 'uncommon',
    icon: 'award',
    iconColor: '#C0C0C0',
    points: 75,
    requirements: [{ type: 'count', description: 'Complete 50 chores', current: 0, target: 50 }],
    isSecret: false,
  },
  {
    id: 'chore-master',
    name: 'Chore Master',
    description: 'Complete 100 chores',
    category: 'milestones',
    rarity: 'rare',
    icon: 'trophy',
    iconColor: '#FFD700',
    points: 150,
    requirements: [{ type: 'count', description: 'Complete 100 chores', current: 0, target: 100 }],
    isSecret: false,
  },
  {
    id: 'chore-legend',
    name: 'Chore Legend',
    description: 'Complete 500 chores',
    category: 'milestones',
    rarity: 'legendary',
    icon: 'crown',
    iconColor: '#9B59B6',
    points: 500,
    requirements: [{ type: 'count', description: 'Complete 500 chores', current: 0, target: 500 }],
    isSecret: false,
  },

  // Streaks
  {
    id: 'streak-starter',
    name: 'Streak Starter',
    description: 'Achieve a 3-day streak',
    category: 'streaks',
    rarity: 'common',
    icon: 'flame',
    iconColor: '#FF6B35',
    points: 15,
    requirements: [{ type: 'streak', description: '3-day streak', current: 0, target: 3 }],
    isSecret: false,
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Achieve a 7-day streak',
    category: 'streaks',
    rarity: 'uncommon',
    icon: 'flame',
    iconColor: '#FF4500',
    points: 50,
    requirements: [{ type: 'streak', description: '7-day streak', current: 0, target: 7 }],
    isSecret: false,
  },
  {
    id: 'month-champion',
    name: 'Month Champion',
    description: 'Achieve a 30-day streak',
    category: 'streaks',
    rarity: 'rare',
    icon: 'zap',
    iconColor: '#FFD700',
    points: 200,
    requirements: [{ type: 'streak', description: '30-day streak', current: 0, target: 30 }],
    isSecret: false,
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Achieve a 100-day streak',
    category: 'streaks',
    rarity: 'legendary',
    icon: 'infinity',
    iconColor: '#E74C3C',
    points: 750,
    requirements: [{ type: 'streak', description: '100-day streak', current: 0, target: 100 }],
    isSecret: false,
  },

  // Challenges
  {
    id: 'challenge-participant',
    name: 'Team Player',
    description: 'Participate in your first family challenge',
    category: 'challenges',
    rarity: 'common',
    icon: 'users',
    iconColor: '#3498DB',
    points: 20,
    requirements: [{ type: 'count', description: 'Join 1 challenge', current: 0, target: 1 }],
    isSecret: false,
  },
  {
    id: 'challenge-winner',
    name: 'Victor',
    description: 'Win a family challenge',
    category: 'challenges',
    rarity: 'uncommon',
    icon: 'medal',
    iconColor: '#FFD700',
    points: 100,
    requirements: [{ type: 'count', description: 'Win 1 challenge', current: 0, target: 1 }],
    isSecret: false,
  },
  {
    id: 'challenge-champion',
    name: 'Challenge Champion',
    description: 'Win 10 family challenges',
    category: 'challenges',
    rarity: 'epic',
    icon: 'trophy',
    iconColor: '#9B59B6',
    points: 350,
    requirements: [{ type: 'count', description: 'Win 10 challenges', current: 0, target: 10 }],
    isSecret: false,
  },

  // Special
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Complete a chore before 7 AM',
    category: 'special',
    rarity: 'uncommon',
    icon: 'sunrise',
    iconColor: '#F39C12',
    points: 30,
    requirements: [{ type: 'special', description: 'Complete chore before 7 AM', current: 0, target: 1 }],
    isSecret: false,
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Complete a chore after 10 PM',
    category: 'special',
    rarity: 'uncommon',
    icon: 'moon',
    iconColor: '#34495E',
    points: 30,
    requirements: [{ type: 'special', description: 'Complete chore after 10 PM', current: 0, target: 1 }],
    isSecret: false,
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete 5 chores in one day',
    category: 'special',
    rarity: 'rare',
    icon: 'zap',
    iconColor: '#E74C3C',
    points: 75,
    requirements: [{ type: 'special', description: 'Complete 5 chores in one day', current: 0, target: 5 }],
    isSecret: false,
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Get 10 chores verified without any issues',
    category: 'special',
    rarity: 'epic',
    icon: 'check-circle',
    iconColor: '#27AE60',
    points: 150,
    requirements: [{ type: 'special', description: 'Perfect verifications', current: 0, target: 10 }],
    isSecret: false,
  },

  // Mastery
  {
    id: 'kitchen-master',
    name: 'Kitchen Master',
    description: 'Complete 25 kitchen-related chores',
    category: 'mastery',
    rarity: 'rare',
    icon: 'utensils',
    iconColor: '#E67E22',
    points: 100,
    requirements: [{ type: 'count', description: '25 kitchen chores', current: 0, target: 25 }],
    isSecret: false,
  },
  {
    id: 'cleaning-pro',
    name: 'Cleaning Pro',
    description: 'Complete 25 cleaning-related chores',
    category: 'mastery',
    rarity: 'rare',
    icon: 'sparkles',
    iconColor: '#3498DB',
    points: 100,
    requirements: [{ type: 'count', description: '25 cleaning chores', current: 0, target: 25 }],
    isSecret: false,
  },
  {
    id: 'outdoor-expert',
    name: 'Outdoor Expert',
    description: 'Complete 25 outdoor-related chores',
    category: 'mastery',
    rarity: 'rare',
    icon: 'tree',
    iconColor: '#27AE60',
    points: 100,
    requirements: [{ type: 'count', description: '25 outdoor chores', current: 0, target: 25 }],
    isSecret: false,
  },

  // Secret achievements
  {
    id: 'secret-helper',
    name: 'Secret Helper',
    description: 'Complete someone else\'s assigned chore',
    category: 'social',
    rarity: 'epic',
    icon: 'gift',
    iconColor: '#9B59B6',
    points: 100,
    requirements: [{ type: 'special', description: '???', current: 0, target: 1 }],
    isSecret: true,
  },
  {
    id: 'midnight-hero',
    name: 'Midnight Hero',
    description: 'Complete a chore at exactly midnight',
    category: 'special',
    rarity: 'legendary',
    icon: 'clock',
    iconColor: '#2C3E50',
    points: 250,
    requirements: [{ type: 'special', description: '???', current: 0, target: 1 }],
    isSecret: true,
  },
];

// Helper functions
export function getAchievementById(id: string): typeof ACHIEVEMENT_DEFINITIONS[0] | undefined {
  return ACHIEVEMENT_DEFINITIONS.find((a) => a.id === id);
}

export function getAchievementsByCategory(category: AchievementCategory): typeof ACHIEVEMENT_DEFINITIONS {
  return ACHIEVEMENT_DEFINITIONS.filter((a) => a.category === category);
}

export function getRarityColor(rarity: AchievementRarity): string {
  const colors: Record<AchievementRarity, string> = {
    common: '#95A5A6',
    uncommon: '#27AE60',
    rare: '#3498DB',
    epic: '#9B59B6',
    legendary: '#F39C12',
  };
  return colors[rarity];
}

export function getRarityLabel(rarity: AchievementRarity): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

export function getAchievementCategoryLabel(category: AchievementCategory): string {
  const labels: Record<AchievementCategory, string> = {
    milestones: 'Milestones',
    streaks: 'Streaks',
    challenges: 'Challenges',
    special: 'Special',
    seasonal: 'Seasonal',
    social: 'Social',
    mastery: 'Mastery',
  };
  return labels[category];
}

export function getCategoryIcon(category: AchievementCategory): string {
  const icons: Record<AchievementCategory, string> = {
    milestones: 'flag',
    streaks: 'flame',
    challenges: 'trophy',
    special: 'star',
    seasonal: 'calendar',
    social: 'users',
    mastery: 'award',
  };
  return icons[category];
}

export function calculateLevel(points: number): { level: number; progress: number; pointsToNext: number } {
  // Level curve: level = floor(sqrt(points / 100))
  const level = Math.floor(Math.sqrt(points / 100)) + 1;
  const currentLevelPoints = Math.pow(level - 1, 2) * 100;
  const nextLevelPoints = Math.pow(level, 2) * 100;
  const pointsInLevel = points - currentLevelPoints;
  const pointsNeeded = nextLevelPoints - currentLevelPoints;
  const progress = Math.min(100, (pointsInLevel / pointsNeeded) * 100);

  return {
    level,
    progress,
    pointsToNext: nextLevelPoints - points,
  };
}

export function getTitleForLevel(level: number): string {
  const titles: Record<number, string> = {
    1: 'Newcomer',
    2: 'Helper',
    3: 'Contributor',
    4: 'Achiever',
    5: 'Expert',
    6: 'Master',
    7: 'Champion',
    8: 'Legend',
    9: 'Hero',
    10: 'Household Legend',
  };
  return titles[Math.min(level, 10)] || 'Ultimate Champion';
}

// Zod validation schemas
export const AchievementCategorySchema = z.enum([
  'milestones',
  'streaks',
  'challenges',
  'special',
  'seasonal',
  'social',
  'mastery',
]);

export const UpdateShowcaseRequestSchema = z.object({
  featuredAchievementIds: z.array(z.string()).max(5).optional(),
  title: z.string().min(1).max(50).optional(),
});

export const ShareAchievementRequestSchema = z.object({
  achievementId: z.string().min(1),
  message: z.string().max(500).optional(),
});

export const ReactToShareRequestSchema = z.object({
  emoji: z.string().min(1).max(10), // Single emoji or short emoji sequence
});

export const AchievementQuerySchema = z.object({
  memberId: z.string().optional(),
  category: AchievementCategorySchema.optional(),
});

export const LeaderboardQuerySchema = z.object({
  timeframe: z.enum(['week', 'month', 'all-time']).optional(),
});

export const FeedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).optional(),
});
