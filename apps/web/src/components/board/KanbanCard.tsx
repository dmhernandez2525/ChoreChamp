import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@chorechamp/ui';
import { Clock, Star, User, GripVertical } from 'lucide-react';
import type { Chore, Member } from '@chorechamp/types';
import { useSelectionStore } from '@/stores/selection-store';

interface KanbanCardProps {
  chore: Chore;
  members?: Member[];
  onClick?: () => void;
}

const priorityColors: Record<string, string> = {
  urgent: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-blue-300',
};

export function KanbanCard({ chore, members, onClick }: KanbanCardProps) {
  const { selectedIds, isBulkMode, toggle } = useSelectionStore();
  const isSelected = selectedIds.has(chore.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chore.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assignees = members?.filter(m =>
    chore.assignedTo.includes(m.id)
  ) ?? [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-lg border border-l-4 bg-white p-3 shadow-sm transition-shadow hover:shadow-md',
        priorityColors[chore.priority] || 'border-l-gray-300',
        isDragging && 'opacity-50 shadow-lg',
        isSelected && 'ring-2 ring-violet-500',
      )}
      data-testid={`kanban-card-${chore.id}`}
      onClick={(e) => {
        if (isBulkMode) {
          e.stopPropagation();
          toggle(chore.id);
          return;
        }
        onClick?.();
      }}
    >
      {/* Drag handle */}
      <button
        className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </button>

      {/* Bulk selection checkbox */}
      {isBulkMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggle(chore.id)}
          className="absolute right-2 top-2 h-4 w-4 rounded border-gray-300 text-violet-600"
          aria-label={`Select ${chore.title}`}
        />
      )}

      <div className="ml-4">
        {/* Title and icon */}
        <div className="flex items-center gap-2">
          <span className="text-lg">{chore.icon}</span>
          <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
            {chore.title}
          </h4>
        </div>

        {/* Metadata row */}
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
          {/* Points */}
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500" />
            {chore.pointValue}
          </span>

          {/* Estimated time */}
          {chore.estimatedMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {chore.estimatedMinutes}m
            </span>
          )}

          {/* Category */}
          <span className="rounded-full bg-gray-100 px-2 py-0.5 capitalize">
            {chore.category}
          </span>
        </div>

        {/* Assignees */}
        {assignees.length > 0 && (
          <div className="mt-2 flex items-center gap-1">
            {assignees.slice(0, 3).map(member => (
              <span
                key={member.id}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-medium text-violet-700"
                title={member.name || member.nickname || 'Member'}
              >
                {(member.name || member.nickname || '?')[0].toUpperCase()}
              </span>
            ))}
            {assignees.length > 3 && (
              <span className="text-xs text-gray-400">
                +{assignees.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Steps indicator */}
        {chore.steps && chore.steps.length > 0 && (
          <div className="mt-1 text-xs text-gray-400">
            {chore.steps.length} steps
          </div>
        )}
      </div>
    </div>
  );
}
