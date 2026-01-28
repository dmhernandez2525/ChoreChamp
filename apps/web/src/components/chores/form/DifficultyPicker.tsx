import { cn } from '@chorechamp/ui';
import type { Difficulty } from '@chorechamp/types';

const DIFFICULTIES: {
  value: Difficulty;
  label: string;
  description: string;
  color: string;
  defaultPoints: number;
}[] = [
  {
    value: 'easy',
    label: 'Easy',
    description: 'Quick tasks under 10 minutes',
    color: 'bg-green-100 border-green-300 text-green-700',
    defaultPoints: 5,
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Standard tasks 10-30 minutes',
    color: 'bg-yellow-100 border-yellow-300 text-yellow-700',
    defaultPoints: 10,
  },
  {
    value: 'hard',
    label: 'Hard',
    description: 'Longer tasks 30+ minutes',
    color: 'bg-red-100 border-red-300 text-red-700',
    defaultPoints: 20,
  },
];

interface DifficultyPickerProps {
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
  onPointsChange?: (points: number) => void;
}

export function DifficultyPicker({
  value,
  onChange,
  onPointsChange,
}: DifficultyPickerProps) {
  const handleChange = (difficulty: Difficulty) => {
    onChange(difficulty);
    if (onPointsChange) {
      const selected = DIFFICULTIES.find((d) => d.value === difficulty);
      if (selected) {
        onPointsChange(selected.defaultPoints);
      }
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
      <div className="grid grid-cols-3 gap-3">
        {DIFFICULTIES.map((diff) => (
          <button
            key={diff.value}
            type="button"
            onClick={() => handleChange(diff.value)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-center transition-all',
              value === diff.value
                ? `${diff.color} ring-2 ring-offset-1`
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            )}
          >
            <span className="font-medium">{diff.label}</span>
            <span className="text-xs opacity-75">{diff.description}</span>
            <span className="mt-1 text-xs font-medium">
              ~{diff.defaultPoints} points
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
