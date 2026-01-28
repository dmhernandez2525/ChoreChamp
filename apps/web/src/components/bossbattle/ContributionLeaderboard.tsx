import { cn } from '@chorechamp/ui';

interface Contributor {
  memberId: string;
  memberName: string;
  memberColor: string;
  damage: number;
  chores: number;
}

interface ContributionLeaderboardProps {
  contributors: Contributor[];
  currentUserId?: string;
  className?: string;
}

export function ContributionLeaderboard({
  contributors,
  currentUserId,
  className,
}: ContributionLeaderboardProps) {
  const totalDamage = contributors.reduce((sum, c) => sum + c.damage, 0);
  const sortedContributors = [...contributors].sort((a, b) => b.damage - a.damage);

  if (contributors.length === 0) {
    return (
      <div className={cn('rounded-lg border border-gray-200 bg-white p-4', className)}>
        <h3 className="font-semibold text-gray-900 mb-4">Team Contributions</h3>
        <p className="text-gray-500 text-sm text-center py-4">
          No contributions yet. Complete chores to deal damage!
        </p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-4', className)}>
      <h3 className="font-semibold text-gray-900 mb-4">Team Contributions</h3>

      <div className="space-y-3">
        {sortedContributors.map((contributor, index) => {
          const isCurrentUser = contributor.memberId === currentUserId;
          const percentage = totalDamage > 0 ? (contributor.damage / totalDamage) * 100 : 0;

          return (
            <div
              key={contributor.memberId}
              className={cn(
                'relative overflow-hidden rounded-lg p-3',
                isCurrentUser ? 'bg-blue-50' : 'bg-gray-50'
              )}
            >
              {/* Background progress bar */}
              <div
                className={cn(
                  'absolute inset-0 opacity-20',
                  isCurrentUser ? 'bg-blue-500' : 'bg-green-500'
                )}
                style={{ width: `${percentage}%` }}
              />

              <div className="relative flex items-center gap-3">
                {/* Rank */}
                <span className="w-6 text-center font-bold text-gray-500">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                </span>

                {/* Avatar */}
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-bold"
                  style={{ backgroundColor: contributor.memberColor || '#3B82F6' }}
                >
                  {contributor.memberName.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn('font-medium truncate', isCurrentUser && 'text-blue-700')}>
                    {contributor.memberName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {contributor.chores} chores
                  </p>
                </div>

                {/* Damage */}
                <div className="text-right">
                  <p className="font-bold text-red-600">{contributor.damage}</p>
                  <p className="text-xs text-gray-500">damage</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm">
        <span className="text-gray-600">Total Team Damage</span>
        <span className="font-bold text-red-600">{totalDamage} HP</span>
      </div>
    </div>
  );
}
