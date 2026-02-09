import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import {
  useHousehold,
  useMembers,
  useTodaysChores,
  useCompleteChore,
  useApproveCompletion,
  useRejectCompletion,
} from '@chorechamp/api-client';
import { useAuth } from '../context/AuthContext';
import { useChoreStore } from '../stores/chore-store';
import { useCelebration } from '../components/celebrations';
import { hasFeature } from '../lib/subscription';
import {
  ChoreList,
  ChorePreviewList,
  ChoreDetailModal,
  PendingApprovals,
  StatsCards,
  QuickStats,
} from '../components/chores';
import { DashboardSkeleton, NoChoresEmptyState } from '../components/common';

export default function HouseholdDashboard() {
  const { householdId } = useParams<{ householdId: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'approvals'>('today');
  const [completingChoreId, setCompletingChoreId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Store
  const { setSelectedHousehold, setSelectedMember, selectedMemberId } = useChoreStore();

  // Queries
  const { data: household, isLoading: loadingHousehold } = useHousehold(householdId!);
  const { data: members, isLoading: loadingMembers } = useMembers(householdId!);
  const { data: todayChores, isLoading: loadingChores } = useTodaysChores(
    householdId!,
    selectedMemberId || undefined
  );

  // Mutations
  const completeChore = useCompleteChore(householdId!);
  const approveCompletion = useApproveCompletion(householdId!);
  const rejectCompletion = useRejectCompletion(householdId!);

  // Celebrations
  const { celebrateChoreCompleted } = useCelebration();

  // Find current member based on user
  const currentMember = useMemo(() => {
    if (!members || !user) return null;
    return members.find((m) => m.userId === user.id) || null;
  }, [members, user]);

  // Check if current user is a parent
  const isParent = currentMember?.role === 'parent';
  const canViewAnalytics = hasFeature(household, 'advanced_analytics');

  // Count pending approvals
  const pendingApprovalsCount = useMemo(() => {
    if (!todayChores) return 0;
    return todayChores.filter(
      (c) => c.chore.requiresApproval && c.completion?.status === 'pending'
    ).length;
  }, [todayChores]);

  // Set selected household/member on load
  useEffect(() => {
    if (householdId) {
      setSelectedHousehold(householdId);
    }
  }, [householdId, setSelectedHousehold]);

  useEffect(() => {
    if (currentMember) {
      setSelectedMember(currentMember.id);
    }
  }, [currentMember, setSelectedMember]);

  // Handlers
  const handleCompleteChore = async (choreId: string) => {
    if (!currentMember) return;

    setCompletingChoreId(choreId);
    try {
      await completeChore.mutateAsync({
        choreId,
        data: {},
      });

      // Find the chore to get its points value
      const completedChore = todayChores?.find((tc) => tc.chore.id === choreId);
      const points = completedChore?.chore.pointValue || 10;

      // Celebrate!
      celebrateChoreCompleted(points, household?.pointsName || 'Stars');
    } finally {
      setCompletingChoreId(null);
    }
  };

  const handleApprove = async (completionId: string) => {
    setApprovingId(completionId);
    try {
      await approveCompletion.mutateAsync(completionId);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (completionId: string, reason: string) => {
    setApprovingId(completionId);
    try {
      await rejectCompletion.mutateAsync({ completionId, reason });
    } finally {
      setApprovingId(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Loading state
  const isLoading = loadingHousehold || loadingMembers || loadingChores;

  if (isLoading && !household) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)]">
        <header className="border-b bg-[var(--app-surface)] shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)] flex items-center justify-center">
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
    <div className="min-h-screen bg-[var(--app-bg)]">
      {/* Header */}
      <header className="border-b bg-[var(--app-surface)] shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
              ←
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{household.name}</h1>
              {currentMember && <QuickStats member={currentMember} />}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {currentMember && (
              <div
                className="flex items-center gap-2 rounded-full px-3 py-1"
                style={{ backgroundColor: `${currentMember.color}20` }}
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: currentMember.color }}
                />
                <span className="text-sm font-medium">{currentMember.name}</span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        {/* Stats Cards */}
        <StatsCards
          todayChores={todayChores || []}
          currentMember={currentMember}
          isLoading={loadingChores}
        />

        {/* Tab Navigation */}
        <div className="mt-8 border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setActiveTab('today')}
              className={`border-b-2 py-4 text-sm font-medium transition-colors ${
                activeTab === 'today'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Today's Chores
              {todayChores && todayChores.length > 0 && (
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                  {todayChores.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`border-b-2 py-4 text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              All Chores
            </button>
            {isParent && (
              <button
                onClick={() => setActiveTab('approvals')}
                className={`flex items-center gap-2 border-b-2 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'approvals'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Approvals
                {pendingApprovalsCount > 0 && (
                  <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-xs text-white">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'today' && (
            <>
              {!todayChores || todayChores.length === 0 ? (
                <NoChoresEmptyState />
              ) : (
                <ChorePreviewList
                  chores={todayChores}
                  members={members || []}
                  onCompleteChore={handleCompleteChore}
                  isCompletingId={completingChoreId}
                />
              )}
            </>
          )}

          {activeTab === 'all' && (
            <ChoreList
              chores={todayChores || []}
              members={members || []}
              isLoading={loadingChores}
              onCompleteChore={handleCompleteChore}
              isCompletingId={completingChoreId}
            />
          )}

          {activeTab === 'approvals' && isParent && (
            <PendingApprovals
              chores={todayChores || []}
              members={members || []}
              onApprove={handleApprove}
              onReject={handleReject}
              isApproving={approvingId}
            />
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link to={`/households/${householdId}/chores/new`}>+ Add Chore</Link>
          </Button>
          {isParent && (
            <Button variant="outline" asChild>
              <Link to={`/households/${householdId}/members`}>Manage Family</Link>
            </Button>
          )}
          <div className="relative">
            <Button variant="outline" asChild>
              <Link to={`/households/${householdId}/analytics`}>Analytics</Link>
            </Button>
            {!canViewAnalytics && (
              <span className="absolute -right-2 -top-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                Premium
              </span>
            )}
          </div>
          <Button variant="outline" asChild>
            <Link to={`/households/${householdId}/settings`}>Settings</Link>
          </Button>
        </div>
      </main>

      {/* Chore Detail Modal */}
      <ChoreDetailModal
        chores={todayChores || []}
        members={members || []}
        onComplete={handleCompleteChore}
        isCompleting={!!completingChoreId}
      />
    </div>
  );
}
