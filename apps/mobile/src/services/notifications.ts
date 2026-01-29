import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { storage } from '../lib/storage';

// Configure notification handler behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  choreReminders: boolean;
  choreReminderTime: number; // minutes before due time
  dailySummary: boolean;
  dailySummaryTime: string; // HH:MM format
  streakReminders: boolean;
  rewardUpdates: boolean;
  familyActivity: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  choreReminders: true,
  choreReminderTime: 30, // 30 minutes before
  dailySummary: true,
  dailySummaryTime: '08:00',
  streakReminders: true,
  rewardUpdates: true,
  familyActivity: true,
};


/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Notifications are not supported on simulator/emulator');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission denied');
    return false;
  }

  // Set up Android notification channel
  if (Platform.OS === 'android') {
    await setupAndroidNotificationChannels();
  }

  return true;
}

/**
 * Set up Android notification channels for different notification types
 */
async function setupAndroidNotificationChannels(): Promise<void> {
  await Notifications.setNotificationChannelAsync('chore-reminders', {
    name: 'Chore Reminders',
    description: 'Reminders for upcoming chores',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#6366f1',
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync('daily-summary', {
    name: 'Daily Summary',
    description: 'Daily summary of tasks',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync('streak-reminders', {
    name: 'Streak Reminders',
    description: 'Reminders to maintain your streak',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 500],
    lightColor: '#f59e0b',
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync('rewards', {
    name: 'Reward Updates',
    description: 'Updates about new rewards and redemptions',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#10b981',
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync('family-activity', {
    name: 'Family Activity',
    description: 'Activity from family members',
    importance: Notifications.AndroidImportance.LOW,
    sound: 'default',
  });
}

/**
 * Get the push notification token for remote notifications
 */
export async function getPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    await storage.setPushToken(token);
    return token;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

/**
 * Get saved push token
 */
export async function getSavedPushToken(): Promise<string | null> {
  return storage.getPushToken();
}

/**
 * Save notification settings
 */
export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  await storage.setNotificationSettings(JSON.stringify(settings));
}

/**
 * Get notification settings
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  const saved = await storage.getNotificationSettings();
  if (saved) {
    try {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput,
  options?: {
    channelId?: string;
    data?: Record<string, unknown>;
    categoryIdentifier?: string;
  }
): Promise<string> {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: options?.data || {},
      categoryIdentifier: options?.categoryIdentifier,
      ...(Platform.OS === 'android' && options?.channelId
        ? { channelId: options.channelId }
        : {}),
    },
    trigger,
  });

  return identifier;
}

/**
 * Schedule a chore reminder notification
 */
export async function scheduleChoreReminder(
  choreId: string,
  choreTitle: string,
  dueDate: Date,
  minutesBefore: number = 30
): Promise<string | null> {
  const settings = await getNotificationSettings();

  if (!settings.enabled || !settings.choreReminders) {
    return null;
  }

  const triggerDate = new Date(dueDate.getTime() - minutesBefore * 60 * 1000);

  // Don't schedule if the trigger time has passed
  if (triggerDate <= new Date()) {
    return null;
  }

  return scheduleLocalNotification(
    'Chore Reminder',
    `"${choreTitle}" is due in ${minutesBefore} minutes`,
    { type: SchedulableTriggerInputTypes.DATE, date: triggerDate },
    {
      channelId: 'chore-reminders',
      data: { type: 'chore-reminder', choreId },
      categoryIdentifier: 'chore-reminder',
    }
  );
}

/**
 * Schedule daily summary notification
 */
export async function scheduleDailySummary(
  todoCount: number,
  pointsEarned: number
): Promise<string | null> {
  const settings = await getNotificationSettings();

  if (!settings.enabled || !settings.dailySummary) {
    return null;
  }

  // Parse the time
  const [hours, minutes] = settings.dailySummaryTime.split(':').map(Number);

  // Schedule for the next occurrence of the specified time
  const now = new Date();
  const triggerDate = new Date();
  triggerDate.setHours(hours, minutes, 0, 0);

  if (triggerDate <= now) {
    triggerDate.setDate(triggerDate.getDate() + 1);
  }

  const body = todoCount === 0
    ? `Great job! You completed all your chores and earned ${pointsEarned} points!`
    : `You have ${todoCount} chore${todoCount !== 1 ? 's' : ''} remaining today.`;

  return scheduleLocalNotification(
    'Daily Summary',
    body,
    { type: SchedulableTriggerInputTypes.DATE, date: triggerDate },
    {
      channelId: 'daily-summary',
      data: { type: 'daily-summary' },
    }
  );
}

/**
 * Schedule streak reminder notification
 */
export async function scheduleStreakReminder(
  currentStreak: number
): Promise<string | null> {
  const settings = await getNotificationSettings();

  if (!settings.enabled || !settings.streakReminders || currentStreak === 0) {
    return null;
  }

  // Schedule for 8 PM if no chores completed today
  const now = new Date();
  const triggerDate = new Date();
  triggerDate.setHours(20, 0, 0, 0);

  if (triggerDate <= now) {
    triggerDate.setDate(triggerDate.getDate() + 1);
  }

  return scheduleLocalNotification(
    'Keep Your Streak Going! 🔥',
    `You're on a ${currentStreak}-day streak! Complete a chore to keep it alive.`,
    { type: SchedulableTriggerInputTypes.DATE, date: triggerDate },
    {
      channelId: 'streak-reminders',
      data: { type: 'streak-reminder' },
    }
  );
}

/**
 * Show immediate notification for reward redemption
 */
export async function notifyRewardRedemption(
  rewardTitle: string,
  pointsCost: number
): Promise<string | null> {
  const settings = await getNotificationSettings();

  if (!settings.enabled || !settings.rewardUpdates) {
    return null;
  }

  return scheduleLocalNotification(
    'Reward Redeemed! 🎁',
    `You redeemed "${rewardTitle}" for ${pointsCost} points.`,
    null, // Immediate notification
    {
      channelId: 'rewards',
      data: { type: 'reward-redemption' },
    }
  );
}

/**
 * Show notification for chore completion by family member
 */
export async function notifyFamilyActivity(
  memberName: string,
  choreTitle: string,
  pointsEarned: number
): Promise<string | null> {
  const settings = await getNotificationSettings();

  if (!settings.enabled || !settings.familyActivity) {
    return null;
  }

  return scheduleLocalNotification(
    'Family Activity',
    `${memberName} completed "${choreTitle}" and earned ${pointsEarned} points!`,
    null, // Immediate notification
    {
      channelId: 'family-activity',
      data: { type: 'family-activity' },
    }
  );
}

/**
 * Cancel a specific notification
 */
export async function cancelNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Set up notification response handler
 */
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * Set up notification received handler (when app is in foreground)
 */
export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * Get the badge count
 */
export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

/**
 * Set the badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all notifications from notification center
 */
export async function dismissAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}
