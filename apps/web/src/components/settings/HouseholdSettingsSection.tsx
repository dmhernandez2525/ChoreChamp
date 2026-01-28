import { useState } from 'react';
import { Button, cn } from '@chorechamp/ui';
import type { Household } from '@chorechamp/types';

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'British Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Time (JST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern (AEST)' },
];

const WEEK_STARTS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
];

interface HouseholdSettingsSectionProps {
  household: Household;
  isParent: boolean;
  onUpdateSettings: (settings: {
    name?: string;
    timezone?: string;
    weekStartsOn?: number;
    pointsName?: string;
  }) => Promise<void>;
  onLeaveHousehold?: () => Promise<void>;
  onDeleteHousehold?: () => Promise<void>;
}

export function HouseholdSettingsSection({
  household,
  isParent,
  onUpdateSettings,
  onLeaveHousehold,
  onDeleteHousehold,
}: HouseholdSettingsSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: household.name,
    timezone: household.timezone,
    weekStartsOn: household.weekStartsOn,
    pointsName: household.pointsName,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Household name is required');
      return;
    }

    setError('');
    setIsSaving(true);
    try {
      await onUpdateSettings({
        name: formData.name.trim(),
        timezone: formData.timezone,
        weekStartsOn: formData.weekStartsOn,
        pointsName: formData.pointsName.trim() || 'Stars',
      });
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: household.name,
      timezone: household.timezone,
      weekStartsOn: household.weekStartsOn,
      pointsName: household.pointsName,
    });
    setIsEditing(false);
    setError('');
  };

  const handleLeave = async () => {
    if (!onLeaveHousehold) return;
    setIsLeaving(true);
    try {
      await onLeaveHousehold();
    } catch (err) {
      setError('Failed to leave household. Please try again.');
      setIsLeaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteHousehold || deleteConfirmText !== household.name) {
      setError('Please type the household name to confirm');
      return;
    }
    setIsDeleting(true);
    try {
      await onDeleteHousehold();
    } catch (err) {
      setError('Failed to delete household. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Household Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Household Settings</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isParent
                ? 'Manage your household settings and preferences.'
                : 'View your household settings. Only parents can make changes.'}
            </p>
          </div>
          {isParent && !isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {/* Household Name */}
          <div>
            <label
              htmlFor="householdName"
              className="block text-sm font-medium text-gray-700"
            >
              Household Name
            </label>
            {isEditing ? (
              <input
                type="text"
                id="householdName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <p className="mt-1 text-gray-900">{household.name}</p>
            )}
          </div>

          {/* Timezone */}
          <div>
            <label
              htmlFor="timezone"
              className="block text-sm font-medium text-gray-700"
            >
              Timezone
            </label>
            {isEditing ? (
              <select
                id="timezone"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-1 text-gray-900">
                {TIMEZONES.find((tz) => tz.value === household.timezone)?.label ||
                  household.timezone}
              </p>
            )}
          </div>

          {/* Week Starts On */}
          <div>
            <label
              htmlFor="weekStartsOn"
              className="block text-sm font-medium text-gray-700"
            >
              Week Starts On
            </label>
            {isEditing ? (
              <select
                id="weekStartsOn"
                value={formData.weekStartsOn}
                onChange={(e) =>
                  setFormData({ ...formData, weekStartsOn: parseInt(e.target.value) })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {WEEK_STARTS.map((ws) => (
                  <option key={ws.value} value={ws.value}>
                    {ws.label}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-1 text-gray-900">
                {WEEK_STARTS.find((ws) => ws.value === household.weekStartsOn)?.label}
              </p>
            )}
          </div>

          {/* Points Name */}
          <div>
            <label
              htmlFor="pointsName"
              className="block text-sm font-medium text-gray-700"
            >
              Points Name
            </label>
            {isEditing ? (
              <input
                type="text"
                id="pointsName"
                value={formData.pointsName}
                onChange={(e) => setFormData({ ...formData, pointsName: e.target.value })}
                placeholder="Stars"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <p className="mt-1 text-gray-900">{household.pointsName}</p>
            )}
            {isEditing && (
              <p className="mt-1 text-xs text-gray-500">
                What do you call points in your family? (e.g., Stars, Coins, Points)
              </p>
            )}
          </div>

          {/* Subscription Info */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Plan:</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  household.subscriptionTier === 'premium'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-700'
                )}
              >
                {household.subscriptionTier === 'premium' ? 'Premium' : 'Free'}
              </span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {/* Action buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Leave Household (non-parents only) */}
      {!isParent && onLeaveHousehold && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-medium text-orange-900">Leave Household</h3>
              <p className="mt-1 text-sm text-orange-700">
                Remove yourself from this household. You can rejoin later with an invite code.
              </p>
            </div>
            {!showLeaveConfirm && (
              <Button
                variant="outline"
                size="sm"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
                onClick={() => setShowLeaveConfirm(true)}
              >
                Leave
              </Button>
            )}
          </div>

          {showLeaveConfirm && (
            <div className="mt-4 flex gap-3">
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                onClick={handleLeave}
                disabled={isLeaving}
              >
                {isLeaving ? 'Leaving...' : 'Confirm Leave'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowLeaveConfirm(false)}
                disabled={isLeaving}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete Household (parents only) */}
      {isParent && onDeleteHousehold && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-medium text-red-900">Delete Household</h3>
              <p className="mt-1 text-sm text-red-700">
                Permanently delete this household and all its data. This action cannot be undone.
              </p>
            </div>
            {!showDeleteConfirm && (
              <Button
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </Button>
            )}
          </div>

          {showDeleteConfirm && (
            <div className="mt-4 space-y-4">
              <div className="rounded-md bg-red-100 p-4">
                <p className="text-sm font-medium text-red-900">
                  This will permanently delete:
                </p>
                <ul className="mt-2 text-sm text-red-800 list-disc list-inside">
                  <li>All household members</li>
                  <li>All chores and completion history</li>
                  <li>All rewards and badges earned</li>
                  <li>All invite codes</li>
                </ul>
              </div>

              <div>
                <label
                  htmlFor="deleteHouseholdConfirm"
                  className="block text-sm font-medium text-red-700"
                >
                  Type "{household.name}" to confirm
                </label>
                <input
                  type="text"
                  id="deleteHouseholdConfirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-red-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder={household.name}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleDelete}
                  disabled={isDeleting || deleteConfirmText !== household.name}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Household'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
