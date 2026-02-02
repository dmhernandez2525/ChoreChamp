import { useState } from 'react';
import { cn } from '@chorechamp/ui';

interface SpeciesData {
  id: string;
  name: string;
  description: string;
  icon: string;
  specialAbility: string;
  baseStats: {
    maxHealth: number;
    maxHappiness: number;
    maxEnergy: number;
  };
}

interface SpeciesSelectorProps {
  species: SpeciesData[];
  selectedId?: string;
  onSelect: (speciesId: string) => void;
  className?: string;
}

const SPECIES_COLORS: Record<string, { bg: string; border: string; selected: string }> = {
  dog: { bg: 'bg-amber-50', border: 'border-amber-200', selected: 'border-amber-500 ring-2 ring-amber-200' },
  cat: { bg: 'bg-purple-50', border: 'border-purple-200', selected: 'border-purple-500 ring-2 ring-purple-200' },
  dragon: { bg: 'bg-red-50', border: 'border-red-200', selected: 'border-red-500 ring-2 ring-red-200' },
  robot: { bg: 'bg-gray-50', border: 'border-gray-200', selected: 'border-gray-500 ring-2 ring-gray-200' },
  bunny: { bg: 'bg-pink-50', border: 'border-pink-200', selected: 'border-pink-500 ring-2 ring-pink-200' },
  bird: { bg: 'bg-sky-50', border: 'border-sky-200', selected: 'border-sky-500 ring-2 ring-sky-200' },
  unicorn: { bg: 'bg-violet-50', border: 'border-violet-200', selected: 'border-violet-500 ring-2 ring-violet-200' },
  slime: { bg: 'bg-green-50', border: 'border-green-200', selected: 'border-green-500 ring-2 ring-green-200' },
};

export function SpeciesSelector({ species, selectedId, onSelect, className }: SpeciesSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeSpecies = species.find(s => s.id === (hoveredId || selectedId));

  return (
    <div className={cn('space-y-4', className)}>
      {/* Species Grid */}
      <div className="grid grid-cols-4 gap-3">
        {species.map((s) => {
          const colors = SPECIES_COLORS[s.id] || SPECIES_COLORS.dog;
          const isSelected = selectedId === s.id;

          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              onMouseEnter={() => setHoveredId(s.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all',
                colors.bg,
                isSelected ? colors.selected : colors.border,
                'hover:scale-105 active:scale-95'
              )}
            >
              <span className="text-3xl">{s.icon}</span>
              <span className="text-xs font-medium text-gray-700">{s.name}</span>
            </button>
          );
        })}
      </div>

      {/* Species Details */}
      {activeSpecies && (
        <div className={cn(
          'rounded-xl border-2 p-4',
          SPECIES_COLORS[activeSpecies.id]?.bg || 'bg-gray-50',
          SPECIES_COLORS[activeSpecies.id]?.border || 'border-gray-200'
        )}>
          <div className="flex items-start gap-4">
            <span className="text-5xl">{activeSpecies.icon}</span>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-900">{activeSpecies.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{activeSpecies.description}</p>
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-xs font-medium text-purple-600">
                <span>✨</span>
                <span>{activeSpecies.specialAbility}</span>
              </div>
            </div>
          </div>

          {/* Base Stats */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <StatPreview
              label="Health"
              value={activeSpecies.baseStats.maxHealth}
              icon="❤️"
              color="text-red-600"
            />
            <StatPreview
              label="Happiness"
              value={activeSpecies.baseStats.maxHappiness}
              icon="😊"
              color="text-yellow-600"
            />
            <StatPreview
              label="Energy"
              value={activeSpecies.baseStats.maxEnergy}
              icon="⚡"
              color="text-blue-600"
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface StatPreviewProps {
  label: string;
  value: number;
  icon: string;
  color: string;
}

function StatPreview({ label, value, icon, color }: StatPreviewProps) {
  return (
    <div className="rounded-lg bg-white/80 p-2 text-center">
      <div className="flex items-center justify-center gap-1">
        <span>{icon}</span>
        <span className={cn('font-bold', color)}>{value}</span>
      </div>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}

interface AdoptPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  species: SpeciesData[];
  onAdopt: (speciesId: string, name: string) => Promise<void>;
  isLoading?: boolean;
}

export function AdoptPetModal({ isOpen, onClose, species, onAdopt, isLoading }: AdoptPetModalProps) {
  const [selectedSpecies, setSelectedSpecies] = useState<string>('');
  const [petName, setPetName] = useState('');
  const [error, setError] = useState('');

  const handleAdopt = async () => {
    if (!selectedSpecies) {
      setError('Please select a species');
      return;
    }
    if (!petName.trim()) {
      setError('Please enter a name for your pet');
      return;
    }
    if (petName.length > 50) {
      setError('Name must be 50 characters or less');
      return;
    }

    setError('');
    await onAdopt(selectedSpecies, petName.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Adopt a Pet</h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-gray-100 transition-colors"
            >
              <span className="text-xl">×</span>
            </button>
          </div>

          {/* Species Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose a Species
            </label>
            <SpeciesSelector
              species={species}
              selectedId={selectedSpecies}
              onSelect={setSelectedSpecies}
            />
          </div>

          {/* Name Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name Your Pet
            </label>
            <input
              type="text"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="Enter a name..."
              maxLength={50}
              className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none transition-colors"
            />
            <p className="mt-1 text-xs text-gray-500">{petName.length}/50 characters</p>
          </div>

          {/* Error Message */}
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
              onClick={handleAdopt}
              disabled={isLoading || !selectedSpecies || !petName.trim()}
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 font-medium text-white hover:from-blue-600 hover:to-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Adopting...' : 'Adopt! 🐾'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
