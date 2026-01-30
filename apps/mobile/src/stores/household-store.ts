import { create } from 'zustand';
import { eq, and } from 'drizzle-orm';
import type {
  Household,
  Member,
  Chore,
  TodayChore,
  Reward,
} from '@chorechamp/types';
import { db } from '../db/client';
import * as schema from '../db/schema';
import { apiClient } from '../lib/api-client';
import { storage } from '../lib/storage';
import { checkNetworkStatus } from '../hooks/use-network-status';

interface HouseholdState {
  // Active selections
  activeHousehold: Household | null;
  activeMember: Member | null;
  activeHouseholdId: string | null;
  activeMemberId: string | null;

  // Data
  households: Household[];
  members: Member[];
  chores: Chore[];
  todayChores: TodayChore[];
  rewards: Reward[];

  // Loading states
  isLoading: boolean;
  isLoadingChores: boolean;
  isLoadingRewards: boolean;
  error: string | null;
}

interface HouseholdActions {
  // Initialization
  initialize: () => Promise<void>;

  // Household selection
  setActiveHousehold: (householdId: string) => Promise<void>;
  setActiveMember: (memberId: string) => Promise<void>;

  // Data loading (from cache or API)
  loadHouseholds: () => Promise<void>;
  loadMembers: () => Promise<void>;
  loadChores: () => Promise<void>;
  loadTodayChores: () => Promise<void>;
  loadRewards: () => Promise<void>;

  // Optimistic updates
  optimisticCompleteChore: (choreId: string, scheduleId: string) => { rollback: () => void };
  optimisticAddPoints: (memberId: string, points: number) => { rollback: () => void };
  optimisticRedeemReward: (rewardId: string, cost: number) => { rollback: () => void };

  // Clear
  clear: () => void;
}

type HouseholdStore = HouseholdState & HouseholdActions;

// Helper to convert cached data to types
function cachedHouseholdToHousehold(cached: typeof schema.cachedHouseholds.$inferSelect): Household {
  return {
    id: cached.id,
    name: cached.name,
    timezone: cached.timezone || 'America/New_York',
    weekStartsOn: cached.weekStartsOn || 0,
    pointsName: cached.pointsName || 'points',
    currency: cached.currency || 'USD',
    totalChoresCompleted: cached.totalChoresCompleted || 0,
    currentFamilyStreak: cached.currentFamilyStreak || 0,
    longestFamilyStreak: cached.longestFamilyStreak || 0,
    subscriptionTier: 'free',
    subscriptionExpiresAt: null,
    subscriptionProvider: null,
    createdBy: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function cachedMemberToMember(cached: typeof schema.cachedMembers.$inferSelect): Member {
  return {
    id: cached.id,
    householdId: cached.householdId,
    userId: cached.userId || null,
    name: cached.name,
    role: cached.role,
    color: cached.color || '#6366f1',
    avatarUrl: cached.avatarUrl || null,
    birthYear: null,
    pointsCurrent: cached.pointsCurrent || 0,
    pointsLifetime: cached.pointsLifetime || 0,
    streakCurrent: cached.streakCurrent || 0,
    streakLongest: cached.streakLongest || 0,
    streakLastCompletedDate: cached.streakLastCompletedDate || null,
    streakFreezesAvailable: cached.streakFreezesAvailable || 1,
    streakFreezesUsed: 0,
    badges: cached.badges ? JSON.parse(cached.badges) : [],
    canRedeemRewards: true,
    requiresApproval: cached.role === 'child',
    isActive: cached.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function cachedChoreToChore(cached: typeof schema.cachedChores.$inferSelect): Chore {
  return {
    id: cached.id,
    householdId: cached.householdId,
    title: cached.title,
    description: cached.description,
    icon: cached.icon || '📋',
    category: (cached.category as Chore['category']) || 'general',
    pointValue: cached.pointValue || 10,
    difficulty: cached.difficulty || 'medium',
    assignedTo: cached.assignedTo ? JSON.parse(cached.assignedTo) : [],
    assignmentType: cached.assignmentType || 'anyone',
    rotationIndex: 0,
    recurrenceType: cached.recurrenceType || 'once',
    recurrenceDays: cached.recurrenceDays ? JSON.parse(cached.recurrenceDays) : null,
    recurrenceInterval: null,
    recurrenceAfterDays: null,
    startDate: new Date().toISOString().split('T')[0],
    endDate: null,
    dueTime: cached.dueTime,
    timeWindowMinutes: null,
    requiresApproval: cached.requiresApproval ?? false,
    requiresPhoto: cached.requiresPhoto ?? false,
    estimatedMinutes: cached.estimatedMinutes,
    showTimer: cached.showTimer ?? false,
    steps: cached.steps ? JSON.parse(cached.steps) : null,
    createdBy: '',
    isActive: cached.isActive ?? true,
    templateId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function cachedRewardToReward(cached: typeof schema.cachedRewards.$inferSelect): Reward {
  return {
    id: cached.id,
    householdId: cached.householdId,
    title: cached.title,
    description: cached.description,
    icon: cached.icon || '🎁',
    type: cached.type || 'custom',
    pointCost: cached.pointCost,
    createdBy: '',
    quantity: cached.quantity,
    quantityRemaining: cached.quantityRemaining,
    isActive: cached.isActive ?? true,
    availableFrom: null,
    availableUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export const useHouseholdStore = create<HouseholdStore>((set, get) => ({
  activeHousehold: null,
  activeMember: null,
  activeHouseholdId: null,
  activeMemberId: null,
  households: [],
  members: [],
  chores: [],
  todayChores: [],
  rewards: [],
  isLoading: false,
  isLoadingChores: false,
  isLoadingRewards: false,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // Load saved selections
      const savedHouseholdId = await storage.getActiveHousehold();
      const savedMemberId = await storage.getActiveMember();

      // Load households first
      await get().loadHouseholds();

      const { households } = get();

      // Set active household
      if (savedHouseholdId && households.find(h => h.id === savedHouseholdId)) {
        await get().setActiveHousehold(savedHouseholdId);

        // Set active member if saved
        const { members } = get();
        if (savedMemberId && members.find(m => m.id === savedMemberId)) {
          await get().setActiveMember(savedMemberId);
        } else if (members.length > 0) {
          // Default to first member
          await get().setActiveMember(members[0].id);
        }
      } else if (households.length > 0) {
        // Default to first household
        await get().setActiveHousehold(households[0].id);
        const { members } = get();
        if (members.length > 0) {
          await get().setActiveMember(members[0].id);
        }
      }

      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize',
      });
    }
  },

  setActiveHousehold: async (householdId: string) => {
    const household = get().households.find(h => h.id === householdId);
    if (!household) return;

    await storage.setActiveHousehold(householdId);
    set({
      activeHousehold: household,
      activeHouseholdId: householdId,
      activeMember: null,
      activeMemberId: null,
      members: [],
      chores: [],
      todayChores: [],
      rewards: [],
    });

    // Load household data
    await get().loadMembers();
    await get().loadChores();
    await get().loadRewards();
  },

  setActiveMember: async (memberId: string) => {
    const member = get().members.find(m => m.id === memberId);
    if (!member) return;

    await storage.setActiveMember(memberId);
    set({
      activeMember: member,
      activeMemberId: memberId,
    });

    // Reload today's chores for this member
    await get().loadTodayChores();
  },

  loadHouseholds: async () => {
    try {
      const { isConnected } = await checkNetworkStatus();

      if (isConnected) {
        // Try to fetch from API
        try {
          const apiHouseholds = await apiClient.getHouseholds();
          set({ households: apiHouseholds });
          return;
        } catch {
          // Fall back to cache
        }
      }

      // Load from cache
      const cached = await db.select().from(schema.cachedHouseholds);
      const households = cached.map(cachedHouseholdToHousehold);
      set({ households });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load households' });
    }
  },

  loadMembers: async () => {
    const { activeHouseholdId } = get();
    if (!activeHouseholdId) return;

    try {
      const { isConnected } = await checkNetworkStatus();

      if (isConnected) {
        try {
          const apiMembers = await apiClient.getMembers(activeHouseholdId);
          set({ members: apiMembers });
          return;
        } catch {
          // Fall back to cache
        }
      }

      // Load from cache
      const cached = await db
        .select()
        .from(schema.cachedMembers)
        .where(eq(schema.cachedMembers.householdId, activeHouseholdId));
      const members = cached.map(cachedMemberToMember);
      set({ members });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load members' });
    }
  },

  loadChores: async () => {
    const { activeHouseholdId } = get();
    if (!activeHouseholdId) return;

    try {
      set({ isLoadingChores: true });
      const { isConnected } = await checkNetworkStatus();

      if (isConnected) {
        try {
          const apiChores = await apiClient.getChores(activeHouseholdId);
          set({ chores: apiChores, isLoadingChores: false });
          return;
        } catch {
          // Fall back to cache
        }
      }

      // Load from cache
      const cached = await db
        .select()
        .from(schema.cachedChores)
        .where(
          and(
            eq(schema.cachedChores.householdId, activeHouseholdId),
            eq(schema.cachedChores.isActive, true)
          )
        );
      const chores = cached.map(cachedChoreToChore);
      set({ chores, isLoadingChores: false });
    } catch (error) {
      set({
        isLoadingChores: false,
        error: error instanceof Error ? error.message : 'Failed to load chores',
      });
    }
  },

  loadTodayChores: async () => {
    const { activeHouseholdId, activeMemberId } = get();
    if (!activeHouseholdId) return;

    try {
      set({ isLoading: true });
      const { isConnected } = await checkNetworkStatus();

      if (isConnected) {
        try {
          const apiTodayChores = await apiClient.getTodaysChores(
            activeHouseholdId,
            activeMemberId || undefined
          );
          set({ todayChores: apiTodayChores, isLoading: false });
          return;
        } catch {
          // Fall back to cache
        }
      }

      // Load from cache - join schedules with chores
      const today = new Date().toISOString().split('T')[0];
      const cached = await db
        .select()
        .from(schema.cachedSchedules)
        .where(
          and(
            eq(schema.cachedSchedules.householdId, activeHouseholdId),
            eq(schema.cachedSchedules.scheduledDate, today)
          )
        );

      // Load corresponding chores
      const cachedChores = await db
        .select()
        .from(schema.cachedChores)
        .where(eq(schema.cachedChores.householdId, activeHouseholdId));

      const choreMap = new Map(cachedChores.map(c => [c.id, c]));

      const todayChores: TodayChore[] = cached.map(schedule => {
        const chore = choreMap.get(schedule.choreId);
        return {
          id: schedule.id,
          choreId: schedule.choreId,
          householdId: schedule.householdId,
          scheduledDate: schedule.scheduledDate,
          assignedTo: schedule.assignedTo || '',
          isCompleted: schedule.isCompleted ?? false,
          completionId: schedule.completionId,
          createdAt: new Date(),
          chore: chore ? cachedChoreToChore(chore) : null as unknown as Chore,
          completion: null,
        };
      });

      set({ todayChores, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load today\'s chores',
      });
    }
  },

  loadRewards: async () => {
    const { activeHouseholdId } = get();
    if (!activeHouseholdId) return;

    try {
      set({ isLoadingRewards: true });
      const { isConnected } = await checkNetworkStatus();

      if (isConnected) {
        try {
          const apiRewards = await apiClient.getRewards(activeHouseholdId);
          set({ rewards: apiRewards, isLoadingRewards: false });
          return;
        } catch {
          // Fall back to cache
        }
      }

      // Load from cache
      const cached = await db
        .select()
        .from(schema.cachedRewards)
        .where(
          and(
            eq(schema.cachedRewards.householdId, activeHouseholdId),
            eq(schema.cachedRewards.isActive, true)
          )
        );
      const rewards = cached.map(cachedRewardToReward);
      set({ rewards, isLoadingRewards: false });
    } catch (error) {
      set({
        isLoadingRewards: false,
        error: error instanceof Error ? error.message : 'Failed to load rewards',
      });
    }
  },

  // Optimistically mark a chore as completed
  optimisticCompleteChore: (choreId: string, scheduleId: string) => {
    const { todayChores } = get();
    const snapshot = [...todayChores];

    // Update the chore to show as completed
    const updatedChores = todayChores.map((tc) => {
      if (tc.id === scheduleId || tc.choreId === choreId) {
        return { ...tc, isCompleted: true };
      }
      return tc;
    });

    set({ todayChores: updatedChores });

    return {
      rollback: () => {
        set({ todayChores: snapshot });
      },
    };
  },

  // Optimistically add points to a member
  optimisticAddPoints: (memberId: string, points: number) => {
    const { members, activeMember } = get();
    const memberSnapshot = [...members];
    const activeMemberSnapshot = activeMember ? { ...activeMember } : null;

    // Update members list
    const updatedMembers = members.map((m) => {
      if (m.id === memberId) {
        return {
          ...m,
          pointsCurrent: m.pointsCurrent + points,
          pointsLifetime: m.pointsLifetime + points,
        };
      }
      return m;
    });

    // Update active member if it matches
    const updatedActiveMember =
      activeMember?.id === memberId
        ? {
            ...activeMember,
            pointsCurrent: activeMember.pointsCurrent + points,
            pointsLifetime: activeMember.pointsLifetime + points,
          }
        : activeMember;

    set({ members: updatedMembers, activeMember: updatedActiveMember });

    return {
      rollback: () => {
        set({ members: memberSnapshot, activeMember: activeMemberSnapshot });
      },
    };
  },

  // Optimistically redeem a reward
  optimisticRedeemReward: (rewardId: string, cost: number) => {
    const { rewards, activeMember } = get();
    const rewardsSnapshot = [...rewards];
    const activeMemberSnapshot = activeMember ? { ...activeMember } : null;

    // Update reward quantity
    const updatedRewards = rewards.map((r) => {
      if (r.id === rewardId && r.quantityRemaining !== null) {
        return { ...r, quantityRemaining: r.quantityRemaining - 1 };
      }
      return r;
    });

    // Deduct points from active member
    const updatedActiveMember = activeMember
      ? { ...activeMember, pointsCurrent: activeMember.pointsCurrent - cost }
      : null;

    set({ rewards: updatedRewards, activeMember: updatedActiveMember });

    return {
      rollback: () => {
        set({ rewards: rewardsSnapshot, activeMember: activeMemberSnapshot });
      },
    };
  },

  clear: () => {
    set({
      activeHousehold: null,
      activeMember: null,
      activeHouseholdId: null,
      activeMemberId: null,
      households: [],
      members: [],
      chores: [],
      todayChores: [],
      rewards: [],
      isLoading: false,
      isLoadingChores: false,
      isLoadingRewards: false,
      error: null,
    });
  },
}));
