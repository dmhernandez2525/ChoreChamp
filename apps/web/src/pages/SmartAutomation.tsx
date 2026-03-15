import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CalendarClock,
  Lightbulb,
  Zap,
  TrendingUp,
  MessageSquareText,
  ChevronLeft,
  Plus,
  Play,
  Pause,
  Settings,
  Send,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import {
  useSmartScheduleConfig,
  useScheduleConflicts,
  useRunScheduleOptimization,
  useAISuggestions,
  useSuggestionPreferences,
  useAutomationRules,
  usePredictions,
  usePredictiveInsights,
  usePredictiveAnalyticsConfig,
  useCommandHistory,
  useCommandCapabilities,
  useExecuteCommand,
} from '@chorechamp/api-client';

type AutomationTab = 'scheduling' | 'suggestions' | 'rules' | 'predictions' | 'commands';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2
        className="w-8 h-8 animate-spin"
        style={{ color: 'var(--app-accent)' }}
      />
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-lg mb-6"
      style={{
        backgroundColor: 'var(--app-surface-muted)',
        border: '1px solid var(--app-border)',
        color: 'var(--app-text)',
      }}
    >
      <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#ef4444' }} />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div
      className="p-4 rounded-lg animate-pulse"
      style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
    >
      <div
        className="h-8 w-12 rounded mb-1"
        style={{ backgroundColor: 'var(--app-surface-muted)' }}
      />
      <div
        className="h-4 w-20 rounded"
        style={{ backgroundColor: 'var(--app-surface-muted)' }}
      />
    </div>
  );
}

function SmartSchedulingTab({ householdId }: { householdId: string }) {
  const { data: config, isLoading: configLoading, error: configError } = useSmartScheduleConfig(householdId);
  const { data: conflictsData, isLoading: conflictsLoading } = useScheduleConflicts(householdId);
  const runOptimization = useRunScheduleOptimization(householdId);

  const isLoading = configLoading || conflictsLoading;
  const strategy = config?.strategy ?? 'balanced';
  const maxPerDay = config?.maxChoresPerMemberPerDay ?? 0;
  const conflicts = conflictsData?.conflicts ?? [];
  const conflictCount = conflictsData?.total ?? 0;

  const strategyLabel = strategy.charAt(0).toUpperCase() + strategy.slice(1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Smart Scheduling
        </h2>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          style={{
            backgroundColor: 'var(--app-accent)',
            color: 'white',
          }}
          disabled={runOptimization.isPending}
          onClick={() => runOptimization.mutate()}
        >
          {runOptimization.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Optimize Now
        </button>
      </div>

      {configError && <ErrorBanner message="Failed to load scheduling configuration." />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          [
            { label: 'Strategy', value: strategyLabel },
            { label: 'Max/Day', value: String(maxPerDay) },
            { label: 'Score', value: '0%' },
            { label: 'Conflicts', value: String(conflictCount) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-lg"
              style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: 'var(--app-text)' }}>
                {stat.value}
              </div>
              <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
                {stat.label}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['Balanced', 'Efficiency', 'Fairness', 'Preference'].map((s) => (
          <button
            key={s}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: s.toLowerCase() === strategy ? 'var(--app-accent-soft)' : 'var(--app-surface-muted)',
              color: s.toLowerCase() === strategy ? 'var(--app-accent)' : 'var(--app-text)',
              border: '1px solid var(--app-border)',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : conflicts.length > 0 ? (
        <div className="space-y-3">
          {conflicts.map((conflict) => (
            <div
              key={conflict.id}
              className="p-4 rounded-lg"
              style={{ backgroundColor: 'var(--app-surface-muted)', border: '1px solid var(--app-border)' }}
            >
              <div className="font-medium mb-1" style={{ color: 'var(--app-text)' }}>
                {conflict.description}
              </div>
              <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
                Suggested: {conflict.suggestedResolution}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="text-center py-12 rounded-lg"
          style={{ backgroundColor: 'var(--app-surface-muted)' }}
        >
          <CalendarClock
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: 'var(--app-text-muted)' }}
          />
          <p style={{ color: 'var(--app-text-muted)' }}>No schedule optimizations yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>
            Click "Optimize Now" to analyze and improve your chore schedule
          </p>
        </div>
      )}
    </div>
  );
}

function AISuggestionsTab({ householdId }: { householdId: string }) {
  const { data: suggestionsData, isLoading, error } = useAISuggestions(householdId);
  const { data: prefsData } = useSuggestionPreferences(householdId);

  const suggestions = suggestionsData?.suggestions ?? [];
  const pending = suggestions.filter((s) => s.isAccepted === null && !s.dismissedAt);
  const accepted = suggestions.filter((s) => s.isAccepted === true);
  const dismissed = suggestions.filter((s) => s.dismissedAt !== null || s.isAccepted === false);
  const totalDecided = accepted.length + dismissed.length;
  const accuracy = totalDecided > 0 ? Math.round((accepted.length / totalDecided) * 100) : 0;

  const enabledSources = prefsData?.sources ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          AI Chore Suggestions
        </h2>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: 'var(--app-accent)',
            color: 'white',
          }}
        >
          <Settings className="w-4 h-4" />
          Preferences
        </button>
      </div>

      {error && <ErrorBanner message="Failed to load AI suggestions." />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          [
            { label: 'Pending', value: String(pending.length) },
            { label: 'Accepted', value: String(accepted.length) },
            { label: 'Dismissed', value: String(dismissed.length) },
            { label: 'Accuracy', value: `${accuracy}%` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-lg"
              style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: 'var(--app-text)' }}>
                {stat.value}
              </div>
              <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
                {stat.label}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['Pattern Analysis', 'Seasonal', 'Weather', 'Household Profile', 'Member Growth'].map(
          (source) => {
            const sourceKey = source.toLowerCase().replace(/ /g, '_');
            const isEnabled = enabledSources.includes(sourceKey as typeof enabledSources[number]);
            return (
              <button
                key={source}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isEnabled ? 'var(--app-accent-soft)' : 'var(--app-surface-muted)',
                  color: isEnabled ? 'var(--app-accent)' : 'var(--app-text)',
                  border: '1px solid var(--app-border)',
                }}
              >
                {source}
              </button>
            );
          }
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : pending.length > 0 ? (
        <div className="space-y-3">
          {pending.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-4 rounded-lg"
              style={{ backgroundColor: 'var(--app-surface-muted)', border: '1px solid var(--app-border)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium" style={{ color: 'var(--app-text)' }}>
                  {suggestion.title}
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--app-accent-soft)',
                    color: 'var(--app-accent)',
                  }}
                >
                  {Math.round(suggestion.confidence * 100)}% confidence
                </span>
              </div>
              <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
                {suggestion.description}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--app-text-muted)' }}>
                {suggestion.reasoning}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="text-center py-12 rounded-lg"
          style={{ backgroundColor: 'var(--app-surface-muted)' }}
        >
          <Lightbulb
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: 'var(--app-text-muted)' }}
          />
          <p style={{ color: 'var(--app-text-muted)' }}>No suggestions available</p>
          <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>
            AI will analyze patterns and suggest new chores for your household
          </p>
        </div>
      )}
    </div>
  );
}

function AutomationRulesTab({ householdId }: { householdId: string }) {
  const { data: rulesData, isLoading, error } = useAutomationRules(householdId);

  const rules = rulesData?.rules ?? [];
  const activeRules = rules.filter((r) => r.status === 'active');
  const pausedRules = rules.filter((r) => r.status === 'paused');
  const totalExecutions = rules.reduce((sum, r) => sum + r.executionCount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Automation Rules
        </h2>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: 'var(--app-accent)',
            color: 'white',
          }}
        >
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </div>

      {error && <ErrorBanner message="Failed to load automation rules." />}

      <div className="grid grid-cols-3 gap-4 mb-6">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          [
            { label: 'Active Rules', value: String(activeRules.length), icon: Play },
            { label: 'Paused', value: String(pausedRules.length), icon: Pause },
            { label: 'Executions', value: String(totalExecutions), icon: Zap },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" style={{ color: 'var(--app-accent)' }} />
                  <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
                    {stat.label}
                  </div>
                </div>
                <div className="text-2xl font-bold" style={{ color: 'var(--app-text)' }}>
                  {stat.value}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-medium" style={{ color: 'var(--app-text-muted)' }}>
          Trigger Types
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            'Chore Completed',
            'Chore Overdue',
            'Streak Reached',
            'Points Threshold',
            'Time Based',
            'Weather Change',
            'Member Available',
          ].map((trigger) => (
            <span
              key={trigger}
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: 'var(--app-surface-muted)',
                color: 'var(--app-text-muted)',
              }}
            >
              {trigger}
            </span>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : rules.length > 0 ? (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-4 rounded-lg"
              style={{ backgroundColor: 'var(--app-surface-muted)', border: '1px solid var(--app-border)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium" style={{ color: 'var(--app-text)' }}>
                  {rule.name}
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: rule.status === 'active' ? 'var(--app-accent-soft)' : 'var(--app-surface-muted)',
                    color: rule.status === 'active' ? 'var(--app-accent)' : 'var(--app-text-muted)',
                    border: rule.status !== 'active' ? '1px solid var(--app-border)' : 'none',
                  }}
                >
                  {rule.status}
                </span>
              </div>
              {rule.description && (
                <div className="text-sm mb-1" style={{ color: 'var(--app-text-muted)' }}>
                  {rule.description}
                </div>
              )}
              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--app-text-muted)' }}>
                <span>Trigger: {rule.trigger.type.replace(/_/g, ' ')}</span>
                <span>Runs: {rule.executionCount}</span>
                {rule.lastExecutedAt && (
                  <span>Last run: {new Date(rule.lastExecutedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="text-center py-12 rounded-lg"
          style={{ backgroundColor: 'var(--app-surface-muted)' }}
        >
          <Zap
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: 'var(--app-text-muted)' }}
          />
          <p style={{ color: 'var(--app-text-muted)' }}>No automation rules yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>
            Create rules to automate chore assignments, notifications, and rewards
          </p>
        </div>
      )}
    </div>
  );
}

function PredictiveAnalyticsTab({ householdId }: { householdId: string }) {
  const { data: predictionsData, isLoading: predictionsLoading, error: predictionsError } = usePredictions(householdId);
  const { data: insightsData, isLoading: insightsLoading } = usePredictiveInsights(householdId);
  const { data: analyticsConfig } = usePredictiveAnalyticsConfig(householdId);

  const isLoading = predictionsLoading || insightsLoading;
  const predictions = predictionsData?.predictions ?? [];
  const insights = insightsData?.insights ?? [];
  const avgConfidence = predictions.length > 0
    ? Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length * 100)
    : 0;
  const enabledTypes = analyticsConfig?.enabledTypes ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Predictive Analytics
        </h2>
      </div>

      {predictionsError && <ErrorBanner message="Failed to load predictive analytics." />}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          [
            { label: 'Active Predictions', value: String(predictions.length) },
            { label: 'Insights', value: String(insights.length) },
            { label: 'Accuracy', value: `${avgConfidence}%` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-lg"
              style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: 'var(--app-text)' }}>
                {stat.value}
              </div>
              <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
                {stat.label}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['Completion', 'Engagement', 'Workload', 'Streak Risk', 'Burnout Risk'].map((type) => {
          const typeKey = type.toLowerCase().replace(/ /g, '_');
          const isEnabled = enabledTypes.includes(typeKey as typeof enabledTypes[number]);
          return (
            <button
              key={type}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: isEnabled ? 'var(--app-accent-soft)' : 'var(--app-surface-muted)',
                color: isEnabled ? 'var(--app-accent)' : 'var(--app-text)',
                border: '1px solid var(--app-border)',
              }}
            >
              {type}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : insights.length > 0 ? (
        <div className="space-y-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="p-4 rounded-lg"
              style={{ backgroundColor: 'var(--app-surface-muted)', border: '1px solid var(--app-border)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium" style={{ color: 'var(--app-text)' }}>
                  {insight.title}
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: insight.severity === 'critical' ? '#fef2f2' : insight.severity === 'warning' ? '#fffbeb' : 'var(--app-accent-soft)',
                    color: insight.severity === 'critical' ? '#ef4444' : insight.severity === 'warning' ? '#f59e0b' : 'var(--app-accent)',
                  }}
                >
                  {insight.severity}
                </span>
              </div>
              <div className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
                {insight.description}
              </div>
              {insight.suggestedAction && (
                <div className="text-xs mt-1" style={{ color: 'var(--app-accent)' }}>
                  Suggested: {insight.suggestedAction}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          className="text-center py-12 rounded-lg"
          style={{ backgroundColor: 'var(--app-surface-muted)' }}
        >
          <TrendingUp
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: 'var(--app-text-muted)' }}
          />
          <p style={{ color: 'var(--app-text-muted)' }}>No predictions available</p>
          <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>
            Predictive analytics will identify trends and provide actionable insights
          </p>
        </div>
      )}
    </div>
  );
}

function NaturalLanguageTab({ householdId }: { householdId: string }) {
  const [command, setCommand] = useState('');
  const { data: historyData, isLoading: historyLoading } = useCommandHistory(householdId);
  const { data: capabilitiesData, isLoading: capsLoading } = useCommandCapabilities(householdId);
  const executeCommand = useExecuteCommand(householdId);

  const commandHistory = historyData?.commands ?? [];
  const capabilities = capabilitiesData?.capabilities ?? [];

  const handleSend = () => {
    if (!command.trim()) return;
    executeCommand.mutate({ input: command.trim() }, {
      onSuccess: () => setCommand(''),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Map category keys to display labels
  const categoryLabels: Record<string, string> = {
    chore_management: 'Chore Management',
    scheduling: 'Scheduling',
    reporting: 'Reporting',
    member_management: 'Member Management',
    settings: 'Settings',
  };

  // Fall back to hardcoded examples if capabilities API returns empty
  const displayCapabilities = capabilities.length > 0
    ? capabilities.map((cap) => ({
        category: categoryLabels[cap.category] ?? cap.category,
        examples: cap.examples,
      }))
    : [
        {
          category: 'Chore Management',
          examples: ['Assign dishes to Sarah', 'Mark vacuuming as complete'],
        },
        {
          category: 'Scheduling',
          examples: ['Schedule lawn mowing for Saturday', 'What chores are due today?'],
        },
        {
          category: 'Reporting',
          examples: ['How many chores completed this week?', 'Who has the most points?'],
        },
        {
          category: 'Member Management',
          examples: ['Add a new family member named Alex', 'Show all member profiles'],
        },
        {
          category: 'Settings',
          examples: ['Turn on dark mode', 'Enable notifications for overdue chores'],
        },
      ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Natural Language Commands
        </h2>
      </div>

      <div
        className="p-4 rounded-lg mb-6"
        style={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, e.g., 'Assign dishes to Sarah'"
            className="flex-1 px-4 py-2 rounded-lg"
            style={{
              backgroundColor: 'var(--app-surface-muted)',
              border: '1px solid var(--app-border)',
              color: 'var(--app-text)',
            }}
            disabled={executeCommand.isPending}
          />
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'var(--app-accent)',
              color: 'white',
            }}
            onClick={handleSend}
            disabled={executeCommand.isPending || !command.trim()}
          >
            {executeCommand.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send
          </button>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <h3 className="text-sm font-medium" style={{ color: 'var(--app-text-muted)' }}>
          Available Commands
        </h3>
        {capsLoading ? (
          <LoadingSpinner />
        ) : (
          displayCapabilities.map((group) => (
            <div
              key={group.category}
              className="p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--app-surface)',
                border: '1px solid var(--app-border)',
              }}
            >
              <div className="font-medium mb-2" style={{ color: 'var(--app-text)' }}>
                {group.category}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.examples.map((example) => (
                  <button
                    key={example}
                    onClick={() => setCommand(example)}
                    className="px-3 py-1 rounded-full text-xs transition-colors"
                    style={{
                      backgroundColor: 'var(--app-accent-soft)',
                      color: 'var(--app-accent)',
                    }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {historyLoading ? (
        <LoadingSpinner />
      ) : commandHistory.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium" style={{ color: 'var(--app-text-muted)' }}>
            Command History
          </h3>
          {commandHistory.map((cmd) => (
            <div
              key={cmd.id}
              className="p-4 rounded-lg"
              style={{ backgroundColor: 'var(--app-surface-muted)', border: '1px solid var(--app-border)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-sm" style={{ color: 'var(--app-text)' }}>
                  {cmd.input}
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: cmd.status === 'completed' ? 'var(--app-accent-soft)' : cmd.status === 'failed' ? '#fef2f2' : 'var(--app-surface-muted)',
                    color: cmd.status === 'completed' ? 'var(--app-accent)' : cmd.status === 'failed' ? '#ef4444' : 'var(--app-text-muted)',
                  }}
                >
                  {cmd.status}
                </span>
              </div>
              <div className="text-xs" style={{ color: 'var(--app-text-muted)' }}>
                {new Date(cmd.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="text-center py-12 rounded-lg"
          style={{ backgroundColor: 'var(--app-surface-muted)' }}
        >
          <MessageSquareText
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: 'var(--app-text-muted)' }}
          />
          <p style={{ color: 'var(--app-text-muted)' }}>No command history</p>
          <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>
            Use natural language to manage your household chores
          </p>
        </div>
      )}
    </div>
  );
}

export default function SmartAutomation() {
  const { householdId } = useParams<{ householdId: string }>();
  const [activeTab, setActiveTab] = useState<AutomationTab>('scheduling');

  const tabs: Array<{ id: AutomationTab; label: string; icon: typeof CalendarClock }> = [
    { id: 'scheduling', label: 'Schedule', icon: CalendarClock },
    { id: 'suggestions', label: 'AI Tips', icon: Lightbulb },
    { id: 'rules', label: 'Rules', icon: Zap },
    { id: 'predictions', label: 'Predict', icon: TrendingUp },
    { id: 'commands', label: 'Commands', icon: MessageSquareText },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--app-bg)' }}>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <Link
            to={`/households/${householdId}`}
            className="inline-flex items-center gap-2 mb-4 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--app-text-muted)' }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Household
          </Link>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--app-text)' }}>
            Smart Automation
          </h1>
          <p style={{ color: 'var(--app-text-muted)' }}>
            AI-powered scheduling, suggestions, automation rules, and predictive insights
          </p>
        </div>

        <div
          className="flex gap-2 mb-6 overflow-x-auto pb-2"
          style={{ borderBottom: '1px solid var(--app-border)' }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors"
                style={{
                  backgroundColor: isActive ? 'var(--app-surface)' : 'transparent',
                  color: isActive ? 'var(--app-accent)' : 'var(--app-text-muted)',
                  borderBottom: isActive ? '2px solid var(--app-accent)' : 'none',
                }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--app-surface)' }}>
          {activeTab === 'scheduling' && <SmartSchedulingTab householdId={householdId ?? ''} />}
          {activeTab === 'suggestions' && <AISuggestionsTab householdId={householdId ?? ''} />}
          {activeTab === 'rules' && <AutomationRulesTab householdId={householdId ?? ''} />}
          {activeTab === 'predictions' && <PredictiveAnalyticsTab householdId={householdId ?? ''} />}
          {activeTab === 'commands' && <NaturalLanguageTab householdId={householdId ?? ''} />}
        </div>
      </div>
    </div>
  );
}
