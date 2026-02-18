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
} from 'lucide-react';

type AutomationTab = 'scheduling' | 'suggestions' | 'rules' | 'predictions' | 'commands';

function SmartSchedulingTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Smart Scheduling
        </h2>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: 'var(--app-accent)',
            color: 'white',
          }}
        >
          <Play className="w-4 h-4" />
          Optimize Now
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Strategy', value: 'Balanced' },
          { label: 'Max/Day', value: '5' },
          { label: 'Score', value: '0%' },
          { label: 'Conflicts', value: '0' },
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
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['Balanced', 'Efficiency', 'Fairness', 'Preference'].map((strategy) => (
          <button
            key={strategy}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: strategy === 'Balanced' ? 'var(--app-accent-soft)' : 'var(--app-surface-muted)',
              color: strategy === 'Balanced' ? 'var(--app-accent)' : 'var(--app-text)',
              border: '1px solid var(--app-border)',
            }}
          >
            {strategy}
          </button>
        ))}
      </div>

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
    </div>
  );
}

function AISuggestionsTab() {
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pending', value: '0' },
          { label: 'Accepted', value: '0' },
          { label: 'Dismissed', value: '0' },
          { label: 'Accuracy', value: '0%' },
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
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['Pattern Analysis', 'Seasonal', 'Weather', 'Household Profile', 'Member Growth'].map(
          (source) => (
            <button
              key={source}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--app-surface-muted)',
                color: 'var(--app-text)',
                border: '1px solid var(--app-border)',
              }}
            >
              {source}
            </button>
          )
        )}
      </div>

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
    </div>
  );
}

function AutomationRulesTab() {
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

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Active Rules', value: '0', icon: Play },
          { label: 'Paused', value: '0', icon: Pause },
          { label: 'Executions', value: '0', icon: Zap },
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
        })}
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
    </div>
  );
}

function PredictiveAnalyticsTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--app-text)' }}>
          Predictive Analytics
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Active Predictions', value: '0' },
          { label: 'Insights', value: '0' },
          { label: 'Accuracy', value: '0%' },
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
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['Completion', 'Engagement', 'Workload', 'Streak Risk', 'Burnout Risk'].map((type) => (
          <button
            key={type}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--app-surface-muted)',
              color: 'var(--app-text)',
              border: '1px solid var(--app-border)',
            }}
          >
            {type}
          </button>
        ))}
      </div>

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
    </div>
  );
}

function NaturalLanguageTab() {
  const [command, setCommand] = useState('');

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
            placeholder="Type a command, e.g., 'Assign dishes to Sarah'"
            className="flex-1 px-4 py-2 rounded-lg"
            style={{
              backgroundColor: 'var(--app-surface-muted)',
              border: '1px solid var(--app-border)',
              color: 'var(--app-text)',
            }}
          />
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: 'var(--app-accent)',
              color: 'white',
            }}
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <h3 className="text-sm font-medium" style={{ color: 'var(--app-text-muted)' }}>
          Available Commands
        </h3>
        {[
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
        ].map((group) => (
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
        ))}
      </div>

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
    </div>
  );
}

export default function SmartAutomation() {
  const { householdId } = useParams();
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
          {activeTab === 'scheduling' && <SmartSchedulingTab />}
          {activeTab === 'suggestions' && <AISuggestionsTab />}
          {activeTab === 'rules' && <AutomationRulesTab />}
          {activeTab === 'predictions' && <PredictiveAnalyticsTab />}
          {activeTab === 'commands' && <NaturalLanguageTab />}
        </div>
      </div>
    </div>
  );
}
