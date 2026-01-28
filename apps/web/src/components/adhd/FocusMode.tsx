import { useState, useEffect } from 'react';
import { Button } from '@chorechamp/ui';
import { TaskBreakdown } from './TaskBreakdown';
import { DifficultyIndicator } from './DifficultyIndicator';
import type { Difficulty } from '@chorechamp/types';

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  chore: {
    title: string;
    description?: string | null;
    icon: string;
    difficulty: Difficulty;
    estimatedMinutes?: number | null;
    steps?: string[] | null;
    pointValue: number;
  };
  pointsName?: string;
}

export function FocusMode({
  isOpen,
  onClose,
  onComplete,
  chore,
  pointsName = 'Stars',
}: FocusModeProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const steps = chore.steps || [];
  const hasSteps = steps.length > 0;
  const allStepsCompleted = hasSteps && completedSteps.length === steps.length;

  // Timer
  useEffect(() => {
    if (!isOpen || isPaused) return;

    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isPaused]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCompletedSteps([]);
      setElapsedSeconds(0);
      setIsPaused(false);
    }
  }, [isOpen]);

  const handleStepToggle = (stepIndex: number) => {
    setCompletedSteps((prev) => {
      if (prev.includes(stepIndex)) {
        return prev.filter((i) => i !== stepIndex);
      }
      return [...prev, stepIndex].sort((a, b) => a - b);
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
        >
          <span>←</span>
          <span>Exit Focus Mode</span>
        </button>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-blue-600">
              {formatTime(elapsedSeconds)}
            </div>
            <div className="text-xs text-gray-500">Time elapsed</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Chore info */}
          <div className="text-center">
            <div className="mb-2 text-5xl">{chore.icon}</div>
            <h1 className="text-2xl font-bold text-gray-900">{chore.title}</h1>
            {chore.description && (
              <p className="mt-2 text-gray-600">{chore.description}</p>
            )}
            <div className="mt-3 flex items-center justify-center gap-4">
              <DifficultyIndicator difficulty={chore.difficulty} />
              {chore.estimatedMinutes && (
                <span className="text-sm text-gray-500">
                  ~{chore.estimatedMinutes} min
                </span>
              )}
              <span className="flex items-center gap-1 text-sm font-medium text-yellow-600">
                <span>⭐</span>
                <span>+{chore.pointValue} {pointsName}</span>
              </span>
            </div>
          </div>

          {/* Steps or simple completion */}
          {hasSteps ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Steps to Complete
              </h2>
              <TaskBreakdown
                steps={steps}
                completedSteps={completedSteps}
                onStepToggle={handleStepToggle}
                size="lg"
              />
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="text-lg text-gray-600">
                Complete this task and mark it done when finished!
              </p>
              <div className="mt-4 text-4xl">💪</div>
            </div>
          )}

          {/* Motivational section */}
          <div className="rounded-lg bg-gradient-to-r from-purple-100 to-blue-100 p-4 text-center">
            <p className="font-medium text-purple-800">
              {elapsedSeconds < 60
                ? "You've got this! Take it one step at a time."
                : elapsedSeconds < 300
                ? "Great progress! Keep up the momentum!"
                : "You're doing amazing! Almost there!"}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white p-4 shadow-lg">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="text-sm text-gray-500">
            {hasSteps
              ? `${completedSteps.length}/${steps.length} steps completed`
              : 'Ready to complete?'}
          </div>
          <Button
            size="lg"
            onClick={onComplete}
            disabled={hasSteps && !allStepsCompleted}
            className="px-8"
          >
            {hasSteps && !allStepsCompleted
              ? 'Complete All Steps First'
              : '✓ Mark Complete'}
          </Button>
        </div>
      </footer>
    </div>
  );
}
