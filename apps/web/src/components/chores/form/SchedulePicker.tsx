import { useState } from 'react';
import { cn } from '@chorechamp/ui';
import type { RecurrenceType } from '@chorechamp/types';

interface SchedulePickerProps {
  recurrenceType: RecurrenceType;
  recurrenceDays: number[];
  recurrenceInterval: number | null;
  recurrenceAfterDays: number | null;
  startDate: string;
  endDate: string | null;
  dueTime: string | null;
  onRecurrenceTypeChange: (type: RecurrenceType) => void;
  onRecurrenceDaysChange: (days: number[]) => void;
  onRecurrenceIntervalChange: (interval: number | null) => void;
  onRecurrenceAfterDaysChange: (days: number | null) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string | null) => void;
  onDueTimeChange: (time: string | null) => void;
}

const RECURRENCE_TYPES: { value: RecurrenceType; label: string; icon: string }[] = [
  { value: 'once', label: 'One time', icon: '1️⃣' },
  { value: 'daily', label: 'Daily', icon: '📅' },
  { value: 'weekly', label: 'Weekly', icon: '📆' },
  { value: 'monthly', label: 'Monthly', icon: '🗓️' },
  { value: 'after_completion', label: 'After completion', icon: '🔄' },
  { value: 'custom', label: 'Custom', icon: '⚙️' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', short: 'S' },
  { value: 1, label: 'Mon', short: 'M' },
  { value: 2, label: 'Tue', short: 'T' },
  { value: 3, label: 'Wed', short: 'W' },
  { value: 4, label: 'Thu', short: 'T' },
  { value: 5, label: 'Fri', short: 'F' },
  { value: 6, label: 'Sat', short: 'S' },
];

export function SchedulePicker({
  recurrenceType,
  recurrenceDays,
  recurrenceInterval,
  recurrenceAfterDays,
  startDate,
  endDate,
  dueTime,
  onRecurrenceTypeChange,
  onRecurrenceDaysChange,
  onRecurrenceIntervalChange,
  onRecurrenceAfterDaysChange,
  onStartDateChange,
  onEndDateChange,
  onDueTimeChange,
}: SchedulePickerProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleDay = (day: number) => {
    if (recurrenceDays.includes(day)) {
      onRecurrenceDaysChange(recurrenceDays.filter((d) => d !== day));
    } else {
      onRecurrenceDaysChange([...recurrenceDays, day].sort());
    }
  };

  return (
    <div className="space-y-4">
      {/* Recurrence Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How often?
        </label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {RECURRENCE_TYPES.map((rt) => (
            <button
              key={rt.value}
              type="button"
              onClick={() => onRecurrenceTypeChange(rt.value)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-colors',
                recurrenceType === rt.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              )}
            >
              <span className="text-lg">{rt.icon}</span>
              <span className="text-xs">{rt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Weekly day selection */}
      {(recurrenceType === 'weekly' || recurrenceType === 'custom') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            On which days?
          </label>
          <div className="flex gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors',
                  recurrenceDays.includes(day.value)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
                title={day.label}
              >
                {day.short}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom interval */}
      {recurrenceType === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Repeat every
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="365"
              value={recurrenceInterval || 1}
              onChange={(e) => onRecurrenceIntervalChange(parseInt(e.target.value) || 1)}
              className="w-20 rounded-md border border-gray-300 px-3 py-2 text-center"
            />
            <span className="text-gray-600">days</span>
          </div>
        </div>
      )}

      {/* After completion interval */}
      {recurrenceType === 'after_completion' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Days after completion
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="365"
              value={recurrenceAfterDays || 1}
              onChange={(e) =>
                onRecurrenceAfterDaysChange(parseInt(e.target.value) || 1)
              }
              className="w-20 rounded-md border border-gray-300 px-3 py-2 text-center"
            />
            <span className="text-gray-600">
              days after last completion
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Great for chores that need to be done periodically but not on a fixed schedule
          </p>
        </div>
      )}

      {/* Start Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Start Date
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      {/* Advanced options toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-blue-600 hover:underline"
      >
        {showAdvanced ? '− Hide advanced options' : '+ Show advanced options'}
      </button>

      {/* Advanced options */}
      {showAdvanced && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          {/* End Date */}
          {recurrenceType !== 'once' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date (optional)
              </label>
              <input
                type="date"
                value={endDate || ''}
                onChange={(e) => onEndDateChange(e.target.value || null)}
                min={startDate}
                className="rounded-md border border-gray-300 px-3 py-2"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave blank for no end date
              </p>
            </div>
          )}

          {/* Due Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Time (optional)
            </label>
            <input
              type="time"
              value={dueTime || ''}
              onChange={(e) => onDueTimeChange(e.target.value || null)}
              className="rounded-md border border-gray-300 px-3 py-2"
            />
            <p className="mt-1 text-xs text-gray-500">
              Set a specific time when the chore should be completed by
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
