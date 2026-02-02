// Mini-Game Arcade Logic (F9.3)

import type {
  GameDifficulty,
  GameResult,
  GameCategory,
  UnlockType,
} from '@chorechamp/types';

// Game configuration
export const GAME_CONFIG = {
  // Star thresholds (percentage of target score)
  starThresholds: {
    oneStar: 50,
    twoStars: 75,
    threeStars: 100,
  },

  // Combo system
  combo: {
    decayTime: 3000, // ms before combo resets
    maxMultiplier: 5,
    baseIncrement: 1,
  },

  // XP rewards
  xp: {
    basePerGame: 10,
    perfectBonus: 1.5,
    firstTimeBonus: 2.0,
    difficultyMultipliers: {
      easy: 1.0,
      medium: 1.5,
      hard: 2.0,
      expert: 3.0,
    } as Record<GameDifficulty, number>,
  },

  // Family night bonuses
  familyNight: {
    participationBonus: 1.5, // 50% bonus during family nights
    winnerBonus: 2.0,       // Double XP for game winners
    completionBonus: 20,    // Flat XP for completing all games
  },

  // Unlock requirements
  unlockDefaults: {
    chore_count: 10,
    points: 50,
    streak: 5,
    level: 5,
  } as Record<string, number>,
};

// Calculate stars based on score and target
export function calculateStars(score: number, targetScore: number): number {
  const percentage = (score / targetScore) * 100;
  const { starThresholds } = GAME_CONFIG;

  if (percentage >= starThresholds.threeStars) return 3;
  if (percentage >= starThresholds.twoStars) return 2;
  if (percentage >= starThresholds.oneStar) return 1;
  return 0;
}

// Calculate XP earned from a game
export function calculateGameXP(
  baseXP: number,
  difficulty: GameDifficulty,
  score: number,
  targetScore: number,
  isPerfect: boolean,
  isFirstTime: boolean,
  isFamilyNight: boolean,
  isWinner: boolean
): number {
  let xp = baseXP;

  // Apply difficulty multiplier
  xp *= GAME_CONFIG.xp.difficultyMultipliers[difficulty];

  // Apply score multiplier (0.5 to 1.5 based on performance)
  const scoreRatio = Math.min(score / targetScore, 1.5);
  xp *= 0.5 + (scoreRatio * 0.67);

  // Apply bonuses
  if (isPerfect) {
    xp *= GAME_CONFIG.xp.perfectBonus;
  }

  if (isFirstTime) {
    xp *= GAME_CONFIG.xp.firstTimeBonus;
  }

  if (isFamilyNight) {
    xp *= GAME_CONFIG.familyNight.participationBonus;
    if (isWinner) {
      xp *= GAME_CONFIG.familyNight.winnerBonus / GAME_CONFIG.familyNight.participationBonus;
    }
  }

  return Math.floor(xp);
}

// Calculate points earned from a game
export function calculateGamePoints(
  basePoints: number,
  difficulty: GameDifficulty,
  stars: number,
  isFamilyNight: boolean
): number {
  let points = basePoints;

  // Apply difficulty multiplier
  points *= GAME_CONFIG.xp.difficultyMultipliers[difficulty];

  // Apply star multiplier
  points *= 0.5 + (stars * 0.5); // 0.5x for 0 stars, up to 2x for 3 stars

  if (isFamilyNight) {
    points *= GAME_CONFIG.familyNight.participationBonus;
  }

  return Math.floor(points);
}

// Calculate combo multiplier
export function calculateComboMultiplier(combo: number): number {
  return Math.min(1 + (combo * 0.1), GAME_CONFIG.combo.maxMultiplier);
}

// Check if a game should be unlocked
export function checkGameUnlock(
  unlockType: UnlockType,
  unlockValue: number | null,
  memberStats: {
    choreCount: number;
    points: number;
    streakDays: number;
    level: number;
    achievements: string[];
  },
  unlockAchievementId: string | null
): { isUnlocked: boolean; progress: number; required: number } {
  if (unlockType === 'default') {
    return { isUnlocked: true, progress: 100, required: 100 };
  }

  if (unlockValue === null) {
    return { isUnlocked: true, progress: 100, required: 100 };
  }

  let currentValue = 0;

  switch (unlockType) {
    case 'chore_count':
      currentValue = memberStats.choreCount;
      break;
    case 'points':
      currentValue = memberStats.points;
      break;
    case 'streak':
      currentValue = memberStats.streakDays;
      break;
    case 'level':
      currentValue = memberStats.level;
      break;
    case 'achievement':
      if (unlockAchievementId && memberStats.achievements.includes(unlockAchievementId)) {
        return { isUnlocked: true, progress: 100, required: 100 };
      }
      return { isUnlocked: false, progress: 0, required: 1 };
  }

  const isUnlocked = currentValue >= unlockValue;
  const progress = Math.min(Math.round((currentValue / unlockValue) * 100), 100);

  return { isUnlocked, progress, required: unlockValue };
}

// Calculate game result
export function calculateGameResult(
  score: number,
  targetScore: number,
  timeElapsed: number,
  accuracy: number,
  combo: number,
  baseXP: number,
  basePoints: number,
  difficulty: GameDifficulty,
  previousHighScore: number,
  isFirstTime: boolean,
  isFamilyNight: boolean,
  isWinner: boolean
): GameResult {
  const stars = calculateStars(score, targetScore);
  const isPerfect = accuracy === 100 && stars === 3;

  const xpEarned = calculateGameXP(
    baseXP,
    difficulty,
    score,
    targetScore,
    isPerfect,
    isFirstTime,
    isFamilyNight,
    isWinner
  );

  const pointsEarned = calculateGamePoints(
    basePoints,
    difficulty,
    stars,
    isFamilyNight
  );

  const newHighScore = score > previousHighScore;

  return {
    success: stars > 0,
    score,
    timeElapsed,
    accuracy,
    combo,
    stars,
    xpEarned,
    pointsEarned,
    newHighScore,
    achievements: [], // Populated by the caller based on game achievements
    rankChange: null, // Populated by leaderboard comparison
  };
}

// Get unlock requirement text
export function getUnlockRequirementText(
  unlockType: UnlockType,
  unlockValue: number | null,
  currentProgress: number
): string {
  if (unlockType === 'default' || unlockValue === null) {
    return 'Available now!';
  }

  switch (unlockType) {
    case 'chore_count':
      return `Complete ${unlockValue} chores (${currentProgress}/${unlockValue})`;
    case 'points':
      return `Earn ${unlockValue} points (${currentProgress}/${unlockValue})`;
    case 'streak':
      return `Maintain a ${unlockValue}-day streak (${currentProgress}/${unlockValue})`;
    case 'level':
      return `Reach level ${unlockValue} (Current: ${currentProgress})`;
    case 'achievement':
      return 'Unlock special achievement';
    default:
      return 'Unknown requirement';
  }
}

// Get difficulty display info
export function getDifficultyInfo(difficulty: GameDifficulty): {
  label: string;
  color: string;
  bgColor: string;
  xpMultiplier: number;
} {
  switch (difficulty) {
    case 'easy':
      return {
        label: 'Easy',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        xpMultiplier: GAME_CONFIG.xp.difficultyMultipliers.easy,
      };
    case 'medium':
      return {
        label: 'Medium',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        xpMultiplier: GAME_CONFIG.xp.difficultyMultipliers.medium,
      };
    case 'hard':
      return {
        label: 'Hard',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        xpMultiplier: GAME_CONFIG.xp.difficultyMultipliers.hard,
      };
    case 'expert':
      return {
        label: 'Expert',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        xpMultiplier: GAME_CONFIG.xp.difficultyMultipliers.expert,
      };
    default:
      return {
        label: 'Unknown',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        xpMultiplier: 1,
      };
  }
}

// Get category display info
export function getCategoryInfo(category: GameCategory): {
  label: string;
  icon: string;
  color: string;
  description: string;
} {
  switch (category) {
    case 'puzzle':
      return {
        label: 'Puzzle',
        icon: '🧩',
        color: 'text-blue-600',
        description: 'Brain-teasing challenges that test your problem-solving skills',
      };
    case 'sorting':
      return {
        label: 'Sorting',
        icon: '📦',
        color: 'text-green-600',
        description: 'Organize items quickly and accurately',
      };
    case 'time-challenge':
      return {
        label: 'Time Challenge',
        icon: '⏱️',
        color: 'text-orange-600',
        description: 'Race against the clock to complete tasks',
      };
    case 'memory':
      return {
        label: 'Memory',
        icon: '🧠',
        color: 'text-purple-600',
        description: 'Test your memory and pattern recognition',
      };
    case 'multiplayer':
      return {
        label: 'Multiplayer',
        icon: '👥',
        color: 'text-pink-600',
        description: 'Compete or cooperate with family members',
      };
    default:
      return {
        label: 'Unknown',
        icon: '❓',
        color: 'text-gray-600',
        description: 'Unknown game category',
      };
  }
}

// Format time display
export function formatGameTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  return `${secs}s`;
}

// Calculate leaderboard rank change
export function calculateRankChange(
  previousRank: number | null,
  newRank: number
): number | null {
  if (previousRank === null) return null;
  return previousRank - newRank; // Positive = moved up, negative = moved down
}

// Get star display
export function getStarDisplay(stars: number): { filled: number; empty: number; color: string } {
  const color = stars === 3 ? 'text-yellow-500' :
                stars === 2 ? 'text-gray-400' :
                stars === 1 ? 'text-amber-700' : 'text-gray-300';

  return {
    filled: stars,
    empty: 3 - stars,
    color,
  };
}

// Validate game action
export function isValidGameAction(
  actionType: string,
  gameCategory: GameCategory,
  _gameState: Record<string, unknown>
): boolean {
  // Basic validation - more specific validation would be done per game type
  const validActions: Record<GameCategory, string[]> = {
    puzzle: ['move', 'swap', 'rotate', 'hint'],
    sorting: ['drag', 'drop', 'sort', 'undo'],
    'time-challenge': ['tap', 'swipe', 'hold', 'pattern'],
    memory: ['flip', 'match', 'hint'],
    multiplayer: ['move', 'action', 'powerup', 'ready'],
  };

  return validActions[gameCategory]?.includes(actionType) ?? false;
}
