import type { LeaderboardEntry as LeaderboardEntryType } from '@chorechamp/types';
import { LeaderboardEntry } from './LeaderboardEntry';

interface LeaderboardTableProps {
  entries: LeaderboardEntryType[];
  currentUserId?: string;
  showEmptyState?: boolean;
}

export function LeaderboardTable({
  entries,
  currentUserId,
  showEmptyState = true,
}: LeaderboardTableProps) {
  if (entries.length === 0 && showEmptyState) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <div className="text-4xl mb-2">🏆</div>
        <h3 className="font-medium text-gray-900">No rankings yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Complete chores to appear on the leaderboard!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <LeaderboardEntry
          key={entry.memberId}
          entry={entry}
          isCurrentUser={entry.memberId === currentUserId}
        />
      ))}
    </div>
  );
}
