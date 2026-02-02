// Parent Dashboard types

export interface DashboardSummary {
  // Period info
  period: {
    start: string; // YYYY-MM-DD
    end: string;
    label: string; // "This Week", "This Month", etc.
  };

  // Overall stats
  totalChoresCompleted: number;
  totalChoresScheduled: number;
  completionRate: number; // 0-100 percentage
  totalPointsAwarded: number;
  totalRewardsRedeemed: number;

  // Pending actions
  pendingApprovals: number;
  pendingRedemptions: number;
  pendingTrades: number;
  pendingPayouts: number;

  // Streaks
  familyStreak: number;
  longestFamilyStreak: number;

  // Top performers
  topPerformers: Array<{
    memberId: string;
    memberName: string;
    memberColor: string;
    choresCompleted: number;
    pointsEarned: number;
  }>;
}

export interface MemberDashboardData {
  memberId: string;
  memberName: string;
  memberColor: string;
  role: string;

  // Stats
  choresCompleted: number;
  choresAssigned: number;
  completionRate: number;
  pointsCurrent: number;
  pointsEarned: number;
  currentStreak: number;
  longestStreak: number;

  // Recent activity
  recentCompletions: Array<{
    id: string;
    choreTitle: string;
    choreIcon: string;
    completedAt: Date;
    pointsAwarded: number;
    status: string;
  }>;

  // Trends
  weeklyCompletion: Array<{
    date: string;
    completed: number;
    scheduled: number;
  }>;
}

export interface DashboardTrend {
  date: string;
  completions: number;
  points: number;
}

export interface DashboardInsight {
  type: 'achievement' | 'warning' | 'suggestion' | 'celebration';
  title: string;
  message: string;
  memberId?: string;
  memberName?: string;
  actionLabel?: string;
  actionRoute?: string;
}

export interface ParentDashboard {
  summary: DashboardSummary;
  memberData: MemberDashboardData[];
  trends: DashboardTrend[];
  insights: DashboardInsight[];
}

// API Request types
export interface DashboardQueryParams {
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
}
