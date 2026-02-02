import { useState } from 'react';
import { cn } from '@chorechamp/ui';

interface FamilyNightGame {
  id: string;
  gameId: string;
  game: {
    id: string;
    name: string;
    icon: string;
  };
  status: 'pending' | 'active' | 'completed' | 'skipped';
  winnerId: string | null;
}

interface FamilyNightParticipant {
  id: string;
  memberId: string;
  member: {
    id: string;
    name: string;
    color: string;
  };
  totalScore: number;
  gamesWon: number;
  isReady: boolean;
  rank: number;
}

interface FamilyNightData {
  id: string;
  name: string;
  scheduledAt: Date;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  bonusMultiplier: number;
  totalGamesPlayed: number;
  host?: {
    id: string;
    name: string;
    color: string;
  };
  games: FamilyNightGame[];
  participants: FamilyNightParticipant[];
}

interface FamilyNightCardProps {
  night: FamilyNightData;
  onClick?: () => void;
  onStart?: () => void;
  onReady?: () => void;
  currentMemberId?: string;
  isHost?: boolean;
  className?: string;
}

export function FamilyNightCard({
  night,
  onClick,
  onStart,
  onReady,
  currentMemberId,
  isHost,
  className,
}: FamilyNightCardProps) {
  const scheduledDate = new Date(night.scheduledAt);
  const isUpcoming = night.status === 'scheduled' && scheduledDate > new Date();
  const isLive = night.status === 'active';

  const currentParticipant = night.participants.find(p => p.memberId === currentMemberId);
  const allReady = night.participants.every(p => p.isReady);

  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden shadow-lg',
        isLive ? 'ring-2 ring-green-500 ring-offset-2' : '',
        className
      )}
    >
      {/* Header */}
      <div className={cn(
        'p-4 text-white',
        isLive
          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
          : night.status === 'completed'
            ? 'bg-gradient-to-r from-gray-500 to-gray-600'
            : 'bg-gradient-to-r from-purple-500 to-pink-500'
      )}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎮</span>
              <h3 className="text-lg font-bold">{night.name}</h3>
            </div>
            <p className="text-white/80 text-sm mt-1">
              {formatDate(scheduledDate)}
            </p>
          </div>
          <div className="text-right">
            {isLive && (
              <span className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-sm font-medium">
                <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                Live
              </span>
            )}
            {night.status === 'completed' && (
              <span className="bg-white/20 rounded-full px-3 py-1 text-sm font-medium">
                Completed
              </span>
            )}
            {isUpcoming && (
              <span className="bg-white/20 rounded-full px-3 py-1 text-sm font-medium">
                Upcoming
              </span>
            )}
          </div>
        </div>

        {/* Bonus indicator */}
        <div className="mt-2 inline-flex items-center gap-1 bg-yellow-400/20 rounded-full px-3 py-1 text-sm">
          <span>✨</span>
          <span>{night.bonusMultiplier}% XP Bonus!</span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white p-4">
        {/* Games */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase">Games</p>
          <div className="flex flex-wrap gap-2">
            {night.games.map((game) => (
              <div
                key={game.id}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1',
                  game.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : game.status === 'active'
                      ? 'bg-blue-100 text-blue-700 animate-pulse'
                      : 'bg-gray-100 text-gray-600'
                )}
              >
                <span className="text-lg">{game.game.icon}</span>
                <span className="text-sm font-medium">{game.game.name}</span>
                {game.status === 'completed' && <span>✓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Participants */}
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase">Participants</p>
          <div className="flex flex-wrap gap-3">
            {night.participants.map((participant) => (
              <div
                key={participant.id}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2',
                  participant.isReady ? 'bg-green-50' : 'bg-gray-50'
                )}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm relative"
                  style={{ backgroundColor: participant.member.color || '#3B82F6' }}
                >
                  {participant.member.name.charAt(0).toUpperCase()}
                  {participant.isReady && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white">
                      ✓
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{participant.member.name}</p>
                  {night.status === 'active' || night.status === 'completed' ? (
                    <p className="text-xs text-gray-500">
                      {participant.totalScore} pts • {participant.gamesWon} wins
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      {participant.isReady ? 'Ready!' : 'Not ready'}
                    </p>
                  )}
                </div>
                {night.status === 'completed' && participant.rank <= 3 && (
                  <span className="text-xl">
                    {participant.rank === 1 ? '🥇' : participant.rank === 2 ? '🥈' : '🥉'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {night.status === 'scheduled' && (
          <div className="mt-4 flex gap-3">
            {currentParticipant && !currentParticipant.isReady && (
              <button
                onClick={onReady}
                className="flex-1 rounded-lg bg-green-500 px-4 py-2 font-medium text-white hover:bg-green-600 transition-colors"
              >
                Mark Ready
              </button>
            )}
            {currentParticipant?.isReady && !isHost && (
              <button
                onClick={onReady}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Not Ready
              </button>
            )}
            {isHost && allReady && (
              <button
                onClick={onStart}
                className="flex-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 font-medium text-white hover:from-purple-600 hover:to-pink-600 transition-colors"
              >
                Start Game Night! 🎉
              </button>
            )}
            {isHost && !allReady && (
              <p className="flex-1 text-center text-sm text-gray-500 py-2">
                Waiting for all participants to be ready...
              </p>
            )}
          </div>
        )}

        {night.status === 'active' && (
          <button
            onClick={onClick}
            className="mt-4 w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 font-medium text-white hover:from-green-600 hover:to-emerald-600 transition-colors"
          >
            Join Game Night →
          </button>
        )}

        {night.status === 'completed' && (
          <button
            onClick={onClick}
            className="mt-4 w-full rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            View Results
          </button>
        )}
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (isToday) {
    return `Today at ${time}`;
  }
  if (isTomorrow) {
    return `Tomorrow at ${time}`;
  }

  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface CreateFamilyNightModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Array<{ id: string; name: string; icon: string }>;
  members: Array<{ id: string; name: string; color: string }>;
  onCreate: (data: {
    name: string;
    scheduledAt: string;
    gameIds: string[];
    participantIds: string[];
  }) => Promise<void>;
  isLoading?: boolean;
}

export function CreateFamilyNightModal({
  isOpen,
  onClose,
  games,
  members,
  onCreate,
  isLoading,
}: CreateFamilyNightModalProps) {
  const [name, setName] = useState('Family Game Night');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }
    if (!date) {
      setError('Please select a date');
      return;
    }
    if (selectedGames.length === 0) {
      setError('Please select at least one game');
      return;
    }
    if (selectedMembers.length < 2) {
      setError('Please select at least 2 participants');
      return;
    }

    const scheduledAt = new Date(`${date}T${time}`);
    if (scheduledAt <= new Date()) {
      setError('Please select a future date and time');
      return;
    }

    setError('');
    await onCreate({
      name: name.trim(),
      scheduledAt: scheduledAt.toISOString(),
      gameIds: selectedGames,
      participantIds: selectedMembers,
    });
  };

  const toggleGame = (gameId: string) => {
    setSelectedGames(prev =>
      prev.includes(gameId)
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    );
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  if (!isOpen) return null;

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Family Game Night</h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-gray-100 transition-colors"
            >
              <span className="text-xl">×</span>
            </button>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-purple-500 focus:outline-none"
              placeholder="Family Game Night"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Games */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Games ({selectedGames.length} selected)
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border-2 border-gray-200 rounded-lg">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => toggleGame(game.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors',
                    selectedGames.includes(game.id)
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                  )}
                >
                  <span>{game.icon}</span>
                  <span>{game.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Participants */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Participants ({selectedMembers.length} selected, minimum 2)
            </label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => toggleMember(member.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors',
                    selectedMembers.includes(member.id)
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                  )}
                >
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: member.color || '#3B82F6' }}
                  />
                  <span>{member.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isLoading}
              className="flex-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 font-medium text-white hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Game Night 🎮'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
