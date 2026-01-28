import { useState } from 'react';
import { Button, cn } from '@chorechamp/ui';
import type { NotificationType } from './NotificationCard';

interface NotificationPreference {
  type: NotificationType;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

interface NotificationPreferencesProps {
  onSave?: (preferences: NotificationPreference[]) => void;
  isLoading?: boolean;
}

const defaultPreferences: NotificationPreference[] = [
  {
    type: 'chore_reminder',
    label: 'Chore Reminders',
    description: 'Get reminded when chores are due or overdue',
    email: true,
    push: true,
    inApp: true,
  },
  {
    type: 'chore_completed',
    label: 'Chore Completions',
    description: 'When family members complete their chores',
    email: false,
    push: true,
    inApp: true,
  },
  {
    type: 'approval_needed',
    label: 'Approval Requests',
    description: 'When a chore needs your approval',
    email: true,
    push: true,
    inApp: true,
  },
  {
    type: 'reward_redeemed',
    label: 'Reward Redemptions',
    description: 'When rewards are redeemed or fulfilled',
    email: false,
    push: true,
    inApp: true,
  },
  {
    type: 'badge_earned',
    label: 'Badge Achievements',
    description: 'When you or family members earn badges',
    email: false,
    push: true,
    inApp: true,
  },
  {
    type: 'streak_at_risk',
    label: 'Streak Warnings',
    description: 'When your streak is about to break',
    email: true,
    push: true,
    inApp: true,
  },
  {
    type: 'boss_battle',
    label: 'Boss Battle Updates',
    description: 'Progress and completion of family challenges',
    email: false,
    push: true,
    inApp: true,
  },
  {
    type: 'family_goal',
    label: 'Family Goals',
    description: 'Updates on shared family objectives',
    email: false,
    push: true,
    inApp: true,
  },
];

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        checked ? 'bg-blue-600' : 'bg-gray-200',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

export function NotificationPreferences({ onSave, isLoading }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreference[]>(defaultPreferences);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const updatePreference = (
    type: NotificationType,
    channel: 'email' | 'push' | 'inApp',
    value: boolean
  ) => {
    setPreferences((prev) =>
      prev.map((pref) => (pref.type === type ? { ...pref, [channel]: value } : pref))
    );
  };

  const handleSave = () => {
    onSave?.(preferences);
  };

  return (
    <div className="space-y-6">
      {/* Global settings */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Global Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Push Notifications</p>
              <p className="text-sm text-gray-500">Receive notifications on your device</p>
            </div>
            <Toggle checked={pushEnabled} onChange={setPushEnabled} label="Toggle push notifications" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
            <Toggle checked={emailEnabled} onChange={setEmailEnabled} label="Toggle email notifications" />
          </div>
        </div>
      </div>

      {/* Per-notification settings */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900">Notification Types</h3>
          <p className="text-sm text-gray-500 mt-1">
            Choose how you want to be notified for each type
          </p>
        </div>

        {/* Header */}
        <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-1">Type</div>
          <div className="text-center">In-App</div>
          <div className="text-center">Push</div>
          <div className="text-center">Email</div>
        </div>

        {/* Preferences list */}
        <div className="divide-y divide-gray-100">
          {preferences.map((pref) => (
            <div key={pref.type} className="grid grid-cols-4 gap-4 px-4 py-4 items-center">
              <div className="col-span-1">
                <p className="font-medium text-gray-900 text-sm">{pref.label}</p>
                <p className="text-xs text-gray-500">{pref.description}</p>
              </div>
              <div className="flex justify-center">
                <Toggle
                  checked={pref.inApp}
                  onChange={(value) => updatePreference(pref.type, 'inApp', value)}
                  label={`${pref.label} in-app notifications`}
                />
              </div>
              <div className="flex justify-center">
                <Toggle
                  checked={pref.push && pushEnabled}
                  onChange={(value) => updatePreference(pref.type, 'push', value)}
                  disabled={!pushEnabled}
                  label={`${pref.label} push notifications`}
                />
              </div>
              <div className="flex justify-center">
                <Toggle
                  checked={pref.email && emailEnabled}
                  onChange={(value) => updatePreference(pref.type, 'email', value)}
                  disabled={!emailEnabled}
                  label={`${pref.label} email notifications`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
