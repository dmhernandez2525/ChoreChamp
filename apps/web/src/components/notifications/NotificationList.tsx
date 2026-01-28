import { Button } from '@chorechamp/ui';
import { NotificationCard } from './NotificationCard';
import type { Notification } from './NotificationCard';

interface NotificationListProps {
  notifications: Notification[];
  onRead: (id: string) => void;
  onReadAll: () => void;
  onClick?: (notification: Notification) => void;
  isLoading?: boolean;
}

export function NotificationList({
  notifications,
  onRead,
  onReadAll,
  onClick,
  isLoading,
}: NotificationListProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
        <p className="mt-2 text-gray-500 text-sm">Loading notifications...</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-4xl mb-2">🔔</div>
        <h3 className="font-medium text-gray-900">All caught up!</h3>
        <p className="text-sm text-gray-500 mt-1">No notifications to show</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <span className="text-sm text-gray-500">{unreadCount} unread</span>
          <Button variant="ghost" size="sm" onClick={onReadAll}>
            Mark all read
          </Button>
        </div>
      )}

      {/* Notification list */}
      <div className="divide-y divide-gray-100">
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onRead={() => onRead(notification.id)}
            onClick={onClick ? () => onClick(notification) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
