import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import { useHousehold, useMembers, useChores, useUpdateChore } from '@chorechamp/api-client';
import type { CreateChoreRequest } from '@chorechamp/types';
import { ChoreForm } from '../components/chores/form';
import { Skeleton } from '../components/common';

export default function EditChore() {
  const { householdId, choreId } = useParams<{
    householdId: string;
    choreId: string;
  }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { data: household, isLoading: loadingHousehold } = useHousehold(householdId!);
  const { data: members, isLoading: loadingMembers } = useMembers(householdId!);
  const { data: chores, isLoading: loadingChores } = useChores(householdId!);
  const updateChore = useUpdateChore(householdId!);

  const chore = useMemo(() => {
    if (!chores || !choreId) return null;
    return chores.find((c) => c.id === choreId) || null;
  }, [chores, choreId]);

  const isLoading = loadingHousehold || loadingMembers || loadingChores;

  const handleSubmit = async (data: CreateChoreRequest) => {
    if (!choreId) return;
    setError(null);
    try {
      await updateChore.mutateAsync({ choreId, data });
      navigate(`/households/${householdId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update chore');
    }
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

  if (!household || !members || !chore) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">
            {!chore ? 'Chore not found' : 'Household not found'}
          </p>
          <Button asChild className="mt-4">
            <Link to={householdId ? `/households/${householdId}` : '/dashboard'}>
              Go Back
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Convert Chore to CreateChoreRequest format for form
  const initialData: Partial<CreateChoreRequest> = {
    title: chore.title,
    description: chore.description || undefined,
    icon: chore.icon,
    category: chore.category,
    pointValue: chore.pointValue,
    difficulty: chore.difficulty,
    assignmentType: chore.assignmentType,
    assignedTo: chore.assignedTo,
    recurrenceType: chore.recurrenceType,
    recurrenceDays: chore.recurrenceDays || undefined,
    recurrenceInterval: chore.recurrenceInterval || undefined,
    recurrenceAfterDays: chore.recurrenceAfterDays || undefined,
    startDate: chore.startDate,
    endDate: chore.endDate || undefined,
    dueTime: chore.dueTime || undefined,
    requiresApproval: chore.requiresApproval,
    requiresPhoto: chore.requiresPhoto,
    estimatedMinutes: chore.estimatedMinutes || undefined,
    showTimer: chore.showTimer,
    steps: chore.steps || undefined,
  };

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
            <h1 className="text-xl font-bold text-gray-900">Edit Chore</h1>
            <p className="text-sm text-gray-500">{household.name}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <div className="rounded-lg bg-white p-4 sm:p-6 shadow">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          <ChoreForm
            members={members}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={initialData}
            isSubmitting={updateChore.isPending}
            mode="edit"
          />
        </div>
      </main>
    </div>
  );
}
