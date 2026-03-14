import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagPicker, TagBadge } from '../TagPicker';

// Mock the UI package
vi.mock('@chorechamp/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

const mockTags = [
  { id: 'tag-1', name: 'Cleaning', color: '#3b82f6' },
  { id: 'tag-2', name: 'Cooking', color: '#ef4444' },
  { id: 'tag-3', name: 'Outdoor', color: '#22c55e' },
];

describe('TagPicker', () => {
  const defaultProps = {
    availableTags: mockTags,
    selectedTags: [] as typeof mockTags,
    onAddTag: vi.fn(),
    onRemoveTag: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders selected tags with their names', () => {
    render(
      <TagPicker
        {...defaultProps}
        selectedTags={[mockTags[0], mockTags[1]]}
      />
    );

    expect(screen.getByText('Cleaning')).toBeInTheDocument();
    expect(screen.getByText('Cooking')).toBeInTheDocument();
  });

  it('renders an Add Tag button', () => {
    render(<TagPicker {...defaultProps} />);

    expect(screen.getByText('Add Tag')).toBeInTheDocument();
  });

  it('opens the dropdown when Add Tag is clicked', async () => {
    const user = userEvent.setup();
    render(<TagPicker {...defaultProps} />);

    await user.click(screen.getByText('Add Tag'));

    expect(screen.getByPlaceholderText('Search or create...')).toBeInTheDocument();
  });

  it('shows available (unselected) tags in the dropdown', async () => {
    const user = userEvent.setup();
    render(
      <TagPicker
        {...defaultProps}
        selectedTags={[mockTags[0]]}
      />
    );

    await user.click(screen.getByText('Add Tag'));

    // Already selected tag should NOT appear in the dropdown
    // The tag name "Cleaning" still appears as a selected chip, but not in the dropdown list
    expect(screen.getByText('Cooking')).toBeInTheDocument();
    expect(screen.getByText('Outdoor')).toBeInTheDocument();
  });

  it('filters tags when typing in the search input', async () => {
    const user = userEvent.setup();
    render(<TagPicker {...defaultProps} />);

    await user.click(screen.getByText('Add Tag'));
    const searchInput = screen.getByPlaceholderText('Search or create...');
    await user.type(searchInput, 'cook');

    expect(screen.getByText('Cooking')).toBeInTheDocument();
    expect(screen.queryByText('Outdoor')).not.toBeInTheDocument();
  });

  it('calls onRemoveTag when the remove button on a selected tag is clicked', async () => {
    const user = userEvent.setup();
    const onRemoveTag = vi.fn();

    render(
      <TagPicker
        {...defaultProps}
        selectedTags={[mockTags[0]]}
        onRemoveTag={onRemoveTag}
      />
    );

    const removeButton = screen.getByLabelText('Remove Cleaning');
    await user.click(removeButton);

    expect(onRemoveTag).toHaveBeenCalledWith('tag-1');
  });

  it('calls onAddTag when a tag in the dropdown is clicked', async () => {
    const user = userEvent.setup();
    const onAddTag = vi.fn();

    render(<TagPicker {...defaultProps} onAddTag={onAddTag} />);

    await user.click(screen.getByText('Add Tag'));
    await user.click(screen.getByText('Cooking'));

    expect(onAddTag).toHaveBeenCalledWith('tag-2');
  });

  it('shows "No tags found" when search has no matches and no create option', async () => {
    const user = userEvent.setup();
    render(<TagPicker {...defaultProps} />);

    await user.click(screen.getByText('Add Tag'));
    const searchInput = screen.getByPlaceholderText('Search or create...');
    await user.type(searchInput, 'zzzzz');

    // Without onCreateTag, just shows "No tags found"
    expect(screen.getByText('No tags found')).toBeInTheDocument();
  });

  it('shows create option when search does not match any existing tag and onCreateTag is provided', async () => {
    const user = userEvent.setup();
    render(
      <TagPicker {...defaultProps} onCreateTag={vi.fn()} />
    );

    await user.click(screen.getByText('Add Tag'));
    const searchInput = screen.getByPlaceholderText('Search or create...');
    await user.type(searchInput, 'Garden');

    expect(screen.getByText(/Create "Garden"/)).toBeInTheDocument();
    expect(screen.getByText('Create tag')).toBeInTheDocument();
  });
});

describe('TagBadge', () => {
  it('renders the tag name with the specified color', () => {
    render(<TagBadge name="Cleaning" color="#3b82f6" />);

    const badge = screen.getByText('Cleaning');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('span')).toHaveStyle({ backgroundColor: '#3b82f6' });
  });

  it('renders in small size by default', () => {
    render(<TagBadge name="Test" color="#ef4444" />);

    const badge = screen.getByText('Test').closest('span');
    expect(badge?.className).toContain('text-[10px]');
  });

  it('renders in medium size when specified', () => {
    render(<TagBadge name="Test" color="#ef4444" size="md" />);

    const badge = screen.getByText('Test').closest('span');
    expect(badge?.className).toContain('text-xs');
  });

  it('renders a remove button when onRemove is provided', () => {
    render(<TagBadge name="Removable" color="#22c55e" onRemove={vi.fn()} />);

    expect(screen.getByLabelText('Remove Removable')).toBeInTheDocument();
  });

  it('does not render a remove button when onRemove is not provided', () => {
    render(<TagBadge name="Static" color="#22c55e" />);

    expect(screen.queryByLabelText('Remove Static')).not.toBeInTheDocument();
  });

  it('calls onRemove when the remove button is clicked', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    render(<TagBadge name="Deletable" color="#ef4444" onRemove={onRemove} />);

    await user.click(screen.getByLabelText('Remove Deletable'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
