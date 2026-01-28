import { useState, useEffect } from 'react';
import { Button, cn } from '@chorechamp/ui';

interface UpdateNotificationProps {
  className?: string;
}

export function UpdateNotification({ className }: UpdateNotificationProps) {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Check for updates on load
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);

        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available
                setShowUpdate(true);
              }
            });
          }
        });
      });

      // Listen for controller change (another tab updated)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell the waiting service worker to activate
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdate(false);
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div
      className={cn(
        'fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96',
        className
      )}
    >
      <div className="rounded-xl bg-blue-600 text-white shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 flex-shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">Update Available</h3>
            <p className="text-sm text-blue-100 mt-1">
              A new version of ChoreChamp is ready. Refresh to get the latest features!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-1 text-white hover:bg-white/20"
          >
            Later
          </Button>
          <Button
            size="sm"
            onClick={handleUpdate}
            className="flex-1 bg-white text-blue-600 hover:bg-blue-50"
          >
            Refresh Now
          </Button>
        </div>
      </div>
    </div>
  );
}
