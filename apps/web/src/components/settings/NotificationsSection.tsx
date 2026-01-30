import { useState } from 'react';
import { Button } from '@chorechamp/ui';

interface NotificationPreferences {
  emailChoreReminders: boolean;
  emailWeeklySummary: boolean;
  emailStreakAlerts: boolean;
  emailBadgeEarned: boolean;
  pushEnabled: boolean;
  pushChoreReminders: boolean;
  pushApprovalRequests: boolean;
}

interface NotificationsSectionProps {
  preferences: NotificationPreferences;
  onUpdatePreferences: (preferences: NotificationPreferences) => Promise<void>;
}

export function NotificationsSection({
  preferences,
  onUpdatePreferences,
}: NotificationsSectionProps) {
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleToggle = (key: keyof NotificationPreferences) => {
    setLocalPrefs((prev) => {
      const newPrefs = { ...prev, [key]: !prev[key] };
      setHasChanges(JSON.stringify(newPrefs) !== JSON.stringify(preferences));
      return newPrefs;
    });
    setSuccess('');
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setIsSaving(true);
    try {
      await onUpdatePreferences(localPrefs);
      setHasChanges(false);
      setSuccess('Notification preferences saved');
    } catch {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalPrefs(preferences);
    setHasChanges(false);
    setError('');
    setSuccess('');
  };

  const Toggle = ({
    checked,
    onChange,
    id,
  }: {
    checked: boolean;
    onChange: () => void;
    id: string;
  }) => (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
        <p className="mt-1 text-sm text-gray-500">
          Choose which emails you'd like to receive.
        </p>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label
                htmlFor="emailChoreReminders"
                className="text-sm font-medium text-gray-900"
              >
                Chore Reminders
              </label>
              <p className="text-sm text-gray-500">
                Get reminded about upcoming and overdue chores
              </p>
            </div>
            <Toggle
              id="emailChoreReminders"
              checked={localPrefs.emailChoreReminders}
              onChange={() => handleToggle('emailChoreReminders')}
            />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <label
                htmlFor="emailWeeklySummary"
                className="text-sm font-medium text-gray-900"
              >
                Weekly Summary
              </label>
              <p className="text-sm text-gray-500">
                Receive a weekly report of your family's progress
              </p>
            </div>
            <Toggle
              id="emailWeeklySummary"
              checked={localPrefs.emailWeeklySummary}
              onChange={() => handleToggle('emailWeeklySummary')}
            />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <label
                htmlFor="emailStreakAlerts"
                className="text-sm font-medium text-gray-900"
              >
                Streak Alerts
              </label>
              <p className="text-sm text-gray-500">
                Get notified when your streak is about to break
              </p>
            </div>
            <Toggle
              id="emailStreakAlerts"
              checked={localPrefs.emailStreakAlerts}
              onChange={() => handleToggle('emailStreakAlerts')}
            />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <label
                htmlFor="emailBadgeEarned"
                className="text-sm font-medium text-gray-900"
              >
                Badge Notifications
              </label>
              <p className="text-sm text-gray-500">
                Celebrate when you or family members earn badges
              </p>
            </div>
            <Toggle
              id="emailBadgeEarned"
              checked={localPrefs.emailBadgeEarned}
              onChange={() => handleToggle('emailBadgeEarned')}
            />
          </div>
        </div>
      </div>

      {/* Push Notifications */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-medium text-gray-900">Push Notifications</h3>
        <p className="mt-1 text-sm text-gray-500">
          Real-time notifications on your device.
        </p>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label
                htmlFor="pushEnabled"
                className="text-sm font-medium text-gray-900"
              >
                Enable Push Notifications
              </label>
              <p className="text-sm text-gray-500">
                Allow ChoreChamp to send notifications to this device
              </p>
            </div>
            <Toggle
              id="pushEnabled"
              checked={localPrefs.pushEnabled}
              onChange={() => handleToggle('pushEnabled')}
            />
          </div>

          {localPrefs.pushEnabled && (
            <>
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <label
                    htmlFor="pushChoreReminders"
                    className="text-sm font-medium text-gray-900"
                  >
                    Chore Reminders
                  </label>
                  <p className="text-sm text-gray-500">
                    Get push notifications for chore deadlines
                  </p>
                </div>
                <Toggle
                  id="pushChoreReminders"
                  checked={localPrefs.pushChoreReminders}
                  onChange={() => handleToggle('pushChoreReminders')}
                />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <label
                    htmlFor="pushApprovalRequests"
                    className="text-sm font-medium text-gray-900"
                  >
                    Approval Requests
                  </label>
                  <p className="text-sm text-gray-500">
                    Notify when a chore needs your approval (parents only)
                  </p>
                </div>
                <Toggle
                  id="pushApprovalRequests"
                  checked={localPrefs.pushApprovalRequests}
                  onChange={() => handleToggle('pushApprovalRequests')}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error/Success messages */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Save button */}
      {hasChanges && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      )}
    </div>
  );
}
