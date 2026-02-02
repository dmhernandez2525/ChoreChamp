import { useState } from 'react';
import { cn } from '@chorechamp/ui';

interface RarityInfo {
  color: string;
  bgColor: string;
  glowColor: string;
  label: string;
}

interface CardData {
  id: string;
  name: string;
  description: string;
  flavorText: string | null;
  category: string;
  rarity: string;
  artwork: string;
  borderColor: string;
  setNumber: number;
  totalInSet: number;
  setId: string;
  effect?: {
    type: string;
    value: number;
    duration?: number;
    description: string;
  } | null;
  rarityInfo: RarityInfo;
  quantity?: number;
  isFavorite?: boolean;
  isNew?: boolean;
}

interface CardDisplayProps {
  card: CardData;
  size?: 'sm' | 'md' | 'lg';
  showQuantity?: boolean;
  showFavorite?: boolean;
  isLocked?: boolean;
  onClick?: () => void;
  onFavorite?: () => void;
  className?: string;
}

const RARITY_GLOW: Record<string, string> = {
  common: '',
  uncommon: 'shadow-green-300/30',
  rare: 'shadow-blue-400/40 shadow-lg',
  epic: 'shadow-purple-400/50 shadow-xl',
  legendary: 'shadow-yellow-400/60 shadow-2xl animate-pulse',
};

export function CardDisplay({
  card,
  size = 'md',
  showQuantity = false,
  showFavorite = false,
  isLocked = false,
  onClick,
  onFavorite,
  className,
}: CardDisplayProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const sizeClasses = {
    sm: 'w-32 h-44',
    md: 'w-48 h-64',
    lg: 'w-64 h-88',
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (!isLocked) {
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <div
      className={cn(
        'relative perspective-1000',
        sizeClasses[size],
        className
      )}
    >
      <div
        className={cn(
          'relative w-full h-full transition-transform duration-500 transform-style-3d cursor-pointer',
          isFlipped && 'rotate-y-180',
          RARITY_GLOW[card.rarity]
        )}
        onClick={handleClick}
      >
        {/* Front of card */}
        <div
          className={cn(
            'absolute w-full h-full backface-hidden rounded-xl overflow-hidden',
            'border-4',
            isLocked && 'grayscale opacity-50'
          )}
          style={{ borderColor: card.borderColor }}
        >
          {/* Card artwork */}
          <div className="relative h-3/5 bg-gradient-to-b from-gray-100 to-gray-200">
            {card.artwork ? (
              <img
                src={card.artwork}
                alt={card.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">
                {card.category === 'chore_heroes' && '🦸'}
                {card.category === 'power_ups' && '⚡'}
                {card.category === 'locations' && '🏠'}
                {card.category === 'tools' && '🧹'}
                {card.category === 'seasonal' && '🎄'}
                {card.category === 'achievements' && '🏆'}
              </div>
            )}

            {/* New badge */}
            {card.isNew && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                NEW
              </div>
            )}

            {/* Rarity badge */}
            <div
              className={cn(
                'absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full',
                card.rarityInfo.bgColor,
                card.rarityInfo.color
              )}
            >
              {card.rarityInfo.label}
            </div>
          </div>

          {/* Card info */}
          <div className="h-2/5 bg-white p-2 flex flex-col">
            <h3 className="font-bold text-sm truncate">{card.name}</h3>
            <p className="text-xs text-gray-500 line-clamp-2 flex-1">
              {card.description}
            </p>
            <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
              <span>#{card.setNumber.toString().padStart(2, '0')}/{card.totalInSet}</span>
              {card.effect && (
                <span className="text-yellow-500">⚡</span>
              )}
            </div>
          </div>

          {/* Quantity badge */}
          {showQuantity && card.quantity && card.quantity > 1 && (
            <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              x{card.quantity}
            </div>
          )}

          {/* Favorite button */}
          {showFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavorite?.();
              }}
              className="absolute bottom-2 left-2 text-lg"
            >
              {card.isFavorite ? '❤️' : '🤍'}
            </button>
          )}
        </div>

        {/* Back of card */}
        <div
          className={cn(
            'absolute w-full h-full backface-hidden rounded-xl overflow-hidden rotate-y-180',
            'border-4 bg-gradient-to-br from-indigo-900 to-purple-900'
          )}
          style={{ borderColor: card.borderColor }}
        >
          <div className="w-full h-full p-4 flex flex-col items-center justify-center text-white">
            {/* Card pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
              }} />
            </div>

            <div className="relative z-10 text-center">
              <div className="text-4xl mb-4">🏠</div>
              <div className="text-lg font-bold mb-2">ChoreChamp</div>
              <div className="text-xs text-white/60">Collectible Cards</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CardGridProps {
  cards: CardData[];
  size?: 'sm' | 'md' | 'lg';
  showQuantity?: boolean;
  showFavorite?: boolean;
  lockedCardIds?: Set<string>;
  onCardClick?: (card: CardData) => void;
  onFavorite?: (cardId: string) => void;
  className?: string;
}

export function CardGrid({
  cards,
  size = 'md',
  showQuantity = false,
  showFavorite = false,
  lockedCardIds,
  onCardClick,
  onFavorite,
  className,
}: CardGridProps) {
  const gridCols = {
    sm: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8',
    md: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    lg: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[size], className)}>
      {cards.map((card) => (
        <CardDisplay
          key={card.id}
          card={card}
          size={size}
          showQuantity={showQuantity}
          showFavorite={showFavorite}
          isLocked={lockedCardIds?.has(card.id)}
          onClick={() => onCardClick?.(card)}
          onFavorite={() => onFavorite?.(card.id)}
        />
      ))}
    </div>
  );
}

interface RarityBadgeProps {
  rarity: string;
  rarityInfo: RarityInfo;
  className?: string;
}

export function RarityBadge({ rarity, rarityInfo, className }: RarityBadgeProps) {
  const stars = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5,
  }[rarity] || 1;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium',
        rarityInfo.bgColor,
        rarityInfo.color,
        className
      )}
    >
      <span>{'⭐'.repeat(stars)}</span>
      <span>{rarityInfo.label}</span>
    </div>
  );
}
