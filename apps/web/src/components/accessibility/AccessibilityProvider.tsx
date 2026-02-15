import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type AnnouncementPoliteness = 'polite' | 'assertive';

interface AccessibilityContextValue {
  highContrastEnabled: boolean;
  reducedMotionEnabled: boolean;
  setHighContrastEnabled: (enabled: boolean) => void;
  setReducedMotionEnabled: (enabled: boolean) => void;
  announce: (message: string, politeness?: AnnouncementPoliteness) => void;
}

const STORAGE_KEY = 'cc_accessibility_preferences';

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

interface StoredAccessibilityPreferences {
  highContrastEnabled?: boolean;
  reducedMotionEnabled?: boolean;
}

function readSystemReducedMotionPreference(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [highContrastEnabled, setHighContrastEnabled] = useState(false);
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(readSystemReducedMotionPreference);
  const [announcement, setAnnouncement] = useState('');
  const [announcementPoliteness, setAnnouncementPoliteness] = useState<AnnouncementPoliteness>('polite');

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
    } catch {
      // Ignore storage parse errors.
    }
  }, []);

  useEffect(() => {
    try {
      const payload: StoredAccessibilityPreferences = {
        highContrastEnabled,
        reducedMotionEnabled,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage write errors.
    }
  }, [highContrastEnabled, reducedMotionEnabled]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-high-contrast', highContrastEnabled ? 'true' : 'false');
    root.setAttribute('data-reduced-motion', reducedMotionEnabled ? 'true' : 'false');
  }, [highContrastEnabled, reducedMotionEnabled]);

  const announce = useCallback((message: string, politeness: AnnouncementPoliteness = 'polite') => {
    setAnnouncementPoliteness(politeness);
    setAnnouncement('');

    window.requestAnimationFrame(() => {
      setAnnouncement(message);
    });
  }, []);

  const value = useMemo<AccessibilityContextValue>(
    () => ({
      highContrastEnabled,
      reducedMotionEnabled,
      setHighContrastEnabled,
      setReducedMotionEnabled,
      announce,
    }),
    [announce, highContrastEnabled, reducedMotionEnabled]
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
