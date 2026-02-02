import { AcademicAchievement, ACHIEVEMENT_ICONS, AchievementType } from '@chorechamp/types';

interface AcademicAchievementBadgeProps {
  achievement: AcademicAchievement;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onCelebrate?: () => void;
}

const achievementColors: Record<AchievementType, { bg: string; border: string; text: string }> = {
  honor_roll: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800' },
  principals_list: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-800' },
  perfect_attendance: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800' },
  improvement: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800' },
  subject_excellence: { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-800' },
  gpa_milestone: { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-800' },
  streak: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800' },
  custom: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-800' },
};

const sizeClasses = {
  sm: 'p-2 text-sm',
  md: 'p-4 text-base',
  lg: 'p-6 text-lg',
};

const iconSizes = {
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-5xl',
};

export function AcademicAchievementBadge({ achievement, showDetails = false, size = 'md', onCelebrate }: AcademicAchievementBadgeProps) {
  const colors = achievementColors[achievement.achievementType as AchievementType] || achievementColors.custom;
  const icon = ACHIEVEMENT_ICONS[achievement.achievementType as AchievementType] || ACHIEVEMENT_ICONS.custom;

  if (!showDetails) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-lg border-2 ${colors.bg} ${colors.border} ${sizeClasses[size]}`}
        title={achievement.description}
      >
        <span className={iconSizes[size]}>{icon}</span>
        <span className={`font-semibold ${colors.text}`}>{achievement.title}</span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border-2 ${colors.bg} ${colors.border} ${sizeClasses[size]}`}>
      <div className="flex items-start gap-4">
        <div className={`${iconSizes[size]} flex-shrink-0`}>{icon}</div>
        <div className="flex-1">
          <h4 className={`font-semibold ${colors.text}`}>{achievement.title}</h4>
          <p className="text-gray-600 text-sm mt-1">{achievement.description}</p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="text-gray-500">
              {new Date(achievement.earnedAt).toLocaleDateString()}
            </span>
            {achievement.bonusEarned > 0 && (
              <span className="text-yellow-600 font-medium">
                +{achievement.bonusEarned} points
              </span>
            )}
          </div>
        </div>
        {!achievement.celebrationShown && onCelebrate && (
          <button
            onClick={onCelebrate}
            className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Celebrate!
          </button>
        )}
      </div>
    </div>
  );
}
