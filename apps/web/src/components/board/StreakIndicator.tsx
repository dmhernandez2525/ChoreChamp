import { useState } from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@chorechamp/ui';

interface StreakIndicatorProps {
  streak: number;
  atRisk?: boolean;
  lastCompletedAt?: string;
  className?: string;
}

function getFlameSize(streak: number) {
  if (streak >= 30) return { icon: 'h-6 w-6', label: 'Blazing' };
  if (streak >= 14) return { icon: 'h-5 w-5', label: 'On fire' };
  if (streak >= 7) return { icon: 'h-4.5 w-4.5', label: 'Heating up' };
  return { icon: 'h-4 w-4', label: 'Warming up' };
}

function getFlameColor(streak: number, atRisk: boolean) {
  if (atRisk) return 'text-red-500';
  if (streak >= 30) return 'text-violet-500';
  if (streak >= 14) return 'text-orange-500';
  if (streak >= 7) return 'text-amber-500';
  return 'text-yellow-500';
}

export function StreakIndicator({
  streak,
  atRisk = false,
  lastCompletedAt,
  className,
}: StreakIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const flame = getFlameSize(streak);
  const color = getFlameColor(streak, atRisk);

  if (streak <= 0) return null;

  return (
    <div
      className={cn('relative inline-flex items-center gap-1', className)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      data-testid="streak-indicator"
    >
      <div
        className={cn(
          'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-all',
          atRisk
            ? 'animate-pulse-soft bg-red-50 text-red-700'
            : 'bg-orange-50 text-orange-700'
        )}
      >
        <Flame
          className={cn(
            flame.icon,
            color,
            'transition-all',
            streak >= 14 && 'drop-shadow-sm',
            streak >= 30 && 'drop-shadow-md'
          )}
        />
        <span>{streak}</span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className={cn(
            'absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap',
            'rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg'
          )}
          role="tooltip"
        >
          <div className="font-semibold text-gray-900">
            {streak}-day streak
          </div>
          <div className="mt-0.5 text-gray-500">{flame.label}</div>
          {atRisk && (
            <div className="mt-1 font-medium text-red-600">
              Complete a chore today to keep your streak!
            </div>
          )}
          {lastCompletedAt && (
            <div className="mt-1 text-gray-400">
              Last completed: {new Date(lastCompletedAt).toLocaleDateString()}
            </div>
          )}
          {/* Tooltip arrow */}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white" />
        </div>
      )}
    </div>
  );
}
