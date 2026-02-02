// Character XP and Progression System (F9.1)
// Handles XP calculation, level progression, and stat bonuses

import type {
  CharacterClass,
  CharacterStat,
  CharacterStats,
  CharacterLevel,
  LevelUnlock,
  CharacterConfig,
} from '@chorechamp/types';

// Character system configuration
export const CHARACTER_CONFIG: CharacterConfig = {
  maxLevel: 100,
  baseXPPerLevel: 100,
  xpScalingFactor: 1.15, // Each level requires 15% more XP
  statPointsPerLevel: 2,
  maxStatValue: 100,
  classChangeCooldowmHours: 168, // 1 week cooldown between class changes

  xpMultipliers: {
    chore: 1.0,      // Base XP from chore completion
    streak: 1.5,     // XP bonus for streak milestones
    achievement: 2.0, // XP bonus for earning achievements
    dailyLogin: 0.5,  // Daily login XP
    familyGoal: 1.5,  // Family goal completion XP
    bossBattle: 2.0,  // Boss battle contribution XP
  },
};

// Stat bonus percentages per point
export const STAT_BONUS_CONFIG = {
  speed: {
    bonusPerPoint: 0.5, // 0.5% speed bonus per point
    maxBonus: 50,       // Max 50% speed bonus
    description: 'Bonus XP for completing chores quickly',
  },
  quality: {
    bonusPerPoint: 0.5,
    maxBonus: 50,
    description: 'Bonus points for photo proof and detailed completions',
  },
  consistency: {
    bonusPerPoint: 0.5,
    maxBonus: 50,
    description: 'Enhanced streak bonuses and protection',
  },
  teamwork: {
    bonusPerPoint: 0.5,
    maxBonus: 50,
    description: 'Bonus for family goals and helping others',
  },
} as const;

// Class-specific XP bonus categories
export const CLASS_XP_BONUSES: Record<CharacterClass, { category: string; bonus: number }[]> = {
  cleaner: [
    { category: 'cleaning', bonus: 0.25 },
    { category: 'bathroom', bonus: 0.15 },
    { category: 'laundry', bonus: 0.10 },
  ],
  organizer: [
    { category: 'organization', bonus: 0.25 },
    { category: 'bedroom', bonus: 0.15 },
    { category: 'declutter', bonus: 0.10 },
  ],
  helper: [
    { category: 'any', bonus: 0.10 }, // Bonus for all "anyone" chores
    { category: 'errands', bonus: 0.15 },
    { category: 'pets', bonus: 0.15 },
  ],
  chef: [
    { category: 'kitchen', bonus: 0.25 },
    { category: 'cooking', bonus: 0.20 },
    { category: 'dishes', bonus: 0.15 },
  ],
  guardian: [
    { category: 'daily', bonus: 0.20 }, // Daily recurring chores
    { category: 'maintenance', bonus: 0.15 },
    { category: 'outdoor', bonus: 0.10 },
  ],
};

// Calculate XP required for a specific level
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;

  const { baseXPPerLevel, xpScalingFactor } = CHARACTER_CONFIG;

  // Use geometric series formula for smooth progression
  // Level 2 = 100 XP, Level 3 = 115 XP, Level 4 = 132 XP, etc.
  return Math.floor(baseXPPerLevel * Math.pow(xpScalingFactor, level - 2));
}

// Calculate total XP needed from level 1 to reach a specific level
export function getTotalXPForLevel(level: number): number {
  if (level <= 1) return 0;

  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += getXPForLevel(i);
  }
  return total;
}

// Calculate current level from total XP
export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  let xpNeeded = 0;

  while (level < CHARACTER_CONFIG.maxLevel) {
    const nextLevelXP = getXPForLevel(level + 1);
    if (xpNeeded + nextLevelXP > totalXP) break;
    xpNeeded += nextLevelXP;
    level++;
  }

  return level;
}

// Get level info including unlocks
export function getLevelInfo(level: number): CharacterLevel {
  const xpRequired = getXPForLevel(level);
  const xpTotal = getTotalXPForLevel(level);
  const statPoints = level > 1 ? CHARACTER_CONFIG.statPointsPerLevel : 0;

  const unlocks: LevelUnlock[] = [];

  // Define level unlocks
  if (level === 5) {
    unlocks.push({
      type: 'skill',
      id: 'level-5-skill',
      name: 'Second Skill Slot',
      description: 'Unlock your second class skill',
    });
  }
  if (level === 10) {
    unlocks.push({
      type: 'avatar_item',
      id: 'level-10-outfit',
      name: 'Class Outfit',
      description: 'Unlock your class-themed outfit',
    });
    unlocks.push({
      type: 'skill',
      id: 'level-10-skill',
      name: 'Third Skill Slot',
      description: 'Unlock your third class skill',
    });
  }
  if (level === 20) {
    unlocks.push({
      type: 'skill',
      id: 'level-20-skill',
      name: 'Fourth Skill Slot',
      description: 'Unlock your fourth class skill',
    });
    unlocks.push({
      type: 'title',
      id: 'level-20-title',
      name: 'Apprentice Title',
      description: 'Earn the "Apprentice" title',
    });
  }
  if (level === 30) {
    unlocks.push({
      type: 'title',
      id: 'level-30-title',
      name: 'Journeyman Title',
      description: 'Earn the "Journeyman" title',
    });
  }
  if (level === 50) {
    unlocks.push({
      type: 'skill',
      id: 'level-50-skill',
      name: 'Master Skill',
      description: 'Unlock your class master skill',
    });
    unlocks.push({
      type: 'title',
      id: 'level-50-title',
      name: 'Expert Title',
      description: 'Earn the "Expert" title',
    });
  }
  if (level === 75) {
    unlocks.push({
      type: 'title',
      id: 'level-75-title',
      name: 'Master Title',
      description: 'Earn the "Master" title',
    });
  }
  if (level === 100) {
    unlocks.push({
      type: 'title',
      id: 'level-100-title',
      name: 'Grandmaster Title',
      description: 'Earn the "Grandmaster" title',
    });
    unlocks.push({
      type: 'avatar_item',
      id: 'level-100-crown',
      name: 'Royal Crown',
      description: 'Unlock the legendary Royal Crown',
    });
  }

  return {
    level,
    xpRequired,
    xpTotal,
    statPoints,
    unlocks,
  };
}

// Calculate XP earned from a chore completion
export interface ChoreXPInput {
  basePoints: number;
  characterClass: CharacterClass;
  choreCategory: string;
  choreDifficulty: 'easy' | 'medium' | 'hard';
  hasPhotoProof: boolean;
  completedEarly: boolean;
  isSharedChore: boolean;
  isRecurringDaily: boolean;
  characterStats: CharacterStats;
  streakCurrent: number;
}

export function calculateChoreXP(input: ChoreXPInput): {
  baseXP: number;
  classBonus: number;
  statBonus: number;
  totalXP: number;
  breakdown: { label: string; value: number }[];
} {
  const breakdown: { label: string; value: number }[] = [];

  // Base XP = points earned (typically 10-30)
  const baseXP = input.basePoints;
  breakdown.push({ label: 'Base XP', value: baseXP });

  // Class bonus - check if chore category matches class bonuses
  let classBonus = 0;
  const classBonuses = CLASS_XP_BONUSES[input.characterClass];
  for (const bonus of classBonuses) {
    if (input.choreCategory.toLowerCase().includes(bonus.category) ||
        (bonus.category === 'any' && input.isSharedChore) ||
        (bonus.category === 'daily' && input.isRecurringDaily)) {
      classBonus += Math.floor(baseXP * bonus.bonus);
    }
  }
  if (classBonus > 0) {
    breakdown.push({ label: 'Class Bonus', value: classBonus });
  }

  // Stat bonuses
  let statBonus = 0;

  // Speed bonus for completing early
  if (input.completedEarly) {
    const speedBonus = Math.floor(baseXP * (input.characterStats.speed * STAT_BONUS_CONFIG.speed.bonusPerPoint / 100));
    if (speedBonus > 0) {
      statBonus += speedBonus;
      breakdown.push({ label: 'Speed Bonus', value: speedBonus });
    }
  }

  // Quality bonus for photo proof
  if (input.hasPhotoProof) {
    const qualityBonus = Math.floor(baseXP * (input.characterStats.quality * STAT_BONUS_CONFIG.quality.bonusPerPoint / 100));
    if (qualityBonus > 0) {
      statBonus += qualityBonus;
      breakdown.push({ label: 'Quality Bonus', value: qualityBonus });
    }
  }

  // Consistency bonus based on streak
  if (input.streakCurrent >= 7) {
    const consistencyMultiplier = Math.min(input.streakCurrent / 100, 0.5); // Max 50% bonus
    const consistencyBonus = Math.floor(baseXP * (input.characterStats.consistency * STAT_BONUS_CONFIG.consistency.bonusPerPoint / 100) * consistencyMultiplier);
    if (consistencyBonus > 0) {
      statBonus += consistencyBonus;
      breakdown.push({ label: 'Consistency Bonus', value: consistencyBonus });
    }
  }

  // Teamwork bonus for shared chores
  if (input.isSharedChore) {
    const teamworkBonus = Math.floor(baseXP * (input.characterStats.teamwork * STAT_BONUS_CONFIG.teamwork.bonusPerPoint / 100));
    if (teamworkBonus > 0) {
      statBonus += teamworkBonus;
      breakdown.push({ label: 'Teamwork Bonus', value: teamworkBonus });
    }
  }

  const totalXP = baseXP + classBonus + statBonus;

  return {
    baseXP,
    classBonus,
    statBonus,
    totalXP,
    breakdown,
  };
}

// Calculate stat bonus for a specific action
export function getStatBonus(stat: CharacterStat, statValue: number): number {
  const config = STAT_BONUS_CONFIG[stat];
  const bonus = statValue * config.bonusPerPoint;
  return Math.min(bonus, config.maxBonus);
}

// Validate stat allocation
export function validateStatAllocation(
  currentStats: CharacterStats,
  stat: CharacterStat,
  pointsToAdd: number,
  availablePoints: number
): { valid: boolean; error?: string } {
  if (pointsToAdd <= 0) {
    return { valid: false, error: 'Must allocate at least 1 point' };
  }

  if (pointsToAdd > availablePoints) {
    return { valid: false, error: 'Not enough stat points available' };
  }

  const newValue = currentStats[stat] + pointsToAdd;
  if (newValue > CHARACTER_CONFIG.maxStatValue) {
    return { valid: false, error: `${stat} cannot exceed ${CHARACTER_CONFIG.maxStatValue}` };
  }

  return { valid: true };
}

// Check if class change is allowed (cooldown)
export function canChangeClass(lastChangeAt: Date | null): { allowed: boolean; cooldownEndsAt?: Date } {
  if (!lastChangeAt) {
    return { allowed: true };
  }

  const cooldownMs = CHARACTER_CONFIG.classChangeCooldowmHours * 60 * 60 * 1000;
  const cooldownEndsAt = new Date(lastChangeAt.getTime() + cooldownMs);

  if (new Date() < cooldownEndsAt) {
    return { allowed: false, cooldownEndsAt };
  }

  return { allowed: true };
}

// Get default avatar customization
export function getDefaultAvatar() {
  return {
    skinTone: 'skin-medium',
    hairStyle: 'hair-short',
    hairColor: 'haircolor-brown',
    eyeColor: 'eyes-brown',
    faceShape: 'face-round',
    outfit: 'outfit-casual',
    outfitColor: 'outfitcolor-blue',
    accessories: [],
    background: 'bg-white',
    frame: 'frame-none',
  };
}

// Get default character stats (all start at 5)
export function getDefaultStats(): CharacterStats {
  return {
    speed: 5,
    quality: 5,
    consistency: 5,
    teamwork: 5,
  };
}

// Get titles available at a level
export function getAvailableTitles(level: number): string[] {
  const titles: string[] = [];

  if (level >= 1) titles.push('Newcomer');
  if (level >= 10) titles.push('Apprentice');
  if (level >= 20) titles.push('Journeyman');
  if (level >= 30) titles.push('Skilled');
  if (level >= 40) titles.push('Adept');
  if (level >= 50) titles.push('Expert');
  if (level >= 60) titles.push('Veteran');
  if (level >= 75) titles.push('Master');
  if (level >= 90) titles.push('Legend');
  if (level >= 100) titles.push('Grandmaster');

  return titles;
}

// Calculate XP progress within current level
export function getXPProgress(currentXP: number, currentLevel: number): {
  xpInLevel: number;
  xpNeeded: number;
  percentage: number;
} {
  const xpForCurrentLevel = getTotalXPForLevel(currentLevel);
  const xpForNextLevel = getTotalXPForLevel(currentLevel + 1);

  const xpInLevel = currentXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const percentage = Math.min(100, Math.floor((xpInLevel / xpNeeded) * 100));

  return {
    xpInLevel,
    xpNeeded,
    percentage,
  };
}

// Check if a level up occurred and return new level info
export function checkLevelUp(
  previousXP: number,
  newXP: number
): { leveledUp: boolean; previousLevel: number; newLevel: number; unlocks: LevelUnlock[] } {
  const previousLevel = getLevelFromXP(previousXP);
  const newLevel = getLevelFromXP(newXP);

  if (newLevel > previousLevel) {
    // Collect all unlocks from levels gained
    const unlocks: LevelUnlock[] = [];
    for (let level = previousLevel + 1; level <= newLevel; level++) {
      const levelInfo = getLevelInfo(level);
      unlocks.push(...levelInfo.unlocks);
    }

    return {
      leveledUp: true,
      previousLevel,
      newLevel,
      unlocks,
    };
  }

  return {
    leveledUp: false,
    previousLevel,
    newLevel,
    unlocks: [],
  };
}
