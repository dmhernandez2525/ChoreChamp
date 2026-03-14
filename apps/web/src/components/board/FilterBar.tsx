import { X, Filter, Save } from 'lucide-react';
import { Button, cn } from '@chorechamp/ui';
import { useFilterStore } from '@/stores/filter-store';
import type { ChoreFilter } from '@chorechamp/types';

interface FilterBarProps {
  onSaveFilter?: () => void;
  onOpenFilterBuilder?: () => void;
}

function getFilterLabel(filter: ChoreFilter): string {
  const fieldLabels: Record<string, string> = {
    category: 'Category',
    priority: 'Priority',
    assignedTo: 'Assigned To',
    difficulty: 'Difficulty',
    dueTime: 'Due Time',
    pointValue: 'Points',
    startDate: 'Start Date',
    isActive: 'Active',
  };

  const operatorLabels: Record<string, string> = {
    equals: 'is',
    not_equals: 'is not',
    contains: 'contains',
    gt: '>',
    lt: '<',
    gte: '>=',
    lte: '<=',
    is_overdue: 'is overdue',
    is_today: 'is today',
    is_this_week: 'is this week',
    is_true: 'is true',
    is_false: 'is false',
    in: 'is one of',
  };

  const field = fieldLabels[filter.field] || filter.field;
  const op = operatorLabels[filter.operator] || filter.operator;
  const val = typeof filter.value === 'string' ? filter.value : JSON.stringify(filter.value);

  // For unary operators
  if (['is_overdue', 'is_today', 'is_this_week', 'is_true', 'is_false'].includes(filter.operator)) {
    return `${field} ${op}`;
  }

  return `${field} ${op} ${val}`;
}

export function FilterBar({ onSaveFilter, onOpenFilterBuilder }: FilterBarProps) {
  const { activeFilters, removeFilter, clearFilters, searchQuery, setSearchQuery, activeFilterId } = useFilterStore();

  if (activeFilters.length === 0 && !searchQuery) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2" data-testid="filter-bar">
      <Filter className="h-4 w-4 text-gray-400" />

      {/* Search chip */}
      {searchQuery && (
        <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
          Search: "{searchQuery}"
          <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {/* Filter chips */}
      {activeFilters.map((filter, index) => (
        <span
          key={index}
          className="flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700"
        >
          {getFilterLabel(filter)}
          <button onClick={() => removeFilter(index)} className="hover:text-violet-900">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      {/* Actions */}
      <div className="ml-auto flex items-center gap-1">
        {activeFilters.length > 0 && !activeFilterId && onSaveFilter && (
          <Button variant="ghost" size="sm" onClick={onSaveFilter}>
            <Save className="mr-1 h-3 w-3" />
            Save
          </Button>
        )}
        {onOpenFilterBuilder && (
          <Button variant="ghost" size="sm" onClick={onOpenFilterBuilder}>
            <Filter className="mr-1 h-3 w-3" />
            Add Filter
          </Button>
        )}
        {(activeFilters.length > 0 || searchQuery) && (
          <Button variant="ghost" size="sm" onClick={() => { clearFilters(); setSearchQuery(''); }}>
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
}
