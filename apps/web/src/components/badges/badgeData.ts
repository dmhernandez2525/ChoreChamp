import type { Badge, BadgeCategory, BadgeRarity } from '@chorechamp/types';

export interface BadgeDefinition extends Badge {
  progress?: number;
  earned?: boolean;
  earnedAt?: Date;
}

// Streak badges
const streakBadges: Badge[] = [
  {
    id: 'streak-3',
    name: 'Getting Started',
    description: 'Complete chores for 3 days in a row',
    icon: '🌱',
    category: 'streak',
    rarity: 'common',
    criteria: { type: 'streak', threshold: 3 },
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Complete chores for 7 days in a row',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    criteria: { type: 'streak', threshold: 7 },
  },
  {
    id: 'streak-14',
    name: 'Two Week Titan',
    description: 'Complete chores for 14 days in a row',
    icon: '⚡',
    category: 'streak',
    rarity: 'rare',
    criteria: { type: 'streak', threshold: 14 },
  },
  {
    id: 'streak-30',
    name: 'Monthly Master',
    description: 'Complete chores for 30 days in a row',
    icon: '🏅',
    category: 'streak',
    rarity: 'epic',
    criteria: { type: 'streak', threshold: 30 },
  },
  {
    id: 'streak-100',
    name: 'Century Champion',
    description: 'Complete chores for 100 days in a row',
    icon: '👑',
    category: 'streak',
    rarity: 'legendary',
    criteria: { type: 'streak', threshold: 100 },
  },
];

// Volume badges
const volumeBadges: Badge[] = [
  {
    id: 'chores-10',
    name: 'Helping Hand',
    description: 'Complete 10 chores total',
    icon: '✋',
    category: 'volume',
    rarity: 'common',
    criteria: { type: 'total_chores', threshold: 10 },
  },
  {
    id: 'chores-50',
    name: 'Busy Bee',
    description: 'Complete 50 chores total',
    icon: '🐝',
    category: 'volume',
    rarity: 'common',
    criteria: { type: 'total_chores', threshold: 50 },
  },
  {
    id: 'chores-100',
    name: 'Century Cleaner',
    description: 'Complete 100 chores total',
    icon: '💯',
    category: 'volume',
    rarity: 'rare',
    criteria: { type: 'total_chores', threshold: 100 },
  },
  {
    id: 'chores-250',
    name: 'Dedicated Helper',
    description: 'Complete 250 chores total',
    icon: '⭐',
    category: 'volume',
    rarity: 'epic',
    criteria: { type: 'total_chores', threshold: 250 },
  },
  {
    id: 'chores-500',
    name: 'Chore Champion',
    description: 'Complete 500 chores total',
    icon: '🏆',
    category: 'volume',
    rarity: 'legendary',
    criteria: { type: 'total_chores', threshold: 500 },
  },
  {
    id: 'daily-5',
    name: 'Super Star',
    description: 'Complete 5 chores in a single day',
    icon: '🌟',
    category: 'volume',
    rarity: 'rare',
    criteria: { type: 'daily_chores', threshold: 5 },
  },
];

// Time-based badges
const timeBadges: Badge[] = [
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Complete a chore before 8 AM',
    icon: '🐦',
    category: 'time',
    rarity: 'common',
    criteria: { type: 'time_of_day', threshold: 8 },
  },
  {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    description: 'Complete 10 chores on weekends',
    icon: '📅',
    category: 'time',
    rarity: 'rare',
    criteria: { type: 'weekend_chores', threshold: 10 },
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete a chore faster than estimated time',
    icon: '⏱️',
    category: 'time',
    rarity: 'rare',
    criteria: { type: 'fast_completion', threshold: 1 },
  },
];

// Family/social badges
const familyBadges: Badge[] = [
  {
    id: 'team-player',
    name: 'Team Player',
    description: 'Complete a chore assigned to anyone',
    icon: '🤝',
    category: 'family',
    rarity: 'common',
    criteria: { type: 'help_others', threshold: 1 },
  },
  {
    id: 'family-helper',
    name: 'Family Helper',
    description: 'Help other family members complete 10 chores',
    icon: '👨‍👩‍👧‍👦',
    category: 'family',
    rarity: 'rare',
    criteria: { type: 'help_others', threshold: 10 },
  },
  {
    id: 'family-champion',
    name: 'Family Champion',
    description: 'Lead the leaderboard for a full week',
    icon: '🎖️',
    category: 'family',
    rarity: 'epic',
    criteria: { type: 'leaderboard_leader', threshold: 7, timeframe: 'week' },
  },
];

// Special badges
const specialBadges: Badge[] = [
  {
    id: 'first-chore',
    name: 'First Steps',
    description: 'Complete your very first chore',
    icon: '👣',
    category: 'special',
    rarity: 'common',
    criteria: { type: 'first_chore', threshold: 1 },
  },
  {
    id: 'first-reward',
    name: 'Treat Yourself',
    description: 'Redeem your first reward',
    icon: '🎁',
    category: 'special',
    rarity: 'common',
    criteria: { type: 'first_redemption', threshold: 1 },
  },
  {
    id: 'perfect-week',
    name: 'Perfect Week',
    description: 'Complete all assigned chores for a week',
    icon: '✨',
    category: 'special',
    rarity: 'epic',
    criteria: { type: 'perfect_week', threshold: 1 },
  },
  {
    id: 'boss-slayer',
    name: 'Boss Slayer',
    description: 'Help defeat a family boss battle',
    icon: '⚔️',
    category: 'special',
    rarity: 'epic',
    criteria: { type: 'boss_battle', threshold: 1 },
  },
  {
    id: 'collector',
    name: 'Badge Collector',
    description: 'Earn 10 different badges',
    icon: '📚',
    category: 'special',
    rarity: 'rare',
    criteria: { type: 'badge_count', threshold: 10 },
    isHidden: true,
  },
];

export const ALL_BADGES: Badge[] = [
  ...streakBadges,
  ...volumeBadges,
  ...timeBadges,
  ...familyBadges,
  ...specialBadges,
];

export const BADGE_CATEGORIES: { value: BadgeCategory; label: string; icon: string }[] = [
  { value: 'streak', label: 'Streaks', icon: '🔥' },
  { value: 'volume', label: 'Volume', icon: '📊' },
  { value: 'time', label: 'Time', icon: '⏰' },
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { value: 'special', label: 'Special', icon: '⭐' },
];

export const RARITY_COLORS: Record<BadgeRarity, string> = {
  common: 'border-gray-300 bg-gray-50',
  rare: 'border-blue-300 bg-blue-50',
  epic: 'border-purple-300 bg-purple-50',
  legendary: 'border-yellow-300 bg-yellow-50',
};

export const RARITY_LABELS: Record<BadgeRarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export const RARITY_TEXT_COLORS: Record<BadgeRarity, string> = {
  common: 'text-gray-600',
  rare: 'text-blue-600',
  epic: 'text-purple-600',
  legendary: 'text-yellow-600',
};
