import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import { useJoinHousehold } from '@chorechamp/api-client';

export default function JoinHousehold() {
  const navigate = useNavigate();
  const joinHousehold = useJoinHousehold();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setError('Please enter an invite code');
      return;
    }

    if (trimmedCode.length !== 8) {
      setError('Invite code must be 8 characters');
      return;
    }

    try {
      const result = await joinHousehold.mutateAsync({ code: trimmedCode });
      navigate(`/households/${result.household.id}`);
    } catch (err: unknown) {
      const error = err as Error & { message?: string };
      if (error.message?.includes('not found') || error.message?.includes('invalid')) {
        setError('Invalid invite code. Please check and try again.');
      } else if (error.message?.includes('expired')) {
        setError('This invite code has expired.');
      } else if (error.message?.includes('max')) {
        setError('This invite code has reached its maximum uses.');
      } else {
        setError('Failed to join household. Please try again.');
      }
    }
  };

  const formatCode = (value: string) => {
    // Remove non-alphanumeric characters and convert to uppercase
    return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
            ← Back
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Join Household</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-xl px-4 py-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-6 text-center">
            <div className="text-4xl mb-2">🔗</div>
            <h2 className="text-xl font-semibold text-gray-900">
              Join a Family Household
            </h2>
            <p className="mt-1 text-gray-600">
              Enter the invite code shared by a family member.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invite Code */}
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700"
              >
                Invite Code
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(formatCode(e.target.value))}
                placeholder="ABCD1234"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-center text-2xl font-mono tracking-widest shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                maxLength={8}
                autoComplete="off"
                autoCapitalize="characters"
              />
              <p className="mt-2 text-xs text-gray-500 text-center">
                8-character code (letters and numbers)
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
                disabled={joinHousehold.isPending || code.length !== 8}
              >
                {joinHousehold.isPending ? 'Joining...' : 'Join Household'}
              </Button>
            </div>
          </form>

          {/* Help section */}
          <div className="mt-6 border-t pt-6">
            <h3 className="font-medium text-gray-900">Don't have a code?</h3>
            <p className="mt-1 text-sm text-gray-600">
              Ask a parent or guardian from the household to share an invite code
              with you. They can generate one from their household settings.
            </p>
            <div className="mt-4">
              <Link
                to="/households/new"
                className="text-sm text-blue-600 hover:underline"
              >
                Or create your own household →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
