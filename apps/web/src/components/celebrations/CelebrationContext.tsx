import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Confetti } from './Confetti';
import { CelebrationModal } from './CelebrationModal';
import { BadgeEarnedCelebration } from './BadgeEarnedCelebration';
import { StreakMilestoneCelebration } from './StreakMilestoneCelebration';
import { PointsEarnedToast } from './PointsEarnedToast';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold';
}

interface CelebrationState {
  confetti: boolean;
  modal: {
    isOpen: boolean;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    message?: string;
  } | null;
  badge: {
    isOpen: boolean;
    badge: Badge | null;
    memberName?: string;
  } | null;
  streak: {
    isOpen: boolean;
    count: number;
    memberName?: string;
  } | null;
  points: {
    isVisible: boolean;
    points: number;
    pointsName?: string;
  } | null;
}

interface CelebrationContextType {
  // Trigger confetti
  showConfetti: (duration?: number) => void;

  // Show a custom celebration modal
  showCelebration: (options: {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    message?: string;
  }) => void;

  // Show badge earned celebration
  showBadgeEarned: (badge: Badge, memberName?: string) => void;

  // Show streak milestone celebration
  showStreakMilestone: (count: number, memberName?: string) => void;

  // Show points earned toast
  showPointsEarned: (points: number, pointsName?: string) => void;

  // Chore completed celebration (combines confetti + points)
  celebrateChoreCompleted: (points: number, pointsName?: string) => void;

  // Close all celebrations
  closeAll: () => void;
}

const CelebrationContext = createContext<CelebrationContextType | null>(null);

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CelebrationState>({
    confetti: false,
    modal: null,
    badge: null,
    streak: null,
    points: null,
  });

  const showConfetti = useCallback((duration?: number) => {
    setState((prev) => ({ ...prev, confetti: true }));
    setTimeout(() => {
      setState((prev) => ({ ...prev, confetti: false }));
    }, duration || 3000);
  }, []);

  const showCelebration = useCallback(
    (options: {
      title: string;
      subtitle?: string;
      icon?: React.ReactNode;
      message?: string;
    }) => {
      setState((prev) => ({
        ...prev,
        modal: { isOpen: true, ...options },
      }));
    },
    []
  );

  const closeCelebration = useCallback(() => {
    setState((prev) => ({
      ...prev,
      modal: prev.modal ? { ...prev.modal, isOpen: false } : null,
    }));
  }, []);

  const showBadgeEarned = useCallback((badge: Badge, memberName?: string) => {
    setState((prev) => ({
      ...prev,
      badge: { isOpen: true, badge, memberName },
    }));
  }, []);

  const closeBadgeEarned = useCallback(() => {
    setState((prev) => ({
      ...prev,
      badge: prev.badge ? { ...prev.badge, isOpen: false } : null,
    }));
  }, []);

  const showStreakMilestone = useCallback((count: number, memberName?: string) => {
    setState((prev) => ({
      ...prev,
      streak: { isOpen: true, count, memberName },
    }));
  }, []);

  const closeStreakMilestone = useCallback(() => {
    setState((prev) => ({
      ...prev,
      streak: prev.streak ? { ...prev.streak, isOpen: false } : null,
    }));
  }, []);

  const showPointsEarned = useCallback((points: number, pointsName?: string) => {
    setState((prev) => ({
      ...prev,
      points: { isVisible: true, points, pointsName },
    }));
  }, []);

  const closePointsEarned = useCallback(() => {
    setState((prev) => ({ ...prev, points: null }));
  }, []);

  const celebrateChoreCompleted = useCallback(
    (points: number, pointsName?: string) => {
      showConfetti(2000);
      showPointsEarned(points, pointsName);
    },
    [showConfetti, showPointsEarned]
  );

  const closeAll = useCallback(() => {
    setState({
      confetti: false,
      modal: null,
      badge: null,
      streak: null,
      points: null,
    });
  }, []);

  return (
    <CelebrationContext.Provider
      value={{
        showConfetti,
        showCelebration,
        showBadgeEarned,
        showStreakMilestone,
        showPointsEarned,
        celebrateChoreCompleted,
        closeAll,
      }}
    >
      {children}

      {/* Confetti overlay */}
      <Confetti isActive={state.confetti} />

      {/* Custom celebration modal */}
      {state.modal && (
        <CelebrationModal
          isOpen={state.modal.isOpen}
          onClose={closeCelebration}
          title={state.modal.title}
          subtitle={state.modal.subtitle}
          icon={state.modal.icon}
          message={state.modal.message}
          showConfetti={false}
        />
      )}

      {/* Badge earned celebration */}
      {state.badge && (
        <BadgeEarnedCelebration
          isOpen={state.badge.isOpen}
          onClose={closeBadgeEarned}
          badge={state.badge.badge}
          memberName={state.badge.memberName}
        />
      )}

      {/* Streak milestone celebration */}
      {state.streak && (
        <StreakMilestoneCelebration
          isOpen={state.streak.isOpen}
          onClose={closeStreakMilestone}
          streakCount={state.streak.count}
          memberName={state.streak.memberName}
        />
      )}

      {/* Points earned toast */}
      {state.points && (
        <PointsEarnedToast
          isVisible={state.points.isVisible}
          points={state.points.points}
          pointsName={state.points.pointsName}
          onComplete={closePointsEarned}
        />
      )}
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebration must be used within a CelebrationProvider');
  }
  return context;
}
