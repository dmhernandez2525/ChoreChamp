import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { A11yAnnouncerProvider, useAnnounce } from '../A11yAnnouncer';

// Mock requestAnimationFrame to run callbacks synchronously
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0);
    return 0;
  });
});

// Helper component to trigger announce from within the provider
function AnnounceButton({
  message,
  priority,
}: {
  message: string;
  priority?: 'polite' | 'assertive';
}) {
  const announce = useAnnounce();
  return (
    <button onClick={() => announce(message, priority ? { priority } : undefined)}>
      Announce
    </button>
  );
}

describe('A11yAnnouncerProvider', () => {
  it('renders children', () => {
    render(
      <A11yAnnouncerProvider>
        <div data-testid="child">Hello</div>
      </A11yAnnouncerProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders polite aria-live region', () => {
    render(
      <A11yAnnouncerProvider>
        <div />
      </A11yAnnouncerProvider>,
    );
    const politeRegion = screen.getByRole('status');
    expect(politeRegion).toHaveAttribute('aria-live', 'polite');
    expect(politeRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('renders assertive aria-live region', () => {
    render(
      <A11yAnnouncerProvider>
        <div />
      </A11yAnnouncerProvider>,
    );
    const alertRegion = screen.getByRole('alert');
    expect(alertRegion).toHaveAttribute('aria-live', 'assertive');
    expect(alertRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('announces a polite message by default', () => {
    render(
      <A11yAnnouncerProvider>
        <AnnounceButton message="Chore moved" />
      </A11yAnnouncerProvider>,
    );

    act(() => {
      screen.getByText('Announce').click();
    });

    const politeRegion = screen.getByRole('status');
    expect(politeRegion).toHaveTextContent('Chore moved');
  });

  it('announces an assertive message when priority is assertive', () => {
    render(
      <A11yAnnouncerProvider>
        <AnnounceButton message="Error occurred" priority="assertive" />
      </A11yAnnouncerProvider>,
    );

    act(() => {
      screen.getByText('Announce').click();
    });

    const alertRegion = screen.getByRole('alert');
    expect(alertRegion).toHaveTextContent('Error occurred');
  });

  it('clears polite message after 5 seconds', () => {
    render(
      <A11yAnnouncerProvider>
        <AnnounceButton message="Done" />
      </A11yAnnouncerProvider>,
    );

    act(() => {
      screen.getByText('Announce').click();
    });

    expect(screen.getByRole('status')).toHaveTextContent('Done');

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('clears assertive message after 5 seconds', () => {
    render(
      <A11yAnnouncerProvider>
        <AnnounceButton message="Alert!" priority="assertive" />
      </A11yAnnouncerProvider>,
    );

    act(() => {
      screen.getByText('Announce').click();
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Alert!');

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByRole('alert')).toHaveTextContent('');
  });
});

describe('useAnnounce', () => {
  it('throws when used outside of A11yAnnouncerProvider', () => {
    // Suppress React error boundary console output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function Broken() {
      useAnnounce();
      return null;
    }

    expect(() => render(<Broken />)).toThrow(
      'useAnnounce must be used within an A11yAnnouncerProvider',
    );

    spy.mockRestore();
  });
});
