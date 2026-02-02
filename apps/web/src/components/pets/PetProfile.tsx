import { useState } from 'react';
import { cn } from '@chorechamp/ui';
import type { PetAction, PetStats as PetStatsType, EvolutionTier, PetMood } from '@chorechamp/types';
import { PetStats } from './PetStats';
import { PetMoodDisplay, getMoodDescription } from './PetMoodDisplay';
import { PetEvolutionBadge, getEvolutionProgress } from './PetEvolutionBadge';
import { PetActions, PetActionResult } from './PetActions';

interface PetAbility {
  id: string;
  name: string;
  description: string;
  icon: string;
  abilityType: string;
  value: number;
  cooldownHours: number;
  unlockTier: string;
}

interface PetEvent {
  id: string;
  eventType: string;
  description: string;
  createdAt: string;
}

interface PetProfileData {
  id: string;
  name: string;
  species: {
    id: string;
    name: string;
    icon: string;
    description: string;
    specialAbility: string;
  };
  evolutionTier: EvolutionTier;
  level: number;
  xp: number;
  mood: PetMood;
  stats: PetStatsType;
  xpProgress: {
    current: number;
    needed: number;
    percentage: number;
  };
  canEvolve: boolean;
  nextEvolutionTier: EvolutionTier | null;
  availableActions: PetAction[];
  happinessBonus: number;
  equippedAccessories: string[];
  consecutiveDaysHealthy: number;
}

interface PetProfileProps {
  pet: PetProfileData;
  abilities: PetAbility[];
  recentEvents: PetEvent[];
  onAction: (action: PetAction) => Promise<{
    result: {
      action: PetAction;
      message: string;
      xpGained: number;
      statChanges: Record<string, number>;
    };
    leveledUp: boolean;
    evolved: boolean;
    newTier: string | null;
  }>;
  onEvolve: () => Promise<void>;
  onActivateAbility: (abilityId: string) => Promise<void>;
  onRename: (newName: string) => Promise<void>;
  isOwner: boolean;
  className?: string;
}

export function PetProfile({
  pet,
  abilities,
  recentEvents,
  onAction,
  onEvolve,
  onActivateAbility,
  onRename,
  isOwner,
  className,
}: PetProfileProps) {
  const [actionResult, setActionResult] = useState<{
    result: {
      action: PetAction;
      message: string;
      xpGained: number;
      statChanges: Record<string, number>;
    };
    leveledUp: boolean;
    evolved: boolean;
    newTier: string | null;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(pet.name);
  const [isEvolving, setIsEvolving] = useState(false);

  const handleAction = async (action: PetAction) => {
    const result = await onAction(action);
    setActionResult(result);
  };

  const handleSaveName = async () => {
    if (editName.trim() && editName !== pet.name) {
      await onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleEvolve = async () => {
    setIsEvolving(true);
    try {
      await onEvolve();
    } finally {
      setIsEvolving(false);
    }
  };

  const evolutionProgress = getEvolutionProgress(pet.evolutionTier, pet.level);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Section */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 p-6 shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Pet Icon */}
          <div className="relative">
            <div className="flex items-center justify-center w-32 h-32 rounded-full bg-white/80 shadow-xl text-7xl">
              {pet.species.icon}
            </div>
            {pet.canEvolve && (
              <div className="absolute -top-2 -right-2 animate-bounce">
                <span className="text-3xl">✨</span>
              </div>
            )}
          </div>

          {/* Pet Info */}
          <div className="flex-1 text-center md:text-left">
            {isEditing ? (
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={50}
                  className="rounded-lg border-2 border-purple-300 px-3 py-1 text-xl font-bold focus:border-purple-500 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="rounded-lg bg-green-500 px-3 py-1 text-white hover:bg-green-600"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditName(pet.name);
                    setIsEditing(false);
                  }}
                  className="rounded-lg bg-gray-200 px-3 py-1 text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h1 className="text-3xl font-bold text-gray-900">{pet.name}</h1>
                {isOwner && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Edit name"
                  >
                    ✏️
                  </button>
                )}
              </div>
            )}
            <p className="text-gray-600 mt-1">{pet.species.name}</p>
            <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
              <PetEvolutionBadge tier={pet.evolutionTier} level={pet.level} />
              <PetMoodDisplay mood={pet.mood} size="sm" />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {getMoodDescription(pet.mood)}
            </p>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Level {pet.level}</span>
            <span>{pet.xpProgress.current} / {pet.xpProgress.needed} XP</span>
          </div>
          <div className="h-4 rounded-full bg-white/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
              style={{ width: `${pet.xpProgress.percentage}%` }}
            />
          </div>
        </div>

        {/* Evolution Progress */}
        {evolutionProgress.nextTier && (
          <div className="mt-4 rounded-xl bg-white/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Evolution to {evolutionProgress.nextTier}
              </span>
              <span className="text-sm text-gray-500">
                Level {evolutionProgress.levelRequired} required
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
                style={{ width: `${evolutionProgress.progress}%` }}
              />
            </div>
            {pet.canEvolve && (
              <button
                onClick={handleEvolve}
                disabled={isEvolving}
                className="mt-3 w-full rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-2 font-bold text-white hover:from-yellow-500 hover:to-orange-600 transition-all disabled:opacity-50 animate-pulse"
              >
                {isEvolving ? 'Evolving...' : '✨ Evolve Now!'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Stats</h2>
        <PetStats stats={pet.stats} />
        {pet.happinessBonus > 0 && (
          <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
            <span className="font-medium">Happiness Bonus Active!</span>
            <span className="ml-2">+{Math.round(pet.happinessBonus * 100)}% points from chores</span>
          </div>
        )}
        {pet.consecutiveDaysHealthy > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            <span>🏥 Healthy for {pet.consecutiveDaysHealthy} consecutive days</span>
          </div>
        )}
      </div>

      {/* Actions Section */}
      {isOwner && (
        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
          <PetActions
            availableActions={pet.availableActions}
            onAction={handleAction}
          />
        </div>
      )}

      {/* Abilities Section */}
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Abilities</h2>
        {abilities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No abilities unlocked yet. Keep leveling up!
          </p>
        ) : (
          <div className="grid gap-3">
            {abilities.map((ability) => (
              <AbilityCard
                key={ability.id}
                ability={ability}
                onActivate={isOwner ? () => onActivateAbility(ability.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Activity Feed */}
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        {recentEvents.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No recent activity
          </p>
        ) : (
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <EventItem key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      {/* Action Result Modal */}
      {actionResult && (
        <PetActionResult
          result={actionResult.result}
          leveledUp={actionResult.leveledUp}
          evolved={actionResult.evolved}
          newTier={actionResult.newTier}
          onDismiss={() => setActionResult(null)}
        />
      )}
    </div>
  );
}

interface AbilityCardProps {
  ability: PetAbility;
  onActivate?: () => void;
}

function AbilityCard({ ability, onActivate }: AbilityCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-2xl shadow">
        {ability.icon}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-900">{ability.name}</h4>
        <p className="text-sm text-gray-600">{ability.description}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-600">
            {ability.abilityType}
          </span>
          <span>|</span>
          <span>{ability.cooldownHours}h cooldown</span>
        </div>
      </div>
      {onActivate && (
        <button
          onClick={onActivate}
          className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 transition-colors"
        >
          Use
        </button>
      )}
    </div>
  );
}

const EVENT_ICONS: Record<string, string> = {
  adopted: '🎉',
  evolved: '✨',
  leveled_up: '⬆️',
  fed: '🍖',
  played: '🎾',
  pet: '🤚',
  rest: '💤',
  train: '💪',
  heal: '💊',
  playdate_scheduled: '📅',
  playdate_completed: '🎊',
  ability_used: '🌟',
  chore_xp: '✅',
  renamed: '✏️',
  released: '👋',
};

interface EventItemProps {
  event: PetEvent;
}

function EventItem({ event }: EventItemProps) {
  const icon = EVENT_ICONS[event.eventType] || '📝';
  const date = new Date(event.createdAt);
  const timeAgo = getTimeAgo(date);

  return (
    <div className="flex items-start gap-3">
      <span className="text-xl">{icon}</span>
      <div className="flex-1">
        <p className="text-sm text-gray-700">{event.description}</p>
        <p className="text-xs text-gray-400 mt-0.5">{timeAgo}</p>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString();
}
