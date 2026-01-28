import { ReportCard } from './ReportCard';
import type { Report, ReportType } from './ReportCard';

interface ReportListProps {
  onGenerate: (reportId: ReportType) => void;
  onExport: (reportId: ReportType) => void;
  generatingReports: ReportType[];
}

const availableReports: Report[] = [
  {
    id: 'chore_summary',
    name: 'Chore Summary',
    description: 'Overview of all chores completed, pending, and overdue',
    icon: '🧹',
    lastGenerated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
  {
    id: 'points_summary',
    name: 'Points Summary',
    description: 'Detailed breakdown of points earned and spent',
    icon: '⭐',
    lastGenerated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
  },
  {
    id: 'member_activity',
    name: 'Member Activity',
    description: 'Individual activity reports for each family member',
    icon: '👥',
  },
  {
    id: 'reward_history',
    name: 'Reward History',
    description: 'All rewards redeemed and pending fulfillment',
    icon: '🎁',
  },
  {
    id: 'streak_report',
    name: 'Streak Report',
    description: 'Current and historical streak data for all members',
    icon: '🔥',
  },
  {
    id: 'badge_progress',
    name: 'Badge Progress',
    description: 'Badge achievements and progress towards unlocking',
    icon: '🏆',
  },
];

export function ReportList({ onGenerate, onExport, generatingReports }: ReportListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {availableReports.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          onGenerate={() => onGenerate(report.id)}
          onExport={() => onExport(report.id)}
          isGenerating={generatingReports.includes(report.id)}
        />
      ))}
    </div>
  );
}
