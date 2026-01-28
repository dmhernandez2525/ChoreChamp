// Chore types

export type Difficulty = 'easy' | 'medium' | 'hard';
export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly' | 'after_completion' | 'custom';
export type AssignmentType = 'specific' | 'anyone' | 'rotation';
export type CompletionStatus = 'pending' | 'approved' | 'rejected';

export type ChoreCategory =
  | 'kitchen'
  | 'bathroom'
  | 'bedroom'
  | 'living_room'
  | 'outdoor'
  | 'pet_care'
  | 'laundry'
  | 'general';

export interface Chore {
  id: string;
  householdId: string;

  title: string;
  description: string | null;
  icon: string;
  category: ChoreCategory;

  // Points
  pointValue: number;
  difficulty: Difficulty;

  // Assignment
  assignedTo: string[];
  assignmentType: AssignmentType;
  rotationIndex: number;

  // Scheduling
  recurrenceType: RecurrenceType;
  recurrenceDays: number[] | null; // 0-6 for days of week
  recurrenceInterval: number | null;
  recurrenceAfterDays: number | null;
  startDate: string; // YYYY-MM-DD
  endDate: string | null;
  dueTime: string | null; // HH:MM
  timeWindowMinutes: number | null;

  // Requirements
  requiresApproval: boolean;
  requiresPhoto: boolean;
  estimatedMinutes: number | null;

  // ADHD settings
  showTimer: boolean;
  steps: string[] | null;

  // Metadata
  createdBy: string;
  isActive: boolean;
  templateId: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface ChoreTemplate {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  category: ChoreCategory;
  pointValue: number;
  difficulty: Difficulty;
  estimatedMinutes: number | null;
  minAge: number | null;
  maxAge: number | null;
  steps: string[] | null;
  sortOrder: number;
  isActive: boolean;
}

export interface ChoreCompletion {
  id: string;
  choreId: string;
  householdId: string;
  memberId: string;

  scheduledDate: string; // YYYY-MM-DD
  completedAt: Date;

  status: CompletionStatus;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;

  photoUrl: string | null;

  pointsAwarded: number;
  streakDay: number | null;

  // Time tracking
  startedAt: Date | null;
  durationSeconds: number | null;

  createdAt: Date;
}

export interface ChoreSchedule {
  id: string;
  choreId: string;
  householdId: string;
  scheduledDate: string;
  assignedTo: string;
  isCompleted: boolean;
  completionId: string | null;
  createdAt: Date;
}

// API Request/Response types
export interface CreateChoreRequest {
  title: string;
  description?: string;
  icon?: string;
  category?: ChoreCategory;
  pointValue?: number;
  difficulty?: Difficulty;
  assignedTo?: string[];
  assignmentType?: AssignmentType;
  recurrenceType?: RecurrenceType;
  recurrenceDays?: number[];
  recurrenceInterval?: number;
  recurrenceAfterDays?: number;
  startDate?: string;
  endDate?: string;
  dueTime?: string;
  timeWindowMinutes?: number;
  requiresApproval?: boolean;
  requiresPhoto?: boolean;
  estimatedMinutes?: number;
  showTimer?: boolean;
  steps?: string[];
}

export interface CompleteChoreRequest {
  scheduledDate?: string;
  photoUrl?: string;
  startedAt?: Date;
  durationSeconds?: number;
}

export interface TodayChore extends ChoreSchedule {
  chore: Chore;
  completion: ChoreCompletion | null;
}

export interface ChoreWithCompletions extends Chore {
  completions: ChoreCompletion[];
}
