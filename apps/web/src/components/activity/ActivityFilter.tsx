import { cn } from '@chorechamp/ui';
import type { ActivityType } from './ActivityItem';

export type ActivityCategory = 'all' | 'chores' | 'rewards' | 'achievements' | 'team';

interface ActivityFilterProps {
  selectedCategory: ActivityCategory;
  onCategoryChange: (category: ActivityCategory) => void;
  selectedMemberId?: string;
  onMemberChange?: (memberId: string | undefined) => void;
  members?: Array<{ id: string; name: string }>;
}

const categories: { id: ActivityCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '📋' },
  { id: 'chores', label: 'Chores', icon: '🧹' },
  { id: 'rewards', label: 'Rewards', icon: '🎁' },
  { id: 'achievements', label: 'Achievements', icon: '🏆' },
  { id: 'team', label: 'Team', icon: '👨‍👩‍👧‍👦' },
];

export const categoryActivityTypes: Record<ActivityCategory, ActivityType[] | null> = {
  all: null,
  chores: ['chore_created', 'chore_completed', 'chore_approved', 'chore_rejected'],
  rewards: ['reward_created', 'reward_redeemed', 'reward_fulfilled', 'points_earned', 'points_spent'],
  achievements: ['badge_earned', 'streak_achieved', 'streak_lost', 'boss_damage', 'boss_defeated', 'goal_completed'],
  team: ['member_joined', 'member_left'],
};

export function ActivityFilter({
  selectedCategory,
  onCategoryChange,
  selectedMemberId,
  onMemberChange,
  members,
}: ActivityFilterProps) {
  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <span>{category.icon}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      {/* Member filter */}
      {members && members.length > 0 && onMemberChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Filter by member:</span>
          <select
            value={selectedMemberId || ''}
            onChange={(e) => onMemberChange(e.target.value || undefined)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All members</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
