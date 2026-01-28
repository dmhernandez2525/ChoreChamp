import { cn } from '@chorechamp/ui';
import type { LeaderboardEntry } from '@chorechamp/types';

interface LeaderboardCardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  title?: string;
  className?: string;
  onViewAll?: () => void;
}

export function LeaderboardCard({
  entries,
  currentUserId,
  title = 'Leaderboard',
  className,
  onViewAll,
}: LeaderboardCardProps) {
  const top3 = entries.slice(0, 3);
  const currentUserEntry = entries.find((e) => e.memberId === currentUserId);
  const currentUserNotInTop3 =
    currentUserEntry && !top3.some((e) => e.memberId === currentUserId);

  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View All →
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          No entries yet. Start completing chores!
        </div>
      ) : (
        <div className="space-y-3">
          {top3.map((entry) => {
            const isCurrentUser = entry.memberId === currentUserId;
            const medals = ['🥇', '🥈', '🥉'];

            return (
              <div
                key={entry.memberId}
                className={cn(
                  'flex items-center gap-3',
                  isCurrentUser && 'bg-blue-50 -mx-2 px-2 py-1 rounded'
                )}
              >
                <span className="w-6 text-center text-lg">{medals[entry.rank - 1]}</span>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-bold"
                  style={{ backgroundColor: entry.memberColor || '#3B82F6' }}
                >
                  {entry.memberName.charAt(0)}
                </div>
                <span className={cn('flex-1 font-medium truncate', isCurrentUser && 'text-blue-700')}>
                  {entry.memberName}
                </span>
                <span className="font-semibold">{entry.totalPoints}</span>
              </div>
            );
          })}

          {/* Show current user if not in top 3 */}
          {currentUserNotInTop3 && currentUserEntry && (
            <>
              <div className="border-t border-dashed border-gray-200 my-2" />
              <div className="flex items-center gap-3 bg-blue-50 -mx-2 px-2 py-1 rounded">
                <span className="w-6 text-center text-sm text-gray-500">
                  #{currentUserEntry.rank}
                </span>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-bold"
                  style={{ backgroundColor: currentUserEntry.memberColor || '#3B82F6' }}
                >
                  {currentUserEntry.memberName.charAt(0)}
                </div>
                <span className="flex-1 font-medium text-blue-700 truncate">
                  {currentUserEntry.memberName}
                </span>
                <span className="font-semibold">{currentUserEntry.totalPoints}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
