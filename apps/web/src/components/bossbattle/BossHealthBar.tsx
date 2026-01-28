import { cn } from '@chorechamp/ui';

interface BossHealthBarProps {
  current: number;
  max: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'h-2',
  md: 'h-4',
  lg: 'h-6',
};

function getHealthColor(percentage: number): string {
  if (percentage > 66) return 'bg-red-500';
  if (percentage > 33) return 'bg-yellow-500';
  return 'bg-green-500';
}

export function BossHealthBar({
  current,
  max,
  showLabel = true,
  size = 'md',
  className,
}: BossHealthBarProps) {
  const percentage = Math.max(0, Math.min((current / max) * 100, 100));
  const healthColor = getHealthColor(percentage);
  const damage = max - current;

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">Boss Health</span>
          <span className="text-gray-500">
            {current} / {max} HP
          </span>
        </div>
      )}

      <div className={cn('w-full rounded-full bg-gray-200 overflow-hidden', sizeStyles[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', healthColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {showLabel && damage > 0 && (
        <p className="text-xs text-green-600 font-medium">
          {damage} damage dealt! Keep going!
        </p>
      )}
    </div>
  );
}
