import { cn } from '@chorechamp/ui';
import type { ChoreCategory } from '@chorechamp/types';

const CATEGORIES: { value: ChoreCategory; label: string; icon: string }[] = [
  { value: 'kitchen', label: 'Kitchen', icon: '🍽️' },
  { value: 'bathroom', label: 'Bathroom', icon: '🚿' },
  { value: 'bedroom', label: 'Bedroom', icon: '🛏️' },
  { value: 'living_room', label: 'Living Room', icon: '🛋️' },
  { value: 'outdoor', label: 'Outdoor', icon: '🌳' },
  { value: 'pet_care', label: 'Pet Care', icon: '🐕' },
  { value: 'laundry', label: 'Laundry', icon: '🧺' },
  { value: 'general', label: 'General', icon: '🏠' },
];

interface CategoryPickerProps {
  value: ChoreCategory;
  onChange: (category: ChoreCategory) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => onChange(cat.value)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-colors',
              value === cat.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            )}
          >
            <span className="text-xl">{cat.icon}</span>
            <span className="text-xs">{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
