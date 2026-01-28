import { cn } from '@chorechamp/ui';
import type { LeaderboardEntry as LeaderboardEntryType } from '@chorechamp/types';

interface LeaderboardEntryProps {
  entry: LeaderboardEntryType;
  isCurrentUser?: boolean;
}

function getRankDisplay(rank: number): { icon: string; color: string } {
  switch (rank) {
    case 1:
      return { icon: '🥇', color: 'text-yellow-500' };
    case 2:
      return { icon: '🥈', color: 'text-gray-400' };
    case 3:
      return { icon: '🥉', color: 'text-orange-400' };
    default:
      return { icon: `#${rank}`, color: 'text-gray-500' };
  }
}

export function LeaderboardEntry({ entry, isCurrentUser }: LeaderboardEntryProps) {
  const { icon, color } = getRankDisplay(entry.rank);

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg p-3 transition-colors',
        isCurrentUser ? 'bg-blue-50 ring-2 ring-blue-300' : 'hover:bg-gray-50'
      )}
    >
      {/* Rank */}
      <div className={cn('w-10 text-center font-bold text-lg', color)}>
        {entry.rank <= 3 ? icon : icon}
      </div>

      {/* Avatar */}
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold"
        style={{ backgroundColor: entry.memberColor || '#3B82F6' }}
      >
        {entry.memberName.charAt(0).toUpperCase()}
      </div>

      {/* Name and stats */}
      <div className="flex-1 min-w-0">
        <p className={cn('font-semibold truncate', isCurrentUser && 'text-blue-700')}>
          {entry.memberName}
          {isCurrentUser && (
            <span className="ml-2 text-xs font-normal text-blue-500">(You)</span>
          )}
        </p>
        <p className="text-sm text-gray-500">
          {entry.completedChores} chores completed
        </p>
      </div>

      {/* Points */}
      <div className="text-right">
        <p className="font-bold text-lg">{entry.totalPoints.toLocaleString()}</p>
        <p className="text-xs text-gray-500">points</p>
      </div>
    </div>
  );
}
