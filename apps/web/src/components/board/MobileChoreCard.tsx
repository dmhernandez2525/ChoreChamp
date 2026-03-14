import { useCallback, useRef, useState } from 'react';
import { cn } from '@chorechamp/ui';
import { Check, Pencil, Trash2, Clock, Star } from 'lucide-react';
import type { Chore, Member } from '@chorechamp/types';

interface MobileChoreCardProps {
  chore: Chore;
  members?: Member[];
  onChoreClick?: () => void;
  onComplete?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const priorityBadge: Record<string, { bg: string; text: string; label: string }> = {
  urgent: { bg: 'bg-red-100', text: 'text-red-700', label: 'Urgent' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'High' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium' },
  low: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Low' },
};

const SWIPE_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 0.3;
const MAX_SWIPE = 200;

export function MobileChoreCard({
  chore,
  members,
  onChoreClick,
  onComplete,
  onEdit,
  onDelete,
}: MobileChoreCardProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const assignees = members?.filter((m) => chore.assignedTo.includes(m.id)) ?? [];
  const badge = priorityBadge[chore.priority];

  const dueDate = chore.startDate
    ? new Date(chore.startDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  const resetSwipe = useCallback(() => {
    setOffsetX(0);
    setIsRevealed(false);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
      isHorizontalSwipe.current = null;
      setIsSwiping(true);

      // If already revealed, reset starting point
      if (isRevealed) {
        touchStartX.current += MAX_SWIPE;
      }
    },
    [isRevealed],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isSwiping) return;

      const deltaX = touchStartX.current - e.touches[0].clientX;
      const deltaY = e.touches[0].clientY - touchStartY.current;

      // Determine swipe direction on first significant movement
      if (isHorizontalSwipe.current === null) {
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
          isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
        }
        return;
      }

      if (!isHorizontalSwipe.current) return;

      // Only allow left swipe (positive deltaX)
      const clampedOffset = Math.max(0, Math.min(MAX_SWIPE, deltaX));
      setOffsetX(clampedOffset);
    },
    [isSwiping],
  );

  const handleTouchEnd = useCallback(() => {
    setIsSwiping(false);
    isHorizontalSwipe.current = null;

    const elapsed = Date.now() - touchStartTime.current;
    const velocityX = offsetX / (elapsed / 1000);

    if (offsetX > SWIPE_THRESHOLD || velocityX > VELOCITY_THRESHOLD * 1000) {
      setOffsetX(MAX_SWIPE);
      setIsRevealed(true);
    } else {
      resetSwipe();
    }
  }, [offsetX, resetSwipe]);

  const handleAction = useCallback(
    (action?: () => void) => {
      resetSwipe();
      action?.();
    },
    [resetSwipe],
  );

  const handleCardClick = useCallback(() => {
    if (isRevealed) {
      resetSwipe();
      return;
    }
    onChoreClick?.();
  }, [isRevealed, resetSwipe, onChoreClick]);

  return (
    <div className="relative overflow-hidden rounded-xl lg:hidden" data-testid={`mobile-chore-card-${chore.id}`}>
      {/* Action buttons revealed on swipe */}
      <div className="absolute inset-y-0 right-0 flex items-stretch">
        <button
          onClick={() => handleAction(onComplete)}
          className="flex w-16 items-center justify-center bg-green-500 text-white active:bg-green-600"
          aria-label="Complete chore"
        >
          <Check className="h-5 w-5" />
        </button>
        <button
          onClick={() => handleAction(onEdit)}
          className="flex w-16 items-center justify-center bg-blue-500 text-white active:bg-blue-600"
          aria-label="Edit chore"
        >
          <Pencil className="h-5 w-5" />
        </button>
        <button
          onClick={() => handleAction(onDelete)}
          className="flex w-16 items-center justify-center bg-red-500 text-white active:bg-red-600"
          aria-label="Delete chore"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {/* Card content */}
      <div
        className={cn(
          'relative z-10 border border-gray-200 bg-white px-4 py-3',
          !isSwiping && 'transition-transform duration-200 ease-out',
        )}
        style={{ transform: `translateX(-${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        aria-label={`Chore: ${chore.title}`}
      >
        <div className="flex min-h-[44px] items-center gap-3">
          {/* Icon */}
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-lg">
            {chore.icon}
          </span>

          {/* Main content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-medium text-gray-900">
                {chore.title}
              </h3>
              {badge && (
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    badge.bg,
                    badge.text,
                  )}
                >
                  {badge.label}
                </span>
              )}
            </div>

            {/* Metadata row */}
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                {chore.pointValue}
              </span>

              {chore.estimatedMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {chore.estimatedMinutes}m
                </span>
              )}

              {dueDate && (
                <span className="text-gray-400">{dueDate}</span>
              )}
            </div>
          </div>

          {/* Assignee avatar */}
          {assignees.length > 0 && (
            <div className="flex shrink-0 items-center -space-x-1.5">
              {assignees.slice(0, 2).map((member) => (
                <span
                  key={member.id}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-violet-100 text-xs font-medium text-violet-700"
                  title={member.name || 'Member'}
                >
                  {(member.name || '?')[0].toUpperCase()}
                </span>
              ))}
              {assignees.length > 2 && (
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[10px] font-medium text-gray-500">
                  +{assignees.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
