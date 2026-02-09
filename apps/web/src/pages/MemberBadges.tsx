import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import { useHousehold, useMembers, useMemberBadges } from '@chorechamp/api-client';
import type { Badge, BadgeCategory } from '@chorechamp/types';
import {
  BadgeGrid,
  BadgeCategorySection,
  BadgeDetailModal,
  ALL_BADGES,
  BADGE_CATEGORIES,
} from '../components/badges';
import { Skeleton } from '../components/common';

type ViewMode = 'grid' | 'category';

export default function MemberBadges() {
  const { householdId, memberId } = useParams<{
    householdId: string;
    memberId: string;
  }>();

  const { data: household, isLoading: loadingHousehold } = useHousehold(householdId!);
  const { data: members, isLoading: loadingMembers } = useMembers(householdId!);
  const { data: memberBadges, isLoading: loadingBadges } = useMemberBadges(
    householdId!,
    memberId!
  );

  const [viewMode, setViewMode] = useState<ViewMode>('category');
  const [categoryFilter, setCategoryFilter] = useState<BadgeCategory | 'all'>('all');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showLocked, setShowLocked] = useState(true);

  const member = members?.find((m) => m.id === memberId);
  const isLoading = loadingHousehold || loadingMembers || loadingBadges;

  // Create earned badges map
  const earnedBadgeIds = memberBadges?.map((b) => b.id) || [];
  const earnedDates: Record<string, Date> = {};
  // Note: In a real implementation, memberBadges would include earnedAt date

  // Progress map would come from the API based on current stats
  const progressMap: Record<string, number> = {};

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </main>
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

  const totalBadges = ALL_BADGES.filter((b) => !b.isHidden).length;
  const earnedCount = earnedBadgeIds.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/households/${householdId}/members/${memberId}/points`}
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
                <h1 className="text-xl font-bold text-gray-900">{member.name}'s Badges</h1>
                <p className="text-sm text-gray-500">
                  {earnedCount} / {totalBadges} badges earned
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Summary */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-3 w-full rounded-full bg-gray-200">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
                  style={{ width: `${(earnedCount / totalBadges) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {Math.round((earnedCount / totalBadges) * 100)}% of all badges collected
              </p>
            </div>
            <div className="flex items-center gap-2 text-3xl">
              🏆
              <span className="text-xl font-bold text-gray-900">{earnedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('category')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                viewMode === 'category'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              By Category
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Badges
            </button>
          </div>

          <div className="flex items-center gap-4">
            {viewMode === 'grid' && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as BadgeCategory | 'all')}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              >
                <option value="all">All Categories</option>
                {BADGE_CATEGORIES.map((cat: { value: BadgeCategory; label: string; icon: string }) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            )}

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showLocked}
                onChange={(e) => setShowLocked(e.target.checked)}
                className="rounded border-gray-300"
              />
              Show locked
            </label>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {viewMode === 'category' ? (
          <div className="space-y-8">
            {BADGE_CATEGORIES.map((category: { value: BadgeCategory; label: string; icon: string }) => (
              <BadgeCategorySection
                key={category.value}
                category={category.value}
                badges={showLocked ? ALL_BADGES : ALL_BADGES.filter((b) => earnedBadgeIds.includes(b.id))}
                earnedBadgeIds={earnedBadgeIds}
                earnedDates={earnedDates}
                progressMap={progressMap}
                onBadgeClick={setSelectedBadge}
              />
            ))}
          </div>
        ) : (
          <BadgeGrid
            badges={ALL_BADGES}
            earnedBadgeIds={earnedBadgeIds}
            earnedDates={earnedDates}
            progressMap={progressMap}
            filter={categoryFilter}
            showLocked={showLocked}
            onBadgeClick={setSelectedBadge}
          />
        )}
      </main>

      {/* Badge Detail Modal */}
      <BadgeDetailModal
        badge={selectedBadge}
        earned={selectedBadge ? earnedBadgeIds.includes(selectedBadge.id) : false}
        earnedAt={selectedBadge ? earnedDates[selectedBadge.id] : undefined}
        progress={selectedBadge ? progressMap[selectedBadge.id] : undefined}
        onClose={() => setSelectedBadge(null)}
      />
    </div>
  );
}
