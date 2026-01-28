import { CelebrationModal } from './CelebrationModal';

interface StreakMilestoneCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  streakCount: number;
  memberName?: string;
}

const MILESTONE_MESSAGES: Record<number, { title: string; message: string }> = {
  7: {
    title: 'One Week Streak!',
    message: "Amazing! You've been consistent for a whole week!",
  },
  14: {
    title: 'Two Week Streak!',
    message: "Incredible dedication! Two weeks of crushing it!",
  },
  30: {
    title: 'One Month Streak!',
    message: "Legendary! A full month of excellence!",
  },
  60: {
    title: 'Two Month Streak!',
    message: "Unstoppable! 60 days of pure dedication!",
  },
  90: {
    title: 'Three Month Streak!',
    message: "Master level! 90 days of consistency!",
  },
  180: {
    title: 'Six Month Streak!',
    message: "Incredible! Half a year of amazing work!",
  },
  365: {
    title: 'One Year Streak!',
    message: "LEGENDARY! A full year of dedication!",
  },
};

function getStreakEmoji(count: number): string {
  if (count >= 365) return '👑';
  if (count >= 180) return '🏆';
  if (count >= 90) return '💎';
  if (count >= 60) return '🌟';
  if (count >= 30) return '🔥';
  if (count >= 14) return '⚡';
  return '✨';
}

function getStreakMessage(count: number): { title: string; message: string } {
  // Check for exact milestones first
  if (MILESTONE_MESSAGES[count]) {
    return MILESTONE_MESSAGES[count];
  }

  // For other counts, generate a generic message
  return {
    title: `${count} Day Streak!`,
    message: `Keep it up! You're on fire with a ${count} day streak!`,
  };
}

export function StreakMilestoneCelebration({
  isOpen,
  onClose,
  streakCount,
  memberName,
}: StreakMilestoneCelebrationProps) {
  const { title, message } = getStreakMessage(streakCount);
  const emoji = getStreakEmoji(streakCount);

  return (
    <CelebrationModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={
        <div className="relative">
          {/* Fire glow effect */}
          <div className="absolute inset-0 animate-pulse rounded-full bg-orange-500/30 blur-xl" />
          {/* Streak display */}
          <div className="relative flex h-28 w-28 flex-col items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 shadow-lg">
            <span className="text-4xl">{emoji}</span>
            <span className="text-2xl font-bold text-white">{streakCount}</span>
          </div>
        </div>
      }
      message={memberName ? `${memberName}: ${message}` : message}
      showConfetti
    />
  );
}
