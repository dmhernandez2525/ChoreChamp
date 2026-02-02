// Difficulty Auto-Calibration Types

// Difficulty levels
export type DifficultyLevel = 'trivial' | 'easy' | 'medium' | 'hard' | 'expert';

// Calibration status
export type CalibrationStatus = 'under_calibrated' | 'calibrated' | 'over_calibrated' | 'needs_review';

// Chore performance metrics
export interface ChorePerformanceMetrics {
  choreId: string;
  choreTitle: string;
  memberId: string;
  memberName: string;
  totalCompletions: number;
  successfulCompletions: number;
  averageTimeMinutes: number | null;
  expectedTimeMinutes: number | null;
  completionRate: number;
  onTimeRate: number;
  streakContribution: number;
  lastCompletedAt: string | null;
}

// Difficulty calibration suggestion
export interface CalibrationSuggestion {
  choreId: string;
  choreTitle: string;
  currentDifficulty: DifficultyLevel;
  suggestedDifficulty: DifficultyLevel;
  currentPoints: number;
  suggestedPoints: number;
  confidence: number;
  reason: string;
  basedOn: CalibrationFactor[];
  memberSpecific?: {
    memberId: string;
    memberName: string;
    performance: 'exceeds' | 'meets' | 'struggles';
  };
}

// Factors used for calibration
export type CalibrationFactor =
  | 'completion_rate'
  | 'time_efficiency'
  | 'consistency'
  | 'member_age'
  | 'member_experience'
  | 'household_average';

// Calibration analysis for a chore
export interface ChoreCalibrationAnalysis {
  choreId: string;
  choreTitle: string;
  category: string;
  currentDifficulty: DifficultyLevel;
  currentPoints: number;
  status: CalibrationStatus;
  metrics: {
    householdCompletionRate: number;
    householdAverageTime: number | null;
    memberPerformance: MemberChorePerformance[];
    recentTrend: 'improving' | 'stable' | 'declining';
  };
  suggestions: CalibrationSuggestion[];
}

// Member-specific performance on a chore
export interface MemberChorePerformance {
  memberId: string;
  memberName: string;
  memberAge: number | null;
  completionRate: number;
  averageTimeMinutes: number | null;
  performanceLevel: 'exceeds' | 'meets' | 'struggles' | 'insufficient_data';
  lastCompletion: string | null;
}

// Auto-calibration settings
export interface CalibrationSettings {
  enabled: boolean;
  autoApply: boolean;
  minCompletionsRequired: number;
  calibrationFrequency: 'weekly' | 'biweekly' | 'monthly';
  notifyOnSuggestion: boolean;
  pointsAdjustmentLimit: number;
  considerMemberAge: boolean;
  lastCalibrationAt: string | null;
  nextCalibrationAt: string | null;
}

// Calibration history entry
export interface CalibrationHistoryEntry {
  id: string;
  choreId: string;
  choreTitle: string;
  previousDifficulty: DifficultyLevel;
  newDifficulty: DifficultyLevel;
  previousPoints: number;
  newPoints: number;
  appliedAt: string;
  appliedBy: 'auto' | 'manual';
  reason: string;
}

// Household calibration summary
export interface HouseholdCalibrationSummary {
  householdId: string;
  settings: CalibrationSettings;
  totalChores: number;
  needsCalibration: number;
  calibrated: number;
  suggestions: CalibrationSuggestion[];
  recentCalibrations: CalibrationHistoryEntry[];
  memberPerformanceSummary: MemberPerformanceSummary[];
}

// Member performance summary across all chores
export interface MemberPerformanceSummary {
  memberId: string;
  memberName: string;
  totalChoresAssigned: number;
  averageCompletionRate: number;
  choresExceeding: number;
  choresMeeting: number;
  choresStruggling: number;
  suggestedAdjustments: number;
}

// Difficulty point mapping
export const DIFFICULTY_POINTS: Record<DifficultyLevel, { min: number; default: number; max: number }> = {
  trivial: { min: 1, default: 5, max: 10 },
  easy: { min: 5, default: 10, max: 20 },
  medium: { min: 15, default: 25, max: 40 },
  hard: { min: 30, default: 50, max: 75 },
  expert: { min: 50, default: 75, max: 100 },
};

// Difficulty display info
export const DIFFICULTY_INFO: Record<DifficultyLevel, { label: string; color: string; description: string }> = {
  trivial: {
    label: 'Trivial',
    color: '#94a3b8',
    description: 'Very quick and simple tasks (1-2 minutes)',
  },
  easy: {
    label: 'Easy',
    color: '#22c55e',
    description: 'Simple tasks most kids can do (5-10 minutes)',
  },
  medium: {
    label: 'Medium',
    color: '#eab308',
    description: 'Requires some effort and attention (15-30 minutes)',
  },
  hard: {
    label: 'Hard',
    color: '#f97316',
    description: 'Challenging tasks needing skill (30-60 minutes)',
  },
  expert: {
    label: 'Expert',
    color: '#ef4444',
    description: 'Complex tasks for experienced members (60+ minutes)',
  },
};

// Request types
export interface UpdateCalibrationSettingsRequest {
  enabled?: boolean;
  autoApply?: boolean;
  minCompletionsRequired?: number;
  calibrationFrequency?: 'weekly' | 'biweekly' | 'monthly';
  notifyOnSuggestion?: boolean;
  pointsAdjustmentLimit?: number;
  considerMemberAge?: boolean;
}

export interface ApplyCalibrationRequest {
  choreId: string;
  newDifficulty?: DifficultyLevel;
  newPoints?: number;
}

export interface BulkApplyCalibrationRequest {
  suggestions: Array<{
    choreId: string;
    newDifficulty?: DifficultyLevel;
    newPoints?: number;
  }>;
}

// Helper function to calculate suggested points
export function calculateSuggestedPoints(
  currentDifficulty: DifficultyLevel,
  suggestedDifficulty: DifficultyLevel,
  currentPoints: number
): number {
  const currentRange = DIFFICULTY_POINTS[currentDifficulty];
  const suggestedRange = DIFFICULTY_POINTS[suggestedDifficulty];

  // Calculate where current points fall in the current range (0-1)
  const rangePosition = (currentPoints - currentRange.min) / (currentRange.max - currentRange.min);
  const clampedPosition = Math.max(0, Math.min(1, rangePosition));

  // Apply same position to suggested range
  const suggestedPoints = suggestedRange.min + clampedPosition * (suggestedRange.max - suggestedRange.min);

  return Math.round(suggestedPoints);
}

// Helper to determine calibration status
export function determineCalibrationStatus(
  completionRate: number,
  onTimeRate: number
): CalibrationStatus {
  // Very high rates suggest the chore is too easy
  if (completionRate > 95 && onTimeRate > 90) {
    return 'under_calibrated';
  }

  // Very low rates suggest the chore is too hard
  if (completionRate < 50 || onTimeRate < 40) {
    return 'over_calibrated';
  }

  // Moderate rates need review
  if (completionRate < 70 || onTimeRate < 60) {
    return 'needs_review';
  }

  return 'calibrated';
}
