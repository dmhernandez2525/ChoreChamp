import { CelebrationModal } from './CelebrationModal';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold';
}

interface BadgeEarnedCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  badge: Badge | null;
  memberName?: string;
}

const TIER_COLORS = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-gray-400 to-gray-600',
  gold: 'from-yellow-400 to-yellow-600',
};

const TIER_LABELS = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
};

export function BadgeEarnedCelebration({
  isOpen,
  onClose,
  badge,
  memberName,
}: BadgeEarnedCelebrationProps) {
  if (!badge) return null;

  return (
    <CelebrationModal
      isOpen={isOpen}
      onClose={onClose}
      title="Badge Earned!"
      subtitle={badge.name}
      icon={
        <div className="relative">
          {/* Badge background glow */}
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${
              TIER_COLORS[badge.tier]
            } blur-lg opacity-50`}
          />
          {/* Badge icon */}
          <div
            className={`relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${
              TIER_COLORS[badge.tier]
            } text-5xl shadow-lg`}
          >
            {badge.icon}
          </div>
          {/* Tier label */}
          <div
            className={`absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r ${
              TIER_COLORS[badge.tier]
            } px-3 py-0.5 text-xs font-bold text-white shadow`}
          >
            {TIER_LABELS[badge.tier]}
          </div>
        </div>
      }
      message={
        memberName
          ? `${memberName} earned this badge! ${badge.description}`
          : badge.description
      }
      showConfetti
    />
  );
}
