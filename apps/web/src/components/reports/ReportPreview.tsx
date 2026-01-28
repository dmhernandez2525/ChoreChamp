import { cn } from '@chorechamp/ui';
import type { ReportType } from './ReportCard';

interface ChoreData {
  name: string;
  completed: number;
  total: number;
  completionRate: number;
}

interface MemberData {
  name: string;
  choresCompleted: number;
  pointsEarned: number;
  currentStreak: number;
}

interface ReportData {
  type: ReportType;
  generatedAt: Date;
  dateRange: { start: Date; end: Date };
  summary: {
    totalChores: number;
    completedChores: number;
    totalPoints: number;
    averageStreak: number;
  };
  choreBreakdown: ChoreData[];
  memberBreakdown: MemberData[];
}

interface ReportPreviewProps {
  data: ReportData | null;
  isLoading?: boolean;
  className?: string;
}

const reportTitles: Record<ReportType, string> = {
  chore_summary: 'Chore Summary Report',
  points_summary: 'Points Summary Report',
  member_activity: 'Member Activity Report',
  reward_history: 'Reward History Report',
  streak_report: 'Streak Report',
  badge_progress: 'Badge Progress Report',
};

export function ReportPreview({ data, isLoading, className }: ReportPreviewProps) {
  if (isLoading) {
    return (
      <div className={cn('rounded-xl border border-gray-200 bg-white p-8', className)}>
        <div className="flex flex-col items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-gray-500">Generating report...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cn('rounded-xl border border-gray-200 bg-white p-8', className)}>
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <h3 className="font-medium text-gray-900">No Report Generated</h3>
          <p className="text-sm text-gray-500 mt-1">
            Select a report and click "Generate Report" to preview data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white overflow-hidden', className)}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <h2 className="text-lg font-bold text-gray-900">{reportTitles[data.type]}</h2>
        <p className="text-sm text-gray-500">
          {data.dateRange.start.toLocaleDateString()} - {data.dateRange.end.toLocaleDateString()}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-600 font-medium">Total Chores</p>
          <p className="text-2xl font-bold text-blue-900">{data.summary.totalChores}</p>
        </div>
        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-sm text-green-600 font-medium">Completed</p>
          <p className="text-2xl font-bold text-green-900">{data.summary.completedChores}</p>
        </div>
        <div className="rounded-lg bg-yellow-50 p-4">
          <p className="text-sm text-yellow-600 font-medium">Total Points</p>
          <p className="text-2xl font-bold text-yellow-900">{data.summary.totalPoints}</p>
        </div>
        <div className="rounded-lg bg-orange-50 p-4">
          <p className="text-sm text-orange-600 font-medium">Avg Streak</p>
          <p className="text-2xl font-bold text-orange-900">{data.summary.averageStreak} days</p>
        </div>
      </div>

      {/* Chore breakdown */}
      <div className="px-6 pb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Chore Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-500">Chore</th>
                <th className="text-right py-2 font-medium text-gray-500">Completed</th>
                <th className="text-right py-2 font-medium text-gray-500">Total</th>
                <th className="text-right py-2 font-medium text-gray-500">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.choreBreakdown.map((chore, index) => (
                <tr key={index}>
                  <td className="py-2 text-gray-900">{chore.name}</td>
                  <td className="py-2 text-right text-gray-600">{chore.completed}</td>
                  <td className="py-2 text-right text-gray-600">{chore.total}</td>
                  <td className="py-2 text-right">
                    <span
                      className={cn(
                        'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                        chore.completionRate >= 80
                          ? 'bg-green-100 text-green-700'
                          : chore.completionRate >= 50
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      )}
                    >
                      {chore.completionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member breakdown */}
      <div className="px-6 pb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Member Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-500">Member</th>
                <th className="text-right py-2 font-medium text-gray-500">Chores</th>
                <th className="text-right py-2 font-medium text-gray-500">Points</th>
                <th className="text-right py-2 font-medium text-gray-500">Streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.memberBreakdown.map((member, index) => (
                <tr key={index}>
                  <td className="py-2 text-gray-900 font-medium">{member.name}</td>
                  <td className="py-2 text-right text-gray-600">{member.choresCompleted}</td>
                  <td className="py-2 text-right text-gray-600">{member.pointsEarned}</td>
                  <td className="py-2 text-right">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-orange-500">🔥</span>
                      {member.currentStreak}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 text-center">
        <p className="text-xs text-gray-500">
          Generated on {data.generatedAt.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
