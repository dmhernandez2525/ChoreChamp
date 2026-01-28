import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import {
  ActivityFeed,
  ActivityFilter,
  ActivityStats,
  MemberActivitySummary,
  categoryActivityTypes,
} from '../components/activity';
import type { Activity, ActivityCategory } from '../components/activity';

// Demo activities for development
const demoActivities: Activity[] = [
  {
    id: '1',
    type: 'chore_completed',
    title: 'completed "Take out trash"',
    description: 'Earned 15 points',
    memberId: 'member-1',
    memberName: 'Emma',
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
    metadata: { choreId: 'chore-1', points: 15 },
  },
  {
    id: '2',
    type: 'badge_earned',
    title: 'earned the "Early Bird" badge',
    description: 'Complete 5 chores before 9am',
    memberId: 'member-2',
    memberName: 'Jake',
    createdAt: new Date(Date.now() - 1000 * 60 * 45),
    metadata: { badgeId: 'early-bird' },
  },
  {
    id: '3',
    type: 'points_earned',
    title: 'earned 50 bonus points',
    description: 'Streak bonus for 7-day streak',
    memberId: 'member-1',
    memberName: 'Emma',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    metadata: { points: 50 },
  },
  {
    id: '4',
    type: 'reward_redeemed',
    title: 'redeemed "Extra Screen Time"',
    description: 'Cost: 100 points',
    memberId: 'member-2',
    memberName: 'Jake',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    metadata: { rewardId: 'reward-1', cost: 100 },
  },
  {
    id: '5',
    type: 'chore_approved',
    title: 'approved "Clean bedroom" for Emma',
    description: '',
    memberId: 'member-3',
    memberName: 'Mom',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    id: '6',
    type: 'boss_damage',
    title: 'dealt 25 damage to "The Dust Dragon"',
    description: 'Boss HP: 175/500',
    memberId: 'member-1',
    memberName: 'Emma',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
    metadata: { bossId: 'boss-1', damage: 25 },
  },
  {
    id: '7',
    type: 'streak_achieved',
    title: 'achieved a 14-day streak',
    description: 'Keep it going!',
    memberId: 'member-2',
    memberName: 'Jake',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    metadata: { streakDays: 14 },
  },
  {
    id: '8',
    type: 'chore_completed',
    title: 'completed "Wash dishes"',
    description: 'Earned 20 points',
    memberId: 'member-3',
    memberName: 'Mom',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
    metadata: { choreId: 'chore-2', points: 20 },
  },
  {
    id: '9',
    type: 'reward_fulfilled',
    title: 'fulfilled reward "Pizza Night" for Jake',
    description: '',
    memberId: 'member-3',
    memberName: 'Mom',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
  {
    id: '10',
    type: 'goal_completed',
    title: 'completed family goal "100 chores this month"',
    description: 'The family earned a bonus reward!',
    memberId: 'member-1',
    memberName: 'Emma',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
  },
  {
    id: '11',
    type: 'member_joined',
    title: 'joined the household',
    description: 'Welcome to ChoreChamp!',
    memberId: 'member-4',
    memberName: 'Grandma',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96),
  },
  {
    id: '12',
    type: 'boss_defeated',
    title: 'defeated "The Laundry Monster"',
    description: 'The family earned 500 bonus points!',
    memberId: 'member-2',
    memberName: 'Jake',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120),
    metadata: { bossId: 'boss-0', bonusPoints: 500 },
  },
];

const demoMembers = [
  { id: 'member-1', name: 'Emma' },
  { id: 'member-2', name: 'Jake' },
  { id: 'member-3', name: 'Mom' },
  { id: 'member-4', name: 'Grandma' },
];

export default function Activity() {
  const { householdId } = useParams<{ householdId: string }>();
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>();

  const filteredActivities = useMemo(() => {
    let result = demoActivities;

    // Filter by category
    const allowedTypes = categoryActivityTypes[selectedCategory];
    if (allowedTypes) {
      result = result.filter((a) => allowedTypes.includes(a.type));
    }

    // Filter by member
    if (selectedMemberId) {
      result = result.filter((a) => a.memberId === selectedMemberId);
    }

    return result;
  }, [selectedCategory, selectedMemberId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={`/households/${householdId}`}>
              <Button variant="ghost" size="sm">
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Activity Feed</h1>
              <p className="text-sm text-gray-500">See what's happening in your household</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <ActivityStats activities={demoActivities} className="mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main feed */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <ActivityFilter
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedMemberId={selectedMemberId}
                onMemberChange={setSelectedMemberId}
                members={demoMembers}
              />
            </div>

            {/* Activity list */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <ActivityFeed
                activities={filteredActivities}
                emptyMessage="No activity matching your filters"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <MemberActivitySummary activities={demoActivities} />

            {/* Quick links */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  to={`/households/${householdId}/leaderboard`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  <span>🏆</span>
                  <span>View Leaderboard</span>
                </Link>
                <Link
                  to={`/households/${householdId}/boss-battle`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  <span>⚔️</span>
                  <span>Boss Battle</span>
                </Link>
                <Link
                  to={`/households/${householdId}/rewards`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  <span>🎁</span>
                  <span>Rewards Store</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
