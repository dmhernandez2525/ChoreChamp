// Educational Chore Tasks Types for F11.2

/**
 * Educational content types
 */
export type EducationalContentType =
  | 'math_facts' // Basic math practice
  | 'spelling' // Spelling words
  | 'vocabulary' // Vocabulary building
  | 'reading' // Reading comprehension
  | 'trivia' // Educational trivia
  | 'science' // Science facts/concepts
  | 'history' // History facts
  | 'geography' // Geography knowledge
  | 'language' // Foreign language practice
  | 'life_skills' // Practical life skills
  | 'custom'; // Custom educational content

/**
 * Difficulty levels for educational content
 */
export type EducationalDifficulty = 'easy' | 'medium' | 'hard' | 'adaptive';

/**
 * Educational chore template - defines educational requirements
 */
export interface EducationalChoreTemplate {
  id: string;
  householdId: string;

  name: string;
  description: string | null;
  category: string | null;

  // Educational content requirements
  contentType: EducationalContentType;
  difficulty: EducationalDifficulty;

  // When to present educational content
  timing: 'before_chore' | 'during_chore' | 'after_chore' | 'any';

  // Requirements
  questionsRequired: number;
  minimumCorrectPercent: number; // 0-100
  timeLimit: number | null; // Minutes, null = no limit

  // If failed
  allowRetry: boolean;
  maxRetries: number;
  retryDelay: number; // Minutes between retries

  // Rewards
  bonusPointsForPerfect: number;
  bonusScreenTimeMinutes: number | null;

  // Age targeting
  minAge: number | null;
  maxAge: number | null;
  gradeLevel: string | null; // e.g., "3rd", "5th-6th"

  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Educational question
 */
export interface EducationalQuestion {
  id: string;
  householdId: string | null; // null = system-wide

  contentType: EducationalContentType;
  difficulty: EducationalDifficulty;
  gradeLevel: string | null;

  question: string;
  questionType: 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer' | 'matching';

  // For multiple choice
  options: string[] | null;
  correctAnswer: string;
  explanation: string | null;

  // Media
  imageUrl: string | null;
  audioUrl: string | null;

  // Metadata
  topic: string | null;
  subtopic: string | null;
  tags: string[] | null;

  // Stats
  timesAsked: number;
  timesCorrect: number;

  isActive: boolean;
  createdAt: Date;
}

/**
 * Educational session - tracks a quiz/learning session
 */
export interface EducationalSession {
  id: string;
  householdId: string;
  memberId: string;
  choreId: string | null;
  templateId: string | null;

  contentType: EducationalContentType;
  difficulty: EducationalDifficulty;

  // Status
  status: 'in_progress' | 'completed' | 'failed' | 'abandoned';

  // Questions
  totalQuestions: number;
  questionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;

  // Timing
  startedAt: Date;
  completedAt: Date | null;
  timeLimitMinutes: number | null;
  timeSpentSeconds: number;

  // Results
  scorePercent: number | null;
  passed: boolean | null;
  minimumRequired: number;

  // Rewards earned
  pointsEarned: number;
  bonusPointsEarned: number;
  screenTimeEarned: number;

  // Retry info
  attemptNumber: number;
  canRetry: boolean;

  createdAt: Date;
}

/**
 * Educational answer - individual answer record
 */
export interface EducationalAnswer {
  id: string;
  sessionId: string;
  questionId: string;

  answer: string;
  isCorrect: boolean;
  timeSpentSeconds: number;

  // For review
  correctAnswer: string;
  explanation: string | null;

  answeredAt: Date;
}

/**
 * Member educational progress
 */
export interface MemberEducationalProgress {
  id: string;
  memberId: string;
  householdId: string;

  // By content type
  progressByType: Record<EducationalContentType, {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    currentStreak: number;
    bestStreak: number;
    averageTimeSeconds: number;
    masteryLevel: number; // 0-100
  }>;

  // Overall stats
  totalSessions: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  overallAccuracy: number;

  // Streaks
  currentDayStreak: number;
  longestDayStreak: number;
  lastActivityDate: Date | null;

  // Points
  totalPointsEarned: number;
  totalBonusEarned: number;

  // Levels
  overallLevel: number;
  experiencePoints: number;
  nextLevelXp: number;

  updatedAt: Date;
}

/**
 * Educational achievement
 */
export interface EducationalAchievement {
  id: string;
  memberId: string;
  householdId: string;

  achievementType: 'perfect_score' | 'streak' | 'mastery' | 'speed' | 'volume' | 'improvement';
  title: string;
  description: string;
  iconUrl: string | null;

  // What triggered it
  contentType: EducationalContentType | null;
  threshold: number; // What value triggered this
  value: number; // Actual value achieved

  pointsAwarded: number;
  earnedAt: Date;
}

/**
 * Chore-educational link - connects a chore to educational content
 */
export interface ChoreEducationalLink {
  id: string;
  choreId: string;
  templateId: string;
  householdId: string;

  // Override template settings
  questionsRequired: number | null;
  minimumCorrectPercent: number | null;
  bonusPointsForPerfect: number | null;

  // Completion status
  isRequired: boolean; // Must complete to get chore credit
  isCompleted: boolean;
  completedSessionId: string | null;

  createdAt: Date;
}

/**
 * Learning path - sequence of educational content
 */
export interface LearningPath {
  id: string;
  householdId: string;

  name: string;
  description: string | null;
  contentType: EducationalContentType;

  // Path structure
  levels: {
    levelNumber: number;
    name: string;
    description: string | null;
    difficulty: EducationalDifficulty;
    questionsToPass: number;
    passingPercent: number;
    topics: string[];
    rewardPoints: number;
    rewardBadge: string | null;
  }[];

  // Settings
  requireSequential: boolean; // Must complete levels in order
  allowSkipAhead: boolean;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Member learning path progress
 */
export interface MemberLearningPathProgress {
  id: string;
  memberId: string;
  pathId: string;
  householdId: string;

  currentLevel: number;
  highestLevelCompleted: number;

  // Level completions
  levelCompletions: {
    level: number;
    completedAt: Date;
    score: number;
    attempts: number;
  }[];

  // Stats
  totalAttempts: number;
  totalTimeMinutes: number;
  averageScore: number;

  isCompleted: boolean;
  completedAt: Date | null;
  startedAt: Date;
  lastActivityAt: Date;
}

/**
 * Input types
 */
export interface CreateEducationalTemplateInput {
  name: string;
  description?: string;
  category?: string;
  contentType: EducationalContentType;
  difficulty: EducationalDifficulty;
  timing: EducationalChoreTemplate['timing'];
  questionsRequired: number;
  minimumCorrectPercent: number;
  timeLimit?: number;
  allowRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  bonusPointsForPerfect?: number;
  bonusScreenTimeMinutes?: number;
  minAge?: number;
  maxAge?: number;
  gradeLevel?: string;
}

export interface CreateQuestionInput {
  contentType: EducationalContentType;
  difficulty: EducationalDifficulty;
  gradeLevel?: string;
  question: string;
  questionType: EducationalQuestion['questionType'];
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  imageUrl?: string;
  topic?: string;
  subtopic?: string;
  tags?: string[];
}

export interface StartEducationalSessionInput {
  memberId: string;
  choreId?: string;
  templateId?: string;
  contentType: EducationalContentType;
  difficulty: EducationalDifficulty;
  questionCount?: number;
  timeLimitMinutes?: number;
}

export interface SubmitAnswerInput {
  questionId: string;
  answer: string;
  timeSpentSeconds: number;
}

/**
 * Content type configurations
 */
export const CONTENT_TYPE_CONFIG: Record<EducationalContentType, {
  name: string;
  description: string;
  icon: string;
  color: string;
  gradeLevels: string[];
}> = {
  math_facts: {
    name: 'Math Facts',
    description: 'Addition, subtraction, multiplication, division',
    icon: '🔢',
    color: '#3B82F6',
    gradeLevels: ['K', '1st', '2nd', '3rd', '4th', '5th'],
  },
  spelling: {
    name: 'Spelling',
    description: 'Spelling words and phonics',
    icon: '📝',
    color: '#10B981',
    gradeLevels: ['1st', '2nd', '3rd', '4th', '5th', '6th'],
  },
  vocabulary: {
    name: 'Vocabulary',
    description: 'Word meanings and usage',
    icon: '📖',
    color: '#8B5CF6',
    gradeLevels: ['2nd', '3rd', '4th', '5th', '6th', '7th', '8th'],
  },
  reading: {
    name: 'Reading',
    description: 'Reading comprehension',
    icon: '📚',
    color: '#F59E0B',
    gradeLevels: ['K', '1st', '2nd', '3rd', '4th', '5th', '6th'],
  },
  trivia: {
    name: 'Trivia',
    description: 'Fun educational trivia',
    icon: '🎯',
    color: '#EC4899',
    gradeLevels: ['All'],
  },
  science: {
    name: 'Science',
    description: 'Science facts and concepts',
    icon: '🔬',
    color: '#06B6D4',
    gradeLevels: ['3rd', '4th', '5th', '6th', '7th', '8th'],
  },
  history: {
    name: 'History',
    description: 'Historical facts and events',
    icon: '📜',
    color: '#78716C',
    gradeLevels: ['3rd', '4th', '5th', '6th', '7th', '8th'],
  },
  geography: {
    name: 'Geography',
    description: 'Countries, capitals, and maps',
    icon: '🌍',
    color: '#22C55E',
    gradeLevels: ['3rd', '4th', '5th', '6th', '7th', '8th'],
  },
  language: {
    name: 'Language',
    description: 'Foreign language practice',
    icon: '🗣️',
    color: '#EF4444',
    gradeLevels: ['All'],
  },
  life_skills: {
    name: 'Life Skills',
    description: 'Practical everyday skills',
    icon: '🏠',
    color: '#A855F7',
    gradeLevels: ['All'],
  },
  custom: {
    name: 'Custom',
    description: 'Custom educational content',
    icon: '✨',
    color: '#6B7280',
    gradeLevels: ['All'],
  },
};

/**
 * Sample questions for quick setup
 */
export const SAMPLE_MATH_FACTS = [
  { question: '7 + 5 = ?', options: ['10', '11', '12', '13'], answer: '12', difficulty: 'easy' },
  { question: '8 × 7 = ?', options: ['54', '56', '63', '49'], answer: '56', difficulty: 'medium' },
  { question: '144 ÷ 12 = ?', options: ['10', '11', '12', '13'], answer: '12', difficulty: 'hard' },
];
