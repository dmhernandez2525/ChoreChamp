// Gamification configuration constants
// Based on research: Duolingo data, clinical evidence for ADHD users

export const POINT_CONFIG = {
  // Base chore values
  CHORE_BASE: 10,

  // Difficulty multipliers
  DIFFICULTY: {
    easy: 1.0,
    medium: 1.5,
    hard: 2.0,
  } as const,

  // Bonuses
  PHOTO_PROOF_BONUS: 5,
  EARLY_COMPLETION_BONUS: 0.1, // 10% bonus

  // Streak bonuses (milestone rewards)
  // Research: 7-day streak users are 3.6x more likely to retain
  STREAK_BONUS: {
    7: 50,     // 7-day streak
    14: 75,    // 2-week streak
    30: 200,   // Month streak
    60: 400,   // 2-month streak
    100: 500,  // 100-day streak
    365: 1000, // Year streak!
  } as Record<number, number>,

  // Badge bonuses by rarity
  BADGE_BONUS: {
    common: 10,
    rare: 25,
    epic: 50,
    legendary: 100,
  } as const,

  // Family/Party bonuses
  FAMILY_GOAL_BONUS: 100,
  BOSS_BATTLE_WIN: 200,
} as const;

export const STREAK_CONFIG = {
  // Freeze cost in points
  FREEZE_COST: 50,

  // Free freezes per week
  FREE_FREEZES_PER_WEEK: 1,

  // Maximum days that can be recovered with a freeze
  MAX_FREEZE_RECOVERY_DAYS: 2,
} as const;

export const FAMILY_PARTY_CONFIG = {
  // Health settings
  MAX_HEALTH: 100,
  INITIAL_HEALTH: 100,

  // Health changes
  HEALTH_LOSS_PER_MISS: 10,
  HEALTH_GAIN_PER_CHORE: 5,

  // Weekly goal defaults
  DEFAULT_WEEKLY_GOAL: 500,
} as const;

export type Difficulty = keyof typeof POINT_CONFIG.DIFFICULTY;
export type BadgeRarity = keyof typeof POINT_CONFIG.BADGE_BONUS;
