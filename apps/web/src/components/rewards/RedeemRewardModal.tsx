import { useState } from 'react';
import { Button } from '@chorechamp/ui';
import type { Reward } from '@chorechamp/types';
import { PointsDisplay } from './PointsDisplay';

interface RedeemRewardModalProps {
  reward: Reward | null;
  currentPoints: number;
  onClose: () => void;
  onConfirm: (notes?: string) => void;
  isRedeeming?: boolean;
}

export function RedeemRewardModal({
  reward,
  currentPoints,
  onClose,
  onConfirm,
  isRedeeming,
}: RedeemRewardModalProps) {
  const [notes, setNotes] = useState('');

  if (!reward) return null;

  const canAfford = currentPoints >= reward.pointCost;
  const pointsAfter = currentPoints - reward.pointCost;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-start gap-4 border-b p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-4xl">
              {reward.icon}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">Redeem Reward</h2>
              <p className="mt-1 text-gray-600">{reward.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {reward.description && (
              <p className="text-gray-600">{reward.description}</p>
            )}

            {/* Points breakdown */}
            <div className="rounded-lg bg-gray-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Your current balance</span>
                <PointsDisplay points={currentPoints} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Reward cost</span>
                <span className="text-red-600 font-medium">
                  -{reward.pointCost.toLocaleString()}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Balance after</span>
                <PointsDisplay
                  points={pointsAfter}
                  className={pointsAfter < 0 ? 'text-red-600' : ''}
                />
              </div>
            </div>

            {!canAfford && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                You need {(reward.pointCost - currentPoints).toLocaleString()} more points
                to redeem this reward.
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests?"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Approval notice */}
            <div className="flex items-start gap-2 text-sm text-gray-500">
              <span className="text-lg">ℹ️</span>
              <span>
                This redemption may require parent approval before it can be fulfilled.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t p-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm(notes || undefined)}
              disabled={!canAfford || isRedeeming}
            >
              {isRedeeming ? 'Redeeming...' : 'Confirm Redemption'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
