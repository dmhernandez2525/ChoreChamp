import { cn } from '@chorechamp/ui';
import type { CharacterStats, CharacterStat } from '@chorechamp/types';

interface StatsDisplayProps {
  stats: CharacterStats;
  statPointsAvailable: number;
  onAllocate?: (stat: CharacterStat, points: number) => void;
  isAllocating?: boolean;
  maxStatValue?: number;
}

const STAT_INFO: Record<
  CharacterStat,
  { label: string; icon: string; color: string; description: string }
> = {
  speed: {
    label: 'Speed',
    icon: '⚡',
    color: 'blue',
    description: 'Bonus XP for completing chores quickly',
  },
  quality: {
    label: 'Quality',
    icon: '✨',
    color: 'purple',
    description: 'Bonus points for photo proof and detailed completions',
  },
  consistency: {
    label: 'Consistency',
    icon: '🔥',
    color: 'orange',
    description: 'Enhanced streak bonuses and protection',
  },
  teamwork: {
    label: 'Teamwork',
    icon: '🤝',
    color: 'green',
    description: 'Bonus for family goals and helping others',
  },
};

const STAT_ORDER: CharacterStat[] = ['speed', 'quality', 'consistency', 'teamwork'];

export function StatsDisplay({
  stats,
  statPointsAvailable,
  onAllocate,
  isAllocating = false,
  maxStatValue = 100,
}: StatsDisplayProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return { bar: 'bg-blue-500', bg: 'bg-blue-100', text: 'text-blue-700' };
      case 'purple':
        return { bar: 'bg-purple-500', bg: 'bg-purple-100', text: 'text-purple-700' };
      case 'orange':
        return { bar: 'bg-orange-500', bg: 'bg-orange-100', text: 'text-orange-700' };
      case 'green':
        return { bar: 'bg-green-500', bg: 'bg-green-100', text: 'text-green-700' };
      default:
        return { bar: 'bg-gray-500', bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Available Points */}
      {statPointsAvailable > 0 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <span className="text-2xl">✨</span>
          <div>
            <p className="font-medium text-yellow-800">
              {statPointsAvailable} stat point{statPointsAvailable !== 1 ? 's' : ''} available!
            </p>
            <p className="text-sm text-yellow-600">
              Click + to allocate points to your stats
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="space-y-3">
        {STAT_ORDER.map((stat) => {
          const info = STAT_INFO[stat];
          const value = stats[stat];
          const percentage = Math.min(100, (value / maxStatValue) * 100);
          const colors = getColorClasses(info.color);
          const canAllocate = onAllocate && statPointsAvailable > 0 && value < maxStatValue;

          return (
            <div key={stat} className="group">
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{info.icon}</span>
                  <span className={cn('font-medium', colors.text)}>{info.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-700">{value}</span>
                  {canAllocate && (
                    <button
                      onClick={() => onAllocate(stat, 1)}
                      disabled={isAllocating}
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-white text-sm font-bold transition-all',
                        isAllocating
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600 hover:scale-110'
                      )}
                    >
                      +
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-3 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-300', colors.bar)}
                  style={{ width: `${percentage}%` }}
                />
                {/* Segment markers */}
                <div className="absolute inset-0 flex">
                  {[25, 50, 75].map((mark) => (
                    <div
                      key={mark}
                      className="absolute h-full w-px bg-white/30"
                      style={{ left: `${mark}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Description - shows on hover */}
              <p className="text-xs text-gray-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {info.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Bonus Calculations */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Bonuses</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Speed Bonus:</span>
            <span className="font-medium text-blue-600">+{(stats.speed * 0.5).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Quality Bonus:</span>
            <span className="font-medium text-purple-600">+{(stats.quality * 0.5).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Streak Bonus:</span>
            <span className="font-medium text-orange-600">+{(stats.consistency * 0.5).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Team Bonus:</span>
            <span className="font-medium text-green-600">+{(stats.teamwork * 0.5).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
