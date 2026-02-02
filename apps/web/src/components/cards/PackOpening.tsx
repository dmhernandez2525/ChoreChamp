import { useState, useEffect } from 'react';
import { cn } from '@chorechamp/ui';
import { CardDisplay } from './CardDisplay';

interface PackData {
  id: string;
  name: string;
  description: string;
  artwork: string;
  cardCount: number;
  pointCost: number;
  canAfford: boolean;
  guaranteedRarity: string | null;
}

interface PackCardResult {
  card: {
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
    rarityInfo: {
      color: string;
      bgColor: string;
      glowColor: string;
      label: string;
    };
  };
  isNew: boolean;
  isDuplicate: boolean;
  animation: 'normal' | 'shine' | 'holographic' | 'rainbow';
}

interface PackOpenResult {
  packId: string;
  packName: string;
  cards: PackCardResult[];
  newCards: number;
  duplicateCards: number;
  totalPointsValue: number;
}

interface PackCardProps {
  pack: PackData;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function PackCard({ pack, onClick, disabled, className }: PackCardProps) {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={cn(
        'relative overflow-hidden rounded-2xl transition-all duration-300',
        'bg-gradient-to-br from-indigo-500 to-purple-600',
        !disabled && pack.canAfford && 'cursor-pointer hover:scale-105 hover:shadow-xl',
        disabled && 'opacity-50 cursor-not-allowed',
        !pack.canAfford && !disabled && 'opacity-75',
        className
      )}
    >
      {/* Pack artwork */}
      <div className="relative aspect-[3/4] p-4">
        {pack.artwork ? (
          <img
            src={pack.artwork}
            alt={pack.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl">📦</span>
          </div>
        )}

        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer" />
      </div>

      {/* Pack info */}
      <div className="bg-white p-4">
        <h3 className="font-bold text-lg text-gray-900">{pack.name}</h3>
        <p className="text-sm text-gray-500 mb-3">{pack.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-yellow-500">🪙</span>
            <span className={cn(
              'font-bold',
              pack.canAfford ? 'text-gray-900' : 'text-red-500'
            )}>
              {pack.pointCost} pts
            </span>
          </div>
          <div className="text-sm text-gray-400">
            {pack.cardCount} cards
          </div>
        </div>

        {pack.guaranteedRarity && (
          <div className="mt-2 text-xs text-green-600 font-medium">
            ✨ Guaranteed {pack.guaranteedRarity}+ card!
          </div>
        )}
      </div>

      {/* Cannot afford overlay */}
      {!pack.canAfford && !disabled && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
            Not Enough Points
          </span>
        </div>
      )}
    </div>
  );
}

interface PackOpeningModalProps {
  isOpen: boolean;
  results: PackOpenResult[];
  onClose: () => void;
  onOpenAnother?: () => void;
}

export function PackOpeningModal({
  isOpen,
  results,
  onClose,
  onOpenAnother,
}: PackOpeningModalProps) {
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());
  const [isRevealing, setIsRevealing] = useState(true);

  const currentResult = results[currentResultIndex];
  const allCards = currentResult?.cards || [];

  useEffect(() => {
    if (!isOpen || !currentResult) return;

    setRevealedCards(new Set());
    setIsRevealing(true);

    // Reveal cards one by one
    let index = 0;
    const interval = setInterval(() => {
      if (index < allCards.length) {
        setRevealedCards(prev => new Set([...prev, index]));
        index++;
      } else {
        setIsRevealing(false);
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen, currentResultIndex, allCards.length, currentResult]);

  if (!isOpen || !currentResult) return null;

  const handleNextPack = () => {
    if (currentResultIndex < results.length - 1) {
      setCurrentResultIndex(currentResultIndex + 1);
    }
  };

  const totalNewCards = results.reduce((sum, r) => sum + r.newCards, 0);
  const totalDuplicates = results.reduce((sum, r) => sum + r.duplicateCards, 0);
  const totalPointsValue = results.reduce((sum, r) => sum + r.totalPointsValue, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-gradient-to-b from-indigo-900 to-purple-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">
            {currentResult.packName} Opened!
          </h2>
          <p className="text-white/70">
            {results.length > 1 && `Pack ${currentResultIndex + 1} of ${results.length}`}
          </p>
        </div>

        {/* Cards reveal area */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-5 gap-4 min-h-[300px]">
            {allCards.map((packCard, index) => (
              <div
                key={index}
                className={cn(
                  'transition-all duration-500',
                  revealedCards.has(index)
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-75'
                )}
              >
                {revealedCards.has(index) ? (
                  <div className="relative">
                    <CardDisplay
                      card={packCard.card}
                      size="sm"
                      showQuantity={false}
                      showFavorite={false}
                    />
                    {packCard.isNew && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                        NEW!
                      </div>
                    )}
                    {packCard.isDuplicate && (
                      <div className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        +1
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-32 h-44 rounded-xl bg-white/10 animate-pulse flex items-center justify-center">
                    <span className="text-4xl">❓</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        {!isRevealing && (
          <div className="bg-white p-6">
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{totalNewCards}</div>
                <div className="text-sm text-gray-500">New Cards</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-500">{totalDuplicates}</div>
                <div className="text-sm text-gray-500">Duplicates</div>
              </div>
              {totalPointsValue > 0 && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">+{totalPointsValue}</div>
                  <div className="text-sm text-gray-500">Pts (Dupes)</div>
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              {currentResultIndex < results.length - 1 ? (
                <button
                  onClick={handleNextPack}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-colors"
                >
                  Next Pack →
                </button>
              ) : (
                <>
                  {onOpenAnother && (
                    <button
                      onClick={onOpenAnother}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-colors"
                    >
                      Open Another
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface PackStoreProps {
  packs: PackData[];
  memberPoints: number;
  onOpenPack: (packId: string, quantity: number) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function PackStore({
  packs,
  memberPoints,
  onOpenPack,
  isLoading,
  className,
}: PackStoreProps) {
  const [selectedPack, setSelectedPack] = useState<PackData | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isOpening, setIsOpening] = useState(false);

  const handleOpenPack = async () => {
    if (!selectedPack) return;

    setIsOpening(true);
    try {
      await onOpenPack(selectedPack.id, quantity);
    } finally {
      setIsOpening(false);
      setSelectedPack(null);
      setQuantity(1);
    }
  };

  const maxAffordable = selectedPack
    ? Math.floor(memberPoints / selectedPack.pointCost)
    : 0;

  return (
    <div className={className}>
      {/* Points display */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Card Packs</h2>
        <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-medium">
          <span>🪙</span>
          <span>{memberPoints} pts</span>
        </div>
      </div>

      {/* Pack grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {packs.map((pack) => (
          <PackCard
            key={pack.id}
            pack={{ ...pack, canAfford: memberPoints >= pack.pointCost }}
            onClick={() => setSelectedPack(pack)}
            disabled={isLoading}
          />
        ))}
      </div>

      {/* Purchase modal */}
      {selectedPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Open {selectedPack.name}
              </h3>

              <div className="flex justify-center mb-6">
                <PackCard pack={selectedPack} className="w-48" />
              </div>

              {/* Quantity selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity (Max: {Math.min(maxAffordable, 10)})
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(Math.min(maxAffordable, 10), quantity + 1))}
                    className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total cost */}
              <div className="bg-gray-100 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Cost</span>
                  <span className="text-xl font-bold text-gray-900">
                    🪙 {selectedPack.pointCost * quantity} pts
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500 mt-1">
                  <span>Remaining after purchase</span>
                  <span>{memberPoints - (selectedPack.pointCost * quantity)} pts</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setSelectedPack(null);
                    setQuantity(1);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOpenPack}
                  disabled={isOpening || memberPoints < selectedPack.pointCost * quantity}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-colors disabled:opacity-50"
                >
                  {isOpening ? 'Opening...' : `Open ${quantity > 1 ? `${quantity} Packs` : 'Pack'}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
