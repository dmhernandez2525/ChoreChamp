import { cn } from '@chorechamp/ui';
import type { Activity } from './ActivityItem';

interface MemberSummary {
  memberId: string;
  memberName: string;
  memberAvatar?: string;
  activityCount: number;
  choresCompleted: number;
  pointsEarned: number;
}

interface MemberActivitySummaryProps {
  activities: Activity[];
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function MemberActivitySummary({ activities, className }: MemberActivitySummaryProps) {
  // Aggregate activity by member
  const memberMap = new Map<string, MemberSummary>();

  activities.forEach((activity) => {
    const existing = memberMap.get(activity.memberId) || {
      memberId: activity.memberId,
      memberName: activity.memberName,
      memberAvatar: activity.memberAvatar,
      activityCount: 0,
      choresCompleted: 0,
      pointsEarned: 0,
    };

    existing.activityCount++;
    if (activity.type === 'chore_completed') {
      existing.choresCompleted++;
    }
    if (activity.type === 'points_earned' && activity.metadata?.points) {
      existing.pointsEarned += activity.metadata.points as number;
    }

    memberMap.set(activity.memberId, existing);
  });

  const members = Array.from(memberMap.values()).sort(
    (a, b) => b.activityCount - a.activityCount
  );

  if (members.length === 0) {
    return null;
  }

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-4', className)}>
      <h3 className="font-semibold text-gray-900 mb-4">Member Activity</h3>
      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.memberId} className="flex items-center gap-3">
            {/* Avatar */}
            {member.memberAvatar ? (
              <img
                src={member.memberAvatar}
                alt={member.memberName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-medium text-sm">
                {getInitials(member.memberName)}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{member.memberName}</p>
              <p className="text-xs text-gray-500">
                {member.choresCompleted} chores • {member.activityCount} activities
              </p>
            </div>

            {/* Activity bar */}
            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${Math.min((member.activityCount / Math.max(...members.map((m) => m.activityCount))) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
