import { cn } from '@chorechamp/ui';
import type { EvolutionTier } from '@chorechamp/types';

interface PetEvolutionBadgeProps {
  tier: EvolutionTier;
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showLevel?: boolean;
  className?: string;
}

const TIER_CONFIG: Record<EvolutionTier, { label: string; color: string; bgColor: string; borderColor: string; icon: string }> = {
  baby: {
    label: 'Baby',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    borderColor: 'border-pink-300',
    icon: '🐣',
  },
  juvenile: {
    label: 'Juvenile',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    icon: '🐕',
  },
  adult: {
    label: 'Adult',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: '🦁',
  },
  legendary: {
    label: 'Legendary',
    color: 'text-yellow-600',
    bgColor: 'bg-gradient-to-r from-yellow-100 to-amber-100',
    borderColor: 'border-yellow-400',
    icon: '✨',
  },
};

export function PetEvolutionBadge({
  tier,
  level,
  size = 'md',
  showLevel = true,
  className,
}: PetEvolutionBadgeProps) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.baby;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border-2 font-medium',
        config.bgColor,
        config.borderColor,
        sizeClasses[size],
        tier === 'legendary' && 'animate-pulse',
        className
      )}
    >
      <span role="img" aria-label={config.label}>
        {config.icon}
      </span>
      <span className={config.color}>{config.label}</span>
      {showLevel && (
        <span className="ml-1 rounded-full bg-white/60 px-1.5 text-gray-700">
          Lv.{level}
        </span>
      )}
    </div>
  );
}

export function getEvolutionProgress(currentTier: EvolutionTier, level: number): {
  nextTier: EvolutionTier | null;
  levelRequired: number;
  progress: number;
} {
  const thresholds: Record<EvolutionTier, { next: EvolutionTier | null; level: number }> = {
    baby: { next: 'juvenile', level: 10 },
    juvenile: { next: 'adult', level: 25 },
    adult: { next: 'legendary', level: 50 },
    legendary: { next: null, level: 100 },
  };

  const current = thresholds[currentTier];
  if (!current.next) {
    return { nextTier: null, levelRequired: 100, progress: 100 };
  }

  const prevThreshold = currentTier === 'baby' ? 1 :
    currentTier === 'juvenile' ? 10 :
    currentTier === 'adult' ? 25 : 50;

  const progress = Math.round(
    ((level - prevThreshold) / (current.level - prevThreshold)) * 100
  );

  return {
    nextTier: current.next,
    levelRequired: current.level,
    progress: Math.min(100, Math.max(0, progress)),
  };
}
