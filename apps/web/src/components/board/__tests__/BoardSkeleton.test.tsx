import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  KanbanSkeleton,
  CalendarSkeleton,
  ListSkeleton,
  BoardHeaderSkeleton,
} from '../BoardSkeleton';

// Mock the UI package
vi.mock('@chorechamp/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

describe('KanbanSkeleton', () => {
  it('renders the skeleton container with data-testid', () => {
    render(<KanbanSkeleton />);
    expect(screen.getByTestId('kanban-skeleton')).toBeInTheDocument();
  });

  it('renders exactly 4 columns', () => {
    render(<KanbanSkeleton />);
    const skeleton = screen.getByTestId('kanban-skeleton');
    // Each column has the shrink-0 class
    const columns = skeleton.querySelectorAll('.shrink-0');
    expect(columns).toHaveLength(4);
  });

  it('renders 3 card placeholders per column', () => {
    render(<KanbanSkeleton />);
    const skeleton = screen.getByTestId('kanban-skeleton');
    const columns = skeleton.querySelectorAll('.shrink-0');
    columns.forEach((col) => {
      // Each card has border + shadow-sm
      const cards = col.querySelectorAll('.shadow-sm');
      expect(cards).toHaveLength(3);
    });
  });
});

describe('CalendarSkeleton', () => {
  it('renders the skeleton container with data-testid', () => {
    render(<CalendarSkeleton />);
    expect(screen.getByTestId('calendar-skeleton')).toBeInTheDocument();
  });

  it('renders 7 day-of-week header labels', () => {
    render(<CalendarSkeleton />);
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('renders a 5x7 grid of 35 day cells', () => {
    render(<CalendarSkeleton />);
    const skeleton = screen.getByTestId('calendar-skeleton');
    // The grid is the second child (after the header row)
    const grids = skeleton.querySelectorAll('.grid.grid-cols-7');
    // Second grid is the day cells grid
    const dayCellsGrid = grids[1];
    const cells = dayCellsGrid.querySelectorAll(':scope > div');
    expect(cells).toHaveLength(35);
  });
});

describe('ListSkeleton', () => {
  it('renders the skeleton container with data-testid', () => {
    render(<ListSkeleton />);
    expect(screen.getByTestId('list-skeleton')).toBeInTheDocument();
  });

  it('renders a table header row', () => {
    render(<ListSkeleton />);
    const skeleton = screen.getByTestId('list-skeleton');
    const header = skeleton.querySelector('.bg-gray-50');
    expect(header).toBeInTheDocument();
  });

  it('renders 8 table rows', () => {
    render(<ListSkeleton />);
    const skeleton = screen.getByTestId('list-skeleton');
    // Rows are direct children with border-b, excluding the header
    const rows = skeleton.querySelectorAll(':scope > div:not(.bg-gray-50)');
    expect(rows).toHaveLength(8);
  });
});

describe('BoardHeaderSkeleton', () => {
  it('renders the skeleton container with data-testid', () => {
    render(<BoardHeaderSkeleton />);
    expect(screen.getByTestId('board-header-skeleton')).toBeInTheDocument();
  });

  it('renders multiple placeholder elements', () => {
    render(<BoardHeaderSkeleton />);
    const skeleton = screen.getByTestId('board-header-skeleton');
    // Should have title, spacer, search bar, and action buttons as children
    const placeholders = skeleton.querySelectorAll('.animate-pulse');
    // Title + search bar + 3 action buttons = 5 pulse elements
    expect(placeholders.length).toBeGreaterThanOrEqual(4);
  });
});
