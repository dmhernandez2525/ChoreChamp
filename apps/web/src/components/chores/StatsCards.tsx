import { cn } from '@chorechamp/ui';
import type { TodayChore, Member } from '@chorechamp/types';

interface StatsCardsProps {
  todayChores: TodayChore[];
  currentMember?: Member | null;
  isLoading?: boolean;
}

export function StatsCards({ todayChores, currentMember, isLoading }: StatsCardsProps) {
  // Calculate stats
  const totalChores = todayChores.length;
  const completedChores = todayChores.filter(
    (c) => c.completion?.status === 'approved' ||
           (c.completion && !c.chore.requiresApproval)
  ).length;
  const pendingApproval = todayChores.filter(
    (c) => c.chore.requiresApproval && c.completion?.status === 'pending'
  ).length;

  const pointsToday = todayChores.reduce((sum, c) => {
    if (c.completion?.pointsAwarded) {
      return sum + c.completion.pointsAwarded;
    }
    return sum;
  }, 0);

  const progress = totalChores > 0 ? Math.round((completedChores / totalChores) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Today's Progress */}
      <StatCard
        title="Today's Progress"
        value={`${completedChores}/${totalChores}`}
        subtitle={totalChores === 0 ? 'No chores scheduled' : `${progress}% complete`}
        icon="📋"
        color="blue"
        isLoading={isLoading}
      >
        {totalChores > 0 && (
          <div className="mt-3">
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </StatCard>

      {/* Points Today */}
      <StatCard
        title="Points Earned Today"
        value={`+${pointsToday}`}
        subtitle={pointsToday === 0 ? 'Complete chores to earn!' : 'Keep it up!'}
        icon="⭐"
        color="yellow"
        isLoading={isLoading}
      />

      {/* Current Streak */}
      <StatCard
        title="Current Streak"
        value={`${currentMember?.streakCurrent || 0}`}
        subtitle={
          currentMember?.streakCurrent
            ? `Best: ${currentMember.streakLongest} days`
            : 'Complete chores daily!'
        }
        icon="🔥"
        color="orange"
        isLoading={isLoading}
      />

      {/* Total Points */}
      <StatCard
        title="Total Points"
        value={currentMember?.pointsCurrent?.toLocaleString() || '0'}
        subtitle={
          currentMember?.pointsLifetime
            ? `Lifetime: ${currentMember.pointsLifetime.toLocaleString()}`
            : 'Start earning!'
        }
        icon="🏆"
        color="purple"
        isLoading={isLoading}
      />

      {/* Pending Approvals (if any) */}
      {pendingApproval > 0 && (
        <StatCard
          title="Pending Approval"
          value={pendingApproval.toString()}
          subtitle="Waiting for parent review"
          icon="⏳"
          color="amber"
          isLoading={isLoading}
          className="sm:col-span-2 lg:col-span-4"
        />
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: 'blue' | 'yellow' | 'orange' | 'purple' | 'green' | 'amber';
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const colorClasses = {
  blue: 'text-blue-600',
  yellow: 'text-yellow-600',
  orange: 'text-orange-500',
  purple: 'text-purple-600',
  green: 'text-green-600',
  amber: 'text-amber-600',
};

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  isLoading,
  className,
  children,
}: StatCardProps) {
  if (isLoading) {
    return (
      <div className={cn('rounded-lg bg-white p-6 shadow animate-pulse', className)}>
        <div className="h-4 w-24 rounded bg-gray-200 mb-4" />
        <div className="h-8 w-16 rounded bg-gray-200 mb-2" />
        <div className="h-3 w-32 rounded bg-gray-200" />
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg bg-white p-6 shadow', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={cn('mt-2 text-3xl font-bold', colorClasses[color])}>
        {value}
      </p>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      {children}
    </div>
  );
}

// Quick stats for header/compact view
interface QuickStatsProps {
  member?: Member | null;
}

export function QuickStats({ member }: QuickStatsProps) {
  if (!member) return null;

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="flex items-center gap-1">
        <span className="text-orange-500">🔥</span>
        <span className="font-medium">{member.streakCurrent}</span>
        <span className="text-gray-500">day streak</span>
      </span>
      <span className="flex items-center gap-1">
        <span className="text-blue-500">⭐</span>
        <span className="font-medium">{member.pointsCurrent?.toLocaleString()}</span>
        <span className="text-gray-500">points</span>
      </span>
    </div>
  );
}
