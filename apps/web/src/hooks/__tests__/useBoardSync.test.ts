import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBoardSync } from '../useBoardSync';

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

const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined);

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

describe('useBoardSync', () => {
  const options = { householdId: 'h1' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = false;
    for (const key of Object.keys(mockSocket._listeners)) {
      delete mockSocket._listeners[key];
    }
  });

  it('returns initial disconnected state', () => {
    const { result } = renderHook(() => useBoardSync(options));

    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastSyncAt).toBeNull();
  });

  it('sets isConnected to true on connect and joins household', () => {
    const { result } = renderHook(() => useBoardSync(options));

    act(() => {
      mockSocket._trigger('connect');
    });

    expect(result.current.isConnected).toBe(true);
    expect(mockSocket.emit).toHaveBeenCalledWith('join:household', 'h1');
  });

  it('sets isConnected to false on disconnect', () => {
    const { result } = renderHook(() => useBoardSync(options));

    act(() => {
      mockSocket._trigger('connect');
    });

    act(() => {
      mockSocket._trigger('disconnect');
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('sets isConnected to false on connect_error', () => {
    const { result } = renderHook(() => useBoardSync(options));

    act(() => {
      mockSocket._trigger('connect_error', new Error('connection failed'));
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('joins household immediately when socket is already connected', () => {
    mockSocket.connected = true;
    const { result } = renderHook(() => useBoardSync(options));

    expect(result.current.isConnected).toBe(true);
    expect(mockSocket.emit).toHaveBeenCalledWith('join:household', 'h1');
  });

  describe('chore events invalidate cache', () => {
    const choreEvents = [
      'chore:created',
      'chore:updated',
      'chore:deleted',
      'chore:completed',
      'chore:reordered',
    ];

    for (const event of choreEvents) {
      it(`invalidates queries on ${event}`, () => {
        const { result } = renderHook(() => useBoardSync(options));

        act(() => {
          mockSocket._trigger(event);
        });

        expect(mockInvalidateQueries).toHaveBeenCalledWith({
          queryKey: ['chores', 'h1'],
        });
        expect(mockInvalidateQueries).toHaveBeenCalledWith({
          queryKey: ['board', 'h1'],
        });
        expect(result.current.lastSyncAt).not.toBeNull();
      });
    }
  });

  it('updates lastSyncAt timestamp on invalidation', () => {
    const before = new Date();
    const { result } = renderHook(() => useBoardSync(options));

    act(() => {
      mockSocket._trigger('chore:created');
    });

    expect(result.current.lastSyncAt).not.toBeNull();
    expect(result.current.lastSyncAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('cleans up socket listeners and leaves household on unmount', () => {
    const { unmount } = renderHook(() => useBoardSync(options));

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('chore:created', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('chore:updated', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('chore:deleted', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('chore:completed', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('chore:reordered', expect.any(Function));
    expect(mockSocket.emit).toHaveBeenCalledWith('leave:household', 'h1');
  });
});
