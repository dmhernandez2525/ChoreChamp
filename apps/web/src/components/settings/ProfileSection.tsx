import { useState } from 'react';
import { Button } from '@chorechamp/ui';

interface ProfileSectionProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl?: string | null;
  };
  onUpdateProfile: (data: { name: string }) => Promise<void>;
}

const AVATAR_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#84CC16', // lime
  '#22C55E', // green
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
];

export function ProfileSection({ user, onUpdateProfile }: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setError('');
    setIsSaving(true);
    try {
      await onUpdateProfile({ name: name.trim() });
      setIsEditing(false);
    } catch {
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user.name || '');
    setIsEditing(false);
    setError('');
  };

  // Generate a deterministic color from user ID
  const avatarColor = AVATAR_COLORS[
    user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % AVATAR_COLORS.length
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
          <p className="mt-1 text-sm text-gray-500">
            Your personal information visible to other family members.
          </p>
        </div>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      <div className="mt-6 flex items-start gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-white"
            style={{ backgroundColor: avatarColor }}
          >
            {(user.name || user.email).charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Display Name
            </label>
            {isEditing ? (
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Your name"
              />
            ) : (
              <p className="mt-1 text-gray-900">{user.name || 'Not set'}</p>
            )}
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <p className="mt-1 text-gray-900">{user.email}</p>
            <p className="mt-1 text-xs text-gray-500">
              Email cannot be changed at this time.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
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
    </div>
  );
}
