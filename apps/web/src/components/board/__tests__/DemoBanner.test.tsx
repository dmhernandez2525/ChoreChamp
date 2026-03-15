import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DemoBanner } from '../DemoBanner';

const mockNavigate = vi.fn();
const mockExitDemo = vi.fn();
let mockIsDemoMode = true;

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/context/DemoContext', () => ({
  useDemoMode: () => ({
    isDemoMode: mockIsDemoMode,
    exitDemo: mockExitDemo,
  }),
}));

vi.mock('lucide-react', () => ({
  Info: (props: Record<string, unknown>) => <svg data-testid="info-icon" {...props} />,
  X: (props: Record<string, unknown>) => <svg data-testid="x-icon" {...props} />,
}));

describe('DemoBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsDemoMode = true;
  });

  it('renders when demo mode is active', () => {
    render(<DemoBanner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Demo Mode')).toBeInTheDocument();
  });

  it('has correct aria-label', () => {
    render(<DemoBanner />);
    expect(screen.getByLabelText('Demo mode active')).toBeInTheDocument();
  });

  it('renders nothing when demo mode is not active', () => {
    mockIsDemoMode = false;
    const { container } = render(<DemoBanner />);
    expect(container.innerHTML).toBe('');
  });

  it('shows sample data message', () => {
    render(<DemoBanner />);
    expect(screen.getByText('This is a demo with sample data')).toBeInTheDocument();
  });

  it('renders Exit Demo button', () => {
    render(<DemoBanner />);
    expect(screen.getByText('Exit Demo')).toBeInTheDocument();
  });

  it('calls exitDemo and navigates to / when Exit Demo is clicked', async () => {
    const user = userEvent.setup();
    render(<DemoBanner />);

    await user.click(screen.getByText('Exit Demo'));

    expect(mockExitDemo).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('renders a dismiss button with aria-label', () => {
    render(<DemoBanner />);
    expect(screen.getByLabelText('Dismiss demo banner')).toBeInTheDocument();
  });

  it('hides the banner when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    render(<DemoBanner />);

    expect(screen.getByRole('status')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Dismiss demo banner'));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
