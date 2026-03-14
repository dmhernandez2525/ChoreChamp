import { cn } from '@chorechamp/ui';
import { LayoutGrid, Calendar, List, LayoutDashboard } from 'lucide-react';
import { useBoardStore } from '@/stores/board-store';
import type { ChoreViewMode } from '@chorechamp/types';

const views: Array<{ mode: ChoreViewMode; icon: typeof LayoutGrid; label: string }> = [
  { mode: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { mode: 'kanban', icon: LayoutGrid, label: 'Board' },
  { mode: 'calendar', icon: Calendar, label: 'Calendar' },
  { mode: 'list', icon: List, label: 'List' },
];

export function ViewSwitcher() {
  const { viewMode, setViewMode } = useBoardStore();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1" data-testid="view-switcher">
      {views.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            viewMode === mode
              ? 'bg-violet-100 text-violet-700'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          )}
          data-testid={`view-switcher-${mode}`}
          aria-pressed={viewMode === mode}
          aria-label={`Switch to ${label} view`}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
