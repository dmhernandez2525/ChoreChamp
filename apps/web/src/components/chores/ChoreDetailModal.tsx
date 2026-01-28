import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button, cn } from '@chorechamp/ui';
import { useChoreStore } from '../../stores/chore-store';
import type { Chore, ChoreCompletion, Member, TodayChore } from '@chorechamp/types';

interface ChoreDetailModalProps {
  chores: TodayChore[];
  members: Member[];
  onComplete: (choreId: string) => void;
  isCompleting?: boolean;
}

const difficultyConfig = {
  trivial: { label: 'Very Easy', color: 'bg-gray-100 text-gray-700' },
  easy: { label: 'Easy', color: 'bg-green-100 text-green-700' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  hard: { label: 'Hard', color: 'bg-red-100 text-red-700' },
};

const categoryLabels: Record<string, string> = {
  bedroom: '🛏️ Bedroom',
  bathroom: '🚿 Bathroom',
  kitchen: '🍽️ Kitchen',
  'living-room': '🛋️ Living Room',
  outdoor: '🌳 Outdoor',
  pets: '🐕 Pets',
  laundry: '👕 Laundry',
  school: '📚 School',
  'self-care': '🪥 Self-Care',
  helping: '🤝 Helping',
  general: '✅ General',
};

function getChoreStatus(
  chore: Chore,
  completion?: ChoreCompletion | null
): 'pending' | 'completed' | 'needs-approval' | 'rejected' {
  if (!completion) return 'pending';
  if (completion.status === 'approved') return 'completed';
  if (completion.status === 'rejected') return 'rejected';
  if (chore.requiresApproval && completion.status === 'pending') return 'needs-approval';
  return 'completed';
}

export function ChoreDetailModal({
  chores,
  members,
  onComplete,
  isCompleting,
}: ChoreDetailModalProps) {
  const { selectedChoreId, isDetailModalOpen, closeChoreDetail } = useChoreStore();
  const [currentStep, setCurrentStep] = useState(0);

  const todayChore = chores.find((c) => c.chore.id === selectedChoreId);
  const chore = todayChore?.chore;
  const completion = todayChore?.completion;

  if (!chore) return null;

  const status = getChoreStatus(chore, completion);
  const isCompleted = status === 'completed';
  const needsApproval = status === 'needs-approval';
  const isRejected = status === 'rejected';

  const assignee = members.find((m) => m.id === todayChore.assignedTo);
  const difficulty = difficultyConfig[chore.difficulty as keyof typeof difficultyConfig] ||
    difficultyConfig.medium;

  const steps = chore.steps as string[] | null;
  const hasSteps = steps && steps.length > 0;

  const handleComplete = () => {
    onComplete(chore.id);
  };

  return (
    <Dialog.Root open={isDetailModalOpen} onOpenChange={closeChoreDetail}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-lg translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-lg bg-white p-6 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-full text-2xl',
                isCompleted ? 'bg-green-100' : 'bg-gray-100'
              )}
            >
              {isCompleted ? '✓' : chore.icon}
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                {chore.title}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-gray-500">
                {chore.description || categoryLabels[chore.category] || chore.category}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
            </Dialog.Close>
          </div>

          {/* Status banner */}
          {(isCompleted || needsApproval || isRejected) && (
            <div
              className={cn(
                'mt-4 rounded-lg p-3',
                isCompleted && 'bg-green-50 text-green-800',
                needsApproval && 'bg-yellow-50 text-yellow-800',
                isRejected && 'bg-red-50 text-red-800'
              )}
            >
              {isCompleted && (
                <p className="font-medium">
                  ✅ Completed! {completion?.pointsAwarded && `+${completion.pointsAwarded} points`}
                </p>
              )}
              {needsApproval && (
                <p className="font-medium">⏳ Waiting for approval from a parent</p>
              )}
              {isRejected && (
                <>
                  <p className="font-medium">❌ Not approved</p>
                  {completion?.rejectionReason && (
                    <p className="mt-1 text-sm">{completion.rejectionReason}</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Details grid */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium uppercase text-gray-500">Points</p>
              <p className="mt-1 text-lg font-semibold text-blue-600">
                ⭐ {chore.pointValue}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-gray-500">Difficulty</p>
              <p className={cn('mt-1 inline-block rounded-full px-3 py-1 text-sm font-medium', difficulty.color)}>
                {difficulty.label}
              </p>
            </div>
            {chore.dueTime && (
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">Due By</p>
                <p className="mt-1 text-lg font-medium">
                  🕐 {formatTime(chore.dueTime)}
                </p>
              </div>
            )}
            {chore.estimatedMinutes && (
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">Estimated Time</p>
                <p className="mt-1 text-lg font-medium">
                  ⏱️ {chore.estimatedMinutes} min
                </p>
              </div>
            )}
            {assignee && (
              <div className="col-span-2">
                <p className="text-xs font-medium uppercase text-gray-500">Assigned To</p>
                <div
                  className="mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1"
                  style={{ backgroundColor: `${assignee.color}20` }}
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: assignee.color }}
                  />
                  <span className="font-medium" style={{ color: assignee.color }}>
                    {assignee.name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Requirements */}
          {(chore.requiresPhoto || chore.requiresApproval) && (
            <div className="mt-4 flex gap-4">
              {chore.requiresPhoto && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>📷</span>
                  <span>Photo required</span>
                </div>
              )}
              {chore.requiresApproval && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>✔️</span>
                  <span>Approval required</span>
                </div>
              )}
            </div>
          )}

          {/* Steps (ADHD support) */}
          {hasSteps && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Steps ({currentStep + 1} of {steps.length})
              </h4>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                      index < currentStep && 'bg-green-50 border-green-200',
                      index === currentStep && 'bg-blue-50 border-blue-300',
                      index > currentStep && 'bg-gray-50 border-gray-200'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium',
                        index < currentStep && 'bg-green-500 text-white',
                        index === currentStep && 'bg-blue-500 text-white',
                        index > currentStep && 'bg-gray-300 text-gray-600'
                      )}
                    >
                      {index < currentStep ? '✓' : index + 1}
                    </div>
                    <span
                      className={cn(
                        'flex-1 text-sm',
                        index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                      )}
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>
              {!isCompleted && (
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </Button>
                  {currentStep < steps.length - 1 ? (
                    <Button
                      size="sm"
                      onClick={() => setCurrentStep(currentStep + 1)}
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handleComplete} disabled={isCompleting}>
                      {isCompleting ? 'Completing...' : 'Mark Complete'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          {!hasSteps && !isCompleted && !needsApproval && (
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.Close>
              <Button onClick={handleComplete} disabled={isCompleting}>
                {isCompleting ? 'Completing...' : 'Mark Complete'}
              </Button>
            </div>
          )}

          {/* Completion info */}
          {completion && (
            <div className="mt-6 border-t pt-4">
              <p className="text-xs text-gray-500">
                Completed {formatDate(completion.completedAt)}
                {completion.durationSeconds && (
                  <> • Took {Math.round(completion.durationSeconds / 60)} minutes</>
                )}
              </p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
