import { Button } from '@chorechamp/ui';
import type { Reward } from '@chorechamp/types';
import { PointsDisplay } from './PointsDisplay';

interface RewardCardProps {
  reward: Reward;
  canAfford: boolean;
  onRedeem: () => void;
  onEdit?: () => void;
  isRedeeming?: boolean;
  isParent?: boolean;
}

const typeColors: Record<string, string> = {
  screen_time: 'bg-blue-100 text-blue-700',
  money: 'bg-green-100 text-green-700',
  privilege: 'bg-purple-100 text-purple-700',
  activity: 'bg-orange-100 text-orange-700',
  custom: 'bg-gray-100 text-gray-700',
};

const typeLabels: Record<string, string> = {
  screen_time: 'Screen Time',
  money: 'Money',
  privilege: 'Privilege',
  activity: 'Activity',
  custom: 'Custom',
};

export function RewardCard({
  reward,
  canAfford,
  onRedeem,
  onEdit,
  isRedeeming,
  isParent,
}: RewardCardProps) {
  const isAvailable = reward.isActive && (reward.quantityRemaining === null || reward.quantityRemaining > 0);
  const isLimited = reward.quantity !== null;

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 text-3xl">
          {reward.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{reward.title}</h3>
          {reward.description && (
            <p className="text-sm text-gray-500 line-clamp-2">{reward.description}</p>
          )}
        </div>
      </div>

      {/* Type badge and quantity */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[reward.type]}`}>
          {typeLabels[reward.type]}
        </span>
        {isLimited && (
          <span className="text-xs text-gray-500">
            {reward.quantityRemaining} / {reward.quantity} remaining
          </span>
        )}
        {!reward.isActive && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            Inactive
          </span>
        )}
      </div>

      {/* Cost */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Cost:</span>
          <PointsDisplay points={reward.pointCost} size="lg" />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2 pt-2 border-t">
        {isParent && onEdit && (
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            Edit
          </Button>
        )}
        <Button
          size="sm"
          className="flex-1"
          onClick={onRedeem}
          disabled={!isAvailable || !canAfford || isRedeeming}
        >
          {isRedeeming
            ? 'Redeeming...'
            : !isAvailable
              ? 'Unavailable'
              : !canAfford
                ? 'Not Enough Points'
                : 'Redeem'}
        </Button>
      </div>
    </div>
  );
}
