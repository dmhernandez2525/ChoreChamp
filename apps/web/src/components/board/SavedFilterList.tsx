import { Bookmark, Trash2, Lock, Users, Check } from 'lucide-react';
import { cn } from '@chorechamp/ui';
import { useSavedFilters, useDeleteSavedFilter } from '@chorechamp/api-client';
import { useFilterStore } from '@/stores/filter-store';
import type { SavedFilterView } from '@chorechamp/types';

interface SavedFilterListProps {
  householdId: string;
  className?: string;
}

export function SavedFilterList({ householdId, className }: SavedFilterListProps) {
  const { data: rawFilters = [], isLoading } = useSavedFilters(householdId);
  const savedFilters = rawFilters as SavedFilterView[];
  const deleteFilter = useDeleteSavedFilter(householdId);
  const { activeFilterId, applyFilter, clearActiveFilter, setSavedFilters } = useFilterStore();

  // Sync saved filters to store
  if (savedFilters.length > 0) {
    const storeFilters = useFilterStore.getState().savedFilters;
    if (storeFilters.length !== savedFilters.length) {
      setSavedFilters(savedFilters);
    }
  }

  const handleApply = (filter: SavedFilterView) => {
    if (activeFilterId === filter.id) {
      clearActiveFilter();
    } else {
      applyFilter(filter.id);
    }
  };

  const handleDelete = (filterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteFilter.mutate(filterId);
  };

  if (isLoading) {
    return (
      <div className={cn('p-3', className)}>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
          Loading views...
        </div>
      </div>
    );
  }

  if (savedFilters.length === 0) {
    return (
      <div className={cn('p-3 text-center', className)}>
        <Bookmark className="mx-auto h-6 w-6 text-gray-300" />
        <p className="mt-1 text-xs text-gray-400">No saved views yet</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)} data-testid="saved-filter-list">
      <h4 className="px-2 text-xs font-semibold uppercase text-gray-500">Saved Views</h4>
      {savedFilters.map((filter: SavedFilterView) => {
        const isActive = activeFilterId === filter.id;
        return (
          <button
            key={filter.id}
            onClick={() => handleApply(filter)}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
              isActive
                ? 'bg-violet-50 text-violet-700'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            {isActive ? (
              <Check className="h-4 w-4 flex-shrink-0 text-violet-600" />
            ) : (
              <Bookmark className="h-4 w-4 flex-shrink-0 text-gray-400" />
            )}
            <span className="flex-1 truncate font-medium">{filter.name}</span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              {filter.visibility === 'private' ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Users className="h-3 w-3" />
              )}
              {filter.filters.length}
            </span>
            <button
              onClick={(e) => handleDelete(filter.id, e)}
              className="rounded p-0.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
              aria-label={`Delete ${filter.name}`}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </button>
        );
      })}
    </div>
  );
}
