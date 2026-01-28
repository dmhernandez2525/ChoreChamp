import { cn } from '@chorechamp/ui';
import type { FamilyParty } from '@chorechamp/types';

interface FamilyGoalProgressProps {
  party: FamilyParty;
  className?: string;
}

function getHealthStatus(current: number, max: number): { label: string; color: string } {
  const percentage = (current / max) * 100;
  if (percentage >= 80) return { label: 'Excellent!', color: 'text-green-600' };
  if (percentage >= 60) return { label: 'Good', color: 'text-blue-600' };
  if (percentage >= 40) return { label: 'Fair', color: 'text-yellow-600' };
  if (percentage >= 20) return { label: 'Low', color: 'text-orange-600' };
  return { label: 'Critical!', color: 'text-red-600' };
}

export function FamilyGoalProgress({ party, className }: FamilyGoalProgressProps) {
  const weeklyPercentage = Math.min((party.weeklyProgress / party.weeklyGoal) * 100, 100);
  const healthPercentage = (party.healthCurrent / party.healthMax) * 100;
  const healthStatus = getHealthStatus(party.healthCurrent, party.healthMax);

  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-4', className)}>
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-xl">👨‍👩‍👧‍👦</span>
        Family Progress
      </h3>

      {/* Weekly Goal */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Weekly Chore Goal</span>
          <span className="font-medium">
            {party.weeklyProgress} / {party.weeklyGoal}
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-200">
          <div
            className={cn(
              'h-3 rounded-full transition-all',
              weeklyPercentage >= 100 ? 'bg-green-500' : 'bg-blue-500'
            )}
            style={{ width: `${weeklyPercentage}%` }}
          />
        </div>
        {weeklyPercentage >= 100 && (
          <p className="text-xs text-green-600 font-medium">
            Goal achieved this week! Great teamwork!
          </p>
        )}
      </div>

      {/* Party Health */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Party Health</span>
          <span className={cn('font-medium', healthStatus.color)}>
            {healthStatus.label}
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-200">
          <div
            className={cn(
              'h-3 rounded-full transition-all',
              healthPercentage >= 80
                ? 'bg-green-500'
                : healthPercentage >= 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            )}
            style={{ width: `${healthPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{party.healthCurrent} HP</span>
          <span>Max: {party.healthMax} HP</span>
        </div>
      </div>

      {/* Boss Status */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Boss Battle</span>
          {party.bossActive ? (
            <span className="flex items-center gap-1 text-sm font-medium text-red-600">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Active
            </span>
          ) : (
            <span className="text-sm text-gray-500">No active boss</span>
          )}
        </div>
      </div>
    </div>
  );
}
