# SDD-005: Notification System

**Status:** Draft
**Priority:** P0 (MVP)
**Author:** ChoreChamp Team
**Last Updated:** 2026-01-28

---

## 1. Overview

### 1.1 Purpose
Implement a comprehensive push notification system for chore reminders, streak alerts, approval requests, and celebrations. Notifications are critical for retention - research shows 95% churn if users opt-in but receive zero notifications in the first 90 days.

### 1.2 Scope
- Push notifications (iOS APNs, Android FCM)
- In-app notifications
- Email digests (weekly summary)
- Notification preferences and quiet hours
- Smart batching and frequency caps

### 1.3 Research Justification
- **95% churn** if opt-in users receive 0 pushes in 90 days (Airship study)
- **33% higher retention** with 1+ push in first 90 days
- **46% disable notifications** after 2-5 messages/week - need caps
- **Duolingo's optimal timing:** 23.5 hours after last session

---

## 2. Architecture

### 2.1 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    NOTIFICATION TRIGGERS                     │
├─────────────────────────────────────────────────────────────┤
│  Chore Due │ Streak Risk │ Approval │ Badge │ Weekly Digest │
└──────┬─────┴──────┬──────┴────┬─────┴───┬───┴───────┬───────┘
       │            │           │         │           │
       └────────────┴───────────┴────┬────┴───────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   NOTIFICATION SERVICE                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   BullMQ Queue                       │   │
│  │  • Rate limiting    • Scheduling    • Retries       │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│        ┌──────────────────┼──────────────────┐              │
│        ▼                  ▼                  ▼              │
│  ┌───────────┐     ┌───────────┐     ┌───────────┐        │
│  │   APNs    │     │    FCM    │     │   Email   │        │
│  │  (iOS)    │     │ (Android) │     │ (Sendgrid)│        │
│  └───────────┘     └───────────┘     └───────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### 3.1 Notification Preferences

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Push notification toggles
  push_enabled BOOLEAN DEFAULT TRUE,
  chore_reminders BOOLEAN DEFAULT TRUE,
  streak_reminders BOOLEAN DEFAULT TRUE,
  approval_requests BOOLEAN DEFAULT TRUE,
  family_updates BOOLEAN DEFAULT TRUE,
  celebrations BOOLEAN DEFAULT TRUE,
  weekly_summary BOOLEAN DEFAULT TRUE,

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT TRUE,
  quiet_hours_start TIME DEFAULT '21:00',
  quiet_hours_end TIME DEFAULT '08:00',

  -- Frequency caps
  max_daily_notifications INTEGER DEFAULT 10,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);
```

### 3.2 Device Tokens

```sql
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  token TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL, -- 'ios', 'android', 'web'
  device_name VARCHAR(100),

  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(token)
);

CREATE INDEX idx_device_tokens_user ON device_tokens(user_id, is_active);
```

### 3.3 Notification Log

```sql
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  data JSONB,

  platform VARCHAR(20), -- 'ios', 'android', 'web', 'email'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'clicked'

  sent_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_log_user ON notification_log(user_id, created_at);
CREATE INDEX idx_notification_log_type ON notification_log(notification_type, created_at);
```

---

## 4. Notification Types

### 4.1 Type Definitions

| Type | Trigger | Timing | Max/Day | Priority |
|------|---------|--------|---------|----------|
| `chore_reminder` | Scheduled chore due | 23.5 hours after last | 3 | Normal |
| `streak_saver` | Streak at risk (no completion today) | End of day (8pm local) | 1 | High |
| `approval_request` | Child completes chore | Immediate (batched if multiple) | 10 | Normal |
| `completion_approved` | Parent approves | Immediate | 5 | Normal |
| `badge_earned` | Badge unlocked | Immediate | 5 | Normal |
| `streak_milestone` | 7/30/100 day streak | Immediate | 1 | High |
| `weekly_summary` | Weekly digest | Sunday 6pm local | 1/week | Low |
| `family_update` | Family goal achieved | Immediate | 3 | Normal |

### 4.2 Notification Templates

```typescript
// apps/api/src/services/notification.templates.ts

export const NOTIFICATION_TEMPLATES = {
  chore_reminder: {
    title: (data) => `${data.choreCount} chores waiting!`,
    body: (data) => `Don't forget: ${data.choreTitle}${data.choreCount > 1 ? ` and ${data.choreCount - 1} more` : ''}`,
    data: { screen: 'chores', action: 'view_today' },
  },

  streak_saver: {
    title: (data) => `🔥 Save your ${data.streakDays}-day streak!`,
    body: () => 'Complete one chore before midnight to keep it going.',
    data: { screen: 'chores', action: 'complete_any' },
  },

  approval_request: {
    title: (data) => `${data.childName} completed a chore!`,
    body: (data) => `${data.choreTitle} is waiting for your approval.`,
    data: { screen: 'approvals', completionId: data.completionId },
  },

  completion_approved: {
    title: () => '🎉 Great job!',
    body: (data) => `You earned ${data.points} stars for "${data.choreTitle}"!`,
    data: { screen: 'dashboard' },
  },

  badge_earned: {
    title: (data) => `🏆 New badge: ${data.badgeName}!`,
    body: (data) => data.badgeDescription,
    data: { screen: 'badges', badgeId: data.badgeId },
  },

  streak_milestone: {
    title: (data) => `🔥 ${data.streakDays}-day streak!`,
    body: (data) => `Amazing! You earned ${data.bonusPoints} bonus stars!`,
    data: { screen: 'streaks' },
  },

  weekly_summary: {
    title: () => '📊 Your family\'s week in review',
    body: (data) => `${data.totalChores} chores completed, ${data.totalPoints} stars earned!`,
    data: { screen: 'analytics' },
  },

  family_update: {
    title: (data) => `🎯 Family goal achieved!`,
    body: (data) => `${data.goalName} - everyone earned ${data.bonusPoints} stars!`,
    data: { screen: 'family' },
  },
};
```

---

## 5. Implementation

### 5.1 Notification Service

```typescript
// apps/api/src/services/notification.service.ts
import { Queue, Worker } from 'bullmq';
import * as admin from 'firebase-admin';

export class NotificationService {
  private queue: Queue;

  constructor() {
    this.queue = new Queue('notifications', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    this.initializeWorker();
  }

  async send(notification: NotificationPayload): Promise<void> {
    // Check user preferences
    const prefs = await this.getPreferences(notification.userId);
    if (!this.shouldSend(notification, prefs)) {
      return;
    }

    // Check quiet hours
    if (this.isQuietHours(prefs, notification.userId)) {
      // Schedule for after quiet hours
      const delay = this.getQuietHoursDelay(prefs);
      await this.queue.add('send', notification, { delay });
      return;
    }

    // Check daily limit
    const todayCount = await this.getTodayNotificationCount(notification.userId);
    if (todayCount >= prefs.maxDailyNotifications) {
      return; // Skip, limit reached
    }

    await this.queue.add('send', notification);
  }

  async sendBatched(
    userId: string,
    type: NotificationType,
    items: any[]
  ): Promise<void> {
    // Batch multiple notifications of same type
    const template = NOTIFICATION_TEMPLATES[type];
    const batchData = this.aggregateBatchData(items);

    await this.send({
      userId,
      type,
      title: template.title(batchData),
      body: template.body(batchData),
      data: { ...template.data, items },
    });
  }

  private initializeWorker(): void {
    new Worker('notifications', async (job) => {
      const notification = job.data as NotificationPayload;

      // Get user's device tokens
      const tokens = await this.getActiveTokens(notification.userId);

      if (tokens.length === 0) {
        return; // No devices registered
      }

      // Send to each platform
      const results = await Promise.allSettled(
        tokens.map(token => this.sendToDevice(token, notification))
      );

      // Log results
      await this.logNotification(notification, results);

      // Handle invalid tokens
      await this.handleInvalidTokens(tokens, results);
    }, { connection: redisConnection });
  }

  private async sendToDevice(
    token: DeviceToken,
    notification: NotificationPayload
  ): Promise<void> {
    if (token.platform === 'ios' || token.platform === 'android') {
      await admin.messaging().send({
        token: token.token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data,
        android: {
          priority: 'high',
          notification: {
            channelId: `chorechamp_${notification.type}`,
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: await this.getBadgeCount(notification.userId),
            },
          },
        },
      });
    } else if (token.platform === 'web') {
      // Web push via FCM
      await admin.messaging().send({
        token: token.token,
        webpush: {
          notification: {
            title: notification.title,
            body: notification.body,
            icon: '/icon-192.png',
          },
        },
        data: notification.data,
      });
    }
  }

  private shouldSend(
    notification: NotificationPayload,
    prefs: NotificationPreferences
  ): boolean {
    if (!prefs.pushEnabled) return false;

    switch (notification.type) {
      case 'chore_reminder':
        return prefs.choreReminders;
      case 'streak_saver':
        return prefs.streakReminders;
      case 'approval_request':
        return prefs.approvalRequests;
      case 'completion_approved':
      case 'badge_earned':
      case 'streak_milestone':
        return prefs.celebrations;
      case 'family_update':
        return prefs.familyUpdates;
      case 'weekly_summary':
        return prefs.weeklySummary;
      default:
        return true;
    }
  }

  private isQuietHours(prefs: NotificationPreferences, userId: string): boolean {
    if (!prefs.quietHoursEnabled) return false;

    const now = new Date();
    const userTimezone = await this.getUserTimezone(userId);
    const localHour = getHourInTimezone(now, userTimezone);

    const startHour = parseInt(prefs.quietHoursStart.split(':')[0]);
    const endHour = parseInt(prefs.quietHoursEnd.split(':')[0]);

    // Handle overnight quiet hours (e.g., 21:00 - 08:00)
    if (startHour > endHour) {
      return localHour >= startHour || localHour < endHour;
    }
    return localHour >= startHour && localHour < endHour;
  }
}
```

### 5.2 Scheduled Jobs

```typescript
// apps/api/src/jobs/notifications.ts
import { CronJob } from 'cron';

// Daily chore reminders - run every hour
export const choreReminderJob = new CronJob('0 * * * *', async () => {
  const now = new Date();

  // Find users with pending chores who haven't been reminded
  const pendingReminders = await db
    .select()
    .from(choreSchedules)
    .innerJoin(members, eq(members.id, choreSchedules.assignedTo))
    .innerJoin(users, eq(users.id, members.userId))
    .where(
      and(
        eq(choreSchedules.scheduledDate, today()),
        eq(choreSchedules.isCompleted, false),
        // Check if 23.5 hours since last notification
        or(
          isNull(members.lastReminderAt),
          lt(members.lastReminderAt, subHours(now, 23.5))
        )
      )
    );

  // Group by user and send batched reminders
  const byUser = groupBy(pendingReminders, r => r.users.id);

  for (const [userId, chores] of Object.entries(byUser)) {
    await notificationService.sendBatched(
      userId,
      'chore_reminder',
      chores.map(c => ({ title: c.chore_schedules.chore.title }))
    );

    // Update last reminder time
    await db.update(members)
      .set({ lastReminderAt: now })
      .where(eq(members.userId, userId));
  }
});

// Streak saver - run at 8pm in each timezone
export const streakSaverJob = new CronJob('0 20 * * *', async () => {
  // Find users with active streaks who haven't completed today
  const atRiskUsers = await db.query.members.findMany({
    where: and(
      gt(members.streakCurrent, 0),
      or(
        isNull(members.streakLastCompletedDate),
        neq(members.streakLastCompletedDate, today())
      )
    ),
    with: { user: true },
  });

  for (const member of atRiskUsers) {
    if (!member.user) continue; // Skip child profiles without user accounts

    await notificationService.send({
      userId: member.user.id,
      type: 'streak_saver',
      title: `🔥 Save your ${member.streakCurrent}-day streak!`,
      body: 'Complete one chore before midnight to keep it going.',
      data: { streakDays: member.streakCurrent },
    });
  }
});

// Weekly summary - Sunday 6pm
export const weeklySummaryJob = new CronJob('0 18 * * 0', async () => {
  const households = await db.query.households.findMany({
    where: eq(households.subscriptionTier, 'premium'), // Premium feature
  });

  for (const household of households) {
    const stats = await calculateWeeklyStats(household.id);

    // Send to all parents
    const parents = await db.query.members.findMany({
      where: and(
        eq(members.householdId, household.id),
        eq(members.role, 'parent'),
      ),
      with: { user: true },
    });

    for (const parent of parents) {
      if (!parent.user) continue;

      await notificationService.send({
        userId: parent.user.id,
        type: 'weekly_summary',
        title: '📊 Your family\'s week in review',
        body: `${stats.totalChores} chores completed, ${stats.totalPoints} stars earned!`,
        data: stats,
      });
    }
  }
});
```

---

## 6. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/preferences` | Get user preferences |
| PATCH | `/api/notifications/preferences` | Update preferences |
| POST | `/api/notifications/devices` | Register device token |
| DELETE | `/api/notifications/devices/:token` | Unregister device |
| GET | `/api/notifications/history` | Get notification history |

---

## 7. Mobile Integration

### 7.1 Expo Notifications Setup

```typescript
// apps/mobile/src/services/notifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PROJECT_ID,
  });

  // Register token with backend
  await apiClient.registerDevice({
    token: token.data,
    platform: Platform.OS,
  });

  return token.data;
}

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Handle notification tap
export function useNotificationResponse() {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        handleNotificationNavigation(data);
      }
    );

    return () => subscription.remove();
  }, []);
}

function handleNotificationNavigation(data: any): void {
  switch (data.screen) {
    case 'chores':
      navigation.navigate('Chores');
      break;
    case 'approvals':
      navigation.navigate('Approvals', { completionId: data.completionId });
      break;
    case 'badges':
      navigation.navigate('Profile', { screen: 'Badges' });
      break;
    case 'dashboard':
    default:
      navigation.navigate('Dashboard');
  }
}
```

---

## 8. Frequency Caps & Batching

### 8.1 Smart Batching Rules

```typescript
const BATCHING_CONFIG = {
  approval_request: {
    // Batch approval requests if 3+ pending within 5 minutes
    windowMinutes: 5,
    minForBatch: 3,
    batchTitle: (count) => `${count} chores need approval`,
    batchBody: (items) => `${items[0].childName} and others completed chores`,
  },
  chore_reminder: {
    // Always batch multiple chores into single notification
    windowMinutes: 0,
    minForBatch: 1,
  },
};
```

### 8.2 Frequency Enforcement

```typescript
async function enforceFrequencyLimits(
  userId: string,
  type: NotificationType
): Promise<boolean> {
  const limits: Record<NotificationType, { max: number; window: string }> = {
    chore_reminder: { max: 3, window: 'day' },
    streak_saver: { max: 1, window: 'day' },
    approval_request: { max: 10, window: 'day' },
    completion_approved: { max: 5, window: 'day' },
    badge_earned: { max: 5, window: 'day' },
  };

  const limit = limits[type];
  if (!limit) return true;

  const count = await db
    .select({ count: sql<number>`count(*)` })
    .from(notificationLog)
    .where(
      and(
        eq(notificationLog.userId, userId),
        eq(notificationLog.notificationType, type),
        gte(notificationLog.createdAt, getWindowStart(limit.window))
      )
    );

  return count[0].count < limit.max;
}
```

---

## 9. Error Handling

### 9.1 Invalid Token Handling

```typescript
async function handleInvalidTokens(
  tokens: DeviceToken[],
  results: PromiseSettledResult<void>[]
): Promise<void> {
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'rejected') {
      const error = result.reason;

      // Check for invalid token errors
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        // Deactivate token
        await db.update(deviceTokens)
          .set({ isActive: false })
          .where(eq(deviceTokens.id, tokens[i].id));
      }
    }
  }
}
```

---

## 10. Metrics & Monitoring

### 10.1 Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Delivery rate | >98% | <95% |
| Click-through rate | >10% | <5% |
| Opt-out rate | <2%/month | >5%/month |
| Time to send | <5 seconds | >30 seconds |

### 10.2 Logging

```typescript
interface NotificationMetrics {
  type: string;
  sentCount: number;
  deliveredCount: number;
  clickedCount: number;
  failedCount: number;
  avgDeliveryTime: number;
}

// Track in analytics
analytics.track('notification_sent', {
  type: notification.type,
  userId: notification.userId,
  platform: token.platform,
});

analytics.track('notification_clicked', {
  type: notification.type,
  userId: notification.userId,
  timeToClick: Date.now() - notification.sentAt,
});
```

---

**Document Version:** 1.0.0
**Next Review:** After Phase 1 implementation
