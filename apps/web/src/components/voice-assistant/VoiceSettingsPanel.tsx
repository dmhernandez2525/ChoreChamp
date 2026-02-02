import { useState, useEffect } from 'react';
import { Settings, Volume2, Mic, AlertCircle, Check, Loader2 } from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { VoiceSettings } from '@chorechamp/types';

interface VoiceSettingsPanelProps {
  householdId: string;
}

const LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
];

const VOICE_SPEEDS: Array<{ value: VoiceSettings['voiceSpeed']; label: string }> = [
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast' },
];

export function VoiceSettingsPanel({ householdId }: VoiceSettingsPanelProps) {
  const [settings, setSettings] = useState<VoiceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [householdId]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getVoiceSettings(householdId);
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<VoiceSettings>) => {
    if (!settings) return;

    try {
      setIsSaving(true);
      setError(null);
      const updated = await apiClient.updateVoiceSettings(householdId, updates);
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const testVoice = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        'Hello! Your voice assistant is working correctly.'
      );
      utterance.lang = settings?.language || 'en-US';
      utterance.rate = settings?.voiceSpeed === 'slow' ? 0.7 : settings?.voiceSpeed === 'fast' ? 1.3 : 1;
      speechSynthesis.speak(utterance);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p>Unable to load voice settings</p>
        <button onClick={loadSettings} className="mt-2 text-indigo-600 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                Voice Settings
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Customize your voice assistant
              </p>
            </div>
          </div>

          {saveSuccess && (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Check className="w-4 h-4" />
              <span className="text-sm">Saved</span>
            </div>
          )}

          {isSaving && (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Settings */}
      <div className="p-4 space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mic className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                Voice Assistant
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enable voice commands
              </p>
            </div>
          </div>
          <button
            onClick={() => updateSettings({ enabled: !settings.enabled })}
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

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Language
          </label>
          <select
            value={settings.language}
            onChange={(e) => updateSettings({ language: e.target.value })}
            disabled={!settings.enabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Voice Speed */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Voice Speed
          </label>
          <div className="flex gap-2">
            {VOICE_SPEEDS.map((speed) => (
              <button
                key={speed.value}
                onClick={() => updateSettings({ voiceSpeed: speed.value })}
                disabled={!settings.enabled}
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
                  settings.voiceSpeed === speed.value
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-indigo-300'
                }`}
              >
                {speed.label}
              </button>
            ))}
          </div>
        </div>

        {/* Confirmation Required */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              Confirmation Required
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ask for confirmation before completing actions
            </p>
          </div>
          <button
            onClick={() =>
              updateSettings({ confirmationRequired: !settings.confirmationRequired })
            }
            disabled={!settings.enabled}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
              settings.confirmationRequired
                ? 'bg-indigo-600'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                settings.confirmationRequired ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Sound Effects */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              Sound Effects
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Play sounds for actions
            </p>
          </div>
          <button
            onClick={() => updateSettings({ soundEffects: !settings.soundEffects })}
            disabled={!settings.enabled}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
              settings.soundEffects ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                settings.soundEffects ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Test Voice */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={testVoice}
            disabled={!settings.enabled}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Volume2 className="w-4 h-4" />
            Test Voice Output
          </button>
        </div>
      </div>
    </div>
  );
}
