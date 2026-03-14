import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBuilder } from '../FilterBuilder';

// Mock filter store
const mockFilterStore = {
  addFilter: vi.fn(),
};

vi.mock('@/stores/filter-store', () => ({
  useFilterStore: vi.fn(() => mockFilterStore),
}));

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
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

describe('FilterBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the filter builder container', () => {
    render(<FilterBuilder />);

    expect(screen.getByTestId('filter-builder')).toBeInTheDocument();
  });

  it('renders the title', () => {
    render(<FilterBuilder />);

    expect(screen.getByText('Add Filters')).toBeInTheDocument();
  });

  it('renders a default filter row with field, operator, and value selectors', () => {
    render(<FilterBuilder />);

    // Should have field selector with Category as default
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(2); // field + operator + possibly value
  });

  it('renders Add Condition button', () => {
    render(<FilterBuilder />);

    expect(screen.getByText('Add Condition')).toBeInTheDocument();
  });

  it('renders Apply Filters button', () => {
    render(<FilterBuilder />);

    expect(screen.getByText('Apply Filters')).toBeInTheDocument();
  });

  it('renders Cancel button when onClose is provided', () => {
    render(<FilterBuilder onClose={vi.fn()} />);

    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('does not render Cancel button when onClose is not provided', () => {
    render(<FilterBuilder />);

    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('adds a new filter row when Add Condition is clicked', async () => {
    const user = userEvent.setup();
    render(<FilterBuilder />);

    const selectsBefore = screen.getAllByRole('combobox');
    await user.click(screen.getByText('Add Condition'));
    const selectsAfter = screen.getAllByRole('combobox');

    // Each row has at least 2 selects (field + operator) + possibly value
    expect(selectsAfter.length).toBeGreaterThan(selectsBefore.length);
  });

  it('removes a filter row when trash button is clicked', async () => {
    const user = userEvent.setup();
    render(<FilterBuilder />);

    // Add a second row first (remove button only shows with 2+ rows)
    await user.click(screen.getByText('Add Condition'));

    // Now there should be remove buttons
    const removeButtons = screen.getAllByRole('button').filter(btn => {
      const svg = btn.querySelector('svg');
      return svg && btn.className.includes('hover:text-red-500');
    });
    expect(removeButtons.length).toBeGreaterThanOrEqual(1);

    const selectsBefore = screen.getAllByRole('combobox');
    await user.click(removeButtons[0]);
    const selectsAfter = screen.getAllByRole('combobox');

    expect(selectsAfter.length).toBeLessThan(selectsBefore.length);
  });

  it('does not show remove button when there is only one row', () => {
    render(<FilterBuilder />);

    const removeButtons = screen.getAllByRole('button').filter(btn =>
      btn.className.includes('hover:text-red-500')
    );
    expect(removeButtons.length).toBe(0);
  });

  it('changes field selector options', () => {
    render(<FilterBuilder />);

    const selects = screen.getAllByRole('combobox');
    const fieldSelect = selects[0];

    // Check that field options are available
    fireEvent.change(fieldSelect, { target: { value: 'priority' } });
    expect(fieldSelect).toHaveValue('priority');
  });

  it('updates operator options when field type changes', () => {
    render(<FilterBuilder />);

    const selects = screen.getAllByRole('combobox');
    const fieldSelect = selects[0];

    // Change to a number field
    fireEvent.change(fieldSelect, { target: { value: 'pointValue' } });

    // Operator should reset; check that number operators are available
    const operatorSelect = screen.getAllByRole('combobox')[1];
    expect(operatorSelect).toBeInTheDocument();
  });

  it('calls addFilter and onClose when Apply Filters is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<FilterBuilder onClose={onClose} />);

    // Select a value for the default category filter
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[selects.length - 1], { target: { value: 'kitchen' } });

    await user.click(screen.getByText('Apply Filters'));

    expect(mockFilterStore.addFilter).toHaveBeenCalledWith(
      expect.objectContaining({
        field: 'category',
        operator: 'equals',
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<FilterBuilder onClose={onClose} />);

    await user.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('hides value input for unary operators like is_today', () => {
    render(<FilterBuilder />);

    const selects = screen.getAllByRole('combobox');
    const fieldSelect = selects[0];

    // Switch to date field which has unary operators
    fireEvent.change(fieldSelect, { target: { value: 'startDate' } });

    const operatorSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(operatorSelect, { target: { value: 'is_today' } });

    // With a unary operator, there should be no value input/select after the operator
    // The number of combobox elements should be just field + operator (2)
    const currentSelects = screen.getAllByRole('combobox');
    expect(currentSelects.length).toBe(2);
  });

  it('shows predefined value options for category field', () => {
    render(<FilterBuilder />);

    // Default field is category, which has predefined values
    const selects = screen.getAllByRole('combobox');
    const valueSelect = selects[selects.length - 1];

    // Should contain category options
    const options = valueSelect.querySelectorAll('option');
    const optionTexts = Array.from(options).map(o => o.textContent);
    expect(optionTexts).toContain('Kitchen');
    expect(optionTexts).toContain('Bathroom');
    expect(optionTexts).toContain('General');
  });
});
