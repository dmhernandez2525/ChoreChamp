// Screen Time Types for F10.5 - Screen Time & Device Rewards

/**
 * Types of devices that can have screen time tracked
 */
export type DeviceType =
  | 'smartphone'
  | 'tablet'
  | 'computer'
  | 'gaming_console'
  | 'smart_tv'
  | 'streaming_device'
  | 'handheld_gaming'
  | 'vr_headset'
  | 'other';

/**
 * Screen time tracking platforms
 */
export type ScreenTimePlatform =
  | 'apple_screen_time' // Apple Screen Time API
  | 'google_family_link' // Google Family Link
  | 'microsoft_family' // Microsoft Family Safety
  | 'amazon_parent_dashboard' // Amazon Parent Dashboard
  | 'nintendo_parental' // Nintendo Parental Controls
  | 'playstation_family' // PlayStation Family Management
  | 'xbox_family' // Xbox Family Settings
  | 'samsung_kids_mode' // Samsung Kids Mode
  | 'custom_integration' // Custom/manual tracking
  | 'manual'; // Manual entry

/**
 * Screen time reward types
 */
export type ScreenTimeRewardType =
  | 'bonus_minutes' // Add bonus screen time
  | 'extend_bedtime' // Extend bedtime limit
  | 'unlock_app' // Unlock specific app/game
  | 'unlock_device' // Unlock device access
  | 'weekend_bonus' // Extra time on weekends
  | 'streaming_access'; // Access to streaming services

/**
 * Device configuration
 */
export interface TrackedDevice {
  id: string;
  householdId: string;
  memberId: string;

  name: string;
  type: DeviceType;
  platform: ScreenTimePlatform;
  platformDeviceId: string | null; // ID from platform API

  // Status
  isActive: boolean;
  isConnected: boolean;
  lastSyncAt: Date | null;

  // Icon/image
  iconUrl: string | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Screen time limit configuration
 */
export interface ScreenTimeLimit {
  id: string;
  householdId: string;
  memberId: string;

  // Daily limits
  dailyLimitMinutes: number;
  weekendLimitMinutes: number | null; // Different limit for weekends

  // Time windows
  allowedStartTime: string | null; // HH:MM
  allowedEndTime: string | null; // HH:MM
  bedtimeStart: string | null; // HH:MM - screen time ends
  bedtimeEnd: string | null; // HH:MM - screen time resumes

  // Day-specific limits
  dayLimits: {
    day: number; // 0-6 (Sunday-Saturday)
    limitMinutes: number;
    startTime: string | null;
    endTime: string | null;
  }[] | null;

  // App/category limits
  appLimits: {
    appId: string | null;
    appName: string;
    categoryId: string | null;
    categoryName: string | null;
    limitMinutes: number;
  }[] | null;

  // Settings
  allowExtensions: boolean; // Can earn extensions
  pauseOnSchoolDays: boolean;
  requireChoreCompletion: boolean; // Must complete chores before screen time

  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Daily screen time usage record
 */
export interface ScreenTimeUsage {
  id: string;
  memberId: string;
  householdId: string;
  date: Date;

  // Usage
  totalMinutesUsed: number;
  limitMinutes: number;
  bonusMinutesEarned: number;
  bonusMinutesUsed: number;

  // By device
  deviceUsage: {
    deviceId: string;
    deviceName: string;
    minutesUsed: number;
  }[];

  // By app/category
  appUsage: {
    appId: string | null;
    appName: string;
    categoryName: string | null;
    minutesUsed: number;
  }[];

  // Status
  limitReached: boolean;
  limitExtended: boolean;

  lastUpdatedAt: Date;
}

/**
 * Screen time reward earned
 */
export interface ScreenTimeReward {
  id: string;
  memberId: string;
  householdId: string;

  rewardType: ScreenTimeRewardType;
  minutesAmount: number | null; // For time-based rewards
  description: string;

  // Source
  earnedFrom: 'chore_completion' | 'bonus_chore' | 'parent_grant' | 'achievement' | 'streak';
  sourceId: string | null; // Chore ID, achievement ID, etc.
  sourceName: string | null;

  // Status
  isUsed: boolean;
  usedAt: Date | null;
  expiresAt: Date | null;

  createdAt: Date;
}

/**
 * Screen time extension request
 */
export interface ScreenTimeExtensionRequest {
  id: string;
  memberId: string;
  householdId: string;

  requestedMinutes: number;
  reason: string | null;
  requestedAt: Date;

  // Response
  status: 'pending' | 'approved' | 'denied';
  respondedBy: string | null;
  respondedAt: Date | null;
  responseNote: string | null;

  // If approved
  grantedMinutes: number | null;
}

/**
 * Chore-to-screen-time reward mapping
 */
export interface ChoreScreenTimeReward {
  id: string;
  householdId: string;

  choreId: string | null; // null = applies to all chores
  choreName: string | null;
  choreCategory: string | null;

  // Reward configuration
  rewardType: ScreenTimeRewardType;
  minutesAmount: number;

  // Conditions
  requirePerfectCompletion: boolean;
  requirePhotoProof: boolean;
  onlyOnWeekdays: boolean;

  // Limits
  maxPerDay: number | null;
  maxPerWeek: number | null;

  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Device access schedule
 */
export interface DeviceAccessSchedule {
  id: string;
  householdId: string;
  memberId: string;
  deviceId: string | null; // null = all devices

  // Schedule
  dayOfWeek: number; // 0-6
  startTime: string; // HH:MM
  endTime: string; // HH:MM

  // Conditions
  requireDailyChores: boolean;
  requiredChoreIds: string[] | null;

  isEnabled: boolean;
}

/**
 * Screen time analytics
 */
export interface ScreenTimeAnalytics {
  memberId: string;
  period: 'day' | 'week' | 'month';

  // Totals
  totalMinutesUsed: number;
  totalLimitMinutes: number;
  totalBonusEarned: number;
  averageDailyUsage: number;

  // Trends
  usageTrend: 'increasing' | 'decreasing' | 'stable';
  comparedToPrevious: number; // Percentage change

  // By device
  byDevice: {
    deviceId: string;
    deviceName: string;
    deviceType: DeviceType;
    totalMinutes: number;
    percentageOfTotal: number;
  }[];

  // By category
  byCategory: {
    category: string;
    totalMinutes: number;
    percentageOfTotal: number;
  }[];

  // Chore correlation
  choresCompleted: number;
  bonusMinutesEarned: number;
  bonusMinutesUsed: number;

  // Compliance
  daysUnderLimit: number;
  daysOverLimit: number;
  averageOverageMinutes: number;
}

/**
 * Create device input
 */
export interface CreateDeviceInput {
  name: string;
  type: DeviceType;
  platform: ScreenTimePlatform;
  memberId: string;
  platformDeviceId?: string;
  iconUrl?: string;
}

/**
 * Update screen time limit input
 */
export interface UpdateScreenTimeLimitInput {
  dailyLimitMinutes?: number;
  weekendLimitMinutes?: number | null;
  allowedStartTime?: string | null;
  allowedEndTime?: string | null;
  bedtimeStart?: string | null;
  bedtimeEnd?: string | null;
  dayLimits?: {
    day: number;
    limitMinutes: number;
    startTime: string | null;
    endTime: string | null;
  }[] | null;
  appLimits?: {
    appId: string | null;
    appName: string;
    categoryId: string | null;
    categoryName: string | null;
    limitMinutes: number;
  }[] | null;
  allowExtensions?: boolean;
  pauseOnSchoolDays?: boolean;
  requireChoreCompletion?: boolean;
  isEnabled?: boolean;
}

/**
 * Create chore reward input
 */
export interface CreateChoreRewardInput {
  choreId?: string;
  choreName?: string;
  choreCategory?: string;
  rewardType: ScreenTimeRewardType;
  minutesAmount: number;
  requirePerfectCompletion?: boolean;
  requirePhotoProof?: boolean;
  onlyOnWeekdays?: boolean;
  maxPerDay?: number;
  maxPerWeek?: number;
}

/**
 * Device categories for UI
 */
export const DEVICE_CATEGORIES: { type: DeviceType; label: string; icon: string }[] = [
  { type: 'smartphone', label: 'Smartphone', icon: '📱' },
  { type: 'tablet', label: 'Tablet', icon: '📲' },
  { type: 'computer', label: 'Computer', icon: '💻' },
  { type: 'gaming_console', label: 'Gaming Console', icon: '🎮' },
  { type: 'smart_tv', label: 'Smart TV', icon: '📺' },
  { type: 'streaming_device', label: 'Streaming Device', icon: '🔌' },
  { type: 'handheld_gaming', label: 'Handheld Gaming', icon: '🕹️' },
  { type: 'vr_headset', label: 'VR Headset', icon: '🥽' },
  { type: 'other', label: 'Other', icon: '📟' },
];

/**
 * Platform configurations
 */
export const PLATFORM_CONFIGS: {
  platform: ScreenTimePlatform;
  name: string;
  description: string;
  supportsAutoSync: boolean;
  supportsRemoteLock: boolean;
}[] = [
  {
    platform: 'apple_screen_time',
    name: 'Apple Screen Time',
    description: 'For iPhone, iPad, and Mac devices',
    supportsAutoSync: true,
    supportsRemoteLock: true,
  },
  {
    platform: 'google_family_link',
    name: 'Google Family Link',
    description: 'For Android devices and Chromebooks',
    supportsAutoSync: true,
    supportsRemoteLock: true,
  },
  {
    platform: 'microsoft_family',
    name: 'Microsoft Family Safety',
    description: 'For Windows, Xbox, and Microsoft services',
    supportsAutoSync: true,
    supportsRemoteLock: true,
  },
  {
    platform: 'nintendo_parental',
    name: 'Nintendo Parental Controls',
    description: 'For Nintendo Switch',
    supportsAutoSync: true,
    supportsRemoteLock: false,
  },
  {
    platform: 'playstation_family',
    name: 'PlayStation Family Management',
    description: 'For PlayStation consoles',
    supportsAutoSync: true,
    supportsRemoteLock: false,
  },
  {
    platform: 'xbox_family',
    name: 'Xbox Family Settings',
    description: 'For Xbox consoles',
    supportsAutoSync: true,
    supportsRemoteLock: true,
  },
  {
    platform: 'manual',
    name: 'Manual Tracking',
    description: 'Manually enter screen time usage',
    supportsAutoSync: false,
    supportsRemoteLock: false,
  },
];
