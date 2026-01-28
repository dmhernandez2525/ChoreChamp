import { Button, cn } from '@chorechamp/ui';

export type ReportType =
  | 'chore_summary'
  | 'points_summary'
  | 'member_activity'
  | 'reward_history'
  | 'streak_report'
  | 'badge_progress';

export interface Report {
  id: ReportType;
  name: string;
  description: string;
  icon: string;
  lastGenerated?: Date;
}

interface ReportCardProps {
  report: Report;
  onGenerate: () => void;
  onExport: () => void;
  isGenerating?: boolean;
  className?: string;
}

export function ReportCard({
  report,
  onGenerate,
  onExport,
  isGenerating,
  className,
}: ReportCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-2xl">
          {report.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{report.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{report.description}</p>
          {report.lastGenerated && (
            <p className="text-xs text-gray-400 mt-1">
              Last generated: {report.lastGenerated.toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4">
        <Button
          variant="default"
          size="sm"
          onClick={onGenerate}
          disabled={isGenerating}
          className="flex-1"
        >
          {isGenerating ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generating...
            </>
          ) : (
            'Generate Report'
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={onExport}>
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export
        </Button>
      </div>
    </div>
  );
}
