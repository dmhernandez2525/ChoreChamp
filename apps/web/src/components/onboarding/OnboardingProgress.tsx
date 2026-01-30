interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  stepLabels = ['Account', 'Household', 'Members', 'Chores'],
}: OnboardingProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      {/* Step indicators */}
      <div className="flex justify-between mb-2">
        {stepLabels.slice(0, totalSteps).map((label, index) => (
          <div key={label} className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                index < currentStep
                  ? 'bg-primary-500 text-white'
                  : index === currentStep
                  ? 'bg-primary-500 text-white ring-4 ring-primary-200'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index < currentStep ? '✓' : index + 1}
            </div>
            <span
              className={`text-xs mt-1 ${
                index <= currentStep ? 'text-primary-600 font-medium' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Time estimate */}
      <p className="text-center text-gray-400 text-xs mt-2">
        {totalSteps - currentStep - 1 > 0
          ? `About ${totalSteps - currentStep - 1} min remaining`
          : 'Almost done!'}
      </p>
    </div>
  );
}
