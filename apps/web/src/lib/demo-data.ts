/**
 * Comprehensive demo data for ChoreChamp portfolio showcase (US35).
 *
 * All data is realistic but obviously fake. Emails use @demo.example.
 * Dates are relative to the current date so the demo always looks fresh.
 */

import type {
  Chore,
  ChoreCategory,
  ChorePriority,
  Tag,
  SavedFilterView,
  BoardPreferences,
  Member,
} from '@chorechamp/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shift a Date by `days` (negative = past, positive = future). */
function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

const TODAY = new Date();
const TODAY_STR = TODAY.toISOString().split('T')[0];

// ---------------------------------------------------------------------------
// Demo Household Members (Parent, Teen, Child)
// ---------------------------------------------------------------------------

export const DEMO_MEMBERS: Member[] = [
  {
    id: 'demo-parent',
    householdId: 'demo-household',
    userId: 'demo-user-parent',
    name: 'Sarah (Mom)',
    role: 'parent',
    color: '#6366f1', // indigo
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
    caregiverPermissions: null,
    linkedMemberId: null,
    crossHouseholdSettings: null,
    isActive: true,
    createdAt: new Date('2024-06-01'),
    updatedAt: TODAY,
  },
  {
    id: 'demo-teen',
    householdId: 'demo-household',
    userId: null,
    name: 'Olivia',
    role: 'teen',
    color: '#ec4899', // pink
    avatarUrl: null,
    birthYear: 2010,
    pointsCurrent: 520,
    pointsLifetime: 3200,
    streakCurrent: 8,
    streakLongest: 28,
    streakLastCompletedDate: TODAY_STR,
    streakFreezesAvailable: 3,
    streakFreezesUsed: 0,
    badges: [
      'first-chore',
      'week-streak',
      'two-week-streak',
      'month-streak',
      'chore-master',
      'kitchen-helper',
    ],
    canRedeemRewards: true,
    requiresApproval: false,
    caregiverPermissions: null,
    linkedMemberId: null,
    crossHouseholdSettings: null,
    isActive: true,
    createdAt: new Date('2024-06-01'),
    updatedAt: TODAY,
  },
  {
    id: 'demo-child',
    householdId: 'demo-household',
    userId: null,
    name: 'Lucas',
    role: 'child',
    color: '#f59e0b', // amber
    avatarUrl: null,
    birthYear: 2017,
    pointsCurrent: 210,
    pointsLifetime: 1180,
    streakCurrent: 5,
    streakLongest: 14,
    streakLastCompletedDate: TODAY_STR,
    streakFreezesAvailable: 1,
    streakFreezesUsed: 2,
    badges: ['first-chore', 'week-streak', 'pet-lover'],
    canRedeemRewards: true,
    requiresApproval: true,
    caregiverPermissions: null,
    linkedMemberId: null,
    crossHouseholdSettings: null,
    isActive: true,
    createdAt: new Date('2024-06-01'),
    updatedAt: TODAY,
  },
];

// ---------------------------------------------------------------------------
// Demo Tags
// ---------------------------------------------------------------------------

export const DEMO_TAGS: Tag[] = [
  { id: 'tag-morning', householdId: 'demo-household', name: 'Morning Routine', color: '#f59e0b', createdAt: new Date('2024-06-05') },
  { id: 'tag-evening', householdId: 'demo-household', name: 'Evening Routine', color: '#6366f1', createdAt: new Date('2024-06-05') },
  { id: 'tag-weekend', householdId: 'demo-household', name: 'Weekend Only', color: '#22c55e', createdAt: new Date('2024-06-10') },
  { id: 'tag-quick', householdId: 'demo-household', name: 'Quick Task', color: '#0ea5e9', createdAt: new Date('2024-06-10') },
  { id: 'tag-teamwork', householdId: 'demo-household', name: 'Teamwork', color: '#ec4899', createdAt: new Date('2024-07-01') },
];

// Map of chore id to tag ids (for convenience when building the board)
export const DEMO_CHORE_TAGS: Record<string, string[]> = {
  'chore-make-bed': ['tag-morning', 'tag-quick'],
  'chore-brush-teeth': ['tag-morning', 'tag-evening'],
  'chore-feed-dog': ['tag-morning', 'tag-quick'],
  'chore-set-table': ['tag-evening'],
  'chore-dishes': ['tag-evening'],
  'chore-clean-room': ['tag-weekend'],
  'chore-mow-lawn': ['tag-weekend', 'tag-teamwork'],
  'chore-rake-leaves': ['tag-weekend'],
  'chore-laundry': ['tag-weekend'],
  'chore-homework': ['tag-evening'],
  'chore-wipe-counters': ['tag-quick'],
  'chore-walk-dog': ['tag-morning'],
  'chore-clean-bathroom': ['tag-weekend'],
  'chore-vacuum': ['tag-weekend', 'tag-teamwork'],
  'chore-water-plants': ['tag-morning', 'tag-quick'],
  'chore-trash': ['tag-evening'],
  'chore-read-book': ['tag-evening'],
  'chore-pack-lunch': ['tag-morning', 'tag-quick'],
};

// ---------------------------------------------------------------------------
// Demo Chores (18 total, across 6+ categories)
// ---------------------------------------------------------------------------

type ChoreStatus = 'not_started' | 'in_progress' | 'completed';

/**
 * Each entry extends the Chore type with an extra `_demoStatus` field
 * so the DemoContext can assign initial column positions. The underscore
 * prefix signals that this is not a persisted field.
 */
export interface DemoChore extends Chore {
  _demoStatus: ChoreStatus;
  _demoTags: string[];
}

function chore(
  partial: {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: ChoreCategory;
    pointValue: number;
    difficulty: 'easy' | 'medium' | 'hard';
    priority: ChorePriority;
    assignedTo: string[];
    estimatedMinutes: number;
    dueDate: Date;
    dueTime?: string;
    status: ChoreStatus;
    tags?: string[];
    steps?: string[];
    requiresApproval?: boolean;
    requiresPhoto?: boolean;
    showTimer?: boolean;
    recurrenceType?: Chore['recurrenceType'];
    recurrenceDays?: number[];
  },
  boardOrder: number,
): DemoChore {
  return {
    id: partial.id,
    householdId: 'demo-household',
    title: partial.title,
    description: partial.description,
    icon: partial.icon,
    category: partial.category,
    pointValue: partial.pointValue,
    difficulty: partial.difficulty,
    priority: partial.priority,
    boardOrder,
    assignedTo: partial.assignedTo,
    assignmentType: partial.assignedTo.length === 1 ? 'specific' : 'rotation',
    rotationIndex: 0,
    recurrenceType: partial.recurrenceType ?? 'daily',
    recurrenceDays: partial.recurrenceDays ?? [0, 1, 2, 3, 4, 5, 6],
    recurrenceInterval: null,
    recurrenceAfterDays: null,
    startDate: '2024-06-01',
    endDate: null,
    dueTime: partial.dueTime ?? null,
    timeWindowMinutes: null,
    requiresApproval: partial.requiresApproval ?? false,
    requiresPhoto: partial.requiresPhoto ?? false,
    estimatedMinutes: partial.estimatedMinutes,
    showTimer: partial.showTimer ?? false,
    steps: partial.steps ?? null,
    createdBy: 'demo-parent',
    isActive: true,
    templateId: null,
    createdAt: new Date('2024-06-01'),
    updatedAt: TODAY,
    _demoStatus: partial.status,
    _demoTags: partial.tags ?? [],
  };
}

export const DEMO_CHORES: DemoChore[] = [
  // ---- Kitchen (4) --------------------------------------------------------
  chore({
    id: 'chore-set-table',
    title: 'Set Dinner Table',
    description: 'Set the dinner table with plates, utensils, and napkins for the family.',
    icon: '🍽️',
    category: 'kitchen',
    pointValue: 15,
    difficulty: 'easy',
    priority: 'medium',
    assignedTo: ['demo-child', 'demo-teen'],
    estimatedMinutes: 5,
    dueDate: addDays(TODAY, 0),
    dueTime: '18:00',
    status: 'not_started',
    tags: ['tag-evening'],
  }, 0),

  chore({
    id: 'chore-dishes',
    title: 'Load Dishwasher',
    description: 'Clear dirty dishes and load them into the dishwasher after dinner.',
    icon: '🍳',
    category: 'kitchen',
    pointValue: 25,
    difficulty: 'medium',
    priority: 'high',
    assignedTo: ['demo-teen'],
    estimatedMinutes: 15,
    dueDate: addDays(TODAY, 0),
    dueTime: '19:30',
    status: 'in_progress',
    tags: ['tag-evening'],
    steps: ['Rinse dishes', 'Load dishes properly', 'Add detergent', 'Start the cycle'],
  }, 1),

  chore({
    id: 'chore-wipe-counters',
    title: 'Wipe Kitchen Counters',
    description: 'Spray and wipe down all kitchen countertops after meals.',
    icon: '🧽',
    category: 'kitchen',
    pointValue: 10,
    difficulty: 'easy',
    priority: 'low',
    assignedTo: ['demo-child'],
    estimatedMinutes: 5,
    dueDate: addDays(TODAY, -1),
    status: 'completed',
    tags: ['tag-quick'],
  }, 2),

  chore({
    id: 'chore-pack-lunch',
    title: 'Pack School Lunch',
    description: 'Prepare and pack lunch for school the next day.',
    icon: '🥪',
    category: 'kitchen',
    pointValue: 15,
    difficulty: 'easy',
    priority: 'medium',
    assignedTo: ['demo-teen', 'demo-child'],
    estimatedMinutes: 10,
    dueDate: addDays(TODAY, 1),
    dueTime: '20:00',
    status: 'not_started',
    tags: ['tag-morning', 'tag-quick'],
  }, 3),

  // ---- Bathroom (2) -------------------------------------------------------
  chore({
    id: 'chore-brush-teeth',
    title: 'Brush Teeth',
    description: 'Brush teeth for a full 2 minutes, morning and night.',
    icon: '🦷',
    category: 'bathroom',
    pointValue: 5,
    difficulty: 'easy',
    priority: 'high',
    assignedTo: ['demo-child'],
    estimatedMinutes: 2,
    dueDate: addDays(TODAY, 0),
    dueTime: '07:00',
    status: 'completed',
    tags: ['tag-morning', 'tag-evening'],
    showTimer: true,
  }, 4),

  chore({
    id: 'chore-clean-bathroom',
    title: 'Clean Bathroom Sink',
    description: 'Scrub the bathroom sink and wipe the mirror.',
    icon: '🪥',
    category: 'bathroom',
    pointValue: 20,
    difficulty: 'medium',
    priority: 'medium',
    assignedTo: ['demo-teen'],
    estimatedMinutes: 10,
    dueDate: addDays(TODAY, 2),
    status: 'not_started',
    tags: ['tag-weekend'],
    recurrenceType: 'weekly',
    recurrenceDays: [6],
  }, 5),

  // ---- Bedroom (2) --------------------------------------------------------
  chore({
    id: 'chore-make-bed',
    title: 'Make Bed',
    description: 'Straighten sheets, fluff pillows, and make the bed neatly.',
    icon: '🛏️',
    category: 'bedroom',
    pointValue: 10,
    difficulty: 'easy',
    priority: 'medium',
    assignedTo: ['demo-child', 'demo-teen'],
    estimatedMinutes: 5,
    dueDate: addDays(TODAY, 0),
    dueTime: '08:00',
    status: 'completed',
    tags: ['tag-morning', 'tag-quick'],
  }, 6),

  chore({
    id: 'chore-clean-room',
    title: 'Clean Room',
    description: 'Tidy up your room, put toys away, and vacuum the floor.',
    icon: '🧹',
    category: 'bedroom',
    pointValue: 30,
    difficulty: 'medium',
    priority: 'high',
    assignedTo: ['demo-child'],
    estimatedMinutes: 25,
    dueDate: addDays(TODAY, 3),
    status: 'not_started',
    requiresApproval: true,
    requiresPhoto: true,
    tags: ['tag-weekend'],
    steps: ['Pick up all toys and put them away', 'Make your bed', 'Dust shelves', 'Vacuum the floor'],
    recurrenceType: 'weekly',
    recurrenceDays: [6],
    showTimer: true,
  }, 7),

  // ---- Yard / Outdoor (3) -------------------------------------------------
  chore({
    id: 'chore-trash',
    title: 'Take Out Trash',
    description: 'Empty all trash cans and take bags to the curb.',
    icon: '🗑️',
    category: 'outdoor',
    pointValue: 20,
    difficulty: 'easy',
    priority: 'urgent',
    assignedTo: ['demo-teen'],
    estimatedMinutes: 10,
    dueDate: addDays(TODAY, 0),
    dueTime: '18:00',
    status: 'not_started',
    tags: ['tag-evening'],
    recurrenceType: 'weekly',
    recurrenceDays: [3],
  }, 8),

  chore({
    id: 'chore-mow-lawn',
    title: 'Mow the Lawn',
    description: 'Mow the front and back yard. Dad will help with the trimming.',
    icon: '🌿',
    category: 'outdoor',
    pointValue: 50,
    difficulty: 'hard',
    priority: 'low',
    assignedTo: ['demo-teen'],
    estimatedMinutes: 45,
    dueDate: addDays(TODAY, 5),
    status: 'not_started',
    tags: ['tag-weekend', 'tag-teamwork'],
    recurrenceType: 'weekly',
    recurrenceDays: [6],
  }, 9),

  chore({
    id: 'chore-rake-leaves',
    title: 'Rake Leaves',
    description: 'Rake leaves in the backyard and bag them for compost.',
    icon: '🍂',
    category: 'outdoor',
    pointValue: 35,
    difficulty: 'medium',
    priority: 'low',
    assignedTo: ['demo-child', 'demo-teen'],
    estimatedMinutes: 30,
    dueDate: addDays(TODAY, 4),
    status: 'not_started',
    tags: ['tag-weekend'],
    recurrenceType: 'weekly',
    recurrenceDays: [0],
  }, 10),

  // ---- Pets (2) -----------------------------------------------------------
  chore({
    id: 'chore-feed-dog',
    title: 'Feed Max (Dog)',
    description: 'Give Max fresh food and water in the morning.',
    icon: '🐕',
    category: 'pet_care',
    pointValue: 20,
    difficulty: 'easy',
    priority: 'urgent',
    assignedTo: ['demo-child'],
    estimatedMinutes: 5,
    dueDate: addDays(TODAY, 0),
    dueTime: '07:30',
    status: 'completed',
    tags: ['tag-morning', 'tag-quick'],
  }, 11),

  chore({
    id: 'chore-walk-dog',
    title: 'Walk Max',
    description: 'Take Max for a 20 minute walk around the block.',
    icon: '🦮',
    category: 'pet_care',
    pointValue: 25,
    difficulty: 'medium',
    priority: 'high',
    assignedTo: ['demo-teen'],
    estimatedMinutes: 20,
    dueDate: addDays(TODAY, 0),
    dueTime: '16:00',
    status: 'in_progress',
    tags: ['tag-morning'],
  }, 12),

  // ---- Homework / General (3) ---------------------------------------------
  chore({
    id: 'chore-homework',
    title: 'Complete Homework',
    description: 'Finish all homework assignments before screen time.',
    icon: '📚',
    category: 'general',
    pointValue: 35,
    difficulty: 'hard',
    priority: 'urgent',
    assignedTo: ['demo-child', 'demo-teen'],
    estimatedMinutes: 45,
    dueDate: addDays(TODAY, 0),
    dueTime: '17:00',
    status: 'in_progress',
    requiresApproval: true,
    tags: ['tag-evening'],
    showTimer: true,
    recurrenceType: 'weekly',
    recurrenceDays: [1, 2, 3, 4, 5],
  }, 13),

  chore({
    id: 'chore-read-book',
    title: 'Read for 20 Minutes',
    description: 'Read a book quietly for at least 20 minutes.',
    icon: '📖',
    category: 'general',
    pointValue: 15,
    difficulty: 'easy',
    priority: 'low',
    assignedTo: ['demo-child'],
    estimatedMinutes: 20,
    dueDate: addDays(TODAY, 0),
    dueTime: '19:00',
    status: 'not_started',
    tags: ['tag-evening'],
    showTimer: true,
  }, 14),

  chore({
    id: 'chore-water-plants',
    title: 'Water Indoor Plants',
    description: 'Water all the indoor plants in the living room and kitchen.',
    icon: '🪴',
    category: 'living_room',
    pointValue: 10,
    difficulty: 'easy',
    priority: 'medium',
    assignedTo: ['demo-child'],
    estimatedMinutes: 5,
    dueDate: addDays(TODAY, 1),
    status: 'not_started',
    tags: ['tag-morning', 'tag-quick'],
    recurrenceType: 'weekly',
    recurrenceDays: [1, 4],
  }, 15),

  // ---- Laundry (2) --------------------------------------------------------
  chore({
    id: 'chore-laundry',
    title: 'Sort and Start Laundry',
    description: 'Sort darks and lights, then start a load in the washer.',
    icon: '👕',
    category: 'laundry',
    pointValue: 20,
    difficulty: 'medium',
    priority: 'medium',
    assignedTo: ['demo-teen'],
    estimatedMinutes: 15,
    dueDate: addDays(TODAY, -2),
    status: 'completed',
    tags: ['tag-weekend'],
    recurrenceType: 'weekly',
    recurrenceDays: [6, 0],
  }, 16),

  chore({
    id: 'chore-vacuum',
    title: 'Vacuum Living Room',
    description: 'Vacuum the living room carpet and under the couch cushions.',
    icon: '🧹',
    category: 'living_room',
    pointValue: 25,
    difficulty: 'medium',
    priority: 'medium',
    assignedTo: ['demo-teen', 'demo-child'],
    estimatedMinutes: 15,
    dueDate: addDays(TODAY, 2),
    status: 'not_started',
    tags: ['tag-weekend', 'tag-teamwork'],
    recurrenceType: 'weekly',
    recurrenceDays: [6],
  }, 17),
];

// ---------------------------------------------------------------------------
// Demo Saved Filters
// ---------------------------------------------------------------------------

export const DEMO_SAVED_FILTERS: SavedFilterView[] = [
  {
    id: 'filter-my-today',
    householdId: 'demo-household',
    memberId: 'demo-parent',
    name: 'Due Today',
    filters: [
      { field: 'dueDate', operator: 'is_today', value: true },
    ],
    sort: { field: 'priority', direction: 'desc' },
    groupBy: null,
    visibility: 'household',
    createdAt: new Date('2024-07-01'),
    updatedAt: new Date('2024-07-01'),
  },
  {
    id: 'filter-urgent',
    householdId: 'demo-household',
    memberId: 'demo-parent',
    name: 'Urgent Tasks',
    filters: [
      { field: 'priority', operator: 'equals', value: 'urgent' },
    ],
    sort: { field: 'dueDate', direction: 'asc' },
    groupBy: null,
    visibility: 'household',
    createdAt: new Date('2024-07-05'),
    updatedAt: new Date('2024-07-05'),
  },
  {
    id: 'filter-lucas-chores',
    householdId: 'demo-household',
    memberId: 'demo-parent',
    name: "Lucas's Chores",
    filters: [
      { field: 'assignedTo', operator: 'contains', value: 'demo-child' },
    ],
    sort: { field: 'dueDate', direction: 'asc' },
    groupBy: 'category',
    visibility: 'household',
    createdAt: new Date('2024-07-10'),
    updatedAt: new Date('2024-07-10'),
  },
];

// ---------------------------------------------------------------------------
// Demo Board Preferences
// ---------------------------------------------------------------------------

export const DEMO_BOARD_PREFERENCES: BoardPreferences = {
  id: 'prefs-parent',
  householdId: 'demo-household',
  memberId: 'demo-parent',
  viewMode: 'kanban',
  columnSettings: {
    not_started: { color: '#94a3b8', wipLimit: 10, hidden: false, order: 0 },
    in_progress: { color: '#6366f1', wipLimit: 5, hidden: false, order: 1 },
    completed: { color: '#22c55e', wipLimit: 0, hidden: false, order: 2 },
  },
  defaultGroupBy: null,
  defaultSort: { field: 'priority', direction: 'desc' },
  createdAt: new Date('2024-06-01'),
  updatedAt: TODAY,
};

// ---------------------------------------------------------------------------
// Demo Gamification Stats
// ---------------------------------------------------------------------------

export interface DemoGamificationProfile {
  memberId: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  totalCompleted: number;
  badges: string[];
}

export const DEMO_GAMIFICATION: DemoGamificationProfile[] = [
  {
    memberId: 'demo-teen',
    level: 12,
    xp: 3200,
    xpToNextLevel: 3500,
    streak: 8,
    totalCompleted: 142,
    badges: ['first-chore', 'week-streak', 'two-week-streak', 'month-streak', 'chore-master', 'kitchen-helper'],
  },
  {
    memberId: 'demo-child',
    level: 7,
    xp: 1180,
    xpToNextLevel: 1500,
    streak: 5,
    totalCompleted: 78,
    badges: ['first-chore', 'week-streak', 'pet-lover'],
  },
];

// ---------------------------------------------------------------------------
// Demo Household
// ---------------------------------------------------------------------------

export const DEMO_HOUSEHOLD = {
  id: 'demo-household',
  name: 'The Johnson Family',
  createdBy: 'demo-parent',
  timezone: 'America/New_York',
  weekStartsOn: 0 as const,
  pointsName: 'Stars',
  currency: 'USD',
  subscriptionTier: 'premium' as const,
  subscriptionStatus: 'active' as const,
  subscriptionExpiresAt: null,
  subscriptionProvider: 'stripe' as const,
  subscriptionStore: 'web' as const,
  subscriptionBillingInterval: 'monthly' as const,
  subscriptionCurrentPeriodStart: addDays(TODAY, -15),
  subscriptionCurrentPeriodEnd: addDays(TODAY, 15),
  subscriptionTrialEndsAt: null,
  subscriptionGracePeriodEndsAt: null,
  subscriptionCancelAtPeriodEnd: false,
  subscriptionCanceledAt: null,
  subscriptionIsGrandfathered: true,
  subscriptionMemberLimit: null,
  themeId: 'classic',
  whiteLabelEnabled: false,
  brandingName: null,
  brandingLogoUrl: null,
  totalChoresCompleted: 247,
  currentFamilyStreak: 8,
  longestFamilyStreak: 21,
  createdAt: new Date('2024-06-01'),
  updatedAt: TODAY,
};

// ---------------------------------------------------------------------------
// Demo User Accounts (for auth context)
// ---------------------------------------------------------------------------

export const DEMO_USERS = [
  { id: 'demo-user-parent', email: 'sarah@demo.example', name: 'Sarah Johnson' },
  { id: 'demo-user-teen', email: 'olivia@demo.example', name: 'Olivia Johnson' },
  { id: 'demo-user-child', email: 'lucas@demo.example', name: 'Lucas Johnson' },
];
