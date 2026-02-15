import {
  useAccessibility,
  FOCUS_MODE_OPTIONS,
  PROGRESS_STYLE_OPTIONS,
  MAX_ITEMS_PER_VIEW_OPTIONS,
  type FocusModeOption,
  type ProgressStyleOption,
  type MaxItemsPerViewOption,
} from '../accessibility';

interface ToggleProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

function CognitiveToggle({ id, label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-4">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-gray-900">
          {label}
        </label>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

const FOCUS_MODE_LABELS: Record<FocusModeOption, string> = {
  off: 'Off',
  moderate: 'Moderate (dim secondary content)',
  strict: 'Strict (hide non-essential UI)',
};

const PROGRESS_STYLE_LABELS: Record<ProgressStyleOption, string> = {
  bar: 'Progress Bar',
  steps: 'Step Indicators',
  checklist: 'Checklist',
  ring: 'Circular Ring',
};

const MAX_ITEMS_LABELS: Record<MaxItemsPerViewOption, string> = {
  3: 'Show 3 items',
  5: 'Show 5 items',
  10: 'Show 10 items',
  0: 'Unlimited',
};

export function CognitiveAccessibilitySection() {
  const {
    focusMode,
    taskChunkingEnabled,
    maxStepsPerChunk,
    progressStyle,
    maxItemsPerView,
    confirmBeforeActions,
    autoSaveReminders,
    timerVisualizationEnabled,
    setFocusMode,
    setTaskChunkingEnabled,
    setMaxStepsPerChunk,
    setProgressStyle,
    setMaxItemsPerView,
    setConfirmBeforeActions,
    setAutoSaveReminders,
    setTimerVisualizationEnabled,
    announce,
  } = useAccessibility();

  return (
    <section
      className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      aria-labelledby="cognitive-settings-heading"
    >
      <div>
        <h2 id="cognitive-settings-heading" className="text-lg font-semibold text-gray-900">
          Cognitive Accessibility
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Reduce cognitive load, simplify the interface, and customize how tasks and progress are
          displayed.
        </p>
      </div>

      {/* Focus mode */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-800">Focus Mode</legend>
        <p className="text-xs text-gray-500">
          Reduces visual distractions by dimming or hiding secondary content so you can
          concentrate on the current task.
        </p>
        <div className="space-y-1">
          <label htmlFor="focus-mode-select" className="block text-sm font-medium text-gray-700">
            Focus Level
          </label>
          <select
            id="focus-mode-select"
            value={focusMode}
            onChange={(e) => {
              const val = e.target.value as FocusModeOption;
              if (FOCUS_MODE_OPTIONS.includes(val)) {
                setFocusMode(val);
                announce(`Focus mode set to ${FOCUS_MODE_LABELS[val]}`);
              }
            }}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {FOCUS_MODE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {FOCUS_MODE_LABELS[opt]}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      {/* Task chunking */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-800">Task Chunking</legend>

        <CognitiveToggle
          id="task-chunking-toggle"
          label="Break Tasks into Steps"
          description="Splits multi-step chores into smaller, manageable chunks with visual progress indicators."
          checked={taskChunkingEnabled}
          onChange={(next) => {
            setTaskChunkingEnabled(next);
            announce(next ? 'Task chunking enabled' : 'Task chunking disabled');
          }}
        />

        {taskChunkingEnabled && (
          <div className="space-y-1 pl-4">
            <label htmlFor="max-steps-range" className="block text-sm font-medium text-gray-700">
              Steps per chunk: {maxStepsPerChunk}
            </label>
            <input
              id="max-steps-range"
              type="range"
              min={1}
              max={5}
              step={1}
              value={maxStepsPerChunk}
              onChange={(e) => setMaxStepsPerChunk(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 step</span>
              <span>5 steps</span>
            </div>
          </div>
        )}
      </fieldset>

      {/* Progress visualization */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-800">Progress Display</legend>
        <div className="space-y-1">
          <label htmlFor="progress-style-select" className="block text-sm font-medium text-gray-700">
            Progress Visualization Style
          </label>
          <select
            id="progress-style-select"
            value={progressStyle}
            onChange={(e) => {
              const val = e.target.value as ProgressStyleOption;
              if (PROGRESS_STYLE_OPTIONS.includes(val)) {
                setProgressStyle(val);
                announce(`Progress style set to ${PROGRESS_STYLE_LABELS[val]}`);
              }
            }}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {PROGRESS_STYLE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {PROGRESS_STYLE_LABELS[opt]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="max-items-select" className="block text-sm font-medium text-gray-700">
            Items per Screen
          </label>
          <select
            id="max-items-select"
            value={maxItemsPerView}
            onChange={(e) => {
              const val = Number(e.target.value) as MaxItemsPerViewOption;
              if (MAX_ITEMS_PER_VIEW_OPTIONS.includes(val)) {
                setMaxItemsPerView(val);
                announce(`Max items per view set to ${MAX_ITEMS_LABELS[val]}`);
              }
            }}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {MAX_ITEMS_PER_VIEW_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {MAX_ITEMS_LABELS[opt]}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      {/* Safety nets */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-800">Safety &amp; Reminders</legend>

        <CognitiveToggle
          id="confirm-actions-toggle"
          label="Confirm Before Actions"
          description="Shows a confirmation dialog before completing, deleting, or editing chores to prevent accidental taps."
          checked={confirmBeforeActions}
          onChange={(next) => {
            setConfirmBeforeActions(next);
            announce(next ? 'Action confirmation enabled' : 'Action confirmation disabled');
          }}
        />

        <CognitiveToggle
          id="auto-save-toggle"
          label="Auto-Save Reminders"
          description="Periodically reminds you to save or submit in-progress work."
          checked={autoSaveReminders}
          onChange={(next) => {
            setAutoSaveReminders(next);
            announce(next ? 'Auto-save reminders enabled' : 'Auto-save reminders disabled');
          }}
        />

        <CognitiveToggle
          id="timer-viz-toggle"
          label="Visual Timer"
          description="Adds a pulsing visual indicator around countdown timers to make deadlines more noticeable."
          checked={timerVisualizationEnabled}
          onChange={(next) => {
            setTimerVisualizationEnabled(next);
            announce(
              next ? 'Timer visualization enabled' : 'Timer visualization disabled'
            );
          }}
        />
      </fieldset>

      <div className="rounded-lg border border-purple-100 bg-purple-50 p-4 text-sm text-purple-800">
        <p className="font-medium">Cognitive Accessibility Tips</p>
        <p className="mt-1">
          These settings are designed to reduce overwhelm and help users who experience executive
          function challenges, ADHD, or anxiety. Combine focus mode with task chunking for the
          best results.
        </p>
      </div>
    </section>
  );
}
