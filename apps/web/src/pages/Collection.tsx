import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import { useHousehold, useMembers } from '@chorechamp/api-client';
import { useAuth } from '../context/AuthContext';
import { CardGrid, PackStore, PackOpeningModal } from '../components/cards';
import { Skeleton } from '../components/common';

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
  rarityInfo: {
    color: string;
    bgColor: string;
    glowColor: string;
    label: string;
  };
  quantity?: number;
  isFavorite?: boolean;
  isNew?: boolean;
}

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

interface CollectionStats {
  totalCardsOwned: number;
  uniqueCardsOwned: number;
  totalCardsInGame: number;
  completionPercentage: number;
  favoriteCount: number;
  packsOpened: number;
}

interface SetData {
  id: string;
  name: string;
  description: string;
  totalCards: number;
  cardsOwned: number;
  isComplete: boolean;
}

interface PackOpenResult {
  packId: string;
  packName: string;
  cards: Array<{
    card: CardData;
    isNew: boolean;
    isDuplicate: boolean;
    animation: 'normal' | 'shine' | 'holographic' | 'rainbow';
  }>;
  newCards: number;
  duplicateCards: number;
  totalPointsValue: number;
}

// API Functions
async function fetchCollection(householdId: string, filters?: { category?: string; rarity?: string; favorites?: boolean }): Promise<{ cards: CardData[]; stats: CollectionStats }> {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.rarity) params.set('rarity', filters.rarity);
  if (filters?.favorites) params.set('favorites', 'true');

  const response = await fetch(`/api/${householdId}/cards/collection?${params}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch collection');
  return response.json();
}

async function fetchSets(householdId: string): Promise<SetData[]> {
  const response = await fetch(`/api/${householdId}/cards/sets`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch sets');
  return response.json();
}

async function fetchPacks(householdId: string): Promise<PackData[]> {
  const response = await fetch(`/api/${householdId}/cards/packs`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch packs');
  return response.json();
}

async function openPack(householdId: string, packId: string, quantity: number): Promise<{ results: PackOpenResult[] }> {
  const response = await fetch(`/api/${householdId}/cards/packs/${packId}/open`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ packId, quantity }),
  });
  if (!response.ok) throw new Error('Failed to open pack');
  return response.json();
}

async function toggleFavorite(householdId: string, cardId: string): Promise<void> {
  const response = await fetch(`/api/${householdId}/cards/${cardId}/favorite`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to toggle favorite');
}

const CATEGORIES = [
  { id: 'all', label: 'All Cards', icon: '📚' },
  { id: 'chore_heroes', label: 'Chore Heroes', icon: '🦸' },
  { id: 'power_ups', label: 'Power-Ups', icon: '⚡' },
  { id: 'locations', label: 'Locations', icon: '🏠' },
  { id: 'tools', label: 'Tools', icon: '🧹' },
  { id: 'seasonal', label: 'Seasonal', icon: '🎄' },
];

const RARITIES = [
  { id: 'all', label: 'All Rarities' },
  { id: 'common', label: 'Common' },
  { id: 'uncommon', label: 'Uncommon' },
  { id: 'rare', label: 'Rare' },
  { id: 'epic', label: 'Epic' },
  { id: 'legendary', label: 'Legendary' },
];

export default function Collection() {
  const { householdId } = useParams<{ householdId: string }>();
  const { user } = useAuth();
  const { isLoading: loadingHousehold } = useHousehold(householdId!);
  const { data: members, isLoading: loadingMembers } = useMembers(householdId!);

  const currentMember = members?.find((m) => m.userId === user?.id);

  const [activeTab, setActiveTab] = useState<'collection' | 'packs' | 'sets'>('collection');
  const [cards, setCards] = useState<CardData[]>([]);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [sets, setSets] = useState<SetData[]>([]);
  const [packs, setPacks] = useState<PackData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [packResults, setPackResults] = useState<PackOpenResult[] | null>(null);

  const loadData = useCallback(async () => {
    if (!householdId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [collectionData, setsData, packsData] = await Promise.all([
        fetchCollection(householdId, {
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          rarity: selectedRarity !== 'all' ? selectedRarity : undefined,
          favorites: showFavorites,
        }),
        fetchSets(householdId),
        fetchPacks(householdId),
      ]);

      setCards(collectionData.cards);
      setStats(collectionData.stats);
      setSets(setsData);
      setPacks(packsData);
    } catch (err) {
      setError('Failed to load collection data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [householdId, selectedCategory, selectedRarity, showFavorites]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenPack = async (packId: string, quantity: number) => {
    if (!householdId) return;

    const result = await openPack(householdId, packId, quantity);
    setPackResults(result.results);
    // Refresh data after pack opening
    loadData();
  };

  const handleToggleFavorite = async (cardId: string) => {
    if (!householdId) return;

    try {
      await toggleFavorite(householdId, cardId);
      setCards(prev => prev.map(card =>
        card.id === cardId ? { ...card, isFavorite: !card.isFavorite } : card
      ));
    } catch {
      console.error('Failed to toggle favorite');
    }
  };

  if (loadingHousehold || loadingMembers) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to={`/households/${householdId}`}
              className="rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors"
            >
              <span className="text-xl">←</span>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Card Collection</h1>
              <p className="text-white/80">Collect, trade, and show off your cards!</p>
            </div>
          </div>

          {/* Stats bar */}
          {stats && (
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{stats.uniqueCardsOwned}</div>
                <div className="text-sm text-white/70">Unique Cards</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{stats.completionPercentage}%</div>
                <div className="text-sm text-white/70">Complete</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{stats.packsOpened}</div>
                <div className="text-sm text-white/70">Packs Opened</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{currentMember?.pointsCurrent || 0}</div>
                <div className="text-sm text-white/70">Points</div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-4">
            {[
              { id: 'collection', label: 'My Cards', icon: '📚' },
              { id: 'packs', label: 'Shop', icon: '📦' },
              { id: 'sets', label: 'Sets', icon: '📋' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {activeTab === 'collection' && (
          <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              {/* Category filter */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Rarity filter */}
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="rounded-lg border-gray-300 text-sm"
              >
                {RARITIES.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>

              {/* Favorites toggle */}
              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  showFavorites
                    ? 'bg-red-100 text-red-600'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{showFavorites ? '❤️' : '🤍'}</span>
                <span>Favorites</span>
              </button>
            </div>

            {/* Card grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : cards.length > 0 ? (
              <CardGrid
                cards={cards}
                size="md"
                showQuantity
                showFavorite
                onFavorite={handleToggleFavorite}
              />
            ) : (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">📭</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No cards yet!</h3>
                <p className="text-gray-500 mb-4">Open some packs to start your collection</p>
                <Button onClick={() => setActiveTab('packs')}>
                  Visit Shop
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'packs' && (
          <PackStore
            packs={packs}
            memberPoints={currentMember?.pointsCurrent || 0}
            onOpenPack={handleOpenPack}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'sets' && (
          <div className="space-y-4">
            {sets.map((set) => (
              <div
                key={set.id}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{set.name}</h3>
                    <p className="text-sm text-gray-500">{set.description}</p>
                  </div>
                  {set.isComplete && (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      ✓ Complete
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{set.cardsOwned} / {set.totalCards} cards</span>
                    <span>{Math.round((set.cardsOwned / set.totalCards) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${(set.cardsOwned / set.totalCards) * 100}%` }}
                    />
                  </div>
                </div>

                <Link
                  to={`/households/${householdId}/collection/sets/${set.id}`}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  View Set →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pack opening modal */}
      {packResults && (
        <PackOpeningModal
          isOpen={true}
          results={packResults}
          onClose={() => setPackResults(null)}
          onOpenAnother={() => {
            setPackResults(null);
            setActiveTab('packs');
          }}
        />
      )}
    </div>
  );
}
