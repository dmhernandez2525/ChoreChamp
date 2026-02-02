/**
 * Seasonal Events - F8.4
 * Holiday and seasonal themed events with special challenges and rewards
 */

// Event types
export type SeasonalEventType =
  | 'holiday'
  | 'seasonal'
  | 'special'
  | 'community'
  | 'weekly';

export type EventStatus = 'upcoming' | 'active' | 'ended';

export type Season = 'spring' | 'summer' | 'fall' | 'winter';

// Core event structure
export interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  type: SeasonalEventType;
  theme: EventTheme;
  startDate: string;
  endDate: string;
  status: EventStatus;

  // Event content
  challenges: EventChallenge[];
  rewards: EventReward[];
  achievements: EventAchievement[];

  // Participation
  isParticipating: boolean;
  progress: EventProgress;

  // Visuals
  bannerUrl?: string;
  iconUrl?: string;

  createdAt: string;
}

export interface EventTheme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundPattern?: string;
  icon: string;
}

// Event challenges
export interface EventChallenge {
  id: string;
  eventId: string;
  title: string;
  description: string;
  type: 'individual' | 'household' | 'community';
  goal: {
    type: 'chores' | 'points' | 'streak' | 'specific-chore' | 'custom';
    target: number;
    current: number;
    unit: string;
  };
  rewards: EventReward[];
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  completedAt?: string;
}

// Event rewards
export interface EventReward {
  id: string;
  name: string;
  description: string;
  type: 'badge' | 'points' | 'avatar' | 'theme' | 'title' | 'cosmetic';
  value: number | string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  iconColor: string;
  claimed: boolean;
  claimedAt?: string;
}

// Event-specific achievements
export interface EventAchievement {
  id: string;
  eventId: string;
  name: string;
  description: string;
  icon: string;
  iconColor: string;
  requirement: string;
  progress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

// User's event progress
export interface EventProgress {
  totalChallengesCompleted: number;
  totalChallenges: number;
  pointsEarned: number;
  rewardsClaimed: number;
  totalRewards: number;
  rank?: number;
  percentile?: number;
}

// Event calendar
export interface EventCalendar {
  currentEvents: SeasonalEvent[];
  upcomingEvents: SeasonalEvent[];
  pastEvents: SeasonalEvent[];
  nextEvent?: SeasonalEvent;
}

// Event participation
export interface EventParticipation {
  eventId: string;
  memberId: string;
  memberName: string;
  joinedAt: string;
  progress: EventProgress;
  challengeProgress: { challengeId: string; current: number; target: number }[];
  rewardsClaimed: string[];
  achievementsUnlocked: string[];
}

// Household event stats
export interface HouseholdEventStats {
  householdId: string;
  eventId: string;
  totalParticipants: number;
  totalChoresCompleted: number;
  totalPointsEarned: number;
  challengesCompleted: number;
  rank?: number;
  leaderboard: EventLeaderboardEntry[];
}

export interface EventLeaderboardEntry {
  rank: number;
  memberId: string;
  memberName: string;
  avatarUrl?: string;
  points: number;
  challengesCompleted: number;
  isCurrentUser: boolean;
}

// Request/response types
export interface JoinEventRequest {
  eventId: string;
}

export interface ClaimRewardRequest {
  rewardId: string;
}

export interface UpdateChallengeProgressRequest {
  challengeId: string;
  increment: number;
}

// Pre-defined seasonal events
export const SEASONAL_EVENTS: Omit<SeasonalEvent, 'isParticipating' | 'progress' | 'status' | 'createdAt'>[] = [
  {
    id: 'spring-cleaning-2024',
    name: 'Spring Cleaning Spectacular',
    description: 'Deep clean your home and earn exclusive spring rewards!',
    type: 'seasonal',
    theme: {
      name: 'Spring Bloom',
      primaryColor: '#10B981',
      secondaryColor: '#D1FAE5',
      accentColor: '#059669',
      icon: 'flower',
    },
    startDate: '2024-03-20T00:00:00Z',
    endDate: '2024-04-20T23:59:59Z',
    challenges: [
      {
        id: 'sc-1',
        eventId: 'spring-cleaning-2024',
        title: 'Window Warrior',
        description: 'Clean all windows in your home',
        type: 'household',
        goal: { type: 'specific-chore', target: 10, current: 0, unit: 'windows' },
        rewards: [{ id: 'r-1', name: 'Window Sparkle Badge', description: 'Crystal clear achievement', type: 'badge', value: 'window-sparkle', rarity: 'rare', icon: 'sparkles', iconColor: '#60A5FA', claimed: false }],
        startDate: '2024-03-20T00:00:00Z',
        endDate: '2024-04-20T23:59:59Z',
        isCompleted: false,
      },
      {
        id: 'sc-2',
        eventId: 'spring-cleaning-2024',
        title: 'Declutter Champion',
        description: 'Complete 20 organizing/decluttering tasks',
        type: 'individual',
        goal: { type: 'chores', target: 20, current: 0, unit: 'tasks' },
        rewards: [{ id: 'r-2', name: '200 Bonus Points', description: 'Extra points for your effort', type: 'points', value: 200, rarity: 'common', icon: 'star', iconColor: '#FBBF24', claimed: false }],
        startDate: '2024-03-20T00:00:00Z',
        endDate: '2024-04-20T23:59:59Z',
        isCompleted: false,
      },
    ],
    rewards: [
      { id: 'sr-1', name: 'Spring Cleaning Master', description: 'Complete all spring challenges', type: 'title', value: 'Spring Cleaning Master', rarity: 'legendary', icon: 'crown', iconColor: '#10B981', claimed: false },
    ],
    achievements: [
      { id: 'sa-1', eventId: 'spring-cleaning-2024', name: 'Early Bird Cleaner', description: 'Complete a chore before 7 AM during the event', icon: 'sunrise', iconColor: '#F59E0B', requirement: 'Complete 1 chore before 7 AM', progress: 0, isUnlocked: false },
    ],
    bannerUrl: '/events/spring-cleaning-banner.jpg',
    iconUrl: '/events/spring-icon.png',
  },
  {
    id: 'summer-challenge-2024',
    name: 'Summer Chore Challenge',
    description: 'Beat the heat with cool chore challenges all summer long!',
    type: 'seasonal',
    theme: {
      name: 'Summer Sun',
      primaryColor: '#F59E0B',
      secondaryColor: '#FEF3C7',
      accentColor: '#D97706',
      icon: 'sun',
    },
    startDate: '2024-06-21T00:00:00Z',
    endDate: '2024-09-22T23:59:59Z',
    challenges: [
      {
        id: 'sum-1',
        eventId: 'summer-challenge-2024',
        title: 'Outdoor Explorer',
        description: 'Complete 15 outdoor chores',
        type: 'individual',
        goal: { type: 'chores', target: 15, current: 0, unit: 'outdoor chores' },
        rewards: [{ id: 'r-3', name: 'Outdoor Champion Badge', description: 'Master of the outdoors', type: 'badge', value: 'outdoor-champ', rarity: 'epic', icon: 'tree', iconColor: '#22C55E', claimed: false }],
        startDate: '2024-06-21T00:00:00Z',
        endDate: '2024-09-22T23:59:59Z',
        isCompleted: false,
      },
    ],
    rewards: [
      { id: 'sr-2', name: 'Summer Avatar Frame', description: 'Exclusive summer-themed avatar frame', type: 'avatar', value: 'summer-frame', rarity: 'epic', icon: 'user', iconColor: '#F59E0B', claimed: false },
    ],
    achievements: [
      { id: 'sa-2', eventId: 'summer-challenge-2024', name: 'Heatwave Hero', description: 'Complete 5 chores in one day', icon: 'zap', iconColor: '#EF4444', requirement: 'Complete 5 chores in 1 day', progress: 0, isUnlocked: false },
    ],
    bannerUrl: '/events/summer-challenge-banner.jpg',
    iconUrl: '/events/summer-icon.png',
  },
  {
    id: 'halloween-2024',
    name: 'Spooky Chore Hunt',
    description: 'Tackle spooky chores and earn haunted rewards!',
    type: 'holiday',
    theme: {
      name: 'Halloween Haunt',
      primaryColor: '#F97316',
      secondaryColor: '#1F2937',
      accentColor: '#7C3AED',
      icon: 'ghost',
    },
    startDate: '2024-10-15T00:00:00Z',
    endDate: '2024-11-01T23:59:59Z',
    challenges: [
      {
        id: 'hw-1',
        eventId: 'halloween-2024',
        title: 'Cobweb Clearer',
        description: 'Deep clean 5 rooms',
        type: 'household',
        goal: { type: 'chores', target: 5, current: 0, unit: 'rooms' },
        rewards: [{ id: 'r-4', name: 'Spooky Spider Badge', description: 'Cleared all the cobwebs!', type: 'badge', value: 'spooky-spider', rarity: 'rare', icon: 'bug', iconColor: '#7C3AED', claimed: false }],
        startDate: '2024-10-15T00:00:00Z',
        endDate: '2024-11-01T23:59:59Z',
        isCompleted: false,
      },
    ],
    rewards: [
      { id: 'sr-3', name: 'Haunted Theme', description: 'Spooky app theme for Halloween', type: 'theme', value: 'halloween-theme', rarity: 'legendary', icon: 'palette', iconColor: '#F97316', claimed: false },
    ],
    achievements: [
      { id: 'sa-3', eventId: 'halloween-2024', name: 'Midnight Cleaner', description: 'Complete a chore at midnight', icon: 'moon', iconColor: '#6366F1', requirement: 'Complete 1 chore at midnight', progress: 0, isUnlocked: false },
    ],
    bannerUrl: '/events/halloween-banner.jpg',
    iconUrl: '/events/halloween-icon.png',
  },
  {
    id: 'winter-wonderland-2024',
    name: 'Winter Wonderland',
    description: 'Cozy up and complete winter chores for warm rewards!',
    type: 'holiday',
    theme: {
      name: 'Winter Magic',
      primaryColor: '#3B82F6',
      secondaryColor: '#DBEAFE',
      accentColor: '#1D4ED8',
      icon: 'snowflake',
    },
    startDate: '2024-12-01T00:00:00Z',
    endDate: '2024-12-31T23:59:59Z',
    challenges: [
      {
        id: 'ww-1',
        eventId: 'winter-wonderland-2024',
        title: 'Holiday Helper',
        description: 'Help with 25 holiday preparation chores',
        type: 'household',
        goal: { type: 'chores', target: 25, current: 0, unit: 'chores' },
        rewards: [{ id: 'r-5', name: 'Holiday Hero Badge', description: 'The ultimate holiday helper', type: 'badge', value: 'holiday-hero', rarity: 'epic', icon: 'gift', iconColor: '#EF4444', claimed: false }],
        startDate: '2024-12-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        isCompleted: false,
      },
    ],
    rewards: [
      { id: 'sr-4', name: 'Snowflake Crown', description: 'Legendary winter cosmetic', type: 'cosmetic', value: 'snowflake-crown', rarity: 'legendary', icon: 'crown', iconColor: '#60A5FA', claimed: false },
    ],
    achievements: [
      { id: 'sa-4', eventId: 'winter-wonderland-2024', name: 'Consistent Helper', description: 'Complete chores for 7 consecutive days', icon: 'calendar', iconColor: '#10B981', requirement: '7-day streak during event', progress: 0, isUnlocked: false },
    ],
    bannerUrl: '/events/winter-banner.jpg',
    iconUrl: '/events/winter-icon.png',
  },
];

// Helper functions
export function getCurrentSeason(): Season {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

export function getEventStatus(event: { startDate: string; endDate: string }): EventStatus {
  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  if (now < start) return 'upcoming';
  if (now > end) return 'ended';
  return 'active';
}

export function getEventTimeRemaining(endDate: string): { days: number; hours: number; minutes: number } | null {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
}

export function getEventProgress(event: SeasonalEvent): number {
  if (event.challenges.length === 0) return 0;
  const completed = event.challenges.filter((c) => c.isCompleted).length;
  return Math.round((completed / event.challenges.length) * 100);
}

export function getSeasonTheme(season: Season): EventTheme {
  const themes: Record<Season, EventTheme> = {
    spring: {
      name: 'Spring',
      primaryColor: '#10B981',
      secondaryColor: '#D1FAE5',
      accentColor: '#059669',
      icon: 'flower',
    },
    summer: {
      name: 'Summer',
      primaryColor: '#F59E0B',
      secondaryColor: '#FEF3C7',
      accentColor: '#D97706',
      icon: 'sun',
    },
    fall: {
      name: 'Fall',
      primaryColor: '#F97316',
      secondaryColor: '#FFEDD5',
      accentColor: '#C2410C',
      icon: 'leaf',
    },
    winter: {
      name: 'Winter',
      primaryColor: '#3B82F6',
      secondaryColor: '#DBEAFE',
      accentColor: '#1D4ED8',
      icon: 'snowflake',
    },
  };
  return themes[season];
}

export function formatEventDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
