// Predictive Streak Protection Types

// Streak risk level
export type StreakRiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

// Risk factors that can threaten a streak
export type RiskFactor =
  | 'time_running_out'
  | 'busy_schedule'
  | 'low_activity_pattern'
  | 'missed_recent_days'
  | 'weekend_pattern'
  | 'holiday_period'
  | 'multiple_chores_pending'
  | 'historical_break_day';

// Streak health status
export interface StreakHealth {
  memberId: string;
  memberName: string;
  currentStreak: number;
  longestStreak: number;
  riskLevel: StreakRiskLevel;
  riskScore: number;
  riskFactors: RiskFactor[];
  predictedBreakProbability: number;
  lastCompletedDate: string | null;
  freezesAvailable: number;
  freezesUsed: number;
  daysUntilMilestone: number | null;
  nextMilestone: number | null;
}

// Streak prediction
export interface StreakPrediction {
  memberId: string;
  memberName: string;
  currentStreak: number;
  predictedOutcome: 'continue' | 'at_risk' | 'likely_break';
  confidence: number;
  breakProbability: number;
  riskPeakTime: string | null;
  suggestedActions: StreakProtectionAction[];
  historicalPatterns: StreakPattern[];
}

// Historical streak patterns
export interface StreakPattern {
  patternType: 'day_of_week' | 'time_of_day' | 'chore_type' | 'workload';
  description: string;
  frequency: number;
  impact: 'positive' | 'negative';
  confidence: number;
}

// Suggested protection actions
export interface StreakProtectionAction {
  type: 'use_freeze' | 'set_reminder' | 'reduce_workload' | 'early_completion' | 'notify_parent';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  effectivenessScore: number;
  automated?: boolean;
}

// Streak alert
export interface StreakAlert {
  id: string;
  memberId: string;
  memberName: string;
  alertType: 'warning' | 'urgent' | 'freeze_suggestion' | 'milestone_approaching';
  title: string;
  message: string;
  riskLevel: StreakRiskLevel;
  createdAt: string;
  expiresAt: string;
  isRead: boolean;
  isDismissed: boolean;
  suggestedAction?: StreakProtectionAction;
}

// Protection settings
export interface StreakProtectionSettings {
  enabled: boolean;
  alertThreshold: StreakRiskLevel;
  autoFreeze: boolean;
  autoFreezeThreshold: number;
  reminderBuffer: number;
  notifyParents: boolean;
  customReminderTimes: string[];
  weekendExempt: boolean;
  vacationMode: boolean;
  vacationEndDate: string | null;
}

// Streak analytics
export interface StreakAnalytics {
  memberId: string;
  memberName: string;
  totalStreaksStarted: number;
  averageStreakLength: number;
  longestStreak: number;
  currentStreak: number;
  streaksEndedByDay: Record<string, number>;
  mostProductiveDays: string[];
  leastProductiveDays: string[];
  freezesUsedTotal: number;
  freezesSavedStreaks: number;
  riskHistoryLast30Days: Array<{
    date: string;
    riskLevel: StreakRiskLevel;
    wasProtected: boolean;
  }>;
}

// Household streak summary
export interface HouseholdStreakSummary {
  householdId: string;
  settings: StreakProtectionSettings;
  memberHealth: StreakHealth[];
  activeAlerts: StreakAlert[];
  totalActiveStreaks: number;
  totalMembersAtRisk: number;
  freezesAvailableTotal: number;
  upcomingMilestones: Array<{
    memberId: string;
    memberName: string;
    currentStreak: number;
    milestone: number;
    daysRemaining: number;
  }>;
}

// Request types
export interface UpdateProtectionSettingsRequest {
  enabled?: boolean;
  alertThreshold?: StreakRiskLevel;
  autoFreeze?: boolean;
  autoFreezeThreshold?: number;
  reminderBuffer?: number;
  notifyParents?: boolean;
  customReminderTimes?: string[];
  weekendExempt?: boolean;
  vacationMode?: boolean;
  vacationEndDate?: string | null;
}

export interface UseStreakFreezeRequest {
  memberId: string;
  reason?: string;
}

export interface DismissAlertRequest {
  alertId: string;
}

// Risk level thresholds
export const RISK_THRESHOLDS = {
  safe: { min: 0, max: 20 },
  low: { min: 21, max: 40 },
  medium: { min: 41, max: 60 },
  high: { min: 61, max: 80 },
  critical: { min: 81, max: 100 },
} as const;

// Streak milestones
export const STREAK_MILESTONES = [7, 14, 21, 30, 60, 90, 180, 365] as const;

// Helper to calculate risk level from score
export function getRiskLevelFromScore(score: number): StreakRiskLevel {
  if (score <= RISK_THRESHOLDS.safe.max) return 'safe';
  if (score <= RISK_THRESHOLDS.low.max) return 'low';
  if (score <= RISK_THRESHOLDS.medium.max) return 'medium';
  if (score <= RISK_THRESHOLDS.high.max) return 'high';
  return 'critical';
}

// Helper to get next milestone
export function getNextMilestone(currentStreak: number): number | null {
  for (const milestone of STREAK_MILESTONES) {
    if (milestone > currentStreak) {
      return milestone;
    }
  }
  return null;
}

// Helper to get risk color
export function getRiskColor(riskLevel: StreakRiskLevel): string {
  const colors: Record<StreakRiskLevel, string> = {
    safe: '#22c55e',
    low: '#84cc16',
    medium: '#eab308',
    high: '#f97316',
    critical: '#ef4444',
  };
  return colors[riskLevel];
}
