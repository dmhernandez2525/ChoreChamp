import { useState } from 'react';
import { Save, X } from 'lucide-react';
import type { AllowanceSettings, PayoutFrequency, CreateAllowanceSettingsRequest } from '@chorechamp/types';

interface AllowanceSettingsFormProps {
  memberId: string;
  memberName: string;
  existingSettings?: AllowanceSettings | null;
  onSave: (data: CreateAllowanceSettingsRequest) => Promise<void>;
  onCancel: () => void;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AllowanceSettingsForm({
  memberId,
  memberName,
  existingSettings,
  onSave,
  onCancel,
}: AllowanceSettingsFormProps) {
  const [pointsPerDollar, setPointsPerDollar] = useState(existingSettings?.pointsPerDollar || 100);
  const [currency, setCurrency] = useState(existingSettings?.currency || 'USD');
  const [payoutFrequency, setPayoutFrequency] = useState<PayoutFrequency>(
    existingSettings?.payoutFrequency || 'weekly'
  );
  const [payoutDayOfWeek, setPayoutDayOfWeek] = useState(existingSettings?.payoutDayOfWeek ?? 0);
  const [payoutDayOfMonth, setPayoutDayOfMonth] = useState(existingSettings?.payoutDayOfMonth ?? 1);
  const [minimumPayout, setMinimumPayout] = useState(existingSettings?.minimumPayout || 1);
  const [maximumPayout, setMaximumPayout] = useState<number | undefined>(
    existingSettings?.maximumPayout ?? undefined
  );
  const [reservePoints, setReservePoints] = useState(existingSettings?.reservePoints || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsSaving(true);
      await onSave({
        memberId,
        pointsPerDollar,
        currency,
        payoutFrequency,
        payoutDayOfWeek: payoutFrequency !== 'monthly' ? payoutDayOfWeek : undefined,
        payoutDayOfMonth: payoutFrequency === 'monthly' ? payoutDayOfMonth : undefined,
        minimumPayout,
        maximumPayout,
        reservePoints,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Allowance Settings for {memberName}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Conversion Rate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Points per dollar
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            value={pointsPerDollar}
            onChange={(e) => setPointsPerDollar(parseInt(e.target.value) || 1)}
            className="w-32 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            points = $1.00
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          100 points per dollar means earning 10 points gives $0.10
        </p>
      </div>

      {/* Currency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Currency
        </label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-32 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
          <option value="CAD">CAD ($)</option>
          <option value="AUD">AUD ($)</option>
        </select>
      </div>

      {/* Payout Frequency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Payout frequency
        </label>
        <div className="flex gap-3">
          {(['weekly', 'biweekly', 'monthly'] as PayoutFrequency[]).map((freq) => (
            <button
              key={freq}
              type="button"
              onClick={() => setPayoutFrequency(freq)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                payoutFrequency === freq
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {freq.charAt(0).toUpperCase() + freq.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Payout Day */}
      {payoutFrequency !== 'monthly' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Payout day
          </label>
          <select
            value={payoutDayOfWeek}
            onChange={(e) => setPayoutDayOfWeek(parseInt(e.target.value))}
            className="w-48 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {DAYS_OF_WEEK.map((day, index) => (
              <option key={day} value={index}>{day}</option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Day of month
          </label>
          <select
            value={payoutDayOfMonth}
            onChange={(e) => setPayoutDayOfMonth(parseInt(e.target.value))}
            className="w-32 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Days 29-31 not available to ensure consistency
          </p>
        </div>
      )}

      {/* Minimum and Maximum Payout */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Minimum payout
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={minimumPayout}
              onChange={(e) => setMinimumPayout(parseFloat(e.target.value) || 0)}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Maximum payout (optional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={maximumPayout || ''}
              onChange={(e) => setMaximumPayout(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="No limit"
              className="w-full pl-8 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Reserve Points */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Reserve points
        </label>
        <input
          type="number"
          min="0"
          value={reservePoints}
          onChange={(e) => setReservePoints(parseInt(e.target.value) || 0)}
          className="w-32 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Points kept in reserve, not available for payout
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}
