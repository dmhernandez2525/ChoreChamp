import { useState } from 'react';
import { Button, cn } from '@chorechamp/ui';
import { Stopwatch } from './Stopwatch';
import { CountdownTimer } from './CountdownTimer';

type TimerMode = 'stopwatch' | 'countdown';

interface ChoreTimerProps {
  estimatedMinutes?: number;
  onComplete?: (elapsedSeconds: number) => void;
  onCancel?: () => void;
  showModeToggle?: boolean;
  defaultMode?: TimerMode;
  className?: string;
}

export function ChoreTimer({
  estimatedMinutes,
  onComplete,
  onCancel,
  showModeToggle = true,
  defaultMode = estimatedMinutes ? 'countdown' : 'stopwatch',
  className,
}: ChoreTimerProps) {
  const [mode, setMode] = useState<TimerMode>(defaultMode);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const handleCountdownComplete = () => {
    if (estimatedMinutes) {
      setElapsedSeconds(estimatedMinutes * 60);
    }
  };

  const handleDone = () => {
    onComplete?.(elapsedSeconds);
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-6 shadow-sm',
        className
      )}
    >
      {/* Mode toggle */}
      {showModeToggle && estimatedMinutes && (
        <div className="mb-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setMode('countdown')}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              mode === 'countdown'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:bg-gray-100'
            )}
          >
            ⏱️ Countdown
          </button>
          <button
            onClick={() => setMode('stopwatch')}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              mode === 'stopwatch'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:bg-gray-100'
            )}
          >
            ⏰ Stopwatch
          </button>
        </div>
      )}

      {/* Timer display */}
      {mode === 'countdown' && estimatedMinutes ? (
        <CountdownTimer
          minutes={estimatedMinutes}
          onComplete={handleCountdownComplete}
          onTimeUpdate={setElapsedSeconds}
          showProgress
        />
      ) : (
        <Stopwatch onTimeUpdate={setElapsedSeconds} size="lg" />
      )}

      {/* Estimated time info */}
      {estimatedMinutes && mode === 'stopwatch' && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Estimated time: {estimatedMinutes} minutes
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button onClick={handleDone}>✓ Done with Timer</Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Skip Timer
          </Button>
        )}
      </div>
    </div>
  );
}

// Mini timer badge for inline display
interface TimerBadgeProps {
  seconds: number;
  isRunning?: boolean;
  className?: string;
}

export function TimerBadge({ seconds, isRunning, className }: TimerBadgeProps) {
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
        isRunning
          ? 'bg-blue-100 text-blue-700'
          : 'bg-gray-100 text-gray-600',
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', isRunning ? 'animate-pulse bg-blue-500' : 'bg-gray-400')} />
      {formatTime(seconds)}
    </span>
  );
}
