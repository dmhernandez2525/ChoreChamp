import { useState } from 'react';
import type { SchoolSchedule, DayOfWeek } from '@chorechamp/types';

interface SchoolScheduleCardProps {
  schedule: SchoolSchedule;
  onEdit?: (schedule: SchoolSchedule) => void;
  onDelete?: (id: string) => void;
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

const ALL_DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function SchoolScheduleCard({ schedule, onEdit, onDelete }: SchoolScheduleCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{schedule.schoolName}</h3>
            <p className="text-blue-100 text-sm">
              {schedule.gradeLevel} - {schedule.schoolYear}
            </p>
          </div>
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            schedule.isActive ? 'bg-green-400 text-green-900' : 'bg-gray-300 text-gray-700'
          }`}>
            {schedule.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">&#128337;</span>
            <div>
              <p className="text-sm text-gray-500">School Hours</p>
              <p className="font-medium">
                {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
              </p>
            </div>
          </div>
          {schedule.lunchTime && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Lunch</p>
              <p className="font-medium">{formatTime(schedule.lunchTime)}</p>
            </div>
          )}
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">School Days</p>
          <div className="flex space-x-1">
            {ALL_DAYS.map((day) => (
              <div
                key={day}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium ${
                  schedule.schoolDays.includes(day)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {DAY_LABELS[day]}
              </div>
            ))}
          </div>
        </div>

        {schedule.breakTimes && schedule.breakTimes.length > 0 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-500 text-sm hover:underline mb-2"
          >
            {showDetails ? 'Hide' : 'Show'} break times ({schedule.breakTimes.length})
          </button>
        )}

        {showDetails && schedule.breakTimes && (
          <div className="bg-gray-50 rounded p-3 mb-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Break Times</p>
            {schedule.breakTimes.map((breakTime, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1">
                <span className="text-gray-600">{breakTime.name}</span>
                <span className="text-gray-800">
                  {formatTime(breakTime.startTime)} - {formatTime(breakTime.endTime)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
          {onEdit && (
            <button
              onClick={() => onEdit(schedule)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(schedule.id)}
              className="px-3 py-1 text-sm bg-red-50 hover:bg-red-100 rounded text-red-600"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
