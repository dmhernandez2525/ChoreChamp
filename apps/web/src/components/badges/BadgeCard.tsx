import { cn } from '@chorechamp/ui';
import type { Badge } from '@chorechamp/types';
import { RARITY_COLORS, RARITY_LABELS, RARITY_TEXT_COLORS } from './badgeData';

interface BadgeCardProps {
  badge: Badge;
  earned?: boolean;
  earnedAt?: Date;
  progress?: number;
  onClick?: () => void;
}

export function BadgeCard({
  badge,
  earned = false,
  earnedAt,
  progress,
  onClick,
}: BadgeCardProps) {
  const showProgress = !earned && progress !== undefined && progress > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center rounded-xl border-2 p-4 transition-all',
        earned
          ? RARITY_COLORS[badge.rarity]
          : 'border-gray-200 bg-gray-100 opacity-50 grayscale',
        onClick && 'cursor-pointer hover:shadow-md',
        badge.isHidden && !earned && 'hidden'
      )}
    >
      {/* Badge Icon */}
      <div
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full text-4xl',
          earned ? 'bg-white shadow-sm' : 'bg-gray-200'
        )}
      >
        {badge.isHidden && !earned ? '❓' : badge.icon}
      </div>

      {/* Badge Name */}
      <h3 className={cn('mt-2 text-sm font-semibold', earned ? 'text-gray-900' : 'text-gray-500')}>
        {badge.isHidden && !earned ? '???' : badge.name}
      </h3>

      {/* Rarity */}
      <span className={cn('text-xs font-medium', RARITY_TEXT_COLORS[badge.rarity])}>
        {RARITY_LABELS[badge.rarity]}
      </span>

      {/* Progress bar */}
      {showProgress && (
        <div className="mt-2 w-full">
          <div className="h-1.5 w-full rounded-full bg-gray-300">
            <div
              className="h-1.5 rounded-full bg-blue-500"
              style={{ width: `${Math.min(progress * 100, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {Math.round(progress * 100)}%
          </p>
        </div>
      )}

      {/* Earned date */}
      {earned && earnedAt && (
        <p className="mt-1 text-xs text-gray-500">
          {new Date(earnedAt).toLocaleDateString()}
        </p>
      )}

      {/* Earned indicator */}
      {earned && (
        <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-sm">
          ✓
        </div>
      )}
    </button>
  );
}
