import { cn } from '@chorechamp/ui';

interface TaskBreakdownProps {
  steps: string[];
  completedSteps: number[];
  onStepToggle: (stepIndex: number) => void;
  showNumbers?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function TaskBreakdown({
  steps,
  completedSteps,
  onStepToggle,
  showNumbers = true,
  size = 'md',
}: TaskBreakdownProps) {
  const totalSteps = steps.length;
  const completedCount = completedSteps.length;
  const progress = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  const sizeClasses = {
    sm: 'text-sm gap-2',
    md: 'text-base gap-3',
    lg: 'text-lg gap-4',
  };

  const checkboxSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7',
  };

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">Progress</span>
          <span className="text-gray-500">
            {completedCount} of {totalSteps} steps
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps list */}
      <div className={cn('space-y-2', sizeClasses[size])}>
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isNext = !isCompleted && completedSteps.length === index;

          return (
            <button
              key={index}
              type="button"
              onClick={() => onStepToggle(index)}
              className={cn(
                'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all',
                isCompleted
                  ? 'border-green-200 bg-green-50'
                  : isNext
                  ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              {/* Checkbox */}
              <div
                className={cn(
                  'flex flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  checkboxSizes[size],
                  isCompleted
                    ? 'border-green-500 bg-green-500 text-white'
                    : isNext
                    ? 'border-blue-500'
                    : 'border-gray-300'
                )}
              >
                {isCompleted ? (
                  <span className="text-sm">✓</span>
                ) : showNumbers ? (
                  <span className="text-xs font-medium text-gray-500">
                    {index + 1}
                  </span>
                ) : null}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    'block',
                    isCompleted && 'text-green-700 line-through',
                    isNext && 'font-medium text-blue-900'
                  )}
                >
                  {step}
                </span>
                {isNext && (
                  <span className="mt-1 inline-block rounded-full bg-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700">
                    Up next
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Completion message */}
      {completedCount === totalSteps && totalSteps > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-green-100 p-3 text-green-800">
          <span className="text-xl">🎉</span>
          <span className="font-medium">All steps completed!</span>
        </div>
      )}
    </div>
  );
}
