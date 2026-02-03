// Homework & Study Tracker Types for F11.1

/**
 * Assignment priority levels
 */
export type AssignmentPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Assignment status
 */
export type AssignmentStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'submitted';

/**
 * Study session types
 */
export type StudySessionType =
  | 'homework' // Working on assignments
  | 'reading' // Reading/textbook study
  | 'practice' // Practice problems/exercises
  | 'review' // Review/test prep
  | 'project' // Project work
  | 'research' // Research/information gathering
  | 'tutoring' // Tutoring session
  | 'group_study'; // Group study session

/**
 * Subject/class definition
 */
export interface Subject {
  id: string;
  householdId: string;
  memberId: string;

  name: string;
  shortName: string | null; // Abbreviation
  color: string; // For UI display
  icon: string | null;

  // Teacher/class info
  teacherName: string | null;
  roomNumber: string | null;
  schedule: string | null; // e.g., "MWF 9:00 AM"

  // Goals
  targetGrade: string | null; // e.g., "A", "90%"
  currentGrade: string | null;

  // Settings
  notifyBeforeClass: boolean;
  notifyMinutesBefore: number;

  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Homework assignment
 */
export interface Assignment {
  id: string;
  householdId: string;
  memberId: string;
  subjectId: string | null;

  title: string;
  description: string | null;
  instructions: string | null;

  // Categorization
  assignmentType: 'homework' | 'quiz' | 'test' | 'project' | 'essay' | 'reading' | 'worksheet' | 'other';
  priority: AssignmentPriority;
  status: AssignmentStatus;

  // Dates
  assignedDate: Date | null;
  dueDate: Date;
  completedAt: Date | null;
  submittedAt: Date | null;

  // Estimated effort
  estimatedMinutes: number | null;
  actualMinutes: number | null;

  // Grading
  maxPoints: number | null;
  earnedPoints: number | null;
  grade: string | null;

  // Attachments/links
  attachments: {
    name: string;
    url: string;
    type: string;
  }[] | null;
  resourceLinks: string[] | null;

  // Rewards
  pointsAwarded: number | null;
  screenTimeAwarded: number | null;

  // Notes
  notes: string | null;
  parentNotes: string | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Study session record
 */
export interface StudySession {
  id: string;
  householdId: string;
  memberId: string;
  subjectId: string | null;
  assignmentId: string | null;

  sessionType: StudySessionType;
  title: string | null;

  // Timing
  startedAt: Date;
  endedAt: Date | null;
  durationMinutes: number;
  plannedDurationMinutes: number | null;

  // Focus tracking (if using focus timer)
  breaksTaken: number;
  focusScore: number | null; // 0-100

  // What was accomplished
  accomplishments: string | null;
  pagesCovered: string | null; // e.g., "pp. 45-52"
  problemsCompleted: number | null;

  // Self-assessment
  productivityRating: number | null; // 1-5
  difficultyRating: number | null; // 1-5
  comprehensionRating: number | null; // 1-5

  // Environment
  location: string | null;
  studyMethod: string | null; // e.g., "Pomodoro", "Flashcards"

  // Rewards earned
  pointsEarned: number;
  bonusPointsEarned: number;

  createdAt: Date;
}

/**
 * Study goal
 */
export interface StudyGoal {
  id: string;
  householdId: string;
  memberId: string;
  subjectId: string | null;

  title: string;
  description: string | null;

  // Goal type
  goalType: 'daily_minutes' | 'weekly_minutes' | 'assignments_per_week' | 'grade_target' | 'custom';
  targetValue: number;
  currentValue: number;

  // Time period
  periodType: 'daily' | 'weekly' | 'monthly' | 'semester' | 'custom';
  startDate: Date;
  endDate: Date | null;

  // Rewards
  rewardPoints: number | null;
  rewardScreenTime: number | null;
  rewardDescription: string | null;

  // Status
  isCompleted: boolean;
  completedAt: Date | null;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Study streak tracking
 */
export interface StudyStreak {
  id: string;
  memberId: string;
  householdId: string;

  currentStreak: number; // Consecutive days
  longestStreak: number;
  lastStudyDate: Date | null;

  // Weekly stats
  weeklyMinutes: number;
  weeklyGoalMinutes: number;
  weeklySessionCount: number;

  // Monthly stats
  monthlyMinutes: number;
  monthlySessionCount: number;

  // Totals
  totalMinutes: number;
  totalSessions: number;
  totalAssignmentsCompleted: number;

  updatedAt: Date;
}

/**
 * Study reminder
 */
export interface StudyReminder {
  id: string;
  householdId: string;
  memberId: string;
  subjectId: string | null;
  assignmentId: string | null;

  reminderType: 'study_time' | 'assignment_due' | 'test_prep' | 'break' | 'custom';
  title: string;
  message: string | null;

  // Schedule
  scheduledFor: Date | null;
  recurringDays: number[] | null; // 0-6 for weekly recurring
  recurringTime: string | null; // HH:MM

  // Status
  isEnabled: boolean;
  lastSentAt: Date | null;
  snoozedUntil: Date | null;

  createdAt: Date;
}

/**
 * Study statistics for a period
 */
export interface StudyStatistics {
  memberId: string;
  period: 'day' | 'week' | 'month' | 'semester' | 'all';
  startDate: Date;
  endDate: Date;

  // Time
  totalMinutes: number;
  averageDailyMinutes: number;
  longestSession: number;

  // Sessions
  totalSessions: number;
  averageSessionLength: number;
  sessionsByType: Record<StudySessionType, number>;

  // Assignments
  assignmentsCompleted: number;
  assignmentsOnTime: number;
  assignmentsLate: number;
  averageGrade: number | null;

  // By subject
  bySubject: {
    subjectId: string;
    subjectName: string;
    minutes: number;
    sessions: number;
    assignmentsCompleted: number;
  }[];

  // Trends
  minutesTrend: 'increasing' | 'decreasing' | 'stable';
  comparedToPrevious: number; // Percentage change

  // Goals
  goalsCompleted: number;
  goalsInProgress: number;

  // Productivity
  averageProductivityRating: number | null;
  averageFocusScore: number | null;

  // Streaks
  currentStreak: number;
  longestStreak: number;
}

/**
 * Study plan for a day/week
 */
export interface StudyPlan {
  id: string;
  householdId: string;
  memberId: string;

  planType: 'daily' | 'weekly';
  date: Date; // Start date
  endDate: Date | null; // For weekly plans

  // Planned items
  plannedItems: {
    subjectId: string | null;
    subjectName: string | null;
    assignmentId: string | null;
    assignmentTitle: string | null;
    plannedMinutes: number;
    scheduledTime: string | null; // HH:MM
    notes: string | null;
    isCompleted: boolean;
  }[];

  // Totals
  totalPlannedMinutes: number;
  totalCompletedMinutes: number;

  // Status
  isCompleted: boolean;
  completionPercentage: number;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input types
 */
export interface CreateSubjectInput {
  name: string;
  shortName?: string;
  color?: string;
  icon?: string;
  teacherName?: string;
  roomNumber?: string;
  schedule?: string;
  targetGrade?: string;
  notifyBeforeClass?: boolean;
  notifyMinutesBefore?: number;
}

export interface CreateAssignmentInput {
  subjectId?: string;
  title: string;
  description?: string;
  instructions?: string;
  assignmentType?: Assignment['assignmentType'];
  priority?: AssignmentPriority;
  assignedDate?: string;
  dueDate: string;
  estimatedMinutes?: number;
  maxPoints?: number;
  attachments?: { name: string; url: string; type: string }[];
  resourceLinks?: string[];
  notes?: string;
}

export interface UpdateAssignmentInput {
  title?: string;
  description?: string;
  instructions?: string;
  assignmentType?: Assignment['assignmentType'];
  priority?: AssignmentPriority;
  status?: AssignmentStatus;
  dueDate?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  maxPoints?: number;
  earnedPoints?: number;
  grade?: string;
  notes?: string;
  parentNotes?: string;
}

export interface StartStudySessionInput {
  subjectId?: string;
  assignmentId?: string;
  sessionType: StudySessionType;
  title?: string;
  plannedDurationMinutes?: number;
  studyMethod?: string;
  location?: string;
}

export interface EndStudySessionInput {
  accomplishments?: string;
  pagesCovered?: string;
  problemsCompleted?: number;
  productivityRating?: number;
  difficultyRating?: number;
  comprehensionRating?: number;
}

export interface CreateStudyGoalInput {
  subjectId?: string;
  title: string;
  description?: string;
  goalType: StudyGoal['goalType'];
  targetValue: number;
  periodType: StudyGoal['periodType'];
  startDate: string;
  endDate?: string;
  rewardPoints?: number;
  rewardScreenTime?: number;
  rewardDescription?: string;
}

/**
 * Subject color options for UI
 */
export const SUBJECT_COLORS = [
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Lime', value: '#84CC16' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Sky', value: '#0EA5E9' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Fuchsia', value: '#D946EF' },
  { name: 'Pink', value: '#EC4899' },
];

/**
 * Study method options
 */
export const STUDY_METHODS = [
  { id: 'pomodoro', name: 'Pomodoro Technique', description: '25 min work, 5 min break' },
  { id: 'flashcards', name: 'Flashcards', description: 'Active recall with cards' },
  { id: 'practice_problems', name: 'Practice Problems', description: 'Work through exercises' },
  { id: 'summarizing', name: 'Summarizing', description: 'Write summaries of material' },
  { id: 'teaching', name: 'Teaching/Explaining', description: 'Explain to others' },
  { id: 'reading', name: 'Active Reading', description: 'Read and take notes' },
  { id: 'video', name: 'Video Learning', description: 'Watch educational videos' },
  { id: 'group', name: 'Group Study', description: 'Study with others' },
  { id: 'mind_mapping', name: 'Mind Mapping', description: 'Create visual maps' },
  { id: 'self_testing', name: 'Self-Testing', description: 'Quiz yourself' },
];
