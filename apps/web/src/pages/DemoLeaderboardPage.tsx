import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import { DemoProvider, useDemo } from '../context/DemoContext';
import { useDemoAuth } from '../context/DemoAuthContext';
import { DemoBanner } from '../components/DemoBanner';

function DemoLeaderboardContent() {
  const navigate = useNavigate();
  const { demoHouseholdId, exitDemo } = useDemoAuth();
  const { household, leaderboard, resetDemo } = useDemo();

  const handleSignOut = () => {
    resetDemo();
    exitDemo();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Mode Banner */}
      <DemoBanner />

      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/households/${demoHouseholdId}`}
              className="text-gray-500 hover:text-gray-700"
            >
              Back
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Family Leaderboard</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        {/* Podium */}
        <div className="mb-12 flex items-end justify-center gap-4">
          {/* Second Place */}
          {leaderboard[1] && (
            <div className="flex flex-col items-center">
              <div
                className="mb-2 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
                style={{ backgroundColor: leaderboard[1].memberColor }}
              >
                {leaderboard[1].memberName.charAt(0)}
              </div>
              <div className="h-24 w-24 rounded-t-lg bg-gray-300 flex flex-col items-center justify-center">
                <span className="text-3xl">2nd</span>
                <span className="text-sm font-semibold text-gray-700">
                  {leaderboard[1].memberName}
                </span>
              </div>
            </div>
          )}

          {/* First Place */}
          {leaderboard[0] && (
            <div className="flex flex-col items-center">
              <div
                className="mb-2 flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-white ring-4 ring-yellow-400"
                style={{ backgroundColor: leaderboard[0].memberColor }}
              >
                {leaderboard[0].memberName.charAt(0)}
              </div>
              <div className="h-32 w-28 rounded-t-lg bg-yellow-400 flex flex-col items-center justify-center">
                <span className="text-4xl">1st</span>
                <span className="font-semibold text-gray-800">
                  {leaderboard[0].memberName}
                </span>
              </div>
            </div>
          )}

          {/* Third Place */}
          {leaderboard[2] && (
            <div className="flex flex-col items-center">
              <div
                className="mb-2 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
                style={{ backgroundColor: leaderboard[2].memberColor }}
              >
                {leaderboard[2].memberName.charAt(0)}
              </div>
              <div className="h-20 w-24 rounded-t-lg bg-orange-300 flex flex-col items-center justify-center">
                <span className="text-3xl">3rd</span>
                <span className="text-sm font-semibold text-gray-700">
                  {leaderboard[2].memberName}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard Table */}
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">This Week's Rankings</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {leaderboard.map((entry) => (
              <div
                key={entry.memberId}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                {/* Rank */}
                <div className="flex h-8 w-8 items-center justify-center">
                  {entry.rank === 1 && <span className="text-2xl font-bold text-yellow-500">1</span>}
                  {entry.rank === 2 && <span className="text-2xl font-bold text-gray-400">2</span>}
                  {entry.rank === 3 && <span className="text-2xl font-bold text-orange-400">3</span>}
                  {entry.rank > 3 && (
                    <span className="text-lg font-bold text-gray-400">{entry.rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{ backgroundColor: entry.memberColor }}
                >
                  {entry.memberName.charAt(0)}
                </div>

                {/* Name */}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{entry.memberName}</p>
                  <p className="text-sm text-gray-500">
                    {entry.completedChores} chores completed
                  </p>
                </div>

                {/* Points */}
                <div className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1">
                  <span>*</span>
                  <span className="font-semibold text-yellow-700">{entry.totalPoints}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Household Stats */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-4 sm:p-6 shadow">
            <p className="text-sm text-gray-500">Family Points Name</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{household.pointsName}</p>
          </div>
          <div className="rounded-lg bg-white p-4 sm:p-6 shadow">
            <p className="text-sm text-gray-500">Total Chores Completed</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {household.totalChoresCompleted}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 sm:p-6 shadow">
            <p className="text-sm text-gray-500">Current Family Streak</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {household.currentFamilyStreak} days
            </p>
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          <p>
            <strong>Demo Mode:</strong> This leaderboard shows sample data from the Johnson family.
            In the real app, you'll see your own family's rankings and achievements.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function DemoLeaderboardPage() {
  return (
    <DemoProvider>
      <DemoLeaderboardContent />
    </DemoProvider>
  );
}
