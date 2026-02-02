import { cn } from '@chorechamp/ui';
import type { GameCategory, GameDifficulty } from '@chorechamp/types';

interface GameCardData {
  id: string;
  name: string;
  description: string;
  category: GameCategory;
  icon: string;
  thumbnail: string;
  minPlayers: number;
  maxPlayers: number;
  estimatedDuration: number;
  baseXPReward: number;
  isUnlocked: boolean;
  unlockProgress: number;
  unlockText: string;
  highScore: number;
  playCount: number;
  bestDifficulty: GameDifficulty | null;
  categoryInfo: {
    label: string;
    icon: string;
    color: string;
  };
}

interface GameCardProps {
  game: GameCardData;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
}

const CATEGORY_BACKGROUNDS: Record<GameCategory, string> = {
  puzzle: 'from-blue-100 to-indigo-100',
  sorting: 'from-green-100 to-emerald-100',
  'time-challenge': 'from-orange-100 to-amber-100',
  memory: 'from-purple-100 to-violet-100',
  multiplayer: 'from-pink-100 to-rose-100',
};

export function GameCard({ game, onClick, compact = false, className }: GameCardProps) {
  const bgGradient = CATEGORY_BACKGROUNDS[game.category] || 'from-gray-100 to-gray-200';

  return (
    <button
      onClick={game.isUnlocked ? onClick : undefined}
      disabled={!game.isUnlocked}
      className={cn(
        'relative rounded-xl border-2 border-white/50 shadow-lg transition-all overflow-hidden text-left',
        `bg-gradient-to-br ${bgGradient}`,
        game.isUnlocked && onClick && 'cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
        !game.isUnlocked && 'opacity-70 cursor-not-allowed',
        compact ? 'p-3' : 'p-4',
        className
      )}
    >
      {/* Locked overlay */}
      {!game.isUnlocked && (
        <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center z-10">
          <div className="text-center">
            <span className="text-4xl">🔒</span>
            <div className="mt-2 bg-white/90 rounded-lg px-3 py-1 text-sm text-gray-700">
              {game.unlockText}
            </div>
            {game.unlockProgress > 0 && game.unlockProgress < 100 && (
              <div className="mt-2 w-32 mx-auto">
                <div className="h-2 rounded-full bg-gray-300 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${game.unlockProgress}%` }}
                  />
                </div>
                <span className="text-xs text-white/90">{game.unlockProgress}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col h-full">
        {/* Header with icon and category */}
        <div className="flex items-start justify-between">
          <div className={cn(
            'flex items-center justify-center rounded-xl bg-white/80 shadow',
            compact ? 'w-12 h-12 text-2xl' : 'w-16 h-16 text-4xl'
          )}>
            {game.icon}
          </div>
          <span className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            `bg-white/80 ${game.categoryInfo.color}`
          )}>
            {game.categoryInfo.icon} {game.categoryInfo.label}
          </span>
        </div>

        {/* Name and description */}
        <div className="mt-3 flex-1">
          <h3 className={cn(
            'font-bold text-gray-900',
            compact ? 'text-sm' : 'text-lg'
          )}>
            {game.name}
          </h3>
          {!compact && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {game.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className={cn(
          'flex items-center gap-3 mt-3 text-xs text-gray-500',
          compact && 'hidden'
        )}>
          <span title="Duration">
            ⏱️ {game.estimatedDuration}m
          </span>
          <span title="Players">
            👥 {game.minPlayers === game.maxPlayers
              ? game.minPlayers
              : `${game.minPlayers}-${game.maxPlayers}`}
          </span>
          <span title="XP Reward">
            ⭐ {game.baseXPReward} XP
          </span>
        </div>

        {/* Play stats */}
        {game.isUnlocked && game.playCount > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                High Score: <span className="font-bold text-gray-900">{game.highScore}</span>
              </span>
              {game.bestDifficulty && (
                <DifficultyBadge difficulty={game.bestDifficulty} size="sm" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Played {game.playCount} time{game.playCount !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}

interface DifficultyBadgeProps {
  difficulty: GameDifficulty;
  size?: 'sm' | 'md';
}

export function DifficultyBadge({ difficulty, size = 'md' }: DifficultyBadgeProps) {
  const config: Record<GameDifficulty, { label: string; color: string; bg: string }> = {
    easy: { label: 'Easy', color: 'text-green-600', bg: 'bg-green-100' },
    medium: { label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    hard: { label: 'Hard', color: 'text-orange-600', bg: 'bg-orange-100' },
    expert: { label: 'Expert', color: 'text-red-600', bg: 'bg-red-100' },
  };

  const { label, color, bg } = config[difficulty];

  return (
    <span className={cn(
      'rounded-full font-medium',
      bg,
      color,
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    )}>
      {label}
    </span>
  );
}

interface GameGridProps {
  games: GameCardData[];
  onGameClick?: (game: GameCardData) => void;
  emptyMessage?: string;
  className?: string;
}

export function GameGrid({ games, onGameClick, emptyMessage = 'No games available', className }: GameGridProps) {
  if (games.length === 0) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center py-12 text-gray-500',
        className
      )}>
        <span className="text-4xl mb-2">🎮</span>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn(
      'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
      className
    )}>
      {games.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          onClick={onGameClick ? () => onGameClick(game) : undefined}
        />
      ))}
    </div>
  );
}
