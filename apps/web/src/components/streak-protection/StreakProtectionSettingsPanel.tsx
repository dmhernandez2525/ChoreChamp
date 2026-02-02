import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { StreakProtectionSettings, StreakRiskLevel } from '@chorechamp/types';

interface StreakProtectionSettingsPanelProps {
  householdId: string;
  onClose: () => void;
  onSaved: () => void;
}

const RISK_LEVELS: { value: StreakRiskLevel; label: string }[] = [
  { value: 'safe', label: 'Safe (Very Cautious)' },
  { value: 'low', label: 'Low Risk' },
  { value: 'medium', label: 'Medium Risk' },
  { value: 'high', label: 'High Risk' },
  { value: 'critical', label: 'Critical Only' },
];

export function StreakProtectionSettingsPanel({
  householdId,
  onClose,
  onSaved,
}: StreakProtectionSettingsPanelProps) {
  const [settings, setSettings] = useState<StreakProtectionSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, [householdId]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getStreakProtectionSettings(householdId);
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
      await apiClient.updateStreakProtectionSettings(householdId, {
        enabled: settings.enabled,
        alertThreshold: settings.alertThreshold,
        autoFreeze: settings.autoFreeze,
        autoFreezeThreshold: settings.autoFreezeThreshold,
        reminderBuffer: settings.reminderBuffer,
        notifyParents: settings.notifyParents,
        weekendExempt: settings.weekendExempt,
        vacationMode: settings.vacationMode,
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
            Streak Protection Settings
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
              {/* Enable protection */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Enable Protection
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Predict and alert when streaks are at risk
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

              {/* Alert threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alert Threshold
                </label>
                <select
                  value={settings.alertThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      alertThreshold: e.target.value as StreakRiskLevel,
                    })
                  }
                  disabled={!settings.enabled}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                >
                  {RISK_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Show alerts when risk reaches this level
                </p>
              </div>

              {/* Auto freeze */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Auto-Use Freezes
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Automatically use freezes when risk is critical
                  </p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, autoFreeze: !settings.autoFreeze })}
                  disabled={!settings.enabled}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
                    settings.autoFreeze ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                      settings.autoFreeze ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Auto freeze threshold */}
              {settings.autoFreeze && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Auto-Freeze at Risk Score: {settings.autoFreezeThreshold}%
                  </label>
                  <input
                    type="range"
                    value={settings.autoFreezeThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        autoFreezeThreshold: parseInt(e.target.value),
                      })
                    }
                    min={60}
                    max={95}
                    step={5}
                    disabled={!settings.enabled}
                    className="w-full disabled:opacity-50"
                  />
                </div>
              )}

              {/* Reminder buffer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reminder Buffer: {settings.reminderBuffer} hours before midnight
                </label>
                <input
                  type="range"
                  value={settings.reminderBuffer}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      reminderBuffer: parseInt(e.target.value),
                    })
                  }
                  min={1}
                  max={8}
                  disabled={!settings.enabled}
                  className="w-full disabled:opacity-50"
                />
              </div>

              {/* Notify parents */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Notify Parents
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Alert parents when child streaks are at risk
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, notifyParents: !settings.notifyParents })
                  }
                  disabled={!settings.enabled}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
                    settings.notifyParents ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                      settings.notifyParents ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Weekend exempt */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Weekend Exempt
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Weekends don't count toward streak breaks
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, weekendExempt: !settings.weekendExempt })
                  }
                  disabled={!settings.enabled}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
                    settings.weekendExempt ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                      settings.weekendExempt ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Vacation mode */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Vacation Mode
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pause streak tracking temporarily
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, vacationMode: !settings.vacationMode })
                  }
                  disabled={!settings.enabled}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
                    settings.vacationMode ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                      settings.vacationMode ? 'translate-x-5' : 'translate-x-0'
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
