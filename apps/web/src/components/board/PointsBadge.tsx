import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@chorechamp/ui';

interface PointsBadgeProps {
  points: number;
  variant?: 'compact' | 'expanded';
  animate?: boolean;
  className?: string;
}

const tierConfig = {
  bronze: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
    icon: 'text-amber-500',
    glow: 'shadow-amber-200',
  },
  silver: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    icon: 'text-gray-400',
    glow: 'shadow-gray-200',
  },
  gold: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-400',
    icon: 'text-yellow-500',
    glow: 'shadow-yellow-200',
  },
} as const;

function getTier(points: number): keyof typeof tierConfig {
  if (points >= 25) return 'gold';
  if (points >= 10) return 'silver';
  return 'bronze';
}

export function PointsBadge({
  points,
  variant = 'compact',
  animate = false,
  className,
}: PointsBadgeProps) {
  const [isBouncing, setIsBouncing] = useState(false);
  const tier = getTier(points);
  const colors = tierConfig[tier];

  useEffect(() => {
    if (animate) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 600);
      return () => clearTimeout(timer);
    }
  }, [animate, points]);

  if (variant === 'compact') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs font-medium transition-transform',
          colors.bg,
          colors.text,
          colors.border,
          isBouncing && 'animate-bounce-scale',
          className
        )}
        data-testid="points-badge"
        aria-label={`${points} points`}
      >
        <Star className={cn('h-3 w-3', colors.icon)} />
        {points}
      </span>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 font-medium transition-transform',
        colors.bg,
        colors.text,
        colors.border,
        isBouncing && 'animate-bounce-scale',
        className
      )}
      data-testid="points-badge"
      aria-label={`${points} points`}
    >
      <Star className={cn('h-4 w-4', colors.icon)} />
      <span className="text-sm">{points}</span>
      <span className="text-xs opacity-70">pts</span>
    </div>
  );
}
