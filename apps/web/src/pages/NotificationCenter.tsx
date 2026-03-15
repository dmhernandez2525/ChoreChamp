import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@chorechamp/api-client';
import { Button, cn } from '@chorechamp/ui';
import { NotificationList, NotificationPreferences } from '../components/notifications';
import type { Notification } from '../components/notifications';
import { fetchApi } from '../lib/api';

type TabType = 'all' | 'unread' | 'settings';

// Shape returned by the notification history API
interface NotificationHistoryItem {
  id: string;
  notificationType: string;
  title: string;
  body: string;
  status: string;
  createdAt: string;
  data?: Record<string, unknown>;
}

// Map an API history item to the Notification type used by the UI components
function mapToNotification(item: NotificationHistoryItem): Notification {
  return {
    id: item.id,
    type: item.notificationType as Notification['type'],
    title: item.title,
    message: item.body || '',
    read: item.status === 'clicked',
    createdAt: new Date(item.createdAt),
    metadata: item.data ?? undefined,
  };
}

export default function NotificationCenter() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const queryClient = useQueryClient();

  // Fetch notification history from API
  const {
    data: notificationsData,
    isLoading: isLoadingNotifications,
    isError: isNotificationsError,
  } = useQuery({
    queryKey: ['notifications', 'history'],
    queryFn: () => apiClient.getNotificationHistory({ limit: 100 }),
  });

  // Fetch notification preferences from API (loading state used for save button)
  const {
    isLoading: isLoadingPreferences,
  } = useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: () => apiClient.getNotificationPreferences(),
  });

  // Mark a single notification as read (clicked)
  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      fetchApi(`/api/notifications/clicked/${notificationId}`, {
        method: 'POST',
      }),
    onMutate: async (notificationId: string) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['notifications', 'history'] });
      const previous = queryClient.getQueryData(['notifications', 'history']);
      queryClient.setQueryData(
        ['notifications', 'history'],
        (old: { notifications: NotificationHistoryItem[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications.map((n: NotificationHistoryItem) =>
              n.id === notificationId ? { ...n, status: 'clicked' } : n
            ),
          };
        }
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications', 'history'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'history'] });
    },
  });

  // Mark all notifications as read (call clicked endpoint for each unread)
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(
        unread.map((n) =>
          fetchApi(`/api/notifications/clicked/${n.id}`, {
            method: 'POST',
          })
        )
      );
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications', 'history'] });
      const previous = queryClient.getQueryData(['notifications', 'history']);
      queryClient.setQueryData(
        ['notifications', 'history'],
        (old: { notifications: NotificationHistoryItem[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications.map((n: NotificationHistoryItem) => ({
              ...n,
              status: 'clicked',
            })),
          };
        }
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications', 'history'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'history'] });
    },
  });

  // Save notification preferences
  const savePreferencesMutation = useMutation({
    mutationFn: (prefs: Parameters<typeof apiClient.updateNotificationPreferences>[0]) =>
      apiClient.updateNotificationPreferences(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'preferences'] });
    },
  });

  // Transform API data to UI Notification type.
  // The API returns { notifications: [...], limit, offset } but the client type
  // declares Array<...>. We handle both shapes defensively.
  const rawNotifications: NotificationHistoryItem[] = Array.isArray(notificationsData)
    ? (notificationsData as unknown as NotificationHistoryItem[])
    : ((notificationsData as unknown as { notifications?: NotificationHistoryItem[] })?.notifications ?? []);
  const notifications: Notification[] = rawNotifications.map(mapToNotification);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.read)
      : notifications;

  const handleRead = (id: string) => {
    markReadMutation.mutate(id);
  };

  const handleReadAll = () => {
    markAllReadMutation.mutate();
  };

  const handleSavePreferences = (prefs: Array<{
    type: string;
    label: string;
    description: string;
    email: boolean;
    push: boolean;
    inApp: boolean;
  }>) => {
    // Map the component preferences format to the API preferences format.
    // The API stores per-category booleans at the top level, so we translate
    // the per-type push toggles into the matching API fields.
    const choreReminders = prefs.find((p) => p.type === 'chore_reminder')?.push ?? true;
    const streakReminders = prefs.find((p) => p.type === 'streak_at_risk')?.push ?? true;
    const approvalRequests = prefs.find((p) => p.type === 'approval_needed')?.push ?? true;
    const familyUpdates = prefs.find((p) => p.type === 'family_goal')?.push ?? true;
    const celebrations = prefs.find((p) => p.type === 'badge_earned')?.push ?? true;

    // Check if push is globally enabled (all push toggles on)
    const pushEnabled = prefs.some((p) => p.push);

    savePreferencesMutation.mutate({
      pushEnabled,
      choreReminders,
      streakReminders,
      approvalRequests,
      familyUpdates,
      celebrations,
    });
  };

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-500">
                {isLoadingNotifications
                  ? 'Loading notifications...'
                  : isNotificationsError
                    ? 'Could not load notifications'
                    : unreadCount > 0
                      ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                      : 'All caught up!'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/20">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Error state */}
        {isNotificationsError && activeTab !== 'settings' && (
          <div className="bg-white rounded-xl border border-red-200 overflow-hidden p-8 text-center">
            <div className="text-4xl mb-2">⚠️</div>
            <h3 className="font-medium text-gray-900">Failed to load notifications</h3>
            <p className="text-sm text-gray-500 mt-1">
              Please try refreshing the page. If this keeps happening, check your connection.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['notifications', 'history'] })}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Content */}
        {!(isNotificationsError && activeTab !== 'settings') && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {activeTab === 'settings' ? (
              <div className="p-6">
                <NotificationPreferences
                  onSave={handleSavePreferences}
                  isLoading={savePreferencesMutation.isPending || isLoadingPreferences}
                />
                {savePreferencesMutation.isSuccess && (
                  <p className="text-sm text-green-600 mt-2 text-right">
                    Preferences saved successfully.
                  </p>
                )}
                {savePreferencesMutation.isError && (
                  <p className="text-sm text-red-600 mt-2 text-right">
                    Failed to save preferences. Please try again.
                  </p>
                )}
              </div>
            ) : (
              <NotificationList
                notifications={filteredNotifications}
                onRead={handleRead}
                onReadAll={handleReadAll}
                isLoading={isLoadingNotifications}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
