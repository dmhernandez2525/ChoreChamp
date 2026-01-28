import { cn } from '@chorechamp/ui';

interface PointsDisplayProps {
  points: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
  animated?: boolean;
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

export function PointsDisplay({
  points,
  size = 'md',
  showIcon = true,
  showLabel = false,
  className,
  animated = false,
}: PointsDisplayProps) {
  const formattedPoints = points.toLocaleString();

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1',
        sizeStyles[size],
        animated && 'transition-all duration-300',
        className
      )}
    >
      {showIcon && <span className={iconSizes[size]}>⭐</span>}
      <span className="font-semibold tabular-nums">{formattedPoints}</span>
      {showLabel && <span className="text-gray-500 font-normal">points</span>}
    </div>
  );
}
