/**
 * Family Analytics & Insights - F8.5
 * Comprehensive analytics and insights for household chore management
 */

// Time periods for analytics
export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all-time';

// Core analytics types
export interface FamilyAnalytics {
  householdId: string;
  period: AnalyticsPeriod;
  generatedAt: string;

  // Overview stats
  overview: AnalyticsOverview;

  // Member performance
  memberInsights: MemberInsight[];

  // Trends
  trends: AnalyticsTrends;

  // Chore analysis
  choreAnalysis: ChoreAnalysis;

  // Engagement metrics
  engagement: EngagementMetrics;

  // Recommendations
  recommendations: InsightRecommendation[];
}

export interface AnalyticsOverview {
  totalChoresCompleted: number;
  totalChoresAssigned: number;
  completionRate: number;
  totalPointsEarned: number;
  averageChoresPerDay: number;
  activeMemberCount: number;
  currentHouseholdStreak: number;
  longestHouseholdStreak: number;
  comparisonToPrevious: {
    choresCompleted: number; // percentage change
    completionRate: number;
    pointsEarned: number;
  };
}

export interface MemberInsight {
  memberId: string;
  memberName: string;
  avatarUrl?: string;
  role: string;

  // Performance metrics
  choresCompleted: number;
  choresAssigned: number;
  completionRate: number;
  pointsEarned: number;
  currentStreak: number;
  longestStreak: number;

  // Behavioral patterns
  preferredChoreTypes: string[];
  mostProductiveDay: string;
  mostProductiveTime: string;
  averageCompletionTime: number; // minutes

  // Achievements
  badgesEarned: number;
  challengesWon: number;

  // Trends
  performanceTrend: 'improving' | 'stable' | 'declining';
  trendPercentage: number;

  // Rankings
  rank: number;
  rankChange: number; // positive = moved up
}

export interface AnalyticsTrends {
  // Daily completion trend
  dailyCompletions: TrendDataPoint[];

  // Weekly comparison
  weeklyComparison: WeeklyComparisonData[];

  // Peak activity
  peakHours: PeakActivityData[];
  peakDays: PeakActivityData[];

  // Category distribution
  categoryDistribution: CategoryDistributionData[];
}

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface WeeklyComparisonData {
  week: string;
  choresCompleted: number;
  pointsEarned: number;
  completionRate: number;
}

export interface PeakActivityData {
  label: string;
  value: number;
  percentage: number;
}

export interface CategoryDistributionData {
  category: string;
  count: number;
  percentage: number;
  averagePoints: number;
}

export interface ChoreAnalysis {
  // Most/least completed chores
  mostCompletedChores: ChorePerformanceData[];
  leastCompletedChores: ChorePerformanceData[];

  // Difficult chores
  mostSkippedChores: ChorePerformanceData[];
  fastestCompletedChores: ChorePerformanceData[];
  slowestCompletedChores: ChorePerformanceData[];

  // Chore fairness
  choreDistribution: MemberChoreDistribution[];
  fairnessScore: number; // 0-100, 100 = perfectly fair
}

export interface ChorePerformanceData {
  choreId: string;
  choreName: string;
  category: string;
  completionCount: number;
  skipCount: number;
  averageCompletionTime: number;
  assignedTo: string[];
}

export interface MemberChoreDistribution {
  memberId: string;
  memberName: string;
  totalChores: number;
  totalPoints: number;
  choresByCategory: Record<string, number>;
  percentage: number;
}

export interface EngagementMetrics {
  // App usage
  activeUsers: number;
  averageSessionDuration: number; // minutes
  loginFrequency: Record<string, number>; // memberId -> logins

  // Feature usage
  featureUsage: FeatureUsageData[];

  // Gamification
  gamificationEngagement: {
    pointsRedeemed: number;
    rewardsClaimedCount: number;
    challengesParticipated: number;
    achievementsUnlocked: number;
  };

  // Social
  tradeProposals: number;
  tradeAcceptanceRate: number;
  choreSwapsCompleted: number;
}

export interface FeatureUsageData {
  feature: string;
  usageCount: number;
  uniqueUsers: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

// AI-powered insights
export interface InsightRecommendation {
  id: string;
  type: 'improvement' | 'celebration' | 'warning' | 'suggestion';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  targetMemberId?: string;
  targetMemberName?: string;
  actionable: boolean;
  action?: {
    label: string;
    type: 'navigate' | 'adjust' | 'reward' | 'communicate';
    payload?: Record<string, unknown>;
  };
}

// Export/report types
export interface AnalyticsExport {
  format: 'pdf' | 'csv' | 'json';
  period: AnalyticsPeriod;
  sections: ('overview' | 'members' | 'trends' | 'chores' | 'engagement')[];
  generatedAt: string;
  downloadUrl?: string;
}

// Request/response types
export interface GetAnalyticsRequest {
  period?: AnalyticsPeriod;
  memberIds?: string[];
  includeRecommendations?: boolean;
}

export interface ExportAnalyticsRequest {
  format: 'pdf' | 'csv' | 'json';
  period: AnalyticsPeriod;
  sections: ('overview' | 'members' | 'trends' | 'chores' | 'engagement')[];
}

export interface ComparePeriodsRequest {
  period1: AnalyticsPeriod;
  period2: AnalyticsPeriod;
}

export interface PeriodComparison {
  period1: FamilyAnalytics;
  period2: FamilyAnalytics;
  changes: {
    choresCompleted: { absolute: number; percentage: number };
    completionRate: { absolute: number; percentage: number };
    pointsEarned: { absolute: number; percentage: number };
    activeMemberCount: { absolute: number; percentage: number };
  };
  insights: string[];
}

// Helper constants
export const ANALYTICS_PERIODS: { value: AnalyticsPeriod; label: string; days: number }[] = [
  { value: 'day', label: 'Today', days: 1 },
  { value: 'week', label: 'This Week', days: 7 },
  { value: 'month', label: 'This Month', days: 30 },
  { value: 'quarter', label: 'This Quarter', days: 90 },
  { value: 'year', label: 'This Year', days: 365 },
  { value: 'all-time', label: 'All Time', days: -1 },
];

// Helper functions
export function getPeriodLabel(period: AnalyticsPeriod): string {
  return ANALYTICS_PERIODS.find((p) => p.value === period)?.label || period;
}

export function getPeriodDays(period: AnalyticsPeriod): number {
  return ANALYTICS_PERIODS.find((p) => p.value === period)?.days || 30;
}

export function formatPercentageChange(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function getTrendIcon(trend: 'improving' | 'stable' | 'declining'): string {
  switch (trend) {
    case 'improving':
      return 'trending-up';
    case 'declining':
      return 'trending-down';
    default:
      return 'minus';
  }
}

export function getTrendColor(trend: 'improving' | 'stable' | 'declining'): string {
  switch (trend) {
    case 'improving':
      return '#10B981';
    case 'declining':
      return '#EF4444';
    default:
      return '#6B7280';
  }
}

export function calculateFairnessScore(distribution: MemberChoreDistribution[]): number {
  if (distribution.length <= 1) return 100;

  const percentages = distribution.map((d) => d.percentage);
  const idealPercentage = 100 / distribution.length;
  const totalDeviation = percentages.reduce((sum, p) => sum + Math.abs(p - idealPercentage), 0);
  const maxDeviation = 100 - idealPercentage; // worst case per member

  // Convert deviation to score (lower deviation = higher score)
  const score = Math.max(0, 100 - (totalDeviation / distribution.length / maxDeviation) * 100);
  return Math.round(score);
}

export function getInsightPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high':
      return '#EF4444';
    case 'medium':
      return '#F59E0B';
    default:
      return '#3B82F6';
  }
}

export function getInsightTypeIcon(type: 'improvement' | 'celebration' | 'warning' | 'suggestion'): string {
  switch (type) {
    case 'improvement':
      return 'trending-up';
    case 'celebration':
      return 'party-popper';
    case 'warning':
      return 'alert-triangle';
    case 'suggestion':
      return 'lightbulb';
    default:
      return 'info';
  }
}
