import { cn } from '@chorechamp/ui';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LevelBadge({ level, size = 'md', className }: LevelBadgeProps) {
  const sizeClasses = {
    sm: 'h-5 w-5 text-[10px]',
    md: 'h-7 w-7 text-xs',
    lg: 'h-9 w-9 text-sm',
  };

  // Color based on level tiers
  const getColorClass = (level: number) => {
    if (level >= 100) return 'bg-gradient-to-br from-amber-400 to-yellow-600 text-white'; // Legendary
    if (level >= 75) return 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'; // Epic
    if (level >= 50) return 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'; // Rare
    if (level >= 25) return 'bg-gradient-to-br from-green-500 to-emerald-500 text-white'; // Uncommon
    return 'bg-gray-600 text-white'; // Common
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-bold shadow-md',
        sizeClasses[size],
        getColorClass(level),
        className
      )}
    >
      {level}
    </div>
  );
}
