import type {
  SchoolSchedule,
  ClassPeriod,
  ActivitySchedule,
  ActivityEvent,
  DayOfWeek,
} from '@chorechamp/types';

interface WeeklyCalendarProps {
  weekStart: Date;
  schoolSchedules: SchoolSchedule[];
  classPeriods: ClassPeriod[];
  activitySchedules: ActivitySchedule[];
  events: ActivityEvent[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onEventClick?: (event: ActivityEvent) => void;
}

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 9 PM

const EVENT_TYPE_COLORS: Record<string, string> = {
  practice: '#22c55e',
  game: '#f59e0b',
  competition: '#ef4444',
  performance: '#8b5cf6',
  meeting: '#3b82f6',
  class: '#6366f1',
  volunteer: '#ec4899',
  other: '#6b7280',
};

export function WeeklyCalendar({
  weekStart,
  schoolSchedules,
  classPeriods,
  activitySchedules,
  events,
  onPrevWeek,
  onNextWeek,
  onEventClick,
}: WeeklyCalendarProps) {
  const formatWeekRange = () => {
    const start = new Date(weekStart);
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);

    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const getDateForDay = (dayIndex: number) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayIndex);
    return date;
  };

  const parseTime = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
  };

  const getEventsForDay = (dayIndex: number) => {
    const date = getDateForDay(dayIndex);
    const dateStr = date.toISOString().split('T')[0];

    return events.filter((event) => {
      const eventDate = new Date(event.eventDate).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const getRecurringForDay = (dayOfWeek: DayOfWeek) => {
    return activitySchedules.filter((schedule) => schedule.dayOfWeek === dayOfWeek);
  };

  const getClassesForDay = (dayOfWeek: DayOfWeek) => {
    return classPeriods.filter((period) => period.dayOfWeek === dayOfWeek);
  };

  const getSchoolBlocksForDay = (dayOfWeek: DayOfWeek) => {
    return schoolSchedules.filter(
      (schedule) => schedule.isActive && schedule.schoolDays.includes(dayOfWeek)
    );
  };

  const calculatePosition = (startTime: string, endTime: string | null) => {
    const start = parseTime(startTime);
    const end = endTime ? parseTime(endTime) : start + 1;
    const top = ((start - 6) / 16) * 100;
    const height = ((end - start) / 16) * 100;
    return { top: `${top}%`, height: `${Math.max(height, 3)}%` };
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onPrevWeek}
          className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-white"
        >
          \u2190 Prev
        </button>
        <h3 className="text-lg font-semibold text-white">{formatWeekRange()}</h3>
        <button
          onClick={onNextWeek}
          className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-white"
        >
          Next \u2192
        </button>
      </div>

      <div className="flex">
        {/* Time column */}
        <div className="w-16 flex-shrink-0 border-r">
          <div className="h-10 border-b" /> {/* Header space */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-12 border-b text-xs text-gray-500 pr-2 text-right"
            >
              {hour % 12 || 12} {hour < 12 ? 'AM' : 'PM'}
            </div>
          ))}
        </div>

        {/* Days columns */}
        <div className="flex-1 flex">
          {DAYS.map((day, dayIndex) => {
            const date = getDateForDay(dayIndex);
            const isToday = date.toDateString() === new Date().toDateString();
            const dayEvents = getEventsForDay(dayIndex);
            const recurring = getRecurringForDay(day);
            const classes = getClassesForDay(day);
            const schoolBlocks = getSchoolBlocksForDay(day);

            return (
              <div key={day} className="flex-1 border-r last:border-r-0 min-w-0">
                {/* Day header */}
                <div className={`h-10 border-b flex flex-col items-center justify-center ${
                  isToday ? 'bg-indigo-50' : ''
                }`}>
                  <span className="text-xs text-gray-500">{DAY_LABELS[dayIndex]}</span>
                  <span className={`text-sm font-medium ${isToday ? 'text-indigo-600' : 'text-gray-900'}`}>
                    {date.getDate()}
                  </span>
                </div>

                {/* Time slots */}
                <div className="relative" style={{ height: `${HOURS.length * 48}px` }}>
                  {/* Hour grid lines */}
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="absolute w-full border-b border-gray-100"
                      style={{ top: `${((hour - 6) / 16) * 100}%`, height: '6.25%' }}
                    />
                  ))}

                  {/* School blocks */}
                  {schoolBlocks.map((school) => {
                    const pos = calculatePosition(school.startTime, school.endTime);
                    return (
                      <div
                        key={school.id}
                        className="absolute left-0 right-0 mx-0.5 rounded-sm opacity-30"
                        style={{
                          ...pos,
                          backgroundColor: '#3b82f6',
                        }}
                      />
                    );
                  })}

                  {/* Class periods */}
                  {classes.map((cls) => {
                    const pos = calculatePosition(cls.startTime, cls.endTime);
                    return (
                      <div
                        key={cls.id}
                        className="absolute left-0 right-0 mx-0.5 rounded-sm px-1 overflow-hidden"
                        style={{
                          ...pos,
                          backgroundColor: cls.color || '#6366f1',
                          opacity: 0.8,
                        }}
                      >
                        <p className="text-white text-xs font-medium truncate">{cls.className}</p>
                      </div>
                    );
                  })}

                  {/* Recurring activity schedules */}
                  {recurring.map((schedule) => {
                    const pos = calculatePosition(schedule.startTime, schedule.endTime);
                    return (
                      <div
                        key={schedule.id}
                        className="absolute left-0 right-0 mx-0.5 rounded-sm px-1 overflow-hidden"
                        style={{
                          ...pos,
                          backgroundColor: EVENT_TYPE_COLORS[schedule.eventType] || '#6b7280',
                          opacity: 0.7,
                        }}
                      >
                        <p className="text-white text-xs truncate">{schedule.eventType}</p>
                      </div>
                    );
                  })}

                  {/* Events */}
                  {dayEvents.map((event) => {
                    const pos = calculatePosition(event.startTime, event.endTime || null);
                    return (
                      <div
                        key={event.id}
                        className="absolute left-0 right-0 mx-0.5 rounded-sm px-1 overflow-hidden cursor-pointer hover:opacity-90"
                        style={{
                          ...pos,
                          backgroundColor: EVENT_TYPE_COLORS[event.eventType] || '#6b7280',
                        }}
                        onClick={() => onEventClick?.(event)}
                      >
                        <p className="text-white text-xs font-medium truncate">{event.title}</p>
                        <p className="text-white/80 text-xs truncate">{formatTime(event.startTime)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t bg-gray-50">
        <p className="text-xs text-gray-500 mb-2">Legend:</p>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-sm bg-blue-500 opacity-30" />
            <span className="text-xs text-gray-600">School</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-sm bg-indigo-500 opacity-80" />
            <span className="text-xs text-gray-600">Class</span>
          </div>
          {Object.entries(EVENT_TYPE_COLORS).slice(0, 5).map(([type, color]) => (
            <div key={type} className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-600 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
