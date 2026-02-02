import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  CheckCircle,
  Star,
  Flame,
  RefreshCw,
  AlertTriangle,
  Download,
  Lightbulb,
  PartyPopper,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { FamilyAnalytics, AnalyticsPeriod, InsightRecommendation } from '@chorechamp/types';
import {
  ANALYTICS_PERIODS,
  formatPercentageChange,
  getTrendColor,
  getInsightPriorityColor,
} from '@chorechamp/types';

interface FamilyAnalyticsDashboardProps {
  householdId: string;
}

export function FamilyAnalyticsDashboard({ householdId }: FamilyAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<FamilyAnalytics | null>(null);
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const data = await apiClient.getFamilyAnalytics(householdId, { period });
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [householdId, period]);

  useEffect(() => {
    loadAnalytics(false);
  }, [loadAnalytics]);

  const handleRefresh = useCallback(() => {
    loadAnalytics(true);
  }, [loadAnalytics]);

  const handleExport = async (format: 'pdf' | 'csv' | 'json') => {
    try {
      await apiClient.exportAnalytics(householdId, {
        format,
        period,
        sections: ['overview', 'members', 'trends', 'chores', 'engagement'],
      });
      // In real app, would trigger download
      alert(`Export requested in ${format.toUpperCase()} format`);
    } catch (err) {
      console.error('Failed to export:', err);
    }
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          <span>{error}</span>
        </div>
        <button onClick={handleRefresh} className="mt-3 text-sm text-red-600 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Family Analytics
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Insights and performance metrics for your household
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 disabled:opacity-50"
            aria-label="Refresh analytics"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
          <div className="relative">
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {ANALYTICS_PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
              period === p.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={CheckCircle}
          label="Completion Rate"
          value={`${analytics.overview.completionRate}%`}
          change={analytics.overview.comparisonToPrevious.completionRate}
          color="green"
        />
        <StatCard
          icon={Users}
          label="Total Completed"
          value={analytics.overview.totalChoresCompleted.toString()}
          change={analytics.overview.comparisonToPrevious.choresCompleted}
          color="blue"
        />
        <StatCard
          icon={Star}
          label="Points Earned"
          value={analytics.overview.totalPointsEarned.toString()}
          change={analytics.overview.comparisonToPrevious.pointsEarned}
          color="yellow"
        />
        <StatCard
          icon={Flame}
          label="Household Streak"
          value={`${analytics.overview.currentHouseholdStreak} days`}
          subtext={`Best: ${analytics.overview.longestHouseholdStreak} days`}
          color="orange"
        />
      </div>

      {/* Recommendations */}
      {analytics.recommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" aria-hidden="true" />
            Insights & Recommendations
          </h3>
          <div className="space-y-3">
            {analytics.recommendations.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Member Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" aria-hidden="true" />
          Member Performance
        </h3>
        <div className="space-y-4">
          {analytics.memberInsights.map((member) => (
            <MemberPerformanceRow key={member.memberId} member={member} />
          ))}
        </div>
      </div>

      {/* Trends Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Completion Trends
        </h3>
        <div
          className="h-64 flex items-end gap-2"
          role="img"
          aria-label={`Completion trend chart showing ${analytics.trends.dailyCompletions.slice(-14).reduce((sum, p) => sum + p.value, 0)} total chores completed over the last 14 days`}
        >
          {analytics.trends.dailyCompletions.slice(-14).map((point, index) => (
            <div
              key={index}
              className="flex-1 bg-blue-500 rounded-t"
              style={{
                height: `${(point.value / Math.max(...analytics.trends.dailyCompletions.map((p) => p.value))) * 100}%`,
                minHeight: '4px',
              }}
              title={`${point.date}: ${point.value} chores`}
              aria-hidden="true"
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{analytics.trends.dailyCompletions[analytics.trends.dailyCompletions.length - 14]?.date}</span>
          <span>{analytics.trends.dailyCompletions[analytics.trends.dailyCompletions.length - 1]?.date}</span>
        </div>
      </div>

      {/* Fairness Score */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Workload Distribution
        </h3>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 relative">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${analytics.choreAnalysis.fairnessScore * 2.51} 251`}
                className="text-green-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {analytics.choreAnalysis.fairnessScore}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Fairness Score - {analytics.choreAnalysis.fairnessScore >= 80 ? 'Well balanced!' : analytics.choreAnalysis.fairnessScore >= 60 ? 'Room for improvement' : 'Consider rebalancing'}
            </p>
            <div className="space-y-2">
              {analytics.choreAnalysis.choreDistribution.map((dist) => (
                <div key={dist.memberId} className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300 w-24 truncate">{dist.memberName}</span>
                  <div
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={dist.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${dist.memberName}'s workload: ${dist.percentage}%`}
                  >
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${dist.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">{dist.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  change,
  subtext,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  change?: number;
  subtext?: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</span>
        {change !== undefined && (
          <span className={`text-sm flex items-center gap-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <TrendingUp className="w-4 h-4" aria-hidden="true" /> : <TrendingDown className="w-4 h-4" aria-hidden="true" />}
            {formatPercentageChange(change)}
          </span>
        )}
      </div>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}

function MemberPerformanceRow({ member }: { member: FamilyAnalytics['memberInsights'][0] }) {
  const TrendIcon = member.performanceTrend === 'improving' ? TrendingUp : member.performanceTrend === 'declining' ? TrendingDown : Minus;

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
        {member.rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-gray-100">{member.memberName}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {member.choresCompleted} chores • {member.completionRate}% rate
        </p>
      </div>
      <div className="text-right">
        <p className="font-bold text-gray-900 dark:text-gray-100">{member.pointsEarned} pts</p>
        <p
          className="text-sm flex items-center gap-1 justify-end"
          style={{ color: getTrendColor(member.performanceTrend) }}
        >
          <TrendIcon className="w-4 h-4" aria-hidden="true" />
          {member.performanceTrend}
        </p>
      </div>
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: InsightRecommendation }) {
  const getIcon = () => {
    switch (recommendation.type) {
      case 'celebration':
        return <PartyPopper className="w-5 h-5 text-green-500" aria-hidden="true" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />;
      case 'improvement':
        return <TrendingUp className="w-5 h-5 text-blue-500" aria-hidden="true" />;
      default:
        return <Lightbulb className="w-5 h-5 text-yellow-500" aria-hidden="true" />;
    }
  };

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg"
      style={{ backgroundColor: `${getInsightPriorityColor(recommendation.priority)}10` }}
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-gray-100">{recommendation.title}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{recommendation.description}</p>
        {recommendation.actionable && recommendation.action && (
          <button className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
            {recommendation.action.label} →
          </button>
        )}
      </div>
    </div>
  );
}
