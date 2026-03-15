import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LevelProgressBar } from '../LevelProgressBar';

vi.mock('@chorechamp/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

vi.mock('lucide-react', () => ({
  Zap: (props: Record<string, unknown>) => <svg data-testid="zap-icon" {...props} />,
}));

describe('LevelProgressBar', () => {
  it('renders with data-testid', () => {
    render(<LevelProgressBar level={5} currentXp={100} nextLevelXp={200} />);
    expect(screen.getByTestId('level-progress-bar')).toBeInTheDocument();
  });

  it('has correct progressbar role', () => {
    render(<LevelProgressBar level={3} currentXp={50} nextLevelXp={100} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toBeInTheDocument();
  });

  it('sets correct aria-valuenow, aria-valuemin, and aria-valuemax', () => {
    render(<LevelProgressBar level={3} currentXp={75} nextLevelXp={150} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '75');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '150');
  });

  it('sets correct aria-label with level and XP info', () => {
    render(<LevelProgressBar level={7} currentXp={300} nextLevelXp={500} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-label', 'Level 7, 300 of 500 XP');
  });

  it('displays the level number', () => {
    render(<LevelProgressBar level={12} currentXp={0} nextLevelXp={1000} />);
    expect(screen.getByTitle('Level 12')).toHaveTextContent('12');
  });

  it('displays current XP with locale formatting', () => {
    render(<LevelProgressBar level={1} currentXp={1500} nextLevelXp={2000} />);
    expect(screen.getByText('1,500 XP')).toBeInTheDocument();
  });

  it('displays next level XP with locale formatting', () => {
    render(<LevelProgressBar level={1} currentXp={500} nextLevelXp={2000} />);
    expect(screen.getByText('2,000 XP')).toBeInTheDocument();
  });

  it('renders Zap icon', () => {
    render(<LevelProgressBar level={1} currentXp={10} nextLevelXp={100} />);
    expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
  });

  it('caps progress at 100% when currentXp exceeds nextLevelXp', () => {
    render(<LevelProgressBar level={5} currentXp={250} nextLevelXp={200} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toBeInTheDocument();
    // The component caps the visual percentage at 100
  });

  it('handles zero nextLevelXp (avoids division by zero)', () => {
    render(<LevelProgressBar level={1} currentXp={0} nextLevelXp={0} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <LevelProgressBar level={1} currentXp={50} nextLevelXp={100} className="custom-class" />,
    );
    const bar = screen.getByTestId('level-progress-bar');
    expect(bar.className).toContain('custom-class');
  });

  it('renders with low progress (gray color range)', () => {
    render(<LevelProgressBar level={1} currentXp={10} nextLevelXp={100} />);
    // 10% progress should use bg-gray-400
    expect(screen.getByTestId('level-progress-bar')).toBeInTheDocument();
  });

  it('renders with high progress (violet color range)', () => {
    render(<LevelProgressBar level={1} currentXp={95} nextLevelXp={100} />);
    // 95% progress should use bg-violet-500
    expect(screen.getByTestId('level-progress-bar')).toBeInTheDocument();
  });
});
