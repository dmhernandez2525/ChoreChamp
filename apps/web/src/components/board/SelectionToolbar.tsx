import { UserPlus, Calendar, Trash2, Tag, Flag, X } from 'lucide-react';
import { Button } from '@chorechamp/ui';
import { useSelectionStore } from '@/stores/selection-store';

interface SelectionToolbarProps {
  onBulkAssign?: () => void;
  onBulkReschedule?: () => void;
  onBulkChangePriority?: () => void;
  onBulkChangeCategory?: () => void;
  onBulkDelete?: () => void;
}

export function SelectionToolbar({
  onBulkAssign,
  onBulkReschedule,
  onBulkChangePriority,
  onBulkChangeCategory,
  onBulkDelete,
}: SelectionToolbarProps) {
  const { selectedIds, deselectAll, isBulkMode } = useSelectionStore();

  if (!isBulkMode || selectedIds.size === 0) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-xl"
      data-testid="selection-toolbar"
      role="toolbar"
      aria-label="Bulk actions"
    >
      <span className="text-sm font-medium text-gray-700">
        {selectedIds.size} selected
      </span>

      <div className="mx-2 h-5 w-px bg-gray-200" />

      {onBulkAssign && (
        <Button variant="ghost" size="sm" onClick={onBulkAssign}>
          <UserPlus className="mr-1 h-4 w-4" />
          Assign
        </Button>
      )}

      {onBulkChangePriority && (
        <Button variant="ghost" size="sm" onClick={onBulkChangePriority}>
          <Flag className="mr-1 h-4 w-4" />
          Priority
        </Button>
      )}

      {onBulkChangeCategory && (
        <Button variant="ghost" size="sm" onClick={onBulkChangeCategory}>
          <Tag className="mr-1 h-4 w-4" />
          Category
        </Button>
      )}

      {onBulkReschedule && (
        <Button variant="ghost" size="sm" onClick={onBulkReschedule}>
          <Calendar className="mr-1 h-4 w-4" />
          Reschedule
        </Button>
      )}

      <div className="mx-2 h-5 w-px bg-gray-200" />

      {onBulkDelete && (
        <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={onBulkDelete}>
          <Trash2 className="mr-1 h-4 w-4" />
          Delete
        </Button>
      )}

      <button
        onClick={deselectAll}
        className="ml-1 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        aria-label="Clear selection"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
