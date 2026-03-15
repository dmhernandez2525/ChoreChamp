import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StreakIndicator } from '../StreakIndicator';

vi.mock('@chorechamp/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

vi.mock('lucide-react', () => ({
  Flame: ({ className, ...props }: { className?: string } & Record<string, unknown>) => (
    <svg data-testid="flame-icon" className={className} {...props} />
  ),
}));

describe('StreakIndicator', () => {
  it('renders nothing when streak is 0', () => {
    const { container } = render(<StreakIndicator streak={0} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when streak is negative', () => {
    const { container } = render(<StreakIndicator streak={-1} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the streak count', () => {
    render(<StreakIndicator streak={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders with data-testid', () => {
    render(<StreakIndicator streak={3} />);
    expect(screen.getByTestId('streak-indicator')).toBeInTheDocument();
  });

  it('renders the flame icon', () => {
    render(<StreakIndicator streak={1} />);
    expect(screen.getByTestId('flame-icon')).toBeInTheDocument();
  });

  it('shows tooltip on mouse enter', () => {
    render(<StreakIndicator streak={7} />);
    const indicator = screen.getByTestId('streak-indicator');

    fireEvent.mouseEnter(indicator);

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('7-day streak')).toBeInTheDocument();
  });

  it('hides tooltip on mouse leave', () => {
    render(<StreakIndicator streak={7} />);
    const indicator = screen.getByTestId('streak-indicator');

    fireEvent.mouseEnter(indicator);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(indicator);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows "Warming up" label for streaks under 7', () => {
    render(<StreakIndicator streak={3} />);
    fireEvent.mouseEnter(screen.getByTestId('streak-indicator'));
    expect(screen.getByText('Warming up')).toBeInTheDocument();
  });

  it('shows "Heating up" label for streaks 7-13', () => {
    render(<StreakIndicator streak={10} />);
    fireEvent.mouseEnter(screen.getByTestId('streak-indicator'));
    expect(screen.getByText('Heating up')).toBeInTheDocument();
  });

  it('shows "On fire" label for streaks 14-29', () => {
    render(<StreakIndicator streak={20} />);
    fireEvent.mouseEnter(screen.getByTestId('streak-indicator'));
    expect(screen.getByText('On fire')).toBeInTheDocument();
  });

  it('shows "Blazing" label for streaks 30+', () => {
    render(<StreakIndicator streak={30} />);
    fireEvent.mouseEnter(screen.getByTestId('streak-indicator'));
    expect(screen.getByText('Blazing')).toBeInTheDocument();
  });

  it('shows at-risk warning when atRisk is true', () => {
    render(<StreakIndicator streak={5} atRisk />);
    fireEvent.mouseEnter(screen.getByTestId('streak-indicator'));
    expect(
      screen.getByText('Complete a chore today to keep your streak!'),
    ).toBeInTheDocument();
  });

  it('applies at-risk styles when atRisk is true', () => {
    render(<StreakIndicator streak={5} atRisk />);
    const indicator = screen.getByTestId('streak-indicator');
    const pill = indicator.querySelector('[class*="animate-pulse-soft"]');
    expect(pill).not.toBeNull();
  });

  it('shows last completed date when lastCompletedAt is provided', () => {
    render(
      <StreakIndicator streak={5} lastCompletedAt="2026-03-10T12:00:00Z" />,
    );
    fireEvent.mouseEnter(screen.getByTestId('streak-indicator'));
    expect(screen.getByText(/Last completed:/)).toBeInTheDocument();
  });

  it('does not show at-risk warning when atRisk is false', () => {
    render(<StreakIndicator streak={5} />);
    fireEvent.mouseEnter(screen.getByTestId('streak-indicator'));
    expect(
      screen.queryByText('Complete a chore today to keep your streak!'),
    ).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<StreakIndicator streak={5} className="my-custom" />);
    const indicator = screen.getByTestId('streak-indicator');
    expect(indicator.className).toContain('my-custom');
  });
});
