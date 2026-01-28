import { useState } from 'react';
import { Button, cn } from '@chorechamp/ui';

interface StreakFreezeProps {
  freezesAvailable: number;
  freezesUsed: number;
  currentPoints: number;
  freezeCost: number;
  onPurchase: () => void;
  isPurchasing?: boolean;
  className?: string;
}

export function StreakFreeze({
  freezesAvailable,
  freezesUsed,
  currentPoints,
  freezeCost,
  onPurchase,
  isPurchasing,
  className,
}: StreakFreezeProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const canAfford = currentPoints >= freezeCost;
  const maxFreezes = 3;
  const hasRoom = freezesAvailable < maxFreezes;

  const handlePurchase = () => {
    onPurchase();
    setShowConfirm(false);
  };

  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-4', className)}>
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-cyan-100 text-3xl">
          ❄️
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Streak Freeze</h3>
          <p className="text-sm text-gray-500">
            Protect your streak on days you can't complete chores
          </p>
        </div>
      </div>

      {/* Available freezes */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm text-gray-600">Available:</span>
        <div className="flex gap-1">
          {Array.from({ length: maxFreezes }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg text-lg',
                i < freezesAvailable
                  ? 'bg-cyan-100 text-cyan-600'
                  : 'bg-gray-100 text-gray-300'
              )}
            >
              ❄️
            </div>
          ))}
        </div>
        <span className="text-sm text-gray-500">
          ({freezesUsed} used this month)
        </span>
      </div>

      {/* How it works */}
      <div className="mt-4 rounded-lg bg-gray-50 p-3">
        <p className="text-xs font-medium text-gray-700">How it works:</p>
        <ul className="mt-1 text-xs text-gray-500 space-y-1">
          <li>• Freezes auto-activate if you miss a day</li>
          <li>• Your streak stays intact!</li>
          <li>• Max {maxFreezes} freezes at a time</li>
          <li>• Freezes reset monthly</li>
        </ul>
      </div>

      {/* Purchase section */}
      {!showConfirm ? (
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Buy a Freeze</p>
            <p className="text-xs text-gray-500">{freezeCost} points</p>
          </div>
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={!canAfford || !hasRoom}
            size="sm"
          >
            {!hasRoom
              ? 'Max Reached'
              : !canAfford
                ? 'Not Enough Points'
                : 'Purchase'}
          </Button>
        </div>
      ) : (
        <div className="mt-4 rounded-lg bg-yellow-50 p-3">
          <p className="text-sm font-medium text-yellow-800">
            Confirm purchase?
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            This will deduct {freezeCost} points from your balance.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handlePurchase}
              disabled={isPurchasing}
            >
              {isPurchasing ? 'Purchasing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
