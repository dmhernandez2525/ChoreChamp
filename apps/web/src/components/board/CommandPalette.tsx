import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import {
  Search, LayoutGrid, Calendar, List, LayoutDashboard,
  Plus, Filter, Settings, Home, Users, Star, Zap,
} from 'lucide-react';
import { useBoardStore } from '@/stores/board-store';
import type { Chore, ChoreViewMode } from '@chorechamp/types';

interface CommandPaletteProps {
  chores?: Chore[];
  onNavigate?: (path: string) => void;
  onChoreClick?: (choreId: string) => void;
  onCreateChore?: () => void;
  onOpenFilters?: () => void;
}

export function CommandPalette({
  chores = [],
  onNavigate,
  onChoreClick,
  onCreateChore,
  onOpenFilters,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const { setViewMode } = useBoardStore();

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const runAction = useCallback((fn: () => void) => {
    fn();
    setOpen(false);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" data-testid="command-palette">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-[20%] w-full max-w-lg -translate-x-1/2">
        <Command
          className="rounded-xl border border-gray-200 bg-white shadow-2xl"
          label="Command palette"
        >
          <div className="flex items-center gap-2 border-b border-gray-200 px-4">
            <Search className="h-4 w-4 text-gray-400" />
            <Command.Input
              placeholder="Search chores, navigate, or run a command..."
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              autoFocus
            />
            <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-400">
              No results found.
            </Command.Empty>

            {/* Quick Actions */}
            <Command.Group heading="Actions" className="text-xs font-medium text-gray-500 px-2 py-1">
              {onCreateChore && (
                <Command.Item
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 aria-selected:bg-gray-100"
                  onSelect={() => runAction(onCreateChore)}
                >
                  <Plus className="h-4 w-4 text-green-500" />
                  Create New Chore
                </Command.Item>
              )}
              {onOpenFilters && (
                <Command.Item
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 aria-selected:bg-gray-100"
                  onSelect={() => runAction(onOpenFilters)}
                >
                  <Filter className="h-4 w-4 text-blue-500" />
                  Open Filters
                </Command.Item>
              )}
            </Command.Group>

            {/* View Switching */}
            <Command.Group heading="Views" className="text-xs font-medium text-gray-500 px-2 py-1">
              {[
                { mode: 'dashboard' as ChoreViewMode, icon: LayoutDashboard, label: 'Dashboard View' },
                { mode: 'kanban' as ChoreViewMode, icon: LayoutGrid, label: 'Kanban Board' },
                { mode: 'calendar' as ChoreViewMode, icon: Calendar, label: 'Calendar View' },
                { mode: 'list' as ChoreViewMode, icon: List, label: 'List View' },
              ].map(({ mode, icon: Icon, label }) => (
                <Command.Item
                  key={mode}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 aria-selected:bg-gray-100"
                  onSelect={() => runAction(() => setViewMode(mode))}
                >
                  <Icon className="h-4 w-4 text-violet-500" />
                  {label}
                </Command.Item>
              ))}
            </Command.Group>

            {/* Navigation */}
            <Command.Group heading="Navigate" className="text-xs font-medium text-gray-500 px-2 py-1">
              {[
                { path: '/dashboard', icon: Home, label: 'Go to Dashboard' },
                { path: '/members', icon: Users, label: 'Go to Members' },
                { path: '/rewards', icon: Star, label: 'Go to Rewards' },
                { path: '/settings', icon: Settings, label: 'Go to Settings' },
              ].map(({ path, icon: Icon, label }) => (
                <Command.Item
                  key={path}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 aria-selected:bg-gray-100"
                  onSelect={() => runAction(() => onNavigate?.(path))}
                >
                  <Icon className="h-4 w-4 text-gray-500" />
                  {label}
                </Command.Item>
              ))}
            </Command.Group>

            {/* Chore Search Results */}
            {chores.length > 0 && (
              <Command.Group heading="Chores" className="text-xs font-medium text-gray-500 px-2 py-1">
                {chores.slice(0, 10).map(chore => (
                  <Command.Item
                    key={chore.id}
                    value={`${chore.title} ${chore.category}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 aria-selected:bg-gray-100"
                    onSelect={() => runAction(() => onChoreClick?.(chore.id))}
                  >
                    <span className="text-lg">{chore.icon}</span>
                    <div className="flex-1">
                      <span className="font-medium">{chore.title}</span>
                      <span className="ml-2 text-xs text-gray-400 capitalize">{chore.category}</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-yellow-600">
                      <Zap className="h-3 w-3" />
                      {chore.pointValue}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
