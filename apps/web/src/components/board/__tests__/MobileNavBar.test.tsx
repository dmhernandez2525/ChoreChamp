import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileNavBar } from '../MobileNavBar';

vi.mock('@chorechamp/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

vi.mock('lucide-react', () => ({
  LayoutGrid: ({ className }: { className?: string }) => <svg data-testid="layout-grid-icon" className={className} />,
  Calendar: ({ className }: { className?: string }) => <svg data-testid="calendar-icon" className={className} />,
  Filter: ({ className }: { className?: string }) => <svg data-testid="filter-icon" className={className} />,
  Plus: ({ className }: { className?: string }) => <svg data-testid="plus-icon" className={className} />,
  MoreHorizontal: ({ className }: { className?: string }) => <svg data-testid="more-icon" className={className} />,
}));

describe('MobileNavBar', () => {
  const mockOnViewChange = vi.fn();
  const mockOnShowFilters = vi.fn();
  const mockOnCreateChore = vi.fn();
  const mockOnShowMore = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all five tab buttons', () => {
    render(<MobileNavBar />);

    expect(screen.getByLabelText('Board')).toBeInTheDocument();
    expect(screen.getByLabelText('Calendar')).toBeInTheDocument();
    expect(screen.getByLabelText('Add')).toBeInTheDocument();
    expect(screen.getByLabelText('Filters')).toBeInTheDocument();
    expect(screen.getByLabelText('More')).toBeInTheDocument();
  });

  it('renders the navigation element with correct aria-label', () => {
    render(<MobileNavBar />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Mobile navigation');
  });

  it('marks the default active tab (board) with aria-current', () => {
    render(<MobileNavBar />);

    const boardBtn = screen.getByLabelText('Board');
    expect(boardBtn).toHaveAttribute('aria-current', 'page');
  });

  it('marks the specified active tab with aria-current', () => {
    render(<MobileNavBar activeTab="calendar" />);

    const calendarBtn = screen.getByLabelText('Calendar');
    expect(calendarBtn).toHaveAttribute('aria-current', 'page');

    const boardBtn = screen.getByLabelText('Board');
    expect(boardBtn).not.toHaveAttribute('aria-current');
  });

  it('calls onViewChange with board when Board is clicked', () => {
    render(<MobileNavBar onViewChange={mockOnViewChange} />);

    fireEvent.click(screen.getByLabelText('Board'));
    expect(mockOnViewChange).toHaveBeenCalledWith('board');
  });

  it('calls onViewChange with calendar when Calendar is clicked', () => {
    render(<MobileNavBar onViewChange={mockOnViewChange} />);

    fireEvent.click(screen.getByLabelText('Calendar'));
    expect(mockOnViewChange).toHaveBeenCalledWith('calendar');
  });

  it('calls onShowFilters when Filters is clicked', () => {
    render(<MobileNavBar onShowFilters={mockOnShowFilters} />);

    fireEvent.click(screen.getByLabelText('Filters'));
    expect(mockOnShowFilters).toHaveBeenCalledTimes(1);
  });

  it('calls onCreateChore when Add is clicked', () => {
    render(<MobileNavBar onCreateChore={mockOnCreateChore} />);

    fireEvent.click(screen.getByLabelText('Add'));
    expect(mockOnCreateChore).toHaveBeenCalledTimes(1);
  });

  it('calls onShowMore when More is clicked', () => {
    render(<MobileNavBar onShowMore={mockOnShowMore} />);

    fireEvent.click(screen.getByLabelText('More'));
    expect(mockOnShowMore).toHaveBeenCalledTimes(1);
  });

  it('renders tab labels as text', () => {
    render(<MobileNavBar />);

    expect(screen.getByText('Board')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('does not crash when callbacks are not provided', () => {
    render(<MobileNavBar />);

    // Should not throw when clicked without handlers
    fireEvent.click(screen.getByLabelText('Board'));
    fireEvent.click(screen.getByLabelText('Calendar'));
    fireEvent.click(screen.getByLabelText('Add'));
    fireEvent.click(screen.getByLabelText('Filters'));
    fireEvent.click(screen.getByLabelText('More'));
  });

  it('applies active styles to the current tab', () => {
    render(<MobileNavBar activeTab="filters" />);

    const filtersBtn = screen.getByLabelText('Filters');
    expect(filtersBtn.className).toContain('text-violet-600');
  });

  it('applies inactive styles to non-active tabs', () => {
    render(<MobileNavBar activeTab="board" />);

    const filtersBtn = screen.getByLabelText('Filters');
    expect(filtersBtn.className).toContain('text-gray-500');
  });
});
