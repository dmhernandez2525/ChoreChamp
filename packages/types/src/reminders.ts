// Smart Reminder System Types

// Reminder channel types
export type ReminderChannel = 'push' | 'email' | 'sms' | 'in_app';

// Reminder timing preference
export type ReminderTiming = 'morning' | 'afternoon' | 'evening' | 'before_due' | 'custom';

// Reminder frequency
export type ReminderFrequency = 'once' | 'daily' | 'on_schedule' | 'smart';

// Reminder preferences per member
export interface ReminderPreferences {
  memberId: string;
  enabled: boolean;
  channels: ReminderChannel[];
  defaultTiming: ReminderTiming;
  customTime?: string; // HH:MM format
  beforeDueMinutes?: number; // Minutes before due time
  maxPerDay: number;
  quietHoursStart?: string; // HH:MM
  quietHoursEnd?: string; // HH:MM
  weekendDifferent: boolean;
  weekendTiming?: ReminderTiming;
  weekendCustomTime?: string;
}

// Individual reminder configuration
export interface ReminderConfig {
  id: string;
  householdId: string;
  memberId: string;
  choreId?: string; // Specific chore, or null for all chores
  enabled: boolean;
  frequency: ReminderFrequency;
  timing: ReminderTiming;
  customTime?: string;
  beforeDueMinutes?: number;
  channels: ReminderChannel[];
  message?: string;
  createdAt: string;
  updatedAt: string;
}

// Scheduled reminder instance
export interface ScheduledReminder {
  id: string;
  configId: string;
  memberId: string;
  choreId: string;
  choreTitle: string;
  scheduledFor: string;
  channel: ReminderChannel;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  sentAt?: string;
  failureReason?: string;
  skippedReason?: string;
}

// Smart reminder suggestion
export interface ReminderSuggestion {
  memberId: string;
  memberName: string;
  suggestedTiming: ReminderTiming;
  suggestedTime: string;
  reason: string;
  basedOn: 'completion_pattern' | 'activity_time' | 'success_rate' | 'default';
  confidence: number;
}

// Reminder history entry
export interface ReminderHistoryEntry {
  id: string;
  memberId: string;
  choreId: string;
  choreTitle: string;
  sentAt: string;
  channel: ReminderChannel;
  wasOpened: boolean;
  openedAt?: string;
  resultedInCompletion: boolean;
  completedAt?: string;
  responseTimeMinutes?: number;
}

// Reminder effectiveness stats
export interface ReminderEffectiveness {
  memberId: string;
  memberName: string;
  totalSent: number;
  totalOpened: number;
  openRate: number;
  completionsAfterReminder: number;
  conversionRate: number;
  averageResponseMinutes: number;
  bestChannel: ReminderChannel;
  bestTiming: ReminderTiming;
  byChannel: {
    channel: ReminderChannel;
    sent: number;
    opened: number;
    conversions: number;
  }[];
  byTiming: {
    timing: string;
    sent: number;
    opened: number;
    conversions: number;
  }[];
}

// Create reminder config request
export interface CreateReminderConfigRequest {
  memberId: string;
  choreId?: string;
  frequency: ReminderFrequency;
  timing: ReminderTiming;
  customTime?: string;
  beforeDueMinutes?: number;
  channels: ReminderChannel[];
  message?: string;
}

// Update reminder preferences request
export interface UpdateReminderPreferencesRequest {
  enabled?: boolean;
  channels?: ReminderChannel[];
  defaultTiming?: ReminderTiming;
  customTime?: string;
  beforeDueMinutes?: number;
  maxPerDay?: number;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  weekendDifferent?: boolean;
  weekendTiming?: ReminderTiming;
  weekendCustomTime?: string;
}

// Reminder queue status
export interface ReminderQueueStatus {
  householdId: string;
  pending: number;
  sentToday: number;
  failedToday: number;
  skippedToday: number;
  nextScheduled?: {
    memberId: string;
    memberName: string;
    choreTitle: string;
    scheduledFor: string;
    channel: ReminderChannel;
  };
}

// Smart timing analysis
export interface SmartTimingAnalysis {
  memberId: string;
  memberName: string;
  recommendations: {
    dayOfWeek: number;
    suggestedTime: string;
    reason: string;
    historicalSuccessRate: number;
  }[];
  optimalWindows: {
    start: string;
    end: string;
    successRate: number;
  }[];
  avoidTimes: {
    start: string;
    end: string;
    reason: string;
  }[];
}

// Notification template
export interface ReminderTemplate {
  id: string;
  name: string;
  type: 'default' | 'friendly' | 'urgent' | 'motivational' | 'custom';
  titleTemplate: string;
  bodyTemplate: string;
  variables: string[]; // e.g., ['memberName', 'choreTitle', 'pointValue']
}

// Default reminder templates
export const DEFAULT_REMINDER_TEMPLATES: ReminderTemplate[] = [
  {
    id: 'default',
    name: 'Default',
    type: 'default',
    titleTemplate: 'Chore Reminder',
    bodyTemplate: "Hey {{memberName}}, don't forget to {{choreTitle}}!",
    variables: ['memberName', 'choreTitle'],
  },
  {
    id: 'friendly',
    name: 'Friendly',
    type: 'friendly',
    titleTemplate: 'Time for {{choreTitle}}!',
    bodyTemplate: "Hi {{memberName}}! It's a great time to tackle {{choreTitle}}. You've got this!",
    variables: ['memberName', 'choreTitle'],
  },
  {
    id: 'urgent',
    name: 'Urgent',
    type: 'urgent',
    titleTemplate: '{{choreTitle}} - Due Soon!',
    bodyTemplate: "{{memberName}}, {{choreTitle}} is due soon! Complete it now to keep your streak going.",
    variables: ['memberName', 'choreTitle'],
  },
  {
    id: 'motivational',
    name: 'Motivational',
    type: 'motivational',
    titleTemplate: 'Earn {{pointValue}} Points!',
    bodyTemplate: "{{memberName}}, complete {{choreTitle}} and earn {{pointValue}} points! You're {{streakDays}} days into your streak!",
    variables: ['memberName', 'choreTitle', 'pointValue', 'streakDays'],
  },
];

// Helper to format reminder time
export function formatReminderTime(timing: ReminderTiming, customTime?: string): string {
  switch (timing) {
    case 'morning':
      return '8:00 AM';
    case 'afternoon':
      return '2:00 PM';
    case 'evening':
      return '6:00 PM';
    case 'before_due':
      return 'Before due time';
    case 'custom':
      return customTime || 'Custom';
    default:
      return timing;
  }
}

// Helper to check if current time is in quiet hours
export function isInQuietHours(
  currentTime: Date,
  quietStart?: string,
  quietEnd?: string
): boolean {
  if (!quietStart || !quietEnd) return false;

  const [startHour, startMin] = quietStart.split(':').map(Number);
  const [endHour, endMin] = quietEnd.split(':').map(Number);

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (startMinutes <= endMinutes) {
    // Normal case: quiet hours don't span midnight
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Quiet hours span midnight
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}
