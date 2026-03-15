import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { AchievementToastProvider, useAchievementToast } from '../AchievementToast';

vi.mock('@chorechamp/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

vi.mock('lucide-react', () => ({
  Trophy: (props: Record<string, unknown>) => <svg data-testid="trophy-icon" {...props} />,
  X: (props: Record<string, unknown>) => <svg data-testid="x-icon" {...props} />,
}));

function TriggerButton({
  achievement,
}: {
  achievement: {
    id: string;
    name: string;
    description: string;
    icon?: string;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  };
}) {
  const { showAchievement } = useAchievementToast();
  return <button onClick={() => showAchievement(achievement)}>Trigger</button>;
}

const commonAchievement = {
  id: '1',
  name: 'First Chore',
  description: 'Complete your first chore',
};

const legendaryAchievement = {
  id: '2',
  name: 'Legendary Task',
  description: 'An epic achievement',
  rarity: 'legendary' as const,
  icon: '🏆',
};

describe('AchievementToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders children', () => {
    render(
      <AchievementToastProvider>
        <div data-testid="child">Content</div>
      </AchievementToastProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('does not show toast when no achievement is triggered', () => {
    render(
      <AchievementToastProvider>
        <div />
      </AchievementToastProvider>,
    );
    expect(screen.queryByTestId('achievement-toast')).not.toBeInTheDocument();
  });

  it('shows achievement toast when triggered', () => {
    render(
      <AchievementToastProvider>
        <TriggerButton achievement={commonAchievement} />
      </AchievementToastProvider>,
    );

    act(() => {
      screen.getByText('Trigger').click();
    });

    expect(screen.getByTestId('achievement-toast')).toBeInTheDocument();
    expect(screen.getByText('First Chore')).toBeInTheDocument();
    expect(screen.getByText('Complete your first chore')).toBeInTheDocument();
  });

  it('displays "Achievement Unlocked!" label', () => {
    render(
      <AchievementToastProvider>
        <TriggerButton achievement={commonAchievement} />
      </AchievementToastProvider>,
    );

    act(() => {
      screen.getByText('Trigger').click();
    });

    expect(screen.getByText('Achievement Unlocked!')).toBeInTheDocument();
  });

  it('shows rarity badge with correct label', () => {
    render(
      <AchievementToastProvider>
        <TriggerButton achievement={legendaryAchievement} />
      </AchievementToastProvider>,
    );

    act(() => {
      screen.getByText('Trigger').click();
    });

    expect(screen.getByText('Legendary')).toBeInTheDocument();
  });

  it('defaults rarity to Common when not specified', () => {
    render(
      <AchievementToastProvider>
        <TriggerButton achievement={commonAchievement} />
      </AchievementToastProvider>,
    );

    act(() => {
      screen.getByText('Trigger').click();
    });

    expect(screen.getByText('Common')).toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    render(
      <AchievementToastProvider>
        <TriggerButton achievement={legendaryAchievement} />
      </AchievementToastProvider>,
    );

    act(() => {
      screen.getByText('Trigger').click();
    });

    // Custom icon replaces Trophy
    expect(screen.queryByTestId('trophy-icon')).not.toBeInTheDocument();
  });

  it('renders Trophy icon when no custom icon provided', () => {
    render(
      <AchievementToastProvider>
        <TriggerButton achievement={commonAchievement} />
      </AchievementToastProvider>,
    );

    act(() => {
      screen.getByText('Trigger').click();
    });

    expect(screen.getByTestId('trophy-icon')).toBeInTheDocument();
  });

  it('has role alert and aria-live assertive', () => {
    render(
      <AchievementToastProvider>
        <TriggerButton achievement={commonAchievement} />
      </AchievementToastProvider>,
    );

    act(() => {
      screen.getByText('Trigger').click();
    });

    const toast = screen.getByTestId('achievement-toast');
    expect(toast).toHaveAttribute('role', 'alert');
    expect(toast).toHaveAttribute('aria-live', 'assertive');
  });

  it('auto-dismisses after 5 seconds', async () => {
    vi.useRealTimers();

    render(
      <AchievementToastProvider>
        <TriggerButton achievement={commonAchievement} />
      </AchievementToastProvider>,
    );

    act(() => {
      screen.getByText('Trigger').click();
    });

    expect(screen.getByTestId('achievement-toast')).toBeInTheDocument();

    // The toast sets a 5s timeout; verify it appears and has the progress bar
    const progressBar = screen.getByTestId('achievement-toast').querySelector('.animate-shrink-width');
    expect(progressBar).not.toBeNull();
    expect(progressBar).toHaveStyle({ animationDuration: '5s' });
  });

  it('dismisses when dismiss button is clicked', () => {
    render(
      <AchievementToastProvider>
        <TriggerButton achievement={commonAchievement} />
      </AchievementToastProvider>,
    );

    act(() => {
      screen.getByText('Trigger').click();
    });

    expect(screen.getByTestId('achievement-toast')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByLabelText('Dismiss achievement'));
    });

    expect(screen.queryByTestId('achievement-toast')).not.toBeInTheDocument();
  });
});

describe('useAchievementToast', () => {
  it('throws when used outside of AchievementToastProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function Broken() {
      useAchievementToast();
      return null;
    }

    expect(() => render(<Broken />)).toThrow(
      'useAchievementToast must be used within AchievementToastProvider',
    );

    spy.mockRestore();
  });
});
