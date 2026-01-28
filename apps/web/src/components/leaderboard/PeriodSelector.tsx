import { cn } from '@chorechamp/ui';

type Period = 'week' | 'month' | 'all';

interface PeriodSelectorProps {
  selected: Period;
  onChange: (period: Period) => void;
  className?: string;
}

const PERIODS: { value: Period; label: string }[] = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
];

export function PeriodSelector({ selected, onChange, className }: PeriodSelectorProps) {
  return (
    <div className={cn('flex rounded-lg bg-gray-100 p-1', className)}>
      {PERIODS.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={cn(
            'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
            selected === period.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
