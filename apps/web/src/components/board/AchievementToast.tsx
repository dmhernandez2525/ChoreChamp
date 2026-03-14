import { useEffect, useCallback, useRef, useState, createContext, useContext } from 'react';
import { Trophy, X } from 'lucide-react';
import { cn } from '@chorechamp/ui';

// ---- Types ----

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

interface QueuedAchievement extends Achievement {
  queuedAt: number;
}

interface AchievementToastContextValue {
  showAchievement: (achievement: Achievement) => void;
}

// ---- Context & Provider ----

const AchievementToastContext = createContext<AchievementToastContextValue | null>(null);

export function useAchievementToast() {
  const ctx = useContext(AchievementToastContext);
  if (!ctx) {
    throw new Error('useAchievementToast must be used within AchievementToastProvider');
  }
  return ctx;
}

export function AchievementToastProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<QueuedAchievement[]>([]);
  const [visible, setVisible] = useState<QueuedAchievement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAchievement = useCallback((achievement: Achievement) => {
    setQueue(prev => [...prev, { ...achievement, queuedAt: Date.now() }]);
  }, []);

  // Process queue: show next achievement when current one dismisses
  useEffect(() => {
    if (visible || queue.length === 0) return;

    const next = queue[0];
    setQueue(prev => prev.slice(1));
    setVisible(next);

    timerRef.current = setTimeout(() => {
      setVisible(null);
    }, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, queue]);

  const dismiss = useCallback(() => {
    setVisible(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return (
    <AchievementToastContext.Provider value={{ showAchievement }}>
      {children}
      {visible && (
        <AchievementToastDisplay
          achievement={visible}
          onDismiss={dismiss}
        />
      )}
    </AchievementToastContext.Provider>
  );
}

// ---- Toast Display ----

const rarityStyles = {
  common: {
    border: 'border-gray-300',
    bg: 'bg-gray-50',
    badge: 'bg-gray-200 text-gray-700',
    label: 'Common',
  },
  rare: {
    border: 'border-blue-400',
    bg: 'bg-blue-50',
    badge: 'bg-blue-200 text-blue-800',
    label: 'Rare',
  },
  epic: {
    border: 'border-violet-400',
    bg: 'bg-violet-50',
    badge: 'bg-violet-200 text-violet-800',
    label: 'Epic',
  },
  legendary: {
    border: 'border-yellow-400',
    bg: 'bg-yellow-50',
    badge: 'bg-yellow-200 text-yellow-800',
    label: 'Legendary',
  },
} as const;

interface AchievementToastDisplayProps {
  achievement: QueuedAchievement;
  onDismiss: () => void;
}

function AchievementToastDisplay({
  achievement,
  onDismiss,
}: AchievementToastDisplayProps) {
  const rarity = achievement.rarity ?? 'common';
  const styles = rarityStyles[rarity];

  return (
    <div
      className={cn(
        'fixed right-4 top-4 z-[70] w-80 overflow-hidden rounded-xl border-2 shadow-xl',
        'animate-in slide-in-from-top-2 fade-in duration-300',
        styles.border,
        styles.bg
      )}
      role="alert"
      aria-live="assertive"
      data-testid="achievement-toast"
    >
      {/* Confetti particles (CSS only) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="achievement-particle absolute"
            style={{
              left: `${8 + (i * 7) % 85}%`,
              animationDelay: `${i * 0.1}s`,
              backgroundColor: [
                '#fbbf24', '#a78bfa', '#34d399',
                '#f87171', '#60a5fa', '#fb923c',
              ][i % 6],
            }}
          />
        ))}
      </div>

      <div className="relative flex items-start gap-3 p-4">
        {/* Badge icon */}
        <div
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
            'border-2 border-white shadow-sm',
            rarity === 'legendary' ? 'bg-yellow-400' :
            rarity === 'epic' ? 'bg-violet-400' :
            rarity === 'rare' ? 'bg-blue-400' :
            'bg-gray-300'
          )}
        >
          {achievement.icon ? (
            <span className="text-lg">{achievement.icon}</span>
          ) : (
            <Trophy className="h-5 w-5 text-white" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Achievement Unlocked!
            </span>
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                styles.badge
              )}
            >
              {styles.label}
            </span>
          </div>
          <div className="mt-0.5 text-sm font-semibold text-gray-900">
            {achievement.name}
          </div>
          <div className="mt-0.5 text-xs text-gray-600">
            {achievement.description}
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="flex-shrink-0 rounded p-1 text-gray-400 transition-colors hover:text-gray-600"
          aria-label="Dismiss achievement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="h-0.5 w-full bg-black/5">
        <div
          className="h-full animate-shrink-width bg-black/10"
          style={{ animationDuration: '5s' }}
        />
      </div>
    </div>
  );
}
