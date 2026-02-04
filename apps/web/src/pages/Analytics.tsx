import { Link, useParams } from 'react-router-dom';
import { useHousehold } from '@chorechamp/api-client';
import { Skeleton } from '../components/common';
import { FamilyAnalyticsDashboard } from '../components/analytics';
import { FeatureGate } from '../components/subscription/FeatureGate';

export default function Analytics() {
  const { householdId } = useParams<{ householdId: string }>();
  const { data: household, isLoading } = useHousehold(householdId!);

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
          <Skeleton className="h-72 rounded-xl" />
        </main>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="text-center">
          <p className="text-gray-600">Household not found</p>
          <Link to="/dashboard" className="mt-4 inline-block text-sm text-blue-600">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <header className="border-b bg-[var(--app-surface)] shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
          <Link
            to={`/households/${householdId}`}
            className="text-gray-500 hover:text-gray-700"
          >
            ←
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500">{household.name}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <FeatureGate
          household={household}
          feature="advanced_analytics"
          preview={
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="h-4 w-24 rounded bg-gray-100" />
                  <div className="mt-3 h-6 w-16 rounded bg-gray-200" />
                  <div className="mt-3 h-2 w-full rounded bg-gray-100" />
                </div>
              ))}
            </div>
          }
        >
          <FamilyAnalyticsDashboard householdId={householdId!} />
        </FeatureGate>
      </main>
    </div>
  );
}
