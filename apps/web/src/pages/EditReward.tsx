import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@chorechamp/ui';
import { useHousehold, useReward, useUpdateReward, useDeleteReward } from '@chorechamp/api-client';
import { RewardForm } from '../components/rewards';
import { Skeleton } from '../components/common';
import type { CreateRewardRequest } from '@chorechamp/types';

export default function EditReward() {
  const { householdId, rewardId } = useParams<{
    householdId: string;
    rewardId: string;
  }>();
  const navigate = useNavigate();

  const { data: household, isLoading: loadingHousehold } = useHousehold(householdId!);
  const { data: reward, isLoading: loadingReward } = useReward(householdId!, rewardId!);
  const updateReward = useUpdateReward(householdId!);
  const deleteReward = useDeleteReward(householdId!);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateRewardRequest) => {
    try {
      setError(null);
      await updateReward.mutateAsync({ rewardId: rewardId!, data });
      navigate(`/households/${householdId}/rewards`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update reward');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this reward? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      await deleteReward.mutateAsync(rewardId!);
      navigate(`/households/${householdId}/rewards`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete reward');
    }
  };

  const isLoading = loadingHousehold || loadingReward;

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

  if (!household || !reward) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="text-center">
          <p className="text-gray-600">Reward not found</p>
          <Button asChild className="mt-4">
            <Link to={`/households/${householdId}/rewards`}>Back to Rewards</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      {/* Header */}
      <header className="border-b bg-[var(--app-surface)] shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/households/${householdId}/rewards`}
              className="text-gray-500 hover:text-gray-700"
            >
              ←
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit Reward</h1>
              <p className="text-sm text-gray-500">{household.name}</p>
            </div>
          </div>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteReward.isPending}
          >
            {deleteReward.isPending ? 'Deleting...' : 'Delete Reward'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="rounded-lg border border-gray-200 bg-[var(--app-surface)] p-6">
          <RewardForm
            initialData={reward}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/households/${householdId}/rewards`)}
            isSubmitting={updateReward.isPending}
          />
        </div>
      </main>
    </div>
  );
}
