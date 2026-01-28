import { Button, cn } from '@chorechamp/ui';
import { useTimer } from './useTimer';

interface CountdownTimerProps {
  minutes: number;
  onComplete?: () => void;
  onTimeUpdate?: (secondsRemaining: number) => void;
  autoStart?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showControls?: boolean;
  showProgress?: boolean;
  className?: string;
}

export function CountdownTimer({
  minutes,
  onComplete,
  onTimeUpdate,
  autoStart = false,
  size = 'md',
  showControls = true,
  showProgress = true,
  className,
}: CountdownTimerProps) {
  const timer = useTimer({
    initialSeconds: minutes * 60,
    countDown: true,
    onComplete,
    autoStart,
  });

  const handleToggle = () => {
    timer.toggle();
    onTimeUpdate?.(timer.seconds);
  };

  const handleReset = () => {
    timer.reset(minutes * 60);
  };

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  const progressColor =
    timer.progress > 75
      ? 'bg-red-500'
      : timer.progress > 50
      ? 'bg-yellow-500'
      : 'bg-green-500';

  return (
    <div className={cn('text-center', className)}>
      {/* Progress ring */}
      {showProgress && (
        <div className="relative mx-auto mb-4 h-32 w-32">
          <svg className="h-full w-full -rotate-90 transform">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              strokeWidth="8"
              className="fill-none stroke-gray-200"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              strokeWidth="8"
              className={cn(
                'fill-none transition-all duration-300',
                timer.isComplete ? 'stroke-red-500' : 'stroke-blue-500'
              )}
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - timer.progress / 100)}`}
            />
          </svg>
          {/* Time in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                'font-mono font-bold',
                timer.isComplete ? 'text-red-600' : 'text-gray-700',
                size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl'
              )}
            >
              {timer.formattedTime}
            </span>
          </div>
        </div>
      )}

      {/* Simple time display (when no progress ring) */}
      {!showProgress && (
        <div
          className={cn(
            'font-mono font-bold tabular-nums',
            sizeClasses[size],
            timer.isComplete
              ? 'text-red-600 animate-pulse'
              : timer.isRunning && !timer.isPaused
              ? 'text-blue-600'
              : 'text-gray-700'
          )}
        >
          {timer.formattedTime}
        </div>
      )}

      {/* Status */}
      <div className="mt-2 text-sm">
        {timer.isComplete ? (
          <span className="font-medium text-red-600">Time's up!</span>
        ) : timer.isRunning && !timer.isPaused ? (
          <span className="text-blue-600">Counting down...</span>
        ) : timer.isPaused ? (
          <span className="text-yellow-600">Paused</span>
        ) : (
          <span className="text-gray-500">{minutes} minutes</span>
        )}
      </div>

      {/* Progress bar */}
      {showProgress && (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={cn('h-full rounded-full transition-all', progressColor)}
            style={{ width: `${timer.progress}%` }}
          />
        </div>
      )}

      {/* Controls */}
      {showControls && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {!timer.isComplete ? (
            <>
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
              <Button variant="ghost" onClick={handleReset}>
                🔄 Reset
              </Button>
            </>
          ) : (
            <Button onClick={handleReset}>🔄 Start Over</Button>
          )}
        </div>
      )}
    </div>
  );
}
