import {
  useAccessibility,
  SENSORY_LEVEL_OPTIONS,
  TRANSITION_STYLE_OPTIONS,
  type SensoryLevelOption,
  type TransitionStyleOption,
} from '../accessibility';

interface ToggleProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

function NeedsToggle({ id, label, description, checked, onChange }: ToggleProps) {
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

const SENSORY_LABELS: Record<SensoryLevelOption, string> = {
  default: 'Default (full color)',
  low: 'Low (reduced saturation)',
  minimal: 'Minimal (muted, calm)',
};

const TRANSITION_LABELS: Record<TransitionStyleOption, string> = {
  default: 'Default',
  fade: 'Fade only',
  none: 'No transitions',
};

export function SpecialNeedsSection() {
  const {
    adhdModeEnabled,
    autismFriendlyEnabled,
    sensoryLevel,
    predictableLayoutEnabled,
    transitionStyle,
    visualTimerEnabled,
    quietModeEnabled,
    consistentNavigationEnabled,
    setAdhdModeEnabled,
    setAutismFriendlyEnabled,
    setSensoryLevel,
    setPredictableLayoutEnabled,
    setTransitionStyle,
    setVisualTimerEnabled,
    setQuietModeEnabled,
    setConsistentNavigationEnabled,
    announce,
  } = useAccessibility();

  return (
    <section
      className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      aria-labelledby="special-needs-heading"
    >
      <div>
        <h2 id="special-needs-heading" className="text-lg font-semibold text-gray-900">
          Special Needs Accommodations
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Personalize the experience for ADHD, autism spectrum, and sensory processing needs.
        </p>
      </div>

      {/* ADHD & Focus */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-800">ADHD Support</legend>

        <NeedsToggle
          id="adhd-mode-toggle"
          label="ADHD Mode"
          description="Highlights the active task and dims others to reduce overwhelm and maintain focus on what needs attention right now."
          checked={adhdModeEnabled}
          onChange={(next) => {
            setAdhdModeEnabled(next);
            announce(next ? 'ADHD mode enabled' : 'ADHD mode disabled');
          }}
        />

        <NeedsToggle
          id="visual-timer-toggle"
          label="Visual Timer"
          description="Adds a visible countdown indicator around timers to help with time awareness and task pacing."
          checked={visualTimerEnabled}
          onChange={(next) => {
            setVisualTimerEnabled(next);
            announce(next ? 'Visual timer enabled' : 'Visual timer disabled');
          }}
        />
      </fieldset>

      {/* Autism-friendly */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-800">Autism-Friendly</legend>

        <NeedsToggle
          id="autism-friendly-toggle"
          label="Autism-Friendly Mode"
          description="Removes surprise elements like confetti and auto-popups. Provides predictable, calm interactions."
          checked={autismFriendlyEnabled}
          onChange={(next) => {
            setAutismFriendlyEnabled(next);
            announce(next ? 'Autism-friendly mode enabled' : 'Autism-friendly mode disabled');
          }}
        />

        <NeedsToggle
          id="predictable-layout-toggle"
          label="Predictable Layouts"
          description="Enforces consistent card sizes and spacing so the interface looks the same every time."
          checked={predictableLayoutEnabled}
          onChange={(next) => {
            setPredictableLayoutEnabled(next);
            announce(
              next ? 'Predictable layouts enabled' : 'Predictable layouts disabled'
            );
          }}
        />

        <NeedsToggle
          id="consistent-nav-toggle"
          label="Consistent Navigation"
          description="Ensures navigation labels are always visible and never collapse or hide based on screen size."
          checked={consistentNavigationEnabled}
          onChange={(next) => {
            setConsistentNavigationEnabled(next);
            announce(
              next
                ? 'Consistent navigation enabled'
                : 'Consistent navigation disabled'
            );
          }}
        />
      </fieldset>

      {/* Sensory controls */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-800">Sensory Controls</legend>

        <div className="space-y-1">
          <label htmlFor="sensory-level-select" className="block text-sm font-medium text-gray-700">
            Sensory Intensity
          </label>
          <select
            id="sensory-level-select"
            value={sensoryLevel}
            onChange={(e) => {
              const val = e.target.value as SensoryLevelOption;
              if (SENSORY_LEVEL_OPTIONS.includes(val)) {
                setSensoryLevel(val);
                announce(`Sensory level set to ${SENSORY_LABELS[val]}`);
              }
            }}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {SENSORY_LEVEL_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {SENSORY_LABELS[opt]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="transition-style-select" className="block text-sm font-medium text-gray-700">
            Transition Style
          </label>
          <select
            id="transition-style-select"
            value={transitionStyle}
            onChange={(e) => {
              const val = e.target.value as TransitionStyleOption;
              if (TRANSITION_STYLE_OPTIONS.includes(val)) {
                setTransitionStyle(val);
                announce(`Transition style set to ${TRANSITION_LABELS[val]}`);
              }
            }}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {TRANSITION_STYLE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {TRANSITION_LABELS[opt]}
              </option>
            ))}
          </select>
        </div>

        <NeedsToggle
          id="quiet-mode-toggle"
          label="Quiet Mode"
          description="Hides notification badges, alert dots, and unread indicators to reduce visual noise."
          checked={quietModeEnabled}
          onChange={(next) => {
            setQuietModeEnabled(next);
            announce(next ? 'Quiet mode enabled' : 'Quiet mode disabled');
          }}
        />
      </fieldset>

      <div className="rounded-lg border border-green-100 bg-green-50 p-4 text-sm text-green-800">
        <p className="font-medium">Evidence-Based Design</p>
        <p className="mt-1">
          These accommodations are based on research into neurodivergent UX patterns. ADHD mode
          reduces decision fatigue, autism-friendly mode removes unpredictable stimuli, and sensory
          controls let each user find their comfort level.
        </p>
      </div>
    </section>
  );
}
