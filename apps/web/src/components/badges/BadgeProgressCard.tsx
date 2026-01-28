import { cn } from '@chorechamp/ui';
import type { Badge } from '@chorechamp/types';
import { RARITY_TEXT_COLORS, RARITY_LABELS } from './badgeData';

interface BadgeProgressCardProps {
  badge: Badge;
  current: number;
  target: number;
  onClick?: () => void;
}

export function BadgeProgressCard({
  badge,
  current,
  target,
  onClick,
}: BadgeProgressCardProps) {
  const progress = Math.min(current / target, 1);
  const remaining = Math.max(target - current, 0);

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 text-left transition-shadow',
        onClick && 'cursor-pointer hover:shadow-md'
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-3xl">
        {badge.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 truncate">{badge.name}</h3>
          <span className={cn('text-xs font-medium', RARITY_TEXT_COLORS[badge.rarity])}>
            {RARITY_LABELS[badge.rarity]}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate">{badge.description}</p>

        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{current} / {target}</span>
            <span>{remaining} more to go</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className={cn(
                'h-2 rounded-full transition-all',
                progress >= 1 ? 'bg-green-500' : 'bg-blue-500'
              )}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}
