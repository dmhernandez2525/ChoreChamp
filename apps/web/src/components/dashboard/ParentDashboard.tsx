import { useState, useEffect } from 'react';
import { LayoutDashboard, RefreshCw, AlertCircle, Trophy, TrendingUp, Lightbulb, Star, Award, AlertTriangle, PartyPopper } from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { ParentDashboard as ParentDashboardData, DashboardInsight } from '@chorechamp/types';
import { DashboardStats } from './DashboardStats';

interface ParentDashboardProps {
  householdId: string;
}

type PeriodType = 'day' | 'week' | 'month';

const INSIGHT_ICONS: Record<DashboardInsight['type'], React.ReactNode> = {
  achievement: <Award className="w-5 h-5 text-amber-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-red-500" />,
  suggestion: <Lightbulb className="w-5 h-5 text-blue-500" />,
  celebration: <PartyPopper className="w-5 h-5 text-green-500" />,
};

const INSIGHT_COLORS: Record<DashboardInsight['type'], string> = {
  achievement: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  warning: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  suggestion: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  celebration: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
};

export function ParentDashboard({ householdId }: ParentDashboardProps) {
  const [dashboard, setDashboard] = useState<ParentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('week');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, [householdId, period]);

  async function loadDashboard() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getParentDashboard(householdId, { period });
      setDashboard(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={loadDashboard}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <LayoutDashboard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Family Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Overview of household activity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['day', 'week', 'month'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button
            onClick={loadDashboard}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <DashboardStats summary={dashboard.summary} />

      {/* Insights */}
      {dashboard.insights.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Insights
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {dashboard.insights.map((insight, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-4 rounded-lg border ${INSIGHT_COLORS[insight.type]}`}
              >
                {INSIGHT_ICONS[insight.type]}
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {insight.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {insight.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top performers */}
      {dashboard.summary.topPerformers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Top Performers
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {dashboard.summary.topPerformers.map((performer, index) => (
              <div
                key={performer.memberId}
                className={`flex items-center gap-4 p-4 ${
                  index !== dashboard.summary.topPerformers.length - 1
                    ? 'border-b border-gray-200 dark:border-gray-700'
                    : ''
                }`}
              >
                <span className="text-2xl font-bold text-gray-300 dark:text-gray-600 w-8">
                  {index + 1}
                </span>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: performer.memberColor }}
                >
                  {performer.memberName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {performer.memberName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {performer.choresCompleted} chores completed
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-medium">{performer.pointsEarned}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">points earned</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member details */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          Member Progress
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {dashboard.memberData.map((member) => (
            <div
              key={member.memberId}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-lg"
                  style={{ backgroundColor: member.memberColor }}
                >
                  {member.memberName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {member.memberName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {member.role}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {member.choresCompleted}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className={`text-xl font-bold ${
                    member.completionRate >= 80
                      ? 'text-green-600 dark:text-green-400'
                      : member.completionRate >= 50
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {member.completionRate}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Rate</p>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {member.pointsCurrent}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Points</p>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {member.currentStreak}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Streak</p>
                </div>
              </div>

              {/* Mini completion chart */}
              <div className="flex items-end gap-1 h-12">
                {member.weeklyCompletion.slice(-7).map((day, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t relative"
                    style={{ height: '100%' }}
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-indigo-500 dark:bg-indigo-400 rounded-t transition-all"
                      style={{
                        height: day.scheduled > 0
                          ? `${Math.min(100, (day.completed / day.scheduled) * 100)}%`
                          : '0%',
                      }}
                    />
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                Last 7 days
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
