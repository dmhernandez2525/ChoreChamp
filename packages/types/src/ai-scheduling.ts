// AI Scheduling Types

// Scheduling preferences per member
export interface SchedulingPreferences {
  memberId: string;
  preferredDays: number[]; // 0-6 for Sunday-Saturday
  preferredTimeSlots: ('morning' | 'afternoon' | 'evening')[];
  maxChoresPerDay: number;
  maxChoresPerWeek: number;
  avoidDays?: number[]; // Days to avoid scheduling
  notes?: string;
}

// Workload balance data
export interface WorkloadData {
  memberId: string;
  memberName: string;
  memberColor: string;
  totalAssigned: number;
  totalCompleted: number;
  completionRate: number;
  currentWeekChores: number;
  averagePointsPerWeek: number;
  averageChoresPerWeek: number;
}

// Scheduling suggestion from AI
export interface ScheduleSuggestion {
  id: string;
  choreId: string;
  choreTitle: string;
  choreIcon: string;
  choreDifficulty: string;
  chorePoints: number;
  memberId: string;
  memberName: string;
  memberColor: string;
  suggestedDate: string;
  suggestedTime?: string;
  reason: ScheduleReason;
  confidence: number; // 0-100
  alternativeMemberIds?: string[];
  alternativeDates?: string[];
}

// Reason for scheduling suggestion
export interface ScheduleReason {
  type: 'workload_balance' | 'pattern_match' | 'age_appropriate' | 'availability' | 'rotation' | 'preference';
  message: string;
  factors: string[];
}

// AI-generated schedule for a period
export interface AISchedule {
  id: string;
  householdId: string;
  periodStart: string;
  periodEnd: string;
  suggestions: ScheduleSuggestion[];
  workloadSummary: WorkloadData[];
  generatedAt: string;
  appliedAt?: string;
  status: 'pending' | 'applied' | 'rejected' | 'expired';
}

// Request to generate AI schedule
export interface GenerateScheduleRequest {
  period: 'day' | 'week' | 'month';
  startDate?: string;
  includeUnassigned?: boolean;
  balanceWorkload?: boolean;
  considerPatterns?: boolean;
  considerAge?: boolean;
  excludeChoreIds?: string[];
  excludeMemberIds?: string[];
}

// Member completion pattern
export interface CompletionPattern {
  memberId: string;
  memberName: string;
  byDayOfWeek: { day: number; count: number; rate: number }[];
  byTimeOfDay: { slot: string; count: number; rate: number }[];
  byCategory: { category: string; count: number; rate: number }[];
  averageCompletionTime: number; // hours after assigned
  streakTendency: 'improving' | 'stable' | 'declining';
}

// Scheduling conflict
export interface SchedulingConflict {
  type: 'overload' | 'unavailable' | 'duplicate' | 'age_mismatch';
  message: string;
  affectedMemberId?: string;
  affectedChoreId?: string;
  suggestedDate?: string;
  resolution?: string;
}

// Apply schedule request
export interface ApplyScheduleRequest {
  scheduleId: string;
  suggestionIds: string[]; // Which suggestions to apply
  createRecurrences?: boolean;
}

// Schedule application result
export interface ApplyScheduleResult {
  applied: number;
  skipped: number;
  conflicts: SchedulingConflict[];
  scheduleIds: string[]; // Created choreSchedule IDs
}

// Optimization suggestion
export interface OptimizationSuggestion {
  type: 'redistribute' | 'swap' | 'reschedule' | 'unassign';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  affectedMembers: string[];
  affectedChores: string[];
  suggestedAction: {
    action: string;
    params: Record<string, string | string[] | number>;
  };
}

// Schedule analytics
export interface ScheduleAnalytics {
  householdId: string;
  period: { start: string; end: string };
  totalScheduled: number;
  totalCompleted: number;
  completionRate: number;
  workloadDistribution: {
    memberId: string;
    memberName: string;
    assigned: number;
    completed: number;
    percentage: number;
  }[];
  peakDays: { day: number; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
  recommendations: OptimizationSuggestion[];
}
