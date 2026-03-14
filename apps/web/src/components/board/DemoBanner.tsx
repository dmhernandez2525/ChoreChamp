import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, X } from 'lucide-react';
import { useDemoMode } from '@/context/DemoContext';

/**
 * Floating banner shown at the top of the board when running in demo mode.
 * Fixed height (32px), gradient background, dismissible.
 */
export function DemoBanner() {
  const { isDemoMode, exitDemo } = useDemoMode();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (!isDemoMode || dismissed) return null;

  const handleExit = () => {
    exitDemo();
    navigate('/');
  };

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex h-8 items-center justify-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-xs font-medium text-white shadow-sm"
      role="status"
      aria-label="Demo mode active"
    >
      <span className="flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          <span className="font-semibold">Demo Mode</span>
          <span className="mx-1.5 hidden sm:inline">|</span>
          <span className="hidden sm:inline">
            This is a demo with sample data
          </span>
        </span>
      </span>

      <button
        onClick={handleExit}
        className="rounded bg-white/20 px-2 py-0.5 text-xs transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        Exit Demo
      </button>

      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 rounded p-0.5 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        aria-label="Dismiss demo banner"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
