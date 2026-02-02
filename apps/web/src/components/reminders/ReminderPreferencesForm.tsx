import { useState, useEffect, useCallback } from 'react';
import { Bell, Clock, Moon, Save, RefreshCw, AlertCircle, Smartphone, Mail, MessageSquare, AppWindow } from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { ReminderPreferences, ReminderChannel, ReminderTiming } from '@chorechamp/types';

interface ReminderPreferencesFormProps {
  householdId: string;
  memberId: string;
  memberName: string;
  onSave?: () => void;
}

const CHANNEL_CONFIG: Record<ReminderChannel, { icon: React.ReactNode; label: string }> = {
  push: { icon: <Smartphone className="w-4 h-4" />, label: 'Push Notifications' },
  email: { icon: <Mail className="w-4 h-4" />, label: 'Email' },
  sms: { icon: <MessageSquare className="w-4 h-4" />, label: 'SMS' },
  in_app: { icon: <AppWindow className="w-4 h-4" />, label: 'In-App' },
};

const TIMING_OPTIONS: { value: ReminderTiming; label: string }[] = [
  { value: 'morning', label: 'Morning (8:00 AM)' },
  { value: 'afternoon', label: 'Afternoon (2:00 PM)' },
  { value: 'evening', label: 'Evening (6:00 PM)' },
  { value: 'before_due', label: 'Before Due Time' },
  { value: 'custom', label: 'Custom Time' },
];

export function ReminderPreferencesForm({
  householdId,
  memberId,
  memberName,
  onSave,
}: ReminderPreferencesFormProps) {
  const [preferences, setPreferences] = useState<ReminderPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getReminderPreferences(householdId, memberId);
      setPreferences(data);
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to load preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  }, [householdId, memberId]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updateField = <K extends keyof ReminderPreferences>(
    field: K,
    value: ReminderPreferences[K]
  ) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [field]: value });
    setHasChanges(true);
  };

  const toggleChannel = (channel: ReminderChannel) => {
    if (!preferences) return;
    const channels = preferences.channels.includes(channel)
      ? preferences.channels.filter((c) => c !== channel)
      : [...preferences.channels, channel];
    updateField('channels', channels);
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setIsSaving(true);
      setError(null);
      await apiClient.updateReminderPreferences(householdId, memberId, preferences);
      setHasChanges(false);
      onSave?.();
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !preferences) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={loadPreferences}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!preferences) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Reminder Preferences
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Settings for {memberName}
            </p>
          </div>
        </div>

        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Enable/Disable */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Enable Reminders</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive reminders for scheduled chores
            </p>
          </div>
          <button
            onClick={() => updateField('enabled', !preferences.enabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              preferences.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                preferences.enabled ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </label>
      </div>

      {preferences.enabled && (
        <>
          {/* Notification Channels */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              Notification Channels
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(CHANNEL_CONFIG) as [ReminderChannel, typeof CHANNEL_CONFIG[ReminderChannel]][]).map(
                ([channel, config]) => (
                  <label
                    key={channel}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      preferences.channels.includes(channel)
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={preferences.channels.includes(channel)}
                      onChange={() => toggleChannel(channel)}
                      className="sr-only"
                    />
                    <span
                      className={
                        preferences.channels.includes(channel)
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-400'
                      }
                    >
                      {config.icon}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{config.label}</span>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Default Timing */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Default Timing</h3>
            </div>
            <div className="space-y-2">
              {TIMING_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    preferences.defaultTiming === option.value
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="timing"
                    checked={preferences.defaultTiming === option.value}
                    onChange={() => updateField('defaultTiming', option.value)}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>

            {preferences.defaultTiming === 'custom' && (
              <div className="mt-3">
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Custom Time
                </label>
                <input
                  type="time"
                  value={preferences.customTime || '08:00'}
                  onChange={(e) => updateField('customTime', e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
            )}

            {preferences.defaultTiming === 'before_due' && (
              <div className="mt-3">
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Minutes Before Due
                </label>
                <select
                  value={preferences.beforeDueMinutes || 30}
                  onChange={(e) => updateField('beforeDueMinutes', Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            )}
          </div>

          {/* Quiet Hours */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Moon className="w-4 h-4 text-gray-400" />
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Quiet Hours</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              No reminders will be sent during these hours
            </p>
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Start
                </label>
                <input
                  type="time"
                  value={preferences.quietHoursStart || '21:00'}
                  onChange={(e) => updateField('quietHoursStart', e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <span className="text-gray-400">to</span>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  End
                </label>
                <input
                  type="time"
                  value={preferences.quietHoursEnd || '08:00'}
                  onChange={(e) => updateField('quietHoursEnd', e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Limits */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Daily Limit</h3>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Maximum reminders per day
              </label>
              <select
                value={preferences.maxPerDay}
                onChange={(e) => updateField('maxPerDay', Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value={3}>3 reminders</option>
                <option value={5}>5 reminders</option>
                <option value={10}>10 reminders</option>
                <option value={99}>Unlimited</option>
              </select>
            </div>
          </div>

          {/* Weekend Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <label className="flex items-center justify-between cursor-pointer mb-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Different Weekend Settings
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Use different timing on weekends
                </p>
              </div>
              <button
                onClick={() => updateField('weekendDifferent', !preferences.weekendDifferent)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  preferences.weekendDifferent ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    preferences.weekendDifferent ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </label>

            {preferences.weekendDifferent && (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Weekend Timing
                </label>
                <select
                  value={preferences.weekendTiming || 'morning'}
                  onChange={(e) => updateField('weekendTiming', e.target.value as ReminderTiming)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  {TIMING_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
