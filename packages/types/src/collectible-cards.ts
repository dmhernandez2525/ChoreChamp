// Collectible Card System Types (F9.4)

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type CardCategory =
  | 'chore_heroes'      // Characters that help with chores
  | 'power_ups'         // Special abilities
  | 'locations'         // Rooms/areas of the house
  | 'tools'             // Cleaning/organizing tools
  | 'seasonal'          // Holiday/event cards
  | 'achievements';     // Achievement milestone cards

export type PackType =
  | 'basic'             // Common cards, cheap
  | 'premium'           // Better chances for rare
  | 'legendary'         // Guaranteed rare or better
  | 'seasonal'          // Limited time packs
  | 'achievement';      // Earned through gameplay

// Card definition (global template)
export interface Card {
  id: string;
  name: string;
  description: string;
  flavorText: string | null;
  category: CardCategory;
  rarity: CardRarity;
  artwork: string;           // URL or asset key
  borderColor: string;       // Hex color for card frame
  effect?: CardEffect;       // Special ability if any
  setId: string;             // Which set this belongs to
  setNumber: number;         // Card number in set
  totalInSet: number;        // Total cards in set
  pointsValue?: number;      // Value when converting duplicates
  isActive: boolean;
  releasedAt: Date;
  retiredAt: Date | null;    // No longer obtainable after
}

// Card effect for power-up cards
export interface CardEffect {
  type: 'xp_boost' | 'point_boost' | 'streak_shield' | 'bonus_spin' | 'instant_reward';
  value: number;
  duration?: number;          // Hours, if temporary
  description: string;
}

// Card set definition
export interface CardSet {
  id: string;
  name: string;
  description: string;
  theme: string;
  totalCards: number;
  releaseDate: Date;
  endDate: Date | null;
  bonusEffect?: SetBonusEffect;
}

// Bonus for completing a set
export interface SetBonusEffect {
  type: 'xp_multiplier' | 'point_multiplier' | 'unlock_reward' | 'special_badge';
  value: number;
  description: string;
}

// Member's owned card instance
export interface OwnedCard {
  id: string;
  cardId: string;
  memberId: string;
  householdId: string;
  quantity: number;
  isFavorite: boolean;
  isNew: boolean;            // Not yet viewed
  firstObtainedAt: Date;
  lastObtainedAt: Date;
}

// Card pack definition
export interface CardPack {
  id: string;
  name: string;
  description: string;
  packType: PackType;
  artwork: string;
  cardCount: number;         // Cards per pack
  pointCost: number;         // Cost in points
  coinCost: number | null;   // Premium currency cost
  guaranteedRarity: CardRarity | null;
  rarityWeights: RarityWeights;
  isActive: boolean;
  availableFrom: Date | null;
  availableUntil: Date | null;
}

// Rarity probability weights
export interface RarityWeights {
  common: number;
  uncommon: number;
  rare: number;
  epic: number;
  legendary: number;
}

// Pack opening result
export interface PackOpenResult {
  packId: string;
  packName: string;
  cards: PackCard[];
  newCards: number;          // Count of cards not previously owned
  duplicateCards: number;
  totalPointsValue: number;  // Value if dupes were converted
}

export interface PackCard {
  card: Card;
  isNew: boolean;
  isDuplicate: boolean;
  animation: 'normal' | 'shine' | 'holographic' | 'rainbow';
}

// Card trade request
export interface CardTrade {
  id: string;
  householdId: string;
  initiatorMemberId: string;
  targetMemberId: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
  offeredCards: TradeCard[];
  requestedCards: TradeCard[];
  message: string | null;
  createdAt: Date;
  respondedAt: Date | null;
  expiresAt: Date;
}

export interface TradeCard {
  cardId: string;
  quantity: number;
}

// Wishlist entry
export interface CardWishlist {
  id: string;
  memberId: string;
  cardId: string;
  priority: number;          // 1 = most wanted
  addedAt: Date;
}

// Collection stats
export interface CollectionStats {
  totalCardsOwned: number;
  uniqueCardsOwned: number;
  totalCardsInGame: number;
  completionPercentage: number;
  favoriteCount: number;
  tradableCount: number;
  rarityCounts: Record<CardRarity, number>;
  categoryCounts: Record<CardCategory, number>;
  completedSets: string[];
  packsOpened: number;
}

// Set completion progress
export interface SetProgress {
  setId: string;
  setName: string;
  cardsOwned: number;
  totalCards: number;
  completionPercentage: number;
  missingCards: string[];    // Card IDs
  isComplete: boolean;
  bonusUnlocked: boolean;
}

// Card album view
export interface CardAlbum {
  sets: AlbumSet[];
  totalOwned: number;
  totalCards: number;
  completionPercentage: number;
}

export interface AlbumSet {
  set: CardSet;
  cards: AlbumCard[];
  progress: SetProgress;
}

export interface AlbumCard {
  card: Card;
  isOwned: boolean;
  quantity: number;
  isFavorite: boolean;
}

// Showcase display for profile
export interface CardShowcase {
  id: string;
  memberId: string;
  title: string;
  cardIds: string[];         // Up to 6 featured cards
  layout: 'grid' | 'row' | 'featured';
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Daily/weekly card reward
export interface CardReward {
  id: string;
  type: 'daily_login' | 'weekly_challenge' | 'achievement' | 'chore_milestone' | 'event';
  rewardType: 'specific_card' | 'random_card' | 'pack';
  cardId: string | null;     // If specific card
  packId: string | null;     // If pack
  rarity: CardRarity | null; // If random card of rarity
  quantity: number;
  description: string;
}

// API Request/Response types
export interface OpenPackRequest {
  packId: string;
  quantity?: number;         // Open multiple at once
}

export interface OpenPackResponse {
  results: PackOpenResult[];
  pointsSpent: number;
  newCollection: CollectionStats;
}

export interface CreateCardTradeRequest {
  targetMemberId: string;
  offeredCards: TradeCard[];
  requestedCards: TradeCard[];
  message?: string;
}

export interface RespondToCardTradeRequest {
  action: 'accept' | 'decline';
}

export interface UpdateCardShowcaseRequest {
  title?: string;
  cardIds?: string[];
  layout?: 'grid' | 'row' | 'featured';
  isPublic?: boolean;
}

export interface CardFilterOptions {
  category?: CardCategory;
  rarity?: CardRarity;
  setId?: string;
  owned?: boolean;
  favorites?: boolean;
  tradable?: boolean;
  search?: string;
  sortBy?: 'name' | 'rarity' | 'recent' | 'setNumber';
  sortOrder?: 'asc' | 'desc';
}
