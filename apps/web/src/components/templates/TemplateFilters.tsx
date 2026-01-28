import { cn } from '@chorechamp/ui';
import type { ChoreCategory, Difficulty } from '@chorechamp/types';

interface TemplateFiltersProps {
  selectedCategory: ChoreCategory | 'all';
  selectedDifficulty: Difficulty | 'all';
  selectedAge: number | null;
  searchQuery: string;
  onCategoryChange: (category: ChoreCategory | 'all') => void;
  onDifficultyChange: (difficulty: Difficulty | 'all') => void;
  onAgeChange: (age: number | null) => void;
  onSearchChange: (query: string) => void;
}

const CATEGORIES: { value: ChoreCategory | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '📋' },
  { value: 'kitchen', label: 'Kitchen', icon: '🍽️' },
  { value: 'bathroom', label: 'Bathroom', icon: '🚿' },
  { value: 'bedroom', label: 'Bedroom', icon: '🛏️' },
  { value: 'living_room', label: 'Living Room', icon: '🛋️' },
  { value: 'outdoor', label: 'Outdoor', icon: '🌳' },
  { value: 'pet_care', label: 'Pet Care', icon: '🐕' },
  { value: 'laundry', label: 'Laundry', icon: '🧺' },
  { value: 'general', label: 'General', icon: '🏠' },
];

const DIFFICULTIES: { value: Difficulty | 'all'; label: string }[] = [
  { value: 'all', label: 'Any Difficulty' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const AGES = [
  { value: null, label: 'Any Age' },
  { value: 4, label: '4+ years' },
  { value: 6, label: '6+ years' },
  { value: 8, label: '8+ years' },
  { value: 10, label: '10+ years' },
  { value: 12, label: '12+ years' },
];

export function TemplateFilters({
  selectedCategory,
  selectedDifficulty,
  selectedAge,
  searchQuery,
  onCategoryChange,
  onDifficultyChange,
  onAgeChange,
  onSearchChange,
}: TemplateFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search templates..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Category chips */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors',
                selectedCategory === cat.value
                  ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty and Age filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label
            htmlFor="difficulty"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Difficulty
          </label>
          <select
            id="difficulty"
            value={selectedDifficulty}
            onChange={(e) =>
              onDifficultyChange(e.target.value as Difficulty | 'all')
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {DIFFICULTIES.map((diff) => (
              <option key={diff.value} value={diff.value}>
                {diff.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="age"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Age Appropriate
          </label>
          <select
            id="age"
            value={selectedAge ?? ''}
            onChange={(e) =>
              onAgeChange(e.target.value ? parseInt(e.target.value) : null)
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {AGES.map((age) => (
              <option key={age.value ?? 'any'} value={age.value ?? ''}>
                {age.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
