import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import { useHousehold, useMembers, useCreateChore } from '@chorechamp/api-client';
import type { CreateChoreRequest } from '@chorechamp/types';
import { ChoreForm } from '../components/chores/form';
import { Skeleton } from '../components/common';

export default function CreateChore() {
  const { householdId } = useParams<{ householdId: string }>();
  const navigate = useNavigate();

  const { data: household, isLoading: loadingHousehold } = useHousehold(householdId!);
  const { data: members, isLoading: loadingMembers } = useMembers(householdId!);
  const createChore = useCreateChore(householdId!);

  const isLoading = loadingHousehold || loadingMembers;

  const handleSubmit = async (data: CreateChoreRequest) => {
    await createChore.mutateAsync(data);
    navigate(`/households/${householdId}`);
  };

  const handleCancel = () => {
    navigate(`/households/${householdId}`);
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
        <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  if (!household || !members) {
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
            <h1 className="text-xl font-bold text-gray-900">Create New Chore</h1>
            <p className="text-sm text-gray-500">{household.name}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <div className="rounded-lg bg-white p-4 sm:p-6 shadow">
          <ChoreForm
            members={members}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={createChore.isPending}
          />
        </div>
      </main>
    </div>
  );
}
