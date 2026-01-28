import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import { useCreateHousehold } from '@chorechamp/api-client';

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'British Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Time (JST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern (AEST)' },
];

const WEEK_STARTS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
];

export default function CreateHousehold() {
  const navigate = useNavigate();
  const createHousehold = useCreateHousehold();

  const [formData, setFormData] = useState({
    name: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
    weekStartsOn: 0,
    pointsName: 'Stars',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter a household name');
      return;
    }

    try {
      const result = await createHousehold.mutateAsync({
        name: formData.name.trim(),
        timezone: formData.timezone,
        weekStartsOn: formData.weekStartsOn,
        pointsName: formData.pointsName.trim() || 'Stars',
      });
      navigate(`/households/${result.household.id}`);
    } catch (err) {
      setError('Failed to create household. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
            ← Back
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Create Household</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-xl px-4 py-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-6 text-center">
            <div className="text-4xl mb-2">🏠</div>
            <h2 className="text-xl font-semibold text-gray-900">
              Create Your Family Household
            </h2>
            <p className="mt-1 text-gray-600">
              Set up a household to start managing chores together.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Household Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Household Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="The Smith Family"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            {/* Timezone */}
            <div>
              <label
                htmlFor="timezone"
                className="block text-sm font-medium text-gray-700"
              >
                Timezone
              </label>
              <select
                id="timezone"
                value={formData.timezone}
                onChange={(e) =>
                  setFormData({ ...formData, timezone: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Week Starts On */}
            <div>
              <label
                htmlFor="weekStartsOn"
                className="block text-sm font-medium text-gray-700"
              >
                Week Starts On
              </label>
              <select
                id="weekStartsOn"
                value={formData.weekStartsOn}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    weekStartsOn: parseInt(e.target.value),
                  })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {WEEK_STARTS.map((ws) => (
                  <option key={ws.value} value={ws.value}>
                    {ws.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Points Name */}
            <div>
              <label
                htmlFor="pointsName"
                className="block text-sm font-medium text-gray-700"
              >
                What do you want to call points?
              </label>
              <input
                type="text"
                id="pointsName"
                value={formData.pointsName}
                onChange={(e) =>
                  setFormData({ ...formData, pointsName: e.target.value })
                }
                placeholder="Stars, Coins, Points..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                E.g., "Stars", "Coins", "Points" - default is "Stars"
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createHousehold.isPending}
              >
                {createHousehold.isPending ? 'Creating...' : 'Create Household'}
              </Button>
            </div>
          </form>

          {/* Info box */}
          <div className="mt-6 rounded-lg bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900">What happens next?</h3>
            <ul className="mt-2 space-y-1 text-sm text-blue-800">
              <li>• You'll be added as a parent (admin)</li>
              <li>• You can invite family members with a code</li>
              <li>• Start creating and assigning chores!</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
