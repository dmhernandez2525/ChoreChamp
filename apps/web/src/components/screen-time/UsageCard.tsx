import type { ScreenTimeUsage } from '@chorechamp/types';

interface UsageCardProps {
  usage: ScreenTimeUsage;
  memberName?: string;
}

export function UsageCard({ usage, memberName }: UsageCardProps) {
  const totalAvailable = usage.limitMinutes + usage.bonusMinutesEarned;
  const totalUsed = usage.totalMinutesUsed;
  const remaining = Math.max(0, totalAvailable - totalUsed);
  const percentUsed = Math.min(100, (totalUsed / totalAvailable) * 100);

  const formatMinutes = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const getProgressColor = () => {
    if (percentUsed >= 100) return 'bg-red-500';
    if (percentUsed >= 80) return 'bg-orange-500';
    if (percentUsed >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${
      usage.limitReached ? 'border-2 border-red-300' : ''
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">
          {memberName || 'Screen Time'} - {new Date(usage.date).toLocaleDateString()}
        </h3>
        {usage.limitReached && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            Limit Reached
          </span>
        )}
        {usage.limitExtended && !usage.limitReached && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            Extended
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{formatMinutes(totalUsed)} used</span>
          <span>{formatMinutes(remaining)} left</span>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressColor()} transition-all duration-300`}
            style={{ width: `${Math.min(100, percentUsed)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0</span>
          <span>{formatMinutes(totalAvailable)} total</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-2 bg-gray-50 rounded-lg">
          <p className="text-lg font-bold text-gray-900">{formatMinutes(usage.limitMinutes)}</p>
          <p className="text-xs text-gray-500">Daily Limit</p>
        </div>
        <div className="p-2 bg-green-50 rounded-lg">
          <p className="text-lg font-bold text-green-700">+{formatMinutes(usage.bonusMinutesEarned)}</p>
          <p className="text-xs text-gray-500">Bonus Earned</p>
        </div>
        <div className="p-2 bg-blue-50 rounded-lg">
          <p className="text-lg font-bold text-blue-700">{formatMinutes(usage.bonusMinutesUsed)}</p>
          <p className="text-xs text-gray-500">Bonus Used</p>
        </div>
      </div>

      {/* Device breakdown */}
      {usage.deviceUsage && usage.deviceUsage.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2">By Device</h4>
          <div className="space-y-2">
            {usage.deviceUsage.map((device, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{device.deviceName}</span>
                <span className="font-medium">{formatMinutes(device.minutesUsed)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* App breakdown */}
      {usage.appUsage && usage.appUsage.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2">By App</h4>
          <div className="space-y-2">
            {usage.appUsage.slice(0, 5).map((app, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-gray-600">{app.appName}</span>
                  {app.categoryName && (
                    <span className="ml-2 text-xs text-gray-400">({app.categoryName})</span>
                  )}
                </div>
                <span className="font-medium">{formatMinutes(app.minutesUsed)}</span>
              </div>
            ))}
            {usage.appUsage.length > 5 && (
              <p className="text-xs text-gray-400">
                +{usage.appUsage.length - 5} more apps
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
