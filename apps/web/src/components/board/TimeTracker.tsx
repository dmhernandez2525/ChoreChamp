import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import { Button, cn } from '@chorechamp/ui';

interface TimeTrackerProps {
  isRunning: boolean;
  startedAt: Date | null;
  totalSeconds: number;
  estimatedMinutes?: number;
  onStart: () => void;
  onStop: () => void;
  className?: string;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function TimeTracker({
  isRunning,
  startedAt,
  totalSeconds,
  estimatedMinutes,
  onStart,
  onStop,
  className,
}: TimeTrackerProps) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateElapsed = useCallback(() => {
    if (!startedAt) return;
    const diff = Math.round((Date.now() - new Date(startedAt).getTime()) / 1000);
    setElapsed(diff);
  }, [startedAt]);

  useEffect(() => {
    if (isRunning && startedAt) {
      updateElapsed();
      intervalRef.current = setInterval(updateElapsed, 1000);
    } else {
      setElapsed(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, startedAt, updateElapsed]);

  const currentTotal = totalSeconds + elapsed;
  const estimatedSeconds = (estimatedMinutes ?? 0) * 60;
  const isOverEstimate = estimatedSeconds > 0 && currentTotal > estimatedSeconds;
  const progressPercent = estimatedSeconds > 0
    ? Math.min(100, (currentTotal / estimatedSeconds) * 100)
    : 0;

  return (
    <div className={cn('rounded-lg border border-gray-200 p-3', className)} data-testid="time-tracker">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className={cn('h-4 w-4', isRunning ? 'text-green-500' : 'text-gray-400')} />
          <span className="text-sm font-medium text-gray-700">Time Tracked</span>
        </div>
        {isRunning ? (
          <Button variant="ghost" size="sm" onClick={onStop} className="text-red-600 hover:text-red-700">
            <Square className="mr-1 h-3 w-3" /> Stop
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={onStart} className="text-green-600 hover:text-green-700">
            <Play className="mr-1 h-3 w-3" /> Start
          </Button>
        )}
      </div>

      {/* Timer display */}
      <div className="text-center">
        <span
          className={cn(
            'text-2xl font-mono font-bold tabular-nums',
            isRunning ? 'text-green-600' : 'text-gray-700',
            isOverEstimate && 'text-red-600'
          )}
        >
          {formatDuration(currentTotal)}
        </span>
        {isRunning && (
          <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
        )}
      </div>

      {/* Progress bar against estimate */}
      {estimatedSeconds > 0 && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>0:00</span>
            <span>{estimatedMinutes}m estimated</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                isOverEstimate ? 'bg-red-500' : 'bg-green-500'
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
