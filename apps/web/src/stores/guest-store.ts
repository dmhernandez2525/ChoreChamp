import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Member, Chore, TodayChore, Reward } from '@chorechamp/types';

// Demo household for guests
const DEMO_HOUSEHOLD = {
  id: 'demo-household',
  name: 'Demo Family',
  timezone: 'America/New_York',
  weekStartsOn: 0,
  pointsName: 'stars',
  currency: 'USD',
  totalChoresCompleted: 47,
  currentFamilyStreak: 5,
  longestFamilyStreak: 12,
};

// Demo members
const DEMO_MEMBERS: Member[] = [
  {
    id: 'demo-parent',
    householdId: 'demo-household',
    userId: null,
    name: 'You (Parent)',
    role: 'parent',
    color: '#6366f1',
    avatarUrl: null,
    birthYear: null,
    pointsCurrent: 0,
    pointsLifetime: 0,
    streakCurrent: 0,
    streakLongest: 0,
    streakLastCompletedDate: null,
    streakFreezesAvailable: 1,
    streakFreezesUsed: 0,
    badges: [],
    canRedeemRewards: true,
    requiresApproval: false,
    caregiverPermissions: null,
    linkedMemberId: null,
    crossHouseholdSettings: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-child-1',
    householdId: 'demo-household',
    userId: null,
    name: 'Alex',
    role: 'child',
    color: '#22c55e',
    avatarUrl: null,
    birthYear: 2015,
    pointsCurrent: 245,
    pointsLifetime: 1250,
    streakCurrent: 7,
    streakLongest: 14,
    streakLastCompletedDate: new Date().toISOString().split('T')[0],
    streakFreezesAvailable: 2,
    streakFreezesUsed: 0,
    badges: ['first-chore', 'week-streak'],
    canRedeemRewards: true,
    requiresApproval: true,
    caregiverPermissions: null,
    linkedMemberId: null,
    crossHouseholdSettings: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-child-2',
    householdId: 'demo-household',
    userId: null,
    name: 'Sam',
    role: 'child',
    color: '#f59e0b',
    avatarUrl: null,
    birthYear: 2017,
    pointsCurrent: 180,
    pointsLifetime: 890,
    streakCurrent: 3,
    streakLongest: 10,
    streakLastCompletedDate: new Date().toISOString().split('T')[0],
    streakFreezesAvailable: 1,
    streakFreezesUsed: 1,
    badges: ['first-chore'],
    canRedeemRewards: true,
    requiresApproval: true,
    caregiverPermissions: null,
    linkedMemberId: null,
    crossHouseholdSettings: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Demo chores
const DEMO_CHORES: Chore[] = [
  {
    id: 'chore-1',
    householdId: 'demo-household',
    title: 'Make Bed',
    description: 'Make your bed neatly every morning',
    icon: '🛏️',
    category: 'bedroom',
    priority: 'medium',
    boardOrder: 0,
    pointValue: 10,
    difficulty: 'easy',
    assignedTo: ['demo-child-1', 'demo-child-2'],
    assignmentType: 'anyone',
    rotationIndex: 0,
    recurrenceType: 'daily',
    recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
    recurrenceInterval: null,
    recurrenceAfterDays: null,
    startDate: new Date().toISOString().split('T')[0],
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
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'chore-2',
    householdId: 'demo-household',
    title: 'Clean Room',
    description: 'Tidy up your room, put toys away, and vacuum',
    icon: '🧹',
    category: 'bedroom',
    priority: 'medium',
    boardOrder: 1,
    pointValue: 25,
    difficulty: 'medium',
    assignedTo: ['demo-child-1', 'demo-child-2'],
    assignmentType: 'anyone',
    rotationIndex: 0,
    recurrenceType: 'weekly',
    recurrenceDays: [6],
    recurrenceInterval: null,
    recurrenceAfterDays: null,
    startDate: new Date().toISOString().split('T')[0],
    endDate: null,
    dueTime: '12:00',
    timeWindowMinutes: null,
    requiresApproval: true,
    requiresPhoto: true,
    estimatedMinutes: 20,
    showTimer: true,
    steps: ['Pick up all toys', 'Make bed', 'Dust surfaces', 'Vacuum floor'],
    createdBy: 'demo-parent',
    isActive: true,
    templateId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'chore-3',
    householdId: 'demo-household',
    title: 'Set Table',
    description: 'Set the dinner table with plates, utensils, and napkins',
    icon: '🍽️',
    category: 'kitchen',
    priority: 'low',
    boardOrder: 2,
    pointValue: 15,
    difficulty: 'easy',
    assignedTo: ['demo-child-1'],
    assignmentType: 'rotation',
    rotationIndex: 0,
    recurrenceType: 'daily',
    recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
    recurrenceInterval: null,
    recurrenceAfterDays: null,
    startDate: new Date().toISOString().split('T')[0],
    endDate: null,
    dueTime: '18:00',
    timeWindowMinutes: null,
    requiresApproval: false,
    requiresPhoto: false,
    estimatedMinutes: 5,
    showTimer: false,
    steps: null,
    createdBy: 'demo-parent',
    isActive: true,
    templateId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'chore-4',
    householdId: 'demo-household',
    title: 'Feed Pets',
    description: 'Give the dog fresh food and water',
    icon: '🐕',
    priority: 'high',
    boardOrder: 3,
    category: 'pet_care',
    pointValue: 20,
    difficulty: 'easy',
    assignedTo: ['demo-child-2'],
    assignmentType: 'specific',
    rotationIndex: 0,
    recurrenceType: 'daily',
    recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
    recurrenceInterval: null,
    recurrenceAfterDays: null,
    startDate: new Date().toISOString().split('T')[0],
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
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Demo rewards
const DEMO_REWARDS: Reward[] = [
  {
    id: 'reward-1',
    householdId: 'demo-household',
    title: 'Extra Screen Time',
    description: '30 minutes of extra tablet or TV time',
    icon: '📺',
    type: 'privilege',
    pointCost: 50,
    createdBy: 'demo-parent',
    quantity: null,
    quantityRemaining: null,
    isActive: true,
    availableFrom: null,
    availableUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'reward-2',
    householdId: 'demo-household',
    title: 'Ice Cream Treat',
    description: 'A trip to the ice cream shop',
    icon: '🍦',
    type: 'activity',
    pointCost: 100,
    createdBy: 'demo-parent',
    quantity: null,
    quantityRemaining: null,
    isActive: true,
    availableFrom: null,
    availableUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'reward-3',
    householdId: 'demo-household',
    title: 'Stay Up Late',
    description: 'Stay up 30 minutes past bedtime',
    icon: '🌙',
    type: 'privilege',
    pointCost: 75,
    createdBy: 'demo-parent',
    quantity: 2,
    quantityRemaining: 2,
    isActive: true,
    availableFrom: null,
    availableUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

interface GuestState {
  isGuestMode: boolean;
  hasSeenDemo: boolean;
  demoHousehold: typeof DEMO_HOUSEHOLD;
  demoMembers: Member[];
  demoChores: Chore[];
  demoRewards: Reward[];
  completedChoreIds: string[];
  signUpPromptDismissed: boolean;
  signUpPromptShownAt: number | null;
}

interface GuestActions {
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  markDemoSeen: () => void;
  completeChore: (choreId: string) => void;
  dismissSignUpPrompt: () => void;
  shouldShowSignUpPrompt: () => boolean;
  reset: () => void;
}

type GuestStore = GuestState & GuestActions;

const initialState: GuestState = {
  isGuestMode: false,
  hasSeenDemo: false,
  demoHousehold: DEMO_HOUSEHOLD,
  demoMembers: DEMO_MEMBERS,
  demoChores: DEMO_CHORES,
  demoRewards: DEMO_REWARDS,
  completedChoreIds: [],
  signUpPromptDismissed: false,
  signUpPromptShownAt: null,
};

export const useGuestStore = create<GuestStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      enterGuestMode: () => {
        set({ isGuestMode: true });
      },

      exitGuestMode: () => {
        set({ isGuestMode: false });
      },

      markDemoSeen: () => {
        set({ hasSeenDemo: true });
      },

      completeChore: (choreId: string) => {
        const { completedChoreIds } = get();
        if (!completedChoreIds.includes(choreId)) {
          set({ completedChoreIds: [...completedChoreIds, choreId] });
        }
      },

      dismissSignUpPrompt: () => {
        set({ signUpPromptDismissed: true, signUpPromptShownAt: Date.now() });
      },

      shouldShowSignUpPrompt: () => {
        const { isGuestMode, signUpPromptDismissed, signUpPromptShownAt, completedChoreIds } = get();

        if (!isGuestMode) return false;
        if (signUpPromptDismissed) {
          // Show again after 5 minutes if dismissed
          const fiveMinutes = 5 * 60 * 1000;
          if (signUpPromptShownAt && Date.now() - signUpPromptShownAt < fiveMinutes) {
            return false;
          }
        }

        // Show prompt after completing 2 chores in demo
        return completedChoreIds.length >= 2;
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'chorechamp-guest',
      partialize: (state) => ({
        isGuestMode: state.isGuestMode,
        hasSeenDemo: state.hasSeenDemo,
        completedChoreIds: state.completedChoreIds,
        signUpPromptDismissed: state.signUpPromptDismissed,
        signUpPromptShownAt: state.signUpPromptShownAt,
      }),
    }
  )
);

// Helper to generate today's demo chores
export function getDemoTodayChores(): TodayChore[] {
  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay();

  return DEMO_CHORES
    .filter((chore) => {
      if (!chore.recurrenceDays) return true;
      return chore.recurrenceDays.includes(dayOfWeek);
    })
    .map((chore) => ({
      id: `schedule-${chore.id}-${today}`,
      choreId: chore.id,
      householdId: chore.householdId,
      scheduledDate: today,
      assignedTo: chore.assignedTo[0] || '',
      isCompleted: false,
      completionId: null,
      createdAt: new Date(),
      chore,
      completion: null,
    }));
}
