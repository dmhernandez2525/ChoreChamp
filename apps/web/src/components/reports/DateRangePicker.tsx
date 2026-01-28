import { useState } from 'react';
import { Button, cn } from '@chorechamp/ui';

export type DatePreset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const presets: { id: DatePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'quarter', label: 'This Quarter' },
  { id: 'year', label: 'This Year' },
  { id: 'custom', label: 'Custom' },
];

function getPresetRange(preset: DatePreset): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { start: today, end: now };
    case 'week': {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return { start: weekStart, end: now };
    }
    case 'month': {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: monthStart, end: now };
    }
    case 'quarter': {
      const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
      const quarterStart = new Date(today.getFullYear(), quarterMonth, 1);
      return { start: quarterStart, end: now };
    }
    case 'year': {
      const yearStart = new Date(today.getFullYear(), 0, 1);
      return { start: yearStart, end: now };
    }
    default:
      return { start: today, end: now };
  }
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [activePreset, setActivePreset] = useState<DatePreset>('month');
  const [showCustom, setShowCustom] = useState(false);

  const handlePresetClick = (preset: DatePreset) => {
    setActivePreset(preset);
    if (preset === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onChange(getPresetRange(preset));
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.id}
            variant={activePreset === preset.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePresetClick(preset.id)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Custom date inputs */}
      {showCustom && (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={formatDateForInput(value.start)}
              onChange={(e) =>
                onChange({ ...value, start: new Date(e.target.value) })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={formatDateForInput(value.end)}
              onChange={(e) =>
                onChange({ ...value, end: new Date(e.target.value) })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Date range display */}
      <p className="text-sm text-gray-500">
        Showing data from{' '}
        <span className="font-medium text-gray-700">
          {value.start.toLocaleDateString()}
        </span>{' '}
        to{' '}
        <span className="font-medium text-gray-700">
          {value.end.toLocaleDateString()}
        </span>
      </p>
    </div>
  );
}
