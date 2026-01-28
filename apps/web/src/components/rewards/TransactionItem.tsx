import { cn } from '@chorechamp/ui';
import type { PointTransaction, TransactionType } from '@chorechamp/types';

interface TransactionItemProps {
  transaction: PointTransaction;
}

const transactionConfig: Record<
  TransactionType,
  { icon: string; label: string; color: string }
> = {
  chore_completion: {
    icon: '✅',
    label: 'Chore Completed',
    color: 'text-green-600',
  },
  streak_bonus: {
    icon: '🔥',
    label: 'Streak Bonus',
    color: 'text-orange-600',
  },
  badge_bonus: {
    icon: '🏆',
    label: 'Badge Earned',
    color: 'text-purple-600',
  },
  family_goal: {
    icon: '👨‍👩‍👧‍👦',
    label: 'Family Goal',
    color: 'text-blue-600',
  },
  boss_battle: {
    icon: '⚔️',
    label: 'Boss Defeated',
    color: 'text-red-600',
  },
  reward_redemption: {
    icon: '🎁',
    label: 'Reward Redeemed',
    color: 'text-pink-600',
  },
  streak_freeze_purchase: {
    icon: '❄️',
    label: 'Streak Freeze',
    color: 'text-cyan-600',
  },
  manual_adjustment: {
    icon: '✏️',
    label: 'Adjustment',
    color: 'text-gray-600',
  },
};

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const config = transactionConfig[transaction.transactionType];
  const isPositive = transaction.amount > 0;

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl">
        {config.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {transaction.description || config.label}
        </p>
        <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
      </div>

      <div
        className={cn(
          'text-right font-semibold tabular-nums',
          isPositive ? 'text-green-600' : 'text-red-600'
        )}
      >
        {isPositive ? '+' : ''}
        {transaction.amount.toLocaleString()}
      </div>
    </div>
  );
}
