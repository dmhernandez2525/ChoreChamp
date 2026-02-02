import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import { useHousehold, useMembers } from '@chorechamp/api-client';
import { useAuth } from '../context/AuthContext';
import type {
  CharacterProfile as CharacterProfileType,
  CharacterClassDefinition,
  MemberSkill,
  ClassSkillDefinition,
  AvatarItem,
  LevelUnlock,
  XPTransaction,
  CharacterClass,
  AvatarCustomization,
} from '@chorechamp/types';
import { CharacterProfile, ClassSelector } from '../components/character';
import { Skeleton } from '../components/common';

// Placeholder API functions - would be replaced with actual API client hooks
async function fetchCharacterProfile(householdId: string, memberId: string) {
  const response = await fetch(`/api/${householdId}/characters/${memberId}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch character profile');
  }
  return response.json();
}

async function fetchCharacterClasses() {
  const response = await fetch('/api/characters/classes', {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch character classes');
  return response.json();
}

async function fetchAvatarItems() {
  const response = await fetch('/api/characters/avatar-items', {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch avatar items');
  return response.json();
}

async function createCharacter(
  householdId: string,
  memberId: string,
  characterClass: CharacterClass
) {
  const response = await fetch(`/api/${householdId}/characters/${memberId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ characterClass }),
  });
  if (!response.ok) throw new Error('Failed to create character');
  return response.json();
}

async function updateAvatar(
  householdId: string,
  memberId: string,
  avatar: Partial<AvatarCustomization>
) {
  const response = await fetch(`/api/${householdId}/characters/${memberId}/avatar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ avatar }),
  });
  if (!response.ok) throw new Error('Failed to update avatar');
  return response.json();
}

async function updateClass(
  householdId: string,
  memberId: string,
  characterClass: CharacterClass
) {
  const response = await fetch(`/api/${householdId}/characters/${memberId}/class`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ characterClass }),
  });
  if (!response.ok) throw new Error('Failed to update class');
  return response.json();
}

async function allocateStat(
  householdId: string,
  memberId: string,
  stat: string,
  points: number
) {
  const response = await fetch(`/api/${householdId}/characters/${memberId}/stats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ stat, points }),
  });
  if (!response.ok) throw new Error('Failed to allocate stat');
  return response.json();
}

async function setTitle(
  householdId: string,
  memberId: string,
  title: string | null
) {
  const response = await fetch(`/api/${householdId}/characters/${memberId}/title`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error('Failed to set title');
  return response.json();
}

export default function MemberCharacter() {
  const { householdId, memberId } = useParams<{
    householdId: string;
    memberId: string;
  }>();

  const { user } = useAuth();
  const { data: household, isLoading: loadingHousehold } = useHousehold(householdId!);
  const { data: members, isLoading: loadingMembers } = useMembers(householdId!);

  const currentMember = members?.find((m) => m.userId === user?.id);

  const [characterData, setCharacterData] = useState<{
    profile: CharacterProfileType & {
      characterClass: CharacterClassDefinition;
      xpProgress: number;
      xpToNextLevel: number;
    };
    skills: (MemberSkill & { definition: ClassSkillDefinition })[];
    availableTitles: string[];
    nextUnlocks: LevelUnlock[];
    recentXP: XPTransaction[];
  } | null>(null);
  const [allClasses, setAllClasses] = useState<CharacterClassDefinition[]>([]);
  const [avatarItems, setAvatarItems] = useState<AvatarItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const member = members?.find((m) => m.id === memberId);
  const isParentOrSelf =
    currentMember?.role === 'parent' || currentMember?.id === memberId;

  useEffect(() => {
    async function loadData() {
      if (!householdId || !memberId) return;

      setIsLoading(true);
      setError(null);

      try {
        const [profileResult, classesResult, itemsResult] = await Promise.all([
          fetchCharacterProfile(householdId, memberId),
          fetchCharacterClasses(),
          fetchAvatarItems(),
        ]);

        setAllClasses(classesResult);
        setAvatarItems(itemsResult);

        if (profileResult) {
          setCharacterData(profileResult);
          setShowCreateFlow(false);
        } else {
          setShowCreateFlow(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load character data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [householdId, memberId]);

  const handleCreateCharacter = async () => {
    if (!selectedClass || !householdId || !memberId) return;

    setIsCreating(true);
    try {
      await createCharacter(householdId, memberId, selectedClass);
      // Reload character data
      const profileResult = await fetchCharacterProfile(householdId, memberId);
      setCharacterData(profileResult);
      setShowCreateFlow(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create character');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateAvatar = async (avatar: AvatarCustomization) => {
    if (!householdId || !memberId) return;
    await updateAvatar(householdId, memberId, avatar);
    // Reload character data
    const profileResult = await fetchCharacterProfile(householdId, memberId);
    setCharacterData(profileResult);
  };

  const handleUpdateClass = async (classId: CharacterClass) => {
    if (!householdId || !memberId) return;
    await updateClass(householdId, memberId, classId);
    // Reload character data
    const profileResult = await fetchCharacterProfile(householdId, memberId);
    setCharacterData(profileResult);
  };

  const handleAllocateStat = async (stat: string, points: number) => {
    if (!householdId || !memberId) return;
    await allocateStat(householdId, memberId, stat, points);
    // Reload character data
    const profileResult = await fetchCharacterProfile(householdId, memberId);
    setCharacterData(profileResult);
  };

  const handleSetTitle = async (title: string | null) => {
    if (!householdId || !memberId) return;
    await setTitle(householdId, memberId, title);
    // Reload character data
    const profileResult = await fetchCharacterProfile(householdId, memberId);
    setCharacterData(profileResult);
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
          <div className="space-y-6">
            <Skeleton className="h-48 rounded-xl" />
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
                  {member.name}'s Character
                </h1>
                {characterData && (
                  <p className="text-sm text-gray-500">
                    Level {characterData.profile.level}{' '}
                    {characterData.profile.characterClass.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {characterData && (
            <Link
              to={`/households/${householdId}/character-leaderboard`}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View Leaderboard →
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {showCreateFlow ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Create Your Character
              </h2>
              <p className="mt-2 text-gray-600">
                Choose a class to begin your ChoreChamp adventure!
              </p>
            </div>

            <ClassSelector
              classes={allClasses}
              selectedClass={selectedClass}
              onSelect={setSelectedClass}
            />

            {selectedClass && (
              <div className="flex justify-center">
                <Button
                  onClick={handleCreateCharacter}
                  disabled={isCreating}
                  className="px-8 py-3 text-lg"
                >
                  {isCreating ? 'Creating...' : 'Create Character'}
                </Button>
              </div>
            )}
          </div>
        ) : characterData ? (
          <CharacterProfile
            profile={characterData.profile}
            skills={characterData.skills}
            availableTitles={characterData.availableTitles}
            nextUnlocks={characterData.nextUnlocks}
            recentXP={characterData.recentXP}
            allClasses={allClasses}
            avatarItems={avatarItems}
            onUpdateAvatar={handleUpdateAvatar}
            onUpdateClass={handleUpdateClass}
            onAllocateStat={handleAllocateStat}
            onSetTitle={handleSetTitle}
            isParentOrSelf={isParentOrSelf}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No character data found</p>
          </div>
        )}
      </main>
    </div>
  );
}
