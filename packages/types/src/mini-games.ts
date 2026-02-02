// Mini-Game Arcade Types (F9.3)

export type GameCategory =
  | 'puzzle'
  | 'sorting'
  | 'time-challenge'
  | 'memory'
  | 'multiplayer';

export type GameDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type UnlockType =
  | 'default'
  | 'chore_count'
  | 'points'
  | 'streak'
  | 'level'
  | 'achievement';

export type GameStatus = 'locked' | 'unlocked' | 'in_progress' | 'completed';

// Game definition
export interface MiniGame {
  id: string;
  name: string;
  description: string;
  category: GameCategory;
  icon: string;
  thumbnail: string;
  minPlayers: number;
  maxPlayers: number;
  estimatedDuration: number; // minutes
  baseXPReward: number;
  basePointReward: number;
  unlockType: UnlockType;
  unlockValue: number | null;
  unlockAchievementId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

// Game configuration for different difficulties
export interface GameConfig {
  gameId: string;
  difficulty: GameDifficulty;
  timeLimit: number; // seconds, 0 = no limit
  targetScore: number;
  gridSize?: { rows: number; cols: number };
  itemCount?: number;
  mistakesAllowed?: number;
  bonusTimeItems?: number;
  speedMultiplier?: number;
  config: Record<string, unknown>;
}

// Game session
export interface GameSession {
  id: string;
  gameId: string;
  householdId: string;
  difficulty: GameDifficulty;
  status: 'active' | 'completed' | 'abandoned';
  startedAt: Date;
  completedAt: Date | null;
  players: GameSessionPlayer[];
  currentRound: number;
  totalRounds: number;
  gameState: Record<string, unknown>;
}

export interface GameSessionPlayer {
  memberId: string;
  memberName: string;
  memberColor: string;
  score: number;
  rank: number | null;
  isHost: boolean;
}

// Game score record
export interface GameScore {
  id: string;
  gameId: string;
  memberId: string;
  householdId: string;
  sessionId: string;
  difficulty: GameDifficulty;
  score: number;
  timeElapsed: number; // seconds
  accuracy: number; // percentage
  combo: number; // max combo
  xpEarned: number;
  pointsEarned: number;
  createdAt: Date;
}

// Member's unlocked games
export interface GameUnlock {
  id: string;
  gameId: string;
  memberId: string;
  householdId: string;
  unlockedAt: Date;
  highScore: number;
  playCount: number;
  totalXPEarned: number;
  lastPlayedAt: Date | null;
  bestDifficulty: GameDifficulty;
}

// Family game night event
export interface FamilyGameNight {
  id: string;
  householdId: string;
  name: string;
  scheduledAt: Date;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  games: FamilyGameNightGame[];
  participants: FamilyGameNightParticipant[];
  hostMemberId: string;
  bonusMultiplier: number;
  createdAt: Date;
}

export interface FamilyGameNightGame {
  gameId: string;
  gameName: string;
  gameIcon: string;
  order: number;
  sessionId: string | null;
  winnerId: string | null;
}

export interface FamilyGameNightParticipant {
  memberId: string;
  memberName: string;
  memberColor: string;
  totalScore: number;
  gamesWon: number;
  isReady: boolean;
}

// Game result
export interface GameResult {
  success: boolean;
  score: number;
  timeElapsed: number;
  accuracy: number;
  combo: number;
  stars: number; // 1-3 based on performance
  xpEarned: number;
  pointsEarned: number;
  newHighScore: boolean;
  achievements: string[];
  rankChange: number | null;
}

// Game leaderboard entry
export interface GameLeaderboardEntry {
  rank: number;
  memberId: string;
  memberName: string;
  memberColor: string;
  score: number;
  difficulty: GameDifficulty;
  playedAt: Date;
}

// Game-specific types

// Puzzle game state
export interface PuzzleGameState {
  grid: PuzzleTile[][];
  emptyPosition: { row: number; col: number };
  moves: number;
  targetImage: string;
  shuffled: boolean;
}

export interface PuzzleTile {
  id: number;
  currentPos: { row: number; col: number };
  correctPos: { row: number; col: number };
  image: string;
}

// Sorting game state
export interface SortingGameState {
  items: SortingItem[];
  bins: SortingBin[];
  sortedCount: number;
  mistakesCount: number;
  timeRemaining: number;
}

export interface SortingItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  sorted: boolean;
}

export interface SortingBin {
  id: string;
  name: string;
  icon: string;
  category: string;
  items: string[];
  capacity: number;
}

// Memory game state
export interface MemoryGameState {
  cards: MemoryCard[];
  flippedCards: string[];
  matchedPairs: string[];
  attempts: number;
  timeRemaining: number;
}

export interface MemoryCard {
  id: string;
  pairId: string;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// Time challenge game state
export interface TimeChallengeGameState {
  tasks: TimeChallengeTask[];
  completedTasks: string[];
  currentTaskIndex: number;
  timeRemaining: number;
  bonusTime: number;
  streak: number;
}

export interface TimeChallengeTask {
  id: string;
  type: 'tap' | 'swipe' | 'hold' | 'pattern';
  instruction: string;
  icon: string;
  timeBonus: number;
  completed: boolean;
}

// API Request/Response types
export interface StartGameRequest {
  difficulty: GameDifficulty;
  playerIds?: string[];
}

export interface StartGameResponse {
  session: GameSession;
  config: GameConfig;
  initialState: Record<string, unknown>;
}

export interface GameActionRequest {
  actionType: string;
  payload: Record<string, unknown>;
}

export interface GameActionResponse {
  success: boolean;
  newState: Record<string, unknown>;
  scoreChange: number;
  comboChange: number;
  isComplete: boolean;
  result?: GameResult;
}

export interface CompleteGameRequest {
  finalState: Record<string, unknown>;
  timeElapsed: number;
  score: number;
  accuracy: number;
  combo: number;
}

export interface CreateFamilyNightRequest {
  name: string;
  scheduledAt: string;
  gameIds: string[];
  participantIds: string[];
}
