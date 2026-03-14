import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  NoChoresEmpty,
  NoFilterResultsEmpty,
  NoSearchResultsEmpty,
  EmptyColumn,
} from '../EmptyStates';

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
    className?: string;
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

describe('NoChoresEmpty', () => {
  it('renders the empty state message', () => {
    render(<NoChoresEmpty />);

    expect(screen.getByTestId('empty-no-chores')).toBeInTheDocument();
    expect(screen.getByText('No chores yet')).toBeInTheDocument();
  });

  it('renders the Create First Chore button when onCreateChore is provided', () => {
    const onCreateChore = vi.fn();
    render(<NoChoresEmpty onCreateChore={onCreateChore} />);

    expect(screen.getByText('Create First Chore')).toBeInTheDocument();
  });

  it('does not render a create button when onCreateChore is not provided', () => {
    render(<NoChoresEmpty />);

    expect(screen.queryByText('Create First Chore')).not.toBeInTheDocument();
  });

  it('calls onCreateChore when the create button is clicked', async () => {
    const user = userEvent.setup();
    const onCreateChore = vi.fn();

    render(<NoChoresEmpty onCreateChore={onCreateChore} />);

    await user.click(screen.getByText('Create First Chore'));
    expect(onCreateChore).toHaveBeenCalledTimes(1);
  });
});

describe('NoFilterResultsEmpty', () => {
  it('renders the filter empty state message', () => {
    render(<NoFilterResultsEmpty />);

    expect(screen.getByTestId('empty-no-filter-results')).toBeInTheDocument();
    expect(screen.getByText('No chores match your filters')).toBeInTheDocument();
  });

  it('renders the Clear Filters button when onClearFilters is provided', () => {
    render(<NoFilterResultsEmpty onClearFilters={vi.fn()} />);

    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });

  it('does not render the clear button when onClearFilters is not provided', () => {
    render(<NoFilterResultsEmpty />);

    expect(screen.queryByText('Clear Filters')).not.toBeInTheDocument();
  });

  it('calls onClearFilters when the clear button is clicked', async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();

    render(<NoFilterResultsEmpty onClearFilters={onClearFilters} />);

    await user.click(screen.getByText('Clear Filters'));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });
});

describe('NoSearchResultsEmpty', () => {
  it('renders the search empty state with the query text', () => {
    render(<NoSearchResultsEmpty query="vacuum" />);

    expect(screen.getByTestId('empty-no-search-results')).toBeInTheDocument();
    // The query is wrapped in curly quotes by &ldquo; and &rdquo;
    expect(screen.getByText(/vacuum/)).toBeInTheDocument();
  });

  it('renders helpful suggestion text', () => {
    render(<NoSearchResultsEmpty query="mop" />);

    expect(
      screen.getByText('Try searching with different keywords or check for typos.')
    ).toBeInTheDocument();
  });

  it('displays different query strings correctly', () => {
    const { rerender } = render(<NoSearchResultsEmpty query="dishes" />);
    expect(screen.getByText(/dishes/)).toBeInTheDocument();

    rerender(<NoSearchResultsEmpty query="laundry basket" />);
    expect(screen.getByText(/laundry basket/)).toBeInTheDocument();
  });
});

describe('EmptyColumn', () => {
  it('renders minimal content with the data-testid', () => {
    render(<EmptyColumn />);

    expect(screen.getByTestId('empty-column')).toBeInTheDocument();
    expect(screen.getByText('No chores')).toBeInTheDocument();
  });

  it('includes the column name in the message when provided', () => {
    render(<EmptyColumn columnName="Urgent" />);

    expect(screen.getByText('No chores in Urgent')).toBeInTheDocument();
  });

  it('renders the add chore link when onAddChore is provided', () => {
    render(<EmptyColumn onAddChore={vi.fn()} />);

    expect(screen.getByText('+ Add a chore')).toBeInTheDocument();
  });

  it('calls onAddChore when the add link is clicked', async () => {
    const user = userEvent.setup();
    const onAddChore = vi.fn();

    render(<EmptyColumn onAddChore={onAddChore} />);

    await user.click(screen.getByText('+ Add a chore'));
    expect(onAddChore).toHaveBeenCalledTimes(1);
  });

  it('does not render the add chore link when onAddChore is not provided', () => {
    render(<EmptyColumn />);

    expect(screen.queryByText('+ Add a chore')).not.toBeInTheDocument();
  });
});
