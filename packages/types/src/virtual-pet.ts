// Virtual Pet System Types (F9.2)

// Pet Species
export type PetSpecies = 'dog' | 'cat' | 'dragon' | 'robot' | 'bunny' | 'bird' | 'unicorn' | 'slime';

export interface PetSpeciesDefinition {
  id: PetSpecies;
  name: string;
  description: string;
  icon: string;
  baseStats: PetBaseStats;
  evolutionPath: EvolutionStage[];
  specialAbility: string;
}

// Pet Evolution
export type EvolutionTier = 'baby' | 'juvenile' | 'adult' | 'legendary';

export interface EvolutionStage {
  tier: EvolutionTier;
  name: string;
  icon: string;
  requiredLevel: number;
  statsMultiplier: number;
  unlockedAbilities: string[];
}

// Pet Stats
export interface PetBaseStats {
  maxHealth: number;
  maxHappiness: number;
  maxEnergy: number;
  healthDecayRate: number;    // Points lost per day without chores
  happinessDecayRate: number;
  energyRegenRate: number;
}

export interface PetStats {
  health: number;
  maxHealth: number;
  happiness: number;
  maxHappiness: number;
  energy: number;
  maxEnergy: number;
}

// Pet Mood
export type PetMood = 'ecstatic' | 'happy' | 'content' | 'neutral' | 'sad' | 'sick' | 'sleeping';

export interface PetMoodThresholds {
  ecstatic: number;  // happiness >= 90
  happy: number;     // happiness >= 70
  content: number;   // happiness >= 50
  neutral: number;   // happiness >= 30
  sad: number;       // happiness >= 10
  sick: number;      // health < 30
}

// Pet Abilities
export type PetAbilityType =
  | 'xp_boost'
  | 'point_boost'
  | 'streak_protection'
  | 'motivation_reminder'
  | 'team_buff'
  | 'lucky_bonus';

export interface PetAbility {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: PetAbilityType;
  value: number;
  cooldownHours: number;
  unlockTier: EvolutionTier;
}

// Pet Accessories
export type PetAccessoryCategory = 'hat' | 'collar' | 'outfit' | 'toy' | 'background' | 'effect';

export interface PetAccessory {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: PetAccessoryCategory;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockType: 'default' | 'level' | 'achievement' | 'purchase' | 'event';
  unlockRequirement?: {
    type: string;
    value: number | string;
  };
  statBonus?: Partial<PetStats>;
}

// Pet Profile
export interface VirtualPet {
  id: string;
  memberId: string;
  householdId: string;
  name: string;
  species: PetSpecies;
  evolutionTier: EvolutionTier;
  level: number;
  xp: number;
  xpToNextLevel: number;
  stats: PetStats;
  mood: PetMood;
  accessories: PetAccessoryEquipped[];
  unlockedAccessories: string[];
  abilities: PetAbility[];
  activeAbility: string | null;
  lastFedAt: Date | null;
  lastPlayedAt: Date | null;
  lastPettedAt: Date | null;
  consecutiveDaysHealthy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PetAccessoryEquipped {
  accessoryId: string;
  equippedAt: Date;
}

// Pet Actions
export type PetAction = 'feed' | 'play' | 'pet' | 'rest' | 'train' | 'heal';

export interface PetActionResult {
  action: PetAction;
  success: boolean;
  statChanges: Partial<PetStats>;
  xpGained: number;
  message: string;
  evolvedTo?: EvolutionStage;
  abilityUnlocked?: PetAbility;
}

// Pet Interactions
export interface PetInteractionCooldowns {
  feed: number;  // Hours between feeds
  play: number;  // Hours between play sessions
  pet: number;   // Minutes between petting
  heal: number;  // Hours between heals
}

// Pet Events
export interface PetEvent {
  id: string;
  petId: string;
  eventType: PetEventType;
  description: string;
  data: Record<string, unknown>;
  createdAt: Date;
}

export type PetEventType =
  | 'adopted'
  | 'evolved'
  | 'leveled_up'
  | 'ability_unlocked'
  | 'accessory_equipped'
  | 'fed'
  | 'played'
  | 'petted'
  | 'healed'
  | 'health_warning'
  | 'mood_changed'
  | 'playdate';

// Playdate System
export interface PetPlaydate {
  id: string;
  hostPetId: string;
  guestPetId: string;
  scheduledAt: Date;
  completedAt: Date | null;
  bonusAwarded: boolean;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
}

export interface PlaydateResult {
  playdate: PetPlaydate;
  hostBonus: Partial<PetStats>;
  guestBonus: Partial<PetStats>;
  xpGained: number;
  friendshipPoints: number;
}

// API Request/Response Types
export interface AdoptPetRequest {
  name: string;
  species: PetSpecies;
}

export interface UpdatePetRequest {
  name?: string;
  accessories?: string[];
  activeAbility?: string | null;
}

export interface PerformActionRequest {
  action: PetAction;
}

export interface SchedulePlaydateRequest {
  guestPetId: string;
  scheduledAt: Date;
}

export interface PetSummary {
  id: string;
  name: string;
  species: PetSpecies;
  evolutionTier: EvolutionTier;
  level: number;
  mood: PetMood;
  healthPercent: number;
  happinessPercent: number;
}

export interface HouseholdPetsResponse {
  pets: PetSummary[];
  totalPets: number;
  maxPets: number;
}

export interface PetDetailsResponse {
  pet: VirtualPet;
  speciesInfo: PetSpeciesDefinition;
  nextEvolution: EvolutionStage | null;
  availableActions: PetAction[];
  cooldowns: Record<PetAction, Date | null>;
  recentEvents: PetEvent[];
}

// Configuration
export interface PetConfig {
  maxPetsPerMember: number;
  maxPetsPerHousehold: number;
  baseXPPerChore: number;
  evolutionLevels: Record<EvolutionTier, number>;
  actionCooldowns: PetInteractionCooldowns;
  moodThresholds: PetMoodThresholds;
  healthWarningThreshold: number;
}
