import { useState } from 'react';
import { Button } from '@chorechamp/ui';
import type { PointTransaction, TransactionType } from '@chorechamp/types';
import { TransactionItem } from './TransactionItem';

interface PointsHistoryProps {
  transactions: PointTransaction[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

const FILTER_OPTIONS: { value: TransactionType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'chore_completion', label: 'Chores' },
  { value: 'streak_bonus', label: 'Streaks' },
  { value: 'badge_bonus', label: 'Badges' },
  { value: 'reward_redemption', label: 'Rewards' },
];

export function PointsHistory({
  transactions,
  isLoading,
  hasMore,
  onLoadMore,
}: PointsHistoryProps) {
  const [filter, setFilter] = useState<TransactionType | 'all'>('all');

  const filteredTransactions =
    filter === 'all'
      ? transactions
      : transactions.filter((t) => t.transactionType === filter);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900">Points History</h3>

        <div className="mt-3 flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                filter === option.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-100 px-4">
        {filteredTransactions.length === 0 ? (
          <div className="py-8 text-center">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-gray-500">
              {filter === 'all'
                ? 'No transactions yet'
                : 'No transactions of this type'}
            </p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))
        )}
      </div>

      {hasMore && (
        <div className="border-t border-gray-200 p-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
