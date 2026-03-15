import { useParams, Link } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import {
  useHousehold,
  useMembers,
  useCurrentBossBattle,
  useBossBattleHistory,
  useBossBattleStats,
} from '@chorechamp/api-client';
import { useAuth } from '../context/AuthContext';
import {
  BossCard,
  FamilyGoalProgress,
  BossHistoryList,
  ContributionLeaderboard,
} from '../components/bossbattle';
import { Skeleton } from '../components/common';

export default function BossBattle() {
  const { householdId } = useParams<{ householdId: string }>();
  const { user } = useAuth();

  const { data: household, isLoading: loadingHousehold } = useHousehold(householdId!);
  const { data: members, isLoading: loadingMembers } = useMembers(householdId!);
  const { data: currentBoss, isLoading: loadingBoss } = useCurrentBossBattle(householdId!);
  const { data: bossHistory, isLoading: loadingHistory } = useBossBattleHistory(householdId!);
  const { data: battleStats, isLoading: loadingStats } = useBossBattleStats(householdId!);

  const currentMember = members?.find((m) => m.userId === user?.id);
  const isLoading = loadingHousehold || loadingMembers || loadingBoss || loadingHistory || loadingStats;

  const party = battleStats?.party ?? {
    householdId: householdId || '',
    healthCurrent: 0,
    healthMax: 100,
    weeklyGoal: 0,
    weeklyProgress: 0,
    bossActive: false,
    bossId: null,
  };

  const contributors = battleStats?.contributors ?? [];

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
            <Skeleton className="h-64 rounded-xl" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Skeleton className="h-48 rounded-lg" />
              <Skeleton className="h-48 rounded-lg" />
            </div>
          </div>
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
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/households/${householdId}`}
              className="text-gray-500 hover:text-gray-700"
            >
              ←
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Boss Battle</h1>
              <p className="text-sm text-gray-500">{household.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-6">
          {/* Current Boss */}
          {currentBoss ? (
            <BossCard boss={currentBoss} />
          ) : (
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-3xl mb-2">🎯</p>
              <h3 className="font-semibold text-gray-900">No Active Boss Battle</h3>
              <p className="mt-1 text-sm text-gray-500">
                Parents can start a new boss battle for the family to tackle together!
              </p>
              {currentMember?.role === 'parent' && (
                <Button className="mt-4">Start New Battle</Button>
              )}
            </div>
          )}

          {/* How it works banner */}
          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="font-semibold text-blue-900">How Boss Battles Work</h3>
            <ul className="mt-2 text-sm text-blue-700 space-y-1">
              <li>Complete chores to deal damage to the boss</li>
              <li>Each chore completion deals damage based on point value</li>
              <li>Work together as a family to defeat the boss before time runs out!</li>
              <li>Victory rewards bonus points split among all contributors</li>
            </ul>
          </div>

          {/* Two column layout */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Left column */}
            <div className="space-y-6">
              <FamilyGoalProgress party={party} />
              <ContributionLeaderboard
                contributors={contributors}
                currentUserId={currentMember?.id}
              />
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <BossHistoryList bosses={[...(currentBoss ? [currentBoss] : []), ...(bossHistory || [])]} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
