import { Button, cn } from '@chorechamp/ui';
import type { Chore, ChoreCompletion, Member } from '@chorechamp/types';

interface ChoreCardProps {
  chore: Chore;
  completion?: ChoreCompletion | null;
  assignee?: Member;
  onComplete?: () => void;
  onClick?: () => void;
  isCompletingId?: string | null;
}

const difficultyConfig = {
  trivial: { label: 'Easy', color: 'bg-green-100 text-green-700' },
  easy: { label: 'Easy', color: 'bg-green-100 text-green-700' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  hard: { label: 'Hard', color: 'bg-red-100 text-red-700' },
};

const statusConfig = {
  pending: { label: 'Not Started', color: 'border-gray-200 bg-white' },
  'in-progress': { label: 'In Progress', color: 'border-blue-200 bg-blue-50' },
  'needs-approval': { label: 'Needs Approval', color: 'border-yellow-200 bg-yellow-50' },
  completed: { label: 'Completed', color: 'border-green-200 bg-green-50' },
  rejected: { label: 'Rejected', color: 'border-red-200 bg-red-50' },
};

function getChoreStatus(
  chore: Chore,
  completion?: ChoreCompletion | null
): keyof typeof statusConfig {
  if (!completion) return 'pending';
  if (completion.status === 'approved') return 'completed';
  if (completion.status === 'rejected') return 'rejected';
  if (chore.requiresApproval && completion.status === 'pending') return 'needs-approval';
  return 'completed';
}

export function ChoreCard({
  chore,
  completion,
  assignee,
  onComplete,
  onClick,
  isCompletingId,
}: ChoreCardProps) {
  const status = getChoreStatus(chore, completion);
  const isCompleted = status === 'completed';
  const needsApproval = status === 'needs-approval';
  const isCompleting = isCompletingId === chore.id;

  const difficulty = difficultyConfig[chore.difficulty as keyof typeof difficultyConfig] ||
    difficultyConfig.medium;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all cursor-pointer hover:shadow-md',
        statusConfig[status].color,
        isCompleted && 'opacity-75'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full text-xl',
            isCompleted ? 'bg-green-100' : 'bg-gray-100'
          )}
        >
          {isCompleted ? '✓' : chore.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                'font-medium text-gray-900 truncate',
                isCompleted && 'line-through'
              )}
            >
              {chore.title}
            </h3>
            {needsApproval && (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                Pending
              </span>
            )}
          </div>

          {chore.description && (
            <p className="mt-0.5 text-sm text-gray-500 truncate">
              {chore.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Points */}
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              ⭐ {chore.pointValue} pts
            </span>

            {/* Difficulty */}
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                difficulty.color
              )}
            >
              {difficulty.label}
            </span>

            {/* Due time */}
            {chore.dueTime && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                🕐 {formatTime(chore.dueTime)}
              </span>
            )}

            {/* Assignee */}
            {assignee && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: `${assignee.color}20`, color: assignee.color }}
              >
                {assignee.name}
              </span>
            )}

            {/* Requirements */}
            {chore.requiresPhoto && (
              <span className="text-xs text-gray-400" title="Photo required">
                📷
              </span>
            )}
            {chore.requiresApproval && (
              <span className="text-xs text-gray-400" title="Approval required">
                ✔️
              </span>
            )}
          </div>
        </div>

        {/* Action button */}
        {!isCompleted && onComplete && (
          <Button
            size="sm"
            variant={needsApproval ? 'outline' : 'default'}
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            disabled={needsApproval || isCompleting}
            className="shrink-0"
          >
            {isCompleting ? (
              <span className="inline-flex items-center gap-1">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </span>
            ) : needsApproval ? (
              'Pending...'
            ) : (
              'Done'
            )}
          </Button>
        )}

        {/* Completed checkmark */}
        {isCompleted && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
            ✓
          </div>
        )}
      </div>

      {/* Steps preview for ADHD support */}
      {chore.steps && chore.steps.length > 0 && !isCompleted && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <p className="text-xs font-medium text-gray-500 mb-1">
            {chore.steps.length} steps
          </p>
          <div className="text-xs text-gray-400 truncate">
            {(chore.steps as string[]).slice(0, 2).join(' → ')}
            {chore.steps.length > 2 && '...'}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}
