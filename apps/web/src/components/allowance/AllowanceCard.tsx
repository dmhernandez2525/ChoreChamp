import { DollarSign, TrendingUp, Wallet, Clock } from 'lucide-react';
import type { AllowanceSummary } from '@chorechamp/types';

interface AllowanceCardProps {
  summary: AllowanceSummary;
  memberName: string;
  memberColor: string;
}

export function AllowanceCard({ summary, memberName, memberColor }: AllowanceCardProps) {
  const { currentBalance, settings, pendingPayout, nextPayoutDate, lifetimeEarnings } = summary;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentBalance.currency,
    }).format(amount);
  };

  if (!settings) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
            style={{ backgroundColor: memberColor }}
          >
            {memberName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{memberName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">No allowance set up</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Set up an allowance to convert points to money
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
            style={{ backgroundColor: memberColor }}
          >
            {memberName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{memberName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {settings.pointsPerDollar} points = {formatCurrency(1)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(currentBalance.estimatedValue)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Available to cash out
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <Wallet className="w-4 h-4" />
            <span className="text-xs">Total Points</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {currentBalance.totalPoints.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs">Reserve</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {currentBalance.reservePoints.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Lifetime Earned</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(lifetimeEarnings.totalAmountPaid)}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Next Payout</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {nextPayoutDate || 'Not scheduled'}
          </p>
        </div>
      </div>

      {/* Pending payout alert */}
      {pendingPayout && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Payout Pending
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {pendingPayout.pointsConverted.toLocaleString()} points → {formatCurrency(pendingPayout.amountDue)}
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-full text-sm font-medium">
              Awaiting Payment
            </span>
          </div>
        </div>
      )}

      {/* Payout frequency info */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Payouts: {settings.payoutFrequency} •
          Minimum: {formatCurrency(settings.minimumPayout)}
          {settings.maximumPayout && ` • Maximum: ${formatCurrency(settings.maximumPayout)}`}
        </p>
      </div>
    </div>
  );
}
