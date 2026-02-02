import type { ScreenTimeLimit } from '@chorechamp/types';

interface ScreenTimeLimitCardProps {
  limit: ScreenTimeLimit;
  memberName?: string;
  onEdit?: (limit: ScreenTimeLimit) => void;
  onToggle?: (limitId: string, enabled: boolean) => void;
}

export function ScreenTimeLimitCard({
  limit,
  memberName,
  onEdit,
  onToggle,
}: ScreenTimeLimitCardProps) {
  const formatMinutes = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (time: string | null) => {
    if (!time) return '-';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${
      !limit.isEnabled ? 'opacity-60' : ''
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">
            {memberName ? `${memberName}'s Limits` : 'Screen Time Limits'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Daily: {formatMinutes(limit.dailyLimitMinutes)}
            {limit.weekendLimitMinutes && ` • Weekend: ${formatMinutes(limit.weekendLimitMinutes)}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={limit.isEnabled}
              onChange={(e) => onToggle?.(limit.id, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
          </label>
        </div>
      </div>

      {/* Time windows */}
      {(limit.allowedStartTime || limit.bedtimeStart) && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          {limit.allowedStartTime && (
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600 font-medium">Allowed Hours</p>
              <p className="text-sm font-semibold text-green-800">
                {formatTime(limit.allowedStartTime)} - {formatTime(limit.allowedEndTime)}
              </p>
            </div>
          )}
          {limit.bedtimeStart && (
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-600 font-medium">Bedtime</p>
              <p className="text-sm font-semibold text-purple-800">
                {formatTime(limit.bedtimeStart)} - {formatTime(limit.bedtimeEnd)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Day-specific limits */}
      {limit.dayLimits && limit.dayLimits.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Day-Specific Limits</h4>
          <div className="flex flex-wrap gap-2">
            {limit.dayLimits.map((dayLimit) => (
              <div
                key={dayLimit.day}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm"
              >
                <span className="font-medium">{dayNames[dayLimit.day]}</span>
                <span className="text-gray-500 ml-1">{formatMinutes(dayLimit.limitMinutes)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* App limits */}
      {limit.appLimits && limit.appLimits.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2">App Limits</h4>
          <div className="space-y-2">
            {limit.appLimits.slice(0, 3).map((appLimit, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {appLimit.appName}
                  {appLimit.categoryName && (
                    <span className="text-gray-400 ml-1">({appLimit.categoryName})</span>
                  )}
                </span>
                <span className="font-medium">{formatMinutes(appLimit.limitMinutes)}</span>
              </div>
            ))}
            {limit.appLimits.length > 3 && (
              <p className="text-xs text-gray-400">+{limit.appLimits.length - 3} more</p>
            )}
          </div>
        </div>
      )}

      {/* Settings indicators */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
        {limit.allowExtensions && (
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
            🎁 Extensions Allowed
          </span>
        )}
        {limit.pauseOnSchoolDays && (
          <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">
            📚 Paused on School Days
          </span>
        )}
        {limit.requireChoreCompletion && (
          <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
            ✅ Requires Chores
          </span>
        )}
      </div>

      {onEdit && (
        <button
          onClick={() => onEdit(limit)}
          className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          ✏️ Edit Limits
        </button>
      )}
    </div>
  );
}
