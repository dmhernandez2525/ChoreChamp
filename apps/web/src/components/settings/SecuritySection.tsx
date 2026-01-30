import { useState } from 'react';
import { Button } from '@chorechamp/ui';

interface SecuritySectionProps {
  onChangePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

export function SecuritySection({ onChangePassword, onDeleteAccount }: SecuritySectionProps) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError('Current password is required');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSaving(true);
    try {
      await onChangePassword({ currentPassword, newPassword });
      setSuccess('Password updated successfully');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Failed to change password. Please check your current password.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      await onDeleteAccount();
    } catch {
      setError('Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Password</h3>
            <p className="mt-1 text-sm text-gray-500">
              Update your password to keep your account secure.
            </p>
          </div>
          {!showPasswordForm && (
            <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>
              Change Password
            </Button>
          )}
        </div>

        {showPasswordForm && (
          <div className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                {success}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button onClick={handleChangePassword} disabled={isSaving}>
                {isSaving ? 'Updating...' : 'Update Password'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordForm(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setError('');
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Account */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium text-red-900">Delete Account</h3>
            <p className="mt-1 text-sm text-red-700">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          {!showDeleteConfirm && (
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </Button>
          )}
        </div>

        {showDeleteConfirm && (
          <div className="mt-6 space-y-4">
            <div className="rounded-md bg-red-100 p-4">
              <p className="text-sm font-medium text-red-900">
                Warning: This will permanently delete:
              </p>
              <ul className="mt-2 text-sm text-red-800 list-disc list-inside">
                <li>Your account and profile</li>
                <li>Your membership in all households</li>
                <li>All data associated with your account</li>
              </ul>
            </div>

            <div>
              <label
                htmlFor="deleteConfirm"
                className="block text-sm font-medium text-red-700"
              >
                Type DELETE to confirm
              </label>
              <input
                type="text"
                id="deleteConfirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="mt-1 block w-full rounded-md border border-red-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                placeholder="DELETE"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText !== 'DELETE'}
              >
                {isDeleting ? 'Deleting...' : 'Delete My Account'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                  setError('');
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
