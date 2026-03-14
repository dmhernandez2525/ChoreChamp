import { useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@chorechamp/ui';
import type { Chore } from '@chorechamp/types';
import { useBoardStore } from '@/stores/board-store';
import { CalendarDay } from './CalendarDay';

interface CalendarViewProps {
  chores: Chore[];
  onChoreClick?: (choreId: string) => void;
  onDateClick?: (date: Date) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Start from the Sunday before the first day
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  // End on the Saturday after the last day
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const days: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    days.push(day);
  }
  return days;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function CalendarView({ chores, onChoreClick, onDateClick }: CalendarViewProps) {
  const { calendarDate, calendarView, setCalendarDate, setCalendarView } = useBoardStore();
  const today = useMemo(() => new Date(), []);

  const days = useMemo(() => {
    if (calendarView === 'week') {
      return getWeekDays(calendarDate);
    }
    return getMonthDays(calendarDate.getFullYear(), calendarDate.getMonth());
  }, [calendarDate, calendarView]);

  // Group chores by their start date
  const choresByDate = useMemo(() => {
    const map: Record<string, Chore[]> = {};
    for (const chore of chores) {
      const key = chore.startDate;
      if (!map[key]) map[key] = [];
      map[key].push(chore);
    }
    return map;
  }, [chores]);

  const navigate = useCallback((direction: -1 | 1) => {
    const next = new Date(calendarDate);
    if (calendarView === 'week') {
      next.setDate(next.getDate() + direction * 7);
    } else {
      next.setMonth(next.getMonth() + direction);
    }
    setCalendarDate(next);
  }, [calendarDate, calendarView, setCalendarDate]);

  const goToToday = useCallback(() => {
    setCalendarDate(new Date());
  }, [setCalendarDate]);

  const monthYear = calendarDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div data-testid="calendar-view">
      {/* Calendar header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">{monthYear}</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Week/Month toggle */}
          <div className="flex rounded-lg border border-gray-200">
            <button
              className={`px-3 py-1 text-xs font-medium ${calendarView === 'week' ? 'bg-violet-100 text-violet-700' : 'text-gray-500'}`}
              onClick={() => setCalendarView('week')}
            >
              Week
            </button>
            <button
              className={`px-3 py-1 text-xs font-medium ${calendarView === 'month' ? 'bg-violet-100 text-violet-700' : 'text-gray-500'}`}
              onClick={() => setCalendarView('month')}
            >
              Month
            </button>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={() => navigate(-1)}
            className="rounded p-1 hover:bg-gray-100"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="rounded p-1 hover:bg-gray-100"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-l border-t border-gray-200">
        {WEEKDAYS.map(day => (
          <div
            key={day}
            className="border-b border-r border-gray-200 bg-gray-50 px-2 py-2 text-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}

        {/* Day cells */}
        {days.map(day => {
          const key = formatDateKey(day);
          const isCurrentMonth = day.getMonth() === calendarDate.getMonth();
          const isToday = formatDateKey(day) === formatDateKey(today);
          const dayChores = choresByDate[key] || [];

          return (
            <CalendarDay
              key={key}
              date={day}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday}
              chores={dayChores}
              onDateClick={onDateClick}
              onChoreClick={onChoreClick}
            />
          );
        })}
      </div>
    </div>
  );
}
