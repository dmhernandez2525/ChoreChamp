// Collectible Card System Logic (F9.4)

import type {
  CardRarity,
  CardCategory,
  RarityWeights,
  PackOpenResult,
  PackCard,
  Card,
  CollectionStats,
  SetProgress,
} from '@chorechamp/types';

// Rarity configuration
export const RARITY_CONFIG: Record<CardRarity, {
  color: string;
  bgColor: string;
  glowColor: string;
  animation: PackCard['animation'];
  pointsMultiplier: number;
}> = {
  common: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    glowColor: '#9CA3AF',
    animation: 'normal',
    pointsMultiplier: 1,
  },
  uncommon: {
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    glowColor: '#10B981',
    animation: 'normal',
    pointsMultiplier: 1.5,
  },
  rare: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    glowColor: '#3B82F6',
    animation: 'shine',
    pointsMultiplier: 2.5,
  },
  epic: {
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    glowColor: '#8B5CF6',
    animation: 'holographic',
    pointsMultiplier: 5,
  },
  legendary: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    glowColor: '#F59E0B',
    animation: 'rainbow',
    pointsMultiplier: 10,
  },
};

// Category configuration
export const CATEGORY_CONFIG: Record<CardCategory, {
  label: string;
  icon: string;
  color: string;
  description: string;
}> = {
  chore_heroes: {
    label: 'Chore Heroes',
    icon: '🦸',
    color: 'text-blue-600',
    description: 'Characters that help with chores',
  },
  power_ups: {
    label: 'Power-Ups',
    icon: '⚡',
    color: 'text-yellow-600',
    description: 'Special abilities and boosts',
  },
  locations: {
    label: 'Locations',
    icon: '🏠',
    color: 'text-green-600',
    description: 'Rooms and areas of the home',
  },
  tools: {
    label: 'Tools',
    icon: '🧹',
    color: 'text-orange-600',
    description: 'Cleaning and organizing tools',
  },
  seasonal: {
    label: 'Seasonal',
    icon: '🎄',
    color: 'text-red-600',
    description: 'Limited edition event cards',
  },
  achievements: {
    label: 'Achievements',
    icon: '🏆',
    color: 'text-purple-600',
    description: 'Milestone celebration cards',
  },
};

// Pack opening configuration
export const PACK_CONFIG = {
  // Animation durations (ms)
  cardRevealDelay: 500,
  cardFlipDuration: 800,
  shineAnimationDuration: 1500,

  // Trade configuration
  tradeExpirationHours: 72,
  maxCardsPerTrade: 10,
  minTradableQuantity: 1, // Keep at least 1 of each card

  // Collection bonuses
  setCompletionXPBonus: 100,
  favoriteCardLimit: 50,
  showcaseCardLimit: 6,

  // Duplicate conversion rates (percentage of point value)
  duplicateConversionRate: 0.5,
};

/**
 * Select a random rarity based on weights
 */
export function selectRandomRarity(weights: RarityWeights): CardRarity {
  const total = weights.common + weights.uncommon + weights.rare + weights.epic + weights.legendary;
  let random = Math.random() * total;

  if (random < weights.common) return 'common';
  random -= weights.common;

  if (random < weights.uncommon) return 'uncommon';
  random -= weights.uncommon;

  if (random < weights.rare) return 'rare';
  random -= weights.rare;

  if (random < weights.epic) return 'epic';

  return 'legendary';
}

/**
 * Select a random card from a pool filtered by rarity
 */
export function selectRandomCard(
  availableCards: Card[],
  rarity: CardRarity
): Card | null {
  const filtered = availableCards.filter(c => c.rarity === rarity);
  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

/**
 * Open a pack and get cards
 */
export function openPack(
  packId: string,
  packName: string,
  cardCount: number,
  rarityWeights: RarityWeights,
  guaranteedRarity: CardRarity | null,
  availableCards: Card[],
  ownedCardIds: Set<string>
): PackOpenResult {
  const cards: PackCard[] = [];
  let newCards = 0;
  let duplicateCards = 0;
  let totalPointsValue = 0;

  for (let i = 0; i < cardCount; i++) {
    // First card uses guaranteed rarity if specified
    const rarity = (i === 0 && guaranteedRarity)
      ? guaranteedRarity
      : selectRandomRarity(rarityWeights);

    const card = selectRandomCard(availableCards, rarity);

    if (card) {
      const isNew = !ownedCardIds.has(card.id);
      const isDuplicate = !isNew;

      if (isNew) {
        newCards++;
        ownedCardIds.add(card.id);
      } else {
        duplicateCards++;
        totalPointsValue += Math.floor((card.pointsValue || 10) * PACK_CONFIG.duplicateConversionRate);
      }

      cards.push({
        card,
        isNew,
        isDuplicate,
        animation: RARITY_CONFIG[card.rarity as CardRarity].animation,
      });
    }
  }

  // Sort cards by rarity (highest first for reveal)
  const rarityOrder: CardRarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
  cards.sort((a, b) =>
    rarityOrder.indexOf(a.card.rarity as CardRarity) -
    rarityOrder.indexOf(b.card.rarity as CardRarity)
  );

  return {
    packId,
    packName,
    cards,
    newCards,
    duplicateCards,
    totalPointsValue,
  };
}

/**
 * Calculate rarity from number
 */
export function getRarityLevel(rarity: CardRarity): number {
  const levels: Record<CardRarity, number> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5,
  };
  return levels[rarity];
}

/**
 * Get the highest rarity from a list of cards
 */
export function getHighestRarity(cards: Array<{ rarity: CardRarity }>): CardRarity {
  let highest: CardRarity = 'common';
  let highestLevel = 0;

  for (const card of cards) {
    const level = getRarityLevel(card.rarity);
    if (level > highestLevel) {
      highestLevel = level;
      highest = card.rarity;
    }
  }

  return highest;
}

/**
 * Calculate collection completion percentage
 */
export function calculateCompletionPercentage(
  uniqueOwned: number,
  totalCards: number
): number {
  if (totalCards === 0) return 0;
  return Math.round((uniqueOwned / totalCards) * 100);
}

/**
 * Calculate set progress
 */
export function calculateSetProgress(
  setId: string,
  setName: string,
  setCards: Card[],
  ownedCardIds: Set<string>
): SetProgress {
  const totalCards = setCards.length;
  const ownedInSet = setCards.filter(c => ownedCardIds.has(c.id));
  const cardsOwned = ownedInSet.length;
  const missingCards = setCards.filter(c => !ownedCardIds.has(c.id)).map(c => c.id);
  const isComplete = cardsOwned === totalCards;

  return {
    setId,
    setName,
    cardsOwned,
    totalCards,
    completionPercentage: calculateCompletionPercentage(cardsOwned, totalCards),
    missingCards,
    isComplete,
    bonusUnlocked: isComplete,
  };
}

/**
 * Calculate collection stats
 */
export function calculateCollectionStats(
  ownedCards: Array<{ cardId: string; quantity: number; isFavorite: boolean }>,
  allCards: Card[],
  packsOpened: number
): CollectionStats {
  const uniqueCardsOwned = ownedCards.length;
  const totalCardsOwned = ownedCards.reduce((sum, c) => sum + c.quantity, 0);
  const favoriteCount = ownedCards.filter(c => c.isFavorite).length;
  const tradableCount = ownedCards.filter(c => c.quantity > 1).reduce((sum, c) => sum + c.quantity - 1, 0);

  // Build owned card lookup
  const ownedCardIds = new Set(ownedCards.map(c => c.cardId));

  // Count by rarity
  const rarityCounts: Record<CardRarity, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };

  // Count by category
  const categoryCounts: Record<CardCategory, number> = {
    chore_heroes: 0,
    power_ups: 0,
    locations: 0,
    tools: 0,
    seasonal: 0,
    achievements: 0,
  };

  for (const owned of ownedCards) {
    const card = allCards.find(c => c.id === owned.cardId);
    if (card) {
      rarityCounts[card.rarity as CardRarity] += owned.quantity;
      categoryCounts[card.category as CardCategory] += owned.quantity;
    }
  }

  // Find completed sets
  const setGroups = new Map<string, Card[]>();
  for (const card of allCards) {
    if (!setGroups.has(card.setId)) {
      setGroups.set(card.setId, []);
    }
    setGroups.get(card.setId)!.push(card);
  }

  const completedSets: string[] = [];
  for (const [setId, setCards] of setGroups) {
    const allOwned = setCards.every(c => ownedCardIds.has(c.id));
    if (allOwned) {
      completedSets.push(setId);
    }
  }

  return {
    totalCardsOwned,
    uniqueCardsOwned,
    totalCardsInGame: allCards.length,
    completionPercentage: calculateCompletionPercentage(uniqueCardsOwned, allCards.length),
    favoriteCount,
    tradableCount,
    rarityCounts,
    categoryCounts,
    completedSets,
    packsOpened,
  };
}

/**
 * Validate a trade offer
 */
export function validateTradeOffer(
  offeredCards: Array<{ cardId: string; quantity: number }>,
  requestedCards: Array<{ cardId: string; quantity: number }>,
  initiatorOwned: Map<string, number>,
  targetOwned: Map<string, number>
): { valid: boolean; error?: string } {
  // Check max cards per trade
  const totalOffered = offeredCards.reduce((sum, c) => sum + c.quantity, 0);
  const totalRequested = requestedCards.reduce((sum, c) => sum + c.quantity, 0);

  if (totalOffered > PACK_CONFIG.maxCardsPerTrade) {
    return { valid: false, error: `Cannot offer more than ${PACK_CONFIG.maxCardsPerTrade} cards` };
  }

  if (totalRequested > PACK_CONFIG.maxCardsPerTrade) {
    return { valid: false, error: `Cannot request more than ${PACK_CONFIG.maxCardsPerTrade} cards` };
  }

  // Check initiator has enough cards
  for (const { cardId, quantity } of offeredCards) {
    const owned = initiatorOwned.get(cardId) || 0;
    if (owned < quantity + PACK_CONFIG.minTradableQuantity) {
      return { valid: false, error: `Not enough copies of card to trade` };
    }
  }

  // Check target has requested cards
  for (const { cardId, quantity } of requestedCards) {
    const owned = targetOwned.get(cardId) || 0;
    if (owned < quantity + PACK_CONFIG.minTradableQuantity) {
      return { valid: false, error: `Target doesn't have enough copies of requested card` };
    }
  }

  return { valid: true };
}

/**
 * Calculate point value for duplicate conversion
 */
export function calculateDuplicateValue(card: Card, quantity: number): number {
  const baseValue = card.pointsValue || 10;
  return Math.floor(baseValue * PACK_CONFIG.duplicateConversionRate * quantity);
}

/**
 * Get card rarity display info
 */
export function getRarityInfo(rarity: CardRarity) {
  return {
    ...RARITY_CONFIG[rarity],
    label: rarity.charAt(0).toUpperCase() + rarity.slice(1),
    level: getRarityLevel(rarity),
  };
}

/**
 * Get category display info
 */
export function getCardCategoryInfo(category: CardCategory) {
  return CATEGORY_CONFIG[category];
}

/**
 * Format card number display (e.g., "#05/15")
 */
export function formatCardNumber(setNumber: number, totalInSet: number): string {
  const num = setNumber.toString().padStart(2, '0');
  const total = totalInSet.toString().padStart(2, '0');
  return `#${num}/${total}`;
}

/**
 * Check if a card effect is active
 */
export function isEffectActive(
  activatedAt: Date,
  durationHours: number | undefined
): boolean {
  if (!durationHours) return true; // Permanent effect

  const now = new Date();
  const expiresAt = new Date(activatedAt.getTime() + durationHours * 60 * 60 * 1000);
  return now < expiresAt;
}

/**
 * Calculate remaining effect time
 */
export function getEffectTimeRemaining(
  activatedAt: Date,
  durationHours: number
): { hours: number; minutes: number; expired: boolean } {
  const now = new Date();
  const expiresAt = new Date(activatedAt.getTime() + durationHours * 60 * 60 * 1000);
  const remainingMs = expiresAt.getTime() - now.getTime();

  if (remainingMs <= 0) {
    return { hours: 0, minutes: 0, expired: true };
  }

  const hours = Math.floor(remainingMs / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

  return { hours, minutes, expired: false };
}
