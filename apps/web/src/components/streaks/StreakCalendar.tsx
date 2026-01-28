import { cn } from '@chorechamp/ui';

interface StreakCalendarProps {
  completedDates: string[];
  className?: string;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function StreakCalendar({ completedDates, className }: StreakCalendarProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  const completedSet = new Set(completedDates);

  const isCompleted = (day: number): boolean => {
    const date = new Date(currentYear, currentMonth, day);
    const dateString = date.toISOString().split('T')[0];
    return completedSet.has(dateString);
  };

  const isToday = (day: number): boolean => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isFuture = (day: number): boolean => {
    const date = new Date(currentYear, currentMonth, day);
    return date > today;
  };

  const monthName = today.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-4', className)}>
      <h3 className="text-center font-semibold text-gray-900 mb-4">{monthName}</h3>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before the first day of month */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="h-10" />
        ))}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const completed = isCompleted(day);
          const todayDay = isToday(day);
          const futureDay = isFuture(day);

          return (
            <div
              key={day}
              className={cn(
                'flex h-10 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                completed
                  ? 'bg-orange-500 text-white'
                  : todayDay
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                    : futureDay
                      ? 'bg-gray-50 text-gray-300'
                      : 'bg-gray-100 text-gray-600'
              )}
            >
              {completed ? '🔥' : day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-orange-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-blue-100 ring-1 ring-blue-500" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-gray-100" />
          <span>Missed</span>
        </div>
      </div>
    </div>
  );
}
