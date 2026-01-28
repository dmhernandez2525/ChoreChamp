import { useAuth } from '../context/AuthContext';
import { Button } from '@chorechamp/ui';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

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
            Get started by creating a household or joining an existing one.
          </p>
        </div>

        {/* Quick Actions */}
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

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Today's Chores</h3>
            <p className="mt-4 text-3xl font-bold text-gray-900">0</p>
            <p className="mt-1 text-sm text-gray-500">No chores scheduled yet</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Points</h3>
            <p className="mt-4 text-3xl font-bold text-blue-600">0</p>
            <p className="mt-1 text-sm text-gray-500">Start earning points!</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Streak</h3>
            <p className="mt-4 text-3xl font-bold text-orange-500">0 days</p>
            <p className="mt-1 text-sm text-gray-500">Complete chores daily</p>
          </div>
        </div>

        {/* Empty State for Households */}
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
      </main>
    </div>
  );
}
