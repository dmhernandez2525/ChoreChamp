import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import { useHousehold, useMembers } from '@chorechamp/api-client';
import { useAuth } from '../context/AuthContext';
import type { GameCategory, GameDifficulty } from '@chorechamp/types';
import {
  GameGrid,
  GameLauncher,
  FamilyNightCard,
  CreateFamilyNightModal,
} from '../components/games';
import { Skeleton } from '../components/common';

interface GameData {
  id: string;
  name: string;
  description: string;
  instructions: string;
  category: GameCategory;
  icon: string;
  thumbnail: string;
  minPlayers: number;
  maxPlayers: number;
  estimatedDuration: number;
  baseXPReward: number;
  basePointReward: number;
  isUnlocked: boolean;
  unlockProgress: number;
  unlockRequired: number;
  unlockText: string;
  highScore: number;
  playCount: number;
  lastPlayedAt: string | null;
  bestDifficulty: GameDifficulty | null;
  categoryInfo: {
    label: string;
    icon: string;
    color: string;
  };
}

interface GameConfig {
  id: string;
  gameId: string;
  difficulty: GameDifficulty;
  timeLimit: number;
  targetScore: number;
  xpMultiplier: number;
  pointMultiplier: number;
  difficultyInfo: {
    label: string;
    color: string;
    bgColor: string;
    xpMultiplier: number;
  };
}

interface LeaderboardEntry {
  rank: number;
  memberId: string;
  memberName: string;
  memberColor: string;
  score: number;
  difficulty: GameDifficulty;
}

interface FamilyNightData {
  id: string;
  name: string;
  scheduledAt: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  bonusMultiplier: number;
  hostMemberId: string;
  totalGamesPlayed?: number;
  games: Array<{
    id: string;
    gameId: string;
    game: { id: string; name: string; icon: string };
    status: 'pending' | 'active' | 'completed' | 'skipped';
    winnerId: string | null;
  }>;
  participants: Array<{
    id: string;
    memberId: string;
    member: { id: string; name: string; color: string };
    totalScore: number;
    gamesWon: number;
    isReady: boolean;
  }>;
}

// API functions
async function fetchGames(householdId: string): Promise<GameData[]> {
  const response = await fetch(`/api/${householdId}/games/games`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch games');
  return response.json();
}

async function fetchGameDetails(householdId: string, gameId: string): Promise<{
  game: GameData;
  configs: GameConfig[];
  leaderboard: LeaderboardEntry[];
}> {
  const response = await fetch(`/api/${householdId}/games/games/${gameId}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch game details');
  return response.json();
}

async function startGameSession(
  householdId: string,
  gameId: string,
  difficulty: GameDifficulty
): Promise<{ session: unknown; config: unknown }> {
  const response = await fetch(`/api/${householdId}/games/games/${gameId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ difficulty }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to start game');
  }
  return response.json();
}

async function fetchFamilyNights(householdId: string): Promise<FamilyNightData[]> {
  const response = await fetch(`/api/${householdId}/games/family-nights?upcoming=true`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch family nights');
  return response.json();
}

async function createFamilyNight(
  householdId: string,
  data: {
    name: string;
    scheduledAt: string;
    gameIds: string[];
    participantIds: string[];
  }
): Promise<FamilyNightData> {
  const response = await fetch(`/api/${householdId}/games/family-nights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create family night');
  }
  return response.json();
}

async function toggleFamilyNightReady(householdId: string, nightId: string): Promise<void> {
  const response = await fetch(`/api/${householdId}/games/family-nights/${nightId}/ready`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to toggle ready status');
}

async function startFamilyNight(householdId: string, nightId: string): Promise<void> {
  const response = await fetch(`/api/${householdId}/games/family-nights/${nightId}/start`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to start family night');
}

export default function Arcade() {
  const { householdId } = useParams<{ householdId: string }>();
  const { user } = useAuth();
  const { isLoading: loadingHousehold } = useHousehold(householdId!);
  const { data: members, isLoading: loadingMembers } = useMembers(householdId!);

  const currentMember = members?.find((m) => m.userId === user?.id);

  const [games, setGames] = useState<GameData[]>([]);
  const [familyNights, setFamilyNights] = useState<FamilyNightData[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [gameDetails, setGameDetails] = useState<{
    game: GameData;
    configs: GameConfig[];
    leaderboard: LeaderboardEntry[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<GameCategory | 'all'>('all');
  const [showCreateNight, setShowCreateNight] = useState(false);
  const [isCreatingNight, setIsCreatingNight] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);

  const loadGames = useCallback(async () => {
    if (!householdId) return;

    try {
      const gamesData = await fetchGames(householdId);
      setGames(gamesData);
    } catch (err) {
      console.error('Failed to reload games:', err);
    }
  }, [householdId]);

  const loadFamilyNights = useCallback(async () => {
    if (!householdId) return;

    try {
      const nightsData = await fetchFamilyNights(householdId);
      setFamilyNights(nightsData);
    } catch (err) {
      console.error('Failed to reload family nights:', err);
    }
  }, [householdId]);

  useEffect(() => {
    async function loadData() {
      if (!householdId) return;

      setIsLoading(true);
      setError(null);

      try {
        const [gamesData, nightsData] = await Promise.all([
          fetchGames(householdId),
          fetchFamilyNights(householdId),
        ]);

        setGames(gamesData);
        setFamilyNights(nightsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load arcade data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [householdId]);

  useEffect(() => {
    async function loadGameDetails() {
      if (!householdId || !selectedGame) {
        setGameDetails(null);
        return;
      }

      try {
        const details = await fetchGameDetails(householdId, selectedGame.id);
        setGameDetails(details);
      } catch (err) {
        console.error('Failed to load game details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load game details');
      }
    }

    loadGameDetails();
  }, [householdId, selectedGame?.id]);

  const handleStartGame = async (difficulty: GameDifficulty) => {
    if (!householdId || !selectedGame) return;

    setIsStartingGame(true);
    try {
      const { session } = await startGameSession(householdId, selectedGame.id, difficulty);
      // In a real implementation, this would navigate to the game view
      // For now, we'll just show a placeholder
      console.log('Game started:', session);
      alert(`Game started! Session ID: ${(session as { id: string }).id}\n\nGame UI would be shown here.`);
      setSelectedGame(null);
      loadGames();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    } finally {
      setIsStartingGame(false);
    }
  };

  const handleCreateFamilyNight = async (data: {
    name: string;
    scheduledAt: string;
    gameIds: string[];
    participantIds: string[];
  }) => {
    if (!householdId) return;

    setIsCreatingNight(true);
    try {
      await createFamilyNight(householdId, data);
      await loadFamilyNights();
      setShowCreateNight(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create family night');
    } finally {
      setIsCreatingNight(false);
    }
  };

  const handleToggleReady = async (nightId: string) => {
    if (!householdId) return;

    try {
      await toggleFamilyNightReady(householdId, nightId);
      await loadFamilyNights();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ready status');
    }
  };

  const handleStartNight = async (nightId: string) => {
    if (!householdId) return;

    try {
      await startFamilyNight(householdId, nightId);
      await loadFamilyNights();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start family night');
    }
  };

  const categories: { id: GameCategory | 'all'; label: string; icon: string }[] = [
    { id: 'all', label: 'All Games', icon: '🎮' },
    { id: 'puzzle', label: 'Puzzle', icon: '🧩' },
    { id: 'sorting', label: 'Sorting', icon: '📦' },
    { id: 'time-challenge', label: 'Time Challenge', icon: '⏱️' },
    { id: 'memory', label: 'Memory', icon: '🧠' },
    { id: 'multiplayer', label: 'Multiplayer', icon: '👥' },
  ];

  const filteredGames = activeCategory === 'all'
    ? games
    : games.filter(g => g.category === activeCategory);

  const unlockedGames = filteredGames.filter(g => g.isUnlocked);
  const lockedGames = filteredGames.filter(g => !g.isUnlocked);

  if (isLoading || loadingHousehold || loadingMembers) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/households/${householdId}`}
              className="text-white/80 hover:text-white"
            >
              ←
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎮</span>
              <div>
                <h1 className="text-xl font-bold">Game Arcade</h1>
                <p className="text-sm text-white/80">
                  {unlockedGames.length} games unlocked
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setShowCreateNight(true)}
            variant="outline"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20"
          >
            🌙 Plan Game Night
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Upcoming Family Nights */}
        {familyNights.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Upcoming Game Nights
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {familyNights.slice(0, 2).map((night) => (
                <FamilyNightCard
                  key={night.id}
                  night={{
                    ...night,
                    scheduledAt: new Date(night.scheduledAt),
                    totalGamesPlayed: night.games.filter(g => g.status === 'completed').length,
                    participants: night.participants.map((p, i) => ({
                      ...p,
                      rank: i + 1,
                    })),
                  }}
                  currentMemberId={currentMember?.id}
                  isHost={night.hostMemberId === currentMember?.id}
                  onReady={() => handleToggleReady(night.id)}
                  onStart={() => handleStartNight(night.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Unlocked Games */}
        {unlockedGames.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Available Games
            </h2>
            <GameGrid
              games={unlockedGames}
              onGameClick={(game) => setSelectedGame(game as unknown as GameData)}
            />
          </section>
        )}

        {/* Locked Games */}
        {lockedGames.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-500 mb-4">
              Locked Games
            </h2>
            <GameGrid
              games={lockedGames}
              onGameClick={() => {}}
            />
          </section>
        )}

        {filteredGames.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl mb-2 block">🎮</span>
            <p className="text-gray-600">No games in this category</p>
          </div>
        )}
      </main>

      {/* Game Launcher Modal */}
      {selectedGame && gameDetails && (
        <GameLauncher
          game={gameDetails.game}
          configs={gameDetails.configs}
          leaderboard={gameDetails.leaderboard}
          onStart={handleStartGame}
          onClose={() => setSelectedGame(null)}
          isLoading={isStartingGame}
        />
      )}

      {/* Create Family Night Modal */}
      {members && (
        <CreateFamilyNightModal
          isOpen={showCreateNight}
          onClose={() => setShowCreateNight(false)}
          games={games.filter(g => g.isUnlocked && g.maxPlayers >= 2).map(g => ({
            id: g.id,
            name: g.name,
            icon: g.icon,
          }))}
          members={members.map(m => ({
            id: m.id,
            name: m.name,
            color: m.color || '#3B82F6',
          }))}
          onCreate={handleCreateFamilyNight}
          isLoading={isCreatingNight}
        />
      )}
    </div>
  );
}
