import { useParams, Link } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import {
  useHousehold,
  useMembers,
  useGamificationStats,
  usePointTransactions,
} from '@chorechamp/api-client';
import {
  PointsBalanceCard,
  PointsHistory,
  StatsOverview,
} from '../components/rewards';
import { Skeleton } from '../components/common';

export default function MemberPoints() {
  const { householdId, memberId } = useParams<{
    householdId: string;
    memberId: string;
  }>();

  const { data: household, isLoading: loadingHousehold } = useHousehold(householdId!);
  const { data: members, isLoading: loadingMembers } = useMembers(householdId!);
  const { data: stats, isLoading: loadingStats } = useGamificationStats(
    householdId!,
    memberId!
  );
  const { data: transactions, isLoading: loadingTransactions } = usePointTransactions(
    householdId!,
    memberId!,
    { limit: 20 }
  );

  const member = members?.find((m) => m.id === memberId);
  const isLoading =
    loadingHousehold || loadingMembers || loadingStats || loadingTransactions;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-40 rounded-xl" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  if (!household || !member || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Member not found</p>
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
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/households/${householdId}`}
              className="text-gray-500 hover:text-gray-700"
            >
              ←
            </Link>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold"
                style={{ backgroundColor: member.color || '#3B82F6' }}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{member.name}</h1>
                <p className="text-sm text-gray-500">{household.name}</p>
              </div>
            </div>
          </div>

          <Button variant="outline" asChild>
            <Link to={`/households/${householdId}/rewards`}>Rewards Store</Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-6">
          {/* Points Balance */}
          <PointsBalanceCard
            currentPoints={stats.pointsCurrent}
            lifetimePoints={stats.pointsLifetime}
          />

          {/* Stats Overview */}
          <StatsOverview stats={stats} />

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to={`/households/${householdId}/members/${memberId}/badges`}>
                View Badges
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={`/households/${householdId}/leaderboard`}>
                View Leaderboard
              </Link>
            </Button>
          </div>

          {/* Transaction History */}
          <PointsHistory transactions={transactions || []} />
        </div>
      </main>
    </div>
  );
}
