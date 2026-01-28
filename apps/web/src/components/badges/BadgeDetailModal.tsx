import { cn, Button } from '@chorechamp/ui';
import type { Badge } from '@chorechamp/types';
import { RARITY_LABELS } from './badgeData';

interface BadgeDetailModalProps {
  badge: Badge | null;
  earned?: boolean;
  earnedAt?: Date;
  progress?: number;
  progressCurrent?: number;
  progressTarget?: number;
  onClose: () => void;
}

export function BadgeDetailModal({
  badge,
  earned = false,
  earnedAt,
  progress,
  progressCurrent,
  progressTarget,
  onClose,
}: BadgeDetailModalProps) {
  if (!badge) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-xl bg-white shadow-xl overflow-hidden">
          {/* Header with gradient */}
          <div
            className={cn(
              'flex flex-col items-center py-8 px-6',
              earned
                ? badge.rarity === 'legendary'
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                  : badge.rarity === 'epic'
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                    : badge.rarity === 'rare'
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                      : 'bg-gradient-to-br from-gray-400 to-gray-500'
                : 'bg-gray-200'
            )}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white"
            >
              ✕
            </button>

            <div
              className={cn(
                'flex h-24 w-24 items-center justify-center rounded-full text-6xl',
                earned ? 'bg-white shadow-lg' : 'bg-gray-300'
              )}
            >
              {badge.isHidden && !earned ? '❓' : badge.icon}
            </div>

            <h2
              className={cn(
                'mt-4 text-2xl font-bold',
                earned ? 'text-white' : 'text-gray-600'
              )}
            >
              {badge.isHidden && !earned ? '???' : badge.name}
            </h2>

            <span
              className={cn(
                'mt-1 rounded-full px-3 py-1 text-sm font-medium',
                earned ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-600'
              )}
            >
              {RARITY_LABELS[badge.rarity]}
            </span>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-center text-gray-600">
              {badge.isHidden && !earned
                ? 'Complete a hidden challenge to unlock this badge!'
                : badge.description}
            </p>

            {earned && earnedAt && (
              <div className="text-center">
                <p className="text-sm text-gray-500">Earned on</p>
                <p className="font-medium text-gray-900">
                  {new Date(earnedAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}

            {!earned && progress !== undefined && progressCurrent !== undefined && progressTarget !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">
                    {progressCurrent} / {progressTarget}
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-200">
                  <div
                    className="h-3 rounded-full bg-blue-500 transition-all"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <p className="text-center text-sm text-gray-500">
                  {Math.round(progress * 100)}% complete
                </p>
              </div>
            )}

            {earned && (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                  ✓
                </span>
                <span className="font-medium">Badge Earned!</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-4">
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
