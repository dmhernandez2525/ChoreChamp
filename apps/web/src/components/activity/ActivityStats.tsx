import { cn } from '@chorechamp/ui';
import type { Activity } from './ActivityItem';

interface ActivityStatsProps {
  activities: Activity[];
  className?: string;
}

interface StatItem {
  label: string;
  value: number;
  icon: string;
  color: string;
}

export function ActivityStats({ activities, className }: ActivityStatsProps) {
  const today = new Date();
  const todayActivities = activities.filter(
    (a) => new Date(a.createdAt).toDateString() === today.toDateString()
  );

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 7);
  const weekActivities = activities.filter(
    (a) => new Date(a.createdAt) >= weekStart
  );

  const choresCompleted = activities.filter(
    (a) => a.type === 'chore_completed'
  ).length;

  const badgesEarned = activities.filter(
    (a) => a.type === 'badge_earned'
  ).length;

  const stats: StatItem[] = [
    {
      label: 'Today',
      value: todayActivities.length,
      icon: '📅',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'This Week',
      value: weekActivities.length,
      icon: '📆',
      color: 'bg-green-100 text-green-700',
    },
    {
      label: 'Chores Done',
      value: choresCompleted,
      icon: '✅',
      color: 'bg-purple-100 text-purple-700',
    },
    {
      label: 'Badges Earned',
      value: badgesEarned,
      icon: '🏆',
      color: 'bg-yellow-100 text-yellow-700',
    },
  ];

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-xl border border-gray-200 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg text-sm',
                stat.color
              )}
            >
              {stat.icon}
            </span>
            <span className="text-sm text-gray-500">{stat.label}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
