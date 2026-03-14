import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePresence } from '../usePresence';

// Build a mock socket with event emitter behavior
function createMockSocket() {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};
  return {
    connected: false,
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    }),
    off: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((h) => h !== handler);
      }
    }),
    emit: vi.fn(),
    // Helper to simulate server events in tests
    _trigger(event: string, ...args: unknown[]) {
      (listeners[event] ?? []).forEach((h) => h(...args));
    },
    _listeners: listeners,
  };
}

const mockSocket = createMockSocket();

vi.mock('@/lib/socket', () => ({
  getSocket: () => mockSocket,
}));

describe('usePresence', () => {
  const options = { householdId: 'h1', boardId: 'b1' };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockSocket.connected = false;
    // Reset listeners
    for (const key of Object.keys(mockSocket._listeners)) {
      delete mockSocket._listeners[key];
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial state with empty members and disconnected', () => {
    const { result } = renderHook(() => usePresence(options));

    expect(result.current.onlineMembers).toEqual([]);
    expect(result.current.isConnected).toBe(false);
  });

  it('sets isConnected to true on connect and emits board:join', () => {
    const { result } = renderHook(() => usePresence(options));

    act(() => {
      mockSocket.connected = true;
      mockSocket._trigger('connect');
    });

    expect(result.current.isConnected).toBe(true);
    expect(mockSocket.emit).toHaveBeenCalledWith('board:join', {
      householdId: 'h1',
      boardId: 'b1',
    });
  });

  it('sets isConnected to false on disconnect', () => {
    const { result } = renderHook(() => usePresence(options));

    act(() => {
      mockSocket._trigger('connect');
    });
    expect(result.current.isConnected).toBe(true);

    act(() => {
      mockSocket._trigger('disconnect');
    });
    expect(result.current.isConnected).toBe(false);
  });

  it('sets isConnected to false on connect_error', () => {
    const { result } = renderHook(() => usePresence(options));

    act(() => {
      mockSocket._trigger('connect');
    });

    act(() => {
      mockSocket._trigger('connect_error');
    });
    expect(result.current.isConnected).toBe(false);
  });

  it('updates onlineMembers when board:presence event fires', () => {
    const members = [
      { id: 'm1', name: 'Alice', idle: false, idleSince: null },
      { id: 'm2', name: 'Bob', idle: true, idleSince: 1000 },
    ];

    const { result } = renderHook(() => usePresence(options));

    act(() => {
      mockSocket._trigger('board:presence', members);
    });

    expect(result.current.onlineMembers).toEqual(members);
  });

  it('emits board:active on mount (resetIdleTimer)', () => {
    mockSocket.connected = true;
    renderHook(() => usePresence(options));

    expect(mockSocket.emit).toHaveBeenCalledWith('board:active', {
      householdId: 'h1',
      boardId: 'b1',
    });
  });

  it('emits board:idle after the idle timeout', () => {
    mockSocket.connected = true;
    renderHook(() => usePresence(options));

    // Clear calls from initial setup
    mockSocket.emit.mockClear();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('board:idle', {
      householdId: 'h1',
      boardId: 'b1',
    });
  });

  it('emits board:leave on cleanup', () => {
    const { unmount } = renderHook(() => usePresence(options));

    unmount();

    expect(mockSocket.emit).toHaveBeenCalledWith('board:leave', {
      householdId: 'h1',
      boardId: 'b1',
    });
  });

  it('throttles activity handler to once per second', () => {
    mockSocket.connected = true;
    renderHook(() => usePresence(options));

    // Clear initial calls
    mockSocket.emit.mockClear();

    // Simulate rapid mousemove events
    const mousemoveEvent = new Event('mousemove');

    act(() => {
      window.dispatchEvent(mousemoveEvent);
    });

    const callCountAfterFirst = mockSocket.emit.mock.calls.filter(
      (c) => c[0] === 'board:active'
    ).length;

    // Immediately fire another
    act(() => {
      window.dispatchEvent(mousemoveEvent);
    });

    const callCountAfterSecond = mockSocket.emit.mock.calls.filter(
      (c) => c[0] === 'board:active'
    ).length;

    // Should be throttled; second call should not increase the count
    expect(callCountAfterSecond).toBe(callCountAfterFirst);

    // Advance past throttle window
    act(() => {
      vi.advanceTimersByTime(1100);
      window.dispatchEvent(mousemoveEvent);
    });

    const callCountAfterThrottle = mockSocket.emit.mock.calls.filter(
      (c) => c[0] === 'board:active'
    ).length;

    expect(callCountAfterThrottle).toBeGreaterThan(callCountAfterSecond);
  });

  it('removes event listeners on cleanup', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => usePresence(options));

    const addedEvents = addSpy.mock.calls.map((c) => c[0]);
    expect(addedEvents).toContain('mousemove');
    expect(addedEvents).toContain('keydown');

    unmount();

    const removedEvents = removeSpy.mock.calls.map((c) => c[0]);
    expect(removedEvents).toContain('mousemove');
    expect(removedEvents).toContain('keydown');

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
