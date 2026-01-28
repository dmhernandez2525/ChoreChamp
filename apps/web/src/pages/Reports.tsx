import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import {
  DateRangePicker,
  ReportList,
  ExportModal,
  ReportPreview,
} from '../components/reports';
import type { ReportType, ExportFormat } from '../components/reports';

// Demo report data
const demoReportData = {
  type: 'chore_summary' as ReportType,
  generatedAt: new Date(),
  dateRange: {
    start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    end: new Date(),
  },
  summary: {
    totalChores: 156,
    completedChores: 142,
    totalPoints: 2450,
    averageStreak: 8,
  },
  choreBreakdown: [
    { name: 'Take out trash', completed: 28, total: 30, completionRate: 93 },
    { name: 'Wash dishes', completed: 45, total: 50, completionRate: 90 },
    { name: 'Clean bedroom', completed: 20, total: 24, completionRate: 83 },
    { name: 'Do laundry', completed: 12, total: 16, completionRate: 75 },
    { name: 'Vacuum living room', completed: 8, total: 12, completionRate: 67 },
    { name: 'Mow lawn', completed: 3, total: 4, completionRate: 75 },
  ],
  memberBreakdown: [
    { name: 'Emma', choresCompleted: 52, pointsEarned: 890, currentStreak: 14 },
    { name: 'Jake', choresCompleted: 48, pointsEarned: 820, currentStreak: 7 },
    { name: 'Mom', choresCompleted: 28, pointsEarned: 480, currentStreak: 21 },
    { name: 'Dad', choresCompleted: 14, pointsEarned: 260, currentStreak: 3 },
  ],
};

export default function Reports() {
  const { householdId } = useParams<{ householdId: string }>();
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    end: new Date(),
  });
  const [generatingReports, setGeneratingReports] = useState<ReportType[]>([]);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportingReport, setExportingReport] = useState<ReportType | null>(null);
  const [currentReport, setCurrentReport] = useState<typeof demoReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = (reportId: ReportType) => {
    setGeneratingReports((prev) => [...prev, reportId]);
    setIsGenerating(true);

    // Simulate report generation
    setTimeout(() => {
      setGeneratingReports((prev) => prev.filter((id) => id !== reportId));
      setCurrentReport({ ...demoReportData, type: reportId, generatedAt: new Date(), dateRange });
      setIsGenerating(false);
    }, 1500);
  };

  const handleExportClick = (reportId: ReportType) => {
    setExportingReport(reportId);
    setExportModalOpen(true);
  };

  const handleExport = (format: ExportFormat) => {
    // Simulate export
    console.log(`Exporting ${exportingReport} as ${format}`);

    setTimeout(() => {
      setExportModalOpen(false);
      setExportingReport(null);
      // In a real app, this would trigger a file download
      alert(`Report exported as ${format.toUpperCase()}`);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={`/households/${householdId}`}>
              <Button variant="ghost" size="sm">
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports & Export</h1>
              <p className="text-sm text-gray-500">Generate reports and export your data</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Date range picker */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Date Range</h2>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Report selection */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Reports</h2>
            <ReportList
              onGenerate={handleGenerate}
              onExport={handleExportClick}
              generatingReports={generatingReports}
            />
          </div>

          {/* Report preview */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
            <ReportPreview data={currentReport} isLoading={isGenerating} />
          </div>
        </div>

        {/* Quick export section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Export</h2>
          <p className="text-gray-600 mb-4">
            Export all your household data at once for backup or analysis purposes.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => alert('Exporting all data as CSV...')}>
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export All (CSV)
            </Button>
            <Button variant="outline" onClick={() => alert('Exporting all data as JSON...')}>
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export All (JSON)
            </Button>
            <Button variant="outline" onClick={() => alert('Creating backup...')}>
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              Create Backup
            </Button>
          </div>
        </div>
      </main>

      {/* Export modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => {
          setExportModalOpen(false);
          setExportingReport(null);
        }}
        reportType={exportingReport}
        onExport={handleExport}
      />
    </div>
  );
}
