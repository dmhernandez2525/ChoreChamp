import { cn } from '@chorechamp/ui';
import type { CharacterCard as CharacterCardType, CharacterClass } from '@chorechamp/types';
import { LevelBadge } from './LevelBadge';
import { AvatarDisplay } from './AvatarDisplay';

interface CharacterCardProps {
  card: CharacterCardType;
  rank?: number;
  showStats?: boolean;
  onClick?: () => void;
  className?: string;
}

const CLASS_COLORS: Record<CharacterClass, string> = {
  cleaner: 'border-blue-400 bg-blue-50',
  organizer: 'border-purple-400 bg-purple-50',
  helper: 'border-green-400 bg-green-50',
  chef: 'border-amber-400 bg-amber-50',
  guardian: 'border-red-400 bg-red-50',
};

const CLASS_ICONS: Record<CharacterClass, string> = {
  cleaner: '🧹',
  organizer: '📦',
  helper: '🤝',
  chef: '👨‍🍳',
  guardian: '🛡️',
};

const CLASS_NAMES: Record<CharacterClass, string> = {
  cleaner: 'Cleaner',
  organizer: 'Organizer',
  helper: 'Helper',
  chef: 'Chef',
  guardian: 'Guardian',
};

export function CharacterCard({
  card,
  rank,
  showStats = false,
  onClick,
  className,
}: CharacterCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'relative flex flex-col items-center rounded-xl border-2 p-4 transition-all',
        CLASS_COLORS[card.characterClass],
        onClick && 'cursor-pointer hover:shadow-lg hover:scale-[1.02]',
        !onClick && 'cursor-default',
        className
      )}
    >
      {/* Rank Badge */}
      {rank !== undefined && (
        <div className="absolute -left-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md text-sm font-bold">
          #{rank}
        </div>
      )}

      {/* Avatar */}
      <div className="relative">
        <AvatarDisplay
          avatar={card.avatar}
          size="lg"
          frame={card.avatar.frame}
        />
        <LevelBadge level={card.level} className="absolute -bottom-2 -right-2" />
      </div>

      {/* Name and Title */}
      <div className="mt-3 text-center">
        <h3 className="text-lg font-bold text-gray-900">{card.memberName}</h3>
        {card.title && (
          <p className="text-sm text-gray-600">{card.title}</p>
        )}
      </div>

      {/* Class */}
      <div className="mt-2 flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1">
        <span>{CLASS_ICONS[card.characterClass]}</span>
        <span className="text-sm font-medium text-gray-700">
          {CLASS_NAMES[card.characterClass]}
        </span>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="mt-3 grid grid-cols-2 gap-2 w-full">
          <StatDisplay label="SPD" value={card.stats.speed} color="blue" />
          <StatDisplay label="QTY" value={card.stats.quality} color="purple" />
          <StatDisplay label="CON" value={card.stats.consistency} color="green" />
          <StatDisplay label="TWK" value={card.stats.teamwork} color="amber" />
        </div>
      )}

      {/* Streak indicator */}
      {card.streakCurrent > 0 && (
        <div className="mt-2 flex items-center gap-1 text-sm">
          <span>🔥</span>
          <span className="font-medium text-orange-600">
            {card.streakCurrent} day streak
          </span>
        </div>
      )}
    </button>
  );
}

interface StatDisplayProps {
  label: string;
  value: number;
  color: 'blue' | 'purple' | 'green' | 'amber';
}

function StatDisplay({ label, value, color }: StatDisplayProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className={cn('rounded-md px-2 py-1 text-center', colorClasses[color])}>
      <span className="text-xs font-medium">{label}</span>
      <span className="ml-1 font-bold">{value}</span>
    </div>
  );
}
