import { CheckCircle, Clock, Star, Trophy, AlertCircle, Gift, Repeat, Wallet } from 'lucide-react';
import type { DashboardSummary } from '@chorechamp/types';

interface DashboardStatsProps {
  summary: DashboardSummary;
}

export function DashboardStats({ summary }: DashboardStatsProps) {
  const stats = [
    {
      label: 'Chores Completed',
      value: summary.totalChoresCompleted,
      subValue: `of ${summary.totalChoresScheduled}`,
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Completion Rate',
      value: `${summary.completionRate}%`,
      icon: <Trophy className="w-5 h-5" />,
      color: summary.completionRate >= 80
        ? 'text-green-600 bg-green-100 dark:bg-green-900/30'
        : summary.completionRate >= 50
        ? 'text-amber-600 bg-amber-100 dark:bg-amber-900/30'
        : 'text-red-600 bg-red-100 dark:bg-red-900/30',
    },
    {
      label: 'Points Awarded',
      value: summary.totalPointsAwarded.toLocaleString(),
      icon: <Star className="w-5 h-5" />,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    },
    {
      label: 'Family Streak',
      value: `${summary.familyStreak} days`,
      subValue: `Best: ${summary.longestFamilyStreak}`,
      icon: <Trophy className="w-5 h-5" />,
      color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30',
    },
  ];

  const pendingActions = [
    { label: 'Approvals', count: summary.pendingApprovals, icon: <CheckCircle className="w-4 h-4" /> },
    { label: 'Redemptions', count: summary.pendingRedemptions, icon: <Gift className="w-4 h-4" /> },
    { label: 'Trades', count: summary.pendingTrades, icon: <Repeat className="w-4 h-4" /> },
    { label: 'Payouts', count: summary.pendingPayouts, icon: <Wallet className="w-4 h-4" /> },
  ];

  const totalPending = pendingActions.reduce((sum, a) => sum + a.count, 0);

  return (
    <div className="space-y-6">
      {/* Main stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className={`inline-flex p-2 rounded-lg ${stat.color} mb-3`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stat.value}
            </p>
            {stat.subValue && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.subValue}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pending actions */}
      {totalPending > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="font-medium text-amber-800 dark:text-amber-200">
              {totalPending} Pending Action{totalPending !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-4">
            {pendingActions
              .filter((a) => a.count > 0)
              .map((action) => (
                <div
                  key={action.label}
                  className="flex items-center gap-2 text-amber-700 dark:text-amber-300"
                >
                  {action.icon}
                  <span className="text-sm">
                    {action.count} {action.label}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Period label */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Clock className="w-4 h-4" />
        <span>
          {summary.period.label}: {summary.period.start} to {summary.period.end}
        </span>
      </div>
    </div>
  );
}
