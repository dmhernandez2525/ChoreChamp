import { useState, useEffect, useCallback } from 'react';
import { BarChart3, RefreshCw, AlertCircle, TrendingUp, Calendar, PieChart } from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { ScheduleAnalytics, CompletionPattern } from '@chorechamp/types';

interface WorkloadAnalyticsProps {
  householdId: string;
  memberId?: string;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WorkloadAnalytics({ householdId, memberId }: WorkloadAnalyticsProps) {
  const [analytics, setAnalytics] = useState<ScheduleAnalytics | null>(null);
  const [memberPattern, setMemberPattern] = useState<CompletionPattern | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [analyticsData, patternData] = await Promise.all([
        apiClient.getScheduleAnalytics(householdId, { period }),
        memberId ? apiClient.getMemberPatterns(householdId, memberId) : Promise.resolve(null),
      ]);

      setAnalytics(analyticsData);
      setMemberPattern(patternData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [householdId, memberId, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={loadData}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!analytics) return null;

  const maxWorkload = Math.max(...analytics.workloadDistribution.map((d) => d.assigned), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Schedule Analytics
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {analytics.period.start} - {analytics.period.end}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={loadData}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Scheduled</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {analytics.totalScheduled}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Completed</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {analytics.totalCompleted}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <PieChart className="w-4 h-4" />
            <span className="text-sm">Rate</span>
          </div>
          <p
            className={`text-2xl font-bold ${
              analytics.completionRate >= 80
                ? 'text-green-600 dark:text-green-400'
                : analytics.completionRate >= 50
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {analytics.completionRate}%
          </p>
        </div>
      </div>

      {/* Workload distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
          Workload Distribution
        </h3>
        <div className="space-y-3">
          {analytics.workloadDistribution.map((member) => (
            <div key={member.memberId} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400 w-24 truncate">
                {member.memberName}
              </span>
              <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all"
                  style={{ width: `${(member.assigned / maxWorkload) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 w-16 text-right">
                {member.assigned} / {member.completed}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-500 w-12 text-right">
                {member.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Peak days and categories */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Peak days */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
            Busiest Days
          </h3>
          <div className="flex items-end gap-2 h-24">
            {analytics.peakDays.map((day) => {
              const maxCount = Math.max(...analytics.peakDays.map((d) => d.count), 1);
              const height = (day.count / maxCount) * 100;

              return (
                <div key={day.day} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 dark:bg-blue-400 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {DAY_NAMES[day.day]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
            By Category
          </h3>
          <div className="space-y-2">
            {analytics.categoryBreakdown.slice(0, 5).map((cat) => {
              const percentage =
                analytics.totalScheduled > 0
                  ? Math.round((cat.count / analytics.totalScheduled) * 100)
                  : 0;

              return (
                <div key={cat.category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {cat.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {cat.count}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500 w-10 text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Member pattern (if viewing specific member) */}
      {memberPattern && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
            {memberPattern.memberName}'s Patterns
          </h3>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Day of week */}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Success by day</p>
              <div className="flex gap-1">
                {memberPattern.byDayOfWeek.map((day) => (
                  <div
                    key={day.day}
                    className="flex-1 text-center"
                    title={`${DAY_NAMES[day.day]}: ${day.rate}%`}
                  >
                    <div
                      className={`h-8 rounded ${
                        day.rate >= 70
                          ? 'bg-green-200 dark:bg-green-800'
                          : day.rate >= 40
                          ? 'bg-amber-200 dark:bg-amber-800'
                          : 'bg-red-200 dark:bg-red-800'
                      }`}
                    />
                    <span className="text-xs text-gray-500">{DAY_NAMES[day.day].charAt(0)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Time of day */}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Best time</p>
              <div className="space-y-1">
                {memberPattern.byTimeOfDay.map((slot) => (
                  <div key={slot.slot} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-gray-600 dark:text-gray-400">
                      {slot.slot}
                    </span>
                    <span
                      className={`font-medium ${
                        slot.rate >= 70
                          ? 'text-green-600'
                          : slot.rate >= 40
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}
                    >
                      {slot.rate}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trend */}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Trend</p>
              <div
                className={`p-3 rounded-lg text-center ${
                  memberPattern.streakTendency === 'improving'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : memberPattern.streakTendency === 'declining'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <p className="font-medium capitalize">{memberPattern.streakTendency}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analytics.recommendations.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-3">
            Optimization Suggestions
          </h3>
          <div className="space-y-3">
            {analytics.recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg"
              >
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    rec.priority === 'high'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      : rec.priority === 'medium'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {rec.priority}
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {rec.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {rec.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
