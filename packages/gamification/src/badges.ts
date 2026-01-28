import type { Badge, BadgeCategory, BadgeRarity } from '@chorechamp/types';

// Badge definitions - 15 starter badges for MVP
export const BADGE_DEFINITIONS: Badge[] = [
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

/**
 * Get badge by ID
 */
export function getBadgeById(id: string): Badge | undefined {
  return BADGE_DEFINITIONS.find((b) => b.id === id);
}

/**
 * Get badges by category
 */
export function getBadgesByCategory(category: BadgeCategory): Badge[] {
  return BADGE_DEFINITIONS.filter((b) => b.category === category);
}

/**
 * Get badges by rarity
 */
export function getBadgesByRarity(rarity: BadgeRarity): Badge[] {
  return BADGE_DEFINITIONS.filter((b) => b.rarity === rarity);
}

/**
 * Get visible badges (non-hidden)
 */
export function getVisibleBadges(): Badge[] {
  return BADGE_DEFINITIONS.filter((b) => !b.isHidden);
}

/**
 * Get all badge IDs
 */
export function getAllBadgeIds(): string[] {
  return BADGE_DEFINITIONS.map((b) => b.id);
}

/**
 * Get badge progress for a member
 */
export function getBadgeProgress(
  badgeId: string,
  currentValue: number
): { badge: Badge; progress: number; isComplete: boolean } | null {
  const badge = getBadgeById(badgeId);
  if (!badge) return null;

  const threshold = badge.criteria.threshold;
  const progress = Math.min(1, currentValue / threshold);

  return {
    badge,
    progress,
    isComplete: currentValue >= threshold,
  };
}

/**
 * Check if a badge can be earned based on criteria
 * This is a simple check - full evaluation happens server-side
 */
export function canEarnBadge(badge: Badge, earnedBadges: string[], value: number): boolean {
  // Already earned
  if (earnedBadges.includes(badge.id)) {
    return false;
  }

  // Check threshold
  return value >= badge.criteria.threshold;
}
