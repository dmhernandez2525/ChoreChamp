import { useState } from 'react';
import { cn } from '@chorechamp/ui';
import type { GameDifficulty, GameCategory } from '@chorechamp/types';
import { DifficultyBadge } from './GameCard';

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

interface GameData {
  id: string;
  name: string;
  description: string;
  instructions: string;
  category: GameCategory;
  icon: string;
  minPlayers: number;
  maxPlayers: number;
  estimatedDuration: number;
  baseXPReward: number;
  basePointReward: number;
  isUnlocked: boolean;
  highScore: number;
  bestDifficulty: GameDifficulty | null;
}

interface LeaderboardEntry {
  rank: number;
  memberId: string;
  memberName: string;
  memberColor: string;
  score: number;
  difficulty: GameDifficulty;
}

interface GameLauncherProps {
  game: GameData;
  configs: GameConfig[];
  leaderboard: LeaderboardEntry[];
  onStart: (difficulty: GameDifficulty, playerIds?: string[]) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
  className?: string;
}

export function GameLauncher({
  game,
  configs,
  leaderboard,
  onStart,
  onClose,
  isLoading,
  className,
}: GameLauncherProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>(
    game.bestDifficulty || 'easy'
  );
  const [activeTab, setActiveTab] = useState<'play' | 'leaderboard'>('play');

  // Config for selected difficulty - available for future enhancements
  configs.find(c => c.difficulty === selectedDifficulty);

  const handleStart = async () => {
    await onStart(selectedDifficulty);
  };

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4',
      className
    )}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors"
          >
            <span className="text-xl">×</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-20 h-20 rounded-xl bg-white/20 text-5xl">
              {game.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{game.name}</h2>
              <p className="text-white/80 mt-1">{game.description}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-4 text-sm text-white/80">
            <span>⏱️ ~{game.estimatedDuration} min</span>
            <span>👥 {game.minPlayers === game.maxPlayers
              ? `${game.minPlayers} player`
              : `${game.minPlayers}-${game.maxPlayers} players`}
            </span>
            <span>⭐ {game.baseXPReward} base XP</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('play')}
            className={cn(
              'flex-1 py-3 font-medium transition-colors',
              activeTab === 'play'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            Play
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={cn(
              'flex-1 py-3 font-medium transition-colors',
              activeTab === 'leaderboard'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            Leaderboard
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'play' ? (
            <div className="space-y-6">
              {/* Instructions */}
              {game.instructions && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="font-medium text-gray-900 mb-2">How to Play</h3>
                  <p className="text-sm text-gray-600">{game.instructions}</p>
                </div>
              )}

              {/* Difficulty Selection */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Select Difficulty</h3>
                <div className="grid grid-cols-2 gap-3">
                  {configs.map((config) => (
                    <button
                      key={config.difficulty}
                      onClick={() => setSelectedDifficulty(config.difficulty)}
                      className={cn(
                        'rounded-xl border-2 p-4 text-left transition-all',
                        selectedDifficulty === config.difficulty
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <DifficultyBadge difficulty={config.difficulty} />
                        {config.difficulty === game.bestDifficulty && (
                          <span className="text-xs text-green-600 font-medium">Best</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {config.timeLimit > 0 && (
                          <p>⏱️ {formatTime(config.timeLimit)} time limit</p>
                        )}
                        <p>🎯 Target: {config.targetScore} pts</p>
                        <p>⭐ {config.xpMultiplier}% XP bonus</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* High Score */}
              {game.highScore > 0 && (
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-800 font-medium">Your High Score</span>
                    <span className="text-xl font-bold text-yellow-600">
                      {game.highScore}
                    </span>
                  </div>
                </div>
              )}

              {/* Start Button */}
              <button
                onClick={handleStart}
                disabled={isLoading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4 text-lg font-bold text-white hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Starting...' : 'Start Game'}
              </button>
            </div>
          ) : (
            <div>
              {leaderboard.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl mb-2 block">🏆</span>
                  <p>No scores yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={`${entry.memberId}-${entry.rank}`}
                      className={cn(
                        'flex items-center gap-4 rounded-lg p-3',
                        entry.rank <= 3 ? 'bg-yellow-50' : 'bg-gray-50'
                      )}
                    >
                      <div className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full font-bold',
                        entry.rank === 1 && 'bg-yellow-400 text-white',
                        entry.rank === 2 && 'bg-gray-300 text-gray-700',
                        entry.rank === 3 && 'bg-amber-600 text-white',
                        entry.rank > 3 && 'bg-gray-200 text-gray-600'
                      )}>
                        {entry.rank}
                      </div>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: entry.memberColor || '#3B82F6' }}
                      >
                        {entry.memberName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{entry.memberName}</p>
                        <DifficultyBadge difficulty={entry.difficulty} size="sm" />
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{entry.score}</p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0 && secs > 0) {
    return `${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m`;
  }
  return `${secs}s`;
}

interface GameResultModalProps {
  result: {
    success: boolean;
    score: number;
    timeElapsed: number;
    accuracy: number;
    combo: number;
    stars: number;
    xpEarned: number;
    pointsEarned: number;
    newHighScore: boolean;
  };
  gameName: string;
  gameIcon: string;
  onPlayAgain: () => void;
  onClose: () => void;
}

export function GameResultModal({
  result,
  gameName: _gameName,
  gameIcon,
  onPlayAgain,
  onClose,
}: GameResultModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={cn(
          'p-6 text-center text-white',
          result.success
            ? 'bg-gradient-to-br from-green-500 to-emerald-600'
            : 'bg-gradient-to-br from-gray-500 to-gray-600'
        )}>
          <span className="text-6xl mb-4 block">{gameIcon}</span>
          <h2 className="text-2xl font-bold">
            {result.success ? 'Game Complete!' : 'Game Over'}
          </h2>
          {result.newHighScore && (
            <div className="mt-2 inline-block rounded-full bg-yellow-400 px-4 py-1 text-sm font-bold text-yellow-900 animate-bounce">
              🎉 New High Score!
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="p-6">
          {/* Stars */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map((star) => (
              <span
                key={star}
                className={cn(
                  'text-4xl transition-transform',
                  star <= result.stars
                    ? 'text-yellow-400 scale-100'
                    : 'text-gray-300 scale-75'
                )}
              >
                ⭐
              </span>
            ))}
          </div>

          {/* Score */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500">Score</p>
            <p className="text-4xl font-bold text-gray-900">{result.score}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-xs text-gray-500">Time</p>
              <p className="font-bold text-gray-900">{formatTime(result.timeElapsed)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-xs text-gray-500">Accuracy</p>
              <p className="font-bold text-gray-900">{result.accuracy}%</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-center">
              <p className="text-xs text-blue-500">XP Earned</p>
              <p className="font-bold text-blue-600">+{result.xpEarned}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <p className="text-xs text-green-500">Points</p>
              <p className="font-bold text-green-600">+{result.pointsEarned}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Done
            </button>
            <button
              onClick={onPlayAgain}
              className="flex-1 rounded-lg bg-blue-500 px-4 py-3 font-medium text-white hover:bg-blue-600 transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
