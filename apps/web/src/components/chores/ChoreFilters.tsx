import { Button, cn } from '@chorechamp/ui';
import type { Member } from '@chorechamp/types';
import { useChoreStore, type ChoreFilter } from '../../stores/chore-store';

interface ChoreFiltersProps {
  members?: Member[];
  categories?: string[];
}

const statusOptions: { value: ChoreFilter['status']; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'To Do' },
  { value: 'completed', label: 'Done' },
  { value: 'needs-approval', label: 'Pending Approval' },
];

const sortOptions: { value: ChoreFilter['sortBy']; label: string }[] = [
  { value: 'dueTime', label: 'Due Time' },
  { value: 'points', label: 'Points' },
  { value: 'difficulty', label: 'Difficulty' },
  { value: 'name', label: 'Name' },
];

const categoryLabels: Record<string, string> = {
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  kitchen: 'Kitchen',
  'living-room': 'Living Room',
  outdoor: 'Outdoor',
  pets: 'Pets',
  laundry: 'Laundry',
  school: 'School',
  'self-care': 'Self-Care',
  helping: 'Helping',
  general: 'General',
};

export function ChoreFilters({ members, categories }: ChoreFiltersProps) {
  const { filters, setFilters, resetFilters } = useChoreStore();

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.assignee !== 'all' ||
    filters.category !== 'all';

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilters({ status: option.value })}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              filters.status === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Additional filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Assignee filter */}
        {members && members.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Assignee:</label>
            <select
              value={filters.assignee}
              onChange={(e) => setFilters({ assignee: e.target.value })}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Members</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Category filter */}
        {categories && categories.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ category: e.target.value })}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryLabels[cat] || cat}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Sort:</label>
          <select
            value={filters.sortBy}
            onChange={(e) =>
              setFilters({ sortBy: e.target.value as ChoreFilter['sortBy'] })
            }
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              setFilters({
                sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
              })
            }
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm hover:bg-gray-50"
            title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {filters.sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* Reset filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}

export function CompactChoreFilters({ members }: { members?: Member[] }) {
  const { filters, setFilters } = useChoreStore();

  return (
    <div className="flex items-center gap-2">
      <select
        value={filters.status}
        onChange={(e) =>
          setFilters({ status: e.target.value as ChoreFilter['status'] })
        }
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="all">All Statuses</option>
        <option value="pending">To Do</option>
        <option value="completed">Done</option>
        <option value="needs-approval">Pending Approval</option>
      </select>

      {members && members.length > 1 && (
        <select
          value={filters.assignee}
          onChange={(e) => setFilters({ assignee: e.target.value })}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Members</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
