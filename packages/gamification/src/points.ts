import type { Difficulty } from './config';
import { POINT_CONFIG } from './config';

interface ChorePointsInput {
  basePoints: number;
  difficulty: Difficulty;
  hasPhoto?: boolean;
  isEarlyCompletion?: boolean;
}

/**
 * Calculate points earned for completing a chore
 *
 * Factors:
 * - Base point value (set per chore)
 * - Difficulty multiplier (easy: 1x, medium: 1.5x, hard: 2x)
 * - Photo proof bonus (+5 points)
 * - Early completion bonus (+10%)
 */
export function calculateChorePoints(input: ChorePointsInput): number {
  let points = input.basePoints;

  // Apply difficulty multiplier
  const multiplier = POINT_CONFIG.DIFFICULTY[input.difficulty] || 1;
  points *= multiplier;

  // Photo proof bonus
  if (input.hasPhoto) {
    points += POINT_CONFIG.PHOTO_PROOF_BONUS;
  }

  // Early completion bonus
  if (input.isEarlyCompletion) {
    points *= 1 + POINT_CONFIG.EARLY_COMPLETION_BONUS;
  }

  return Math.round(points);
}

/**
 * Get streak bonus for a milestone day
 * Returns 0 if not a milestone
 */
export function getStreakBonus(streakDay: number): number {
  return POINT_CONFIG.STREAK_BONUS[streakDay] || 0;
}

/**
 * Get badge bonus by rarity
 */
export function getBadgeBonus(rarity: keyof typeof POINT_CONFIG.BADGE_BONUS): number {
  return POINT_CONFIG.BADGE_BONUS[rarity] || 0;
}

/**
 * Check if a streak day is a milestone (earns bonus)
 */
export function isStreakMilestone(streakDay: number): boolean {
  return streakDay in POINT_CONFIG.STREAK_BONUS;
}

/**
 * Get all streak milestones
 */
export function getStreakMilestones(): number[] {
  return Object.keys(POINT_CONFIG.STREAK_BONUS).map(Number).sort((a, b) => a - b);
}

/**
 * Get next streak milestone from current streak
 */
export function getNextStreakMilestone(currentStreak: number): number | null {
  const milestones = getStreakMilestones();
  return milestones.find(m => m > currentStreak) || null;
}

/**
 * Calculate progress to next milestone (0-1)
 */
export function getStreakMilestoneProgress(currentStreak: number): {
  current: number;
  next: number | null;
  progress: number;
} {
  const milestones = getStreakMilestones();
  const nextMilestone = milestones.find(m => m > currentStreak);
  const previousMilestone = milestones.filter(m => m <= currentStreak).pop() || 0;

  if (!nextMilestone) {
    return {
      current: currentStreak,
      next: null,
      progress: 1,
    };
  }

  const progress = (currentStreak - previousMilestone) / (nextMilestone - previousMilestone);

  return {
    current: currentStreak,
    next: nextMilestone,
    progress: Math.min(1, Math.max(0, progress)),
  };
}
