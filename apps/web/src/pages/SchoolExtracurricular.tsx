import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type {
  SchoolSchedule,
  ClassPeriod,
  ExtracurricularActivity,
  ActivitySchedule,
  ActivityEvent,
  VolunteerLog,
  CollegePrepActivity,
  BalanceRecommendation,
} from '@chorechamp/types';
import {
  SchoolScheduleCard,
  ActivityCard,
  EventCard,
  VolunteerLogCard,
  CollegePrepCard,
  WeeklyCalendar,
  BalanceCard,
  AddSchoolDialog,
  AddActivityDialog,
  AddEventDialog,
  AddVolunteerDialog,
  AddCollegePrepDialog,
} from '../components/school-extracurricular';

type TabType = 'calendar' | 'school' | 'activities' | 'events' | 'volunteer' | 'college' | 'balance';

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'calendar', label: 'Calendar', icon: '\uD83D\uDCC5' },
  { id: 'school', label: 'School', icon: '\uD83C\uDFEB' },
  { id: 'activities', label: 'Activities', icon: '\u26BD' },
  { id: 'events', label: 'Events', icon: '\uD83C\uDFC6' },
  { id: 'volunteer', label: 'Volunteer', icon: '\u2764\uFE0F' },
  { id: 'college', label: 'College Prep', icon: '\uD83C\uDF93' },
  { id: 'balance', label: 'Balance', icon: '\u2696\uFE0F' },
];

// Available but currently unused in this implementation
// const ALL_DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
// const CATEGORIES: ActivityCategory[] = ['sports', 'music', 'arts', 'academic', 'volunteer', 'club', 'religious', 'other'];
// const SEASONS: SeasonType[] = ['fall', 'winter', 'spring', 'summer', 'year_round'];
// const EVENT_TYPES_LIST: EventType[] = ['practice', 'game', 'competition', 'performance', 'meeting', 'class', 'volunteer', 'other'];

export default function SchoolExtracurricular() {
  const { householdId } = useParams<{ householdId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [schoolSchedules, setSchoolSchedules] = useState<SchoolSchedule[]>([]);
  const [classPeriods, setClassPeriods] = useState<ClassPeriod[]>([]);
  const [activities, setActivities] = useState<ExtracurricularActivity[]>([]);
  const [activitySchedules, setActivitySchedules] = useState<ActivitySchedule[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [volunteerLogs, setVolunteerLogs] = useState<VolunteerLog[]>([]);
  const [collegePrepActivities, setCollegePrepActivities] = useState<CollegePrepActivity[]>([]);
  const [recommendations, setRecommendations] = useState<BalanceRecommendation[]>([]);

  // Calendar state
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Form states
  const [showSchoolForm, setShowSchoolForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showVolunteerForm, setShowVolunteerForm] = useState(false);
  const [showCollegePrepForm, setShowCollegePrepForm] = useState(false);

  // Volunteer stats
  const [volunteerStats, setVolunteerStats] = useState<{
    totalHours: number;
    verifiedHours: number;
    uniqueOrganizations: number;
  } | null>(null);

  useEffect(() => {
    if (householdId) {
      loadData();
    }
  }, [householdId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        schedulesRes,
        periodsRes,
        activitiesRes,
        actSchedulesRes,
        eventsRes,
        volunteerRes,
        collegeRes,
        recsRes,
        statsRes,
      ] = await Promise.all([
        fetch(`/api/households/${householdId}/school/school-schedules`),
        fetch(`/api/households/${householdId}/school/class-periods`),
        fetch(`/api/households/${householdId}/school/activities`),
        fetch(`/api/households/${householdId}/school/activity-schedules`),
        fetch(`/api/households/${householdId}/school/events`),
        fetch(`/api/households/${householdId}/school/volunteer-logs`),
        fetch(`/api/households/${householdId}/school/college-prep`),
        fetch(`/api/households/${householdId}/school/recommendations`),
        fetch(`/api/households/${householdId}/school/volunteer-logs/stats`),
      ]);

      if (schedulesRes.ok) setSchoolSchedules(await schedulesRes.json());
      if (periodsRes.ok) setClassPeriods(await periodsRes.json());
      if (activitiesRes.ok) setActivities(await activitiesRes.json());
      if (actSchedulesRes.ok) setActivitySchedules(await actSchedulesRes.json());
      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (volunteerRes.ok) setVolunteerLogs(await volunteerRes.json());
      if (collegeRes.ok) setCollegePrepActivities(await collegeRes.json());
      if (recsRes.ok) setRecommendations(await recsRes.json());
      if (statsRes.ok) setVolunteerStats(await statsRes.json());
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() - 7);
    setWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + 7);
    setWeekStart(newStart);
  };

  const handleDeleteSchool = async (id: string) => {
    if (!confirm('Delete this school schedule?')) return;

    try {
      await fetch(`/api/households/${householdId}/school/school-schedules/${id}`, {
        method: 'DELETE',
      });
      setSchoolSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Delete this activity?')) return;

    try {
      await fetch(`/api/households/${householdId}/school/activities/${id}`, {
        method: 'DELETE',
      });
      setActivities((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return;

    try {
      await fetch(`/api/households/${householdId}/school/events/${id}`, {
        method: 'DELETE',
      });
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyVolunteer = async (id: string) => {
    try {
      const res = await fetch(`/api/households/${householdId}/school/volunteer-logs/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifiedBy: 'Parent' }),
      });

      if (res.ok) {
        const updated = await res.json();
        setVolunteerLogs((prev) => prev.map((l) => (l.id === id ? updated : l)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteVolunteer = async (id: string) => {
    if (!confirm('Delete this volunteer log?')) return;

    try {
      await fetch(`/api/households/${householdId}/school/volunteer-logs/${id}`, {
        method: 'DELETE',
      });
      setVolunteerLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCollegePrepStatus = async (
    id: string,
    status: 'not_started' | 'in_progress' | 'completed'
  ) => {
    try {
      const res = await fetch(`/api/households/${householdId}/school/college-prep/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const updated = await res.json();
        setCollegePrepActivities((prev) => prev.map((a) => (a.id === id ? updated : a)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCollegePrep = async (id: string) => {
    if (!confirm('Delete this college prep activity?')) return;

    try {
      await fetch(`/api/households/${householdId}/school/college-prep/${id}`, {
        method: 'DELETE',
      });
      setCollegePrepActivities((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcknowledgeRecommendation = async (id: string) => {
    try {
      const res = await fetch(`/api/households/${householdId}/school/recommendations/${id}/acknowledge`, {
        method: 'POST',
      });

      if (res.ok) {
        const updated = await res.json();
        setRecommendations((prev) => prev.map((r) => (r.id === id ? updated : r)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateRecommendations = async (memberId: string) => {
    try {
      const res = await fetch(`/api/households/${householdId}/school/recommendations/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });

      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const renderCalendarTab = () => (
    <WeeklyCalendar
      weekStart={weekStart}
      schoolSchedules={schoolSchedules}
      classPeriods={classPeriods}
      activitySchedules={activitySchedules}
      events={events}
      onPrevWeek={handlePrevWeek}
      onNextWeek={handleNextWeek}
      onEventClick={(_event) => { /* TODO: handle event click */ }}
    />
  );

  const renderSchoolTab = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">School Schedules</h2>
        <button
          onClick={() => setShowSchoolForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add School
        </button>
      </div>

      {schoolSchedules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <span className="text-4xl mb-4 block">\uD83C\uDFEB</span>
          <p className="text-gray-600 mb-4">No school schedules yet</p>
          <button
            onClick={() => setShowSchoolForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add First School
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {schoolSchedules.map((schedule) => (
            <SchoolScheduleCard
              key={schedule.id}
              schedule={schedule}
              onDelete={handleDeleteSchool}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderActivitiesTab = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Extracurricular Activities</h2>
        <button
          onClick={() => setShowActivityForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          + Add Activity
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <span className="text-4xl mb-4 block">\u26BD</span>
          <p className="text-gray-600 mb-4">No activities yet</p>
          <button
            onClick={() => setShowActivityForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Add First Activity
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onDelete={handleDeleteActivity}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderEventsTab = () => {
    const upcomingEvents = events
      .filter((e) => new Date(e.eventDate) >= new Date())
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

    const pastEvents = events
      .filter((e) => new Date(e.eventDate) < new Date())
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Events</h2>
          <button
            onClick={() => setShowEventForm(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            + Add Event
          </button>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <span className="text-4xl mb-4 block">\uD83C\uDFC6</span>
            <p className="text-gray-600 mb-4">No events scheduled</p>
            <button
              onClick={() => setShowEventForm(true)}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              Add First Event
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {upcomingEvents.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Events</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} onDelete={handleDeleteEvent} />
                  ))}
                </div>
              </div>
            )}

            {pastEvents.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-500 mb-4">Past Events</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pastEvents.slice(0, 6).map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderVolunteerTab = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Volunteer Hours</h2>
        <button
          onClick={() => setShowVolunteerForm(true)}
          className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
        >
          + Log Hours
        </button>
      </div>

      {volunteerStats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg p-4 text-white">
            <p className="text-sm opacity-80">Total Hours</p>
            <p className="text-3xl font-bold">{volunteerStats.totalHours}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg p-4 text-white">
            <p className="text-sm opacity-80">Verified</p>
            <p className="text-3xl font-bold">{volunteerStats.verifiedHours}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg p-4 text-white">
            <p className="text-sm opacity-80">Organizations</p>
            <p className="text-3xl font-bold">{volunteerStats.uniqueOrganizations}</p>
          </div>
        </div>
      )}

      {volunteerLogs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <span className="text-4xl mb-4 block">\u2764\uFE0F</span>
          <p className="text-gray-600 mb-4">No volunteer hours logged</p>
          <button
            onClick={() => setShowVolunteerForm(true)}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            Log First Hours
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {volunteerLogs.map((log) => (
            <VolunteerLogCard
              key={log.id}
              log={log}
              onVerify={handleVerifyVolunteer}
              onDelete={handleDeleteVolunteer}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderCollegeTab = () => {
    const byStatus = {
      not_started: collegePrepActivities.filter((a) => a.status === 'not_started'),
      in_progress: collegePrepActivities.filter((a) => a.status === 'in_progress'),
      completed: collegePrepActivities.filter((a) => a.status === 'completed'),
    };

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">College Prep</h2>
          <button
            onClick={() => setShowCollegePrepForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            + Add Task
          </button>
        </div>

        {collegePrepActivities.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <span className="text-4xl mb-4 block">\uD83C\uDF93</span>
            <p className="text-gray-600 mb-4">No college prep activities</p>
            <button
              onClick={() => setShowCollegePrepForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Add First Task
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                Not Started ({byStatus.not_started.length})
              </h3>
              <div className="space-y-4">
                {byStatus.not_started.map((activity) => (
                  <CollegePrepCard
                    key={activity.id}
                    activity={activity}
                    onUpdateStatus={handleUpdateCollegePrepStatus}
                    onDelete={handleDeleteCollegePrep}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-blue-700 mb-4">
                In Progress ({byStatus.in_progress.length})
              </h3>
              <div className="space-y-4">
                {byStatus.in_progress.map((activity) => (
                  <CollegePrepCard
                    key={activity.id}
                    activity={activity}
                    onUpdateStatus={handleUpdateCollegePrepStatus}
                    onDelete={handleDeleteCollegePrep}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-green-700 mb-4">
                Completed ({byStatus.completed.length})
              </h3>
              <div className="space-y-4">
                {byStatus.completed.map((activity) => (
                  <CollegePrepCard
                    key={activity.id}
                    activity={activity}
                    onDelete={handleDeleteCollegePrep}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBalanceTab = () => {
    const unacknowledged = recommendations.filter((r) => !r.acknowledged);
    const acknowledged = recommendations.filter((r) => r.acknowledged);

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Life Balance</h2>
          <button
            onClick={() => {
              const memberId = prompt('Enter member ID to generate recommendations:');
              if (memberId) handleGenerateRecommendations(memberId);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Generate Analysis
          </button>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <span className="text-4xl mb-4 block">\u2696\uFE0F</span>
            <p className="text-gray-600 mb-4">No balance recommendations yet</p>
            <p className="text-sm text-gray-500">
              Generate an analysis to get personalized recommendations
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {unacknowledged.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-amber-700 mb-4">
                  Action Needed ({unacknowledged.length})
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {unacknowledged.map((rec) => (
                    <BalanceCard
                      key={rec.id}
                      recommendation={rec}
                      onAcknowledge={handleAcknowledgeRecommendation}
                    />
                  ))}
                </div>
              </div>
            )}

            {acknowledged.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-500 mb-4">
                  Acknowledged ({acknowledged.length})
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {acknowledged.map((rec) => (
                    <BalanceCard key={rec.id} recommendation={rec} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">School & Extracurricular</h1>
        <p className="text-gray-600 mt-2">
          Manage school schedules, activities, and maintain life balance
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'calendar' && renderCalendarTab()}
        {activeTab === 'school' && renderSchoolTab()}
        {activeTab === 'activities' && renderActivitiesTab()}
        {activeTab === 'events' && renderEventsTab()}
        {activeTab === 'volunteer' && renderVolunteerTab()}
        {activeTab === 'college' && renderCollegeTab()}
        {activeTab === 'balance' && renderBalanceTab()}
      </div>

      {/* Form Modals */}
      <AddSchoolDialog
        open={showSchoolForm}
        onOpenChange={setShowSchoolForm}
        householdId={householdId!}
        onSubmit={(data) => setSchoolSchedules((prev) => [...prev, data])}
      />
      <AddActivityDialog
        open={showActivityForm}
        onOpenChange={setShowActivityForm}
        householdId={householdId!}
        onSubmit={(data: ExtracurricularActivity) => setActivities((prev) => [...prev, data])}
      />
      <AddEventDialog
        open={showEventForm}
        onOpenChange={setShowEventForm}
        householdId={householdId!}
        onSubmit={(data: ActivityEvent) => setEvents((prev) => [...prev, data])}
      />
      <AddVolunteerDialog
        open={showVolunteerForm}
        onOpenChange={setShowVolunteerForm}
        householdId={householdId!}
        onSubmit={(data: VolunteerLog) => setVolunteerLogs((prev) => [...prev, data])}
      />
      <AddCollegePrepDialog
        open={showCollegePrepForm}
        onOpenChange={setShowCollegePrepForm}
        householdId={householdId!}
        onSubmit={(data: CollegePrepActivity) => setCollegePrepActivities((prev) => [...prev, data])}
      />
    </div>
  );
}
