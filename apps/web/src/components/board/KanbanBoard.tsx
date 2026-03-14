import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import type { Chore, Member } from '@chorechamp/types';
import { useBoardStore } from '@/stores/board-store';
import { useUndoStore } from '@/stores/undo-store';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

interface KanbanBoardProps {
  chores: Chore[];
  members?: Member[];
  onReorder?: (updates: Array<{ choreId: string; boardOrder: number }>) => void;
  onCardClick?: (choreId: string) => void;
  onAddChore?: (columnId: string) => void;
}

interface ColumnDef {
  id: string;
  title: string;
  color: string;
  filter: (chore: Chore) => boolean;
}

const priorityColumns: ColumnDef[] = [
  { id: 'urgent', title: 'Urgent', color: '#ef4444', filter: (c) => c.priority === 'urgent' },
  { id: 'high', title: 'High', color: '#f97316', filter: (c) => c.priority === 'high' },
  { id: 'medium', title: 'Medium', color: '#eab308', filter: (c) => c.priority === 'medium' },
  { id: 'low', title: 'Low', color: '#93c5fd', filter: (c) => c.priority === 'low' },
];

export function KanbanBoard({
  chores,
  members,
  onReorder,
  onCardClick,
  onAddChore,
}: KanbanBoardProps) {
  const { columnSettings } = useBoardStore();
  const { pushAction } = useUndoStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columns = useMemo(() => priorityColumns, []);

  // Group chores into columns
  const columnChores = useMemo(() => {
    const result: Record<string, Chore[]> = {};
    for (const col of columns) {
      result[col.id] = [];
    }

    for (const chore of chores) {
      const matchedCol = columns.find(col => col.filter(chore));
      const colId = matchedCol?.id || columns[columns.length - 1].id;
      result[colId].push(chore);
    }

    // Sort by boardOrder within each column
    for (const colId of Object.keys(result)) {
      result[colId].sort((a, b) => a.boardOrder - b.boardOrder);
    }

    return result;
  }, [chores, columns]);

  const activeChore = activeId ? chores.find(c => c.id === activeId) : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeChoreId = active.id as string;

    // Determine which column the item was dropped into.
    // over.id can be a column id (droppable) or another card id (sortable).
    let targetColId: string | undefined;
    let overItemId: string | undefined;

    const isColumnDrop = columns.some(col => col.id === over.id);
    if (isColumnDrop) {
      targetColId = over.id as string;
    } else {
      overItemId = over.id as string;
      targetColId = columns.find(col =>
        (columnChores[col.id] || []).some(c => c.id === overItemId)
      )?.id;
    }

    if (!targetColId) return;

    // Build a mutable copy of each column's chore list
    const mutableColumns: Record<string, string[]> = {};
    for (const col of columns) {
      mutableColumns[col.id] = (columnChores[col.id] || []).map(c => c.id);
    }

    // Find the source column and remove the active chore from it
    const sourceColId = columns.find(col =>
      mutableColumns[col.id].includes(activeChoreId)
    )?.id;

    if (!sourceColId) return;

    if (sourceColId === targetColId) {
      // Reorder within the same column
      const items = mutableColumns[sourceColId];
      const oldIndex = items.indexOf(activeChoreId);
      const newIndex = overItemId ? items.indexOf(overItemId) : items.length;
      if (oldIndex === newIndex) return;
      mutableColumns[sourceColId] = arrayMove(items, oldIndex, newIndex);
    } else {
      // Move across columns
      mutableColumns[sourceColId] = mutableColumns[sourceColId].filter(id => id !== activeChoreId);
      const targetItems = mutableColumns[targetColId];
      const insertIndex = overItemId ? targetItems.indexOf(overItemId) : targetItems.length;
      targetItems.splice(insertIndex, 0, activeChoreId);
    }

    // Compute new board orders across all columns
    const updates: Array<{ choreId: string; boardOrder: number }> = [];
    let order = 0;
    for (const col of columns) {
      for (const choreId of mutableColumns[col.id]) {
        updates.push({ choreId, boardOrder: order++ });
      }
    }

    // Save previous state for undo
    const previousOrders = chores.map(c => ({
      choreId: c.id,
      boardOrder: c.boardOrder,
    }));

    pushAction({
      type: 'reorder',
      description: 'Reorder chores',
      undoFn: async () => onReorder?.(previousOrders),
      redoFn: async () => onReorder?.(updates),
    });

    onReorder?.(updates);
  }, [chores, columns, columnChores, onReorder, pushAction]);

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Column highlighting is handled by useDroppable in KanbanColumn
  }, []);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" data-testid="kanban-board">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        {columns.map(col => {
          const settings = columnSettings[col.id];
          if (settings?.hidden) return null;

          return (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              chores={columnChores[col.id] || []}
              members={members}
              color={settings?.color || col.color}
              wipLimit={settings?.wipLimit}
              onCardClick={onCardClick}
              onAddChore={() => onAddChore?.(col.id)}
            />
          );
        })}

        <DragOverlay>
          {activeChore ? (
            <KanbanCard chore={activeChore} members={members} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
