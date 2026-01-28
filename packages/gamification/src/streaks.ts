import { STREAK_CONFIG } from './config';

interface StreakData {
  current: number;
  longest: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
  freezesAvailable: number;
  freezesUsed: number;
}

interface StreakUpdateResult {
  newStreak: number;
  streakContinued: boolean;
  streakBroken: boolean;
  freezeUsed: boolean;
  milestoneReached: number | null;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(timezone?: string): string {
  const now = new Date();
  if (timezone) {
    return now.toLocaleDateString('en-CA', { timeZone: timezone }); // en-CA gives YYYY-MM-DD
  }
  return now.toISOString().split('T')[0];
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
export function getYesterdayDate(timezone?: string): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  if (timezone) {
    return now.toLocaleDateString('en-CA', { timeZone: timezone });
  }
  return now.toISOString().split('T')[0];
}

/**
 * Calculate days between two dates (YYYY-MM-DD format)
 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Update streak based on completion
 * Returns new streak state and any bonuses earned
 *
 * Logic:
 * - If completed today already, no change
 * - If completed yesterday, increment streak
 * - If missed 1 day, try to use freeze
 * - If missed 2+ days or no freeze, reset to 1
 */
export function updateStreak(
  streakData: StreakData,
  timezone?: string
): StreakUpdateResult {
  const today = getTodayDate(timezone);
  const yesterday = getYesterdayDate(timezone);

  // Already completed today
  if (streakData.lastCompletedDate === today) {
    return {
      newStreak: streakData.current,
      streakContinued: false,
      streakBroken: false,
      freezeUsed: false,
      milestoneReached: null,
    };
  }

  // First completion ever or continuing from yesterday
  if (streakData.lastCompletedDate === null) {
    return {
      newStreak: 1,
      streakContinued: false,
      streakBroken: false,
      freezeUsed: false,
      milestoneReached: null,
    };
  }

  // Completed yesterday - continue streak
  if (streakData.lastCompletedDate === yesterday) {
    const newStreak = streakData.current + 1;
    const milestones = [7, 14, 30, 60, 100, 365];
    const milestoneReached = milestones.includes(newStreak) ? newStreak : null;

    return {
      newStreak,
      streakContinued: true,
      streakBroken: false,
      freezeUsed: false,
      milestoneReached,
    };
  }

  // Missed days - check if we can use freeze
  const missedDays = daysBetween(streakData.lastCompletedDate, today);

  if (missedDays <= STREAK_CONFIG.MAX_FREEZE_RECOVERY_DAYS && streakData.freezesAvailable > 0) {
    // Use freeze to save streak
    const newStreak = streakData.current + 1;
    const milestones = [7, 14, 30, 60, 100, 365];
    const milestoneReached = milestones.includes(newStreak) ? newStreak : null;

    return {
      newStreak,
      streakContinued: true,
      streakBroken: false,
      freezeUsed: true,
      milestoneReached,
    };
  }

  // Streak broken - reset to 1
  return {
    newStreak: 1,
    streakContinued: false,
    streakBroken: true,
    freezeUsed: false,
    milestoneReached: null,
  };
}

/**
 * Check if streak is at risk (hasn't completed today and it's getting late)
 */
export function isStreakAtRisk(
  streakData: StreakData,
  currentHour: number,
  timezone?: string
): boolean {
  if (streakData.current === 0) return false;

  const today = getTodayDate(timezone);
  const alreadyCompletedToday = streakData.lastCompletedDate === today;

  // If completed today, not at risk
  if (alreadyCompletedToday) return false;

  // If it's evening (after 6pm) and haven't completed, at risk
  return currentHour >= 18;
}

/**
 * Get freeze purchase cost
 */
export function getFreezeCost(): number {
  return STREAK_CONFIG.FREEZE_COST;
}

/**
 * Check if can afford freeze
 */
export function canAffordFreeze(currentPoints: number): boolean {
  return currentPoints >= STREAK_CONFIG.FREEZE_COST;
}
