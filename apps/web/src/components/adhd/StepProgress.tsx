import { cn } from '@chorechamp/ui';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  stepNames?: string[];
  variant?: 'dots' | 'bar' | 'numbered';
}

export function StepProgress({
  currentStep,
  totalSteps,
  stepNames,
  variant = 'dots',
}: StepProgressProps) {
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  if (variant === 'bar') {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (variant === 'numbered') {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNumber = i + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={i} className="flex items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                  isCompleted && 'bg-green-500 text-white',
                  isCurrent && 'bg-blue-500 text-white ring-2 ring-blue-200',
                  !isCompleted && !isCurrent && 'bg-gray-200 text-gray-500'
                )}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              {i < totalSteps - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-4',
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Dots variant (default)
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNumber = i + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <div
            key={i}
            className={cn(
              'h-2.5 w-2.5 rounded-full transition-all duration-300',
              isCompleted && 'bg-green-500',
              isCurrent && 'bg-blue-500 ring-2 ring-blue-200 scale-125',
              !isCompleted && !isCurrent && 'bg-gray-300'
            )}
            title={stepNames?.[i] || `Step ${stepNumber}`}
          />
        );
      })}
      <span className="ml-2 text-xs text-gray-500">
        {currentStep}/{totalSteps}
      </span>
    </div>
  );
}
