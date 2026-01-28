import { cn } from '@chorechamp/ui';

export type ActivityType =
  | 'chore_created'
  | 'chore_completed'
  | 'chore_approved'
  | 'chore_rejected'
  | 'reward_created'
  | 'reward_redeemed'
  | 'reward_fulfilled'
  | 'badge_earned'
  | 'streak_achieved'
  | 'streak_lost'
  | 'points_earned'
  | 'points_spent'
  | 'member_joined'
  | 'member_left'
  | 'boss_damage'
  | 'boss_defeated'
  | 'goal_completed';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  memberId: string;
  memberName: string;
  memberAvatar?: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

interface ActivityItemProps {
  activity: Activity;
  showMember?: boolean;
}

const activityConfig: Record<ActivityType, { icon: string; color: string; bgColor: string }> = {
  chore_created: { icon: '📝', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  chore_completed: { icon: '✅', color: 'text-green-600', bgColor: 'bg-green-100' },
  chore_approved: { icon: '👍', color: 'text-green-600', bgColor: 'bg-green-100' },
  chore_rejected: { icon: '❌', color: 'text-red-600', bgColor: 'bg-red-100' },
  reward_created: { icon: '🎁', color: 'text-pink-600', bgColor: 'bg-pink-100' },
  reward_redeemed: { icon: '🛒', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  reward_fulfilled: { icon: '✨', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  badge_earned: { icon: '🏆', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  streak_achieved: { icon: '🔥', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  streak_lost: { icon: '💔', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  points_earned: { icon: '⭐', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  points_spent: { icon: '💰', color: 'text-green-600', bgColor: 'bg-green-100' },
  member_joined: { icon: '👋', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  member_left: { icon: '👋', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  boss_damage: { icon: '⚔️', color: 'text-red-600', bgColor: 'bg-red-100' },
  boss_defeated: { icon: '🎉', color: 'text-green-600', bgColor: 'bg-green-100' },
  goal_completed: { icon: '🎯', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
};

function formatActivityTime(date: Date): string {
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

export function ActivityItem({ activity, showMember = true }: ActivityItemProps) {
  const config = activityConfig[activity.type];

  return (
    <div className="flex items-start gap-3 p-3">
      {/* Activity icon */}
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg',
          config.bgColor
        )}
      >
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {showMember && (
              <span className="font-medium text-gray-900">{activity.memberName}</span>
            )}
            <p className={cn('text-gray-700', showMember && 'inline')}>
              {showMember && ' '}
              {activity.title}
            </p>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {formatActivityTime(activity.createdAt)}
          </span>
        </div>
        {activity.description && (
          <p className="text-sm text-gray-500 mt-0.5">{activity.description}</p>
        )}
      </div>
    </div>
  );
}
