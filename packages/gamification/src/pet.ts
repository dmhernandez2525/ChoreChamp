// Virtual Pet System Logic (F9.2)
// Handles pet stats, evolution, mood, and abilities

import type {
  PetStats,
  PetMood,
  EvolutionTier,
  PetAction,
  PetActionResult,
  PetConfig,
  PetInteractionCooldowns,
} from '@chorechamp/types';

// Pet system configuration
export const PET_CONFIG: PetConfig = {
  maxPetsPerMember: 3,
  maxPetsPerHousehold: 10,
  baseXPPerChore: 5,
  evolutionLevels: {
    baby: 1,
    juvenile: 10,
    adult: 25,
    legendary: 50,
  },
  actionCooldowns: {
    feed: 4,    // Hours between feeds
    play: 2,    // Hours between play sessions
    pet: 5,     // Minutes between petting (converted to hours in code)
    heal: 12,   // Hours between heals
  },
  moodThresholds: {
    ecstatic: 90,
    happy: 70,
    content: 50,
    neutral: 30,
    sad: 10,
    sick: 0, // Special case - health based
  },
  healthWarningThreshold: 30,
};

// XP required for each level (similar to character system)
export function getPetXPForLevel(level: number): number {
  if (level <= 1) return 0;
  const baseXP = 50;
  const scalingFactor = 1.12;
  return Math.floor(baseXP * Math.pow(scalingFactor, level - 2));
}

// Calculate total XP needed to reach a specific level
export function getTotalPetXPForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += getPetXPForLevel(i);
  }
  return total;
}

// Get level from total XP
export function getPetLevelFromXP(totalXP: number): number {
  let level = 1;
  let xpNeeded = 0;
  while (level < 100) {
    const nextLevelXP = getPetXPForLevel(level + 1);
    if (xpNeeded + nextLevelXP > totalXP) break;
    xpNeeded += nextLevelXP;
    level++;
  }
  return level;
}

// Determine evolution tier from level
export function getEvolutionTier(level: number): EvolutionTier {
  const { evolutionLevels } = PET_CONFIG;
  if (level >= evolutionLevels.legendary) return 'legendary';
  if (level >= evolutionLevels.adult) return 'adult';
  if (level >= evolutionLevels.juvenile) return 'juvenile';
  return 'baby';
}

// Check if pet can evolve
export function canEvolve(currentTier: EvolutionTier, level: number): { canEvolve: boolean; nextTier: EvolutionTier | null } {
  const { evolutionLevels } = PET_CONFIG;

  switch (currentTier) {
    case 'baby':
      if (level >= evolutionLevels.juvenile) return { canEvolve: true, nextTier: 'juvenile' };
      break;
    case 'juvenile':
      if (level >= evolutionLevels.adult) return { canEvolve: true, nextTier: 'adult' };
      break;
    case 'adult':
      if (level >= evolutionLevels.legendary) return { canEvolve: true, nextTier: 'legendary' };
      break;
  }

  return { canEvolve: false, nextTier: null };
}

// Calculate mood from stats
export function calculateMood(stats: PetStats): PetMood {
  const { moodThresholds, healthWarningThreshold } = PET_CONFIG;

  // Check for sick state first (health-based)
  if (stats.health < healthWarningThreshold) {
    return 'sick';
  }

  // Check energy for sleeping
  if (stats.energy < 10) {
    return 'sleeping';
  }

  // Calculate mood from happiness
  const happinessPercent = (stats.happiness / stats.maxHappiness) * 100;

  if (happinessPercent >= moodThresholds.ecstatic) return 'ecstatic';
  if (happinessPercent >= moodThresholds.happy) return 'happy';
  if (happinessPercent >= moodThresholds.content) return 'content';
  if (happinessPercent >= moodThresholds.neutral) return 'neutral';
  return 'sad';
}

// Apply stat decay (called periodically)
export function applyStatDecay(
  stats: PetStats,
  hoursElapsed: number,
  decayRates: { healthDecayRate: number; happinessDecayRate: number }
): PetStats {
  const healthLoss = Math.floor(decayRates.healthDecayRate * (hoursElapsed / 24));
  const happinessLoss = Math.floor(decayRates.happinessDecayRate * (hoursElapsed / 24));

  return {
    ...stats,
    health: Math.max(0, stats.health - healthLoss),
    happiness: Math.max(0, stats.happiness - happinessLoss),
  };
}

// Regenerate energy (called periodically)
export function applyEnergyRegen(
  stats: PetStats,
  hoursElapsed: number,
  regenRate: number
): PetStats {
  const energyGain = Math.floor(regenRate * hoursElapsed);

  return {
    ...stats,
    energy: Math.min(stats.maxEnergy, stats.energy + energyGain),
  };
}

// Check if action is on cooldown
export function isActionOnCooldown(
  action: PetAction,
  lastActionAt: Date | null,
  cooldowns: PetInteractionCooldowns
): { onCooldown: boolean; availableAt: Date | null } {
  if (!lastActionAt) {
    return { onCooldown: false, availableAt: null };
  }

  let cooldownMs: number;
  switch (action) {
    case 'feed':
      cooldownMs = cooldowns.feed * 60 * 60 * 1000;
      break;
    case 'play':
      cooldownMs = cooldowns.play * 60 * 60 * 1000;
      break;
    case 'pet':
      cooldownMs = cooldowns.pet * 60 * 1000; // Pet cooldown is in minutes
      break;
    case 'heal':
      cooldownMs = cooldowns.heal * 60 * 60 * 1000;
      break;
    default:
      cooldownMs = 0;
  }

  const availableAt = new Date(lastActionAt.getTime() + cooldownMs);
  const onCooldown = new Date() < availableAt;

  return { onCooldown, availableAt: onCooldown ? availableAt : null };
}

// Perform pet action
export function performAction(
  action: PetAction,
  currentStats: PetStats,
  petLevel: number
): PetActionResult {
  const statChanges: Partial<PetStats> = {};
  let xpGained = 0;
  let message = '';

  // Level bonus (higher level pets get more from actions)
  const levelBonus = 1 + (petLevel * 0.02);

  switch (action) {
    case 'feed': {
      const healthGain = Math.floor(20 * levelBonus);
      const happinessFromFood = Math.floor(10 * levelBonus);
      statChanges.health = Math.min(currentStats.maxHealth, currentStats.health + healthGain);
      statChanges.happiness = Math.min(currentStats.maxHappiness, currentStats.happiness + happinessFromFood);
      xpGained = Math.floor(5 * levelBonus);
      message = `Fed pet! Health +${healthGain}, Happiness +${happinessFromFood}`;
      break;
    }

    case 'play': {
      const happinessGain = Math.floor(25 * levelBonus);
      const energyLoss = Math.floor(15 / levelBonus);
      statChanges.happiness = Math.min(currentStats.maxHappiness, currentStats.happiness + happinessGain);
      statChanges.energy = Math.max(0, currentStats.energy - energyLoss);
      xpGained = Math.floor(10 * levelBonus);
      message = `Played with pet! Happiness +${happinessGain}`;
      break;
    }

    case 'pet': {
      const petHappiness = Math.floor(5 * levelBonus);
      statChanges.happiness = Math.min(currentStats.maxHappiness, currentStats.happiness + petHappiness);
      xpGained = Math.floor(2 * levelBonus);
      message = `Petted! Happiness +${petHappiness}`;
      break;
    }

    case 'rest': {
      const energyGain = Math.floor(30 * levelBonus);
      statChanges.energy = Math.min(currentStats.maxEnergy, currentStats.energy + energyGain);
      xpGained = 0;
      message = `Resting... Energy +${energyGain}`;
      break;
    }

    case 'train': {
      const trainXP = Math.floor(15 * levelBonus);
      const trainEnergy = Math.floor(20 / levelBonus);
      statChanges.energy = Math.max(0, currentStats.energy - trainEnergy);
      xpGained = trainXP;
      message = `Training! XP +${trainXP}`;
      break;
    }

    case 'heal': {
      if (currentStats.health < currentStats.maxHealth * 0.5) {
        const healAmount = Math.floor(40 * levelBonus);
        statChanges.health = Math.min(currentStats.maxHealth, currentStats.health + healAmount);
        xpGained = Math.floor(3 * levelBonus);
        message = `Healed pet! Health +${healAmount}`;
      } else {
        message = 'Pet is already healthy!';
      }
      break;
    }
  }

  return {
    action,
    success: true,
    statChanges,
    xpGained,
    message,
  };
}

// Award XP from chore completion
export function awardPetXPFromChore(
  chorePoints: number,
  petLevel: number,
  streakDays: number
): { xpGained: number; leveledUp: boolean; newLevel: number } {
  const baseXP = Math.floor(chorePoints * 0.5); // 50% of chore points as pet XP
  const levelBonus = 1 + (petLevel * 0.01);
  const streakBonus = 1 + (Math.min(streakDays, 30) * 0.02); // Up to 60% bonus from streaks

  const xpGained = Math.floor(baseXP * levelBonus * streakBonus);

  // This would be calculated based on current XP in the actual implementation
  return {
    xpGained,
    leveledUp: false,
    newLevel: petLevel,
  };
}

// Get available actions based on pet state
export function getAvailableActions(
  stats: PetStats,
  lastFedAt: Date | null,
  lastPlayedAt: Date | null,
  lastPettedAt: Date | null
): PetAction[] {
  const actions: PetAction[] = [];
  const cooldowns = PET_CONFIG.actionCooldowns;

  // Always can pet (short cooldown)
  const petCooldown = isActionOnCooldown('pet', lastPettedAt, cooldowns);
  if (!petCooldown.onCooldown) {
    actions.push('pet');
  }

  // Feed if not recently fed
  const feedCooldown = isActionOnCooldown('feed', lastFedAt, cooldowns);
  if (!feedCooldown.onCooldown) {
    actions.push('feed');
  }

  // Play if not tired
  if (stats.energy > 20) {
    const playCooldown = isActionOnCooldown('play', lastPlayedAt, cooldowns);
    if (!playCooldown.onCooldown) {
      actions.push('play');
    }
  }

  // Rest always available
  actions.push('rest');

  // Train if has energy
  if (stats.energy > 30) {
    actions.push('train');
  }

  // Heal if health is low
  if (stats.health < stats.maxHealth * 0.5) {
    actions.push('heal');
  }

  return actions;
}

// Calculate pet happiness bonus for point multiplier
export function getPetHappinessBonus(stats: PetStats): number {
  const happinessPercent = (stats.happiness / stats.maxHappiness) * 100;

  if (happinessPercent >= 90) return 0.10; // 10% bonus
  if (happinessPercent >= 70) return 0.05; // 5% bonus
  if (happinessPercent >= 50) return 0.02; // 2% bonus
  return 0;
}

// Get mood emoji and description
export function getMoodDisplay(mood: PetMood): { emoji: string; description: string; color: string } {
  switch (mood) {
    case 'ecstatic':
      return { emoji: '🤩', description: 'Ecstatic!', color: 'text-yellow-500' };
    case 'happy':
      return { emoji: '😊', description: 'Happy', color: 'text-green-500' };
    case 'content':
      return { emoji: '🙂', description: 'Content', color: 'text-blue-500' };
    case 'neutral':
      return { emoji: '😐', description: 'Neutral', color: 'text-gray-500' };
    case 'sad':
      return { emoji: '😢', description: 'Sad', color: 'text-blue-700' };
    case 'sick':
      return { emoji: '🤒', description: 'Sick!', color: 'text-red-500' };
    case 'sleeping':
      return { emoji: '😴', description: 'Sleeping', color: 'text-purple-500' };
    default:
      return { emoji: '🐾', description: 'Unknown', color: 'text-gray-400' };
  }
}

// Get evolution tier display info
export function getEvolutionDisplay(tier: EvolutionTier): { label: string; color: string } {
  switch (tier) {
    case 'baby':
      return { label: 'Baby', color: 'text-pink-500' };
    case 'juvenile':
      return { label: 'Juvenile', color: 'text-blue-500' };
    case 'adult':
      return { label: 'Adult', color: 'text-green-500' };
    case 'legendary':
      return { label: 'Legendary', color: 'text-yellow-500' };
    default:
      return { label: 'Unknown', color: 'text-gray-500' };
  }
}
