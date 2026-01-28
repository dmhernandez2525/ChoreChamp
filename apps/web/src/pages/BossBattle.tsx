import { useParams, Link } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import { useHousehold, useMembers } from '@chorechamp/api-client';
import { useAuth } from '../context/AuthContext';
import {
  BossCard,
  FamilyGoalProgress,
  BossHistoryList,
  ContributionLeaderboard,
} from '../components/bossbattle';
import { Skeleton } from '../components/common';
import type { BossBattle as BossBattleType, FamilyParty } from '@chorechamp/types';

// Mock data for demo - in real app, this would come from API
const mockBoss: BossBattleType = {
  id: 'boss-1',
  householdId: 'household-1',
  name: 'The Mess Monster',
  description: 'A fearsome creature born from uncleaned rooms and dirty dishes!',
  icon: '👹',
  healthMax: 100,
  healthCurrent: 35,
  pointReward: 500,
  startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  endsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
  defeatedAt: null,
};

const mockParty: FamilyParty = {
  householdId: 'household-1',
  healthCurrent: 85,
  healthMax: 100,
  weeklyGoal: 20,
  weeklyProgress: 14,
  bossActive: true,
  bossId: 'boss-1',
};

const mockPastBosses: BossBattleType[] = [
  {
    id: 'boss-0',
    householdId: 'household-1',
    name: 'Dust Bunny King',
    description: 'Ruler of dusty corners!',
    icon: '🐰',
    healthMax: 80,
    healthCurrent: 0,
    pointReward: 300,
    startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    endsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    defeatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  },
];

export default function BossBattle() {
  const { householdId } = useParams<{ householdId: string }>();
  const { user } = useAuth();

  const { data: household, isLoading: loadingHousehold } = useHousehold(householdId!);
  const { data: members, isLoading: loadingMembers } = useMembers(householdId!);

  const currentMember = members?.find((m) => m.userId === user?.id);
  const isLoading = loadingHousehold || loadingMembers;

  // Mock contributors based on members
  const mockContributors = members?.map((member, i) => ({
    memberId: member.id,
    memberName: member.name,
    memberColor: member.color || '#3B82F6',
    damage: Math.max(0, 30 - i * 8 + Math.floor(Math.random() * 10)),
    chores: Math.max(1, 5 - i + Math.floor(Math.random() * 3)),
  })) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-xl" />
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-48 rounded-lg" />
              <Skeleton className="h-48 rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Household not found</p>
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
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/households/${householdId}`}
              className="text-gray-500 hover:text-gray-700"
            >
              ←
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Boss Battle</h1>
              <p className="text-sm text-gray-500">{household.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-6">
          {/* Current Boss */}
          <BossCard boss={mockBoss} />

          {/* How it works banner */}
          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="font-semibold text-blue-900">How Boss Battles Work</h3>
            <ul className="mt-2 text-sm text-blue-700 space-y-1">
              <li>• Complete chores to deal damage to the boss</li>
              <li>• Each chore completion deals damage based on point value</li>
              <li>• Work together as a family to defeat the boss before time runs out!</li>
              <li>• Victory rewards bonus points split among all contributors</li>
            </ul>
          </div>

          {/* Two column layout */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left column */}
            <div className="space-y-6">
              <FamilyGoalProgress party={mockParty} />
              <ContributionLeaderboard
                contributors={mockContributors}
                currentUserId={currentMember?.id}
              />
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <BossHistoryList bosses={[mockBoss, ...mockPastBosses]} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
