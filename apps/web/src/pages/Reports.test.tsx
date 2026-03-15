import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: () => ({ householdId: 'household-123' }),
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// Mock API client hooks
let mockHouseholdData: { data: unknown } = {
  data: { id: 'household-123', name: 'Test Family' },
};
const mockRefetchSummary = vi.fn().mockResolvedValue(undefined);
let mockSummaryData: { data: unknown; refetch: () => Promise<void> } = {
  data: {
    overall: { uniqueChores: 5, totalCompletions: 20, totalPoints: 300 },
    members: [
      { memberName: 'Test User', completions: 10, points: 150, currentStreak: 3 },
      { memberName: 'Jane', completions: 10, points: 150, currentStreak: 5 },
    ],
    topChores: [
      { choreName: 'Dishes', completions: 8 },
      { choreName: 'Vacuum', completions: 6 },
    ],
  },
  refetch: mockRefetchSummary,
};

const mockExportReport = vi.fn().mockResolvedValue({ data: 'exported' });

vi.mock('@chorechamp/api-client', () => ({
  useHousehold: () => mockHouseholdData,
  useReportSummary: () => mockSummaryData,
  apiClient: {
    exportReport: (...args: unknown[]) => mockExportReport(...args),
  },
}));

// Mock subscription
let mockHasExtendedHistory = false;
vi.mock('../lib/subscription', () => ({
  hasFeature: (_household: unknown, feature: string) => {
    if (feature === 'extended_history') return mockHasExtendedHistory;
    return false;
  },
}));

// Mock UI
vi.mock('@chorechamp/ui', () => ({
  Button: ({ children, onClick, disabled, type, ...props }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: string; [key: string]: unknown }) => (
    <button onClick={onClick} disabled={disabled} type={type as 'button' | 'submit' | 'reset' | undefined} {...props}>{children}</button>
  ),
}));

// Mock report components
vi.mock('../components/reports', () => ({
  DateRangePicker: ({ onChange }: { onChange: (range: { start: Date; end: Date }) => void }) => (
    <div data-testid="date-range-picker">
      <button onClick={() => onChange({ start: new Date('2025-01-01'), end: new Date('2025-01-31') })}>
        Change Range
      </button>
    </div>
  ),
  ReportList: ({ onGenerate, onExport }: { onGenerate: (id: string) => void; onExport: (id: string) => void; generatingReports: string[] }) => (
    <div data-testid="report-list">
      <button onClick={() => onGenerate('chore_summary')}>Generate Chore Summary</button>
      <button onClick={() => onExport('chore_summary')}>Export Chore Summary</button>
    </div>
  ),
  ExportModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; reportType: string | null; onExport: (format: string) => void }) => (
    isOpen ? <div data-testid="export-modal"><button onClick={onClose}>Close Modal</button></div> : null
  ),
  ReportPreview: ({ data, isLoading }: { data: unknown; isLoading: boolean }) => (
    <div data-testid="report-preview">
      {isLoading ? 'Loading preview...' : data ? 'Report preview' : 'No report selected'}
    </div>
  ),
}));

import Reports from './Reports';

describe('Reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHouseholdData = { data: { id: 'household-123', name: 'Test Family' } };
    mockSummaryData = {
      data: {
        overall: { uniqueChores: 5, totalCompletions: 20, totalPoints: 300 },
        members: [
          { memberName: 'Test User', completions: 10, points: 150, currentStreak: 3 },
        ],
        topChores: [{ choreName: 'Dishes', completions: 8 }],
      },
      refetch: mockRefetchSummary,
    };
    mockHasExtendedHistory = false;
    mockExportReport.mockResolvedValue({ data: 'exported' });
  });

  it('renders the Reports heading', () => {
    render(<Reports />);
    expect(screen.getByText('Reports & Export')).toBeInTheDocument();
    expect(screen.getByText('Generate reports and export your data')).toBeInTheDocument();
  });

  it('renders the date range picker', () => {
    render(<Reports />);
    expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
  });

  it('renders available reports section', () => {
    render(<Reports />);
    expect(screen.getByText('Available Reports')).toBeInTheDocument();
    expect(screen.getByTestId('report-list')).toBeInTheDocument();
  });

  it('renders the preview section', () => {
    render(<Reports />);
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByTestId('report-preview')).toBeInTheDocument();
    expect(screen.getByText('No report selected')).toBeInTheDocument();
  });

  it('renders quick export buttons', () => {
    render(<Reports />);
    expect(screen.getByText('Quick Export')).toBeInTheDocument();
    expect(screen.getByText('Export All (CSV)')).toBeInTheDocument();
    expect(screen.getByText('Export All (JSON)')).toBeInTheDocument();
  });

  it('shows upgrade notice for free plan users', () => {
    render(<Reports />);
    expect(screen.getByText(/Free and Family plans include 30 days/)).toBeInTheDocument();
  });

  it('does not show upgrade notice for premium users', () => {
    mockHasExtendedHistory = true;
    render(<Reports />);
    expect(screen.queryByText(/Free and Family plans include 30 days/)).not.toBeInTheDocument();
  });

  it('opens export modal when export button is clicked in report list', async () => {
    const user = userEvent.setup();
    render(<Reports />);

    await user.click(screen.getByText('Export Chore Summary'));
    expect(screen.getByTestId('export-modal')).toBeInTheDocument();
  });

  it('closes export modal', async () => {
    const user = userEvent.setup();
    render(<Reports />);

    await user.click(screen.getByText('Export Chore Summary'));
    expect(screen.getByTestId('export-modal')).toBeInTheDocument();

    await user.click(screen.getByText('Close Modal'));
    expect(screen.queryByTestId('export-modal')).not.toBeInTheDocument();
  });

  it('renders back button linking to the household page', () => {
    render(<Reports />);
    const backLink = screen.getByText('Back').closest('button');
    expect(backLink).toBeInTheDocument();
  });
});
