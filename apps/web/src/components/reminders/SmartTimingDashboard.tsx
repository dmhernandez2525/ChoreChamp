import { useState, useEffect, useCallback } from 'react';
import { Sparkles, AlertCircle, RefreshCw, Clock, TrendingUp, Moon } from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { SmartTimingAnalysis, ReminderSuggestion } from '@chorechamp/types';

interface SmartTimingDashboardProps {
  householdId: string;
  members: Array<{ id: string; name: string; color: string }>;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function SmartTimingDashboard({ householdId, members }: SmartTimingDashboardProps) {
  const [suggestions, setSuggestions] = useState<ReminderSuggestion[]>([]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SmartTimingAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSuggestions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getReminderSuggestions(householdId);
      setSuggestions(data);
      if (data.length > 0 && !selectedMember) {
        setSelectedMember(data[0].memberId);
      }
    } catch (err) {
      console.error('Failed to load suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [householdId, selectedMember]);

  const loadAnalysis = useCallback(async (memberId: string) => {
    try {
      setIsLoadingAnalysis(true);
      const data = await apiClient.getSmartTimingAnalysis(householdId, memberId);
      setAnalysis(data);
    } catch (err) {
      console.error('Failed to load analysis:', err);
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [householdId]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  useEffect(() => {
    if (selectedMember) {
      loadAnalysis(selectedMember);
    }
  }, [selectedMember, loadAnalysis]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
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
          onClick={loadSuggestions}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Smart Timing Analysis
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              AI-powered reminder timing recommendations
            </p>
          </div>
        </div>

        <button
          onClick={loadSuggestions}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Member suggestions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((suggestion) => {
          const member = members.find((m) => m.id === suggestion.memberId);
          const isSelected = selectedMember === suggestion.memberId;

          return (
            <button
              key={suggestion.memberId}
              onClick={() => setSelectedMember(suggestion.memberId)}
              className={`text-left p-4 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 ring-2 ring-purple-200 dark:ring-purple-800'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: member?.color || '#6366f1' }}
                >
                  {suggestion.memberName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {suggestion.memberName}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{suggestion.suggestedTime}</span>
                    <span className="capitalize">({suggestion.suggestedTiming})</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{suggestion.reason}</p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                  Based on: {suggestion.basedOn.replace('_', ' ')}
                </span>
                <span
                  className={`text-xs font-medium ${
                    suggestion.confidence >= 70
                      ? 'text-green-600'
                      : suggestion.confidence >= 40
                      ? 'text-amber-600'
                      : 'text-gray-500'
                  }`}
                >
                  {suggestion.confidence}% confidence
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed analysis */}
      {selectedMember && analysis && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Detailed Analysis for {analysis.memberName}
            </h3>
          </div>

          {isLoadingAnalysis ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 mx-auto text-gray-400 animate-spin" />
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {/* Day recommendations */}
              <div>
                <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Clock className="w-4 h-4" />
                  Best Time by Day
                </h4>
                <div className="grid grid-cols-7 gap-2">
                  {analysis.recommendations.map((rec) => (
                    <div
                      key={rec.dayOfWeek}
                      className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400">{DAY_NAMES[rec.dayOfWeek]}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {rec.suggestedTime}
                      </p>
                      <div
                        className={`mt-1 h-1 rounded-full ${
                          rec.historicalSuccessRate >= 70
                            ? 'bg-green-500'
                            : rec.historicalSuccessRate >= 40
                            ? 'bg-amber-500'
                            : 'bg-gray-300'
                        }`}
                        style={{ width: `${rec.historicalSuccessRate}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Optimal windows */}
              <div>
                <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <TrendingUp className="w-4 h-4" />
                  Optimal Time Windows
                </h4>
                <div className="space-y-2">
                  {analysis.optimalWindows.map((window, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {window.start} - {window.end}
                      </span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {window.successRate}% success rate
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avoid times */}
              <div>
                <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Moon className="w-4 h-4" />
                  Times to Avoid
                </h4>
                <div className="space-y-2">
                  {analysis.avoidTimes.map((time, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {time.start} - {time.end}
                      </span>
                      <span className="text-sm text-red-600 dark:text-red-400">{time.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
