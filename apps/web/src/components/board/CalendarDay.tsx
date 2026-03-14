import { useDroppable, useDraggable } from '@dnd-kit/core';
import { cn } from '@chorechamp/ui';
import type { Chore } from '@chorechamp/types';

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  chores: Chore[];
  onDateClick?: (date: Date) => void;
  onChoreClick?: (choreId: string) => void;
  enableDrag?: boolean;
}

function DraggableChoreChip({ chore, onChoreClick }: { chore: Chore; onChoreClick?: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: chore.id,
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium cursor-grab',
        'bg-violet-50 text-violet-700 hover:bg-violet-100',
        isDragging && 'opacity-30',
      )}
      onClick={(e) => {
        e.stopPropagation();
        onChoreClick?.(chore.id);
      }}
      title={chore.title}
    >
      {chore.icon} {chore.title}
    </button>
  );
}

const MAX_VISIBLE_CHORES = 3;

export function CalendarDay({
  date,
  isCurrentMonth,
  isToday,
  chores,
  onDateClick,
  onChoreClick,
  enableDrag,
}: CalendarDayProps) {
  const dateKey = date.toISOString().split('T')[0];
  const { setNodeRef, isOver } = useDroppable({ id: dateKey });
  const dayNumber = date.getDate();
  const hiddenCount = Math.max(0, chores.length - MAX_VISIBLE_CHORES);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[100px] border-b border-r border-gray-200 p-1 transition-colors',
        !isCurrentMonth && 'bg-gray-50',
        isOver && 'bg-blue-50 ring-2 ring-inset ring-blue-300',
      )}
      data-testid={`calendar-day-${dateKey}`}
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
          enableDrag ? (
            <DraggableChoreChip key={chore.id} chore={chore} onChoreClick={onChoreClick} />
          ) : (
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
          )
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
