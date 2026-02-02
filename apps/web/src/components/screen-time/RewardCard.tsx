import type { ScreenTimeReward, ScreenTimeRewardType } from '@chorechamp/types';

interface RewardCardProps {
  reward: ScreenTimeReward;
  onUse?: (rewardId: string) => void;
}

const rewardTypeConfig: Record<ScreenTimeRewardType, { icon: string; label: string; color: string }> = {
  bonus_minutes: { icon: '⏱️', label: 'Bonus Time', color: 'blue' },
  extend_bedtime: { icon: '🌙', label: 'Extended Bedtime', color: 'purple' },
  unlock_app: { icon: '🔓', label: 'App Unlock', color: 'green' },
  unlock_device: { icon: '📱', label: 'Device Unlock', color: 'teal' },
  weekend_bonus: { icon: '🎉', label: 'Weekend Bonus', color: 'orange' },
  streaming_access: { icon: '📺', label: 'Streaming Access', color: 'red' },
};

const earnedFromLabels: Record<string, string> = {
  chore_completion: 'Completed Chore',
  bonus_chore: 'Bonus Chore',
  parent_grant: 'Parent Gift',
  achievement: 'Achievement',
  streak: 'Streak Bonus',
};

export function RewardCard({ reward, onUse }: RewardCardProps) {
  const config = rewardTypeConfig[reward.rewardType];

  const formatMinutes = (mins: number | null) => {
    if (!mins) return '';
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours === 0) return `+${minutes}m`;
    if (minutes === 0) return `+${hours}h`;
    return `+${hours}h ${minutes}m`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = reward.expiresAt && new Date(reward.expiresAt) < new Date();
  const isAvailable = !reward.isUsed && !isExpired;

  const getBackgroundColor = () => {
    if (!isAvailable) return 'bg-gray-100';
    switch (config.color) {
      case 'blue': return 'bg-blue-50';
      case 'purple': return 'bg-purple-50';
      case 'green': return 'bg-green-50';
      case 'teal': return 'bg-teal-50';
      case 'orange': return 'bg-orange-50';
      case 'red': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };

  const getTextColor = () => {
    if (!isAvailable) return 'text-gray-500';
    switch (config.color) {
      case 'blue': return 'text-blue-700';
      case 'purple': return 'text-purple-700';
      case 'green': return 'text-green-700';
      case 'teal': return 'text-teal-700';
      case 'orange': return 'text-orange-700';
      case 'red': return 'text-red-700';
      default: return 'text-gray-700';
    }
  };

  return (
    <div className={`rounded-lg p-4 ${getBackgroundColor()} ${
      !isAvailable ? 'opacity-60' : ''
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h4 className={`font-semibold ${getTextColor()}`}>
              {config.label}
            </h4>
            {reward.minutesAmount && (
              <p className={`text-lg font-bold ${getTextColor()}`}>
                {formatMinutes(reward.minutesAmount)}
              </p>
            )}
          </div>
        </div>

        {reward.isUsed && (
          <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium">
            Used
          </span>
        )}
        {isExpired && !reward.isUsed && (
          <span className="px-2 py-1 bg-red-200 text-red-600 rounded text-xs font-medium">
            Expired
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 mt-2">{reward.description}</p>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>
          {earnedFromLabels[reward.earnedFrom] || reward.earnedFrom}
          {reward.sourceName && `: ${reward.sourceName}`}
        </span>
        <span>{formatDate(reward.createdAt)}</span>
      </div>

      {reward.expiresAt && !reward.isUsed && (
        <p className={`mt-2 text-xs ${isExpired ? 'text-red-600' : 'text-gray-500'}`}>
          {isExpired ? 'Expired' : `Expires ${formatDate(reward.expiresAt)}`}
        </p>
      )}

      {reward.isUsed && reward.usedAt && (
        <p className="mt-2 text-xs text-gray-500">
          Used on {formatDate(reward.usedAt)}
        </p>
      )}

      {isAvailable && onUse && (
        <button
          onClick={() => onUse(reward.id)}
          className={`mt-3 w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            config.color === 'blue'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : config.color === 'purple'
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : config.color === 'green'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : config.color === 'orange'
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          Use Reward
        </button>
      )}
    </div>
  );
}
