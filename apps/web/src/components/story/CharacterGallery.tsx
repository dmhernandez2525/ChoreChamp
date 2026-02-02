import { useState } from 'react';
import { cn } from '@chorechamp/ui';

interface StoryCharacter {
  id: string;
  name: string;
  title: string;
  description: string;
  avatar: string;
  personality: string;
  unlockCondition: string | null;
  isUnlocked: boolean;
}

interface CharacterCardProps {
  character: StoryCharacter;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}

export function CharacterCard({
  character,
  onClick,
  isSelected,
  className,
}: CharacterCardProps) {
  return (
    <div
      onClick={character.isUnlocked ? onClick : undefined}
      className={cn(
        'relative overflow-hidden rounded-xl transition-all duration-200',
        character.isUnlocked && 'cursor-pointer hover:scale-105 hover:shadow-lg',
        !character.isUnlocked && 'opacity-50 cursor-not-allowed grayscale',
        isSelected && 'ring-2 ring-indigo-500 shadow-lg',
        className
      )}
    >
      {/* Character portrait */}
      <div className="aspect-square relative">
        {character.avatar ? (
          <img
            src={character.avatar}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
            <span className="text-5xl text-white font-bold">
              {character.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Locked overlay */}
        {!character.isUnlocked && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-4">
            <span className="text-3xl mb-2">🔒</span>
            <span className="text-xs text-center opacity-80">{character.unlockCondition}</span>
          </div>
        )}
      </div>

      {/* Character info */}
      <div className="bg-white p-3">
        <h3 className="font-bold text-gray-900 truncate">{character.name}</h3>
        <p className="text-xs text-gray-500 truncate">{character.title}</p>
      </div>
    </div>
  );
}

interface CharacterDetailModalProps {
  character: StoryCharacter | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CharacterDetailModal({
  character,
  isOpen,
  onClose,
}: CharacterDetailModalProps) {
  if (!isOpen || !character) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
        {/* Character portrait */}
        <div className="relative aspect-square">
          {character.avatar ? (
            <img
              src={character.avatar}
              alt={character.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <span className="text-8xl text-white font-bold">
                {character.name.charAt(0)}
              </span>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Character details */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{character.name}</h2>
          <p className="text-indigo-600 font-medium mb-4">{character.title}</p>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">About</h3>
              <p className="text-gray-700">{character.description}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Personality</h3>
              <p className="text-gray-700">{character.personality}</p>
            </div>

            {!character.isUnlocked && character.unlockCondition && (
              <div className="bg-gray-100 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-500 mb-1">How to Unlock</h3>
                <p className="text-gray-700 flex items-center gap-2">
                  <span>🔒</span>
                  {character.unlockCondition}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CharacterGalleryProps {
  characters: StoryCharacter[];
  className?: string;
}

export function CharacterGallery({ characters, className }: CharacterGalleryProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<StoryCharacter | null>(null);

  const unlockedCount = characters.filter(c => c.isUnlocked).length;

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Characters</h2>
        <span className="text-sm text-gray-500">
          {unlockedCount}/{characters.length} unlocked
        </span>
      </div>

      {/* Character grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            onClick={() => setSelectedCharacter(character)}
          />
        ))}
      </div>

      {/* Detail modal */}
      <CharacterDetailModal
        character={selectedCharacter}
        isOpen={!!selectedCharacter}
        onClose={() => setSelectedCharacter(null)}
      />
    </div>
  );
}
