import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardContextMenu } from '../CardContextMenu';

vi.mock('@chorechamp/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

describe('CardContextMenu', () => {
  const defaultProps = {
    choreId: 'chore-1',
    choreTitle: 'Test Chore',
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when position is null', () => {
    const { container } = render(
      <CardContextMenu {...defaultProps} position={null} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders at the given position', () => {
    render(
      <CardContextMenu
        {...defaultProps}
        position={{ x: 100, y: 200 }}
        onEdit={vi.fn()}
      />
    );

    const menu = screen.getByTestId('card-context-menu');
    expect(menu.style.left).toBe('100px');
    expect(menu.style.top).toBe('200px');
  });

  it('renders Edit action when onEdit is provided', () => {
    render(
      <CardContextMenu
        {...defaultProps}
        position={{ x: 0, y: 0 }}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('renders Mark Complete action when onComplete is provided', () => {
    render(
      <CardContextMenu
        {...defaultProps}
        position={{ x: 0, y: 0 }}
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByText('Mark Complete')).toBeInTheDocument();
  });

  it('renders Assign action when onAssign is provided', () => {
    render(
      <CardContextMenu
        {...defaultProps}
        position={{ x: 0, y: 0 }}
        onAssign={vi.fn()}
      />
    );

    expect(screen.getByText('Assign...')).toBeInTheDocument();
  });

  it('renders Delete action when onDelete is provided', () => {
    render(
      <CardContextMenu
        {...defaultProps}
        position={{ x: 0, y: 0 }}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders Duplicate action when onDuplicate is provided', () => {
    render(
      <CardContextMenu
        {...defaultProps}
        position={{ x: 0, y: 0 }}
        onDuplicate={vi.fn()}
      />
    );

    expect(screen.getByText('Duplicate')).toBeInTheDocument();
  });

  it('renders Priority action with submenu indicator when onChangePriority is provided', () => {
    render(
      <CardContextMenu
        {...defaultProps}
        position={{ x: 0, y: 0 }}
        onChangePriority={vi.fn()}
      />
    );

    expect(screen.getByText('Priority')).toBeInTheDocument();
  });

  it('does not render actions when handlers are not provided', () => {
    render(
      <CardContextMenu
        {...defaultProps}
        position={{ x: 0, y: 0 }}
      />
    );

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('calls onEdit with choreId when Edit is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <CardContextMenu
        {...defaultProps}
        position={{ x: 0, y: 0 }}
        onEdit={onEdit}
      />
    );

    await user.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith('chore-1');
  });

  it('calls onDelete with choreId when Delete is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <CardContextMenu
        {...defaultProps}
        position={{ x: 0, y: 0 }}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith('chore-1');
  });

  it('opens priority submenu when Priority is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CardContextMenu
        {...defaultProps}
        position={{ x: 0, y: 0 }}
        onChangePriority={vi.fn()}
      />
    );

    await user.click(screen.getByText('Priority'));

    // Submenu should show priority options
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('calls onChangePriority when a priority option is selected', async () => {
    const user = userEvent.setup();
    const onChangePriority = vi.fn();
    render(
      <CardContextMenu
        {...defaultProps}
        position={{ x: 0, y: 0 }}
        onChangePriority={onChangePriority}
      />
    );

    await user.click(screen.getByText('Priority'));
    await user.click(screen.getByText('Urgent'));

    expect(onChangePriority).toHaveBeenCalledWith('chore-1', 'urgent');
  });

  it('opens status submenu when Move to is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CardContextMenu
        {...defaultProps}
        position={{ x: 0, y: 0 }}
        onChangeStatus={vi.fn()}
      />
    );

    await user.click(screen.getByText('Move to...'));

    expect(screen.getByText('Not Started')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('goes back from submenu when Back is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CardContextMenu
        {...defaultProps}
        position={{ x: 0, y: 0 }}
        onChangePriority={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    await user.click(screen.getByText('Priority'));
    expect(screen.getByText('Urgent')).toBeInTheDocument();

    await user.click(screen.getByText('Back'));
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.queryByText('Urgent')).not.toBeInTheDocument();
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    render(
      <CardContextMenu
        {...defaultProps}
        position={{ x: 0, y: 0 }}
        onClose={onClose}
        onEdit={vi.fn()}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on outside click', () => {
    const onClose = vi.fn();
    render(
      <CardContextMenu
        {...defaultProps}
        position={{ x: 0, y: 0 }}
        onClose={onClose}
        onEdit={vi.fn()}
      />
    );

    fireEvent.click(document);
    expect(onClose).toHaveBeenCalled();
  });

  it('stops propagation on menu click to prevent closing', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <CardContextMenu
        {...defaultProps}
        position={{ x: 0, y: 0 }}
        onClose={onClose}
        onChangePriority={vi.fn()}
      />
    );

    // Clicking Priority opens submenu but should not close menu
    await user.click(screen.getByText('Priority'));
    // Menu should still be open (submenu visible)
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });
});
