import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UndoToast } from '../UndoToast';

// Track mock store state so tests can modify it
const mockUndoState = {
  activeToast: null as { id: string; description: string; type: string; undoFn: () => Promise<void>; redoFn: () => Promise<void>; timestamp: number } | null,
  undo: vi.fn().mockResolvedValue(undefined),
  dismissToast: vi.fn(),
};

vi.mock('@/stores/undo-store', () => {
  const store = vi.fn(() => mockUndoState);
  // Attach getState for the keyboard shortcut handler
  store.getState = vi.fn(() => ({ redo: vi.fn() }));
  return { useUndoStore: store };
});

// Mock the UI package
vi.mock('@chorechamp/ui', () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    size?: string;
    className?: string;
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

describe('UndoToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUndoState.undo.mockResolvedValue(undefined);
    mockUndoState.activeToast = null;
  });

  it('renders nothing when there is no active toast', () => {
    const { container } = render(<UndoToast />);
    expect(screen.queryByTestId('undo-toast')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it('renders the toast with description when activeToast exists', () => {
    mockUndoState.activeToast = {
      id: 'undo-1',
      description: 'Chore moved to Done',
      type: 'move',
      undoFn: vi.fn(),
      redoFn: vi.fn(),
      timestamp: Date.now(),
    };

    render(<UndoToast />);

    expect(screen.getByTestId('undo-toast')).toBeInTheDocument();
    expect(screen.getByText('Chore moved to Done')).toBeInTheDocument();
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });

  it('calls undo when the Undo button is clicked', () => {
    mockUndoState.activeToast = {
      id: 'undo-1',
      description: 'Chore deleted',
      type: 'delete',
      undoFn: vi.fn(),
      redoFn: vi.fn(),
      timestamp: Date.now(),
    };

    render(<UndoToast />);

    fireEvent.click(screen.getByText('Undo'));
    expect(mockUndoState.undo).toHaveBeenCalled();
  });

  it('calls dismissToast when the dismiss button is clicked', () => {
    mockUndoState.activeToast = {
      id: 'undo-1',
      description: 'Chore archived',
      type: 'archive',
      undoFn: vi.fn(),
      redoFn: vi.fn(),
      timestamp: Date.now(),
    };

    render(<UndoToast />);

    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(mockUndoState.dismissToast).toHaveBeenCalled();
  });

  it('has role="status" and aria-live="polite" for accessibility', () => {
    mockUndoState.activeToast = {
      id: 'undo-1',
      description: 'Action completed',
      type: 'complete',
      undoFn: vi.fn(),
      redoFn: vi.fn(),
      timestamp: Date.now(),
    };

    render(<UndoToast />);

    const toast = screen.getByTestId('undo-toast');
    expect(toast).toHaveAttribute('role', 'status');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });
});
