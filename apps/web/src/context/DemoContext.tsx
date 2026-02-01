import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type {
  Member,
  Chore,
  TodayChore,
  Reward,
  ChoreCompletion,
  GamificationStats,
  LeaderboardEntry,
  ActivityItem,
  Badge,
} from '@chorechamp/types';

// Demo household data
const DEMO_HOUSEHOLD = {
  id: 'demo-household',
  name: 'The Johnson Family',
  createdBy: 'demo-parent',
  timezone: 'America/New_York',
  weekStartsOn: 0,
  pointsName: 'Stars',
  currency: 'USD',
  subscriptionTier: 'premium' as const,
  subscriptionExpiresAt: null,
  subscriptionProvider: null,
  totalChoresCompleted: 247,
  currentFamilyStreak: 8,
  longestFamilyStreak: 21,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date(),
};

// Demo family members
const DEMO_MEMBERS: Member[] = [
  {
    id: 'demo-parent',
    householdId: 'demo-household',
    userId: 'demo-user',
    name: 'Sarah (Mom)',
    role: 'parent',
    color: '#6366f1',
    avatarUrl: null,
    birthYear: 1985,
    pointsCurrent: 0,
    pointsLifetime: 0,
    streakCurrent: 0,
    streakLongest: 0,
    streakLastCompletedDate: null,
    streakFreezesAvailable: 0,
    streakFreezesUsed: 0,
    badges: [],
    canRedeemRewards: false,
    requiresApproval: false,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'demo-dad',
    householdId: 'demo-household',
    userId: null,
    name: 'Mike (Dad)',
    role: 'parent',
    color: '#0ea5e9',
    avatarUrl: null,
    birthYear: 1983,
    pointsCurrent: 0,
    pointsLifetime: 0,
    streakCurrent: 0,
    streakLongest: 0,
    streakLastCompletedDate: null,
    streakFreezesAvailable: 0,
    streakFreezesUsed: 0,
    badges: [],
    canRedeemRewards: false,
    requiresApproval: false,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'demo-child-emma',
    householdId: 'demo-household',
    userId: null,
    name: 'Emma',
    role: 'child',
    color: '#22c55e',
    avatarUrl: null,
    birthYear: 2015,
    pointsCurrent: 385,
    pointsLifetime: 2450,
    streakCurrent: 12,
    streakLongest: 21,
    streakLastCompletedDate: new Date().toISOString().split('T')[0],
    streakFreezesAvailable: 2,
    streakFreezesUsed: 1,
    badges: ['first-chore', 'week-streak', 'two-week-streak', 'early-bird', 'helper'],
    canRedeemRewards: true,
    requiresApproval: true,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'demo-child-lucas',
    householdId: 'demo-household',
    userId: null,
    name: 'Lucas',
    role: 'child',
    color: '#f59e0b',
    avatarUrl: null,
    birthYear: 2017,
    pointsCurrent: 210,
    pointsLifetime: 1180,
    streakCurrent: 5,
    streakLongest: 14,
    streakLastCompletedDate: new Date().toISOString().split('T')[0],
    streakFreezesAvailable: 1,
    streakFreezesUsed: 2,
    badges: ['first-chore', 'week-streak', 'pet-lover'],
    canRedeemRewards: true,
    requiresApproval: true,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'demo-teen-olivia',
    householdId: 'demo-household',
    userId: null,
    name: 'Olivia',
    role: 'teen',
    color: '#ec4899',
    avatarUrl: null,
    birthYear: 2010,
    pointsCurrent: 520,
    pointsLifetime: 3200,
    streakCurrent: 8,
    streakLongest: 28,
    streakLastCompletedDate: new Date().toISOString().split('T')[0],
    streakFreezesAvailable: 3,
    streakFreezesUsed: 0,
    badges: ['first-chore', 'week-streak', 'two-week-streak', 'month-streak', 'chore-master', 'kitchen-helper'],
    canRedeemRewards: true,
    requiresApproval: false,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
];

// Demo chores
const DEMO_CHORES: Chore[] = [
  {
    id: 'chore-make-bed',
    householdId: 'demo-household',
    title: 'Make Bed',
    description: 'Make your bed neatly every morning',
    icon: '🛏️',
    category: 'bedroom',
    pointValue: 10,
    difficulty: 'easy',
    assignedTo: ['demo-child-emma', 'demo-child-lucas', 'demo-teen-olivia'],
    assignmentType: 'anyone',
    rotationIndex: 0,
    recurrenceType: 'daily',
    recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
    recurrenceInterval: null,
    recurrenceAfterDays: null,
    startDate: '2024-01-15',
    endDate: null,
    dueTime: '08:00',
    timeWindowMinutes: null,
    requiresApproval: false,
    requiresPhoto: false,
    estimatedMinutes: 5,
    showTimer: false,
    steps: null,
    createdBy: 'demo-parent',
    isActive: true,
    templateId: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'chore-clean-room',
    householdId: 'demo-household',
    title: 'Clean Room',
    description: 'Tidy up your room, put toys away, and vacuum',
    icon: '🧹',
    category: 'bedroom',
    pointValue: 30,
    difficulty: 'medium',
    assignedTo: ['demo-child-emma', 'demo-child-lucas'],
    assignmentType: 'anyone',
    rotationIndex: 0,
    recurrenceType: 'weekly',
    recurrenceDays: [6],
    recurrenceInterval: null,
    recurrenceAfterDays: null,
    startDate: '2024-01-15',
    endDate: null,
    dueTime: '12:00',
    timeWindowMinutes: null,
    requiresApproval: true,
    requiresPhoto: true,
    estimatedMinutes: 25,
    showTimer: true,
    steps: ['Pick up all toys and put them away', 'Make your bed', 'Dust your dresser and shelves', 'Vacuum the floor'],
    createdBy: 'demo-parent',
    isActive: true,
    templateId: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'chore-set-table',
    householdId: 'demo-household',
    title: 'Set Dinner Table',
    description: 'Set the dinner table with plates, utensils, and napkins',
    icon: '🍽️',
    category: 'kitchen',
    pointValue: 15,
    difficulty: 'easy',
    assignedTo: ['demo-child-emma', 'demo-child-lucas', 'demo-teen-olivia'],
    assignmentType: 'rotation',
    rotationIndex: 0,
    recurrenceType: 'daily',
    recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
    recurrenceInterval: null,
    recurrenceAfterDays: null,
    startDate: '2024-01-15',
    endDate: null,
    dueTime: '18:00',
    timeWindowMinutes: 30,
    requiresApproval: false,
    requiresPhoto: false,
    estimatedMinutes: 5,
    showTimer: false,
    steps: null,
    createdBy: 'demo-parent',
    isActive: true,
    templateId: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'chore-feed-dog',
    householdId: 'demo-household',
    title: 'Feed Max (Dog)',
    description: 'Give Max fresh food and water in the morning',
    icon: '🐕',
    category: 'pet_care',
    pointValue: 20,
    difficulty: 'easy',
    assignedTo: ['demo-child-lucas'],
    assignmentType: 'specific',
    rotationIndex: 0,
    recurrenceType: 'daily',
    recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
    recurrenceInterval: null,
    recurrenceAfterDays: null,
    startDate: '2024-01-15',
    endDate: null,
    dueTime: '07:30',
    timeWindowMinutes: null,
    requiresApproval: false,
    requiresPhoto: false,
    estimatedMinutes: 5,
    showTimer: false,
    steps: null,
    createdBy: 'demo-parent',
    isActive: true,
    templateId: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'chore-dishes',
    householdId: 'demo-household',
    title: 'Load Dishwasher',
    description: 'Clear dirty dishes and load them into the dishwasher',
    icon: '🍳',
    category: 'kitchen',
    pointValue: 25,
    difficulty: 'medium',
    assignedTo: ['demo-teen-olivia'],
    assignmentType: 'specific',
    rotationIndex: 0,
    recurrenceType: 'daily',
    recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
    recurrenceInterval: null,
    recurrenceAfterDays: null,
    startDate: '2024-01-15',
    endDate: null,
    dueTime: '19:30',
    timeWindowMinutes: null,
    requiresApproval: false,
    requiresPhoto: false,
    estimatedMinutes: 15,
    showTimer: false,
    steps: ['Rinse dishes', 'Load dishes properly', 'Add detergent', 'Start the cycle'],
    createdBy: 'demo-parent',
    isActive: true,
    templateId: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'chore-homework',
    householdId: 'demo-household',
    title: 'Complete Homework',
    description: 'Finish all homework assignments before screen time',
    icon: '📚',
    category: 'general',
    pointValue: 35,
    difficulty: 'hard',
    assignedTo: ['demo-child-emma', 'demo-child-lucas', 'demo-teen-olivia'],
    assignmentType: 'anyone',
    rotationIndex: 0,
    recurrenceType: 'weekly',
    recurrenceDays: [1, 2, 3, 4, 5],
    recurrenceInterval: null,
    recurrenceAfterDays: null,
    startDate: '2024-01-15',
    endDate: null,
    dueTime: '17:00',
    timeWindowMinutes: 60,
    requiresApproval: true,
    requiresPhoto: false,
    estimatedMinutes: 45,
    showTimer: true,
    steps: null,
    createdBy: 'demo-parent',
    isActive: true,
    templateId: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'chore-trash',
    householdId: 'demo-household',
    title: 'Take Out Trash',
    description: 'Empty all trash cans and take bags to the curb',
    icon: '🗑️',
    category: 'outdoor',
    pointValue: 20,
    difficulty: 'easy',
    assignedTo: ['demo-teen-olivia'],
    assignmentType: 'specific',
    rotationIndex: 0,
    recurrenceType: 'weekly',
    recurrenceDays: [3],
    recurrenceInterval: null,
    recurrenceAfterDays: null,
    startDate: '2024-01-15',
    endDate: null,
    dueTime: '18:00',
    timeWindowMinutes: null,
    requiresApproval: false,
    requiresPhoto: false,
    estimatedMinutes: 10,
    showTimer: false,
    steps: null,
    createdBy: 'demo-parent',
    isActive: true,
    templateId: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'chore-brush-teeth',
    householdId: 'demo-household',
    title: 'Brush Teeth',
    description: 'Brush teeth for 2 minutes morning and night',
    icon: '🦷',
    category: 'bathroom',
    pointValue: 5,
    difficulty: 'easy',
    assignedTo: ['demo-child-emma', 'demo-child-lucas'],
    assignmentType: 'anyone',
    rotationIndex: 0,
    recurrenceType: 'daily',
    recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
    recurrenceInterval: null,
    recurrenceAfterDays: null,
    startDate: '2024-01-15',
    endDate: null,
    dueTime: '07:00',
    timeWindowMinutes: null,
    requiresApproval: false,
    requiresPhoto: false,
    estimatedMinutes: 2,
    showTimer: true,
    steps: null,
    createdBy: 'demo-parent',
    isActive: true,
    templateId: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
];

// Demo rewards
const DEMO_REWARDS: Reward[] = [
  {
    id: 'reward-screen-time',
    householdId: 'demo-household',
    title: 'Extra Screen Time',
    description: '30 minutes of extra tablet or TV time',
    icon: '📺',
    type: 'screen_time',
    pointCost: 50,
    createdBy: 'demo-parent',
    quantity: null,
    quantityRemaining: null,
    isActive: true,
    availableFrom: null,
    availableUntil: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'reward-ice-cream',
    householdId: 'demo-household',
    title: 'Ice Cream Trip',
    description: 'A trip to the ice cream shop!',
    icon: '🍦',
    type: 'activity',
    pointCost: 150,
    createdBy: 'demo-parent',
    quantity: null,
    quantityRemaining: null,
    isActive: true,
    availableFrom: null,
    availableUntil: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'reward-stay-up-late',
    householdId: 'demo-household',
    title: 'Stay Up Late',
    description: 'Stay up 30 minutes past bedtime on a weekend',
    icon: '🌙',
    type: 'privilege',
    pointCost: 75,
    createdBy: 'demo-parent',
    quantity: 4,
    quantityRemaining: 4,
    isActive: true,
    availableFrom: null,
    availableUntil: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'reward-movie-night',
    householdId: 'demo-household',
    title: 'Pick Movie Night Film',
    description: 'You get to choose the movie for family movie night!',
    icon: '🎬',
    type: 'privilege',
    pointCost: 100,
    createdBy: 'demo-parent',
    quantity: null,
    quantityRemaining: null,
    isActive: true,
    availableFrom: null,
    availableUntil: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'reward-allowance',
    householdId: 'demo-household',
    title: '$5 Allowance Bonus',
    description: 'Extra $5 added to your allowance',
    icon: '💵',
    type: 'money',
    pointCost: 200,
    createdBy: 'demo-parent',
    quantity: null,
    quantityRemaining: null,
    isActive: true,
    availableFrom: null,
    availableUntil: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'reward-friend-sleepover',
    householdId: 'demo-household',
    title: 'Friend Sleepover',
    description: 'Have a friend sleep over on a weekend',
    icon: '🏠',
    type: 'activity',
    pointCost: 300,
    createdBy: 'demo-parent',
    quantity: 2,
    quantityRemaining: 2,
    isActive: true,
    availableFrom: null,
    availableUntil: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
];

// Demo badges
const DEMO_BADGES: Badge[] = [
  {
    id: 'first-chore',
    name: 'First Steps',
    description: 'Complete your first chore',
    icon: '🌟',
    category: 'special',
    rarity: 'common',
    criteria: { type: 'chores_completed', threshold: 1 },
  },
  {
    id: 'week-streak',
    name: 'Flame Keeper',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    category: 'streak',
    rarity: 'rare',
    criteria: { type: 'streak', threshold: 7 },
  },
  {
    id: 'two-week-streak',
    name: 'Streak Master',
    description: 'Maintain a 14-day streak',
    icon: '⚡',
    category: 'streak',
    rarity: 'epic',
    criteria: { type: 'streak', threshold: 14 },
  },
  {
    id: 'month-streak',
    name: 'Unstoppable',
    description: 'Maintain a 30-day streak',
    icon: '👑',
    category: 'streak',
    rarity: 'legendary',
    criteria: { type: 'streak', threshold: 30 },
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Complete 10 chores before 9 AM',
    icon: '🐦',
    category: 'time',
    rarity: 'rare',
    criteria: { type: 'early_completions', threshold: 10 },
  },
  {
    id: 'helper',
    name: 'Team Player',
    description: 'Help complete 5 chores assigned to others',
    icon: '🤝',
    category: 'family',
    rarity: 'rare',
    criteria: { type: 'helped_others', threshold: 5 },
  },
  {
    id: 'pet-lover',
    name: 'Pet Whisperer',
    description: 'Complete 30 pet care chores',
    icon: '🐾',
    category: 'volume',
    rarity: 'rare',
    criteria: { type: 'category_chores', threshold: 30, conditions: { category: 'pet_care' } },
  },
  {
    id: 'chore-master',
    name: 'Chore Champion',
    description: 'Complete 100 chores',
    icon: '🏆',
    category: 'volume',
    rarity: 'epic',
    criteria: { type: 'chores_completed', threshold: 100 },
  },
  {
    id: 'kitchen-helper',
    name: 'Kitchen Pro',
    description: 'Complete 50 kitchen chores',
    icon: '👨‍🍳',
    category: 'volume',
    rarity: 'rare',
    criteria: { type: 'category_chores', threshold: 50, conditions: { category: 'kitchen' } },
  },
];

// Demo leaderboard
const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    memberId: 'demo-teen-olivia',
    memberName: 'Olivia',
    memberColor: '#ec4899',
    totalPoints: 520,
    completedChores: 42,
  },
  {
    rank: 2,
    memberId: 'demo-child-emma',
    memberName: 'Emma',
    memberColor: '#22c55e',
    totalPoints: 385,
    completedChores: 35,
  },
  {
    rank: 3,
    memberId: 'demo-child-lucas',
    memberName: 'Lucas',
    memberColor: '#f59e0b',
    totalPoints: 210,
    completedChores: 18,
  },
];

// Demo activity items
function generateDemoActivities(): ActivityItem[] {
  const now = new Date();
  return [
    {
      id: 'activity-1',
      type: 'chore_completed',
      memberId: 'demo-child-emma',
      memberName: 'Emma',
      memberColor: '#22c55e',
      title: 'Completed "Make Bed"',
      description: 'Earned 10 stars',
      points: 10,
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'activity-2',
      type: 'streak_milestone',
      memberId: 'demo-child-emma',
      memberName: 'Emma',
      memberColor: '#22c55e',
      title: 'Reached 12-day streak!',
      description: 'Bonus: +25 stars',
      points: 25,
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'activity-3',
      type: 'chore_completed',
      memberId: 'demo-child-lucas',
      memberName: 'Lucas',
      memberColor: '#f59e0b',
      title: 'Completed "Feed Max (Dog)"',
      description: 'Earned 20 stars',
      points: 20,
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      id: 'activity-4',
      type: 'chore_approved',
      memberId: 'demo-teen-olivia',
      memberName: 'Olivia',
      memberColor: '#ec4899',
      title: 'Homework approved by Mom',
      description: 'Earned 35 stars',
      points: 35,
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      id: 'activity-5',
      type: 'badge_earned',
      memberId: 'demo-teen-olivia',
      memberName: 'Olivia',
      memberColor: '#ec4899',
      title: 'Earned "Kitchen Pro" badge!',
      description: 'Completed 50 kitchen chores',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
    {
      id: 'activity-6',
      type: 'points_spent',
      memberId: 'demo-child-emma',
      memberName: 'Emma',
      memberColor: '#22c55e',
      title: 'Redeemed "Extra Screen Time"',
      description: 'Spent 50 stars',
      points: -50,
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  ];
}

// Context types
interface DemoContextType {
  // Demo state
  isDemo: boolean;
  household: typeof DEMO_HOUSEHOLD;
  members: Member[];
  chores: Chore[];
  rewards: Reward[];
  badges: Badge[];
  leaderboard: LeaderboardEntry[];
  activities: ActivityItem[];

  // Current user context
  currentMember: Member;
  selectedMemberId: string;
  setSelectedMemberId: (id: string) => void;

  // Chore state
  completedChoreIds: Set<string>;
  pendingApprovalIds: Set<string>;
  getTodayChores: (memberId?: string) => TodayChore[];
  completeChore: (choreId: string) => Promise<void>;
  approveChore: (completionId: string) => Promise<void>;
  rejectChore: (completionId: string) => Promise<void>;

  // Reward state
  redeemReward: (rewardId: string, memberId: string) => Promise<void>;

  // Stats
  getGamificationStats: (memberId: string) => GamificationStats;

  // Reset
  resetDemo: () => void;
}

const DemoContext = createContext<DemoContextType | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [completedChoreIds, setCompletedChoreIds] = useState<Set<string>>(new Set());
  const [pendingApprovalIds, setPendingApprovalIds] = useState<Set<string>>(new Set());
  const [selectedMemberId, setSelectedMemberId] = useState('demo-parent');
  const [members, setMembers] = useState<Member[]>(DEMO_MEMBERS);

  // Get current member
  const currentMember = members.find((m) => m.id === selectedMemberId) || members[0];

  // Generate today's chores based on day of week
  const getTodayChores = useCallback(
    (memberId?: string): TodayChore[] => {
      const today = new Date().toISOString().split('T')[0];
      const dayOfWeek = new Date().getDay();

      return DEMO_CHORES.filter((chore) => {
        // Filter by recurrence day
        if (chore.recurrenceDays && !chore.recurrenceDays.includes(dayOfWeek)) {
          return false;
        }
        // Filter by member if provided
        if (memberId && !chore.assignedTo.includes(memberId)) {
          return false;
        }
        return true;
      }).map((chore) => {
        const choreId = `${chore.id}-${today}`;
        const isCompleted = completedChoreIds.has(choreId);
        const isPending = pendingApprovalIds.has(choreId);

        let completion: ChoreCompletion | null = null;
        if (isCompleted || isPending) {
          completion = {
            id: `completion-${choreId}`,
            choreId: chore.id,
            householdId: chore.householdId,
            memberId: chore.assignedTo[0],
            scheduledDate: today,
            completedAt: new Date(),
            status: isPending ? 'pending' : 'approved',
            approvedBy: isCompleted ? 'demo-parent' : null,
            approvedAt: isCompleted ? new Date() : null,
            rejectionReason: null,
            photoUrl: null,
            pointsAwarded: chore.pointValue,
            streakDay: null,
            startedAt: null,
            durationSeconds: null,
            createdAt: new Date(),
          };
        }

        return {
          id: choreId,
          choreId: chore.id,
          householdId: chore.householdId,
          scheduledDate: today,
          assignedTo: chore.assignedTo[0],
          isCompleted: isCompleted && !isPending,
          completionId: completion?.id || null,
          createdAt: new Date(),
          chore,
          completion,
        };
      });
    },
    [completedChoreIds, pendingApprovalIds]
  );

  // Complete a chore
  const completeChore = useCallback(
    async (choreId: string) => {
      const today = new Date().toISOString().split('T')[0];
      const fullChoreId = choreId.includes(today) ? choreId : `${choreId}-${today}`;
      const chore = DEMO_CHORES.find((c) => fullChoreId.startsWith(c.id));

      if (chore?.requiresApproval) {
        setPendingApprovalIds((prev) => new Set([...prev, fullChoreId]));
      } else {
        setCompletedChoreIds((prev) => new Set([...prev, fullChoreId]));

        // Award points to the completing member
        if (chore) {
          setMembers((prev) =>
            prev.map((m) =>
              m.id === selectedMemberId
                ? {
                    ...m,
                    pointsCurrent: m.pointsCurrent + chore.pointValue,
                    pointsLifetime: m.pointsLifetime + chore.pointValue,
                  }
                : m
            )
          );
        }
      }

      // Simulate async delay
      await new Promise((resolve) => setTimeout(resolve, 300));
    },
    [selectedMemberId]
  );

  // Approve a chore
  const approveChore = useCallback(async (completionId: string) => {
    const choreId = completionId.replace('completion-', '');
    setPendingApprovalIds((prev) => {
      const next = new Set(prev);
      next.delete(choreId);
      return next;
    });
    setCompletedChoreIds((prev) => new Set([...prev, choreId]));

    // Award points
    const chore = DEMO_CHORES.find((c) => choreId.startsWith(c.id));
    if (chore) {
      setMembers((prev) =>
        prev.map((m) =>
          chore.assignedTo.includes(m.id)
            ? {
                ...m,
                pointsCurrent: m.pointsCurrent + chore.pointValue,
                pointsLifetime: m.pointsLifetime + chore.pointValue,
              }
            : m
        )
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }, []);

  // Reject a chore
  const rejectChore = useCallback(async (completionId: string) => {
    const choreId = completionId.replace('completion-', '');
    setPendingApprovalIds((prev) => {
      const next = new Set(prev);
      next.delete(choreId);
      return next;
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
  }, []);

  // Redeem a reward
  const redeemReward = useCallback(async (rewardId: string, memberId: string) => {
    const reward = DEMO_REWARDS.find((r) => r.id === rewardId);
    if (!reward) return;

    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? {
              ...m,
              pointsCurrent: Math.max(0, m.pointsCurrent - reward.pointCost),
            }
          : m
      )
    );

    await new Promise((resolve) => setTimeout(resolve, 300));
  }, []);

  // Get gamification stats for a member
  const getGamificationStats = useCallback(
    (memberId: string): GamificationStats => {
      const member = members.find((m) => m.id === memberId);
      if (!member) {
        return {
          pointsCurrent: 0,
          pointsLifetime: 0,
          streakCurrent: 0,
          streakLongest: 0,
          badgesEarned: 0,
          badgesTotal: DEMO_BADGES.length,
          choresCompletedToday: 0,
          choresCompletedWeek: 0,
          choresCompletedTotal: 0,
        };
      }

      const todayChores = getTodayChores(memberId);
      const completedToday = todayChores.filter((tc) => tc.isCompleted).length;

      return {
        pointsCurrent: member.pointsCurrent,
        pointsLifetime: member.pointsLifetime,
        streakCurrent: member.streakCurrent,
        streakLongest: member.streakLongest,
        badgesEarned: member.badges.length,
        badgesTotal: DEMO_BADGES.length,
        choresCompletedToday: completedToday,
        choresCompletedWeek: completedToday * 5,
        choresCompletedTotal: Math.floor(member.pointsLifetime / 15),
      };
    },
    [members, getTodayChores]
  );

  // Reset demo state
  const resetDemo = useCallback(() => {
    setCompletedChoreIds(new Set());
    setPendingApprovalIds(new Set());
    setMembers(DEMO_MEMBERS);
    setSelectedMemberId('demo-parent');
  }, []);

  const value: DemoContextType = {
    isDemo: true,
    household: DEMO_HOUSEHOLD,
    members,
    chores: DEMO_CHORES,
    rewards: DEMO_REWARDS,
    badges: DEMO_BADGES,
    leaderboard: DEMO_LEADERBOARD,
    activities: generateDemoActivities(),
    currentMember,
    selectedMemberId,
    setSelectedMemberId,
    completedChoreIds,
    pendingApprovalIds,
    getTodayChores,
    completeChore,
    approveChore,
    rejectChore,
    redeemReward,
    getGamificationStats,
    resetDemo,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
