import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import { DemoProvider, useDemo } from '../context/DemoContext';
import { useCelebration, CelebrationProvider } from '../components/celebrations';
import {
  ChorePreviewList,
  ChoreList,
  PendingApprovals,
  StatsCards,
  QuickStats,
} from '../components/chores';
import { NoChoresEmptyState } from '../components/common';
import type { DemoRole } from '../lib/demo-mode';

function DemoDashboardContent() {
  const { role } = useParams<{ role: DemoRole }>();
  const navigate = useNavigate();
  const {
    household,
    members,
    currentMember,
    selectedMemberId,
    setSelectedMemberId,
    getTodayChores,
    completeChore,
    approveChore,
    rejectChore,
    resetDemo,
  } = useDemo();

  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'approvals'>('today');
  const [completingChoreId, setCompletingChoreId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const { celebrateChoreCompleted } = useCelebration();

  // Set initial member based on role
  useEffect(() => {
    if (role === 'parent') {
      setSelectedMemberId('demo-parent');
    } else if (role === 'child') {
      // Select Emma (first child) for child demo
      setSelectedMemberId('demo-child-emma');
    }
  }, [role, setSelectedMemberId]);

  // Get chores for the view
  const todayChores = useMemo(() => {
    // Parents see all chores, children see their own
    return role === 'parent' ? getTodayChores() : getTodayChores(selectedMemberId);
  }, [role, selectedMemberId, getTodayChores]);

  // Check if current user is a parent
  const isParent = currentMember?.role === 'parent';

  // Count pending approvals
  const pendingApprovalsCount = useMemo(() => {
    return todayChores.filter(
      (c) => c.chore.requiresApproval && c.completion?.status === 'pending'
    ).length;
  }, [todayChores]);

  // Handlers
  const handleCompleteChore = async (choreId: string) => {
    setCompletingChoreId(choreId);
    try {
      await completeChore(choreId);
      const completedChore = todayChores.find((tc) => tc.id === choreId || tc.choreId === choreId);
      const points = completedChore?.chore.pointValue || 10;
      celebrateChoreCompleted(points, household.pointsName);
    } finally {
      setCompletingChoreId(null);
    }
  };

  const handleApprove = async (completionId: string) => {
    setApprovingId(completionId);
    try {
      await approveChore(completionId);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (completionId: string) => {
    setApprovingId(completionId);
    try {
      await rejectChore(completionId);
    } finally {
      setApprovingId(null);
    }
  };

  const handleExitDemo = () => {
    resetDemo();
    navigate('/');
  };

  // Get display member for child view, or parent for parent view
  const displayMember = useMemo(() => {
    if (!members) return null;
    return members.find((m) => m.id === selectedMemberId) || null;
  }, [members, selectedMemberId]);

  // For child role, show member selector among children
  const childMembers = useMemo(() => {
    return members.filter((m) => m.role === 'child' || m.role === 'teen');
  }, [members]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Mode Banner */}
      <div className="bg-blue-600 px-4 py-2 text-center text-sm text-white">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white"></span>
          Demo Mode - Viewing as {role === 'parent' ? 'Parent' : 'Child'}
          <button
            onClick={handleExitDemo}
            className="ml-4 rounded bg-white/20 px-2 py-0.5 hover:bg-white/30 transition-colors"
          >
            Exit Demo
          </button>
        </span>
      </div>

      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-500 hover:text-gray-700">
              <span className="text-2xl">🏆</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{household.name}</h1>
              {displayMember && <QuickStats member={displayMember} />}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Member selector for child view */}
            {role === 'child' && childMembers.length > 1 && (
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm"
              >
                {childMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
            {displayMember && (
              <div
                className="flex items-center gap-2 rounded-full px-3 py-1"
                style={{ backgroundColor: `${displayMember.color}20` }}
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: displayMember.color }}
                />
                <span className="text-sm font-medium">{displayMember.name}</span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={handleExitDemo}>
              Exit Demo
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Stats Cards */}
        <StatsCards
          todayChores={todayChores}
          currentMember={displayMember}
          isLoading={false}
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
              {todayChores.length > 0 && (
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
              {todayChores.length === 0 ? (
                <NoChoresEmptyState />
              ) : (
                <ChorePreviewList
                  chores={todayChores}
                  members={members}
                  onCompleteChore={handleCompleteChore}
                  isCompletingId={completingChoreId}
                />
              )}
            </>
          )}

          {activeTab === 'all' && (
            <ChoreList
              chores={todayChores}
              members={members}
              isLoading={false}
              onCompleteChore={handleCompleteChore}
              isCompletingId={completingChoreId}
            />
          )}

          {activeTab === 'approvals' && isParent && (
            <PendingApprovals
              chores={todayChores}
              members={members}
              onApprove={handleApprove}
              onReject={handleReject}
              isApproving={approvingId}
            />
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex flex-wrap gap-4">
          {isParent && (
            <>
              <Button variant="outline" disabled>
                + Add Chore (Demo)
              </Button>
              <Button variant="outline" disabled>
                Manage Family (Demo)
              </Button>
            </>
          )}
          <Link to={`/demo/${role}/rewards`}>
            <Button variant="outline">Rewards Store</Button>
          </Link>
          <Link to={`/demo/${role}/leaderboard`}>
            <Button variant="outline">Leaderboard</Button>
          </Link>
        </div>

        {/* Demo Info Card */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="text-lg font-semibold text-blue-900">Demo Mode Features</h3>
          <ul className="mt-4 space-y-2 text-sm text-blue-700">
            <li className="flex items-center gap-2">
              <span>-</span> Complete chores and earn points
            </li>
            <li className="flex items-center gap-2">
              <span>-</span> View streaks and achievements
            </li>
            {isParent && (
              <li className="flex items-center gap-2">
                <span>-</span> Approve or reject completed chores
              </li>
            )}
            <li className="flex items-center gap-2">
              <span>-</span> Check the leaderboard
            </li>
            <li className="flex items-center gap-2">
              <span>-</span> Browse the rewards store
            </li>
          </ul>
          <p className="mt-4 text-xs text-blue-600">
            Note: Changes made in demo mode are temporary and will reset when you exit.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function DemoDashboard() {
  return (
    <DemoProvider>
      <CelebrationProvider>
        <DemoDashboardContent />
      </CelebrationProvider>
    </DemoProvider>
  );
}
