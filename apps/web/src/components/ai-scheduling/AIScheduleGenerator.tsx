import { useState, useCallback } from 'react';
import {
  Sparkles,
  Calendar,
  RefreshCw,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Users,
  BarChart3,
} from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type {
  AISchedule,
  GenerateScheduleRequest,
  ScheduleSuggestion,
} from '@chorechamp/types';
import { ScheduleSuggestionCard } from './ScheduleSuggestionCard';

interface AIScheduleGeneratorProps {
  householdId: string;
  members: Array<{ id: string; name: string; color: string }>;
  onScheduleApplied?: () => void;
}

type PeriodType = 'day' | 'week' | 'month';

export function AIScheduleGenerator({
  householdId,
  members,
  onScheduleApplied,
}: AIScheduleGeneratorProps) {
  const [schedule, setSchedule] = useState<AISchedule | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState<PeriodType>('week');
  const [showOptions, setShowOptions] = useState(false);
  const [showWorkload, setShowWorkload] = useState(false);
  const [options, setOptions] = useState<GenerateScheduleRequest>({
    period: 'week',
    balanceWorkload: true,
    considerPatterns: true,
    considerAge: true,
    includeUnassigned: true,
  });

  const memberMap = new Map(members.map((m) => [m.id, m]));

  const generateSchedule = useCallback(async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setSelectedIds(new Set());

      const result = await apiClient.generateAISchedule(householdId, {
        ...options,
        period,
      });

      setSchedule(result);

      // Auto-select high confidence suggestions
      const highConfidence = result.suggestions
        .filter((s) => s.confidence >= 70)
        .map((s) => s.id);
      setSelectedIds(new Set(highConfidence));
    } catch (err) {
      console.error('Failed to generate schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate schedule');
    } finally {
      setIsGenerating(false);
    }
  }, [householdId, period, options]);

  const applySchedule = useCallback(async () => {
    if (!schedule || selectedIds.size === 0) return;

    try {
      setIsApplying(true);
      setError(null);

      const result = await apiClient.applyAISchedule(
        householdId,
        schedule.id,
        Array.from(selectedIds),
        schedule.suggestions.filter((s) => selectedIds.has(s.id))
      );

      if (result.applied > 0) {
        onScheduleApplied?.();
        setSchedule(null);
        setSelectedIds(new Set());
      }

      if (result.conflicts.length > 0) {
        setError(`Applied ${result.applied} schedules. ${result.conflicts.length} conflicts found.`);
      }
    } catch (err) {
      console.error('Failed to apply schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply schedule');
    } finally {
      setIsApplying(false);
    }
  }, [householdId, schedule, selectedIds, onScheduleApplied]);

  const toggleSuggestion = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (schedule) {
      setSelectedIds(new Set(schedule.suggestions.map((s) => s.id)));
    }
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleAlternativeSelect = (suggestionId: string, memberId: string) => {
    if (!schedule) return;

    const member = memberMap.get(memberId);
    if (!member) return;

    setSchedule({
      ...schedule,
      suggestions: schedule.suggestions.map((s) =>
        s.id === suggestionId
          ? {
              ...s,
              memberId: member.id,
              memberName: member.name,
              memberColor: member.color,
              alternativeMemberIds: [
                s.memberId,
                ...(s.alternativeMemberIds || []).filter((id) => id !== memberId),
              ],
            }
          : s
      ),
    });
  };

  // Group suggestions by date
  const groupedSuggestions = schedule
    ? schedule.suggestions.reduce((acc, suggestion) => {
        const date = suggestion.suggestedDate;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(suggestion);
        return acc;
      }, {} as Record<string, ScheduleSuggestion[]>)
    : {};

  const sortedDates = Object.keys(groupedSuggestions).sort();

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
              AI Schedule Generator
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Smart chore scheduling based on patterns and workload
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Period selector */}
          <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
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

          {/* Options toggle */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Options
            {showOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Generate button */}
          <button
            onClick={generateSchedule}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-auto"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate Schedule
          </button>
        </div>

        {/* Options panel */}
        {showOptions && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.balanceWorkload}
                onChange={(e) => setOptions({ ...options, balanceWorkload: e.target.checked })}
                className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Balance workload</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.considerPatterns}
                onChange={(e) => setOptions({ ...options, considerPatterns: e.target.checked })}
                className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Use patterns</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.considerAge}
                onChange={(e) => setOptions({ ...options, considerAge: e.target.checked })}
                className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Age appropriate</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeUnassigned}
                onChange={(e) => setOptions({ ...options, includeUnassigned: e.target.checked })}
                className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Include unassigned</span>
            </label>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Generated schedule */}
      {schedule && (
        <>
          {/* Summary and actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Suggestions</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {schedule.suggestions.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Selected</p>
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedIds.size}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Period</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {schedule.periodStart} - {schedule.periodEnd}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowWorkload(!showWorkload)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <BarChart3 className="w-4 h-4" />
                  Workload
                </button>
                <button
                  onClick={selectAll}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Select all
                </button>
                <button
                  onClick={deselectAll}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Clear
                </button>
                <button
                  onClick={applySchedule}
                  disabled={isApplying || selectedIds.size === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isApplying ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Apply {selectedIds.size} Selected
                </button>
              </div>
            </div>

            {/* Workload summary */}
            {showWorkload && schedule.workloadSummary.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Users className="w-4 h-4" />
                  Current Workload
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {schedule.workloadSummary.map((member) => (
                    <div
                      key={member.memberId}
                      className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: member.memberColor }}
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {member.memberName}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                        <p>Assigned: {member.totalAssigned}</p>
                        <p>Completed: {member.totalCompleted}</p>
                        <p>Rate: {member.completionRate}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Suggestions by date */}
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {new Date(date).toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({groupedSuggestions[date].length} chores)
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {groupedSuggestions[date].map((suggestion) => (
                    <ScheduleSuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      isSelected={selectedIds.has(suggestion.id)}
                      onToggle={toggleSuggestion}
                      showAlternatives
                      onSelectAlternative={handleAlternativeSelect}
                      memberMap={memberMap}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!schedule && !isGenerating && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <Sparkles className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Click "Generate Schedule" to get AI-powered chore suggestions
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            The AI considers workload balance, completion patterns, and age appropriateness
          </p>
        </div>
      )}
    </div>
  );
}
