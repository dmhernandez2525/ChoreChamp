import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import { useHousehold, useCreateReward } from '@chorechamp/api-client';
import { RewardForm } from '../components/rewards';
import { Skeleton } from '../components/common';
import type { CreateRewardRequest } from '@chorechamp/types';

export default function CreateReward() {
  const { householdId } = useParams<{ householdId: string }>();
  const navigate = useNavigate();

  const { data: household, isLoading } = useHousehold(householdId!);
  const createReward = useCreateReward(householdId!);

  const handleSubmit = async (data: CreateRewardRequest) => {
    try {
      await createReward.mutateAsync(data);
      navigate(`/households/${householdId}/rewards`);
    } catch (error) {
      console.error('Failed to create reward:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white shadow-sm">
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
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
        <div className="rounded-lg border border-gray-200 bg-white p-6">
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
