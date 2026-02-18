import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type AnnouncementPoliteness = 'polite' | 'assertive';

export const READING_FONT_OPTIONS = ['default', 'open-dyslexic', 'lexie-readable'] as const;
export type ReadingFontOption = (typeof READING_FONT_OPTIONS)[number];

export const FONT_SIZE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export type FontSizeLevel = (typeof FONT_SIZE_LEVELS)[number];

export const LINE_SPACING_OPTIONS = [1, 1.5, 2] as const;
export type LineSpacingOption = (typeof LINE_SPACING_OPTIONS)[number];

export const SPACING_LEVELS = [0, 1, 2, 3, 4] as const;
export type SpacingLevel = (typeof SPACING_LEVELS)[number];

export const OVERLAY_COLOR_OPTIONS = [
  'none',
  'warm-cream',
  'soft-peach',
  'mint',
  'sky',
  'lavender',
  'rose',
  'sand',
  'cool-gray',
] as const;
export type OverlayColorOption = (typeof OVERLAY_COLOR_OPTIONS)[number];

interface ReadingPreferences {
  readingFont: ReadingFontOption;
  fontSizeLevel: FontSizeLevel;
  lineSpacing: LineSpacingOption;
  letterSpacingLevel: SpacingLevel;
  wordSpacingLevel: SpacingLevel;
  colorOverlay: OverlayColorOption;
  simplifiedLanguageEnabled: boolean;
  iconHeavyNavigationEnabled: boolean;
  readingRulerEnabled: boolean;
  bionicReadingEnabled: boolean;
}

interface AccessibilityContextValue extends ReadingPreferences {
  highContrastEnabled: boolean;
  reducedMotionEnabled: boolean;
  isSpeaking: boolean;
  profiles: Record<string, ReadingPreferences>;
  setHighContrastEnabled: (enabled: boolean) => void;
  setReducedMotionEnabled: (enabled: boolean) => void;
  setReadingFont: (next: ReadingFontOption) => void;
  setFontSizeLevel: (next: FontSizeLevel) => void;
  setLineSpacing: (next: LineSpacingOption) => void;
  setLetterSpacingLevel: (next: SpacingLevel) => void;
  setWordSpacingLevel: (next: SpacingLevel) => void;
  setColorOverlay: (next: OverlayColorOption) => void;
  setSimplifiedLanguageEnabled: (next: boolean) => void;
  setIconHeavyNavigationEnabled: (next: boolean) => void;
  setReadingRulerEnabled: (next: boolean) => void;
  setBionicReadingEnabled: (next: boolean) => void;
  saveProfile: (name: string) => boolean;
  applyProfile: (name: string) => boolean;
  deleteProfile: (name: string) => void;
  announce: (message: string, politeness?: AnnouncementPoliteness) => void;
  t: (fullText: string, simplifiedText?: string) => string;
  speakText: (text: string) => void;
  speakPage: (selector?: string) => void;
  stopSpeaking: () => void;
}

const STORAGE_KEY = 'cc_accessibility_preferences';

const FONT_SIZE_SCALE: Record<FontSizeLevel, string> = {
  1: '0.85',
  2: '0.92',
  3: '1',
  4: '1.08',
  5: '1.16',
  6: '1.24',
  7: '1.32',
  8: '1.4',
};

const LETTER_SPACING_SCALE: Record<SpacingLevel, string> = {
  0: '0em',
  1: '0.01em',
  2: '0.02em',
  3: '0.04em',
  4: '0.06em',
};

const WORD_SPACING_SCALE: Record<SpacingLevel, string> = {
  0: '0em',
  1: '0.03em',
  2: '0.06em',
  3: '0.1em',
  4: '0.16em',
};

const OVERLAY_COLOR_MAP: Record<OverlayColorOption, string> = {
  none: 'rgba(0, 0, 0, 0)',
  'warm-cream': 'rgba(255, 244, 214, 0.35)',
  'soft-peach': 'rgba(255, 230, 214, 0.35)',
  mint: 'rgba(220, 255, 234, 0.3)',
  sky: 'rgba(221, 240, 255, 0.3)',
  lavender: 'rgba(237, 230, 255, 0.32)',
  rose: 'rgba(255, 230, 238, 0.3)',
  sand: 'rgba(244, 234, 212, 0.32)',
  'cool-gray': 'rgba(235, 238, 243, 0.36)',
};

const DEFAULT_READING_PREFERENCES: ReadingPreferences = {
  readingFont: 'default',
  fontSizeLevel: 3,
  lineSpacing: 1.5,
  letterSpacingLevel: 0,
  wordSpacingLevel: 0,
  colorOverlay: 'none',
  simplifiedLanguageEnabled: false,
  iconHeavyNavigationEnabled: false,
  readingRulerEnabled: false,
  bionicReadingEnabled: false,
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

interface StoredAccessibilityPreferences extends Partial<ReadingPreferences> {
  highContrastEnabled?: boolean;
  reducedMotionEnabled?: boolean;
  profiles?: Record<string, ReadingPreferences>;
}

function includesValue<T extends string | number>(
  values: readonly T[],
  value: unknown
): value is T {
  return values.includes(value as T);
}

function readSystemReducedMotionPreference(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [highContrastEnabled, setHighContrastEnabled] = useState(false);
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(readSystemReducedMotionPreference);

  const [readingFont, setReadingFont] = useState<ReadingFontOption>(
    DEFAULT_READING_PREFERENCES.readingFont
  );
  const [fontSizeLevel, setFontSizeLevel] = useState<FontSizeLevel>(
    DEFAULT_READING_PREFERENCES.fontSizeLevel
  );
  const [lineSpacing, setLineSpacing] = useState<LineSpacingOption>(
    DEFAULT_READING_PREFERENCES.lineSpacing
  );
  const [letterSpacingLevel, setLetterSpacingLevel] = useState<SpacingLevel>(
    DEFAULT_READING_PREFERENCES.letterSpacingLevel
  );
  const [wordSpacingLevel, setWordSpacingLevel] = useState<SpacingLevel>(
    DEFAULT_READING_PREFERENCES.wordSpacingLevel
  );
  const [colorOverlay, setColorOverlay] = useState<OverlayColorOption>(
    DEFAULT_READING_PREFERENCES.colorOverlay
  );
  const [simplifiedLanguageEnabled, setSimplifiedLanguageEnabled] = useState(
    DEFAULT_READING_PREFERENCES.simplifiedLanguageEnabled
  );
  const [iconHeavyNavigationEnabled, setIconHeavyNavigationEnabled] = useState(
    DEFAULT_READING_PREFERENCES.iconHeavyNavigationEnabled
  );
  const [readingRulerEnabled, setReadingRulerEnabled] = useState(
    DEFAULT_READING_PREFERENCES.readingRulerEnabled
  );
  const [bionicReadingEnabled, setBionicReadingEnabled] = useState(
    DEFAULT_READING_PREFERENCES.bionicReadingEnabled
  );

  const [profiles, setProfiles] = useState<Record<string, ReadingPreferences>>({});

  const [announcement, setAnnouncement] = useState('');
  const [announcementPoliteness, setAnnouncementPoliteness] =
    useState<AnnouncementPoliteness>('polite');
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as StoredAccessibilityPreferences;

      if (typeof parsed.highContrastEnabled === 'boolean') {
        setHighContrastEnabled(parsed.highContrastEnabled);
      }
      if (typeof parsed.reducedMotionEnabled === 'boolean') {
        setReducedMotionEnabled(parsed.reducedMotionEnabled);
      }
      if (includesValue(READING_FONT_OPTIONS, parsed.readingFont)) {
        setReadingFont(parsed.readingFont);
      }
      if (includesValue(FONT_SIZE_LEVELS, parsed.fontSizeLevel)) {
        setFontSizeLevel(parsed.fontSizeLevel);
      }
      if (includesValue(LINE_SPACING_OPTIONS, parsed.lineSpacing)) {
        setLineSpacing(parsed.lineSpacing);
      }
      if (includesValue(SPACING_LEVELS, parsed.letterSpacingLevel)) {
        setLetterSpacingLevel(parsed.letterSpacingLevel);
      }
      if (includesValue(SPACING_LEVELS, parsed.wordSpacingLevel)) {
        setWordSpacingLevel(parsed.wordSpacingLevel);
      }
      if (includesValue(OVERLAY_COLOR_OPTIONS, parsed.colorOverlay)) {
        setColorOverlay(parsed.colorOverlay);
      }
      if (typeof parsed.simplifiedLanguageEnabled === 'boolean') {
        setSimplifiedLanguageEnabled(parsed.simplifiedLanguageEnabled);
      }
      if (typeof parsed.iconHeavyNavigationEnabled === 'boolean') {
        setIconHeavyNavigationEnabled(parsed.iconHeavyNavigationEnabled);
      }
      if (typeof parsed.readingRulerEnabled === 'boolean') {
        setReadingRulerEnabled(parsed.readingRulerEnabled);
      }
      if (typeof parsed.bionicReadingEnabled === 'boolean') {
        setBionicReadingEnabled(parsed.bionicReadingEnabled);
      }
      if (parsed.profiles && typeof parsed.profiles === 'object') {
        setProfiles(parsed.profiles);
      }
    } catch {
      // Ignore storage parse errors.
    }
  }, []);

  useEffect(() => {
    try {
      const payload: StoredAccessibilityPreferences = {
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
        profiles,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage write errors.
    }
  }, [
    bionicReadingEnabled,
    colorOverlay,
    fontSizeLevel,
    highContrastEnabled,
    iconHeavyNavigationEnabled,
    letterSpacingLevel,
    lineSpacing,
    profiles,
    readingFont,
    readingRulerEnabled,
    reducedMotionEnabled,
    simplifiedLanguageEnabled,
    wordSpacingLevel,
  ]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-high-contrast', highContrastEnabled ? 'true' : 'false');
    root.setAttribute('data-reduced-motion', reducedMotionEnabled ? 'true' : 'false');
    root.setAttribute('data-reading-font', readingFont);
    root.setAttribute('data-reading-overlay', colorOverlay);
    root.setAttribute('data-simplified-language', simplifiedLanguageEnabled ? 'true' : 'false');
    root.setAttribute(
      'data-icon-heavy-navigation',
      iconHeavyNavigationEnabled ? 'true' : 'false'
    );
    root.setAttribute('data-reading-ruler', readingRulerEnabled ? 'true' : 'false');
    root.setAttribute('data-bionic-reading', bionicReadingEnabled ? 'true' : 'false');

    root.style.setProperty('--reading-font-scale', FONT_SIZE_SCALE[fontSizeLevel]);
    root.style.setProperty('--reading-line-height', String(lineSpacing));
    root.style.setProperty(
      '--reading-letter-spacing',
      LETTER_SPACING_SCALE[letterSpacingLevel]
    );
    root.style.setProperty('--reading-word-spacing', WORD_SPACING_SCALE[wordSpacingLevel]);
    root.style.setProperty('--reading-overlay-color', OVERLAY_COLOR_MAP[colorOverlay]);
  }, [
    bionicReadingEnabled,
    colorOverlay,
    fontSizeLevel,
    highContrastEnabled,
    iconHeavyNavigationEnabled,
    letterSpacingLevel,
    lineSpacing,
    readingFont,
    readingRulerEnabled,
    reducedMotionEnabled,
    simplifiedLanguageEnabled,
    wordSpacingLevel,
  ]);

  useEffect(() => {
    if (!readingRulerEnabled) return;

    const root = document.documentElement;
    const handlePointerMove = (event: MouseEvent) => {
      root.style.setProperty('--reading-ruler-y', `${event.clientY}px`);
    };
    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      root.style.setProperty('--reading-ruler-y', `${touch.clientY}px`);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [readingRulerEnabled]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const announce = useCallback((message: string, politeness: AnnouncementPoliteness = 'polite') => {
    setAnnouncementPoliteness(politeness);
    setAnnouncement('');

    if (typeof window === 'undefined') {
      setAnnouncement(message);
      return;
    }

    window.requestAnimationFrame(() => {
      setAnnouncement(message);
    });
  }, []);

  const t = useCallback(
    (fullText: string, simplifiedText?: string) =>
      simplifiedLanguageEnabled && simplifiedText ? simplifiedText : fullText,
    [simplifiedLanguageEnabled]
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speakText = useCallback(
    (text: string) => {
      const normalizedText = text.replace(/\s+/g, ' ').trim();
      if (!normalizedText.length) return;

      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        announce('Text to speech is not supported on this device', 'assertive');
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(normalizedText);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        announce('Unable to read this content aloud right now', 'assertive');
      };

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [announce]
  );

  const speakPage = useCallback(
    (selector = 'main') => {
      const target = document.querySelector(selector);
      if (!(target instanceof HTMLElement)) {
        announce('No readable page content found', 'assertive');
        return;
      }

      const text = target.innerText?.trim() ?? '';
      if (!text.length) {
        announce('No readable page content found', 'assertive');
        return;
      }

      announce('Reading this page aloud');
      speakText(text);
    },
    [announce, speakText]
  );

  const saveProfile = useCallback(
    (name: string) => {
      const normalized = name.trim();
      if (!normalized) return false;

      setProfiles((prev) => ({
        ...prev,
        [normalized]: {
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
        },
      }));
      return true;
    },
    [
      bionicReadingEnabled,
      colorOverlay,
      fontSizeLevel,
      iconHeavyNavigationEnabled,
      letterSpacingLevel,
      lineSpacing,
      readingFont,
      readingRulerEnabled,
      simplifiedLanguageEnabled,
      wordSpacingLevel,
    ]
  );

  const applyProfile = useCallback(
    (name: string) => {
      const profile = profiles[name];
      if (!profile) return false;

      setReadingFont(profile.readingFont);
      setFontSizeLevel(profile.fontSizeLevel);
      setLineSpacing(profile.lineSpacing);
      setLetterSpacingLevel(profile.letterSpacingLevel);
      setWordSpacingLevel(profile.wordSpacingLevel);
      setColorOverlay(profile.colorOverlay);
      setSimplifiedLanguageEnabled(profile.simplifiedLanguageEnabled);
      setIconHeavyNavigationEnabled(profile.iconHeavyNavigationEnabled);
      setReadingRulerEnabled(profile.readingRulerEnabled);
      setBionicReadingEnabled(profile.bionicReadingEnabled);
      return true;
    },
    [profiles]
  );

  const deleteProfile = useCallback((name: string) => {
    setProfiles((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const value = useMemo<AccessibilityContextValue>(
    () => ({
      highContrastEnabled,
      reducedMotionEnabled,
      isSpeaking,
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
      t,
      speakText,
      speakPage,
      stopSpeaking,
    }),
    [
      announce,
      applyProfile,
      bionicReadingEnabled,
      colorOverlay,
      deleteProfile,
      fontSizeLevel,
      highContrastEnabled,
      iconHeavyNavigationEnabled,
      isSpeaking,
      letterSpacingLevel,
      lineSpacing,
      profiles,
      readingFont,
      readingRulerEnabled,
      reducedMotionEnabled,
      saveProfile,
      simplifiedLanguageEnabled,
      speakPage,
      speakText,
      stopSpeaking,
      t,
      wordSpacingLevel,
    ]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      <div className="sr-only" aria-live={announcementPoliteness} aria-atomic="true">
        {announcement}
      </div>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}
