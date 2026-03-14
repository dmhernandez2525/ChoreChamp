import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnnounceOptions {
  priority?: 'polite' | 'assertive';
}

interface A11yAnnouncerContextValue {
  announce: (message: string, options?: AnnounceOptions) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const A11yAnnouncerContext = createContext<A11yAnnouncerContextValue | null>(
  null,
);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Provides a persistent pair of aria-live regions (polite and assertive) that
 * child components can use via the `useAnnounce` hook to communicate status
 * updates to assistive technology.
 */
export function A11yAnnouncerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  // Timers so we can clear previous announcements before setting new ones
  const politeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const assertiveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const announce = useCallback(
    (message: string, options: AnnounceOptions = {}) => {
      const { priority = 'polite' } = options;

      if (priority === 'assertive') {
        // Clear then set so the live region re-announces even if the text is the same
        clearTimeout(assertiveTimer.current);
        setAssertiveMessage('');
        requestAnimationFrame(() => {
          setAssertiveMessage(message);
        });
        assertiveTimer.current = setTimeout(() => setAssertiveMessage(''), 5000);
      } else {
        clearTimeout(politeTimer.current);
        setPoliteMessage('');
        requestAnimationFrame(() => {
          setPoliteMessage(message);
        });
        politeTimer.current = setTimeout(() => setPoliteMessage(''), 5000);
      }
    },
    [],
  );

  return (
    <A11yAnnouncerContext.Provider value={{ announce }}>
      {children}

      {/* Polite live region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>

      {/* Assertive live region */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </A11yAnnouncerContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns an `announce` function that sends a message to the nearest
 * `A11yAnnouncerProvider`'s live region.
 *
 * @example
 * const announce = useAnnounce();
 * announce('Chore moved to Done');
 * announce('Error saving changes', { priority: 'assertive' });
 */
export function useAnnounce(): (
  message: string,
  options?: AnnounceOptions,
) => void {
  const ctx = useContext(A11yAnnouncerContext);
  if (!ctx) {
    throw new Error('useAnnounce must be used within an A11yAnnouncerProvider');
  }
  return ctx.announce;
}
