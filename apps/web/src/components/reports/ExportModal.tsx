import { useState } from 'react';
import { Button, cn } from '@chorechamp/ui';
import type { ReportType } from './ReportCard';

export type ExportFormat = 'csv' | 'pdf' | 'json';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType | null;
  onExport: (format: ExportFormat) => void;
  isExporting?: boolean;
}

const formatOptions: { id: ExportFormat; name: string; description: string; icon: string }[] = [
  {
    id: 'csv',
    name: 'CSV',
    description: 'Spreadsheet format, compatible with Excel and Google Sheets',
    icon: '📊',
  },
  {
    id: 'pdf',
    name: 'PDF',
    description: 'Printable document format with charts and tables',
    icon: '📄',
  },
  {
    id: 'json',
    name: 'JSON',
    description: 'Raw data format for developers and integrations',
    icon: '{ }',
  },
];

const reportNames: Record<ReportType, string> = {
  chore_summary: 'Chore Summary',
  points_summary: 'Points Summary',
  member_activity: 'Member Activity',
  reward_history: 'Reward History',
  streak_report: 'Streak Report',
  badge_progress: 'Badge Progress',
};

export function ExportModal({
  isOpen,
  onClose,
  reportType,
  onExport,
  isExporting,
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');

  if (!isOpen || !reportType) return null;

  const handleExport = () => {
    onExport(selectedFormat);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Export Report</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Report name */}
        <p className="text-gray-600 mb-4">
          Exporting: <span className="font-medium text-gray-900">{reportNames[reportType]}</span>
        </p>

        {/* Format selection */}
        <div className="space-y-2 mb-6">
          <p className="text-sm font-medium text-gray-700">Select Format</p>
          {formatOptions.map((format) => (
            <button
              key={format.id}
              onClick={() => setSelectedFormat(format.id)}
              className={cn(
                'flex items-start gap-3 w-full p-3 rounded-lg border-2 text-left transition-colors',
                selectedFormat === format.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <span className="text-xl">{format.icon}</span>
              <div>
                <p className="font-medium text-gray-900">{format.name}</p>
                <p className="text-sm text-gray-500">{format.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
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
                Exporting...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
