import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import {
  useReportSummary,
  apiClient,
} from '@chorechamp/api-client';
import {
  DateRangePicker,
  ReportList,
  ExportModal,
  ReportPreview,
} from '../components/reports';
import type { ReportType, ExportFormat } from '../components/reports';

export default function Reports() {
  const { householdId } = useParams<{ householdId: string }>();
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    end: new Date(),
  });
  const [generatingReports, setGeneratingReports] = useState<ReportType[]>([]);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportingReport, setExportingReport] = useState<ReportType | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);

  const dateOptions = useMemo(() => ({
    startDate: dateRange.start.toISOString().split('T')[0],
    endDate: dateRange.end.toISOString().split('T')[0],
  }), [dateRange]);

  const { data: summaryData, refetch: refetchSummary } = useReportSummary(
    householdId!,
    dateOptions
  );

  // Transform API data to component format
  const currentReport = useMemo(() => {
    if (!summaryData || !selectedReportType) return null;

    const avgStreak = summaryData.members.length > 0
      ? Math.round(summaryData.members.reduce((sum, m) => sum + m.currentStreak, 0) / summaryData.members.length)
      : 0;

    return {
      type: selectedReportType,
      generatedAt: new Date(),
      dateRange,
      summary: {
        totalChores: summaryData.overall.uniqueChores,
        completedChores: summaryData.overall.totalCompletions,
        totalPoints: summaryData.overall.totalPoints,
        averageStreak: avgStreak,
      },
      choreBreakdown: summaryData.topChores.map((c) => ({
        name: c.choreName,
        completed: c.completions,
        total: c.completions, // API doesn't track total assigned
        completionRate: 100,
      })),
      memberBreakdown: summaryData.members.map((m) => ({
        name: m.memberName,
        choresCompleted: m.completions,
        pointsEarned: m.points,
        currentStreak: m.currentStreak,
      })),
    };
  }, [summaryData, selectedReportType, dateRange]);

  const handleGenerate = async (reportId: ReportType) => {
    setGeneratingReports((prev) => [...prev, reportId]);
    setSelectedReportType(reportId);

    // Refetch data for the selected date range
    await refetchSummary();

    setGeneratingReports((prev) => prev.filter((id) => id !== reportId));
  };

  const handleExportClick = (reportId: ReportType) => {
    setExportingReport(reportId);
    setExportModalOpen(true);
  };

  const handleExport = async (format: ExportFormat) => {
    if (!householdId) return;

    try {
      const result = await apiClient.exportReport(householdId, {
        startDate: dateOptions.startDate,
        endDate: dateOptions.endDate,
        format: format as 'json' | 'csv',
      });

      if (format === 'csv' && result instanceof Blob) {
        // Download CSV file
        const url = URL.createObjectURL(result);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chorechamp-report-${dateOptions.startDate}-to-${dateOptions.endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Download JSON file
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chorechamp-report-${dateOptions.startDate}-to-${dateOptions.endDate}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report');
    }

    setExportModalOpen(false);
    setExportingReport(null);
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
            <ReportPreview data={currentReport} isLoading={generatingReports.length > 0} />
          </div>
        </div>

        {/* Quick export section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Export</h2>
          <p className="text-gray-600 mb-4">
            Export all your household data at once for backup or analysis purposes.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => handleExport('csv')}>
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
            <Button variant="outline" onClick={() => handleExport('json')}>
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
