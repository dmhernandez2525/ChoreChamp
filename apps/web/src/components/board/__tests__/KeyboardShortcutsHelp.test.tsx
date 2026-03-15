import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardShortcutsHelp } from '../KeyboardShortcutsHelp';

// Mock Radix Dialog to render inline
vi.mock('@radix-ui/react-dialog', () => {
  // Track open state externally for the mock
  let dialogOpen = false;
  let dialogOnOpenChange: ((open: boolean) => void) | null = null;

  return {
    Root: ({
      children,
      open,
      onOpenChange,
    }: {
      children: React.ReactNode;
      open: boolean;
      onOpenChange: (open: boolean) => void;
    }) => {
      dialogOpen = open;
      dialogOnOpenChange = onOpenChange;
      return <div>{children}</div>;
    },
    Portal: ({ children }: { children: React.ReactNode }) =>
      dialogOpen ? <div>{children}</div> : null,
    Overlay: (props: Record<string, unknown>) => <div data-testid="dialog-overlay" {...props} />,
    Content: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => (
      <div {...props}>{children}</div>
    ),
    Title: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => (
      <h2 {...props}>{children}</h2>
    ),
    Close: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => {
      if (asChild) {
        // Wrap children with onClick that calls onOpenChange(false)
        return (
          <span onClick={() => dialogOnOpenChange?.(false)}>{children}</span>
        );
      }
      return <button onClick={() => dialogOnOpenChange?.(false)}>{children}</button>;
    },
  };
});

vi.mock('lucide-react', () => ({
  X: (props: Record<string, unknown>) => <svg data-testid="x-icon" {...props} />,
  Keyboard: (props: Record<string, unknown>) => <svg data-testid="keyboard-icon" {...props} />,
}));

describe('KeyboardShortcutsHelp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not show dialog content initially', () => {
    render(<KeyboardShortcutsHelp />);
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('opens dialog when "?" key is pressed', () => {
    render(<KeyboardShortcutsHelp />);

    fireEvent.keyDown(document, { key: '?' });

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('opens dialog when Shift+/ is pressed', () => {
    render(<KeyboardShortcutsHelp />);

    fireEvent.keyDown(document, { key: '/', shiftKey: true });

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('does not open when typing "?" in an input field', () => {
    render(
      <div>
        <input data-testid="input-field" />
        <KeyboardShortcutsHelp />
      </div>,
    );

    const input = screen.getByTestId('input-field');
    fireEvent.keyDown(input, { key: '?' });

    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('does not open when typing "?" in a textarea', () => {
    render(
      <div>
        <textarea data-testid="textarea-field" />
        <KeyboardShortcutsHelp />
      </div>,
    );

    const textarea = screen.getByTestId('textarea-field');
    fireEvent.keyDown(textarea, { key: '?' });

    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('displays all shortcut group titles when open', () => {
    render(<KeyboardShortcutsHelp />);
    fireEvent.keyDown(document, { key: '?' });

    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Editing')).toBeInTheDocument();
    expect(screen.getByText('Board Navigation')).toBeInTheDocument();
    expect(screen.getByText('Selection')).toBeInTheDocument();
    expect(screen.getByText('List View')).toBeInTheDocument();
  });

  it('displays shortcut descriptions', () => {
    render(<KeyboardShortcutsHelp />);
    fireEvent.keyDown(document, { key: '?' });

    expect(screen.getByText('Open command palette')).toBeInTheDocument();
    expect(screen.getByText('Undo last action')).toBeInTheDocument();
    expect(screen.getByText('Move to next element')).toBeInTheDocument();
  });

  it('displays shortcut key labels in kbd elements', () => {
    render(<KeyboardShortcutsHelp />);
    fireEvent.keyDown(document, { key: '?' });

    // "?" appears twice: once in the shortcut list and once in the hint text
    expect(screen.getAllByText('?')).toHaveLength(2);
    // "Escape" and "Tab" appear in multiple shortcut groups
    expect(screen.getAllByText('Escape').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Tab').length).toBeGreaterThanOrEqual(1);
  });

  it('renders close button with aria-label', () => {
    render(<KeyboardShortcutsHelp />);
    fireEvent.keyDown(document, { key: '?' });

    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });

  it('toggles dialog closed when "?" is pressed again', () => {
    render(<KeyboardShortcutsHelp />);

    fireEvent.keyDown(document, { key: '?' });
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: '?' });
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('shows hint text about pressing "?" to toggle', () => {
    render(<KeyboardShortcutsHelp />);
    fireEvent.keyDown(document, { key: '?' });

    expect(screen.getByText(/Press/)).toBeInTheDocument();
    expect(screen.getByText(/to toggle this dialog/)).toBeInTheDocument();
  });
});
