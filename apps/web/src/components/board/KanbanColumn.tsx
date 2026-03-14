import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@chorechamp/ui';
import { Plus } from 'lucide-react';
import type { Chore, Member } from '@chorechamp/types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  id: string;
  title: string;
  chores: Chore[];
  members?: Member[];
  color?: string;
  wipLimit?: number;
  onCardClick?: (choreId: string) => void;
  onAddChore?: () => void;
}

export function KanbanColumn({
  id,
  title,
  chores,
  members,
  color,
  wipLimit,
  onCardClick,
  onAddChore,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const isOverLimit = wipLimit ? chores.length > wipLimit : false;

  return (
    <div
      className={cn(
        'flex w-72 flex-shrink-0 flex-col rounded-lg bg-gray-50',
        isOver && 'ring-2 ring-violet-300',
      )}
      data-testid={`kanban-column-${id}`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          {color && (
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: color }}
            />
          )}
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          <span className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            isOverLimit
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-200 text-gray-600'
          )}>
            {chores.length}
            {wipLimit && `/${wipLimit}`}
          </span>
        </div>
        {onAddChore && (
          <button
            onClick={onAddChore}
            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            aria-label={`Add chore to ${title}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto p-2"
      >
        <SortableContext
          items={chores.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {chores.map(chore => (
            <KanbanCard
              key={chore.id}
              chore={chore}
              members={members}
              onClick={() => onCardClick?.(chore.id)}
            />
          ))}
        </SortableContext>

        {chores.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-4">
            <p className="text-sm text-gray-400">No chores</p>
          </div>
        )}
      </div>
    </div>
  );
}
