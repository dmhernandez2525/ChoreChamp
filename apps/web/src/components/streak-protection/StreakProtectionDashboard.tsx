import { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, Flame, Snowflake, RefreshCw, Settings } from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { HouseholdStreakSummary } from '@chorechamp/types';
import { StreakHealthCard } from './StreakHealthCard';
import { StreakAlertCard } from './StreakAlertCard';
import { StreakProtectionSettingsPanel } from './StreakProtectionSettingsPanel';

interface StreakProtectionDashboardProps {
  householdId: string;
}

export function StreakProtectionDashboard({ householdId }: StreakProtectionDashboardProps) {
  const [summary, setSummary] = useState<HouseholdStreakSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getStreakProtectionSummary(householdId);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load streak protection:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleUseFreeze = async (memberId: string) => {
    try {
      await apiClient.useStreakFreeze(householdId, memberId);
      await loadSummary();
    } catch (err) {
      console.error('Failed to use freeze:', err);
      setError(err instanceof Error ? err.message : 'Failed to use freeze');
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      await apiClient.dismissStreakAlert(householdId, alertId);
      await loadSummary();
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={loadSummary}
          className="mt-3 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Shield className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Streak Protection
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Predictive alerts to help protect streaks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={loadSummary}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.totalActiveStreaks}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Streaks</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.totalMembersAtRisk}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">At Risk</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
              <Snowflake className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.freezesAvailableTotal}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Freezes Available</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.activeAlerts.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Alerts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active alerts */}
      {summary.activeAlerts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Active Alerts
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {summary.activeAlerts.map((alert) => (
              <StreakAlertCard
                key={alert.id}
                alert={alert}
                onDismiss={() => handleDismissAlert(alert.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Member streak health */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            Member Streak Health
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {summary.memberHealth.map((health) => (
            <StreakHealthCard
              key={health.memberId}
              health={health}
              onUseFreeze={() => handleUseFreeze(health.memberId)}
            />
          ))}
        </div>
      </div>

      {/* Upcoming milestones */}
      {summary.upcomingMilestones.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-4">
          <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-3">
            Upcoming Milestones
          </h3>
          <div className="space-y-2">
            {summary.upcomingMilestones.map((milestone) => (
              <div
                key={`${milestone.memberId}-${milestone.milestone}`}
                className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {milestone.memberName}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    {milestone.milestone}-day streak in {milestone.daysRemaining} day{milestone.daysRemaining !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Currently at {milestone.currentStreak} days
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <StreakProtectionSettingsPanel
          householdId={householdId}
          onClose={() => setShowSettings(false)}
          onSaved={loadSummary}
        />
      )}
    </div>
  );
}
