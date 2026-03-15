import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileBottomSheet } from '../MobileBottomSheet';

vi.mock('@chorechamp/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

vi.mock('lucide-react', () => ({
  X: ({ className }: { className?: string }) => (
    <svg data-testid="x-icon" className={className} />
  ),
}));

describe('MobileBottomSheet', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    children: <div>Sheet content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  it('renders children when open', () => {
    render(<MobileBottomSheet {...defaultProps} />);

    expect(screen.getByText('Sheet content')).toBeInTheDocument();
  });

  it('renders nothing when not visible (open=false and animation complete)', () => {
    const { container } = render(
      <MobileBottomSheet {...defaultProps} open={false} />,
    );

    // Initially not visible since open starts as false
    // The component returns null when isVisible is false
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('renders a dialog with aria-modal true', () => {
    render(<MobileBottomSheet {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('uses title as aria-label when provided', () => {
    render(<MobileBottomSheet {...defaultProps} title="Chore Details" />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', 'Chore Details');
  });

  it('uses default aria-label when no title provided', () => {
    render(<MobileBottomSheet {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', 'Bottom sheet');
  });

  it('renders the title text when title prop is provided', () => {
    render(<MobileBottomSheet {...defaultProps} title="My Title" />);

    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('renders a close button when title is provided', () => {
    render(<MobileBottomSheet {...defaultProps} title="Details" />);

    const closeBtn = screen.getByLabelText('Close');
    expect(closeBtn).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<MobileBottomSheet {...defaultProps} title="Details" />);

    fireEvent.click(screen.getByLabelText('Close'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    render(<MobileBottomSheet {...defaultProps} />);

    const backdrop = screen.getByRole('dialog').parentElement?.querySelector('[aria-hidden="true"]');
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render close button when title is not provided', () => {
    render(<MobileBottomSheet {...defaultProps} />);

    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
  });

  it('sets body overflow to hidden when open', () => {
    render(<MobileBottomSheet {...defaultProps} open={true} />);

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('renders with height style of 92vh', () => {
    render(<MobileBottomSheet {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveStyle({ height: '92vh' });
  });

  it('renders drag handle area', () => {
    const { container } = render(<MobileBottomSheet {...defaultProps} />);

    // Drag handle has a small rounded div inside
    const handleBar = container.querySelector('.rounded-full.bg-gray-300');
    expect(handleBar).toBeInTheDocument();
  });
});
