import type { BalanceRecommendation, BalanceMetrics } from '@chorechamp/types';

interface BalanceCardProps {
  recommendation: BalanceRecommendation;
  onAcknowledge?: (id: string) => void;
}

const RECOMMENDATION_CONFIG: Record<string, { icon: string; color: string }> = {
  reduce_activities: { icon: '\u26A0\uFE0F', color: '#f59e0b' },
  reduce_chores: { icon: '\uD83E\uDDF9', color: '#3b82f6' },
  schedule_adjustment: { icon: '\uD83D\uDCC5', color: '#8b5cf6' },
  rest_day: { icon: '\uD83D\uDCA4', color: '#22c55e' },
  time_management: { icon: '\u23F0', color: '#ef4444' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Low Priority', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'High Priority', color: 'bg-red-100 text-red-700' },
};

interface MetricsDisplayProps {
  metrics: BalanceMetrics;
}

function MetricsDisplay({ metrics }: MetricsDisplayProps) {
  const totalHours = metrics.weeklySchoolHours + metrics.weeklyActivityHours + metrics.weeklyChoreHours;
  const maxHours = 60;

  return (
    <div className="bg-gray-50 rounded-lg p-3 mt-3">
      <p className="text-xs font-medium text-gray-700 mb-2">Weekly Time Breakdown</p>

      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-0.5">
            <span>School</span>
            <span>{metrics.weeklySchoolHours} hrs</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${(metrics.weeklySchoolHours / maxHours) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-0.5">
            <span>Activities</span>
            <span>{metrics.weeklyActivityHours} hrs</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${(metrics.weeklyActivityHours / maxHours) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-0.5">
            <span>Chores</span>
            <span>{metrics.weeklyChoreHours} hrs</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${(metrics.weeklyChoreHours / maxHours) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-0.5">
            <span>Free Time</span>
            <span>{metrics.weeklyFreeTimeHours} hrs</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 rounded-full"
              style={{ width: `${(metrics.weeklyFreeTimeHours / maxHours) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Committed:</span>
          <span className="font-medium text-gray-900">{totalHours} hrs/week</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Avg Sleep:</span>
          <span className="font-medium text-gray-900">{metrics.sleepHoursAverage} hrs/night</span>
        </div>
      </div>

      {metrics.stressIndicators.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <p className="text-xs font-medium text-red-600 mb-1">Stress Indicators:</p>
          <div className="flex flex-wrap gap-1">
            {metrics.stressIndicators.map((indicator, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs"
              >
                {indicator}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function BalanceCard({ recommendation, onAcknowledge }: BalanceCardProps) {
  const config = RECOMMENDATION_CONFIG[recommendation.recommendationType] || { icon: '\uD83D\uDCA1', color: '#6b7280' };
  const priorityConfig = PRIORITY_CONFIG[recommendation.priority] || PRIORITY_CONFIG.low;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border overflow-hidden ${
      recommendation.acknowledged ? 'opacity-60' : ''
    }`}>
      <div
        className="px-4 py-3 flex items-center space-x-3"
        style={{ backgroundColor: `${config.color}15` }}
      >
        <span className="text-2xl">{config.icon}</span>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{recommendation.title}</h3>
          <p className="text-xs text-gray-500">
            {formatDate(recommendation.createdAt)}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityConfig.color}`}>
          {priorityConfig.label}
        </span>
      </div>

      <div className="p-4">
        <p className="text-gray-700 mb-3">{recommendation.description}</p>

        <MetricsDisplay metrics={recommendation.metrics} />

        {recommendation.acknowledged && recommendation.acknowledgedAt && (
          <div className="flex items-center space-x-2 text-sm text-green-600 mt-3">
            <span>\u2713</span>
            <span>Acknowledged on {formatDate(recommendation.acknowledgedAt)}</span>
          </div>
        )}

        {onAcknowledge && !recommendation.acknowledged && (
          <div className="flex justify-end mt-4 pt-3 border-t">
            <button
              onClick={() => onAcknowledge(recommendation.id)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium text-sm"
            >
              Acknowledge
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
