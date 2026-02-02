import { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  Star,
  Lock,
  ChevronRight,
  Award,
  Flame,
  Users,
  Zap,
  Calendar,
  Crown,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { Achievement, AchievementCategory, AchievementShowcase as ShowcaseType } from '@chorechamp/types';
import {
  getRarityColor,
  getRarityLabel,
  getAchievementCategoryLabel,
  getCategoryIcon,
} from '@chorechamp/types';

interface AchievementShowcaseProps {
  householdId: string;
  memberId?: string;
  onSelectAchievement?: (achievement: Achievement) => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  flag: Trophy,
  flame: Flame,
  trophy: Trophy,
  star: Star,
  calendar: Calendar,
  users: Users,
  award: Award,
};

export function AchievementShowcase({
  householdId,
  memberId,
  onSelectAchievement,
}: AchievementShowcaseProps) {
  const [showcase, setShowcase] = useState<ShowcaseType | null>(null);
  const [achievements, setAchievements] = useState<{
    unlocked: Achievement[];
    inProgress: Achievement[];
    locked: Achievement[];
    secret: number;
    stats: { total: number; unlocked: number; totalPoints: number };
  } | null>(null);
  const [levelProgress, setLevelProgress] = useState<{
    level: number;
    progress: number;
    pointsToNext: number;
  } | null>(null);
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!memberId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [showcaseResult, achievementsResult] = await Promise.all([
        apiClient.getAchievementShowcase(householdId, memberId),
        apiClient.getAchievements(householdId, { memberId }),
      ]);

      setShowcase(showcaseResult.showcase);
      setLevelProgress(showcaseResult.levelProgress);
      setAchievements(achievementsResult);
    } catch (err) {
      console.error('Failed to load achievements:', err);
      setError(err instanceof Error ? err.message : 'Failed to load achievements');
    } finally {
      setIsLoading(false);
    }
  }, [householdId, memberId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredAchievements = achievements
    ? {
        unlocked:
          activeCategory === 'all'
            ? achievements.unlocked
            : achievements.unlocked.filter((a) => a.category === activeCategory),
        inProgress:
          activeCategory === 'all'
            ? achievements.inProgress
            : achievements.inProgress.filter((a) => a.category === activeCategory),
        locked:
          activeCategory === 'all'
            ? achievements.locked
            : achievements.locked.filter((a) => a.category === activeCategory),
      }
    : null;

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          <span>{error}</span>
        </div>
        <button onClick={loadData} className="mt-3 text-sm text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500">
          Try again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!showcase || !achievements) return null;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{showcase.memberName}</h2>
              <p className="text-white/80">{showcase.title}</p>
            </div>
          </div>
          <button onClick={loadData} className="p-2 hover:bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50" aria-label="Refresh achievements">
            <RefreshCw className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Level Progress */}
        {levelProgress && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Level {levelProgress.level}</span>
              <span className="text-sm">{levelProgress.pointsToNext} pts to next level</span>
            </div>
            <div
              className="h-3 bg-white/20 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={levelProgress.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Level ${levelProgress.level} progress: ${levelProgress.progress}%`}
            >
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${levelProgress.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold">{achievements.stats.unlocked}</p>
            <p className="text-xs text-white/70">Achievements</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{achievements.stats.totalPoints}</p>
            <p className="text-xs text-white/70">Total Points</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{showcase.stats.longestStreak}</p>
            <p className="text-xs text-white/70">Best Streak</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{showcase.stats.totalChoresCompleted}</p>
            <p className="text-xs text-white/70">Chores Done</p>
          </div>
        </div>
      </div>

      {/* Featured Achievements */}
      {showcase.featuredAchievements.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" aria-hidden="true" />
            Featured Achievements
          </h3>
          <div className="flex flex-wrap gap-4">
            {showcase.featuredAchievements.map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                onClick={() => onSelectAchievement?.(achievement)}
                size="large"
              />
            ))}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-full whitespace-nowrap ${
            activeCategory === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          All
        </button>
        {(['milestones', 'streaks', 'challenges', 'special', 'mastery', 'social'] as AchievementCategory[]).map(
          (category) => {
            const IconComponent = CATEGORY_ICONS[getCategoryIcon(category)] || Trophy;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap ${
                  activeCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                <IconComponent className="w-4 h-4" aria-hidden="true" />
                {getAchievementCategoryLabel(category)}
              </button>
            );
          }
        )}
      </div>

      {/* Unlocked Achievements */}
      {filteredAchievements && filteredAchievements.unlocked.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" aria-hidden="true" />
            Unlocked ({filteredAchievements.unlocked.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredAchievements.unlocked.map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                onClick={() => onSelectAchievement?.(achievement)}
              />
            ))}
          </div>
        </div>
      )}

      {/* In Progress */}
      {filteredAchievements && filteredAchievements.inProgress.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" aria-hidden="true" />
            In Progress ({filteredAchievements.inProgress.length})
          </h3>
          <div className="space-y-3">
            {filteredAchievements.inProgress.map((achievement) => (
              <AchievementProgressCard
                key={achievement.id}
                achievement={achievement}
                onClick={() => onSelectAchievement?.(achievement)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {filteredAchievements && filteredAchievements.locked.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-400" aria-hidden="true" />
            Locked ({filteredAchievements.locked.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredAchievements.locked.map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                locked
                onClick={() => onSelectAchievement?.(achievement)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Secret Achievements */}
      {achievements.secret > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            <span className="font-medium">{achievements.secret}</span> secret achievements to discover
          </p>
        </div>
      )}
    </div>
  );
}

function AchievementBadge({
  achievement,
  onClick,
  locked = false,
  size = 'normal',
}: {
  achievement: Achievement;
  onClick?: () => void;
  locked?: boolean;
  size?: 'normal' | 'large';
}) {
  const sizeClasses = size === 'large' ? 'w-24 h-24' : 'w-16 h-16';
  const iconSize = size === 'large' ? 'w-10 h-10' : 'w-6 h-6';

  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
        locked
          ? 'opacity-50 hover:opacity-75'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      <div
        className={`${sizeClasses} rounded-full flex items-center justify-center relative`}
        style={{
          backgroundColor: locked ? '#6B7280' : `${getRarityColor(achievement.rarity)}20`,
          borderColor: locked ? '#6B7280' : getRarityColor(achievement.rarity),
          borderWidth: 3,
        }}
      >
        {locked ? (
          <Lock className={iconSize} style={{ color: '#9CA3AF' }} />
        ) : (
          <Award className={iconSize} style={{ color: achievement.iconColor }} />
        )}
      </div>
      <div className="text-center">
        <p className={`font-medium text-gray-900 dark:text-gray-100 ${size === 'large' ? 'text-sm' : 'text-xs'}`}>
          {locked && achievement.isSecret ? '???' : achievement.name}
        </p>
        {!locked && (
          <p className="text-xs" style={{ color: getRarityColor(achievement.rarity) }}>
            {getRarityLabel(achievement.rarity)}
          </p>
        )}
      </div>
    </button>
  );
}

function AchievementProgressCard({
  achievement,
  onClick,
}: {
  achievement: Achievement;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: `${getRarityColor(achievement.rarity)}20`,
          borderColor: getRarityColor(achievement.rarity),
          borderWidth: 2,
        }}
      >
        <Award className="w-6 h-6" style={{ color: achievement.iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">{achievement.name}</h4>
          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            {achievement.progress}%
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{achievement.description}</p>
        <div
          className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={achievement.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${achievement.name} progress: ${achievement.progress}%`}
        >
          <div
            className="h-full bg-indigo-600 rounded-full transition-all"
            style={{ width: `${achievement.progress}%` }}
          />
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
    </button>
  );
}
