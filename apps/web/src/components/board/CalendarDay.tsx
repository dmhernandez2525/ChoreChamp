import { cn } from '@chorechamp/ui';
import type { Chore } from '@chorechamp/types';

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  chores: Chore[];
  onDateClick?: (date: Date) => void;
  onChoreClick?: (choreId: string) => void;
}

const MAX_VISIBLE_CHORES = 3;

export function CalendarDay({
  date,
  isCurrentMonth,
  isToday,
  chores,
  onDateClick,
  onChoreClick,
}: CalendarDayProps) {
  const dayNumber = date.getDate();
  const hiddenCount = Math.max(0, chores.length - MAX_VISIBLE_CHORES);

  return (
    <div
      className={cn(
        'min-h-[100px] border-b border-r border-gray-200 p-1',
        !isCurrentMonth && 'bg-gray-50',
      )}
      data-testid={`calendar-day-${date.toISOString().split('T')[0]}`}
      onClick={() => onDateClick?.(date)}
    >
      {/* Day number */}
      <div className="flex items-center justify-between px-1">
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
            isToday && 'bg-violet-600 text-white',
            !isToday && isCurrentMonth && 'text-gray-900',
            !isToday && !isCurrentMonth && 'text-gray-400',
          )}
        >
          {dayNumber}
        </span>
        {chores.length > 0 && (
          <span className="text-[10px] text-gray-400">{chores.length}</span>
        )}
      </div>

      {/* Chore pills */}
      <div className="mt-1 space-y-0.5">
        {chores.slice(0, MAX_VISIBLE_CHORES).map(chore => (
          <button
            key={chore.id}
            className={cn(
              'block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium',
              'bg-violet-50 text-violet-700 hover:bg-violet-100',
            )}
            onClick={(e) => {
              e.stopPropagation();
              onChoreClick?.(chore.id);
            }}
            title={chore.title}
          >
            {chore.icon} {chore.title}
          </button>
        ))}
        {hiddenCount > 0 && (
          <button
            className="w-full text-center text-[10px] text-gray-500 hover:text-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              onDateClick?.(date);
            }}
          >
            +{hiddenCount} more
          </button>
        )}
      </div>
    </div>
  );
}
