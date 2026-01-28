import { cn } from '@chorechamp/ui';
import type { Difficulty } from '@chorechamp/types';

interface DifficultyIndicatorProps {
  difficulty: Difficulty;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const DIFFICULTY_CONFIG = {
  easy: {
    label: 'Easy',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    bars: 1,
    barColor: 'bg-green-500',
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    bars: 2,
    barColor: 'bg-yellow-500',
  },
  hard: {
    label: 'Hard',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    bars: 3,
    barColor: 'bg-red-500',
  },
};

export function DifficultyIndicator({
  difficulty,
  showLabel = true,
  size = 'md',
}: DifficultyIndicatorProps) {
  const config = DIFFICULTY_CONFIG[difficulty];

  const sizeClasses = {
    sm: { bar: 'h-2 w-1', gap: 'gap-0.5', text: 'text-xs' },
    md: { bar: 'h-3 w-1.5', gap: 'gap-1', text: 'text-sm' },
    lg: { bar: 'h-4 w-2', gap: 'gap-1', text: 'text-base' },
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2 py-1',
        config.bgColor,
        sizeClasses[size].gap
      )}
    >
      {/* Bars */}
      <div className={cn('flex items-end', sizeClasses[size].gap)}>
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={cn(
              'rounded-sm transition-colors',
              sizeClasses[size].bar,
              bar <= config.bars ? config.barColor : 'bg-gray-300'
            )}
          />
        ))}
      </div>

      {/* Label */}
      {showLabel && (
        <span className={cn('font-medium', config.color, sizeClasses[size].text)}>
          {config.label}
        </span>
      )}
    </div>
  );
}

// Visual complexity meter for tasks
interface ComplexityMeterProps {
  steps: number;
  estimatedMinutes?: number;
  requiresPhoto?: boolean;
  requiresApproval?: boolean;
}

export function ComplexityMeter({
  steps,
  estimatedMinutes,
  requiresPhoto,
  requiresApproval,
}: ComplexityMeterProps) {
  // Calculate complexity score
  let score = 0;
  score += Math.min(steps, 5); // Up to 5 points for steps
  if (estimatedMinutes) {
    score += Math.min(Math.floor(estimatedMinutes / 10), 3); // Up to 3 points for time
  }
  if (requiresPhoto) score += 1;
  if (requiresApproval) score += 1;

  const maxScore = 10;
  const percentage = (score / maxScore) * 100;

  const getColor = () => {
    if (percentage <= 30) return 'bg-green-500';
    if (percentage <= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLabel = () => {
    if (percentage <= 30) return 'Simple';
    if (percentage <= 60) return 'Moderate';
    return 'Complex';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">Task Complexity</span>
        <span className="font-medium">{getLabel()}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn('h-full rounded-full transition-all', getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
