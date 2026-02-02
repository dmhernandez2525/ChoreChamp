import { useState, useEffect, useCallback } from 'react';
import { Target, AlertTriangle, CheckCircle, TrendingUp, RefreshCw, Settings } from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { HouseholdCalibrationSummary } from '@chorechamp/types';
import { CalibrationSuggestionCard } from './CalibrationSuggestionCard';
import { CalibrationSettingsPanel } from './CalibrationSettingsPanel';

interface CalibrationDashboardProps {
  householdId: string;
}

export function CalibrationDashboard({ householdId }: CalibrationDashboardProps) {
  const [summary, setSummary] = useState<HouseholdCalibrationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getCalibrationSummary(householdId);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load calibration summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load calibration data');
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const toggleSuggestion = (choreId: string) => {
    setSelectedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(choreId)) {
        next.delete(choreId);
      } else {
        next.add(choreId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (summary) {
      setSelectedSuggestions(new Set(summary.suggestions.map((s) => s.choreId)));
    }
  };

  const deselectAll = () => {
    setSelectedSuggestions(new Set());
  };

  const applySelected = async () => {
    if (!summary || selectedSuggestions.size === 0) return;

    setIsApplying(true);
    try {
      const suggestions = summary.suggestions
        .filter((s) => selectedSuggestions.has(s.choreId))
        .map((s) => ({
          choreId: s.choreId,
          newDifficulty: s.suggestedDifficulty,
          newPoints: s.suggestedPoints,
        }));

      await apiClient.bulkApplyCalibration(householdId, { suggestions });
      setSelectedSuggestions(new Set());
      await loadSummary();
    } catch (err) {
      console.error('Failed to apply calibrations:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply calibrations');
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
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
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <Target className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Difficulty Calibration
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Automatically adjust chore difficulty based on performance
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.calibrated}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Calibrated</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.needsCalibration}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Needs Review</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.suggestions.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Suggestions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {summary.suggestions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Calibration Suggestions
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Select All
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <button
                onClick={deselectAll}
                className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {summary.suggestions.map((suggestion) => (
              <CalibrationSuggestionCard
                key={suggestion.choreId}
                suggestion={suggestion}
                isSelected={selectedSuggestions.has(suggestion.choreId)}
                onToggle={() => toggleSuggestion(suggestion.choreId)}
              />
            ))}
          </div>

          {selectedSuggestions.size > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <button
                onClick={applySelected}
                disabled={isApplying}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isApplying
                  ? 'Applying...'
                  : `Apply ${selectedSuggestions.size} Calibration${selectedSuggestions.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>
      )}

      {summary.suggestions.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            All chores are well calibrated!
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            No adjustments needed at this time.
          </p>
        </div>
      )}

      {/* Member Performance */}
      {summary.memberPerformanceSummary.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Member Performance
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.memberPerformanceSummary.map((member) => (
                <div
                  key={member.memberId}
                  className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {member.memberName}
                    </p>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {member.averageCompletionRate.toFixed(0)}% avg
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                      {member.choresExceeding} exceeding
                    </span>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                      {member.choresMeeting} meeting
                    </span>
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                      {member.choresStruggling} struggling
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <CalibrationSettingsPanel
          householdId={householdId}
          onClose={() => setShowSettings(false)}
          onSaved={loadSummary}
        />
      )}
    </div>
  );
}
