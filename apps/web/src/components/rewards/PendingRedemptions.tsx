import { useState } from 'react';
import { Button } from '@chorechamp/ui';
import type { RewardRedemption, Member, Reward } from '@chorechamp/types';

interface PendingRedemptionsProps {
  redemptions: RewardRedemption[];
  members: Member[];
  rewards: Reward[];
  onApprove: (redemptionId: string) => void;
  onReject: (redemptionId: string, reason: string) => void;
  onFulfill: (redemptionId: string) => void;
  isProcessing: string | null;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function PendingRedemptions({
  redemptions,
  members,
  rewards,
  onApprove,
  onReject,
  onFulfill,
  isProcessing,
}: PendingRedemptionsProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const getMember = (id: string) => members.find((m) => m.id === id);
  const getReward = (id: string) => rewards.find((r) => r.id === id);

  const pendingApproval = redemptions.filter((r) => r.status === 'pending');
  const approved = redemptions.filter((r) => r.status === 'approved');

  const handleReject = (redemptionId: string) => {
    if (rejectReason.trim()) {
      onReject(redemptionId, rejectReason);
      setRejectingId(null);
      setRejectReason('');
    }
  };

  if (redemptions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <div className="text-4xl mb-2">📋</div>
        <h3 className="font-medium text-gray-900">No pending redemptions</h3>
        <p className="mt-1 text-sm text-gray-500">
          Redemption requests will appear here for approval
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Approval */}
      {pendingApproval.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            Awaiting Approval ({pendingApproval.length})
          </h3>
          <div className="space-y-3">
            {pendingApproval.map((redemption) => {
              const member = getMember(redemption.memberId);
              const reward = getReward(redemption.rewardId);

              return (
                <div
                  key={redemption.id}
                  className="rounded-lg border border-yellow-200 bg-yellow-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-2xl">
                      {reward?.icon || '🎁'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        {member?.name || 'Unknown'} wants to redeem
                      </p>
                      <p className="text-sm text-gray-600">{reward?.title || 'Unknown reward'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(redemption.requestedAt)} • {redemption.pointsSpent} points
                      </p>
                      {redemption.notes && (
                        <p className="mt-2 text-sm text-gray-600 italic">
                          "{redemption.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {rejectingId === redemption.id ? (
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason for rejection..."
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRejectingId(null);
                            setRejectReason('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(redemption.id)}
                          disabled={!rejectReason.trim()}
                        >
                          Confirm Reject
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => onApprove(redemption.id)}
                        disabled={isProcessing === redemption.id}
                      >
                        {isProcessing === redemption.id ? 'Processing...' : 'Approve'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectingId(redemption.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Approved - Ready to Fulfill */}
      {approved.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            Ready to Fulfill ({approved.length})
          </h3>
          <div className="space-y-3">
            {approved.map((redemption) => {
              const member = getMember(redemption.memberId);
              const reward = getReward(redemption.rewardId);

              return (
                <div
                  key={redemption.id}
                  className="rounded-lg border border-green-200 bg-green-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-2xl">
                      {reward?.icon || '🎁'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        {member?.name || 'Unknown'}'s reward is approved
                      </p>
                      <p className="text-sm text-gray-600">{reward?.title || 'Unknown reward'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Approved {redemption.approvedAt ? formatDate(redemption.approvedAt) : ''}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onFulfill(redemption.id)}
                      disabled={isProcessing === redemption.id}
                    >
                      {isProcessing === redemption.id ? 'Processing...' : 'Mark Fulfilled'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
