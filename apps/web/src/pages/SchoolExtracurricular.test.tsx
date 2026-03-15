import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: () => ({ householdId: 'hh-1' }),
}));

// Mock all school-extracurricular sub-components
vi.mock('../components/school-extracurricular', () => ({
  SchoolScheduleCard: ({ schedule, onDelete }: { schedule: { id: string; schoolName?: string }; onDelete: (id: string) => void }) => (
    <div data-testid={`school-card-${schedule.id}`}>
      <span>{schedule.schoolName || 'School'}</span>
      <button onClick={() => onDelete(schedule.id)}>Delete School</button>
    </div>
  ),
  ActivityCard: ({ activity, onDelete }: { activity: { id: string; name?: string }; onDelete: (id: string) => void }) => (
    <div data-testid={`activity-card-${activity.id}`}>
      <span>{activity.name || 'Activity'}</span>
      <button onClick={() => onDelete(activity.id)}>Delete Activity</button>
    </div>
  ),
  EventCard: ({ event, onDelete }: { event: { id: string; title?: string }; onDelete?: (id: string) => void }) => (
    <div data-testid={`event-card-${event.id}`}>
      <span>{event.title || 'Event'}</span>
      {onDelete && <button onClick={() => onDelete(event.id)}>Delete Event</button>}
    </div>
  ),
  VolunteerLogCard: ({ log, onVerify, onDelete }: { log: { id: string }; onVerify: (id: string) => void; onDelete: (id: string) => void }) => (
    <div data-testid={`volunteer-card-${log.id}`}>
      <button onClick={() => onVerify(log.id)}>Verify</button>
      <button onClick={() => onDelete(log.id)}>Delete</button>
    </div>
  ),
  CollegePrepCard: ({ activity, onUpdateStatus, onDelete }: {
    activity: { id: string; title?: string; status: string };
    onUpdateStatus?: (id: string, status: string) => void;
    onDelete: (id: string) => void;
  }) => (
    <div data-testid={`college-card-${activity.id}`}>
      <span>{activity.title || 'Task'}</span>
      {onUpdateStatus && <button onClick={() => onUpdateStatus(activity.id, 'completed')}>Complete</button>}
      <button onClick={() => onDelete(activity.id)}>Delete</button>
    </div>
  ),
  WeeklyCalendar: ({ onPrevWeek, onNextWeek }: {
    weekStart: Date;
    schoolSchedules: unknown[];
    classPeriods: unknown[];
    activitySchedules: unknown[];
    events: unknown[];
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onEventClick: (e: unknown) => void;
  }) => (
    <div data-testid="weekly-calendar">
      <button onClick={onPrevWeek}>Prev Week</button>
      <button onClick={onNextWeek}>Next Week</button>
    </div>
  ),
  BalanceCard: ({ recommendation, onAcknowledge }: {
    recommendation: { id: string };
    onAcknowledge?: (id: string) => void;
  }) => (
    <div data-testid={`balance-card-${recommendation.id}`}>
      {onAcknowledge && <button onClick={() => onAcknowledge(recommendation.id)}>Acknowledge</button>}
    </div>
  ),
  AddSchoolDialog: ({ open }: { open: boolean; [key: string]: unknown }) => (
    open ? <div data-testid="add-school-dialog">Add School</div> : null
  ),
  AddActivityDialog: ({ open }: { open: boolean; [key: string]: unknown }) => (
    open ? <div data-testid="add-activity-dialog">Add Activity</div> : null
  ),
  AddEventDialog: ({ open }: { open: boolean; [key: string]: unknown }) => (
    open ? <div data-testid="add-event-dialog">Add Event</div> : null
  ),
  AddVolunteerDialog: ({ open }: { open: boolean; [key: string]: unknown }) => (
    open ? <div data-testid="add-volunteer-dialog">Add Volunteer</div> : null
  ),
  AddCollegePrepDialog: ({ open }: { open: boolean; [key: string]: unknown }) => (
    open ? <div data-testid="add-college-dialog">Add College Prep</div> : null
  ),
}));

// Mock global fetch
const mockFetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = mockFetch;
});

function setupSuccessfulFetch() {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve([]),
  });
}

function setupFailedFetch() {
  mockFetch.mockRejectedValue(new Error('Network error'));
}

import SchoolExtracurricular from './SchoolExtracurricular';

describe('SchoolExtracurricular', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSuccessfulFetch();
  });

  it('renders the page heading after loading', async () => {
    render(<SchoolExtracurricular />);
    await waitFor(() => {
      expect(screen.getByText('School & Extracurricular')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Manage school schedules, activities, and maintain life balance')
    ).toBeInTheDocument();
  });

  it('shows a loading spinner initially', () => {
    // Make fetch never resolve so we catch loading state
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<SchoolExtracurricular />);
    expect(screen.queryByText('School & Extracurricular')).not.toBeInTheDocument();
    // The loading spinner has animate-spin class
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('shows error state with retry button on fetch failure', async () => {
    setupFailedFetch();
    render(<SchoolExtracurricular />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders all 7 tab buttons', async () => {
    render(<SchoolExtracurricular />);
    await waitFor(() => {
      expect(screen.getByText('Calendar')).toBeInTheDocument();
    });
    expect(screen.getByText('School')).toBeInTheDocument();
    expect(screen.getByText('Activities')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Volunteer')).toBeInTheDocument();
    expect(screen.getByText('College Prep')).toBeInTheDocument();
    expect(screen.getByText('Balance')).toBeInTheDocument();
  });

  it('shows the calendar tab by default', async () => {
    render(<SchoolExtracurricular />);
    await waitFor(() => {
      expect(screen.getByTestId('weekly-calendar')).toBeInTheDocument();
    });
  });

  it('switches to the School tab and shows empty state', async () => {
    const user = userEvent.setup();
    render(<SchoolExtracurricular />);

    await waitFor(() => {
      expect(screen.getByText('School')).toBeInTheDocument();
    });

    await user.click(screen.getByText('School'));
    expect(screen.getByText('School Schedules')).toBeInTheDocument();
    expect(screen.getByText('No school schedules yet')).toBeInTheDocument();
    expect(screen.getByText('Add First School')).toBeInTheDocument();
  });

  it('switches to the Activities tab and shows empty state', async () => {
    const user = userEvent.setup();
    render(<SchoolExtracurricular />);

    await waitFor(() => {
      expect(screen.getByText('Activities')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Activities'));
    expect(screen.getByText('Extracurricular Activities')).toBeInTheDocument();
    expect(screen.getByText('No activities yet')).toBeInTheDocument();
  });

  it('switches to the Events tab and shows empty state', async () => {
    const user = userEvent.setup();
    render(<SchoolExtracurricular />);

    await waitFor(() => {
      expect(screen.getByText('Events')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Events'));
    expect(screen.getByText('No events scheduled')).toBeInTheDocument();
  });

  it('switches to the Volunteer tab and shows empty state', async () => {
    const user = userEvent.setup();
    render(<SchoolExtracurricular />);

    await waitFor(() => {
      expect(screen.getByText('Volunteer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Volunteer'));
    expect(screen.getByText('Volunteer Hours')).toBeInTheDocument();
    expect(screen.getByText('No volunteer hours logged')).toBeInTheDocument();
  });

  it('retries loading when Retry button is clicked', async () => {
    setupFailedFetch();
    const user = userEvent.setup();
    render(<SchoolExtracurricular />);

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    // Reset fetch to succeed on retry
    setupSuccessfulFetch();
    await user.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getByText('School & Extracurricular')).toBeInTheDocument();
    });
  });

  it('fetches data from all 9 endpoints on mount', async () => {
    render(<SchoolExtracurricular />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(9);
    });

    const calledUrls = mockFetch.mock.calls.map((call: unknown[]) => call[0]);
    expect(calledUrls).toContain('/api/households/hh-1/school/school-schedules');
    expect(calledUrls).toContain('/api/households/hh-1/school/class-periods');
    expect(calledUrls).toContain('/api/households/hh-1/school/activities');
    expect(calledUrls).toContain('/api/households/hh-1/school/events');
    expect(calledUrls).toContain('/api/households/hh-1/school/volunteer-logs');
    expect(calledUrls).toContain('/api/households/hh-1/school/college-prep');
    expect(calledUrls).toContain('/api/households/hh-1/school/recommendations');
  });
});
