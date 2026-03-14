import { cn } from '@chorechamp/ui';
import {
  LayoutGrid,
  Calendar,
  Filter,
  Plus,
  MoreHorizontal,
} from 'lucide-react';

type MobileTab = 'board' | 'calendar' | 'filters' | 'add' | 'more';

interface MobileNavBarProps {
  activeTab?: MobileTab;
  onViewChange?: (view: 'board' | 'calendar') => void;
  onShowFilters?: () => void;
  onCreateChore?: () => void;
  onShowMore?: () => void;
}

const tabs: Array<{
  id: MobileTab;
  label: string;
  icon: typeof LayoutGrid;
  isAction?: boolean;
}> = [
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'add', label: 'Add', icon: Plus, isAction: true },
  { id: 'filters', label: 'Filters', icon: Filter },
  { id: 'more', label: 'More', icon: MoreHorizontal },
];

export function MobileNavBar({
  activeTab = 'board',
  onViewChange,
  onShowFilters,
  onCreateChore,
  onShowMore,
}: MobileNavBarProps) {
  const handleTabPress = (tab: MobileTab) => {
    switch (tab) {
      case 'board':
        onViewChange?.('board');
        break;
      case 'calendar':
        onViewChange?.('calendar');
        break;
      case 'filters':
        onShowFilters?.();
        break;
      case 'add':
        onCreateChore?.();
        break;
      case 'more':
        onShowMore?.();
        break;
    }
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white pb-safe lg:hidden"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isAction) {
            return (
              <button
                key={tab.id}
                onClick={() => handleTabPress(tab.id)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg active:bg-violet-700"
                aria-label={tab.label}
              >
                <Icon className="h-6 w-6" />
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => handleTabPress(tab.id)}
              className={cn(
                'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1 transition-colors',
                isActive
                  ? 'text-violet-600'
                  : 'text-gray-500 active:text-gray-700',
              )}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  'h-5 w-5',
                  isActive && 'stroke-[2.5]',
                )}
              />
              <span
                className={cn(
                  'text-[10px] leading-tight',
                  isActive ? 'font-semibold' : 'font-medium',
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
