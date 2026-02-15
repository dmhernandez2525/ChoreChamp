import { useAccessibility } from '../accessibility';

interface ToggleProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

function AccessibilityToggle({ id, label, description, checked, onChange }: ToggleProps) {
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

export function AccessibilitySection() {
  const {
    highContrastEnabled,
    reducedMotionEnabled,
    setHighContrastEnabled,
    setReducedMotionEnabled,
    announce,
  } = useAccessibility();

  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm" aria-labelledby="accessibility-settings-heading">
      <div>
        <h2 id="accessibility-settings-heading" className="text-lg font-semibold text-gray-900">
          Accessibility
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Improve screen reader output, keyboard navigation clarity, and motion/contrast comfort.
        </p>
      </div>

      <AccessibilityToggle
        id="high-contrast-toggle"
        label="High Contrast Mode"
        description="Uses a WCAG AAA color palette with stronger focus outlines and improved text/background contrast."
        checked={highContrastEnabled}
        onChange={(next) => {
          setHighContrastEnabled(next);
          announce(next ? 'High contrast mode enabled' : 'High contrast mode disabled');
        }}
      />

      <AccessibilityToggle
        id="reduced-motion-toggle"
        label="Reduced Motion"
        description="Minimizes non-essential animation and transition effects for motion-sensitive users."
        checked={reducedMotionEnabled}
        onChange={(next) => {
          setReducedMotionEnabled(next);
          announce(next ? 'Reduced motion enabled' : 'Reduced motion disabled');
        }}
      />

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium">Assistive Technology Notes</p>
        <p className="mt-1">
          Voice control support is improved by explicit button labels and stable navigation naming across web and mobile screens.
        </p>
      </div>
    </section>
  );
}
