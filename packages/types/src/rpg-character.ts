// RPG Character System Types (F9.1)

// Character Classes
export type CharacterClass = 'cleaner' | 'organizer' | 'helper' | 'chef' | 'guardian';

export interface CharacterClassDefinition {
  id: CharacterClass;
  name: string;
  description: string;
  icon: string;
  primaryStat: CharacterStat;
  color: string;
  skills: ClassSkillDefinition[];
}

// Character Stats
export type CharacterStat = 'speed' | 'quality' | 'consistency' | 'teamwork';

export interface CharacterStats {
  speed: number;       // How quickly chores are completed
  quality: number;     // Quality of chore completion (photo proofs, etc.)
  consistency: number; // Streak-related bonuses
  teamwork: number;    // Family collaboration bonuses
}

// Character Levels
export interface CharacterLevel {
  level: number;
  xpRequired: number;
  xpTotal: number;      // Total XP needed to reach this level from level 1
  statPoints: number;   // Stat points awarded at this level
  unlocks: LevelUnlock[];
}

export interface LevelUnlock {
  type: 'skill' | 'avatar_item' | 'title' | 'ability';
  id: string;
  name: string;
  description: string;
}

// Character Skills
export interface ClassSkillDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  levelRequired: number;
  effects: SkillEffect[];
}

export interface SkillEffect {
  type: 'points_bonus' | 'xp_bonus' | 'streak_protection' | 'cooldown_reduction' | 'team_buff';
  value: number;
  condition?: string;
}

export interface MemberSkill {
  skillId: string;
  level: number;
  xp: number;
  unlockedAt: Date;
}

// Avatar System
export interface AvatarCustomization {
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  faceShape: string;
  outfit: string;
  outfitColor: string;
  accessories: string[];
  background: string;
  frame: string;
}

export interface AvatarItem {
  id: string;
  category: AvatarItemCategory;
  name: string;
  icon: string | null;
  rarity: AvatarItemRarity;
  unlockType: AvatarUnlockType;
  unlockRequirement?: AvatarUnlockRequirement;
  unlockLevel?: number;
  seasonalEvent?: string;
  isDefault: boolean;
  sortOrder?: number;
}

export type AvatarItemCategory =
  | 'skin_tone'
  | 'hair_style'
  | 'hair_color'
  | 'eye_color'
  | 'face_shape'
  | 'outfit'
  | 'outfit_color'
  | 'accessory'
  | 'background'
  | 'frame';

export type AvatarItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type AvatarUnlockType = 'default' | 'level' | 'achievement' | 'seasonal' | 'purchase' | 'special';

export interface AvatarUnlockRequirement {
  type: AvatarUnlockType;
  level?: number;
  achievementId?: string;
  seasonalEventId?: string;
  cost?: number;
}

// Character Profile
export interface CharacterProfile {
  memberId: string;
  characterClass: CharacterClass;
  classId: CharacterClass; // Raw class ID from database
  classChangedAt: Date | null; // Last class change timestamp
  level: number;
  xp: number;
  xpToNextLevel: number;
  xpLifetime: number;
  stats: CharacterStats;
  statPointsAvailable: number;
  avatar: AvatarCustomization;
  unlockedItems: string[];
  skills: MemberSkill[];
  titles: string[];
  activeTitle: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// XP Transactions (separate from points)
export type XPTransactionType =
  | 'chore_completion'
  | 'streak_bonus'
  | 'achievement_bonus'
  | 'daily_login'
  | 'family_goal'
  | 'boss_battle'
  | 'skill_use'
  | 'manual_adjustment';

export interface XPTransaction {
  id: string;
  memberId: string;
  amount: number;
  balanceAfter: number;
  transactionType: XPTransactionType;
  referenceId: string | null;
  referenceType: string | null;
  description: string | null;
  createdAt: Date;
}

// Character Card (for leaderboards and profiles)
export interface CharacterCard {
  memberId: string;
  memberName: string;
  memberColor: string;
  characterClass: CharacterClass;
  level: number;
  title: string | null;
  avatar: AvatarCustomization;
  stats: CharacterStats;
  topSkills: MemberSkill[];
  achievements: number;
  streakCurrent: number;
}

// API Request/Response types
export interface CreateCharacterRequest {
  characterClass: CharacterClass;
  avatar?: Partial<AvatarCustomization>;
}

export interface UpdateCharacterClassRequest {
  characterClass: CharacterClass;
}

export interface UpdateAvatarRequest {
  avatar: Partial<AvatarCustomization>;
}

export interface AllocateStatPointsRequest {
  stat: CharacterStat;
  points: number;
}

export interface LearnSkillRequest {
  skillId: string;
}

export interface CharacterProgressResponse {
  character: CharacterProfile;
  recentXP: XPTransaction[];
  nextUnlocks: LevelUnlock[];
  classRank: number;
  householdRank: number;
}

export interface CharacterLeaderboardEntry {
  rank: number;
  card: CharacterCard;
  xpThisWeek: number;
  levelsGained: number;
}

export interface CharacterLeaderboardResponse {
  entries: CharacterLeaderboardEntry[];
  myRank: number | null;
  period: 'week' | 'month' | 'all-time';
}

// Celebration Events for Characters
export type CharacterCelebrationType =
  | 'level_up'
  | 'skill_unlocked'
  | 'class_mastery'
  | 'stat_milestone'
  | 'avatar_unlocked';

export interface CharacterCelebrationEvent {
  type: CharacterCelebrationType;
  memberId: string;
  data: {
    newLevel?: number;
    skill?: ClassSkillDefinition;
    stat?: CharacterStat;
    statValue?: number;
    avatarItem?: AvatarItem;
  };
  animationType: 'level_up' | 'skill_burst' | 'stat_glow' | 'unlock_reveal';
  intensity: 'small' | 'medium' | 'large';
}

// Configuration types
export interface CharacterConfig {
  maxLevel: number;
  baseXPPerLevel: number;
  xpScalingFactor: number;
  statPointsPerLevel: number;
  maxStatValue: number;
  classChangeCooldowmHours: number;
  xpMultipliers: {
    chore: number;
    streak: number;
    achievement: number;
    dailyLogin: number;
    familyGoal: number;
    bossBattle: number;
  };
}
