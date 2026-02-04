import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, cn } from '@chorechamp/ui';
import type { Household } from '@chorechamp/types';
import { THEMES, resolveThemeId } from '../../lib/themes';
import { FeatureGate } from '../subscription/FeatureGate';
import { hasFeature } from '../../lib/subscription';
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '@chorechamp/api-client';

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
    themeId?: string | null;
    brandingName?: string | null;
    brandingLogoUrl?: string | null;
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

  const [themeId, setThemeId] = useState(resolveThemeId(household.themeId));
  const [isThemeSaving, setIsThemeSaving] = useState(false);
  const [themeError, setThemeError] = useState('');

  const [brandingName, setBrandingName] = useState(household.brandingName || '');
  const [brandingLogoUrl, setBrandingLogoUrl] = useState(household.brandingLogoUrl || '');
  const [isBrandingSaving, setIsBrandingSaving] = useState(false);
  const [brandingError, setBrandingError] = useState('');

  const [apiKeyName, setApiKeyName] = useState('');
  const [apiKeyError, setApiKeyError] = useState('');
  const [newApiSecret, setNewApiSecret] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const canCustomizeThemes = hasFeature(household, 'custom_themes');
  const canWhiteLabel = hasFeature(household, 'white_label');
  const canApiAccess = hasFeature(household, 'api_access');
  const currentThemeName =
    THEMES.find((theme) => theme.id === resolveThemeId(household.themeId))?.name || THEMES[0].name;

  const { data: apiKeys } = useApiKeys(household.id, { enabled: canApiAccess });
  const createApiKey = useCreateApiKey(household.id);
  const revokeApiKey = useRevokeApiKey(household.id);

  const planLabelMap: Record<Household['subscriptionTier'], string> = {
    free: 'Free',
    family: 'Family',
    premium: 'Premium',
  };

  const statusLabelMap: Record<Household['subscriptionStatus'], string> = {
    free: 'Free',
    trialing: 'Trial',
    active: 'Active',
    past_due: 'Past Due',
    grace_period: 'Grace Period',
    canceled: 'Canceled',
    expired: 'Expired',
  };

  const planLabel = planLabelMap[household.subscriptionTier] ?? 'Free';
  const statusLabel = statusLabelMap[household.subscriptionStatus] ?? 'Free';
  const statusTone =
    household.subscriptionStatus === 'active' || household.subscriptionStatus === 'trialing'
      ? 'bg-emerald-100 text-emerald-700'
      : household.subscriptionStatus === 'grace_period' || household.subscriptionStatus === 'past_due'
        ? 'bg-amber-100 text-amber-700'
        : household.subscriptionStatus === 'canceled' || household.subscriptionStatus === 'expired'
          ? 'bg-red-100 text-red-700'
          : 'bg-gray-100 text-gray-700';

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
    } catch {
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
    setThemeId(resolveThemeId(household.themeId));
    setBrandingName(household.brandingName || '');
    setBrandingLogoUrl(household.brandingLogoUrl || '');
    setIsEditing(false);
    setError('');
  };

  const handleLeave = async () => {
    if (!onLeaveHousehold) return;
    setIsLeaving(true);
    try {
      await onLeaveHousehold();
    } catch {
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
    } catch {
      setError('Failed to delete household. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleApplyTheme = async () => {
    if (!isParent) return;
    setThemeError('');
    setIsThemeSaving(true);
    try {
      await onUpdateSettings({ themeId });
    } catch {
      setThemeError('Failed to update theme. Please try again.');
    } finally {
      setIsThemeSaving(false);
    }
  };

  const handleBrandingSave = async () => {
    if (!isParent) return;
    setBrandingError('');

    if (brandingLogoUrl) {
      try {
        // Basic URL validation
        new URL(brandingLogoUrl);
      } catch {
        setBrandingError('Please enter a valid logo URL.');
        return;
      }
    }

    setIsBrandingSaving(true);
    try {
      await onUpdateSettings({
        brandingName: brandingName.trim() || null,
        brandingLogoUrl: brandingLogoUrl.trim() || null,
      });
    } catch {
      setBrandingError('Failed to update branding. Please try again.');
    } finally {
      setIsBrandingSaving(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!isParent) return;
    if (!apiKeyName.trim()) {
      setApiKeyError('Please enter a name for the API key.');
      return;
    }
    setApiKeyError('');
    try {
      const response = await createApiKey.mutateAsync({ name: apiKeyName.trim() });
      setNewApiSecret(response.secret);
      setApiKeyName('');
    } catch (err) {
      setApiKeyError(err instanceof Error ? err.message : 'Failed to create API key.');
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    if (!isParent) return;
    try {
      await revokeApiKey.mutateAsync(keyId);
    } catch (err) {
      setApiKeyError(err instanceof Error ? err.message : 'Failed to revoke API key.');
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Plan:</span>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                {planLabel}
              </span>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusTone)}>
                {statusLabel}
              </span>
              {isParent && (
                <Button variant="outline" size="sm" asChild className="ml-auto">
                  <Link to={`/households/${household.id}/subscription`}>
                    Manage Subscription
                  </Link>
                </Button>
              )}
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

      {/* Appearance & Themes */}
      <FeatureGate
        household={household}
        feature="custom_themes"
        preview={
          <div className="grid gap-3 sm:grid-cols-2">
            {THEMES.slice(0, 4).map((theme) => (
              <div key={theme.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full" style={{ backgroundColor: theme.preview.primary }} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{theme.name}</p>
                    <p className="text-xs text-gray-500">{theme.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        }
      >
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Appearance & Themes</h3>
              <p className="mt-1 text-sm text-gray-500">
                Pick a look that matches your family vibe. Premium households can switch themes anytime.
              </p>
            </div>
            {!isParent && (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                Parent-only
              </span>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setThemeId(theme.id)}
                disabled={!isParent}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition',
                  themeId === theme.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300',
                  !isParent && 'cursor-not-allowed opacity-60'
                )}
              >
                <div className="h-10 w-10 rounded-full" style={{ backgroundColor: theme.preview.primary }} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{theme.name}</p>
                  <p className="text-xs text-gray-500">{theme.description}</p>
                </div>
              </button>
            ))}
          </div>

          {themeError && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {themeError}
            </div>
          )}

          {isParent && (
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={handleApplyTheme} disabled={isThemeSaving || !canCustomizeThemes}>
                {isThemeSaving ? 'Applying...' : 'Apply Theme'}
              </Button>
              <span className="text-xs text-gray-500">Current theme: {currentThemeName}</span>
            </div>
          )}
        </div>
      </FeatureGate>

      {/* White-label Branding */}
      {canWhiteLabel ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">White-label Branding</h3>
              <p className="mt-1 text-sm text-gray-500">
                Replace ChoreChamp branding with your household or organization identity.
              </p>
            </div>
            {!isParent && (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                Parent-only
              </span>
            )}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Brand Name</label>
              <input
                type="text"
                value={brandingName}
                onChange={(e) => setBrandingName(e.target.value)}
                placeholder="Johnson Home"
                disabled={!isParent}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Logo URL</label>
              <input
                type="url"
                value={brandingLogoUrl}
                onChange={(e) => setBrandingLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                disabled={!isParent}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {brandingError && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {brandingError}
            </div>
          )}

          {isParent && (
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={handleBrandingSave} disabled={isBrandingSaving}>
                {isBrandingSaving ? 'Saving...' : 'Save Branding'}
              </Button>
              <span className="text-xs text-gray-500">Enterprise branding enabled</span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h3 className="text-lg font-medium text-amber-900">White-label Branding</h3>
          <p className="mt-1 text-sm text-amber-700">
            White-label options are available for enterprise households. Contact sales to enable custom branding.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-4 border-amber-300 text-amber-700 hover:bg-amber-100">
            <Link to={`/households/${household.id}/support?topic=white-label`}>Contact Sales</Link>
          </Button>
        </div>
      )}

      {/* Developer API Access */}
      <FeatureGate
        household={household}
        feature="api_access"
        preview={
          <div className="space-y-2 text-sm text-amber-700">
            <p>Generate API keys for automations and integrations.</p>
            <div className="rounded-md border border-amber-200 bg-white px-3 py-2">
              cc_live_••••••••••••
            </div>
          </div>
        }
      >
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Developer API Access</h3>
              <p className="mt-1 text-sm text-gray-500">
                Manage API keys for third-party automations and power-user workflows.
              </p>
            </div>
            {!isParent && (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                Parent-only
              </span>
            )}
          </div>

          {newApiSecret && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <p className="font-medium">New API key created</p>
              <p className="mt-1 break-all font-mono text-xs">{newApiSecret}</p>
              <p className="mt-1 text-xs">Copy this key now. You will not be able to view it again.</p>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {apiKeys && apiKeys.length > 0 ? (
              apiKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{key.name}</p>
                    <p className="text-xs text-gray-500">Prefix: {key.keyPrefix}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {key.revokedAt ? (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Revoked</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRevokeApiKey(key.id)}
                        disabled={!isParent || revokeApiKey.isPending}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No API keys created yet.</p>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={apiKeyName}
              onChange={(e) => setApiKeyName(e.target.value)}
              placeholder="Key name (e.g., Zapier)"
              disabled={!isParent}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Button onClick={handleCreateApiKey} disabled={!isParent || createApiKey.isPending}>
              {createApiKey.isPending ? 'Creating...' : 'Create Key'}
            </Button>
          </div>

          {apiKeyError && (
            <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {apiKeyError}
            </div>
          )}
        </div>
      </FeatureGate>

      {/* Support */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Support & Help</h3>
            <p className="mt-1 text-sm text-gray-500">
              Need assistance? Start a support request or chat with our team.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/households/${household.id}/support`}>Open Support</Link>
          </Button>
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
