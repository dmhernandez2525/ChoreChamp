// Story Mode Adventure Logic (F9.5)

import type {
  StoryDifficulty,
  QuestStatus,
  ChapterStatus,
  QuestObjective,
  QuestReward,
  ChapterReward,
  StoryProgress,
  ChapterProgress,
  QuestProgress,
  DialogueLine,
  ChoiceEffect,
} from '@chorechamp/types';

// Difficulty configuration
export const DIFFICULTY_CONFIG: Record<StoryDifficulty, {
  xpMultiplier: number;
  pointsMultiplier: number;
  timeBonus: number;  // Extra time percentage for time-limited quests
  label: string;
  color: string;
}> = {
  easy: {
    xpMultiplier: 1,
    pointsMultiplier: 1,
    timeBonus: 1.5,
    label: 'Easy',
    color: 'text-green-600',
  },
  medium: {
    xpMultiplier: 1.5,
    pointsMultiplier: 1.5,
    timeBonus: 1.25,
    label: 'Medium',
    color: 'text-yellow-600',
  },
  hard: {
    xpMultiplier: 2,
    pointsMultiplier: 2,
    timeBonus: 1,
    label: 'Hard',
    color: 'text-red-600',
  },
};

// Story mode configuration
export const STORY_CONFIG = {
  // Star rating thresholds (percentage of optimal time)
  starThresholds: {
    three: 0.8,  // Complete in 80% of estimated time or less
    two: 1.0,    // Complete in estimated time
    one: 1.5,    // Complete in 150% of estimated time
  },

  // Dialogue settings
  dialogueTypeSpeed: 30,  // ms per character
  autoAdvanceDelay: 3000,  // ms after dialogue complete

  // Progress tracking
  maxActiveQuests: 3,
  questExpirationDays: 7,  // Days before unfinished quest auto-fails

  // Rewards
  bonusForPerfectChapter: 1.5,  // 50% bonus for all 3-star quests
  streakBonus: 0.1,  // 10% bonus per consecutive chapter completed
};

/**
 * Determine chapter status based on prerequisites and completion
 */
export function getChapterStatus(
  chapterId: string,
  prerequisiteChapterId: string | null,
  requiredLevel: number,
  memberLevel: number,
  completedChapterIds: Set<string>,
  startedChapterIds: Set<string>
): ChapterStatus {
  // Check if already completed
  if (completedChapterIds.has(chapterId)) {
    return 'completed';
  }

  // Check if in progress
  if (startedChapterIds.has(chapterId)) {
    return 'in_progress';
  }

  // Check level requirement
  if (memberLevel < requiredLevel) {
    return 'locked';
  }

  // Check prerequisite
  if (prerequisiteChapterId && !completedChapterIds.has(prerequisiteChapterId)) {
    return 'locked';
  }

  return 'available';
}

/**
 * Determine quest status based on chapter progress and order
 */
export function getQuestStatus(
  questId: string,
  orderInChapter: number,
  chapterStatus: ChapterStatus,
  completedQuestIds: Set<string>,
  startedQuestIds: Set<string>,
  highestCompletedOrder: number
): QuestStatus {
  // Check if already completed
  if (completedQuestIds.has(questId)) {
    return 'completed';
  }

  // Check if in progress
  if (startedQuestIds.has(questId)) {
    return 'in_progress';
  }

  // If chapter is locked, quest is locked
  if (chapterStatus === 'locked') {
    return 'locked';
  }

  // Quest available if it's the next one in sequence
  if (orderInChapter <= highestCompletedOrder + 1) {
    return 'available';
  }

  return 'locked';
}

/**
 * Check if an objective is complete
 */
export function isObjectiveComplete(objective: QuestObjective): boolean {
  return objective.current >= objective.required;
}

/**
 * Check if all quest objectives are complete
 */
export function areAllObjectivesComplete(objectives: QuestObjective[]): boolean {
  return objectives.every(isObjectiveComplete);
}

/**
 * Update objective progress
 */
export function updateObjectiveProgress(
  objective: QuestObjective,
  progressAmount: number
): QuestObjective {
  const newCurrent = Math.min(objective.current + progressAmount, objective.required);
  return {
    ...objective,
    current: newCurrent,
    isCompleted: newCurrent >= objective.required,
  };
}

/**
 * Calculate stars earned based on completion time
 */
export function calculateStarsEarned(
  actualMinutes: number,
  estimatedMinutes: number
): number {
  const ratio = actualMinutes / estimatedMinutes;

  if (ratio <= STORY_CONFIG.starThresholds.three) {
    return 3;
  }
  if (ratio <= STORY_CONFIG.starThresholds.two) {
    return 2;
  }
  if (ratio <= STORY_CONFIG.starThresholds.one) {
    return 1;
  }
  return 0;  // Took too long but still completed
}

/**
 * Calculate chapter completion percentage
 */
export function calculateChapterCompletion(
  questsCompleted: number,
  totalQuests: number
): number {
  if (totalQuests === 0) return 0;
  return Math.round((questsCompleted / totalQuests) * 100);
}

/**
 * Apply difficulty multiplier to rewards
 */
export function applyDifficultyToRewards(
  rewards: QuestReward,
  difficulty: StoryDifficulty
): QuestReward {
  const config = DIFFICULTY_CONFIG[difficulty];
  return {
    ...rewards,
    xp: Math.floor(rewards.xp * config.xpMultiplier),
    points: Math.floor(rewards.points * config.pointsMultiplier),
  };
}

/**
 * Apply chapter completion bonus
 */
export function applyChapterBonus(
  rewards: ChapterReward,
  allQuestsThreeStars: boolean,
  consecutiveChaptersCompleted: number
): ChapterReward {
  let xpMultiplier = 1;
  let pointsMultiplier = 1;

  // Perfect chapter bonus
  if (allQuestsThreeStars) {
    xpMultiplier *= STORY_CONFIG.bonusForPerfectChapter;
    pointsMultiplier *= STORY_CONFIG.bonusForPerfectChapter;
  }

  // Streak bonus
  const streakBonus = 1 + (consecutiveChaptersCompleted * STORY_CONFIG.streakBonus);
  xpMultiplier *= streakBonus;
  pointsMultiplier *= streakBonus;

  return {
    ...rewards,
    xp: Math.floor(rewards.xp * xpMultiplier),
    points: Math.floor(rewards.points * pointsMultiplier),
  };
}

/**
 * Process choice effect
 */
export function processChoiceEffect(
  effect: ChoiceEffect | null,
  _currentProgress: StoryProgress
): { pointsDelta: number; xpDelta: number; unlocks: string[] } {
  const result = { pointsDelta: 0, xpDelta: 0, unlocks: [] as string[] };

  if (!effect) return result;

  switch (effect.type) {
    case 'add_points':
      result.pointsDelta = effect.value;
      break;
    case 'remove_points':
      result.pointsDelta = -effect.value;
      break;
    case 'unlock_character':
      result.unlocks.push(effect.target);
      break;
    case 'change_affinity':
      // Future feature: character affinity system
      break;
    case 'grant_item':
      // Future feature: item system
      break;
    case 'unlock_quest':
      // Handled separately in quest logic
      break;
  }

  return result;
}

/**
 * Get emotion-based animation class
 */
export function getEmotionAnimation(emotion: DialogueLine['emotion']): string {
  switch (emotion) {
    case 'happy':
      return 'animate-bounce-gentle';
    case 'sad':
      return 'animate-droop';
    case 'angry':
      return 'animate-shake';
    case 'surprised':
      return 'animate-jump';
    case 'excited':
      return 'animate-bounce';
    case 'worried':
      return 'animate-shake-gentle';
    default:
      return '';
  }
}

/**
 * Get emotion-based color class
 */
export function getEmotionColor(emotion: DialogueLine['emotion']): string {
  switch (emotion) {
    case 'happy':
      return 'border-green-400';
    case 'sad':
      return 'border-blue-400';
    case 'angry':
      return 'border-red-400';
    case 'surprised':
      return 'border-yellow-400';
    case 'excited':
      return 'border-purple-400';
    case 'worried':
      return 'border-orange-400';
    default:
      return 'border-gray-400';
  }
}

/**
 * Format play time display
 */
export function formatPlayTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Get chapter theme display info
 */
export function getChapterThemeInfo(theme: string): {
  icon: string;
  color: string;
  bgColor: string;
} {
  const themes: Record<string, { icon: string; color: string; bgColor: string }> = {
    bedroom: { icon: '🛏️', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    kitchen: { icon: '🍳', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    bathroom: { icon: '🚿', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
    living_room: { icon: '🛋️', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    outdoor: { icon: '🌳', color: 'text-green-600', bgColor: 'bg-green-100' },
    garage: { icon: '🚗', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    whole_house: { icon: '🏠', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  };

  return themes[theme] || { icon: '📍', color: 'text-gray-600', bgColor: 'bg-gray-100' };
}

/**
 * Create initial story progress for a new member
 */
export function createInitialStoryProgress(
  memberId: string
): Omit<StoryProgress, 'lastPlayedAt'> {
  return {
    memberId,
    currentChapterId: null,
    currentQuestId: null,
    chaptersCompleted: 0,
    questsCompleted: 0,
    totalPlayTime: 0,
    choicesMade: 0,
    unlockedCharacters: [],
    earnedTitles: [],
  };
}

/**
 * Create initial chapter progress
 */
export function createInitialChapterProgress(
  chapterId: string,
  status: ChapterStatus
): Omit<ChapterProgress, 'totalQuests'> {
  return {
    chapterId,
    status,
    questsCompleted: 0,
    completionPercentage: 0,
    startedAt: null,
    completedAt: null,
    bestTime: null,
    starsEarned: 0,
  };
}

/**
 * Create initial quest progress
 */
export function createInitialQuestProgress(
  questId: string,
  status: QuestStatus,
  objectives: QuestObjective[]
): QuestProgress {
  return {
    questId,
    status,
    objectives: objectives.map(obj => ({ ...obj, current: 0, isCompleted: false })),
    currentDialogueId: null,
    dialoguesViewed: [],
    choicesMade: {},
    startedAt: null,
    completedAt: null,
    timeSpent: 0,
  };
}

/**
 * Check if chapter can be replayed
 */
export function canReplayChapter(chapterProgress: ChapterProgress): boolean {
  // Can replay if completed
  return chapterProgress.status === 'completed';
}

/**
 * Get suggested next action for player
 */
export function getSuggestedNextAction(
  progress: StoryProgress,
  availableChapters: string[],
  availableQuests: string[]
): { type: 'continue_quest' | 'start_quest' | 'start_chapter' | 'replay' | 'none'; targetId: string | null } {
  // If has current quest, suggest continuing
  if (progress.currentQuestId) {
    return { type: 'continue_quest', targetId: progress.currentQuestId };
  }

  // If has available quests in current chapter
  if (availableQuests.length > 0) {
    return { type: 'start_quest', targetId: availableQuests[0] };
  }

  // If has available chapters
  if (availableChapters.length > 0) {
    return { type: 'start_chapter', targetId: availableChapters[0] };
  }

  // All content completed
  return { type: 'none', targetId: null };
}
