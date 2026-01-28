import { useState } from 'react';
import { Button } from '@chorechamp/ui';
import { NoPendingApprovalsEmptyState } from '../common/EmptyState';
import type { TodayChore, Member } from '@chorechamp/types';

interface PendingApprovalsProps {
  chores: TodayChore[];
  members: Member[];
  onApprove: (completionId: string) => void;
  onReject: (completionId: string, reason: string) => void;
  isApproving?: string | null;
}

function getPendingApprovals(chores: TodayChore[]): TodayChore[] {
  return chores.filter(
    (c) =>
      c.chore.requiresApproval &&
      c.completion?.status === 'pending'
  );
}

export function PendingApprovals({
  chores,
  members,
  onApprove,
  onReject,
  isApproving,
}: PendingApprovalsProps) {
  const pendingApprovals = getPendingApprovals(chores);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const getMember = (memberId: string) =>
    members.find((m) => m.id === memberId);

  const handleReject = (completionId: string) => {
    if (rejectionReason.trim()) {
      onReject(completionId, rejectionReason.trim());
      setRejectingId(null);
      setRejectionReason('');
    }
  };

  if (pendingApprovals.length === 0) {
    return <NoPendingApprovalsEmptyState />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Pending Approvals ({pendingApprovals.length})
        </h3>
      </div>

      <div className="space-y-3">
        {pendingApprovals.map((todayChore) => {
          const assignee = getMember(todayChore.assignedTo);
          const completion = todayChore.completion!;
          const isProcessing = isApproving === completion.id;
          const isRejecting = rejectingId === completion.id;

          return (
            <div
              key={completion.id}
              className="rounded-lg border border-yellow-200 bg-yellow-50 p-4"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl">
                  {todayChore.chore.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900">
                    {todayChore.chore.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Completed by{' '}
                    <span
                      className="font-medium"
                      style={{ color: assignee?.color }}
                    >
                      {assignee?.name || 'Unknown'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(completion.completedAt)}
                    {completion.durationSeconds && (
                      <> • Took {Math.round(completion.durationSeconds / 60)} min</>
                    )}
                  </p>

                  {/* Photo proof */}
                  {completion.photoUrl && (
                    <a
                      href={completion.photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      📷 View photo proof
                    </a>
                  )}

                  {/* Points to be awarded */}
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      ⭐ {todayChore.chore.pointValue} pts pending
                    </span>
                  </div>
                </div>
              </div>

              {/* Rejection form */}
              {isRejecting ? (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Why is this being rejected? (required)"
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRejectingId(null);
                        setRejectionReason('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(completion.id)}
                      disabled={!rejectionReason.trim()}
                    >
                      Confirm Rejection
                    </Button>
                  </div>
                </div>
              ) : (
                /* Action buttons */
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onApprove(completion.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Approving...' : '✓ Approve'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRejectingId(completion.id)}
                    disabled={isProcessing}
                  >
                    ✗ Reject
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for dashboard sidebar
export function PendingApprovalsCount({ chores }: { chores: TodayChore[] }) {
  const count = getPendingApprovals(chores).length;

  if (count === 0) return null;

  return (
    <span className="inline-flex items-center justify-center rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-bold text-white">
      {count}
    </span>
  );
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
