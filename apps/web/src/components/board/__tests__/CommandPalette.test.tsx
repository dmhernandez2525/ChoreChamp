import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandPalette } from '../CommandPalette';
import type { Chore } from '@chorechamp/types';

const mockSetViewMode = vi.fn();

vi.mock('@/stores/board-store', () => ({
  useBoardStore: vi.fn(() => ({
    setViewMode: mockSetViewMode,
  })),
}));

function createMockChore(overrides: Partial<Chore> = {}): Chore {
  return {
    id: `chore-${Math.random().toString(36).slice(2, 8)}`,
    householdId: 'household-1',
    title: 'Test Chore',
    description: null,
    icon: '🧹',
    category: 'general',
    pointValue: 10,
    difficulty: 'medium',
    assignedTo: [],
    assignmentType: 'anyone',
    rotationIndex: 0,
    recurrenceType: 'once',
    recurrenceDays: null,
    recurrenceInterval: null,
    recurrenceAfterDays: null,
    startDate: '2026-03-14',
    endDate: null,
    dueTime: null,
    timeWindowMinutes: null,
    requiresApproval: false,
    requiresPhoto: false,
    estimatedMinutes: null,
    priority: 'medium',
    boardOrder: 0,
    showTimer: false,
    steps: null,
    createdBy: 'user-1',
    isActive: true,
    templateId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function openPalette() {
  // Simulate Cmd+K keydown
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        bubbles: true,
      })
    );
  });
}

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is hidden by default (no DOM output)', () => {
    render(<CommandPalette />);
    expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument();
  });

  it('opens when Cmd+K is pressed', () => {
    render(<CommandPalette />);

    openPalette();

    expect(screen.getByTestId('command-palette')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/search chores, navigate, or run a command/i)
    ).toBeInTheDocument();
  });

  it('opens when Ctrl+K is pressed', () => {
    render(<CommandPalette />);

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'k',
          ctrlKey: true,
          bubbles: true,
        })
      );
    });

    expect(screen.getByTestId('command-palette')).toBeInTheDocument();
  });

  it('closes when Cmd+K is pressed again (toggle)', () => {
    render(<CommandPalette />);

    openPalette();
    expect(screen.getByTestId('command-palette')).toBeInTheDocument();

    openPalette();
    expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument();
  });

  it('closes when clicking the backdrop', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    openPalette();
    expect(screen.getByTestId('command-palette')).toBeInTheDocument();

    // Click the backdrop (first child of the command-palette container)
    const backdrop = screen.getByTestId('command-palette').querySelector('.bg-black\\/50');
    expect(backdrop).toBeTruthy();
    await user.click(backdrop!);

    expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument();
  });

  it('shows "Create New Chore" action when onCreateChore is provided', () => {
    render(<CommandPalette onCreateChore={vi.fn()} />);
    openPalette();

    expect(screen.getByText('Create New Chore')).toBeInTheDocument();
  });

  it('does not show "Create New Chore" when onCreateChore is not provided', () => {
    render(<CommandPalette />);
    openPalette();

    expect(screen.queryByText('Create New Chore')).not.toBeInTheDocument();
  });

  it('shows view switching options', () => {
    render(<CommandPalette />);
    openPalette();

    expect(screen.getByText('Dashboard View')).toBeInTheDocument();
    expect(screen.getByText('Kanban Board')).toBeInTheDocument();
    expect(screen.getByText('Calendar View')).toBeInTheDocument();
    expect(screen.getByText('List View')).toBeInTheDocument();
  });

  it('shows navigation options', () => {
    render(<CommandPalette />);
    openPalette();

    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Go to Members')).toBeInTheDocument();
    expect(screen.getByText('Go to Rewards')).toBeInTheDocument();
    expect(screen.getByText('Go to Settings')).toBeInTheDocument();
  });

  it('shows chore search results when chores are passed', () => {
    const chores = [
      createMockChore({ id: 'c1', title: 'Wash Dishes', category: 'kitchen', pointValue: 15 }),
      createMockChore({ id: 'c2', title: 'Vacuum Floor', category: 'living_room', pointValue: 20 }),
    ];

    render(<CommandPalette chores={chores} />);
    openPalette();

    expect(screen.getByText('Wash Dishes')).toBeInTheDocument();
    expect(screen.getByText('Vacuum Floor')).toBeInTheDocument();
  });

  it('limits chore results to 10 items', () => {
    const chores = Array.from({ length: 15 }, (_, i) =>
      createMockChore({ id: `c${i}`, title: `Chore ${i}`, boardOrder: i })
    );

    render(<CommandPalette chores={chores} />);
    openPalette();

    // Only the first 10 should appear
    expect(screen.getByText('Chore 0')).toBeInTheDocument();
    expect(screen.getByText('Chore 9')).toBeInTheDocument();
    expect(screen.queryByText('Chore 10')).not.toBeInTheDocument();
  });

  it('calls onCreateChore and closes palette on action select', async () => {
    const user = userEvent.setup();
    const onCreateChore = vi.fn();

    render(<CommandPalette onCreateChore={onCreateChore} />);
    openPalette();

    // cmdk items use aria-selected, click the item
    const createItem = screen.getByText('Create New Chore');
    await user.click(createItem);

    expect(onCreateChore).toHaveBeenCalled();
    // Palette should close after action
    expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument();
  });

  it('calls onNavigate with correct path when a navigation item is selected', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<CommandPalette onNavigate={onNavigate} />);
    openPalette();

    await user.click(screen.getByText('Go to Rewards'));

    expect(onNavigate).toHaveBeenCalledWith('/rewards');
    expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument();
  });

  it('calls setViewMode when a view option is selected', async () => {
    const user = userEvent.setup();

    render(<CommandPalette />);
    openPalette();

    await user.click(screen.getByText('Kanban Board'));

    expect(mockSetViewMode).toHaveBeenCalledWith('kanban');
  });

  it('calls onChoreClick with the chore id when a chore result is selected', async () => {
    const user = userEvent.setup();
    const onChoreClick = vi.fn();
    const chores = [
      createMockChore({ id: 'chore-abc', title: 'Mop Kitchen' }),
    ];

    render(<CommandPalette chores={chores} onChoreClick={onChoreClick} />);
    openPalette();

    await user.click(screen.getByText('Mop Kitchen'));

    expect(onChoreClick).toHaveBeenCalledWith('chore-abc');
  });

  it('cleans up keyboard listener on unmount', () => {
    const removeEventSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = render(<CommandPalette />);

    unmount();

    expect(removeEventSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeEventSpy.mockRestore();
  });
});
