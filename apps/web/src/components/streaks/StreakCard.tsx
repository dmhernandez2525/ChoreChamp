import { cn } from '@chorechamp/ui';
import type { StreakData } from '@chorechamp/types';

interface StreakCardProps {
  streakData: StreakData;
  className?: string;
}

function getStreakGradient(streak: number): string {
  if (streak >= 30) return 'from-purple-500 to-pink-500';
  if (streak >= 14) return 'from-orange-500 to-red-500';
  if (streak >= 7) return 'from-yellow-500 to-orange-500';
  if (streak >= 3) return 'from-orange-400 to-yellow-400';
  return 'from-gray-400 to-gray-500';
}

function getStreakEmoji(streak: number): string {
  if (streak >= 100) return '👑';
  if (streak >= 30) return '🏆';
  if (streak >= 14) return '⚡';
  if (streak >= 7) return '🔥';
  if (streak >= 3) return '✨';
  if (streak > 0) return '🌱';
  return '❄️';
}

function getMotivationalMessage(streak: number): string {
  if (streak >= 100) return "You're a legend! Keep the crown!";
  if (streak >= 30) return "Incredible! A whole month strong!";
  if (streak >= 14) return "Two weeks! You're unstoppable!";
  if (streak >= 7) return "One week down! Amazing work!";
  if (streak >= 3) return "Three days in! Building momentum!";
  if (streak > 0) return "Great start! Keep it going!";
  return "Start your streak today!";
}

export function StreakCard({ streakData, className }: StreakCardProps) {
  const { current, longest, lastCompletedDate, freezesAvailable } = streakData;
  const gradient = getStreakGradient(current);
  const emoji = getStreakEmoji(current);
  const message = getMotivationalMessage(current);

  const isAtRisk = lastCompletedDate
    ? new Date().toDateString() !== new Date(lastCompletedDate).toDateString()
    : true;

  return (
    <div
      className={cn(
        'rounded-xl p-6 text-white shadow-lg',
        `bg-gradient-to-br ${gradient}`,
        className
      )}
    >
      {/* Main streak display */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">Current Streak</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-5xl font-bold tabular-nums">{current}</span>
            <span className="text-xl">days</span>
          </div>
        </div>
        <div className="text-6xl">{emoji}</div>
      </div>

      {/* Motivational message */}
      <p className="mt-4 text-sm text-white/90">{message}</p>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-white/20 pt-4">
        <div>
          <p className="text-xs text-white/70">Best Streak</p>
          <p className="text-lg font-semibold">{longest} days</p>
        </div>
        <div>
          <p className="text-xs text-white/70">Freezes</p>
          <p className="text-lg font-semibold">{freezesAvailable} ❄️</p>
        </div>
        <div>
          <p className="text-xs text-white/70">Status</p>
          <p className="text-lg font-semibold">
            {isAtRisk ? (
              <span className="text-yellow-200">⚠️ At Risk</span>
            ) : (
              <span className="text-green-200">✅ Safe</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
