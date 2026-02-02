import { useState } from 'react';
import { Shield, Eye, CheckCircle, Edit, Gift, Activity, Save, X } from 'lucide-react';
import type { CaregiverPermissions, Member } from '@chorechamp/types';
import { apiClient } from '@chorechamp/api-client';

interface CaregiverPermissionsEditorProps {
  member: Member;
  householdId: string;
  onUpdate?: (updatedMember: Member) => void;
  onClose?: () => void;
}

interface PermissionToggle {
  key: keyof CaregiverPermissions;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'view' | 'action';
}

const PERMISSION_TOGGLES: PermissionToggle[] = [
  {
    key: 'canViewChores',
    label: 'View Chores',
    description: 'See household chores and schedules',
    icon: <Eye className="w-4 h-4" />,
    category: 'view',
  },
  {
    key: 'canCompleteChores',
    label: 'Complete Chores',
    description: 'Mark chores as completed',
    icon: <CheckCircle className="w-4 h-4" />,
    category: 'action',
  },
  {
    key: 'canApproveChores',
    label: 'Approve Chores',
    description: 'Approve or reject chore completions',
    icon: <Shield className="w-4 h-4" />,
    category: 'action',
  },
  {
    key: 'canCreateChores',
    label: 'Create Chores',
    description: 'Add new chores to the household',
    icon: <Edit className="w-4 h-4" />,
    category: 'action',
  },
  {
    key: 'canEditChores',
    label: 'Edit Chores',
    description: 'Modify existing chores',
    icon: <Edit className="w-4 h-4" />,
    category: 'action',
  },
  {
    key: 'canViewPoints',
    label: 'View Points',
    description: 'See point balances and transactions',
    icon: <Eye className="w-4 h-4" />,
    category: 'view',
  },
  {
    key: 'canViewRewards',
    label: 'View Rewards',
    description: 'See available rewards',
    icon: <Gift className="w-4 h-4" />,
    category: 'view',
  },
  {
    key: 'canRedeemRewards',
    label: 'Redeem Rewards',
    description: 'Redeem rewards on behalf of children',
    icon: <Gift className="w-4 h-4" />,
    category: 'action',
  },
  {
    key: 'canViewActivity',
    label: 'View Activity',
    description: 'See household activity feed',
    icon: <Activity className="w-4 h-4" />,
    category: 'view',
  },
];

const DEFAULT_PERMISSIONS: CaregiverPermissions = {
  canViewChores: true,
  canCompleteChores: true,
  canApproveChores: false,
  canCreateChores: false,
  canEditChores: false,
  canViewPoints: true,
  canViewRewards: false,
  canRedeemRewards: false,
  canViewActivity: true,
};

export function CaregiverPermissionsEditor({
  member,
  householdId,
  onUpdate,
  onClose,
}: CaregiverPermissionsEditorProps) {
  const [permissions, setPermissions] = useState<CaregiverPermissions>(
    member.caregiverPermissions || DEFAULT_PERMISSIONS
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (member.role !== 'caregiver') {
    return null;
  }

  const handleToggle = (key: keyof CaregiverPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      const updated = await apiClient.updateCaregiverPermissions(
        householdId,
        member.id,
        permissions
      );
      onUpdate?.(updated);
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const viewPermissions = PERMISSION_TOGGLES.filter((p) => p.category === 'view');
  const actionPermissions = PERMISSION_TOGGLES.filter((p) => p.category === 'action');

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-md w-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: member.color }}
          >
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {member.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Caregiver Permissions
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* View Permissions */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            View Permissions
          </h4>
          <div className="space-y-2">
            {viewPermissions.map((perm) => (
              <label
                key={perm.key}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 dark:text-gray-400">
                    {perm.icon}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {perm.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {perm.description}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={permissions[perm.key]}
                  onChange={() => handleToggle(perm.key)}
                  className="w-5 h-5 text-indigo-600 rounded border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Action Permissions */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Action Permissions
          </h4>
          <div className="space-y-2">
            {actionPermissions.map((perm) => (
              <label
                key={perm.key}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 dark:text-gray-400">
                    {perm.icon}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {perm.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {perm.description}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={permissions[perm.key]}
                  onChange={() => handleToggle(perm.key)}
                  className="w-5 h-5 text-indigo-600 rounded border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
        {onClose && (
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Permissions'}
        </button>
      </div>
    </div>
  );
}
