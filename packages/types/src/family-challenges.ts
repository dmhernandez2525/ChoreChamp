// Family Challenges Types

// Challenge types
export type ChallengeType = 'collaborative' | 'competitive' | 'individual' | 'team';

// Challenge status
export type ChallengeStatus = 'draft' | 'active' | 'paused' | 'completed' | 'expired' | 'cancelled';

// Challenge goal types
export type GoalType =
  | 'total_chores'
  | 'streak_days'
  | 'total_points'
  | 'category_chores'
  | 'perfect_days'
  | 'on_time_completion'
  | 'custom';

// Challenge participant
export interface ChallengeParticipant {
  memberId: string;
  memberName: string;
  teamId?: string;
  progress: number;
  contribution: number;
  joinedAt: string;
  isActive: boolean;
}

// Challenge team
export interface ChallengeTeam {
  id: string;
  name: string;
  color: string;
  memberIds: string[];
  progress: number;
  totalContribution: number;
}

// Challenge goal
export interface ChallengeGoal {
  type: GoalType;
  target: number;
  current: number;
  unit: string;
  category?: string;
  description: string;
}

// Challenge reward
export interface ChallengeReward {
  type: 'points' | 'badge' | 'custom' | 'streak_freeze';
  title: string;
  description: string;
  value?: number;
  badgeId?: string;
  distributionType: 'all' | 'winner' | 'top_3' | 'proportional';
}

// Family challenge
export interface FamilyChallenge {
  id: string;
  householdId: string;
  title: string;
  description: string;
  type: ChallengeType;
  status: ChallengeStatus;
  goal: ChallengeGoal;
  rewards: ChallengeReward[];
  participants: ChallengeParticipant[];
  teams?: ChallengeTeam[];
  startDate: string;
  endDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  settings: ChallengeSettings;
}

// Challenge settings
export interface ChallengeSettings {
  allowLateJoin: boolean;
  showProgress: boolean;
  showLeaderboard: boolean;
  notifyOnProgress: boolean;
  notifyOnMilestone: boolean;
  milestonePercentages: number[];
}

// Challenge progress update
export interface ChallengeProgressUpdate {
  challengeId: string;
  memberId: string;
  previousProgress: number;
  newProgress: number;
  contribution: number;
  updatedAt: string;
  trigger: string;
}

// Challenge leaderboard entry
export interface ChallengeLeaderboardEntry {
  rank: number;
  memberId?: string;
  memberName?: string;
  teamId?: string;
  teamName?: string;
  progress: number;
  contribution: number;
  isCurrentUser?: boolean;
}

// Challenge milestone
export interface ChallengeMilestone {
  percentage: number;
  reachedAt: string | null;
  reachedBy: string | null;
}

// Challenge summary
export interface ChallengeSummary {
  challenge: FamilyChallenge;
  leaderboard: ChallengeLeaderboardEntry[];
  milestones: ChallengeMilestone[];
  timeRemaining: {
    days: number;
    hours: number;
    minutes: number;
  } | null;
  progressPercentage: number;
  isParticipating: boolean;
  userRank: number | null;
}

// Household challenges overview
export interface HouseholdChallengesOverview {
  householdId: string;
  activeChallenges: FamilyChallenge[];
  upcomingChallenges: FamilyChallenge[];
  completedChallenges: FamilyChallenge[];
  stats: {
    totalChallengesCreated: number;
    totalChallengesCompleted: number;
    totalChallengesWon: number;
    averageParticipation: number;
  };
}

// Request types
export interface CreateChallengeRequest {
  title: string;
  description: string;
  type: ChallengeType;
  goal: {
    type: GoalType;
    target: number;
    unit: string;
    category?: string;
    description: string;
  };
  rewards: ChallengeReward[];
  participantIds: string[];
  teams?: Array<{ name: string; color: string; memberIds: string[] }>;
  startDate: string;
  endDate: string;
  settings?: Partial<ChallengeSettings>;
}

export interface UpdateChallengeRequest {
  title?: string;
  description?: string;
  status?: ChallengeStatus;
  rewards?: ChallengeReward[];
  endDate?: string;
  settings?: Partial<ChallengeSettings>;
}

export interface JoinChallengeRequest {
  memberId: string;
  teamId?: string;
}

// Challenge templates
export interface ChallengeTemplate {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  goalType: GoalType;
  suggestedTarget: number;
  suggestedDuration: number;
  suggestedRewards: ChallengeReward[];
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  icon: string;
}

// Default challenge templates
export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    id: 'weekly-warrior',
    title: 'Weekly Warrior',
    description: 'Complete a set number of chores as a family in one week',
    type: 'collaborative',
    goalType: 'total_chores',
    suggestedTarget: 50,
    suggestedDuration: 7,
    suggestedRewards: [
      { type: 'points', title: 'Bonus Points', description: '50 bonus points each', value: 50, distributionType: 'all' },
    ],
    category: 'weekly',
    difficulty: 'medium',
    icon: '🗡️',
  },
  {
    id: 'streak-masters',
    title: 'Streak Masters',
    description: 'Keep all family streaks alive for a week',
    type: 'collaborative',
    goalType: 'streak_days',
    suggestedTarget: 7,
    suggestedDuration: 7,
    suggestedRewards: [
      { type: 'streak_freeze', title: 'Streak Freeze', description: 'Everyone gets a streak freeze', distributionType: 'all' },
    ],
    category: 'streaks',
    difficulty: 'hard',
    icon: '🔥',
  },
  {
    id: 'point-race',
    title: 'Point Race',
    description: 'Who can earn the most points?',
    type: 'competitive',
    goalType: 'total_points',
    suggestedTarget: 200,
    suggestedDuration: 7,
    suggestedRewards: [
      { type: 'badge', title: 'Champion Badge', description: 'Special champion badge', badgeId: 'champion', distributionType: 'winner' },
    ],
    category: 'competition',
    difficulty: 'medium',
    icon: '🏆',
  },
  {
    id: 'perfect-week',
    title: 'Perfect Week',
    description: 'Complete all assigned chores every day for a week',
    type: 'individual',
    goalType: 'perfect_days',
    suggestedTarget: 7,
    suggestedDuration: 7,
    suggestedRewards: [
      { type: 'points', title: 'Perfection Bonus', description: '100 bonus points', value: 100, distributionType: 'all' },
    ],
    category: 'daily',
    difficulty: 'hard',
    icon: '⭐',
  },
  {
    id: 'kitchen-cleanup',
    title: 'Kitchen Cleanup Week',
    description: 'Focus on kitchen chores this week',
    type: 'collaborative',
    goalType: 'category_chores',
    suggestedTarget: 30,
    suggestedDuration: 7,
    suggestedRewards: [
      { type: 'custom', title: 'Pizza Night', description: 'Family pizza night reward!', distributionType: 'all' },
    ],
    category: 'kitchen',
    difficulty: 'easy',
    icon: '🍳',
  },
];

// Helper functions
export function getChallengeProgress(challenge: FamilyChallenge): number {
  return Math.min(100, Math.round((challenge.goal.current / challenge.goal.target) * 100));
}

export function getChallengeTimeRemaining(endDate: string): { days: number; hours: number; minutes: number } | null {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
}

export function getChallengeStatusColor(status: ChallengeStatus): string {
  const colors: Record<ChallengeStatus, string> = {
    draft: '#9ca3af',
    active: '#22c55e',
    paused: '#eab308',
    completed: '#3b82f6',
    expired: '#6b7280',
    cancelled: '#ef4444',
  };
  return colors[status];
}
