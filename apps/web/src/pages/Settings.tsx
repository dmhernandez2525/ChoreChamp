import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  useUpdateProfile,
  useChangePassword,
  useDeleteAccount,
} from '@chorechamp/api-client';
import {
  ProfileSection,
  SecuritySection,
  NotificationsSection,
} from '../components/settings';
import { Skeleton } from '../components/common';

type SettingsTab = 'profile' | 'notifications' | 'security';

const DEFAULT_NOTIFICATION_PREFS = {
  emailChoreReminders: true,
  emailWeeklySummary: true,
  emailStreakAlerts: true,
  emailBadgeEarned: true,
  pushEnabled: false,
  pushChoreReminders: true,
  pushApprovalRequests: true,
};

export default function Settings() {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [notificationPrefs, setNotificationPrefs] = useState(DEFAULT_NOTIFICATION_PREFS);

  // Mutations
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();

  // Handlers
  const handleUpdateProfile = async (data: { name: string }) => {
    await updateProfile.mutateAsync(data);
  };

  const handleChangePassword = async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    await changePassword.mutateAsync(data);
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    await deleteAccount.mutateAsync();
    await signOut();
    navigate('/');
  };

  const handleUpdateNotifications = async (
    preferences: typeof DEFAULT_NOTIFICATION_PREFS
  ) => {
    setNotificationPrefs(preferences);
    try {
      localStorage.setItem('cc_notification_prefs', JSON.stringify(preferences));
    } catch {
      // Ignore storage errors (private mode, etc.)
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cc_notification_prefs');
      if (stored) {
        const parsed = JSON.parse(stored) as typeof DEFAULT_NOTIFICATION_PREFS;
        setNotificationPrefs({ ...DEFAULT_NOTIFICATION_PREFS, ...parsed });
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)]">
        <header className="border-b bg-[var(--app-surface)] shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-32" />
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">
          <Skeleton className="h-64 w-full rounded-lg" />
        </main>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Security' },
  ];

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      {/* Header */}
      <header className="border-b bg-[var(--app-surface)] shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
            ←
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <ProfileSection user={user} onUpdateProfile={handleUpdateProfile} />
        )}

        {activeTab === 'notifications' && (
          <NotificationsSection
            preferences={notificationPrefs}
            onUpdatePreferences={handleUpdateNotifications}
          />
        )}

        {activeTab === 'security' && (
          <SecuritySection
            onChangePassword={handleChangePassword}
            onDeleteAccount={handleDeleteAccount}
          />
        )}
      </main>
    </div>
  );
}
