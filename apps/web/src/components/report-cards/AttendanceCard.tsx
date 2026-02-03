import { AttendanceRecord, PERIOD_NAMES } from '@chorechamp/types';

interface AttendanceCardProps {
  attendance: AttendanceRecord;
  showPeriod?: boolean;
}

export function AttendanceCard({ attendance, showPeriod = true }: AttendanceCardProps) {
  const getAttendanceColor = () => {
    if (attendance.isPerfect) return 'text-green-600';
    if (attendance.attendancePercentage >= 95) return 'text-blue-600';
    if (attendance.attendancePercentage >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const periodLabel = PERIOD_NAMES[attendance.periodType as keyof typeof PERIOD_NAMES]?.[attendance.periodNumber - 1] || `Period ${attendance.periodNumber}`;

  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      {showPeriod && (
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-gray-900">{periodLabel}</h4>
          <span className="text-sm text-gray-500">{attendance.schoolYear}</span>
        </div>
      )}

      {/* Attendance Percentage */}
      <div className="text-center mb-4">
        <div className={`text-4xl font-bold ${getAttendanceColor()}`}>
          {attendance.attendancePercentage.toFixed(1)}%
        </div>
        <p className="text-sm text-gray-500">Attendance Rate</p>
        {attendance.isPerfect && (
          <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
            Perfect Attendance!
          </span>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">{attendance.daysPresent}</div>
          <div className="text-xs text-gray-500">Days Present</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-600">{attendance.totalDays}</div>
          <div className="text-xs text-gray-500">Total Days</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-red-600">{attendance.daysAbsent}</div>
          <div className="text-xs text-gray-500">Absences</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-yellow-600">{attendance.daysTardy}</div>
          <div className="text-xs text-gray-500">Tardies</div>
        </div>
      </div>

      {attendance.daysExcused > 0 && (
        <div className="mt-4 pt-4 border-t text-center">
          <span className="text-sm text-gray-500">
            {attendance.daysExcused} excused absence{attendance.daysExcused > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {attendance.bonusEarned > 0 && (
        <div className="mt-4 pt-4 border-t text-center">
          <span className="text-yellow-600 font-medium">
            +{attendance.bonusEarned} bonus points earned
          </span>
        </div>
      )}
    </div>
  );
}
