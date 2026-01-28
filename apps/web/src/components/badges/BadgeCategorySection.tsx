import type { Badge, BadgeCategory } from '@chorechamp/types';
import { BadgeCard } from './BadgeCard';
import { BADGE_CATEGORIES } from './badgeData';

interface BadgeCategorySectionProps {
  category: BadgeCategory;
  badges: Badge[];
  earnedBadgeIds: string[];
  earnedDates?: Record<string, Date>;
  progressMap?: Record<string, number>;
  onBadgeClick?: (badge: Badge) => void;
}

export function BadgeCategorySection({
  category,
  badges,
  earnedBadgeIds,
  earnedDates = {},
  progressMap = {},
  onBadgeClick,
}: BadgeCategorySectionProps) {
  const categoryInfo = BADGE_CATEGORIES.find((c) => c.value === category);
  const categoryBadges = badges.filter(
    (b) => b.category === category && (!b.isHidden || earnedBadgeIds.includes(b.id))
  );

  if (categoryBadges.length === 0) return null;

  const earnedCount = categoryBadges.filter((b) => earnedBadgeIds.includes(b.id)).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{categoryInfo?.icon}</span>
          <h3 className="font-semibold text-gray-900">{categoryInfo?.label}</h3>
        </div>
        <span className="text-sm text-gray-500">
          {earnedCount} / {categoryBadges.length} earned
        </span>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {categoryBadges.map((badge) => (
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
    </div>
  );
}
