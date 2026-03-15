import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimeTracker } from '../TimeTracker';

vi.mock('@chorechamp/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
  Button: ({
    children,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  ),
}));

vi.mock('lucide-react', () => ({
  Play: ({ className }: { className?: string }) => <svg data-testid="play-icon" className={className} />,
  Square: ({ className }: { className?: string }) => <svg data-testid="square-icon" className={className} />,
  Clock: ({ className }: { className?: string }) => <svg data-testid="clock-icon" className={className} />,
}));

describe('TimeTracker', () => {
  const defaultProps = {
    isRunning: false,
    startedAt: null,
    totalSeconds: 0,
    onStart: vi.fn(),
    onStop: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the time-tracker container', () => {
    render(<TimeTracker {...defaultProps} />);

    expect(screen.getByTestId('time-tracker')).toBeInTheDocument();
  });

  it('renders the "Time Tracked" label', () => {
    render(<TimeTracker {...defaultProps} />);

    expect(screen.getByText('Time Tracked')).toBeInTheDocument();
  });

  it('shows Start button when not running', () => {
    render(<TimeTracker {...defaultProps} isRunning={false} />);

    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.queryByText('Stop')).not.toBeInTheDocument();
  });

  it('shows Stop button when running', () => {
    render(
      <TimeTracker
        {...defaultProps}
        isRunning={true}
        startedAt={new Date()}
      />,
    );

    expect(screen.getByText('Stop')).toBeInTheDocument();
    expect(screen.queryByText('Start')).not.toBeInTheDocument();
  });

  it('calls onStart when Start button is clicked', () => {
    render(<TimeTracker {...defaultProps} />);

    fireEvent.click(screen.getByText('Start'));
    expect(defaultProps.onStart).toHaveBeenCalledTimes(1);
  });

  it('calls onStop when Stop button is clicked', () => {
    render(
      <TimeTracker
        {...defaultProps}
        isRunning={true}
        startedAt={new Date()}
        onStop={defaultProps.onStop}
      />,
    );

    fireEvent.click(screen.getByText('Stop'));
    expect(defaultProps.onStop).toHaveBeenCalledTimes(1);
  });

  it('displays formatted total time as 0:00 when no time tracked', () => {
    const { container } = render(<TimeTracker {...defaultProps} totalSeconds={0} />);

    const timerDisplay = container.querySelector('.text-2xl');
    expect(timerDisplay).toHaveTextContent('0:00');
  });

  it('displays formatted total time in mm:ss format', () => {
    render(<TimeTracker {...defaultProps} totalSeconds={125} />);

    expect(screen.getByText('2:05')).toBeInTheDocument();
  });

  it('displays formatted total time in h:mm:ss format for long durations', () => {
    render(<TimeTracker {...defaultProps} totalSeconds={3725} />);

    expect(screen.getByText('1:02:05')).toBeInTheDocument();
  });

  it('renders progress bar when estimatedMinutes is provided', () => {
    render(
      <TimeTracker {...defaultProps} totalSeconds={0} estimatedMinutes={10} />,
    );

    // Text is split across nodes: "{estimatedMinutes}m estimated"
    expect(screen.getByText((_content, element) => {
      return element?.tagName === 'SPAN' && element.textContent === '10m estimated';
    })).toBeInTheDocument();
  });

  it('does not render progress bar when estimatedMinutes is not provided', () => {
    render(<TimeTracker {...defaultProps} />);

    expect(screen.queryByText('estimated')).not.toBeInTheDocument();
  });

  it('shows pulse indicator when running', () => {
    const { container } = render(
      <TimeTracker
        {...defaultProps}
        isRunning={true}
        startedAt={new Date()}
      />,
    );

    const pulseEl = container.querySelector('.animate-pulse');
    expect(pulseEl).toBeInTheDocument();
  });

  it('does not show pulse indicator when stopped', () => {
    const { container } = render(<TimeTracker {...defaultProps} />);

    const pulseEl = container.querySelector('.animate-pulse');
    expect(pulseEl).not.toBeInTheDocument();
  });

  it('applies green text color when running', () => {
    render(
      <TimeTracker
        {...defaultProps}
        isRunning={true}
        startedAt={new Date()}
      />,
    );

    const timeDisplay = screen.getByText('0:00');
    expect(timeDisplay.className).toContain('text-green-600');
  });

  it('applies default text color when stopped', () => {
    render(<TimeTracker {...defaultProps} totalSeconds={60} />);

    const timeDisplay = screen.getByText('1:00');
    expect(timeDisplay.className).toContain('text-gray-700');
  });

  it('applies red text when over estimate', () => {
    render(
      <TimeTracker
        {...defaultProps}
        totalSeconds={700}
        estimatedMinutes={10}
      />,
    );

    const timeDisplay = screen.getByText('11:40');
    expect(timeDisplay.className).toContain('text-red-600');
  });

  it('applies custom className', () => {
    render(<TimeTracker {...defaultProps} className="custom-class" />);

    expect(screen.getByTestId('time-tracker').className).toContain('custom-class');
  });
});
