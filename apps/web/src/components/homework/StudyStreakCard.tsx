import type { StudyStreak } from '@chorechamp/types';

interface StudyStreakCardProps {
  streak: StudyStreak;
  memberName?: string;
}

export function StudyStreakCard({ streak, memberName }: StudyStreakCardProps) {
  const formatMinutes = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const weeklyProgress = streak.weeklyGoalMinutes > 0
    ? Math.min(100, (streak.weeklyMinutes / streak.weeklyGoalMinutes) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">
          {memberName ? `${memberName}'s Study Stats` : 'Study Stats'}
        </h3>
        {streak.currentStreak > 0 && (
          <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
            <span className="text-lg">🔥</span>
            <span className="font-bold">{streak.currentStreak} day streak</span>
          </div>
        )}
      </div>

      {/* Weekly progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Weekly Goal</span>
          <span>{formatMinutes(streak.weeklyMinutes)} / {formatMinutes(streak.weeklyGoalMinutes)}</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              weeklyProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(100, weeklyProgress)}%` }}
          />
        </div>
        {weeklyProgress >= 100 && (
          <p className="text-sm text-green-600 mt-1 font-medium">
            Weekly goal achieved!
          </p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{streak.weeklySessionCount}</p>
          <p className="text-xs text-gray-500">Sessions This Week</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{formatMinutes(streak.monthlyMinutes)}</p>
          <p className="text-xs text-gray-500">This Month</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">{streak.longestStreak}</p>
          <p className="text-xs text-gray-500">Longest Streak</p>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <p className="text-2xl font-bold text-orange-600">{streak.totalAssignmentsCompleted}</p>
          <p className="text-xs text-gray-500">Assignments Done</p>
        </div>
      </div>

      {/* All-time totals */}
      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Total Study Time:</span>
          <span className="ml-2 font-semibold text-gray-900">{formatMinutes(streak.totalMinutes)}</span>
        </div>
        <div>
          <span className="text-gray-500">Total Sessions:</span>
          <span className="ml-2 font-semibold text-gray-900">{streak.totalSessions}</span>
        </div>
      </div>

      {/* Last study date */}
      {streak.lastStudyDate && (
        <p className="mt-3 text-xs text-gray-400 text-center">
          Last studied: {new Date(streak.lastStudyDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
