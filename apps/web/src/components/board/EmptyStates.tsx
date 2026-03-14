import { ClipboardList, FilterX, SearchX, Inbox } from 'lucide-react';
import { Button } from '@chorechamp/ui';

interface NoChoresEmptyProps {
  onCreateChore?: () => void;
}

export function NoChoresEmpty({ onCreateChore }: NoChoresEmptyProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4"
      data-testid="empty-no-chores"
    >
      <div className="flex flex-col items-center gap-4 max-w-sm text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <ClipboardList className="h-8 w-8 text-gray-400" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900">
            No chores yet
          </h3>
          <p className="text-sm text-gray-500">
            Get started by creating your first chore. You can organize them
            into categories, assign them to family members, and track progress.
          </p>
        </div>

        {onCreateChore && (
          <Button onClick={onCreateChore} className="mt-2">
            Create First Chore
          </Button>
        )}
      </div>
    </div>
  );
}

interface NoFilterResultsEmptyProps {
  onClearFilters?: () => void;
}

export function NoFilterResultsEmpty({
  onClearFilters,
}: NoFilterResultsEmptyProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4"
      data-testid="empty-no-filter-results"
    >
      <div className="flex flex-col items-center gap-4 max-w-sm text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
          <FilterX className="h-8 w-8 text-amber-500" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900">
            No chores match your filters
          </h3>
          <p className="text-sm text-gray-500">
            Try adjusting or clearing your filters to see more results.
          </p>
        </div>

        {onClearFilters && (
          <Button onClick={onClearFilters} variant="outline" className="mt-2">
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}

interface NoSearchResultsEmptyProps {
  query: string;
}

export function NoSearchResultsEmpty({ query }: NoSearchResultsEmptyProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4"
      data-testid="empty-no-search-results"
    >
      <div className="flex flex-col items-center gap-4 max-w-sm text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <SearchX className="h-8 w-8 text-blue-400" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900">
            No results for &ldquo;{query}&rdquo;
          </h3>
          <p className="text-sm text-gray-500">
            Try searching with different keywords or check for typos.
          </p>
        </div>
      </div>
    </div>
  );
}

interface EmptyColumnProps {
  columnName?: string;
  onAddChore?: () => void;
}

export function EmptyColumn({ columnName, onAddChore }: EmptyColumnProps) {
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-8 px-4 text-center"
      data-testid="empty-column"
    >
      <Inbox className="h-6 w-6 text-gray-300" />
      <p className="text-xs text-gray-400">
        No chores{columnName ? ` in ${columnName}` : ''}
      </p>
      {onAddChore && (
        <button
          type="button"
          onClick={onAddChore}
          className="text-xs font-medium text-blue-500 hover:text-blue-600"
        >
          + Add a chore
        </button>
      )}
    </div>
  );
}
