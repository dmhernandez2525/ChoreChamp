import { Button } from '@chorechamp/ui';

interface OfflineFallbackProps {
  onRetry?: () => void;
}

export function OfflineFallback({ onRetry }: OfflineFallbackProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Offline illustration */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 mb-4">
            <svg
              className="h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re Offline</h1>
          <p className="text-gray-600">
            It looks like you&apos;ve lost your internet connection. Some features may be limited.
          </p>
        </div>

        {/* What you can do */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 text-left">
          <h2 className="font-semibold text-gray-900 mb-3">While offline, you can:</h2>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-green-500">✓</span>
              View previously loaded chores
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-green-500">✓</span>
              Mark chores as complete (syncs when online)
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-green-500">✓</span>
              View your points and badges
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-green-500">✓</span>
              Check your streak progress
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button onClick={handleRetry} className="w-full">
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
          </Button>
          <p className="text-xs text-gray-500">
            We&apos;ll automatically reconnect when your internet is back
          </p>
        </div>
      </div>
    </div>
  );
}
