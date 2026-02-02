import { cn } from '@chorechamp/ui';
import type { PetMood } from '@chorechamp/types';

interface PetMoodDisplayProps {
  mood: PetMood;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const MOOD_CONFIG: Record<PetMood, { emoji: string; label: string; color: string; bgColor: string }> = {
  ecstatic: { emoji: '🤩', label: 'Ecstatic!', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  happy: { emoji: '😊', label: 'Happy', color: 'text-green-600', bgColor: 'bg-green-100' },
  content: { emoji: '🙂', label: 'Content', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  neutral: { emoji: '😐', label: 'Neutral', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  sad: { emoji: '😢', label: 'Sad', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  sick: { emoji: '🤒', label: 'Sick!', color: 'text-red-600', bgColor: 'bg-red-100' },
  sleeping: { emoji: '😴', label: 'Sleeping', color: 'text-purple-600', bgColor: 'bg-purple-100' },
};

export function PetMoodDisplay({ mood, size = 'md', showLabel = true, className }: PetMoodDisplayProps) {
  const config = MOOD_CONFIG[mood] || MOOD_CONFIG.neutral;

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn(
      'flex items-center gap-2 rounded-full px-3 py-1.5',
      config.bgColor,
      className
    )}>
      <span className={sizeClasses[size]} role="img" aria-label={config.label}>
        {config.emoji}
      </span>
      {showLabel && (
        <span className={cn('font-medium', config.color, labelSizeClasses[size])}>
          {config.label}
        </span>
      )}
    </div>
  );
}

export function getMoodDescription(mood: PetMood): string {
  const descriptions: Record<PetMood, string> = {
    ecstatic: 'Your pet is overjoyed! They are at peak happiness.',
    happy: 'Your pet is feeling great and content.',
    content: 'Your pet is doing well.',
    neutral: 'Your pet could use some attention.',
    sad: 'Your pet is feeling down. Give them some love!',
    sick: 'Your pet needs healing! Their health is very low.',
    sleeping: 'Your pet is resting to recover energy.',
  };
  return descriptions[mood] || 'Unknown mood';
}
