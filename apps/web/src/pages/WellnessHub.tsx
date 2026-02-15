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
} from 'lucide-react';

type WellnessTab = 'activity' | 'checkin' | 'sleep' | 'meals' | 'mental';

const TAB_CONFIG: { id: WellnessTab; label: string; icon: React.ReactNode }[] = [
  { id: 'activity', label: 'Activity', icon: <Activity className="h-4 w-4" /> },
  { id: 'checkin', label: 'Check-in', icon: <Heart className="h-4 w-4" /> },
  { id: 'sleep', label: 'Sleep', icon: <Moon className="h-4 w-4" /> },
  { id: 'meals', label: 'Meals', icon: <UtensilsCrossed className="h-4 w-4" /> },
  { id: 'mental', label: 'Wellness', icon: <Brain className="h-4 w-4" /> },
];

const ACTIVITY_CATEGORIES = [
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

function ActivityTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Activity Tracking</h2>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--app-accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90">
          <Plus className="h-4 w-4" />
          Log Activity
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[var(--app-accent)]">0</p>
          <p className="text-xs text-gray-500">Minutes Today</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[var(--app-accent)]">0</p>
          <p className="text-xs text-gray-500">This Week</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[var(--app-accent)]">0%</p>
          <p className="text-xs text-gray-500">Daily Goal</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <p className="text-2xl font-bold text-green-600">0</p>
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

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <Activity className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-3 text-sm font-medium text-gray-600">No activities logged yet</p>
        <p className="mt-1 text-xs text-gray-400">
          Start tracking activities to see your progress here
        </p>
      </div>
    </div>
  );
}

function CheckInTab() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [energyLevel, setEnergyLevel] = useState(3);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Daily Check-in</h2>

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

      <button
        type="button"
        disabled={selectedMood === null}
        className="w-full rounded-lg bg-[var(--app-accent)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Submit Check-in
      </button>
    </div>
  );
}

function SleepTab() {
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
          <p className="text-2xl font-bold text-indigo-600">--</p>
          <p className="text-xs text-gray-500">Avg Duration</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">--</p>
          <p className="text-xs text-gray-500">Avg Quality</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">--%</p>
          <p className="text-xs text-gray-500">Consistency</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <Moon className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-3 text-sm font-medium text-gray-600">No sleep logs yet</p>
        <p className="mt-1 text-xs text-gray-400">
          Track bedtime and wake times to build healthy sleep habits
        </p>
      </div>
    </div>
  );
}

function MealsTab() {
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
        {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((meal) => (
          <div
            key={meal}
            className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center"
          >
            <UtensilsCrossed className="mx-auto h-6 w-6 text-gray-300" />
            <p className="mt-2 text-xs font-medium text-gray-500">{meal}</p>
            <p className="text-xs text-gray-400">Not planned</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <UtensilsCrossed className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-3 text-sm font-medium text-gray-600">No meals planned yet</p>
        <p className="mt-1 text-xs text-gray-400">
          Plan meals for the week to help the family eat well together
        </p>
      </div>
    </div>
  );
}

function MentalHealthTab() {
  const [gratitudeText, setGratitudeText] = useState('');

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
          disabled={!gratitudeText.trim()}
          className="mt-2 rounded-lg bg-[var(--app-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save Entry
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Wellness Resources</h3>
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

const TAB_COMPONENTS: Record<WellnessTab, () => React.ReactElement> = {
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

        <ActiveTabComponent />
      </main>
    </div>
  );
}
