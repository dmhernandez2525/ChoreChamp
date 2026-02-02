import { useState, useEffect, useCallback } from 'react';
import { Trophy, Medal, Crown, Award, RefreshCw } from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { AchievementLeaderboard as LeaderboardType, AchievementLeaderboardEntry } from '@chorechamp/types';

interface AchievementLeaderboardProps {
  householdId: string;
}

export function AchievementLeaderboard({ householdId }: AchievementLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardType | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all-time'>('all-time');
  const [isLoading, setIsLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getAchievementLeaderboard(householdId, timeframe);
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [householdId, timeframe]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">{rank}</span>;
    }
  };

  const getRankBackground = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800';
    switch (rank) {
      case 1:
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 2:
        return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';
      case 3:
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!leaderboard) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Achievement Leaderboard
        </h3>
        <button onClick={loadLeaderboard} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Timeframe selector */}
      <div className="flex gap-2">
        {(['week', 'month', 'all-time'] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeframe === tf
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tf === 'all-time' ? 'All Time' : tf.charAt(0).toUpperCase() + tf.slice(1)}
          </button>
        ))}
      </div>

      {/* Leaderboard entries */}
      <div className="space-y-2">
        {leaderboard.entries.map((entry) => (
          <LeaderboardRow
            key={entry.memberId}
            entry={entry}
            rankIcon={getRankIcon(entry.rank)}
            background={getRankBackground(entry.rank, entry.isCurrentUser)}
          />
        ))}
      </div>

      {/* Current user rank (if not in top entries) */}
      {leaderboard.myRank && leaderboard.myRank > leaderboard.entries.length && (
        <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
          <p className="text-sm text-indigo-600 dark:text-indigo-400">
            Your rank: #{leaderboard.myRank}
          </p>
        </div>
      )}
    </div>
  );
}

function LeaderboardRow({
  entry,
  rankIcon,
  background,
}: {
  entry: AchievementLeaderboardEntry;
  rankIcon: React.ReactNode;
  background: string;
}) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg border ${background}`}>
      <div className="flex-shrink-0">{rankIcon}</div>
      <div className="flex-shrink-0 w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
        {entry.avatarUrl ? (
          <img src={entry.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-gray-500">{entry.memberName.charAt(0)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-gray-100">
          {entry.memberName}
          {entry.isCurrentUser && (
            <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">(You)</span>
          )}
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Award className="w-4 h-4" />
          <span>{entry.achievementCount} achievements</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{entry.points}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">points</p>
      </div>
    </div>
  );
}
