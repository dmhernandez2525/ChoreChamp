import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import { useHousehold, useCreateReward, useRewards } from '@chorechamp/api-client';
import { RewardForm } from '../components/rewards';
import { Skeleton } from '../components/common';
import type { CreateRewardRequest } from '@chorechamp/types';
import { hasFeature } from '../lib/subscription';
import { useState } from 'react';

export default function CreateReward() {
  const { householdId } = useParams<{ householdId: string }>();
  const navigate = useNavigate();

  const { data: household, isLoading } = useHousehold(householdId!);
  const { data: rewards } = useRewards(householdId!);
  const createReward = useCreateReward(householdId!);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateRewardRequest) => {
    try {
      setError(null);
      if (!hasFeature(household, 'unlimited_rewards') && (rewards?.length || 0) >= 5) {
        setError('Free and Family plans can create up to 5 rewards. Upgrade to Premium for unlimited rewards.');
        return;
      }
      await createReward.mutateAsync(data);
      navigate(`/households/${householdId}/rewards`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create reward');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)]">
        <header className="border-b bg-[var(--app-surface)] shadow-sm">
          <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-4">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-40" />
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-8">
          <Skeleton className="h-96 rounded-lg" />
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

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      {/* Header */}
      <header className="border-b bg-[var(--app-surface)] shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-4">
          <Link
            to={`/households/${householdId}/rewards`}
            className="text-gray-500 hover:text-gray-700"
          >
            ←
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create Reward</h1>
            <p className="text-sm text-gray-500">{household.name}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        {!hasFeature(household, 'unlimited_rewards') && (rewards?.length || 0) >= 5 && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            Free and Family plans can create up to 5 rewards. Upgrade to Premium for unlimited rewards.
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="rounded-lg border border-gray-200 bg-[var(--app-surface)] p-6">
          <RewardForm
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/households/${householdId}/rewards`)}
            isSubmitting={createReward.isPending}
          />
        </div>
      </main>
    </div>
  );
}
