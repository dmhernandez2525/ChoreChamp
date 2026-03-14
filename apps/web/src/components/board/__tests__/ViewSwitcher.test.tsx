import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewSwitcher } from '../ViewSwitcher';

// Mock board store
const mockBoardStore = {
  viewMode: 'dashboard' as string,
  setViewMode: vi.fn(),
};

vi.mock('@/stores/board-store', () => ({
  useBoardStore: vi.fn(() => mockBoardStore),
}));

vi.mock('@chorechamp/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

describe('ViewSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBoardStore.viewMode = 'dashboard';
  });

  it('renders the view switcher container', () => {
    render(<ViewSwitcher />);

    expect(screen.getByTestId('view-switcher')).toBeInTheDocument();
  });

  it('renders all four view buttons', () => {
    render(<ViewSwitcher />);

    expect(screen.getByTestId('view-switcher-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('view-switcher-kanban')).toBeInTheDocument();
    expect(screen.getByTestId('view-switcher-calendar')).toBeInTheDocument();
    expect(screen.getByTestId('view-switcher-list')).toBeInTheDocument();
  });

  it('renders aria labels for all view buttons', () => {
    render(<ViewSwitcher />);

    expect(screen.getByLabelText('Switch to Dashboard view')).toBeInTheDocument();
    expect(screen.getByLabelText('Switch to Board view')).toBeInTheDocument();
    expect(screen.getByLabelText('Switch to Calendar view')).toBeInTheDocument();
    expect(screen.getByLabelText('Switch to List view')).toBeInTheDocument();
  });

  it('marks the active view button with aria-pressed true', () => {
    mockBoardStore.viewMode = 'kanban';
    render(<ViewSwitcher />);

    expect(screen.getByTestId('view-switcher-kanban')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('view-switcher-dashboard')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('view-switcher-calendar')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('view-switcher-list')).toHaveAttribute('aria-pressed', 'false');
  });

  it('applies active styles to the current view', () => {
    mockBoardStore.viewMode = 'dashboard';
    render(<ViewSwitcher />);

    const dashboardBtn = screen.getByTestId('view-switcher-dashboard');
    expect(dashboardBtn.className).toContain('bg-violet-100');
    expect(dashboardBtn.className).toContain('text-violet-700');
  });

  it('applies inactive styles to non-current views', () => {
    mockBoardStore.viewMode = 'dashboard';
    render(<ViewSwitcher />);

    const kanbanBtn = screen.getByTestId('view-switcher-kanban');
    expect(kanbanBtn.className).toContain('text-gray-500');
  });

  it('calls setViewMode with kanban when Board button is clicked', async () => {
    const user = userEvent.setup();
    render(<ViewSwitcher />);

    await user.click(screen.getByTestId('view-switcher-kanban'));
    expect(mockBoardStore.setViewMode).toHaveBeenCalledWith('kanban');
  });

  it('calls setViewMode with calendar when Calendar button is clicked', async () => {
    const user = userEvent.setup();
    render(<ViewSwitcher />);

    await user.click(screen.getByTestId('view-switcher-calendar'));
    expect(mockBoardStore.setViewMode).toHaveBeenCalledWith('calendar');
  });

  it('calls setViewMode with list when List button is clicked', async () => {
    const user = userEvent.setup();
    render(<ViewSwitcher />);

    await user.click(screen.getByTestId('view-switcher-list'));
    expect(mockBoardStore.setViewMode).toHaveBeenCalledWith('list');
  });

  it('calls setViewMode with dashboard when Dashboard button is clicked', async () => {
    const user = userEvent.setup();
    mockBoardStore.viewMode = 'kanban';
    render(<ViewSwitcher />);

    await user.click(screen.getByTestId('view-switcher-dashboard'));
    expect(mockBoardStore.setViewMode).toHaveBeenCalledWith('dashboard');
  });
});
