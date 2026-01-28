import { cn } from '@chorechamp/ui';
import { ActivityItem } from './ActivityItem';
import type { Activity } from './ActivityItem';

interface ActivityFeedProps {
  activities: Activity[];
  isLoading?: boolean;
  showMember?: boolean;
  maxItems?: number;
  emptyMessage?: string;
  className?: string;
}

function groupActivitiesByDate(activities: Activity[]): Map<string, Activity[]> {
  const groups = new Map<string, Activity[]>();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  activities.forEach((activity) => {
    const activityDate = new Date(activity.createdAt);
    let dateKey: string;

    if (activityDate.toDateString() === today.toDateString()) {
      dateKey = 'Today';
    } else if (activityDate.toDateString() === yesterday.toDateString()) {
      dateKey = 'Yesterday';
    } else if (activityDate.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
      dateKey = activityDate.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      dateKey = activityDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: activityDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }

    const existing = groups.get(dateKey) || [];
    existing.push(activity);
    groups.set(dateKey, existing);
  });

  return groups;
}

export function ActivityFeed({
  activities,
  isLoading,
  showMember = true,
  maxItems,
  emptyMessage = 'No activity yet',
  className,
}: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className={cn('p-8 text-center', className)}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
        <p className="mt-2 text-gray-500 text-sm">Loading activity...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={cn('p-8 text-center', className)}>
        <div className="text-4xl mb-2">📋</div>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  const displayActivities = maxItems ? activities.slice(0, maxItems) : activities;
  const groupedActivities = groupActivitiesByDate(displayActivities);

  return (
    <div className={cn('divide-y divide-gray-100', className)}>
      {Array.from(groupedActivities.entries()).map(([dateLabel, dateActivities]) => (
        <div key={dateLabel}>
          <div className="px-4 py-2 bg-gray-50 sticky top-0">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {dateLabel}
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {dateActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} showMember={showMember} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
