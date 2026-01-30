import { eq, and } from 'drizzle-orm';
import { db } from '../lib/db';
import {
  deviceTokens,
  notificationPreferences,
  notificationLog,
  members,
} from '@chorechamp/database';

// Expo Push Notification types
interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

type NotificationType =
  | 'chore_reminder'
  | 'streak_at_risk'
  | 'approval_request'
  | 'chore_approved'
  | 'chore_rejected'
  | 'badge_earned'
  | 'streak_milestone'
  | 'family_goal'
  | 'boss_defeated';

interface SendNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channelId?: string;
}

interface SendBulkNotificationOptions {
  userIds: string[];
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channelId?: string;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Check if notification type is enabled for user
async function isNotificationTypeEnabled(
  userId: string,
  type: NotificationType
): Promise<boolean> {
  const [prefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));

  if (!prefs || !prefs.pushEnabled) return false;

  const typeToPreference: Record<NotificationType, keyof typeof prefs> = {
    chore_reminder: 'choreReminders',
    streak_at_risk: 'streakReminders',
    approval_request: 'approvalRequests',
    chore_approved: 'approvalRequests',
    chore_rejected: 'approvalRequests',
    badge_earned: 'celebrations',
    streak_milestone: 'celebrations',
    family_goal: 'familyUpdates',
    boss_defeated: 'celebrations',
  };

  const prefKey = typeToPreference[type];
  return prefs[prefKey] !== false;
}

// Check if within quiet hours
async function isWithinQuietHours(userId: string): Promise<boolean> {
  const [prefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));

  if (!prefs || !prefs.quietHoursEnabled) return false;

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const start = prefs.quietHoursStart || '21:00';
  const end = prefs.quietHoursEnd || '08:00';

  // Handle overnight quiet hours (e.g., 21:00 - 08:00)
  if (start > end) {
    return currentTime >= start || currentTime < end;
  }

  return currentTime >= start && currentTime < end;
}

// Get active device tokens for a user
async function getDeviceTokens(userId: string): Promise<string[]> {
  const tokens = await db
    .select({ token: deviceTokens.token })
    .from(deviceTokens)
    .where(and(
      eq(deviceTokens.userId, userId),
      eq(deviceTokens.isActive, true)
    ));

  return tokens.map((t) => t.token);
}

// Send push notification via Expo
async function sendExpoPushNotification(
  messages: ExpoPushMessage[]
): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) return [];

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Failed to send push notifications:', error);
    return messages.map(() => ({
      status: 'error' as const,
      message: error instanceof Error ? error.message : 'Unknown error',
    }));
  }
}

// Log notification
async function logNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data: Record<string, unknown> | undefined,
  status: 'sent' | 'failed',
  errorMessage?: string
): Promise<void> {
  await db.insert(notificationLog).values({
    userId,
    notificationType: type,
    title,
    body,
    data,
    status,
    sentAt: status === 'sent' ? new Date() : null,
    errorMessage,
  });
}

// Main function to send notification to a user
export async function sendNotification(
  options: SendNotificationOptions
): Promise<boolean> {
  const { userId, type, title, body, data, channelId } = options;

  // Check if notification type is enabled
  if (!(await isNotificationTypeEnabled(userId, type))) {
    return false;
  }

  // Check quiet hours (skip for urgent notifications)
  const urgentTypes: NotificationType[] = ['streak_at_risk', 'approval_request'];
  if (!urgentTypes.includes(type) && (await isWithinQuietHours(userId))) {
    return false;
  }

  // Get device tokens
  const tokens = await getDeviceTokens(userId);
  if (tokens.length === 0) {
    return false;
  }

  // Build messages
  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token,
    title,
    body,
    data: { ...data, type },
    sound: 'default',
    channelId: channelId || getChannelId(type),
    priority: urgentTypes.includes(type) ? 'high' : 'default',
  }));

  // Send
  const tickets = await sendExpoPushNotification(messages);

  // Log results
  const success = tickets.some((t) => t.status === 'ok');
  await logNotification(
    userId,
    type,
    title,
    body,
    data,
    success ? 'sent' : 'failed',
    success ? undefined : tickets.find((t) => t.message)?.message
  );

  // Mark failed tokens as inactive
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
      await db
        .update(deviceTokens)
        .set({ isActive: false })
        .where(eq(deviceTokens.token, tokens[i]));
    }
  }

  return success;
}

// Send notification to multiple users
export async function sendBulkNotification(
  options: SendBulkNotificationOptions
): Promise<number> {
  const { userIds, type, title, body, data, channelId } = options;

  let sentCount = 0;

  // Process in batches of 100 (Expo limit)
  const batchSize = 100;
  const allMessages: { userId: string; message: ExpoPushMessage }[] = [];

  for (const userId of userIds) {
    // Check if notification type is enabled
    if (!(await isNotificationTypeEnabled(userId, type))) {
      continue;
    }

    // Check quiet hours
    const urgentTypes: NotificationType[] = ['streak_at_risk', 'approval_request'];
    if (!urgentTypes.includes(type) && (await isWithinQuietHours(userId))) {
      continue;
    }

    // Get device tokens
    const tokens = await getDeviceTokens(userId);
    for (const token of tokens) {
      allMessages.push({
        userId,
        message: {
          to: token,
          title,
          body,
          data: { ...data, type },
          sound: 'default',
          channelId: channelId || getChannelId(type),
        },
      });
    }
  }

  // Send in batches
  for (let i = 0; i < allMessages.length; i += batchSize) {
    const batch = allMessages.slice(i, i + batchSize);
    const messages = batch.map((b) => b.message);
    const tickets = await sendExpoPushNotification(messages);

    for (let j = 0; j < tickets.length; j++) {
      if (tickets[j].status === 'ok') {
        sentCount++;
      }
    }
  }

  return sentCount;
}

// Get Android channel ID for notification type
function getChannelId(type: NotificationType): string {
  const channelMap: Record<NotificationType, string> = {
    chore_reminder: 'chore-reminders',
    streak_at_risk: 'streak-alerts',
    approval_request: 'approvals',
    chore_approved: 'approvals',
    chore_rejected: 'approvals',
    badge_earned: 'achievements',
    streak_milestone: 'achievements',
    family_goal: 'family',
    boss_defeated: 'achievements',
  };
  return channelMap[type] || 'default';
}

// ============ Convenience functions for specific notification types ============

export async function sendChoreReminderNotification(
  userId: string,
  choreName: string,
  dueTime?: string
): Promise<boolean> {
  return sendNotification({
    userId,
    type: 'chore_reminder',
    title: 'Chore Reminder',
    body: dueTime
      ? `"${choreName}" is due at ${dueTime}`
      : `Don't forget to complete "${choreName}" today!`,
    data: { choreName },
    channelId: 'chore-reminders',
  });
}

export async function sendStreakAtRiskNotification(
  userId: string,
  currentStreak: number
): Promise<boolean> {
  return sendNotification({
    userId,
    type: 'streak_at_risk',
    title: 'Streak at Risk!',
    body: `Your ${currentStreak}-day streak is about to end! Complete a chore to save it.`,
    data: { currentStreak },
    channelId: 'streak-alerts',
  });
}

export async function sendApprovalRequestNotification(
  parentUserId: string,
  childName: string,
  choreName: string
): Promise<boolean> {
  return sendNotification({
    userId: parentUserId,
    type: 'approval_request',
    title: 'Approval Needed',
    body: `${childName} completed "${choreName}" and is waiting for your approval.`,
    data: { childName, choreName },
    channelId: 'approvals',
  });
}

export async function sendChoreApprovedNotification(
  userId: string,
  choreName: string,
  points: number
): Promise<boolean> {
  return sendNotification({
    userId,
    type: 'chore_approved',
    title: 'Chore Approved!',
    body: `"${choreName}" was approved! You earned ${points} points.`,
    data: { choreName, points },
    channelId: 'approvals',
  });
}

export async function sendChoreRejectedNotification(
  userId: string,
  choreName: string,
  reason: string
): Promise<boolean> {
  return sendNotification({
    userId,
    type: 'chore_rejected',
    title: 'Chore Needs Rework',
    body: `"${choreName}" was sent back: ${reason}`,
    data: { choreName, reason },
    channelId: 'approvals',
  });
}

export async function sendBadgeEarnedNotification(
  userId: string,
  badgeName: string,
  badgeIcon: string
): Promise<boolean> {
  return sendNotification({
    userId,
    type: 'badge_earned',
    title: 'Badge Unlocked!',
    body: `${badgeIcon} You earned the "${badgeName}" badge!`,
    data: { badgeName, badgeIcon },
    channelId: 'achievements',
  });
}

export async function sendStreakMilestoneNotification(
  userId: string,
  streakDays: number,
  bonusPoints: number
): Promise<boolean> {
  return sendNotification({
    userId,
    type: 'streak_milestone',
    title: 'Streak Milestone!',
    body: `Amazing! ${streakDays}-day streak achieved! +${bonusPoints} bonus points!`,
    data: { streakDays, bonusPoints },
    channelId: 'achievements',
  });
}

export async function sendBossDefeatedNotification(
  householdId: string,
  bossName: string,
  bonusPoints: number
): Promise<number> {
  // Get all members of the household
  const householdMembers = await db
    .select({ userId: members.userId })
    .from(members)
    .where(and(
      eq(members.householdId, householdId),
      eq(members.isActive, true)
    ));

  const userIds = householdMembers
    .map((m) => m.userId)
    .filter((id): id is string => id !== null);

  return sendBulkNotification({
    userIds,
    type: 'boss_defeated',
    title: 'Boss Defeated!',
    body: `The family defeated "${bossName}"! Everyone earns ${bonusPoints} bonus points!`,
    data: { bossName, bonusPoints },
    channelId: 'achievements',
  });
}
