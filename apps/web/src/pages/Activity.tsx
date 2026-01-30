import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import { useActivityFeed, useMembers } from '@chorechamp/api-client';
import {
  ActivityFeed,
  ActivityFilter,
  ActivityStats,
  MemberActivitySummary,
  categoryActivityTypes,
} from '../components/activity';
import { Skeleton } from '../components/common';
import type { Activity, ActivityCategory, ActivityType } from '../components/activity';
import type { ActivityItem as ApiActivityItem } from '@chorechamp/types';

// Map API activity types to component activity types
function mapApiActivityToComponent(item: ApiActivityItem): Activity {
  return {
    id: item.id,
    type: item.type as ActivityType,
    title: item.title,
    description: item.description,
    memberId: item.memberId,
    memberName: item.memberName,
    createdAt: new Date(item.timestamp),
    metadata: item.metadata,
  };
}

export default function Activity() {
  const { householdId } = useParams<{ householdId: string }>();
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>();

  const { data: activityData, isLoading: loadingActivity } = useActivityFeed(householdId!, {
    limit: 100,
    memberId: selectedMemberId,
  });
  const { data: members, isLoading: loadingMembers } = useMembers(householdId!);

  const isLoading = loadingActivity || loadingMembers;

  // Transform API data to component format
  const activities = useMemo(() => {
    if (!activityData?.activities) return [];
    return activityData.activities.map(mapApiActivityToComponent);
  }, [activityData]);

  const filteredActivities = useMemo(() => {
    let result = activities;

    // Filter by category (member filter is handled by API)
    const allowedTypes = categoryActivityTypes[selectedCategory];
    if (allowedTypes) {
      result = result.filter((a) => allowedTypes.includes(a.type));
    }

    return result;
  }, [activities, selectedCategory]);

  const memberOptions = useMemo(() => {
    return members?.map((m) => ({ id: m.id, name: m.name })) || [];
  }, [members]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-16" />
              <div>
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-56 mt-1" />
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">
          <Skeleton className="h-24 rounded-xl mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-96 rounded-xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

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
        <ActivityStats activities={activities} className="mb-6" />

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
                members={memberOptions}
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
            <MemberActivitySummary activities={activities} />

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
