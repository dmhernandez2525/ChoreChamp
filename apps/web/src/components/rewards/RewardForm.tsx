import { useState } from 'react';
import { Button } from '@chorechamp/ui';
import type { Reward, RewardType, CreateRewardRequest } from '@chorechamp/types';

interface RewardFormProps {
  initialData?: Reward;
  onSubmit: (data: CreateRewardRequest) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const REWARD_TYPES: { value: RewardType; label: string; icon: string }[] = [
  { value: 'screen_time', label: 'Screen Time', icon: '📱' },
  { value: 'money', label: 'Money', icon: '💵' },
  { value: 'privilege', label: 'Privilege', icon: '⭐' },
  { value: 'activity', label: 'Activity', icon: '🎮' },
  { value: 'custom', label: 'Custom', icon: '🎁' },
];

const SUGGESTED_ICONS = ['🎮', '📱', '🍦', '🎬', '🛍️', '🎯', '🎨', '📚', '🎵', '⚽', '🧸', '🎪'];

export function RewardForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: RewardFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [icon, setIcon] = useState(initialData?.icon || '🎁');
  const [type, setType] = useState<RewardType>(initialData?.type || 'custom');
  const [pointCost, setPointCost] = useState(initialData?.pointCost.toString() || '100');
  const [hasLimit, setHasLimit] = useState(initialData?.quantity !== null);
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || '10');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      title,
      description: description || undefined,
      icon,
      type,
      pointCost: parseInt(pointCost) || 0,
      quantity: hasLimit ? parseInt(quantity) || undefined : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Icon and Title */}
      <div className="flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Icon</label>
          <div className="mt-1 flex flex-wrap gap-2 max-w-[200px]">
            {SUGGESTED_ICONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-colors ${
                  icon === emoji
                    ? 'bg-blue-100 ring-2 ring-blue-500'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Reward Name
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="e.g., 30 Minutes of Screen Time"
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          placeholder="What does this reward include?"
          rows={2}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Reward Type</label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {REWARD_TYPES.map((rewardType) => (
            <button
              key={rewardType.value}
              type="button"
              onClick={() => setType(rewardType.value)}
              className={`flex flex-col items-center gap-1 rounded-lg border p-3 transition-colors ${
                type === rewardType.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">{rewardType.icon}</span>
              <span className="text-xs font-medium">{rewardType.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Point Cost */}
      <div>
        <label htmlFor="pointCost" className="block text-sm font-medium text-gray-700">
          Point Cost
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            id="pointCost"
            type="number"
            min="1"
            value={pointCost}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPointCost(e.target.value)}
            required
            className="w-32 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-gray-500">points</span>
        </div>
        <div className="mt-2 flex gap-2">
          {[50, 100, 250, 500, 1000].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPointCost(value.toString())}
              className={`rounded-full px-3 py-1 text-sm ${
                pointCost === value.toString()
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity Limit */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasLimit}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHasLimit(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Limit total quantity</span>
        </label>
        {hasLimit && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)}
              className="w-24 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">total available</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !title}>
          {isSubmitting
            ? 'Saving...'
            : initialData
              ? 'Save Changes'
              : 'Create Reward'}
        </Button>
      </div>
    </form>
  );
}
