import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@chorechamp/ui';

interface LevelProgressBarProps {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  animate?: boolean;
  className?: string;
}

function getProgressColor(percent: number) {
  if (percent >= 90) return 'bg-violet-500';
  if (percent >= 70) return 'bg-blue-500';
  if (percent >= 40) return 'bg-emerald-500';
  return 'bg-gray-400';
}

function getGlowColor(percent: number) {
  if (percent >= 90) return 'shadow-violet-300';
  if (percent >= 70) return 'shadow-blue-300';
  return '';
}

export function LevelProgressBar({
  level,
  currentXp,
  nextLevelXp,
  animate = false,
  className,
}: LevelProgressBarProps) {
  const [displayPercent, setDisplayPercent] = useState(animate ? 0 : 0);
  const targetPercent = nextLevelXp > 0
    ? Math.min(Math.round((currentXp / nextLevelXp) * 100), 100)
    : 0;

  useEffect(() => {
    if (animate) {
      // Start from 0 and animate to target
      setDisplayPercent(0);
      const timer = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDisplayPercent(targetPercent);
        });
      });
      return () => cancelAnimationFrame(timer);
    }
    setDisplayPercent(targetPercent);
  }, [animate, targetPercent]);

  const barColor = getProgressColor(targetPercent);
  const glow = getGlowColor(targetPercent);

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      data-testid="level-progress-bar"
      role="progressbar"
      aria-valuenow={currentXp}
      aria-valuemin={0}
      aria-valuemax={nextLevelXp}
      aria-label={`Level ${level}, ${currentXp} of ${nextLevelXp} XP`}
    >
      {/* Level badge */}
      <div
        className={cn(
          'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full',
          'border-2 border-violet-300 bg-violet-100 text-xs font-bold text-violet-700'
        )}
        title={`Level ${level}`}
      >
        {level}
      </div>

      {/* Progress track */}
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700 ease-out',
              barColor,
              glow && `shadow-sm ${glow}`
            )}
            style={{ width: `${displayPercent}%` }}
          />
          {/* Shimmer effect near level-up */}
          {targetPercent >= 90 && (
            <div className="absolute inset-0 animate-shimmer rounded-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          )}
        </div>

        {/* XP label */}
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span className="flex items-center gap-0.5">
            <Zap className="h-2.5 w-2.5 text-yellow-500" />
            {currentXp.toLocaleString()} XP
          </span>
          <span>{nextLevelXp.toLocaleString()} XP</span>
        </div>
      </div>
    </div>
  );
}
