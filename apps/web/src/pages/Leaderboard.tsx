import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import { useHousehold, useMembers, useLeaderboard } from '@chorechamp/api-client';
import { useAuth } from '../context/AuthContext';
import {
  LeaderboardTable,
  LeaderboardPodium,
  PeriodSelector,
} from '../components/leaderboard';
import { Skeleton } from '../components/common';

type Period = 'week' | 'month' | 'all';

export default function Leaderboard() {
  const { householdId } = useParams<{ householdId: string }>();
  const { user } = useAuth();

  const [period, setPeriod] = useState<Period>('week');

  const { data: household, isLoading: loadingHousehold } = useHousehold(householdId!);
  const { data: members, isLoading: loadingMembers } = useMembers(householdId!);
  const { data: leaderboard, isLoading: loadingLeaderboard } = useLeaderboard(
    householdId!,
    period
  );

  const currentMember = members?.find((m) => m.userId === user?.id);
  const isLoading = loadingHousehold || loadingMembers || loadingLeaderboard;

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
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
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

  const periodLabels = {
    week: 'This Week',
    month: 'This Month',
    all: 'All Time',
  };

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
              <h1 className="text-xl font-bold text-gray-900">Leaderboard</h1>
              <p className="text-sm text-gray-500">{household.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-6">
          {/* Period Selector */}
          <PeriodSelector selected={period} onChange={setPeriod} />

          {/* Summary Banner */}
          <div className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
            <h2 className="text-2xl font-bold">{periodLabels[period]} Rankings</h2>
            <p className="mt-1 text-blue-100">
              {leaderboard?.length || 0} family members competing
            </p>
          </div>

          {/* Podium */}
          {leaderboard && leaderboard.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-center font-semibold text-gray-900 mb-6">Top 3</h3>
              <LeaderboardPodium
                entries={leaderboard}
                currentUserId={currentMember?.id}
              />
            </div>
          )}

          {/* Full Leaderboard */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Full Rankings</h3>
            <LeaderboardTable
              entries={leaderboard || []}
              currentUserId={currentMember?.id}
            />
          </div>

          {/* Stats Summary */}
          {leaderboard && leaderboard.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {leaderboard.reduce((sum, e) => sum + e.totalPoints, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Total Points Earned</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
                <p className="text-3xl font-bold text-green-600">
                  {leaderboard.reduce((sum, e) => sum + e.completedChores, 0)}
                </p>
                <p className="text-sm text-gray-500">Chores Completed</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {Math.round(
                    leaderboard.reduce((sum, e) => sum + e.totalPoints, 0) /
                      (leaderboard.length || 1)
                  ).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Avg Points/Member</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
