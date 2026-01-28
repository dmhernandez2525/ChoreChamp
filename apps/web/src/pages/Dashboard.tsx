import { useAuth } from '../context/AuthContext';
import { Button } from '@chorechamp/ui';
import { useNavigate, Link } from 'react-router-dom';
import { useHouseholds } from '@chorechamp/api-client';
import { Skeleton } from '../components/common';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: households, isLoading } = useHouseholds();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const hasHouseholds = households && households.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">ChoreChamp</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.name || user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.name || 'there'}!
          </h2>
          <p className="mt-1 text-gray-600">
            {hasHouseholds
              ? 'Select a household to view today\'s chores.'
              : 'Get started by creating a household or joining an existing one.'}
          </p>
        </div>

        {/* Households List */}
        {isLoading ? (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg bg-white p-6 shadow">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : hasHouseholds ? (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {households.map((household) => (
              <div
                key={household.id}
                className="rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {household.name}
                  </h3>
                  <span className="text-2xl">🏠</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <span>🔥</span>
                    {household.currentFamilyStreak || 0} day streak
                  </span>
                </div>
                <Button className="w-full" asChild>
                  <Link to={`/households/${household.id}`}>Open</Link>
                </Button>
              </div>
            ))}

            {/* Add New Household Card */}
            <Link
              to="/households/new"
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 text-center transition hover:border-blue-500 hover:bg-blue-50"
            >
              <span className="text-3xl">+</span>
              <span className="mt-2 font-medium text-gray-900">Add Household</span>
            </Link>
          </div>
        ) : (
          /* Quick Actions - shown when no households */
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/households/new"
              className="flex flex-col items-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 text-center transition hover:border-blue-500 hover:bg-blue-50"
            >
              <span className="text-3xl">🏠</span>
              <span className="mt-2 font-medium text-gray-900">Create Household</span>
              <span className="mt-1 text-sm text-gray-500">
                Start a new family household
              </span>
            </Link>

            <Link
              to="/households/join"
              className="flex flex-col items-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 text-center transition hover:border-blue-500 hover:bg-blue-50"
            >
              <span className="text-3xl">🔗</span>
              <span className="mt-2 font-medium text-gray-900">Join Household</span>
              <span className="mt-1 text-sm text-gray-500">
                Enter an invite code
              </span>
            </Link>

            <Link
              to="/templates"
              className="flex flex-col items-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 text-center transition hover:border-blue-500 hover:bg-blue-50"
            >
              <span className="text-3xl">📋</span>
              <span className="mt-2 font-medium text-gray-900">Browse Templates</span>
              <span className="mt-1 text-sm text-gray-500">
                Explore chore ideas
              </span>
            </Link>
          </div>
        )}

        {/* Empty State for Households */}
        {!isLoading && !hasHouseholds && (
          <div className="mt-8 rounded-lg border border-gray-200 bg-white p-8 text-center">
            <div className="text-4xl">🏠</div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No households yet
            </h3>
            <p className="mt-2 text-gray-600">
              Create a household to start assigning chores and earning points!
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Button asChild>
                <Link to="/households/new">Create Household</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/households/join">Join with Code</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Browse Templates Link (always shown) */}
        {hasHouseholds && (
          <div className="mt-4">
            <Link
              to="/templates"
              className="text-sm text-blue-600 hover:underline"
            >
              Browse 70+ chore templates →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
