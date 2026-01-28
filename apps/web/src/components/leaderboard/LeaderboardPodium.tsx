import { cn } from '@chorechamp/ui';
import type { LeaderboardEntry } from '@chorechamp/types';

interface LeaderboardPodiumProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  className?: string;
}

function PodiumPlace({
  entry,
  rank,
  isCurrentUser,
}: {
  entry?: LeaderboardEntry;
  rank: 1 | 2 | 3;
  isCurrentUser?: boolean;
}) {
  const heights = { 1: 'h-32', 2: 'h-24', 3: 'h-20' };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const bgColors = { 1: 'bg-yellow-400', 2: 'bg-gray-300', 3: 'bg-orange-400' };
  const order = { 1: 'order-2', 2: 'order-1', 3: 'order-3' };

  return (
    <div className={cn('flex flex-col items-center', order[rank])}>
      {entry ? (
        <>
          {/* Avatar */}
          <div
            className={cn(
              'flex items-center justify-center rounded-full text-white font-bold text-xl shadow-lg',
              rank === 1 ? 'h-16 w-16' : 'h-12 w-12',
              isCurrentUser && 'ring-4 ring-blue-400'
            )}
            style={{ backgroundColor: entry.memberColor || '#3B82F6' }}
          >
            {entry.memberName.charAt(0).toUpperCase()}
          </div>

          {/* Name */}
          <p
            className={cn(
              'mt-2 font-semibold truncate max-w-[100px] text-center',
              isCurrentUser && 'text-blue-700'
            )}
          >
            {entry.memberName}
          </p>

          {/* Points */}
          <p className="text-sm text-gray-500">{entry.totalPoints} pts</p>

          {/* Medal */}
          <span className="text-3xl my-2">{medals[rank]}</span>
        </>
      ) : (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-400">
            ?
          </div>
          <p className="mt-2 text-gray-400 text-sm">--</p>
          <span className="text-3xl my-2 opacity-30">{medals[rank]}</span>
        </>
      )}

      {/* Podium */}
      <div
        className={cn(
          'w-24 rounded-t-lg flex items-start justify-center pt-2 text-white font-bold',
          heights[rank],
          bgColors[rank]
        )}
      >
        {rank}
      </div>
    </div>
  );
}

export function LeaderboardPodium({
  entries,
  currentUserId,
  className,
}: LeaderboardPodiumProps) {
  const first = entries.find((e) => e.rank === 1);
  const second = entries.find((e) => e.rank === 2);
  const third = entries.find((e) => e.rank === 3);

  return (
    <div className={cn('flex justify-center items-end gap-4 pb-4', className)}>
      <PodiumPlace
        entry={second}
        rank={2}
        isCurrentUser={second?.memberId === currentUserId}
      />
      <PodiumPlace
        entry={first}
        rank={1}
        isCurrentUser={first?.memberId === currentUserId}
      />
      <PodiumPlace
        entry={third}
        rank={3}
        isCurrentUser={third?.memberId === currentUserId}
      />
    </div>
  );
}
