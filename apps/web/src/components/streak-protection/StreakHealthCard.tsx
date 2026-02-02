import { Flame, Snowflake, AlertTriangle, Trophy } from 'lucide-react';
import type { StreakHealth } from '@chorechamp/types';
import { getRiskColor } from '@chorechamp/types';

interface StreakHealthCardProps {
  health: StreakHealth;
  onUseFreeze: () => void;
}

export function StreakHealthCard({ health, onUseFreeze }: StreakHealthCardProps) {
  const riskColor = getRiskColor(health.riskLevel);

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        {/* Member info */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: riskColor }}
          >
            {health.memberName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {health.memberName}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="font-medium text-orange-600 dark:text-orange-400">
                {health.currentStreak} day streak
              </span>
              {health.longestStreak > health.currentStreak && (
                <span className="text-gray-500 dark:text-gray-400">
                  (best: {health.longestStreak})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Freeze button */}
        {health.freezesAvailable > 0 && health.riskLevel !== 'safe' && (
          <button
            onClick={onUseFreeze}
            className="flex items-center gap-1 px-3 py-1.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-lg text-sm hover:bg-cyan-200 dark:hover:bg-cyan-900/50"
          >
            <Snowflake className="w-4 h-4" />
            Use Freeze ({health.freezesAvailable})
          </button>
        )}
      </div>

      {/* Risk indicator */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-500 dark:text-gray-400">Risk Level</span>
          <span
            className="text-sm font-medium capitalize"
            style={{ color: riskColor }}
          >
            {health.riskLevel}
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${health.riskScore}%`,
              backgroundColor: riskColor,
            }}
          />
        </div>
      </div>

      {/* Risk factors */}
      {health.riskFactors.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {health.riskFactors.map((factor) => (
            <span
              key={factor}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs"
            >
              <AlertTriangle className="w-3 h-3" />
              {factor.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {/* Milestone progress */}
      {health.nextMilestone && health.daysUntilMilestone && (
        <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-purple-700 dark:text-purple-300">
              {health.daysUntilMilestone} day{health.daysUntilMilestone !== 1 ? 's' : ''} until {health.nextMilestone}-day milestone!
            </span>
          </div>
        </div>
      )}

      {/* Safe status message */}
      {health.riskLevel === 'safe' && health.currentStreak > 0 && (
        <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300">
            Streak is safe! Keep up the great work.
          </p>
        </div>
      )}
    </div>
  );
}
