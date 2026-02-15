import { useState } from 'react';
import {
  useAccessibility,
  READING_FONT_OPTIONS,
  FONT_SIZE_LEVELS,
  LINE_SPACING_OPTIONS,
  SPACING_LEVELS,
  OVERLAY_COLOR_OPTIONS,
  type ReadingFontOption,
  type FontSizeLevel,
  type LineSpacingOption,
  type SpacingLevel,
  type OverlayColorOption,
} from '../accessibility';

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

const FONT_LABELS: Record<ReadingFontOption, string> = {
  default: 'System Default',
  'open-dyslexic': 'OpenDyslexic',
  'lexie-readable': 'Lexie Readable',
};

const OVERLAY_LABELS: Record<OverlayColorOption, string> = {
  none: 'None',
  'warm-cream': 'Warm Cream',
  'soft-peach': 'Soft Peach',
  mint: 'Mint',
  sky: 'Sky Blue',
  lavender: 'Lavender',
  rose: 'Rose',
  sand: 'Sand',
  'cool-gray': 'Cool Gray',
};

const OVERLAY_SWATCHES: Record<OverlayColorOption, string> = {
  none: 'transparent',
  'warm-cream': '#fff4d6',
  'soft-peach': '#ffe6d6',
  mint: '#dcffea',
  sky: '#ddf0ff',
  lavender: '#ede6ff',
  rose: '#ffe6ee',
  sand: '#f4ead4',
  'cool-gray': '#ebeef3',
};

export function AccessibilitySection() {
  const {
    highContrastEnabled,
    reducedMotionEnabled,
    readingFont,
    fontSizeLevel,
    lineSpacing,
    letterSpacingLevel,
    wordSpacingLevel,
    colorOverlay,
    simplifiedLanguageEnabled,
    iconHeavyNavigationEnabled,
    readingRulerEnabled,
    bionicReadingEnabled,
    isSpeaking,
    profiles,
    setHighContrastEnabled,
    setReducedMotionEnabled,
    setReadingFont,
    setFontSizeLevel,
    setLineSpacing,
    setLetterSpacingLevel,
    setWordSpacingLevel,
    setColorOverlay,
    setSimplifiedLanguageEnabled,
    setIconHeavyNavigationEnabled,
    setReadingRulerEnabled,
    setBionicReadingEnabled,
    saveProfile,
    applyProfile,
    deleteProfile,
    announce,
    speakPage,
    stopSpeaking,
  } = useAccessibility();

  const [profileName, setProfileName] = useState('');

  const handleSaveProfile = () => {
    const trimmed = profileName.trim();
    if (!trimmed) return;
    if (saveProfile(trimmed)) {
      announce(`Saved reading profile "${trimmed}"`);
      setProfileName('');
    }
  };

  return (
    <section
      className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      aria-labelledby="accessibility-settings-heading"
    >
      <div>
        <h2 id="accessibility-settings-heading" className="text-lg font-semibold text-gray-900">
          Accessibility
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Customize display, reading, and interaction preferences for a comfortable experience.
        </p>
      </div>

      {/* Display section */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-800">Display</legend>

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
      </fieldset>

      {/* Reading section */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-800">Reading</legend>

        {/* Font picker */}
        <div className="space-y-1">
          <label htmlFor="reading-font-select" className="block text-sm font-medium text-gray-700">
            Reading Font
          </label>
          <select
            id="reading-font-select"
            value={readingFont}
            onChange={(e) => {
              const val = e.target.value as ReadingFontOption;
              if (READING_FONT_OPTIONS.includes(val)) {
                setReadingFont(val);
                announce(`Reading font set to ${FONT_LABELS[val]}`);
              }
            }}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {READING_FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {FONT_LABELS[f]}
              </option>
            ))}
          </select>
        </div>

        {/* Font size slider */}
        <div className="space-y-1">
          <label htmlFor="font-size-range" className="block text-sm font-medium text-gray-700">
            Font Size (level {fontSizeLevel} of {FONT_SIZE_LEVELS.length})
          </label>
          <input
            id="font-size-range"
            type="range"
            min={FONT_SIZE_LEVELS[0]}
            max={FONT_SIZE_LEVELS[FONT_SIZE_LEVELS.length - 1]}
            step={1}
            value={fontSizeLevel}
            onChange={(e) => {
              const val = Number(e.target.value) as FontSizeLevel;
              setFontSizeLevel(val);
            }}
            className="w-full accent-blue-600"
            aria-valuemin={FONT_SIZE_LEVELS[0]}
            aria-valuemax={FONT_SIZE_LEVELS[FONT_SIZE_LEVELS.length - 1]}
            aria-valuenow={fontSizeLevel}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Smaller</span>
            <span>Larger</span>
          </div>
        </div>

        {/* Line spacing */}
        <div className="space-y-1">
          <label htmlFor="line-spacing-select" className="block text-sm font-medium text-gray-700">
            Line Spacing
          </label>
          <select
            id="line-spacing-select"
            value={lineSpacing}
            onChange={(e) => {
              const val = Number(e.target.value) as LineSpacingOption;
              if (LINE_SPACING_OPTIONS.includes(val)) {
                setLineSpacing(val);
                announce(`Line spacing set to ${val}`);
              }
            }}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {LINE_SPACING_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v === 1 ? 'Single' : v === 1.5 ? '1.5x' : 'Double'}
              </option>
            ))}
          </select>
        </div>

        {/* Letter spacing */}
        <div className="space-y-1">
          <label htmlFor="letter-spacing-range" className="block text-sm font-medium text-gray-700">
            Letter Spacing (level {letterSpacingLevel})
          </label>
          <input
            id="letter-spacing-range"
            type="range"
            min={SPACING_LEVELS[0]}
            max={SPACING_LEVELS[SPACING_LEVELS.length - 1]}
            step={1}
            value={letterSpacingLevel}
            onChange={(e) => setLetterSpacingLevel(Number(e.target.value) as SpacingLevel)}
            className="w-full accent-blue-600"
          />
        </div>

        {/* Word spacing */}
        <div className="space-y-1">
          <label htmlFor="word-spacing-range" className="block text-sm font-medium text-gray-700">
            Word Spacing (level {wordSpacingLevel})
          </label>
          <input
            id="word-spacing-range"
            type="range"
            min={SPACING_LEVELS[0]}
            max={SPACING_LEVELS[SPACING_LEVELS.length - 1]}
            step={1}
            value={wordSpacingLevel}
            onChange={(e) => setWordSpacingLevel(Number(e.target.value) as SpacingLevel)}
            className="w-full accent-blue-600"
          />
        </div>

        {/* Color overlay picker */}
        <div className="space-y-2">
          <span className="block text-sm font-medium text-gray-700">Color Overlay</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color overlay">
            {OVERLAY_COLOR_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={colorOverlay === opt}
                aria-label={OVERLAY_LABELS[opt]}
                onClick={() => {
                  setColorOverlay(opt);
                  announce(`Color overlay set to ${OVERLAY_LABELS[opt]}`);
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                  colorOverlay === opt
                    ? 'border-blue-600 ring-2 ring-blue-300'
                    : 'border-gray-300'
                }`}
                style={{ backgroundColor: OVERLAY_SWATCHES[opt] }}
                title={OVERLAY_LABELS[opt]}
              >
                {opt === 'none' && (
                  <span className="text-xs text-gray-400" aria-hidden="true">
                    /
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      {/* Reading aids section */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-800">Reading Aids</legend>

        <AccessibilityToggle
          id="reading-ruler-toggle"
          label="Reading Ruler"
          description="Shows a highlight band that follows your cursor to help track the current line."
          checked={readingRulerEnabled}
          onChange={(next) => {
            setReadingRulerEnabled(next);
            announce(next ? 'Reading ruler enabled' : 'Reading ruler disabled');
          }}
        />

        <AccessibilityToggle
          id="bionic-reading-toggle"
          label="Bionic Reading"
          description="Bolds the first portion of words to guide your eye through text more quickly."
          checked={bionicReadingEnabled}
          onChange={(next) => {
            setBionicReadingEnabled(next);
            announce(next ? 'Bionic reading enabled' : 'Bionic reading disabled');
          }}
        />

        <AccessibilityToggle
          id="simplified-language-toggle"
          label="Simplified Language"
          description="Uses shorter, plainer text throughout the app where alternative wording is available."
          checked={simplifiedLanguageEnabled}
          onChange={(next) => {
            setSimplifiedLanguageEnabled(next);
            announce(next ? 'Simplified language enabled' : 'Simplified language disabled');
          }}
        />

        <AccessibilityToggle
          id="icon-heavy-nav-toggle"
          label="Icon-Heavy Navigation"
          description="Enlarges navigation icons and labels for easier visual scanning."
          checked={iconHeavyNavigationEnabled}
          onChange={(next) => {
            setIconHeavyNavigationEnabled(next);
            announce(
              next ? 'Icon-heavy navigation enabled' : 'Icon-heavy navigation disabled'
            );
          }}
        />
      </fieldset>

      {/* Text to speech */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-800">Text to Speech</legend>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => (isSpeaking ? stopSpeaking() : speakPage())}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isSpeaking
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {isSpeaking ? 'Stop Reading' : 'Read This Page Aloud'}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Uses your browser's built-in speech synthesis. Voice quality varies by device.
        </p>
      </fieldset>

      {/* Profiles */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-800">Reading Profiles</legend>
        <p className="text-xs text-gray-500">
          Save your current reading settings as a profile so you can quickly switch between
          configurations.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Profile name"
            maxLength={40}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            aria-label="New profile name"
          />
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={!profileName.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save
          </button>
        </div>

        {Object.keys(profiles).length > 0 && (
          <ul className="space-y-2">
            {Object.keys(profiles).map((name) => (
              <li
                key={name}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2"
              >
                <span className="text-sm font-medium text-gray-800">{name}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      applyProfile(name);
                      announce(`Applied reading profile "${name}"`);
                    }}
                    className="rounded px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteProfile(name);
                      announce(`Deleted reading profile "${name}"`);
                    }}
                    className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium">Assistive Technology Notes</p>
        <p className="mt-1">
          Voice control support is improved by explicit button labels and stable navigation
          naming across web and mobile screens.
        </p>
      </div>
    </section>
  );
}
