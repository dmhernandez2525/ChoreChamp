import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { CalibrationSettings } from '@chorechamp/types';

interface CalibrationSettingsPanelProps {
  householdId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function CalibrationSettingsPanel({
  householdId,
  onClose,
  onSaved,
}: CalibrationSettingsPanelProps) {
  const [settings, setSettings] = useState<CalibrationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, [householdId]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getCalibrationSettings(householdId);
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      await apiClient.updateCalibrationSettings(householdId, {
        enabled: settings.enabled,
        autoApply: settings.autoApply,
        minCompletionsRequired: settings.minCompletionsRequired,
        calibrationFrequency: settings.calibrationFrequency,
        notifyOnSuggestion: settings.notifyOnSuggestion,
        pointsAdjustmentLimit: settings.pointsAdjustmentLimit,
        considerMemberAge: settings.considerMemberAge,
      });
      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Calibration Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-130px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : !settings ? (
            <div className="text-center py-8 text-red-600 dark:text-red-400">
              {error || 'Failed to load settings'}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Enable calibration */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Enable Calibration
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Analyze chore performance and suggest adjustments
                  </p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    settings.enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                      settings.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Auto-apply */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Auto-Apply Suggestions
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Automatically apply high-confidence suggestions
                  </p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, autoApply: !settings.autoApply })}
                  disabled={!settings.enabled}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
                    settings.autoApply ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                      settings.autoApply ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Min completions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Completions Required
                </label>
                <input
                  type="number"
                  value={settings.minCompletionsRequired}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      minCompletionsRequired: parseInt(e.target.value) || 5,
                    })
                  }
                  min={1}
                  max={50}
                  disabled={!settings.enabled}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Chores need at least this many completions before calibration
                </p>
              </div>

              {/* Calibration frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Calibration Frequency
                </label>
                <select
                  value={settings.calibrationFrequency}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      calibrationFrequency: e.target.value as 'weekly' | 'biweekly' | 'monthly',
                    })
                  }
                  disabled={!settings.enabled}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 Weeks</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Points adjustment limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Points Adjustment: {settings.pointsAdjustmentLimit}%
                </label>
                <input
                  type="range"
                  value={settings.pointsAdjustmentLimit}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pointsAdjustmentLimit: parseInt(e.target.value),
                    })
                  }
                  min={5}
                  max={50}
                  step={5}
                  disabled={!settings.enabled}
                  className="w-full disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Maximum percentage change allowed per calibration
                </p>
              </div>

              {/* Notify on suggestion */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Notify on Suggestions
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Get notified when new suggestions are available
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, notifyOnSuggestion: !settings.notifyOnSuggestion })
                  }
                  disabled={!settings.enabled}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
                    settings.notifyOnSuggestion ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                      settings.notifyOnSuggestion ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Consider member age */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Consider Member Age
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Factor in age when suggesting adjustments
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, considerMemberAge: !settings.considerMemberAge })
                  }
                  disabled={!settings.enabled}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
                    settings.considerMemberAge ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                      settings.considerMemberAge ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || isSaving || !settings}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
