import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import {
  useHousehold,
  useMembers,
  useRewards,
  useGamificationStats,
  useRedeemReward,
  usePendingRedemptions,
  useApproveRedemption,
  useFulfillRedemption,
  useRejectRedemption,
} from '@chorechamp/api-client';
import { useAuth } from '../context/AuthContext';
import {
  PointsDisplay,
  RewardsList,
  RedeemRewardModal,
  PendingRedemptions,
} from '../components/rewards';
import { Skeleton } from '../components/common';
import type { Reward } from '@chorechamp/types';
import { hasFeature } from '../lib/subscription';

export default function RewardsStore() {
  const { householdId } = useParams<{ householdId: string }>();
  const { user } = useAuth();

  const { data: household, isLoading: loadingHousehold } = useHousehold(householdId!);
  const { data: members, isLoading: loadingMembers } = useMembers(householdId!);
  const { data: rewards, isLoading: loadingRewards } = useRewards(householdId!);
  const { data: pendingRedemptions } = usePendingRedemptions(householdId!);

  // Get current member
  const currentMember = members?.find((m) => m.userId === user?.id);
  const isParent = currentMember?.role === 'parent';

  // Stats for current member
  const { data: stats } = useGamificationStats(
    householdId!,
    currentMember?.id || ''
  );

  // Mutations
  const redeemReward = useRedeemReward(householdId!);
  const approveRedemption = useApproveRedemption(householdId!);
  const fulfillRedemption = useFulfillRedemption(householdId!);
  const rejectRedemption = useRejectRedemption(householdId!);

  // Modal state
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'store' | 'pending'>('store');

  const handleRedeem = async (notes?: string) => {
    if (!selectedReward || !currentMember) return;

    setRedeemingId(selectedReward.id);
    try {
      setError(null);
      await redeemReward.mutateAsync({
        rewardId: selectedReward.id,
        memberId: currentMember.id,
        notes,
      });
      setSelectedReward(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to redeem reward');
    } finally {
      setRedeemingId(null);
    }
  };

  const handleApprove = async (redemptionId: string) => {
    setProcessingId(redemptionId);
    try {
      setError(null);
      await approveRedemption.mutateAsync(redemptionId);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to approve redemption');
    } finally {
      setProcessingId(null);
    }
  };

  const handleFulfill = async (redemptionId: string) => {
    setProcessingId(redemptionId);
    try {
      setError(null);
      await fulfillRedemption.mutateAsync(redemptionId);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fulfill redemption');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (redemptionId: string, reason: string) => {
    setProcessingId(redemptionId);
    try {
      setError(null);
      await rejectRedemption.mutateAsync({ redemptionId, reason });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reject redemption');
    } finally {
      setProcessingId(null);
    }
  };

  const isLoading = loadingHousehold || loadingMembers || loadingRewards;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)]">
        <header className="border-b bg-[var(--app-surface)] shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="text-center">
          <p className="text-gray-600">Household not found</p>
          <Button asChild className="mt-4">
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const pendingCount =
    pendingRedemptions?.filter((r) => r.status === 'pending' || r.status === 'approved')
      .length || 0;

  const canCreateUnlimitedRewards = hasFeature(household, 'unlimited_rewards');
  const rewardLimitReached = !canCreateUnlimitedRewards && (rewards?.length || 0) >= 5;

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      {/* Header */}
      <header className="border-b bg-[var(--app-surface)] shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/households/${householdId}`}
              className="text-gray-500 hover:text-gray-700"
            >
              ←
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Rewards Store</h1>
              <p className="text-sm text-gray-500">{household.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Points Balance */}
            <div className="rounded-lg bg-yellow-50 px-4 py-2">
              <p className="text-xs text-yellow-600 font-medium">Your Balance</p>
              <PointsDisplay points={stats?.pointsCurrent || 0} size="lg" />
            </div>

            {isParent && (
              <div className="flex flex-col items-end gap-2">
                <Button asChild disabled={rewardLimitReached}>
                  <Link to={`/households/${householdId}/rewards/new`}>
                    Create Reward
                  </Link>
                </Button>
                {rewardLimitReached && (
                  <Link
                    to={`/households/${householdId}/subscription`}
                    className="text-xs text-amber-700 underline"
                  >
                    Upgrade for unlimited rewards
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs for parents */}
        {isParent && (
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex gap-4 border-t">
              <button
                onClick={() => setActiveTab('store')}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'store'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Rewards Store
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Pending Redemptions
                {pendingCount > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {rewardLimitReached && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            Free and Family plans can create up to 5 rewards. Upgrade to Premium for unlimited rewards.
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {activeTab === 'store' ? (
          <RewardsList
            rewards={rewards || []}
            currentPoints={stats?.pointsCurrent || 0}
            onRedeem={(rewardId) => {
              const reward = rewards?.find((r) => r.id === rewardId);
              if (reward) setSelectedReward(reward);
            }}
            onEdit={
              isParent
                ? (rewardId) => {
                    window.location.href = `/households/${householdId}/rewards/${rewardId}/edit`;
                  }
                : undefined
            }
            redeemingId={redeemingId}
            isParent={isParent}
          />
        ) : (
          <PendingRedemptions
            redemptions={pendingRedemptions || []}
            members={members || []}
            rewards={rewards || []}
            onApprove={handleApprove}
            onReject={handleReject}
            onFulfill={handleFulfill}
            isProcessing={processingId}
          />
        )}
      </main>

      {/* Redeem Modal */}
      <RedeemRewardModal
        reward={selectedReward}
        currentPoints={stats?.pointsCurrent || 0}
        onClose={() => setSelectedReward(null)}
        onConfirm={handleRedeem}
        isRedeeming={redeemingId === selectedReward?.id}
      />
    </div>
  );
}
