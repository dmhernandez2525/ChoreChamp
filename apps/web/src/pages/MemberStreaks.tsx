import { useParams, Link } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import {
  useHousehold,
  useMembers,
  useMemberStreak,
  useGamificationStats,
} from '@chorechamp/api-client';
import {
  StreakCard,
  StreakCalendar,
  StreakMilestones,
  StreakFreeze,
} from '../components/streaks';
import { Skeleton } from '../components/common';

const FREEZE_COST = 100;

export default function MemberStreaks() {
  const { householdId, memberId } = useParams<{
    householdId: string;
    memberId: string;
  }>();

  const { data: household, isLoading: loadingHousehold } = useHousehold(householdId!);
  const { data: members, isLoading: loadingMembers } = useMembers(householdId!);
  const { data: streakData, isLoading: loadingStreak } = useMemberStreak(
    householdId!,
    memberId!
  );
  const { data: stats } = useGamificationStats(householdId!, memberId!);

  const member = members?.find((m) => m.id === memberId);
  const isLoading = loadingHousehold || loadingMembers || loadingStreak;

  // Mock completed dates for calendar (in real app, this would come from API)
  const completedDates = generateMockCompletedDates(streakData?.current || 0);

  const handlePurchaseFreeze = () => {
    // In real app, this would call an API mutation
    console.log('Purchase freeze');
  };

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
            <Skeleton className="h-48 rounded-xl" />
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!household || !member || !streakData) {
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
              to={`/households/${householdId}/members/${memberId}/points`}
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
                <h1 className="text-xl font-bold text-gray-900">{member.name}'s Streak</h1>
                <p className="text-sm text-gray-500">{household.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-6">
          {/* Streak Card */}
          <StreakCard streakData={streakData} />

          {/* Two column layout */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left column */}
            <div className="space-y-6">
              {/* Calendar */}
              <StreakCalendar completedDates={completedDates} />

              {/* Streak Freeze */}
              <StreakFreeze
                freezesAvailable={streakData.freezesAvailable}
                freezesUsed={streakData.freezesUsed}
                currentPoints={stats?.pointsCurrent || 0}
                freezeCost={FREEZE_COST}
                onPurchase={handlePurchaseFreeze}
              />
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Milestones */}
              <StreakMilestones currentStreak={streakData.current} />
            </div>
          </div>

          {/* Streak Tips */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Streak Tips</h3>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <p className="font-medium text-gray-900">Set a reminder</p>
                  <p className="text-xs text-gray-500">
                    Complete at least one chore every day
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="font-medium text-gray-900">Start easy</p>
                  <p className="text-xs text-gray-500">
                    Pick a simple chore on busy days
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">❄️</span>
                <div>
                  <p className="font-medium text-gray-900">Use freezes wisely</p>
                  <p className="text-xs text-gray-500">
                    Save them for vacations or sick days
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper to generate mock completed dates for the current month
function generateMockCompletedDates(currentStreak: number): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = 0; i < currentStreak; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
}
