import { cn } from '@chorechamp/ui';
import type { EvolutionTier, PetMood, PetStats as PetStatsType } from '@chorechamp/types';
import { PetStats } from './PetStats';
import { PetMoodDisplay } from './PetMoodDisplay';
import { PetEvolutionBadge } from './PetEvolutionBadge';

interface PetCardData {
  id: string;
  name: string;
  species: {
    id: string;
    name: string;
    icon: string;
  };
  evolutionTier: EvolutionTier;
  level: number;
  mood: PetMood;
  stats: PetStatsType;
  xpProgress: {
    current: number;
    needed: number;
    percentage: number;
  };
  canEvolve?: boolean;
  happinessBonus?: number;
}

interface PetCardProps {
  pet: PetCardData;
  onClick?: () => void;
  showStats?: boolean;
  compact?: boolean;
  className?: string;
}

const SPECIES_BACKGROUNDS: Record<string, string> = {
  dog: 'from-amber-50 to-orange-100',
  cat: 'from-purple-50 to-pink-100',
  dragon: 'from-red-50 to-orange-100',
  robot: 'from-gray-50 to-blue-100',
  bunny: 'from-pink-50 to-rose-100',
  bird: 'from-sky-50 to-blue-100',
  unicorn: 'from-violet-50 to-purple-100',
  slime: 'from-green-50 to-emerald-100',
};

export function PetCard({ pet, onClick, showStats = true, compact = false, className }: PetCardProps) {
  const bgGradient = SPECIES_BACKGROUNDS[pet.species.id] || 'from-gray-50 to-gray-100';

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'relative rounded-xl border-2 border-white/50 shadow-lg transition-all overflow-hidden',
        `bg-gradient-to-br ${bgGradient}`,
        onClick && 'cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
        !onClick && 'cursor-default',
        compact ? 'p-3' : 'p-4',
        className
      )}
    >
      {/* Evolution indicator */}
      {pet.canEvolve && (
        <div className="absolute top-2 right-2 animate-bounce">
          <span className="text-xl" role="img" aria-label="Can evolve">
            ✨
          </span>
        </div>
      )}

      {/* Pet Icon */}
      <div className="flex flex-col items-center">
        <div className={cn(
          'flex items-center justify-center rounded-full bg-white/80 shadow-inner',
          compact ? 'w-16 h-16 text-3xl' : 'w-24 h-24 text-5xl'
        )}>
          <span role="img" aria-label={pet.species.name}>
            {pet.species.icon}
          </span>
        </div>

        {/* Name */}
        <h3 className={cn(
          'font-bold text-gray-900 mt-2',
          compact ? 'text-sm' : 'text-lg'
        )}>
          {pet.name}
        </h3>

        {/* Species */}
        <p className="text-xs text-gray-600">{pet.species.name}</p>

        {/* Evolution & Level Badge */}
        <div className="mt-2">
          <PetEvolutionBadge
            tier={pet.evolutionTier}
            level={pet.level}
            size={compact ? 'sm' : 'md'}
          />
        </div>

        {/* Mood */}
        <div className="mt-2">
          <PetMoodDisplay
            mood={pet.mood}
            size={compact ? 'sm' : 'md'}
          />
        </div>

        {/* XP Progress */}
        {!compact && (
          <div className="w-full mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>XP</span>
              <span>{pet.xpProgress.current}/{pet.xpProgress.needed}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
                style={{ width: `${pet.xpProgress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        {showStats && !compact && (
          <div className="w-full mt-3">
            <PetStats
              stats={pet.stats}
              showLabels={false}
              compact
            />
          </div>
        )}

        {/* Happiness Bonus indicator */}
        {pet.happinessBonus !== undefined && pet.happinessBonus > 0 && (
          <div className="mt-2 rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-green-600">
            +{Math.round(pet.happinessBonus * 100)}% Point Bonus
          </div>
        )}
      </div>
    </button>
  );
}

interface PetCardGridProps {
  pets: PetCardData[];
  onPetClick?: (pet: PetCardData) => void;
  emptyMessage?: string;
  className?: string;
}

export function PetCardGrid({ pets, onPetClick, emptyMessage = 'No pets yet', className }: PetCardGridProps) {
  if (pets.length === 0) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center py-12 text-gray-500',
        className
      )}>
        <span className="text-4xl mb-2">🐾</span>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn(
      'grid gap-4',
      pets.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' :
      pets.length === 2 ? 'grid-cols-2' :
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      className
    )}>
      {pets.map((pet) => (
        <PetCard
          key={pet.id}
          pet={pet}
          onClick={onPetClick ? () => onPetClick(pet) : undefined}
        />
      ))}
    </div>
  );
}
