import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InlineEditCell, InlineSelectCell } from '../InlineEditCell';

vi.mock('@chorechamp/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

describe('InlineEditCell', () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders value as a button when not editing', () => {
    render(<InlineEditCell value="Test Value" onSave={mockOnSave} />);

    expect(screen.getByRole('button', { name: 'Test Value' })).toBeInTheDocument();
  });

  it('renders placeholder when value is empty', () => {
    render(<InlineEditCell value="" onSave={mockOnSave} placeholder="Click to edit" />);

    expect(screen.getByText('Click to edit')).toBeInTheDocument();
  });

  it('renders default placeholder when no placeholder prop', () => {
    render(<InlineEditCell value="" onSave={mockOnSave} />);

    expect(screen.getByText('Click to edit')).toBeInTheDocument();
  });

  it('switches to input on click', () => {
    render(<InlineEditCell value="Test" onSave={mockOnSave} />);

    fireEvent.click(screen.getByRole('button'));

    const input = screen.getByDisplayValue('Test');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('uses the correct input type', () => {
    render(<InlineEditCell value="42" onSave={mockOnSave} type="number" />);

    fireEvent.click(screen.getByRole('button'));

    const input = screen.getByDisplayValue('42');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('calls onSave on blur when value changed', () => {
    render(<InlineEditCell value="Original" onSave={mockOnSave} />);

    fireEvent.click(screen.getByRole('button'));
    const input = screen.getByDisplayValue('Original');
    fireEvent.change(input, { target: { value: 'Updated' } });
    fireEvent.blur(input);

    expect(mockOnSave).toHaveBeenCalledWith('Updated');
  });

  it('does not call onSave on blur when value unchanged', () => {
    render(<InlineEditCell value="Same" onSave={mockOnSave} />);

    fireEvent.click(screen.getByRole('button'));
    const input = screen.getByDisplayValue('Same');
    fireEvent.blur(input);

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('calls onSave on Enter key when value changed', () => {
    render(<InlineEditCell value="Original" onSave={mockOnSave} />);

    fireEvent.click(screen.getByRole('button'));
    const input = screen.getByDisplayValue('Original');
    fireEvent.change(input, { target: { value: 'New' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnSave).toHaveBeenCalledWith('New');
  });

  it('reverts value and exits editing on Escape key', () => {
    render(<InlineEditCell value="Original" onSave={mockOnSave} />);

    fireEvent.click(screen.getByRole('button'));
    const input = screen.getByDisplayValue('Original');
    fireEvent.change(input, { target: { value: 'Changed' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    // Should be back to button mode with original value
    expect(screen.getByRole('button', { name: 'Original' })).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('calls onSave on Tab key when value changed', () => {
    render(<InlineEditCell value="Original" onSave={mockOnSave} />);

    fireEvent.click(screen.getByRole('button'));
    const input = screen.getByDisplayValue('Original');
    fireEvent.change(input, { target: { value: 'Tabbed' } });
    fireEvent.keyDown(input, { key: 'Tab' });

    expect(mockOnSave).toHaveBeenCalledWith('Tabbed');
  });

  it('applies custom className', () => {
    render(<InlineEditCell value="Test" onSave={mockOnSave} className="custom-class" />);

    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });

  it('has title attribute "Click to edit"', () => {
    render(<InlineEditCell value="Test" onSave={mockOnSave} />);

    expect(screen.getByTitle('Click to edit')).toBeInTheDocument();
  });

  it('syncs editValue when prop value changes', () => {
    const { rerender } = render(<InlineEditCell value="First" onSave={mockOnSave} />);

    rerender(<InlineEditCell value="Second" onSave={mockOnSave} />);

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByDisplayValue('Second')).toBeInTheDocument();
  });
});

describe('InlineSelectCell', () => {
  const mockOnSave = vi.fn();
  const options = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders current label as a button when not editing', () => {
    render(<InlineSelectCell value="medium" options={options} onSave={mockOnSave} />);

    expect(screen.getByRole('button', { name: 'Medium' })).toBeInTheDocument();
  });

  it('renders raw value if no matching option label', () => {
    render(<InlineSelectCell value="unknown" options={options} onSave={mockOnSave} />);

    expect(screen.getByRole('button', { name: 'unknown' })).toBeInTheDocument();
  });

  it('switches to select on click', () => {
    render(<InlineSelectCell value="low" options={options} onSave={mockOnSave} />);

    fireEvent.click(screen.getByRole('button'));

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('low');
  });

  it('renders all options in the select', () => {
    render(<InlineSelectCell value="low" options={options} onSave={mockOnSave} />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('option', { name: 'Low' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Medium' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'High' })).toBeInTheDocument();
  });

  it('calls onSave when selection changes to a different value', () => {
    render(<InlineSelectCell value="low" options={options} onSave={mockOnSave} />);

    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'high' } });

    expect(mockOnSave).toHaveBeenCalledWith('high');
  });

  it('does not call onSave when same value is selected', () => {
    render(<InlineSelectCell value="low" options={options} onSave={mockOnSave} />);

    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'low' } });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('exits editing on blur', () => {
    render(<InlineSelectCell value="medium" options={options} onSave={mockOnSave} />);

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('combobox')).toBeInTheDocument();

    fireEvent.blur(screen.getByRole('combobox'));
    expect(screen.getByRole('button', { name: 'Medium' })).toBeInTheDocument();
  });

  it('has title attribute "Click to change"', () => {
    render(<InlineSelectCell value="low" options={options} onSave={mockOnSave} />);

    expect(screen.getByTitle('Click to change')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<InlineSelectCell value="low" options={options} onSave={mockOnSave} className="my-class" />);

    const button = screen.getByRole('button');
    expect(button.className).toContain('my-class');
  });
});
