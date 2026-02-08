import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import { useHousehold, useMembers } from '@chorechamp/api-client';
import { useAuth } from '../context/AuthContext';
import type { PetAction, EvolutionTier, PetMood, PetStats } from '@chorechamp/types';
import {
  PetCardGrid,
  PetProfile,
  AdoptPetModal,
} from '../components/pets';
import { Skeleton } from '../components/common';

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

interface PetData {
  id: string;
  name: string;
  species: SpeciesData;
  evolutionTier: EvolutionTier;
  level: number;
  xp: number;
  mood: PetMood;
  stats: PetStats;
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

// API functions
async function fetchPetSpecies(householdId: string): Promise<SpeciesData[]> {
  const response = await fetch(`/api/${householdId}/pets/species`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch pet species');
  return response.json();
}

async function fetchMemberPets(householdId: string, memberId: string): Promise<PetData[]> {
  const response = await fetch(`/api/${householdId}/pets/member/${memberId}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch pets');
  return response.json();
}

async function fetchPetDetails(householdId: string, petId: string): Promise<{
  pet: PetData;
  abilities: PetAbility[];
  recentEvents: PetEvent[];
}> {
  const response = await fetch(`/api/${householdId}/pets/${petId}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch pet details');
  return response.json();
}

async function adoptPet(
  householdId: string,
  memberId: string,
  speciesId: string,
  name: string
): Promise<{ pet: PetData }> {
  const response = await fetch(`/api/${householdId}/pets/adopt/${memberId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ speciesId, name }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to adopt pet');
  }
  return response.json();
}

async function performPetAction(
  householdId: string,
  petId: string,
  action: PetAction
): Promise<{
  pet: PetData;
  result: {
    action: PetAction;
    message: string;
    xpGained: number;
    statChanges: Record<string, number>;
  };
  leveledUp: boolean;
  evolved: boolean;
  newTier: string | null;
}> {
  const response = await fetch(`/api/${householdId}/pets/${petId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ action }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to perform action');
  }
  return response.json();
}

async function evolvePet(householdId: string, petId: string): Promise<{ pet: PetData }> {
  const response = await fetch(`/api/${householdId}/pets/${petId}/evolve`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to evolve pet');
  }
  return response.json();
}

async function activatePetAbility(
  householdId: string,
  petId: string,
  abilityId: string
): Promise<{ pet: PetData }> {
  const response = await fetch(`/api/${householdId}/pets/${petId}/ability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ abilityId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to activate ability');
  }
  return response.json();
}

async function renamePet(
  householdId: string,
  petId: string,
  name: string
): Promise<PetData> {
  const response = await fetch(`/api/${householdId}/pets/${petId}/name`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to rename pet');
  }
  return response.json();
}

export default function MemberPets() {
  const { householdId, memberId } = useParams<{
    householdId: string;
    memberId: string;
  }>();

  const { user } = useAuth();
  const { data: household, isLoading: loadingHousehold } = useHousehold(householdId!);
  const { data: members, isLoading: loadingMembers } = useMembers(householdId!);

  const currentMember = members?.find((m) => m.userId === user?.id);

  const [pets, setPets] = useState<PetData[]>([]);
  const [species, setSpecies] = useState<SpeciesData[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetData | null>(null);
  const [petDetails, setPetDetails] = useState<{
    pet: PetData;
    abilities: PetAbility[];
    recentEvents: PetEvent[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [isAdopting, setIsAdopting] = useState(false);

  const member = members?.find((m) => m.id === memberId);
  const isOwner = currentMember?.role === 'parent' || currentMember?.id === memberId;

  const loadPets = useCallback(async () => {
    if (!householdId || !memberId) return;

    try {
      const petsData = await fetchMemberPets(householdId, memberId);
      setPets(petsData);
    } catch (err) {
      console.error('Failed to reload pets:', err);
    }
  }, [householdId, memberId]);

  useEffect(() => {
    async function loadData() {
      if (!householdId || !memberId) return;

      setIsLoading(true);
      setError(null);

      try {
        const [petsData, speciesData] = await Promise.all([
          fetchMemberPets(householdId, memberId),
          fetchPetSpecies(householdId),
        ]);

        setPets(petsData);
        setSpecies(speciesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pet data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [householdId, memberId]);

  useEffect(() => {
    async function loadPetDetails() {
      if (!householdId || !selectedPet) {
        setPetDetails(null);
        return;
      }

      try {
        const details = await fetchPetDetails(householdId, selectedPet.id);
        setPetDetails(details);
      } catch (err) {
        console.error('Failed to load pet details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load pet details');
      }
    }

    loadPetDetails();
  }, [householdId, selectedPet?.id]);

  const handleAdopt = async (speciesId: string, name: string) => {
    if (!householdId || !memberId) return;

    setIsAdopting(true);
    try {
      await adoptPet(householdId, memberId, speciesId, name);
      await loadPets();
      setShowAdoptModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adopt pet');
    } finally {
      setIsAdopting(false);
    }
  };

  const handleAction = async (action: PetAction) => {
    if (!householdId || !selectedPet) throw new Error('No pet selected');

    const result = await performPetAction(householdId, selectedPet.id, action);

    // Refresh pet data
    await loadPets();
    if (householdId) {
      const details = await fetchPetDetails(householdId, selectedPet.id);
      setPetDetails(details);
      setSelectedPet(details.pet);
    }

    return result;
  };

  const handleEvolve = async () => {
    if (!householdId || !selectedPet) return;

    await evolvePet(householdId, selectedPet.id);

    // Refresh pet data
    await loadPets();
    const details = await fetchPetDetails(householdId, selectedPet.id);
    setPetDetails(details);
    setSelectedPet(details.pet);
  };

  const handleActivateAbility = async (abilityId: string) => {
    if (!householdId || !selectedPet) return;

    await activatePetAbility(householdId, selectedPet.id, abilityId);

    // Refresh pet data
    const details = await fetchPetDetails(householdId, selectedPet.id);
    setPetDetails(details);
    setSelectedPet(details.pet);
  };

  const handleRename = async (newName: string) => {
    if (!householdId || !selectedPet) return;

    await renamePet(householdId, selectedPet.id, newName);

    // Refresh pet data
    await loadPets();
    const details = await fetchPetDetails(householdId, selectedPet.id);
    setPetDetails(details);
    setSelectedPet(details.pet);
  };

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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
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

  if (!household || !member) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Member not found</p>
          <Button asChild className="mt-4">
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // If a pet is selected, show the pet profile
  if (selectedPet && petDetails) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedPet(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ←
              </button>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{petDetails.pet.species.icon}</span>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {petDetails.pet.name}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Level {petDetails.pet.level} {petDetails.pet.species.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-8">
          <PetProfile
            pet={petDetails.pet}
            abilities={petDetails.abilities}
            recentEvents={petDetails.recentEvents}
            onAction={handleAction}
            onEvolve={handleEvolve}
            onActivateAbility={handleActivateAbility}
            onRename={handleRename}
            isOwner={isOwner}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/households/${householdId}`}
              className="text-gray-500 hover:text-gray-700"
            >
              ←
            </Link>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold"
                style={{ backgroundColor: member.color || '#3B82F6' }}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {member.name}'s Pets
                </h1>
                <p className="text-sm text-gray-500">
                  {pets.length} pet{pets.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {isOwner && pets.length < 3 && (
            <Button onClick={() => setShowAdoptModal(true)}>
              Adopt a Pet
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {pets.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🐾</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Pets Yet
            </h2>
            <p className="text-gray-600 mb-6">
              {isOwner
                ? 'Adopt a virtual pet to care for while completing chores!'
                : `${member.name} doesn't have any pets yet.`}
            </p>
            {isOwner && (
              <Button onClick={() => setShowAdoptModal(true)} size="lg">
                Adopt Your First Pet
              </Button>
            )}
          </div>
        ) : (
          <PetCardGrid
            pets={pets}
            onPetClick={(pet) => setSelectedPet(pet as unknown as PetData)}
          />
        )}

        {/* Pet Limit Info */}
        {pets.length > 0 && pets.length < 3 && isOwner && (
          <div className="mt-6 text-center text-sm text-gray-500">
            You can have up to 3 pets. ({3 - pets.length} slot{3 - pets.length !== 1 ? 's' : ''} remaining)
          </div>
        )}
        {pets.length >= 3 && isOwner && (
          <div className="mt-6 text-center text-sm text-gray-500">
            You've reached the maximum of 3 pets.
          </div>
        )}
      </main>

      {/* Adopt Modal */}
      <AdoptPetModal
        isOpen={showAdoptModal}
        onClose={() => setShowAdoptModal(false)}
        species={species}
        onAdopt={handleAdopt}
        isLoading={isAdopting}
      />
    </div>
  );
}
