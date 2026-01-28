import { cn } from '@chorechamp/ui';

interface StreakDisplayProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-3xl font-bold',
};

const iconSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-2xl',
};

function getStreakColor(streak: number): string {
  if (streak >= 30) return 'text-purple-600';
  if (streak >= 14) return 'text-orange-600';
  if (streak >= 7) return 'text-yellow-600';
  if (streak >= 3) return 'text-orange-500';
  return 'text-gray-500';
}

export function StreakDisplay({
  streak,
  size = 'md',
  showLabel = false,
  className,
}: StreakDisplayProps) {
  const color = getStreakColor(streak);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1',
        sizeStyles[size],
        color,
        className
      )}
    >
      <span className={cn(iconSizes[size], streak > 0 && 'animate-pulse')}>
        {streak > 0 ? '🔥' : '❄️'}
      </span>
      <span className="font-semibold tabular-nums">{streak}</span>
      {showLabel && <span className="text-gray-500 font-normal">days</span>}
    </div>
  );
}
