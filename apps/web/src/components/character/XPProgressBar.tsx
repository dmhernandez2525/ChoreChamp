import { cn } from '@chorechamp/ui';

interface XPProgressBarProps {
  currentXP: number;
  xpNeeded: number;
  level: number;
  showNumbers?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function XPProgressBar({
  currentXP,
  xpNeeded,
  level,
  showNumbers = true,
  size = 'md',
  className,
}: XPProgressBarProps) {
  const percentage = Math.min(100, Math.floor((currentXP / xpNeeded) * 100));

  const sizeClasses = {
    sm: { bar: 'h-2', text: 'text-xs' },
    md: { bar: 'h-3', text: 'text-sm' },
    lg: { bar: 'h-4', text: 'text-base' },
  };

  // Color based on level tiers
  const getBarColor = (level: number) => {
    if (level >= 100) return 'bg-gradient-to-r from-amber-400 to-yellow-500'; // Legendary
    if (level >= 75) return 'bg-gradient-to-r from-purple-500 to-pink-500'; // Epic
    if (level >= 50) return 'bg-gradient-to-r from-blue-500 to-cyan-500'; // Rare
    if (level >= 25) return 'bg-gradient-to-r from-green-500 to-emerald-500'; // Uncommon
    return 'bg-blue-500'; // Common
  };

  return (
    <div className={cn('w-full', className)}>
      {showNumbers && (
        <div className={cn('flex justify-between mb-1', sizeClasses[size].text)}>
          <span className="text-gray-600">
            Level {level}
          </span>
          <span className="text-gray-500">
            {currentXP.toLocaleString()} / {xpNeeded.toLocaleString()} XP
          </span>
        </div>
      )}

      <div className={cn('w-full rounded-full bg-gray-200 overflow-hidden', sizeClasses[size].bar)}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            getBarColor(level)
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {showNumbers && (
        <div className={cn('text-right mt-0.5', sizeClasses[size].text)}>
          <span className="text-gray-400">{percentage}%</span>
        </div>
      )}
    </div>
  );
}
