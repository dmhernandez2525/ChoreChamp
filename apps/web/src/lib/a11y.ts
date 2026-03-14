/**
 * Accessibility utilities for ChoreChamp.
 *
 * Provides helpers for screen reader announcements, focus management,
 * ARIA attributes, and keyboard navigation constants.
 */

// ---------------------------------------------------------------------------
// Keyboard key constants
// ---------------------------------------------------------------------------

export const KEYBOARD_KEYS = {
  Enter: 'Enter',
  Space: ' ',
  Escape: 'Escape',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  Tab: 'Tab',
  Home: 'Home',
  End: 'End',
  Backspace: 'Backspace',
  Delete: 'Delete',
} as const;

export type KeyboardKey = (typeof KEYBOARD_KEYS)[keyof typeof KEYBOARD_KEYS];

// ---------------------------------------------------------------------------
// Screen reader announcements
// ---------------------------------------------------------------------------

/**
 * Creates a temporary aria-live region and announces the given message to
 * assistive technology. The live region is removed from the DOM after the
 * announcement has had time to be read.
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite',
): void {
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', priority);
  el.setAttribute('aria-atomic', 'true');
  // Visually hidden but available to screen readers
  Object.assign(el.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  });

  document.body.appendChild(el);

  // Delay setting textContent so the live region is registered first
  requestAnimationFrame(() => {
    el.textContent = message;
  });

  // Clean up after a generous timeout so screen readers finish reading
  setTimeout(() => {
    document.body.removeChild(el);
  }, 3000);
}

// ---------------------------------------------------------------------------
// Focus trap
// ---------------------------------------------------------------------------

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Traps keyboard focus within `containerEl`. Returns a cleanup function that
 * removes the event listener when the trap should be released.
 */
export function trapFocus(containerEl: HTMLElement): () => void {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== KEYBOARD_KEYS.Tab) return;

    const focusable = Array.from(
      containerEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    );

    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  containerEl.addEventListener('keydown', handleKeyDown);

  // Focus the first focusable element when the trap is activated
  const firstFocusable =
    containerEl.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
  firstFocusable?.focus();

  return () => {
    containerEl.removeEventListener('keydown', handleKeyDown);
  };
}

// ---------------------------------------------------------------------------
// ARIA sort helper
// ---------------------------------------------------------------------------

/**
 * Returns the correct `aria-sort` attribute value for a sortable column header.
 */
export function getAriaSort(
  sortDir: 'asc' | 'desc' | null,
): 'ascending' | 'descending' | 'none' {
  if (sortDir === 'asc') return 'ascending';
  if (sortDir === 'desc') return 'descending';
  return 'none';
}

// ---------------------------------------------------------------------------
// Unique ID generation
// ---------------------------------------------------------------------------

let idCounter = 0;

/**
 * Generates a unique ID suitable for `aria-labelledby` and `aria-describedby`
 * relationships. IDs are prefixed for readability and guaranteed unique within
 * the current page session.
 */
export function generateId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}
