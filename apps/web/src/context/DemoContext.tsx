import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
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
  Tag,
  SavedFilterView,
  BoardPreferences,
} from '@chorechamp/types';
import {
  DEMO_MEMBERS,
  DEMO_CHORES,
  DEMO_TAGS,
  DEMO_CHORE_TAGS,
  DEMO_SAVED_FILTERS,
  DEMO_BOARD_PREFERENCES,
  DEMO_GAMIFICATION,
  DEMO_HOUSEHOLD,
  type DemoChore,
  type DemoGamificationProfile,
} from '../lib/demo-data';
import { DEMO_MODE } from '../lib/demo-mode';

// ---------------------------------------------------------------------------
// Rewards (kept inline since they are small and tightly coupled to context)
// ---------------------------------------------------------------------------

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
    createdAt: new Date('2024-06-15'),
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
    createdAt: new Date('2024-06-15'),
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
    createdAt: new Date('2024-06-15'),
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
    createdAt: new Date('2024-06-15'),
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
    createdAt: new Date('2024-06-15'),
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
    createdAt: new Date('2024-06-15'),
    updatedAt: new Date(),
  },
];

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

const DEMO_BADGES: Badge[] = [
  { id: 'first-chore', name: 'First Steps', description: 'Complete your first chore', icon: '🌟', category: 'special', rarity: 'common', criteria: { type: 'chores_completed', threshold: 1 } },
  { id: 'week-streak', name: 'Flame Keeper', description: 'Maintain a 7-day streak', icon: '🔥', category: 'streak', rarity: 'rare', criteria: { type: 'streak', threshold: 7 } },
  { id: 'two-week-streak', name: 'Streak Master', description: 'Maintain a 14-day streak', icon: '⚡', category: 'streak', rarity: 'epic', criteria: { type: 'streak', threshold: 14 } },
  { id: 'month-streak', name: 'Unstoppable', description: 'Maintain a 30-day streak', icon: '👑', category: 'streak', rarity: 'legendary', criteria: { type: 'streak', threshold: 30 } },
  { id: 'early-bird', name: 'Early Bird', description: 'Complete 10 chores before 9 AM', icon: '🐦', category: 'time', rarity: 'rare', criteria: { type: 'early_completions', threshold: 10 } },
  { id: 'helper', name: 'Team Player', description: 'Help complete 5 chores assigned to others', icon: '🤝', category: 'family', rarity: 'rare', criteria: { type: 'helped_others', threshold: 5 } },
  { id: 'pet-lover', name: 'Pet Whisperer', description: 'Complete 30 pet care chores', icon: '🐾', category: 'volume', rarity: 'rare', criteria: { type: 'category_chores', threshold: 30, conditions: { category: 'pet_care' } } },
  { id: 'chore-master', name: 'Chore Champion', description: 'Complete 100 chores', icon: '🏆', category: 'volume', rarity: 'epic', criteria: { type: 'chores_completed', threshold: 100 } },
  { id: 'kitchen-helper', name: 'Kitchen Pro', description: 'Complete 50 kitchen chores', icon: '👨‍🍳', category: 'volume', rarity: 'rare', criteria: { type: 'category_chores', threshold: 50, conditions: { category: 'kitchen' } } },
];

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, memberId: 'demo-teen', memberName: 'Olivia', memberColor: '#ec4899', totalPoints: 520, completedChores: 42 },
  { rank: 2, memberId: 'demo-child', memberName: 'Lucas', memberColor: '#f59e0b', totalPoints: 210, completedChores: 18 },
];

// ---------------------------------------------------------------------------
// Activity feed
// ---------------------------------------------------------------------------

function generateDemoActivities(): ActivityItem[] {
  const now = new Date();
  return [
    { id: 'activity-1', type: 'chore_completed', memberId: 'demo-child', memberName: 'Lucas', memberColor: '#f59e0b', title: 'Completed "Feed Max (Dog)"', description: 'Earned 20 stars', points: 20, timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000) },
    { id: 'activity-2', type: 'chore_completed', memberId: 'demo-child', memberName: 'Lucas', memberColor: '#f59e0b', title: 'Completed "Brush Teeth"', description: 'Earned 5 stars', points: 5, timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
    { id: 'activity-3', type: 'streak_milestone', memberId: 'demo-teen', memberName: 'Olivia', memberColor: '#ec4899', title: 'Reached 8-day streak!', description: 'Bonus: +25 stars', points: 25, timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000) },
    { id: 'activity-4', type: 'chore_approved', memberId: 'demo-teen', memberName: 'Olivia', memberColor: '#ec4899', title: 'Homework approved by Mom', description: 'Earned 35 stars', points: 35, timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000) },
    { id: 'activity-5', type: 'badge_earned', memberId: 'demo-teen', memberName: 'Olivia', memberColor: '#ec4899', title: 'Earned "Kitchen Pro" badge!', description: 'Completed 50 kitchen chores', timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    { id: 'activity-6', type: 'points_spent', memberId: 'demo-child', memberName: 'Lucas', memberColor: '#f59e0b', title: 'Redeemed "Extra Screen Time"', description: 'Spent 50 stars', points: -50, timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
  ];
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface DemoContextType {
  // Core flag
  isDemoMode: boolean;

  // Data
  household: typeof DEMO_HOUSEHOLD;
  members: Member[];
  chores: DemoChore[];
  rewards: Reward[];
  badges: Badge[];
  tags: Tag[];
  choreTags: Record<string, string[]>;
  savedFilters: SavedFilterView[];
  boardPreferences: BoardPreferences;
  leaderboard: LeaderboardEntry[];
  activities: ActivityItem[];
  gamification: DemoGamificationProfile[];

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

  // Lifecycle
  exitDemo: () => void;
  resetDemo: () => void;
}

const DemoContext = createContext<DemoContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function DemoProvider({ children }: { children: ReactNode }) {
  const [completedChoreIds, setCompletedChoreIds] = useState<Set<string>>(() => {
    // Pre-populate completed chores from demo data
    const completed = new Set<string>();
    const today = new Date().toISOString().split('T')[0];
    for (const c of DEMO_CHORES) {
      if (c._demoStatus === 'completed') {
        completed.add(`${c.id}-${today}`);
      }
    }
    return completed;
  });

  const [pendingApprovalIds, setPendingApprovalIds] = useState<Set<string>>(new Set());
  const [selectedMemberId, setSelectedMemberId] = useState('demo-parent');
  const [members, setMembers] = useState<Member[]>(DEMO_MEMBERS);
  const [active, setActive] = useState(DEMO_MODE);

  const currentMember = members.find((m) => m.id === selectedMemberId) || members[0];

  // ------- Today chores ----------------------------------------------------

  const getTodayChores = useCallback(
    (memberId?: string): TodayChore[] => {
      const today = new Date().toISOString().split('T')[0];
      const dayOfWeek = new Date().getDay();

      return DEMO_CHORES.filter((chore) => {
        if (chore.recurrenceDays && !chore.recurrenceDays.includes(dayOfWeek)) {
          return false;
        }
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
          chore: chore as Chore,
          completion,
        };
      });
    },
    [completedChoreIds, pendingApprovalIds],
  );

  // ------- Mutations (operate on local state only) -------------------------

  const completeChore = useCallback(
    async (choreId: string) => {
      const today = new Date().toISOString().split('T')[0];
      const fullChoreId = choreId.includes(today) ? choreId : `${choreId}-${today}`;
      const chore = DEMO_CHORES.find((c) => fullChoreId.startsWith(c.id));

      if (chore?.requiresApproval) {
        setPendingApprovalIds((prev) => new Set([...prev, fullChoreId]));
      } else {
        setCompletedChoreIds((prev) => new Set([...prev, fullChoreId]));

        if (chore) {
          setMembers((prev) =>
            prev.map((m) =>
              m.id === selectedMemberId
                ? { ...m, pointsCurrent: m.pointsCurrent + chore.pointValue, pointsLifetime: m.pointsLifetime + chore.pointValue }
                : m,
            ),
          );
        }
      }

      // Brief simulated delay
      await new Promise((resolve) => setTimeout(resolve, 300));
    },
    [selectedMemberId],
  );

  const approveChore = useCallback(async (completionId: string) => {
    const choreId = completionId.replace('completion-', '');
    setPendingApprovalIds((prev) => {
      const next = new Set(prev);
      next.delete(choreId);
      return next;
    });
    setCompletedChoreIds((prev) => new Set([...prev, choreId]));

    const chore = DEMO_CHORES.find((c) => choreId.startsWith(c.id));
    if (chore) {
      setMembers((prev) =>
        prev.map((m) =>
          chore.assignedTo.includes(m.id)
            ? { ...m, pointsCurrent: m.pointsCurrent + chore.pointValue, pointsLifetime: m.pointsLifetime + chore.pointValue }
            : m,
        ),
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }, []);

  const rejectChore = useCallback(async (completionId: string) => {
    const choreId = completionId.replace('completion-', '');
    setPendingApprovalIds((prev) => {
      const next = new Set(prev);
      next.delete(choreId);
      return next;
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
  }, []);

  const redeemReward = useCallback(async (rewardId: string, memberId: string) => {
    const reward = DEMO_REWARDS.find((r) => r.id === rewardId);
    if (!reward) return;

    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, pointsCurrent: Math.max(0, m.pointsCurrent - reward.pointCost) }
          : m,
      ),
    );

    await new Promise((resolve) => setTimeout(resolve, 300));
  }, []);

  // ------- Stats -----------------------------------------------------------

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
    [members, getTodayChores],
  );

  // ------- Lifecycle -------------------------------------------------------

  const exitDemo = useCallback(() => {
    setActive(false);
  }, []);

  const resetDemo = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const initialCompleted = new Set<string>();
    for (const c of DEMO_CHORES) {
      if (c._demoStatus === 'completed') {
        initialCompleted.add(`${c.id}-${today}`);
      }
    }
    setCompletedChoreIds(initialCompleted);
    setPendingApprovalIds(new Set());
    setMembers(DEMO_MEMBERS);
    setSelectedMemberId('demo-parent');
    setActive(DEMO_MODE);
  }, []);

  // ------- Memoised value --------------------------------------------------

  const value = useMemo<DemoContextType>(
    () => ({
      isDemoMode: active,
      household: DEMO_HOUSEHOLD,
      members,
      chores: DEMO_CHORES,
      rewards: DEMO_REWARDS,
      badges: DEMO_BADGES,
      tags: DEMO_TAGS,
      choreTags: DEMO_CHORE_TAGS,
      savedFilters: DEMO_SAVED_FILTERS,
      boardPreferences: DEMO_BOARD_PREFERENCES,
      gamification: DEMO_GAMIFICATION,
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
      exitDemo,
      resetDemo,
    }),
    [
      active,
      members,
      currentMember,
      selectedMemberId,
      completedChoreIds,
      pendingApprovalIds,
      getTodayChores,
      completeChore,
      approveChore,
      rejectChore,
      redeemReward,
      getGamificationStats,
      exitDemo,
      resetDemo,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDemoMode() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoProvider');
  }
  return context;
}

/**
 * @deprecated Use useDemoMode() instead. Kept for backward compatibility.
 */
export const useDemo = useDemoMode;
