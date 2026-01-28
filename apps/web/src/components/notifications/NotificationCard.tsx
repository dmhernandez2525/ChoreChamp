import { cn } from '@chorechamp/ui';

export type NotificationType =
  | 'chore_reminder'
  | 'chore_completed'
  | 'approval_needed'
  | 'reward_redeemed'
  | 'badge_earned'
  | 'streak_at_risk'
  | 'boss_battle'
  | 'family_goal';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationCardProps {
  notification: Notification;
  onRead?: () => void;
  onClick?: () => void;
}

const notificationConfig: Record<NotificationType, { icon: string; color: string }> = {
  chore_reminder: { icon: '⏰', color: 'bg-blue-100' },
  chore_completed: { icon: '✅', color: 'bg-green-100' },
  approval_needed: { icon: '👀', color: 'bg-yellow-100' },
  reward_redeemed: { icon: '🎁', color: 'bg-pink-100' },
  badge_earned: { icon: '🏆', color: 'bg-purple-100' },
  streak_at_risk: { icon: '🔥', color: 'bg-orange-100' },
  boss_battle: { icon: '⚔️', color: 'bg-red-100' },
  family_goal: { icon: '👨‍👩‍👧‍👦', color: 'bg-cyan-100' },
};

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export function NotificationCard({
  notification,
  onRead,
  onClick,
}: NotificationCardProps) {
  const config = notificationConfig[notification.type];

  const handleClick = () => {
    if (!notification.read && onRead) {
      onRead();
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 w-full p-3 text-left transition-colors rounded-lg',
        notification.read ? 'bg-white' : 'bg-blue-50',
        onClick && 'hover:bg-gray-50 cursor-pointer'
      )}
    >
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg text-xl', config.color)}>
        {config.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('font-medium text-gray-900', !notification.read && 'font-semibold')}>
            {notification.title}
          </p>
          {!notification.read && (
            <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
          )}
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">{formatTime(notification.createdAt)}</p>
      </div>
    </button>
  );
}
