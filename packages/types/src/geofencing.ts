// Geofencing Types for F10.4 - Geofencing & Location Features

/**
 * Types of geofence zones
 */
export type GeofenceType =
  | 'home' // Primary home location
  | 'school' // School location
  | 'work' // Parent's workplace
  | 'relative' // Relative's house
  | 'activity' // Extracurricular activity location
  | 'friend' // Friend's house
  | 'store' // Frequently visited store
  | 'custom'; // Custom location

/**
 * Geofence trigger types
 */
export type GeofenceTrigger = 'enter' | 'exit' | 'dwell';

/**
 * Location tracking mode
 */
export type LocationTrackingMode =
  | 'off' // No tracking
  | 'geofence_only' // Only track geofence events
  | 'continuous_low' // Low accuracy continuous (battery efficient)
  | 'continuous_high'; // High accuracy continuous

/**
 * Geofence zone definition
 */
export interface Geofence {
  id: string;
  householdId: string;
  name: string;
  type: GeofenceType;
  description: string | null;

  // Location
  latitude: number;
  longitude: number;
  radiusMeters: number;
  address: string | null;

  // Settings
  isEnabled: boolean;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
  dwellTimeMinutes: number | null; // Time before dwell trigger

  // Linked entities
  linkedZoneName: string | null; // Chore zone
  linkedChoreIds: string[] | null; // Chores to suggest

  // Restrictions
  activeForMemberIds: string[] | null; // null = all members
  activeHoursStart: string | null; // HH:MM format
  activeHoursEnd: string | null;
  activeDays: number[] | null; // 0-6 (Sunday-Saturday)

  // Stats
  totalEntries: number;
  totalExits: number;
  lastTriggeredAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Geofence event (entry/exit)
 */
export interface GeofenceEvent {
  id: string;
  geofenceId: string;
  householdId: string;
  memberId: string;

  eventType: GeofenceTrigger;
  occurredAt: Date;

  // Location at event time
  latitude: number;
  longitude: number;
  accuracy: number;

  // Context
  deviceId: string | null;
  batteryLevel: number | null;

  // Actions triggered
  actionsTriggered: {
    type: string;
    result: 'success' | 'failed';
    details?: string;
  }[];

  // Notification sent
  notificationSent: boolean;
}

/**
 * Member location (current)
 */
export interface MemberLocation {
  id: string;
  memberId: string;
  householdId: string;

  // Current location
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;

  // Geofence status
  currentGeofenceId: string | null;
  currentGeofenceName: string | null;
  enteredCurrentAt: Date | null;

  // Status
  isAtHome: boolean;
  lastUpdatedAt: Date;

  // Device info
  deviceId: string | null;
  batteryLevel: number | null;
}

/**
 * Location history entry
 */
export interface LocationHistoryEntry {
  id: string;
  memberId: string;
  householdId: string;

  latitude: number;
  longitude: number;
  accuracy: number;

  // Geofence at this point
  geofenceId: string | null;
  geofenceName: string | null;

  recordedAt: Date;
}

/**
 * Geofence automation rule
 */
export interface GeofenceAutomation {
  id: string;
  householdId: string;
  name: string;
  description: string | null;
  isEnabled: boolean;

  // Trigger
  geofenceId: string;
  triggerType: GeofenceTrigger;
  triggerMemberIds: string[] | null; // null = any member

  // Conditions
  requireAllMembers: boolean; // All specified members must trigger
  requireMinDwellMinutes: number | null;
  timeConditions: {
    startTime: string | null;
    endTime: string | null;
    daysOfWeek: number[] | null;
  } | null;

  // Actions
  actions: GeofenceAutomationAction[];

  // Stats
  timesTriggered: number;
  lastTriggeredAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Action to take when geofence triggers
 */
export interface GeofenceAutomationAction {
  type: GeofenceActionType;
  config: Record<string, unknown>;
  delay?: number; // Delay in seconds
}

export type GeofenceActionType =
  | 'send_notification' // Send push notification
  | 'create_chore_reminder' // Remind about pending chores
  | 'auto_assign_chore' // Assign a chore
  | 'enable_away_mode' // Enable away mode for chores
  | 'disable_away_mode' // Disable away mode
  | 'smart_home_action' // Trigger smart home action
  | 'award_points' // Award points for being somewhere
  | 'webhook'; // Call external webhook

/**
 * Away mode configuration
 */
export interface AwayModeConfig {
  id: string;
  householdId: string;
  memberId: string;

  isActive: boolean;
  activatedAt: Date | null;
  reason: string | null;

  // Settings
  pauseChoreDeadlines: boolean;
  pauseStreakTracking: boolean;
  autoReactivateOnReturn: boolean;

  // Scheduled
  scheduledEndAt: Date | null;
  expectedReturnGeofenceId: string | null;
}

/**
 * Create geofence input
 */
export interface CreateGeofenceInput {
  name: string;
  type: GeofenceType;
  description?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  address?: string;
  notifyOnEntry?: boolean;
  notifyOnExit?: boolean;
  dwellTimeMinutes?: number;
  linkedZoneName?: string;
  linkedChoreIds?: string[];
  activeForMemberIds?: string[];
  activeHoursStart?: string;
  activeHoursEnd?: string;
  activeDays?: number[];
}

/**
 * Update geofence input
 */
export interface UpdateGeofenceInput {
  name?: string;
  description?: string | null;
  isEnabled?: boolean;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  address?: string | null;
  notifyOnEntry?: boolean;
  notifyOnExit?: boolean;
  dwellTimeMinutes?: number | null;
  linkedZoneName?: string | null;
  linkedChoreIds?: string[] | null;
  activeForMemberIds?: string[] | null;
  activeHoursStart?: string | null;
  activeHoursEnd?: string | null;
  activeDays?: number[] | null;
}

/**
 * Report location input
 */
export interface ReportLocationInput {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  deviceId?: string;
  batteryLevel?: number;
}

/**
 * Geofence event input
 */
export interface ReportGeofenceEventInput {
  geofenceId: string;
  eventType: GeofenceTrigger;
  latitude: number;
  longitude: number;
  accuracy: number;
  deviceId?: string;
  batteryLevel?: number;
}

/**
 * Location settings for a member
 */
export interface LocationSettings {
  memberId: string;
  householdId: string;

  trackingMode: LocationTrackingMode;
  shareLocationWithHousehold: boolean;
  allowLocationHistory: boolean;
  historyRetentionDays: number;

  // Privacy
  blurLocationWhenNotHome: boolean;
  hideFromSpecificMembers: string[] | null;
}

/**
 * Geofence analytics
 */
export interface GeofenceAnalytics {
  totalGeofences: number;
  activeGeofences: number;
  totalEvents: number;
  eventsByType: {
    enter: number;
    exit: number;
    dwell: number;
  };
  totalAutomationsTriggered: number;

  byGeofence: {
    id: string;
    name: string;
    type: GeofenceType;
    entries: number;
    exits: number;
    avgDwellMinutes: number;
  }[];

  byMember: {
    memberId: string;
    memberName: string;
    homeTime: number; // percentage
    events: number;
  }[];

  recentEvents: GeofenceEvent[];
}

/**
 * Predefined geofence presets
 */
export interface GeofencePreset {
  id: string;
  name: string;
  description: string;
  type: GeofenceType;
  suggestedRadius: number;
  suggestedNotifyEntry: boolean;
  suggestedNotifyExit: boolean;
}

export const GEOFENCE_PRESETS: GeofencePreset[] = [
  {
    id: 'home',
    name: 'Home',
    description: 'Primary home location',
    type: 'home',
    suggestedRadius: 100,
    suggestedNotifyEntry: false,
    suggestedNotifyExit: true,
  },
  {
    id: 'school',
    name: 'School',
    description: "Child's school location",
    type: 'school',
    suggestedRadius: 200,
    suggestedNotifyEntry: true,
    suggestedNotifyExit: true,
  },
  {
    id: 'work',
    name: 'Work',
    description: "Parent's workplace",
    type: 'work',
    suggestedRadius: 150,
    suggestedNotifyEntry: false,
    suggestedNotifyExit: true,
  },
  {
    id: 'grandparents',
    name: "Grandparents' House",
    description: "Grandparents' or relatives' home",
    type: 'relative',
    suggestedRadius: 100,
    suggestedNotifyEntry: true,
    suggestedNotifyExit: true,
  },
  {
    id: 'activity',
    name: 'Activity Location',
    description: 'Sports, music, or other activity',
    type: 'activity',
    suggestedRadius: 150,
    suggestedNotifyEntry: true,
    suggestedNotifyExit: true,
  },
];
