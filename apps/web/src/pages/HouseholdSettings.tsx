import { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import { useHousehold, useMembers } from '@chorechamp/api-client';
import { useAuth } from '../context/AuthContext';
import { HouseholdSettingsSection } from '../components/settings';
import { Skeleton } from '../components/common';

export default function HouseholdSettings() {
  const { householdId } = useParams<{ householdId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: household, isLoading: loadingHousehold } = useHousehold(householdId!);
  const { data: members, isLoading: loadingMembers } = useMembers(householdId!);

  // Find current member to check if parent
  const currentMember = useMemo(() => {
    if (!members || !user) return null;
    return members.find((m) => m.userId === user.id) || null;
  }, [members, user]);

  const isParent = currentMember?.role === 'parent';
  const isLoading = loadingHousehold || loadingMembers;

  const handleUpdateSettings = async (settings: {
    name?: string;
    timezone?: string;
    weekStartsOn?: number;
    pointsName?: string;
  }) => {
    // TODO: Implement update household settings API call
    console.log('Update household settings:', settings);
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  const handleLeaveHousehold = async () => {
    // TODO: Implement leave household API call
    console.log('Leave household');
    await new Promise((resolve) => setTimeout(resolve, 500));
    navigate('/dashboard');
  };

  const handleDeleteHousehold = async () => {
    // TODO: Implement delete household API call
    console.log('Delete household');
    await new Promise((resolve) => setTimeout(resolve, 500));
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-40" />
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">
          <Skeleton className="h-64 w-full rounded-lg" />
        </main>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Household not found</p>
          <Button asChild className="mt-4">
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
          <Link
            to={`/households/${householdId}`}
            className="text-gray-500 hover:text-gray-700"
          >
            ←
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Household Settings</h1>
            <p className="text-sm text-gray-500">{household.name}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        <HouseholdSettingsSection
          household={household}
          isParent={isParent}
          onUpdateSettings={handleUpdateSettings}
          onLeaveHousehold={!isParent ? handleLeaveHousehold : undefined}
          onDeleteHousehold={isParent ? handleDeleteHousehold : undefined}
        />
      </main>
    </div>
  );
}
