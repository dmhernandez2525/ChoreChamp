import { useState, useEffect } from 'react';
import { cn } from '@chorechamp/ui';

interface PointsBalanceCardProps {
  currentPoints: number;
  lifetimePoints: number;
  className?: string;
}

export function PointsBalanceCard({
  currentPoints,
  lifetimePoints,
  className,
}: PointsBalanceCardProps) {
  const [displayedPoints, setDisplayedPoints] = useState(currentPoints);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (currentPoints === displayedPoints) return;

    setIsAnimating(true);
    const startValue = displayedPoints;
    const endValue = currentPoints;
    const duration = 800;
    const steps = 20;
    const stepDuration = duration / steps;
    const increment = (endValue - startValue) / steps;

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= steps) {
        setDisplayedPoints(endValue);
        setIsAnimating(false);
        clearInterval(interval);
      } else {
        setDisplayedPoints(Math.round(startValue + increment * step));
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [currentPoints, displayedPoints]);

  return (
    <div
      className={cn(
        'rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 p-6 text-white shadow-lg',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-yellow-100">Available Points</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={cn(
                'text-4xl font-bold tabular-nums',
                isAnimating && 'animate-pulse'
              )}
            >
              {displayedPoints.toLocaleString()}
            </span>
            <span className="text-2xl">⭐</span>
          </div>
        </div>
        <div className="rounded-full bg-white/20 p-3">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      <div className="mt-4 border-t border-white/20 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-yellow-100">Lifetime Earned</span>
          <span className="font-semibold">{lifetimePoints.toLocaleString()} pts</span>
        </div>
      </div>
    </div>
  );
}
