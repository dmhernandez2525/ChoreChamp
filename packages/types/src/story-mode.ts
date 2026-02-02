// Story Mode Adventure Types (F9.5)

export type StoryDifficulty = 'easy' | 'medium' | 'hard';
export type QuestStatus = 'locked' | 'available' | 'in_progress' | 'completed';
export type ChapterStatus = 'locked' | 'available' | 'in_progress' | 'completed';

// Story character (NPC) definition
export interface StoryCharacter {
  id: string;
  name: string;
  title: string;
  description: string;
  avatar: string;
  personality: string;
  unlockCondition: string | null;  // Condition to meet this character
  isUnlocked: boolean;
}

// Story chapter (main story unit)
export interface StoryChapter {
  id: string;
  number: number;
  title: string;
  description: string;
  artwork: string;
  theme: string;  // 'kitchen', 'bedroom', 'garden', etc.
  difficulty: StoryDifficulty;
  requiredLevel: number;
  prerequisiteChapterId: string | null;
  quests: StoryQuest[];
  characters: StoryCharacter[];
  rewards: ChapterReward;
  estimatedDuration: number;  // Minutes
  isActive: boolean;
  releasedAt: Date;
}

// Quest within a chapter
export interface StoryQuest {
  id: string;
  chapterId: string;
  orderInChapter: number;
  title: string;
  description: string;
  briefing: string;  // Story intro text
  debriefing: string;  // Story outro text
  objectives: QuestObjective[];
  dialogues: StoryDialogue[];
  rewards: QuestReward;
  timeLimit: number | null;  // Minutes, null = no limit
  isOptional: boolean;
  isBonusQuest: boolean;
}

// Quest objective (what needs to be done)
export interface QuestObjective {
  id: string;
  type: 'complete_chore' | 'complete_chores_count' | 'earn_points' | 'reach_streak' | 'collect_card' | 'dialogue_choice' | 'custom';
  description: string;
  target: string | number;  // Chore ID, count, points amount, etc.
  current: number;
  required: number;
  isCompleted: boolean;
}

// Story dialogue sequence
export interface StoryDialogue {
  id: string;
  questId: string;
  orderInQuest: number;
  triggerType: 'quest_start' | 'quest_end' | 'objective_complete' | 'manual';
  triggerId: string | null;  // Which objective triggers this
  lines: DialogueLine[];
}

// Individual dialogue line
export interface DialogueLine {
  id: string;
  characterId: string;
  characterName: string;
  characterAvatar: string;
  text: string;
  emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'excited' | 'worried';
  animation: 'none' | 'bounce' | 'shake' | 'fade' | 'slide';
  choices: DialogueChoice[] | null;  // null = no choice, auto-advance
  delay: number;  // ms before auto-advance (0 = wait for click)
}

// Player choice in dialogue
export interface DialogueChoice {
  id: string;
  text: string;
  nextDialogueId: string | null;  // null = end dialogue
  effect: ChoiceEffect | null;
  isCorrect: boolean | null;  // For quiz-style dialogues
}

// Effect of making a choice
export interface ChoiceEffect {
  type: 'add_points' | 'remove_points' | 'unlock_character' | 'unlock_quest' | 'grant_item' | 'change_affinity';
  target: string;
  value: number;
}

// Rewards for completing a quest
export interface QuestReward {
  xp: number;
  points: number;
  cardPackId: string | null;
  specificCardId: string | null;
  badgeId: string | null;
  petItem: string | null;
  customReward: string | null;
}

// Rewards for completing a chapter
export interface ChapterReward {
  xp: number;
  points: number;
  cardPackId: string | null;
  exclusiveCardId: string | null;
  characterUnlock: string | null;
  badgeId: string | null;
  title: string | null;  // Unlockable title for profile
}

// Member's progress in story mode
export interface StoryProgress {
  memberId: string;
  currentChapterId: string | null;
  currentQuestId: string | null;
  chaptersCompleted: number;
  questsCompleted: number;
  totalPlayTime: number;  // Minutes
  choicesMade: number;
  unlockedCharacters: string[];
  earnedTitles: string[];
  lastPlayedAt: Date;
}

// Chapter progress for a specific member
export interface ChapterProgress {
  chapterId: string;
  status: ChapterStatus;
  questsCompleted: number;
  totalQuests: number;
  completionPercentage: number;
  startedAt: Date | null;
  completedAt: Date | null;
  bestTime: number | null;  // Minutes
  starsEarned: number;  // 0-3 stars
}

// Quest progress for a specific member
export interface QuestProgress {
  questId: string;
  status: QuestStatus;
  objectives: QuestObjective[];
  currentDialogueId: string | null;
  dialoguesViewed: string[];
  choicesMade: Record<string, string>;  // dialogueId -> choiceId
  startedAt: Date | null;
  completedAt: Date | null;
  timeSpent: number;  // Minutes
}

// Story mode overview for a member
export interface StoryOverview {
  progress: StoryProgress;
  chapters: ChapterWithProgress[];
  activeQuest: QuestWithProgress | null;
  recentlyUnlocked: StoryCharacter[];
  suggestedNext: StoryChapter | null;
}

export interface ChapterWithProgress {
  chapter: StoryChapter;
  progress: ChapterProgress;
}

export interface QuestWithProgress {
  quest: StoryQuest;
  progress: QuestProgress;
}

// Dialogue state for UI
export interface DialogueState {
  dialogue: StoryDialogue;
  currentLineIndex: number;
  currentLine: DialogueLine;
  isTyping: boolean;
  canAdvance: boolean;
  hasChoices: boolean;
  isComplete: boolean;
}

// API Request/Response types
export interface StartQuestRequest {
  questId: string;
}

export interface StartQuestResponse {
  quest: QuestWithProgress;
  openingDialogue: StoryDialogue | null;
}

export interface CompleteObjectiveRequest {
  questId: string;
  objectiveId: string;
}

export interface CompleteObjectiveResponse {
  objective: QuestObjective;
  quest: QuestWithProgress;
  triggeredDialogue: StoryDialogue | null;
  questCompleted: boolean;
}

export interface CompleteQuestRequest {
  questId: string;
}

export interface CompleteQuestResponse {
  quest: QuestWithProgress;
  rewards: QuestReward;
  closingDialogue: StoryDialogue | null;
  chapterCompleted: boolean;
  chapterRewards: ChapterReward | null;
  unlockedQuest: StoryQuest | null;
  unlockedChapter: StoryChapter | null;
}

export interface MakeDialogueChoiceRequest {
  dialogueId: string;
  choiceId: string;
}

export interface MakeDialogueChoiceResponse {
  choice: DialogueChoice;
  effect: ChoiceEffect | null;
  nextDialogue: StoryDialogue | null;
}

export interface GetChapterResponse {
  chapter: StoryChapter;
  progress: ChapterProgress;
  quests: QuestWithProgress[];
}
