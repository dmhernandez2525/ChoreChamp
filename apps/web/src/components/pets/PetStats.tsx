import { cn } from '@chorechamp/ui';
import type { PetStats as PetStatsType } from '@chorechamp/types';

interface PetStatsProps {
  stats: PetStatsType;
  showLabels?: boolean;
  compact?: boolean;
  className?: string;
}

export function PetStats({ stats, showLabels = true, compact = false, className }: PetStatsProps) {
  const bars = [
    {
      label: 'Health',
      icon: '❤️',
      current: stats.health,
      max: stats.maxHealth,
      color: 'bg-red-500',
      bgColor: 'bg-red-100',
    },
    {
      label: 'Happiness',
      icon: '😊',
      current: stats.happiness,
      max: stats.maxHappiness,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-100',
    },
    {
      label: 'Energy',
      icon: '⚡',
      current: stats.energy,
      max: stats.maxEnergy,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
    },
  ];

  return (
    <div className={cn('space-y-2', className)}>
      {bars.map((bar) => {
        const percentage = Math.round((bar.current / bar.max) * 100);
        const isLow = percentage < 30;

        return (
          <div key={bar.label} className="space-y-1">
            {showLabels && (
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-1">
                  <span>{bar.icon}</span>
                  <span className="text-gray-600">{bar.label}</span>
                </span>
                <span className={cn(
                  'font-medium',
                  isLow ? 'text-red-600' : 'text-gray-700'
                )}>
                  {bar.current}/{bar.max}
                </span>
              </div>
            )}
            <div className={cn(
              'relative rounded-full overflow-hidden',
              bar.bgColor,
              compact ? 'h-2' : 'h-3'
            )}>
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  bar.color,
                  isLow && 'animate-pulse'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
