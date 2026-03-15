import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  useReactTable,
  type SortingState,
  type GroupingState,
} from '@tanstack/react-table';
import { cn } from '@chorechamp/ui';
import { ArrowUpDown, ArrowUp, ArrowDown, Star, Clock } from 'lucide-react';
import type { Chore, ChorePriority, Member } from '@chorechamp/types';
import { useSelectionStore } from '@/stores/selection-store';
import { useBoardStore } from '@/stores/board-store';
import { InlineEditCell, InlineSelectCell } from './InlineEditCell';

interface ListViewProps {
  chores: Chore[];
  members?: Member[];
  onChoreClick?: (choreId: string) => void;
  onUpdateChore?: (choreId: string, field: string, value: string) => void;
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const priorityOrder: Record<ChorePriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const priorityBadge: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-blue-100 text-blue-700',
};

const columnHelper = createColumnHelper<Chore>();

export function ListView({ chores, members, onChoreClick, onUpdateChore }: ListViewProps) {
  const { selectedIds, toggle, selectAll, deselectAll } = useSelectionStore();
  const { groupBy } = useBoardStore();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [grouping, setGrouping] = useState<GroupingState>(
    groupBy ? [groupBy] : []
  );

  const memberMap = useMemo(() => {
    const map = new Map<string, Member>();
    members?.forEach(m => map.set(m.id, m));
    return map;
  }, [members]);

  const columns = useMemo(() => [
    // Selection checkbox
    columnHelper.display({
      id: 'select',
      header: () => (
        <input
          type="checkbox"
          checked={selectedIds.size === chores.length && chores.length > 0}
          onChange={() => {
            if (selectedIds.size === chores.length) {
              deselectAll();
            } else {
              selectAll(chores.map(c => c.id));
            }
          }}
          className="h-4 w-4 rounded border-gray-300 text-violet-600"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.original.id)}
          onChange={() => toggle(row.original.id)}
          className="h-4 w-4 rounded border-gray-300 text-violet-600"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      size: 40,
    }),

    // Chore title
    columnHelper.accessor('title', {
      header: 'Chore',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">{row.original.icon}</span>
          {onUpdateChore ? (
            <div onClick={(e) => e.stopPropagation()}>
              <InlineEditCell
                value={row.original.title}
                onSave={(val) => onUpdateChore(row.original.id, 'title', val)}
              />
            </div>
          ) : (
            <span className="font-medium text-gray-900">{row.original.title}</span>
          )}
        </div>
      ),
    }),

    // Priority
    columnHelper.accessor('priority', {
      header: 'Priority',
      cell: ({ getValue, row }) => {
        const priority = getValue();
        if (onUpdateChore) {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <InlineSelectCell
                value={priority}
                options={PRIORITY_OPTIONS}
                onSave={(val) => onUpdateChore(row.original.id, 'priority', val)}
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                  priorityBadge[priority] || 'bg-gray-100 text-gray-600'
                )}
              />
            </div>
          );
        }
        return (
          <span className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
            priorityBadge[priority] || 'bg-gray-100 text-gray-600'
          )}>
            {priority}
          </span>
        );
      },
      sortingFn: (a, b) =>
        (priorityOrder[a.original.priority] ?? 2) - (priorityOrder[b.original.priority] ?? 2),
    }),

    // Category
    columnHelper.accessor('category', {
      header: 'Category',
      cell: ({ getValue }) => (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize">
          {getValue()}
        </span>
      ),
    }),

    // Points
    columnHelper.accessor('pointValue', {
      header: 'Points',
      cell: ({ getValue }) => (
        <span className="flex items-center gap-1 text-sm">
          <Star className="h-3 w-3 text-yellow-500" />
          {getValue()}
        </span>
      ),
    }),

    // Estimated time
    columnHelper.accessor('estimatedMinutes', {
      header: 'Time',
      cell: ({ getValue }) => {
        const mins = getValue();
        if (!mins) return <span className="text-gray-400">-</span>;
        return (
          <span className="flex items-center gap-1 text-sm text-gray-600">
            <Clock className="h-3 w-3" />
            {mins}m
          </span>
        );
      },
    }),

    // Assignees
    columnHelper.accessor('assignedTo', {
      header: 'Assigned',
      cell: ({ getValue }) => {
        const ids = getValue();
        if (!ids || ids.length === 0) {
          return <span className="text-xs text-gray-400">Unassigned</span>;
        }
        return (
          <div className="flex items-center gap-1">
            {ids.slice(0, 3).map(id => {
              const member = memberMap.get(id);
              const initial = (member?.name || '?')[0].toUpperCase();
              return (
                <span
                  key={id}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-medium text-violet-700"
                  title={member?.name || id}
                >
                  {initial}
                </span>
              );
            })}
            {ids.length > 3 && (
              <span className="text-xs text-gray-400">+{ids.length - 3}</span>
            )}
          </div>
        );
      },
      enableSorting: false,
    }),

    // Due date
    columnHelper.accessor('startDate', {
      header: 'Due',
      cell: ({ getValue }) => {
        const date = getValue();
        if (!date) return <span className="text-gray-400">-</span>;
        return (
          <span className="text-sm text-gray-600">
            {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        );
      },
    }),
  ], [chores, memberMap, selectedIds, toggle, selectAll, deselectAll, onUpdateChore]);

  const table = useReactTable({
    data: chores,
    columns,
    state: { sorting, grouping },
    onSortingChange: setSorting,
    onGroupingChange: setGrouping,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200" data-testid="list-view">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} className="border-b bg-gray-50">
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className={cn(
                    'px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500',
                    header.column.getCanSort() && 'cursor-pointer select-none hover:text-gray-700',
                  )}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <span className="text-gray-400">
                        {header.column.getIsSorted() === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr
              key={row.id}
              className={cn(
                'border-b transition-colors hover:bg-gray-50',
                selectedIds.has(row.original.id) && 'bg-violet-50',
              )}
              onClick={() => onChoreClick?.(row.original.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChoreClick?.(row.original.id);
                }
              }}
            >
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-3 py-2 text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {chores.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-sm text-gray-400">
                No chores found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
