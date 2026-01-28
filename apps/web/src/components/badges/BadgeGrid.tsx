import type { Badge, BadgeCategory } from '@chorechamp/types';
import { BadgeCard } from './BadgeCard';
import type { BadgeDefinition } from './badgeData';

interface BadgeGridProps {
  badges: BadgeDefinition[];
  earnedBadgeIds: string[];
  earnedDates?: Record<string, Date>;
  progressMap?: Record<string, number>;
  filter?: BadgeCategory | 'all';
  showLocked?: boolean;
  onBadgeClick?: (badge: Badge) => void;
}

export function BadgeGrid({
  badges,
  earnedBadgeIds,
  earnedDates = {},
  progressMap = {},
  filter = 'all',
  showLocked = true,
  onBadgeClick,
}: BadgeGridProps) {
  const filteredBadges = badges.filter((badge) => {
    if (filter !== 'all' && badge.category !== filter) return false;
    if (!showLocked && !earnedBadgeIds.includes(badge.id)) return false;
    if (badge.isHidden && !earnedBadgeIds.includes(badge.id)) return false;
    return true;
  });

  // Sort: earned first, then by progress, then by rarity
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
  const sortedBadges = [...filteredBadges].sort((a, b) => {
    const aEarned = earnedBadgeIds.includes(a.id);
    const bEarned = earnedBadgeIds.includes(b.id);
    if (aEarned && !bEarned) return -1;
    if (!aEarned && bEarned) return 1;

    const aProgress = progressMap[a.id] || 0;
    const bProgress = progressMap[b.id] || 0;
    if (aProgress !== bProgress) return bProgress - aProgress;

    return rarityOrder[a.rarity] - rarityOrder[b.rarity];
  });

  if (sortedBadges.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <div className="text-4xl mb-2">🏆</div>
        <h3 className="font-medium text-gray-900">No badges found</h3>
        <p className="mt-1 text-sm text-gray-500">
          {filter !== 'all'
            ? 'No badges in this category'
            : 'Start completing chores to earn badges!'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {sortedBadges.map((badge) => (
        <BadgeCard
          key={badge.id}
          badge={badge}
          earned={earnedBadgeIds.includes(badge.id)}
          earnedAt={earnedDates[badge.id]}
          progress={progressMap[badge.id]}
          onClick={onBadgeClick ? () => onBadgeClick(badge) : undefined}
        />
      ))}
    </div>
  );
}
