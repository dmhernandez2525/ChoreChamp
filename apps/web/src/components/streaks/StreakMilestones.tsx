import { cn } from '@chorechamp/ui';

interface StreakMilestonesProps {
  currentStreak: number;
  className?: string;
}

const MILESTONES = [
  { days: 3, icon: '🌱', label: 'Seedling', bonus: 10 },
  { days: 7, icon: '🔥', label: 'On Fire', bonus: 25 },
  { days: 14, icon: '⚡', label: 'Electrifying', bonus: 50 },
  { days: 30, icon: '🏆', label: 'Champion', bonus: 100 },
  { days: 60, icon: '💎', label: 'Diamond', bonus: 200 },
  { days: 100, icon: '👑', label: 'Legendary', bonus: 500 },
];

export function StreakMilestones({ currentStreak, className }: StreakMilestonesProps) {
  const nextMilestone = MILESTONES.find((m) => m.days > currentStreak);

  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-4', className)}>
      <h3 className="font-semibold text-gray-900 mb-4">Streak Milestones</h3>

      {/* Progress to next milestone */}
      {nextMilestone && (
        <div className="mb-6 rounded-lg bg-blue-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">
              Next: {nextMilestone.label}
            </span>
            <span className="text-2xl">{nextMilestone.icon}</span>
          </div>
          <div className="h-3 w-full rounded-full bg-blue-200">
            <div
              className="h-3 rounded-full bg-blue-500 transition-all"
              style={{
                width: `${Math.min((currentStreak / nextMilestone.days) * 100, 100)}%`,
              }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-blue-600">
            <span>{currentStreak} days</span>
            <span>{nextMilestone.days - currentStreak} more to go</span>
          </div>
          <p className="mt-2 text-xs text-blue-600">
            +{nextMilestone.bonus} bonus points at milestone!
          </p>
        </div>
      )}

      {/* Milestone list */}
      <div className="space-y-2">
        {MILESTONES.map((milestone) => {
          const achieved = currentStreak >= milestone.days;
          const isCurrent =
            currentStreak >= milestone.days &&
            (MILESTONES.findIndex((m) => m.days > currentStreak) ===
              MILESTONES.indexOf(milestone) + 1 ||
              milestone.days === 100 && currentStreak >= 100);

          return (
            <div
              key={milestone.days}
              className={cn(
                'flex items-center gap-3 rounded-lg p-3 transition-colors',
                achieved
                  ? isCurrent
                    ? 'bg-gradient-to-r from-orange-100 to-yellow-100 ring-2 ring-orange-300'
                    : 'bg-green-50'
                  : 'bg-gray-50 opacity-50'
              )}
            >
              <span className="text-2xl">{milestone.icon}</span>
              <div className="flex-1">
                <p className={cn('font-medium', achieved ? 'text-gray-900' : 'text-gray-500')}>
                  {milestone.label}
                </p>
                <p className="text-xs text-gray-500">{milestone.days} days</p>
              </div>
              <div className="text-right">
                {achieved ? (
                  <span className="text-green-600 text-sm font-medium">✓ Earned</span>
                ) : (
                  <span className="text-yellow-600 text-xs">+{milestone.bonus} pts</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
