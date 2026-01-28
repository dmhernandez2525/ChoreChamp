// Notification types

export type NotificationType =
  | 'chore_reminder'
  | 'streak_saver'
  | 'approval_request'
  | 'completion_approved'
  | 'completion_rejected'
  | 'badge_earned'
  | 'streak_milestone'
  | 'weekly_summary'
  | 'family_update';

export type NotificationPlatform = 'ios' | 'android' | 'web' | 'email';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'clicked';

export interface NotificationPreferences {
  id: string;
  userId: string;

  // Push toggles
  pushEnabled: boolean;
  choreReminders: boolean;
  streakReminders: boolean;
  approvalRequests: boolean;
  familyUpdates: boolean;
  celebrations: boolean;
  weeklySummary: boolean;

  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM
  quietHoursEnd: string;

  // Limits
  maxDailyNotifications: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: NotificationPlatform;
  deviceName: string | null;
  isActive: boolean;
  lastUsedAt: Date;
  createdAt: Date;
}

export interface NotificationLog {
  id: string;
  userId: string;
  notificationType: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  platform: NotificationPlatform | null;
  status: NotificationStatus;
  sentAt: Date | null;
  clickedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}

// API Request/Response types
export interface UpdatePreferencesRequest {
  pushEnabled?: boolean;
  choreReminders?: boolean;
  streakReminders?: boolean;
  approvalRequests?: boolean;
  familyUpdates?: boolean;
  celebrations?: boolean;
  weeklySummary?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  maxDailyNotifications?: number;
}

export interface RegisterDeviceRequest {
  token: string;
  platform: NotificationPlatform;
  deviceName?: string;
}

// Internal notification payload
export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}
