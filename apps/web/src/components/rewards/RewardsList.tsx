import { useState } from 'react';
import type { Reward, RewardType } from '@chorechamp/types';
import { RewardCard } from './RewardCard';

interface RewardsListProps {
  rewards: Reward[];
  currentPoints: number;
  onRedeem: (rewardId: string) => void;
  onEdit?: (rewardId: string) => void;
  redeemingId: string | null;
  isParent?: boolean;
}

const TYPE_FILTERS: { value: RewardType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Rewards' },
  { value: 'screen_time', label: 'Screen Time' },
  { value: 'money', label: 'Money' },
  { value: 'privilege', label: 'Privileges' },
  { value: 'activity', label: 'Activities' },
  { value: 'custom', label: 'Custom' },
];

export function RewardsList({
  rewards,
  currentPoints,
  onRedeem,
  onEdit,
  redeemingId,
  isParent,
}: RewardsListProps) {
  const [typeFilter, setTypeFilter] = useState<RewardType | 'all'>('all');
  const [showAffordableOnly, setShowAffordableOnly] = useState(false);

  const filteredRewards = rewards.filter((reward) => {
    if (typeFilter !== 'all' && reward.type !== typeFilter) return false;
    if (showAffordableOnly && reward.pointCost > currentPoints) return false;
    return true;
  });

  const activeRewards = filteredRewards.filter((r) => r.isActive);
  const inactiveRewards = filteredRewards.filter((r) => !r.isActive);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setTypeFilter(filter.value)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                typeFilter === filter.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <label className="ml-auto flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showAffordableOnly}
            onChange={(e) => setShowAffordableOnly(e.target.checked)}
            className="rounded border-gray-300"
          />
          Show affordable only
        </label>
      </div>

      {/* Active Rewards */}
      {activeRewards.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeRewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              canAfford={currentPoints >= reward.pointCost}
              onRedeem={() => onRedeem(reward.id)}
              onEdit={onEdit ? () => onEdit(reward.id) : undefined}
              isRedeeming={redeemingId === reward.id}
              isParent={isParent}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <div className="text-4xl mb-2">🎁</div>
          <h3 className="font-medium text-gray-900">No rewards available</h3>
          <p className="mt-1 text-sm text-gray-500">
            {rewards.length === 0
              ? 'No rewards have been created yet'
              : 'No rewards match your current filters'}
          </p>
        </div>
      )}

      {/* Inactive Rewards (only for parents) */}
      {isParent && inactiveRewards.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            Inactive Rewards ({inactiveRewards.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
            {inactiveRewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                canAfford={currentPoints >= reward.pointCost}
                onRedeem={() => onRedeem(reward.id)}
                onEdit={onEdit ? () => onEdit(reward.id) : undefined}
                isRedeeming={redeemingId === reward.id}
                isParent={isParent}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
