import { useState, useEffect, type FormEvent } from 'react';
import type {
  SchoolSchedule,
  ExtracurricularActivity,
  ActivityEvent,
  VolunteerLog,
  CollegePrepActivity,
  DayOfWeek,
  ActivityCategory,
  SeasonType,
  EventType,
} from '@chorechamp/types';

// ─── Shared types & helpers ─────────────────────────────────────────────────

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: string;
  onSubmit: (data: any) => void;
}

const ALL_DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const CATEGORIES: { value: ActivityCategory; label: string }[] = [
  { value: 'sports', label: 'Sports' },
  { value: 'music', label: 'Music' },
  { value: 'arts', label: 'Arts' },
  { value: 'academic', label: 'Academic' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'club', label: 'Club' },
  { value: 'religious', label: 'Religious' },
  { value: 'other', label: 'Other' },
];

const SEASONS: { value: SeasonType; label: string }[] = [
  { value: 'fall', label: 'Fall' },
  { value: 'winter', label: 'Winter' },
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'year_round', label: 'Year Round' },
];

const EVENT_TYPES_LIST: { value: EventType; label: string }[] = [
  { value: 'practice', label: 'Practice' },
  { value: 'game', label: 'Game' },
  { value: 'competition', label: 'Competition' },
  { value: 'performance', label: 'Performance' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'class', label: 'Class' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'other', label: 'Other' },
];

const COMMITMENT_LEVELS = [
  { value: 'low', label: 'Low (1-3 hrs/week)' },
  { value: 'medium', label: 'Medium (4-8 hrs/week)' },
  { value: 'high', label: 'High (9-15 hrs/week)' },
  { value: 'competitive', label: 'Competitive (15+ hrs/week)' },
];

const COLLEGE_PREP_TYPES = [
  { value: 'test_prep', label: 'Test Prep' },
  { value: 'college_visit', label: 'College Visit' },
  { value: 'application', label: 'Application' },
  { value: 'essay', label: 'Essay' },
  { value: 'recommendation', label: 'Recommendation' },
  { value: 'interview', label: 'Interview' },
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'other', label: 'Other' },
];

// ─── Modal wrapper ──────────────────────────────────────────────────────────

function ModalWrapper({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

// ─── Shared form field styles ───────────────────────────────────────────────

const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm';
const selectClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white';

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
      <button
        type="submit"
        disabled={loading}
        className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        {loading ? 'Saving...' : label}
      </button>
    </div>
  );
}

// ─── 1. AddSchoolDialog ─────────────────────────────────────────────────────

export function AddSchoolDialog({ open, onOpenChange, householdId, onSubmit }: DialogProps) {
  const [loading, setLoading] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('15:00');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [schoolDays, setSchoolDays] = useState<DayOfWeek[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);

  const resetForm = () => {
    setMemberId('');
    setSchoolName('');
    setSchoolYear('');
    setGradeLevel('');
    setStartTime('08:00');
    setEndTime('15:00');
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setSchoolDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  };

  const toggleDay = (day: DayOfWeek) => {
    setSchoolDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/households/${householdId}/school/school-schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          schoolName,
          schoolYear,
          gradeLevel,
          startTime,
          endTime,
          timezone,
          schoolDays,
        }),
      });

      if (res.ok) {
        const data: SchoolSchedule = await res.json();
        onSubmit(data);
        onOpenChange(false);
        resetForm();
      }
    } catch (err) {
      console.error('Failed to create school schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper open={open} onOpenChange={onOpenChange} title="Add School Schedule">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Member ID *</label>
          <input
            type="text"
            required
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className={inputClass}
            placeholder="Enter member ID"
          />
        </div>

        <div>
          <label className={labelClass}>School Name *</label>
          <input
            type="text"
            required
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Lincoln High School"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>School Year *</label>
            <input
              type="text"
              required
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              className={inputClass}
              placeholder="e.g. 2025-2026"
            />
          </div>
          <div>
            <label className={labelClass}>Grade Level *</label>
            <input
              type="text"
              required
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className={inputClass}
              placeholder="e.g. 10th"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Start Time *</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>End Time *</label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Timezone</label>
          <input
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>School Days *</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {ALL_DAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  schoolDays.includes(day.value)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {day.label.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <SubmitButton loading={loading} label="Add School" />
      </form>
    </ModalWrapper>
  );
}

// ─── 2. AddActivityDialog ───────────────────────────────────────────────────

export function AddActivityDialog({ open, onOpenChange, householdId, onSubmit }: DialogProps) {
  const [loading, setLoading] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('sports');
  const [organization, setOrganization] = useState('');
  const [season, setSeason] = useState<SeasonType>('year_round');
  const [commitmentLevel, setCommitmentLevel] = useState<'low' | 'medium' | 'high' | 'competitive'>('medium');
  const [weeklyHours, setWeeklyHours] = useState(4);
  const [cost, setCost] = useState('');

  const resetForm = () => {
    setMemberId('');
    setName('');
    setDescription('');
    setCategory('sports');
    setOrganization('');
    setSeason('year_round');
    setCommitmentLevel('medium');
    setWeeklyHours(4);
    setCost('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body: Record<string, any> = {
        memberId,
        name,
        category,
        season,
        commitmentLevel,
        weeklyHours,
      };
      if (description) body.description = description;
      if (organization) body.organization = organization;
      if (cost) body.cost = parseFloat(cost);

      const res = await fetch(`/api/households/${householdId}/school/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data: ExtracurricularActivity = await res.json();
        onSubmit(data);
        onOpenChange(false);
        resetForm();
      }
    } catch (err) {
      console.error('Failed to create activity:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper open={open} onOpenChange={onOpenChange} title="Add Extracurricular Activity">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Member ID *</label>
          <input
            type="text"
            required
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className={inputClass}
            placeholder="Enter member ID"
          />
        </div>

        <div>
          <label className={labelClass}>Activity Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Basketball"
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
            rows={2}
            placeholder="Optional description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Category *</label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value as ActivityCategory)}
              className={selectClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Season *</label>
            <select
              required
              value={season}
              onChange={(e) => setSeason(e.target.value as SeasonType)}
              className={selectClass}
            >
              {SEASONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Organization</label>
          <input
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className={inputClass}
            placeholder="e.g. YMCA, School Team"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Commitment Level *</label>
            <select
              required
              value={commitmentLevel}
              onChange={(e) => setCommitmentLevel(e.target.value as any)}
              className={selectClass}
            >
              {COMMITMENT_LEVELS.map((cl) => (
                <option key={cl.value} value={cl.value}>{cl.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Weekly Hours *</label>
            <input
              type="number"
              required
              min={0}
              step={0.5}
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(parseFloat(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Cost ($)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className={inputClass}
            placeholder="Optional"
          />
        </div>

        <SubmitButton loading={loading} label="Add Activity" />
      </form>
    </ModalWrapper>
  );
}

// ─── 3. AddEventDialog ──────────────────────────────────────────────────────

export function AddEventDialog({ open, onOpenChange, householdId, onSubmit }: DialogProps) {
  const [loading, setLoading] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [activityId, setActivityId] = useState('');
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('practice');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [attendanceRequired, setAttendanceRequired] = useState(true);
  const [choreExemption, setChoreExemption] = useState(false);

  const resetForm = () => {
    setMemberId('');
    setActivityId('');
    setTitle('');
    setEventType('practice');
    setEventDate('');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setAttendanceRequired(true);
    setChoreExemption(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body: Record<string, any> = {
        activityId,
        memberId,
        title,
        eventType,
        eventDate,
        startTime,
        attendanceRequired,
        choreExemption,
      };
      if (endTime) body.endTime = endTime;
      if (location) body.location = location;

      const res = await fetch(`/api/households/${householdId}/school/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data: ActivityEvent = await res.json();
        onSubmit(data);
        onOpenChange(false);
        resetForm();
      }
    } catch (err) {
      console.error('Failed to create event:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper open={open} onOpenChange={onOpenChange} title="Add Event">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Member ID *</label>
            <input
              type="text"
              required
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className={inputClass}
              placeholder="Enter member ID"
            />
          </div>
          <div>
            <label className={labelClass}>Activity ID *</label>
            <input
              type="text"
              required
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              className={inputClass}
              placeholder="Enter activity ID"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="e.g. Saturday Game vs Eagles"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Event Type *</label>
            <select
              required
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className={selectClass}
            >
              {EVENT_TYPES_LIST.map((et) => (
                <option key={et.value} value={et.value}>{et.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Event Date *</label>
            <input
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Start Time *</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={inputClass}
            placeholder="e.g. Main Gym"
          />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={attendanceRequired}
              onChange={(e) => setAttendanceRequired(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Attendance Required
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={choreExemption}
              onChange={(e) => setChoreExemption(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Chore Exemption
          </label>
        </div>

        <SubmitButton loading={loading} label="Add Event" />
      </form>
    </ModalWrapper>
  );
}

// ─── 4. AddVolunteerDialog ──────────────────────────────────────────────────

export function AddVolunteerDialog({ open, onOpenChange, householdId, onSubmit }: DialogProps) {
  const [loading, setLoading] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [volunteerDate, setVolunteerDate] = useState('');
  const [hoursCompleted, setHoursCompleted] = useState(1);
  const [supervisorName, setSupervisorName] = useState('');

  const resetForm = () => {
    setMemberId('');
    setOrganizationName('');
    setActivityDescription('');
    setVolunteerDate('');
    setHoursCompleted(1);
    setSupervisorName('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body: Record<string, any> = {
        memberId,
        organizationName,
        activityDescription,
        volunteerDate,
        hoursCompleted,
      };
      if (supervisorName) body.supervisorName = supervisorName;

      const res = await fetch(`/api/households/${householdId}/school/volunteer-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data: VolunteerLog = await res.json();
        onSubmit(data);
        onOpenChange(false);
        resetForm();
      }
    } catch (err) {
      console.error('Failed to log volunteer hours:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper open={open} onOpenChange={onOpenChange} title="Log Volunteer Hours">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Member ID *</label>
          <input
            type="text"
            required
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className={inputClass}
            placeholder="Enter member ID"
          />
        </div>

        <div>
          <label className={labelClass}>Organization Name *</label>
          <input
            type="text"
            required
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Local Food Bank"
          />
        </div>

        <div>
          <label className={labelClass}>Activity Description *</label>
          <textarea
            required
            value={activityDescription}
            onChange={(e) => setActivityDescription(e.target.value)}
            className={inputClass}
            rows={2}
            placeholder="Describe the volunteer work"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date *</label>
            <input
              type="date"
              required
              value={volunteerDate}
              onChange={(e) => setVolunteerDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Hours Completed *</label>
            <input
              type="number"
              required
              min={0.25}
              step={0.25}
              value={hoursCompleted}
              onChange={(e) => setHoursCompleted(parseFloat(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Supervisor Name</label>
          <input
            type="text"
            value={supervisorName}
            onChange={(e) => setSupervisorName(e.target.value)}
            className={inputClass}
            placeholder="Optional"
          />
        </div>

        <SubmitButton loading={loading} label="Log Hours" />
      </form>
    </ModalWrapper>
  );
}

// ─── 5. AddCollegePrepDialog ────────────────────────────────────────────────

export function AddCollegePrepDialog({ open, onOpenChange, householdId, onSubmit }: DialogProps) {
  const [loading, setLoading] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activityType, setActivityType] = useState<CollegePrepActivity['activityType']>('other');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const resetForm = () => {
    setMemberId('');
    setTitle('');
    setDescription('');
    setActivityType('other');
    setDueDate('');
    setStatus('not_started');
    setPriority('medium');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body: Record<string, any> = {
        memberId,
        title,
        activityType,
        status,
        priority,
      };
      if (description) body.description = description;
      if (dueDate) body.dueDate = dueDate;

      const res = await fetch(`/api/households/${householdId}/school/college-prep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data: CollegePrepActivity = await res.json();
        onSubmit(data);
        onOpenChange(false);
        resetForm();
      }
    } catch (err) {
      console.error('Failed to create college prep task:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper open={open} onOpenChange={onOpenChange} title="Add College Prep Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Member ID *</label>
          <input
            type="text"
            required
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className={inputClass}
            placeholder="Enter member ID"
          />
        </div>

        <div>
          <label className={labelClass}>Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="e.g. SAT Practice Test"
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
            rows={2}
            placeholder="Optional description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Activity Type *</label>
            <select
              required
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as CollegePrepActivity['activityType'])}
              className={selectClass}
            >
              {COLLEGE_PREP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Status *</label>
            <select
              required
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className={selectClass}
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Priority *</label>
            <select
              required
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className={selectClass}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <SubmitButton loading={loading} label="Add Task" />
      </form>
    </ModalWrapper>
  );
}
