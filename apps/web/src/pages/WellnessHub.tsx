import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Activity,
  Heart,
  Moon,
  UtensilsCrossed,
  Brain,
  ChevronLeft,
  Plus,
  TrendingUp,
  Smile,
  Frown,
  Meh,
  Loader2,
  Clock,
  Star,
  BookOpen,
} from 'lucide-react';
import {
  useWellnessActivityLogs,
  useWellnessActivityStats,
  useCreateWellnessActivityLog,
  useWellnessCheckIns,
  useCreateWellnessCheckIn,
  useSleepLogs,
  useSleepStats,
  useMealPlans,
  useDeleteMealPlan,
  useMentalHealthResources,
  useGratitudeEntries,
  useCreateGratitudeEntry,
} from '@chorechamp/api-client';
import type {
  ActivityLog,
  WellnessCheckIn as WellnessCheckInType,
  SleepLog,
  MealPlan,
  MentalHealthResource,
  GratitudeEntry,
  WellnessActivityCategory,
  MealType,
} from '@chorechamp/types';

type WellnessTab = 'activity' | 'checkin' | 'sleep' | 'meals' | 'mental';

const TAB_CONFIG: { id: WellnessTab; label: string; icon: React.ReactNode }[] = [
  { id: 'activity', label: 'Activity', icon: <Activity className="h-4 w-4" /> },
  { id: 'checkin', label: 'Check-in', icon: <Heart className="h-4 w-4" /> },
  { id: 'sleep', label: 'Sleep', icon: <Moon className="h-4 w-4" /> },
  { id: 'meals', label: 'Meals', icon: <UtensilsCrossed className="h-4 w-4" /> },
  { id: 'mental', label: 'Wellness', icon: <Brain className="h-4 w-4" /> },
];

const ACTIVITY_CATEGORIES: { value: WellnessActivityCategory; label: string; color: string }[] = [
  { value: 'physical', label: 'Physical', color: 'bg-red-100 text-red-700' },
  { value: 'creative', label: 'Creative', color: 'bg-purple-100 text-purple-700' },
  { value: 'educational', label: 'Educational', color: 'bg-blue-100 text-blue-700' },
  { value: 'social', label: 'Social', color: 'bg-green-100 text-green-700' },
  { value: 'self_care', label: 'Self-Care', color: 'bg-pink-100 text-pink-700' },
  { value: 'outdoor', label: 'Outdoor', color: 'bg-amber-100 text-amber-700' },
  { value: 'chores', label: 'Chores', color: 'bg-gray-100 text-gray-700' },
  { value: 'other', label: 'Other', color: 'bg-slate-100 text-slate-700' },
];

const MOOD_OPTIONS = [
  { value: 1, label: 'Sad', icon: <Frown className="h-8 w-8" />, color: 'text-red-500' },
  { value: 2, label: 'Low', icon: <Frown className="h-8 w-8" />, color: 'text-orange-500' },
  { value: 3, label: 'Okay', icon: <Meh className="h-8 w-8" />, color: 'text-yellow-500' },
  { value: 4, label: 'Good', icon: <Smile className="h-8 w-8" />, color: 'text-lime-500' },
  { value: 5, label: 'Great', icon: <Smile className="h-8 w-8" />, color: 'text-green-500' },
];

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--app-accent)]" />
      {label && <p className="mt-2 text-sm text-gray-500">{label}</p>}
    </div>
  );
}

function getCategoryColor(value: string): string {
  return ACTIVITY_CATEGORIES.find((c) => c.value === value)?.color ?? 'bg-slate-100 text-slate-700';
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function ActivityTab({ householdId }: { householdId: string }) {
  const { data: logs, isLoading: logsLoading, isError: logsError } = useWellnessActivityLogs(householdId);
  const { data: stats, isLoading: statsLoading, isError: statsError } = useWellnessActivityStats(householdId);
  const createLog = useCreateWellnessActivityLog(householdId);

  const [showForm, setShowForm] = useState(false);
  const [activityName, setActivityName] = useState('');
  const [category, setCategory] = useState<WellnessActivityCategory>('physical');
  const [duration, setDuration] = useState('');
  const [note, setNote] = useState('');

  const isLoading = logsLoading || statsLoading;
  const isError = logsError || statsError;

  const activityLogs = (Array.isArray(logs) ? logs : (logs as unknown as Record<string, unknown[]>)?.data ?? []) as ActivityLog[];
  const summary = Array.isArray(stats) ? stats[0] : stats;

  const totalMinutesToday = summary?.totalMinutesToday ?? 0;
  const totalMinutesWeek = summary?.totalMinutesThisWeek ?? 0;
  const dailyGoalProgress = summary?.dailyGoalProgress ?? 0;
  const streak = summary?.streak ?? 0;

  const handleSubmit = () => {
    if (!activityName.trim() || !duration) return;
    createLog.mutate(
      {
        memberId: '', // Server determines from session
        category,
        activityName: activityName.trim(),
        durationMinutes: Number(duration),
        note: note.trim() || null,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setActivityName('');
          setCategory('physical');
          setDuration('');
          setNote('');
        },
      }
    );
  };

  if (isLoading) return <LoadingSpinner label="Loading activities..." />;

  if (isError) return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
      <p className="text-red-600 font-medium">Something went wrong</p>
      <p className="text-red-500 text-sm mt-1">Failed to load data. Please try again later.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Activity Tracking</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--app-accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Log Activity
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <input
            type="text"
            placeholder="Activity name"
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as WellnessActivityCategory)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {ACTIVITY_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Duration (min)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min={1}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <textarea
            placeholder="Notes (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!activityName.trim() || !duration || createLog.isPending}
              className="rounded-md bg-[var(--app-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createLog.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[var(--app-accent)]">{totalMinutesToday}</p>
          <p className="text-xs text-gray-500">Minutes Today</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[var(--app-accent)]">{totalMinutesWeek}</p>
          <p className="text-xs text-gray-500">This Week</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[var(--app-accent)]">{Math.round(dailyGoalProgress)}%</p>
          <p className="text-xs text-gray-500">Daily Goal</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <p className="text-2xl font-bold text-green-600">{streak}</p>
          </div>
          <p className="text-xs text-gray-500">Day Streak</p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_CATEGORIES.map((cat) => (
            <span
              key={cat.value}
              className={`rounded-full px-3 py-1 text-xs font-medium ${cat.color}`}
            >
              {cat.label}
            </span>
          ))}
        </div>
      </div>

      {activityLogs.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <Activity className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-600">No activities logged yet</p>
          <p className="mt-1 text-xs text-gray-400">
            Start tracking activities to see your progress here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Recent Activities</h3>
          {activityLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
            >
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getCategoryColor(log.category)}`}>
                  {log.category}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{log.activityName}</p>
                  {log.note && <p className="text-xs text-gray-500">{log.note}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[var(--app-accent)]">
                  {formatDuration(log.durationMinutes)}
                </p>
                <p className="text-xs text-gray-400">{formatDate(log.loggedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckInTab({ householdId }: { householdId: string }) {
  const { data: checkIns, isLoading, isError } = useWellnessCheckIns(householdId, { limit: 10 });
  const createCheckIn = useCreateWellnessCheckIn(householdId);

  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [checkInNote, setCheckInNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const checkInList = (Array.isArray(checkIns) ? checkIns : (checkIns as unknown as Record<string, unknown[]>)?.data ?? []) as WellnessCheckInType[];

  const handleSubmit = () => {
    if (selectedMood === null) return;
    createCheckIn.mutate(
      {
        memberId: '', // Server determines from session
        moodScore: selectedMood,
        energyScore: energyLevel,
        note: checkInNote.trim() || null,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          setSelectedMood(null);
          setEnergyLevel(3);
          setCheckInNote('');
          setTimeout(() => setSubmitted(false), 3000);
        },
      }
    );
  };

  if (isLoading) return <LoadingSpinner label="Loading check-ins..." />;

  if (isError) return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
      <p className="text-red-600 font-medium">Something went wrong</p>
      <p className="text-red-500 text-sm mt-1">Failed to load data. Please try again later.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Daily Check-in</h2>

      {submitted && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Check-in submitted successfully!
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">How are you feeling?</h3>
        <div className="flex justify-center gap-4">
          {MOOD_OPTIONS.map((mood) => (
            <button
              key={mood.value}
              type="button"
              onClick={() => setSelectedMood(mood.value)}
              className={`flex flex-col items-center gap-1 rounded-lg p-3 transition-colors ${
                selectedMood === mood.value
                  ? 'bg-[var(--app-accent-soft)] ring-2 ring-[var(--app-accent)]'
                  : 'hover:bg-gray-50'
              }`}
              aria-label={mood.label}
            >
              <span className={mood.color}>{mood.icon}</span>
              <span className="text-xs font-medium text-gray-600">{mood.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">
          Energy Level: {energyLevel}/5
        </h3>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={energyLevel}
          onChange={(e) => setEnergyLevel(Number(e.target.value))}
          className="w-full accent-[var(--app-accent)]"
        />
        <div className="mt-1 flex justify-between text-xs text-gray-400">
          <span>Exhausted</span>
          <span>Energized</span>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Notes (optional)</h3>
        <textarea
          value={checkInNote}
          onChange={(e) => setCheckInNote(e.target.value)}
          placeholder="How was your day? Anything on your mind?"
          rows={2}
          maxLength={500}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={selectedMood === null || createCheckIn.isPending}
        className="w-full rounded-lg bg-[var(--app-accent)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {createCheckIn.isPending ? 'Submitting...' : 'Submit Check-in'}
      </button>

      {checkInList.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Recent Check-ins</h3>
          {checkInList.map((ci) => {
            const moodOption = MOOD_OPTIONS.find((m) => m.value === ci.moodScore);
            return (
              <div
                key={ci.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="flex items-center gap-3">
                  <span className={moodOption?.color ?? 'text-gray-400'}>
                    {moodOption?.icon ?? <Meh className="h-6 w-6" />}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {moodOption?.label ?? 'Unknown'} mood, energy {ci.energyScore}/5
                    </p>
                    {ci.note && <p className="text-xs text-gray-500">{ci.note}</p>}
                  </div>
                </div>
                <p className="text-xs text-gray-400">{formatDate(ci.checkedInAt)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SleepTab({ householdId }: { householdId: string }) {
  const { data: logs, isLoading: logsLoading, isError: sleepLogsError } = useSleepLogs(householdId);
  const { data: stats, isLoading: statsLoading, isError: sleepStatsError } = useSleepStats(householdId);

  const isLoading = logsLoading || statsLoading;
  const isError = sleepLogsError || sleepStatsError;
  const sleepLogs = (Array.isArray(logs) ? logs : (logs as unknown as Record<string, unknown[]>)?.data ?? []) as SleepLog[];
  const sleepStats = stats as unknown as Record<string, unknown>;

  const avgDuration = sleepStats?.averageDurationMinutes as number | undefined;
  const avgQuality = sleepStats?.averageQuality as number | undefined;
  const consistency = sleepStats?.consistencyScore as number | undefined;

  if (isLoading) return <LoadingSpinner label="Loading sleep data..." />;

  if (isError) return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
      <p className="text-red-600 font-medium">Something went wrong</p>
      <p className="text-red-500 text-sm mt-1">Failed to load data. Please try again later.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Sleep Tracking</h2>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--app-accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90">
          <Plus className="h-4 w-4" />
          Log Sleep
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">
            {avgDuration != null ? formatDuration(Math.round(avgDuration)) : '--'}
          </p>
          <p className="text-xs text-gray-500">Avg Duration</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">
            {avgQuality != null ? `${avgQuality.toFixed(1)}/5` : '--'}
          </p>
          <p className="text-xs text-gray-500">Avg Quality</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">
            {consistency != null ? `${Math.round(consistency)}%` : '--%'}
          </p>
          <p className="text-xs text-gray-500">Consistency</p>
        </div>
      </div>

      {sleepLogs.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <Moon className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-600">No sleep logs yet</p>
          <p className="mt-1 text-xs text-gray-400">
            Track bedtime and wake times to build healthy sleep habits
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Recent Sleep Logs</h3>
          {sleepLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
            >
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-indigo-400" />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {formatDuration(log.durationMinutes)}
                  </p>
                  <p className="text-xs text-gray-500">
                    <Clock className="mr-1 inline h-3 w-3" />
                    {new Date(log.bedtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' to '}
                    {new Date(log.wakeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {log.qualityScore != null && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-700">{log.qualityScore}/5</span>
                  </div>
                )}
                <p className="text-xs text-gray-400">{formatDate(log.logDate)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MealsTab({ householdId }: { householdId: string }) {
  const today = new Date().toISOString().split('T')[0];
  const { data: plans, isLoading, isError } = useMealPlans(householdId, {
    startDate: today,
    endDate: today,
  });
  const deleteMealPlan = useDeleteMealPlan(householdId);

  const mealPlans = (Array.isArray(plans) ? plans : (plans as unknown as Record<string, unknown[]>)?.data ?? []) as MealPlan[];

  const mealsByType: Record<MealType, MealPlan[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };
  for (const plan of mealPlans) {
    if (mealsByType[plan.mealType]) {
      mealsByType[plan.mealType].push(plan);
    }
  }

  if (isLoading) return <LoadingSpinner label="Loading meal plans..." />;

  if (isError) return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
      <p className="text-red-600 font-medium">Something went wrong</p>
      <p className="text-red-500 text-sm mt-1">Failed to load data. Please try again later.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Meal Planning</h2>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--app-accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90">
          <Plus className="h-4 w-4" />
          Plan Meal
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((mealType) => {
          const planned = mealsByType[mealType];
          return (
            <div
              key={mealType}
              className={`rounded-lg border p-4 text-center ${
                planned.length > 0
                  ? 'border-green-200 bg-green-50'
                  : 'border-dashed border-gray-300 bg-white'
              }`}
            >
              <UtensilsCrossed
                className={`mx-auto h-6 w-6 ${planned.length > 0 ? 'text-green-500' : 'text-gray-300'}`}
              />
              <p className="mt-2 text-xs font-medium text-gray-500">
                {MEAL_TYPE_LABELS[mealType]}
              </p>
              {planned.length > 0 ? (
                <p className="text-xs font-medium text-green-700">{planned[0].name}</p>
              ) : (
                <p className="text-xs text-gray-400">Not planned</p>
              )}
            </div>
          );
        })}
      </div>

      {mealPlans.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <UtensilsCrossed className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-600">No meals planned yet</p>
          <p className="mt-1 text-xs text-gray-400">
            Plan meals for the week to help the family eat well together
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Today&apos;s Meals</h3>
          {mealPlans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                    {MEAL_TYPE_LABELS[plan.mealType]}
                  </span>
                  <p className="text-sm font-medium text-gray-800">{plan.name}</p>
                </div>
                {plan.description && (
                  <p className="mt-1 text-xs text-gray-500">{plan.description}</p>
                )}
                <div className="mt-1 flex gap-3 text-xs text-gray-400">
                  {plan.servings > 0 && <span>{plan.servings} servings</span>}
                  {plan.prepTimeMinutes != null && <span>{plan.prepTimeMinutes}m prep</span>}
                  {plan.calories != null && <span>{plan.calories} cal</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {plan.isCompleted && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Done
                  </span>
                )}
                <button
                  onClick={() => deleteMealPlan.mutate(plan.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                  aria-label="Delete meal plan"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MentalHealthTab({ householdId }: { householdId: string }) {
  const { data: resources, isLoading: resourcesLoading, isError: resourcesError } = useMentalHealthResources(householdId);
  const { data: entries, isLoading: entriesLoading, isError: entriesError } = useGratitudeEntries(householdId);
  const createGratitude = useCreateGratitudeEntry(householdId);

  const [gratitudeText, setGratitudeText] = useState('');

  const resourceList = (Array.isArray(resources) ? resources : (resources as unknown as Record<string, unknown[]>)?.data ?? []) as MentalHealthResource[];
  const gratitudeList = (Array.isArray(entries) ? entries : (entries as unknown as Record<string, unknown[]>)?.data ?? []) as GratitudeEntry[];

  const isLoading = resourcesLoading || entriesLoading;
  const isError = resourcesError || entriesError;

  const handleSaveGratitude = () => {
    if (!gratitudeText.trim()) return;
    createGratitude.mutate(
      {
        memberId: '', // Server determines from session
        content: gratitudeText.trim(),
      },
      {
        onSuccess: () => {
          setGratitudeText('');
        },
      }
    );
  };

  if (isLoading) return <LoadingSpinner label="Loading wellness resources..." />;

  if (isError) return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
      <p className="text-red-600 font-medium">Something went wrong</p>
      <p className="text-red-500 text-sm mt-1">Failed to load data. Please try again later.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Mental Wellness</h2>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Gratitude Journal</h3>
        <p className="mb-3 text-xs text-gray-500">
          What are you grateful for today? Writing it down can boost your mood.
        </p>
        <textarea
          value={gratitudeText}
          onChange={(e) => setGratitudeText(e.target.value)}
          placeholder="I'm grateful for..."
          maxLength={500}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={handleSaveGratitude}
          disabled={!gratitudeText.trim() || createGratitude.isPending}
          className="mt-2 rounded-lg bg-[var(--app-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createGratitude.isPending ? 'Saving...' : 'Save Entry'}
        </button>
      </div>

      {gratitudeList.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Recent Gratitude Entries</h3>
          <div className="space-y-2">
            {gratitudeList.slice(0, 5).map((entry) => (
              <div key={entry.id} className="rounded-lg border border-gray-100 p-3">
                <p className="text-sm text-gray-800">{entry.content}</p>
                <p className="mt-1 text-xs text-gray-400">{formatDate(entry.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Wellness Resources</h3>
        {resourceList.length === 0 ? (
          <div className="space-y-2">
            {[
              { cat: 'Mindfulness', desc: 'Breathing exercises and meditation guides' },
              { cat: 'Coping Skills', desc: 'Strategies for managing stress and anxiety' },
              { cat: 'Family Therapy', desc: 'Resources for improving family communication' },
            ].map((resource) => (
              <div
                key={resource.cat}
                className="rounded-lg border border-gray-100 p-3 hover:bg-gray-50"
              >
                <p className="text-sm font-medium text-gray-800">{resource.cat}</p>
                <p className="text-xs text-gray-500">{resource.desc}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {resourceList.map((resource) => (
              <div
                key={resource.id}
                className="rounded-lg border border-gray-100 p-3 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800">{resource.title}</p>
                  {resource.isPinned && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                      Pinned
                    </span>
                  )}
                </div>
                {resource.description && (
                  <p className="text-xs text-gray-500">{resource.description}</p>
                )}
                <div className="mt-1 flex gap-2">
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                    {resource.category.replace('_', ' ')}
                  </span>
                  {resource.ageRange && (
                    <span className="text-xs text-gray-400">Ages: {resource.ageRange}</span>
                  )}
                </div>
                {resource.resourceUrl && (
                  <a
                    href={resource.resourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
                  >
                    <BookOpen className="h-3 w-3" />
                    View Resource
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-green-100 bg-green-50 p-4 text-sm text-green-800">
        <p className="font-medium">Support Available</p>
        <p className="mt-1">
          If you or a family member needs help, consider reaching out to a mental health
          professional. These resources are for general wellness and do not replace professional
          care.
        </p>
      </div>
    </div>
  );
}

const TAB_COMPONENTS: Record<WellnessTab, React.FC<{ householdId: string }>> = {
  activity: ActivityTab,
  checkin: CheckInTab,
  sleep: SleepTab,
  meals: MealsTab,
  mental: MentalHealthTab,
};

export default function WellnessHub() {
  const { householdId } = useParams<{ householdId: string }>();
  const [activeTab, setActiveTab] = useState<WellnessTab>('activity');

  const ActiveTabComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <header className="border-b bg-[var(--app-surface)] shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
          <Link
            to={`/households/${householdId}`}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Back to dashboard"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Wellness Hub</h1>
            <p className="text-xs text-gray-500">Track health, sleep, meals, and mental wellness</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-[var(--app-surface-muted)] p-1">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[var(--app-surface)] text-[var(--app-accent)] shadow-sm'
                  : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <ActiveTabComponent householdId={householdId!} />
      </main>
    </div>
  );
}
