import { Button, cn } from '@chorechamp/ui';
import { useTimer } from './useTimer';

interface StopwatchProps {
  onTimeUpdate?: (seconds: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showControls?: boolean;
  className?: string;
}

export function Stopwatch({
  onTimeUpdate,
  size = 'md',
  showControls = true,
  className,
}: StopwatchProps) {
  const timer = useTimer({ countDown: false });

  const handleToggle = () => {
    timer.toggle();
    if (timer.isRunning && !timer.isPaused) {
      onTimeUpdate?.(timer.seconds);
    }
  };

  const handleReset = () => {
    onTimeUpdate?.(timer.seconds);
    timer.reset();
  };

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  return (
    <div className={cn('text-center', className)}>
      {/* Time display */}
      <div
        className={cn(
          'font-mono font-bold tabular-nums',
          sizeClasses[size],
          timer.isRunning && !timer.isPaused ? 'text-blue-600' : 'text-gray-700'
        )}
      >
        {timer.formattedTime}
      </div>

      {/* Status indicator */}
      <div className="mt-1 flex items-center justify-center gap-2">
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            timer.isRunning && !timer.isPaused
              ? 'animate-pulse bg-green-500'
              : timer.isPaused
              ? 'bg-yellow-500'
              : 'bg-gray-300'
          )}
        />
        <span className="text-sm text-gray-500">
          {timer.isRunning && !timer.isPaused
            ? 'Running'
            : timer.isPaused
            ? 'Paused'
            : 'Ready'}
        </span>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant={timer.isRunning && !timer.isPaused ? 'outline' : 'default'}
            onClick={handleToggle}
          >
            {!timer.isRunning
              ? '▶️ Start'
              : timer.isPaused
              ? '▶️ Resume'
              : '⏸️ Pause'}
          </Button>
          {(timer.isRunning || timer.seconds > 0) && (
            <Button variant="ghost" onClick={handleReset}>
              🔄 Reset
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
