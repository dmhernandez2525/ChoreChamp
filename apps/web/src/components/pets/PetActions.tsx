import { useState } from 'react';
import { cn } from '@chorechamp/ui';
import type { PetAction } from '@chorechamp/types';

interface PetActionsProps {
  availableActions: PetAction[];
  onAction: (action: PetAction) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const ACTION_CONFIG: Record<PetAction, { label: string; icon: string; color: string; description: string }> = {
  feed: {
    label: 'Feed',
    icon: '🍖',
    color: 'bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-300',
    description: 'Restore health and happiness',
  },
  play: {
    label: 'Play',
    icon: '🎾',
    color: 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300',
    description: 'Boost happiness, uses energy',
  },
  pet: {
    label: 'Pet',
    icon: '🤚',
    color: 'bg-pink-100 hover:bg-pink-200 text-pink-700 border-pink-300',
    description: 'Quick happiness boost',
  },
  rest: {
    label: 'Rest',
    icon: '💤',
    color: 'bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-300',
    description: 'Recover energy',
  },
  train: {
    label: 'Train',
    icon: '💪',
    color: 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300',
    description: 'Gain extra XP',
  },
  heal: {
    label: 'Heal',
    icon: '💊',
    color: 'bg-red-100 hover:bg-red-200 text-red-700 border-red-300',
    description: 'Restore health when low',
  },
};

export function PetActions({ availableActions, onAction, disabled, className }: PetActionsProps) {
  const [loading, setLoading] = useState<PetAction | null>(null);

  const handleAction = async (action: PetAction) => {
    if (loading || disabled) return;

    setLoading(action);
    try {
      await onAction(action);
    } finally {
      setLoading(null);
    }
  };

  const allActions: PetAction[] = ['feed', 'play', 'pet', 'rest', 'train', 'heal'];

  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {allActions.map((action) => {
        const config = ACTION_CONFIG[action];
        const isAvailable = availableActions.includes(action);
        const isLoading = loading === action;

        return (
          <button
            key={action}
            onClick={() => handleAction(action)}
            disabled={!isAvailable || disabled || loading !== null}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-all',
              isAvailable ? config.color : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed',
              isLoading && 'animate-pulse',
              !isAvailable && 'opacity-50'
            )}
            title={config.description}
          >
            <span className="text-2xl" role="img" aria-label={config.label}>
              {isLoading ? '⏳' : config.icon}
            </span>
            <span className="text-xs font-medium">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}

interface PetActionResultProps {
  result: {
    action: PetAction;
    message: string;
    xpGained: number;
    statChanges: Record<string, number>;
  };
  leveledUp?: boolean;
  evolved?: boolean;
  newTier?: string | null;
  onDismiss: () => void;
  className?: string;
}

export function PetActionResult({
  result,
  leveledUp,
  evolved,
  newTier,
  onDismiss,
  className,
}: PetActionResultProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50',
        className
      )}
      onClick={onDismiss}
    >
      <div
        className="animate-bounce-in rounded-xl bg-white p-6 shadow-2xl max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <span className="text-5xl mb-4 block">
            {ACTION_CONFIG[result.action]?.icon || '✨'}
          </span>
          <p className="text-lg font-medium text-gray-900 mb-2">
            {result.message}
          </p>
          {result.xpGained > 0 && (
            <p className="text-blue-600 font-medium">
              +{result.xpGained} XP
            </p>
          )}
          {leveledUp && (
            <p className="text-purple-600 font-bold mt-2 animate-pulse">
              🎉 Level Up!
            </p>
          )}
          {evolved && newTier && (
            <p className="text-yellow-600 font-bold mt-2 animate-pulse">
              ✨ Evolved to {newTier}!
            </p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="mt-4 w-full rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
