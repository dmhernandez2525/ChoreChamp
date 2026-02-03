import { Skill, MemberSkillProgress, MASTERY_LEVELS, MasteryLevel } from '@chorechamp/types';

interface SkillCardProps {
  skill: Skill;
  progress?: MemberSkillProgress | null;
  onStart?: () => void;
  onPractice?: () => void;
  onView?: () => void;
}

export function SkillCard({ skill, progress, onStart, onPractice, onView }: SkillCardProps) {
  const masteryLevel = progress?.masteryLevel || 'novice';
  const masteryConfig = MASTERY_LEVELS[masteryLevel as MasteryLevel] || MASTERY_LEVELS.novice;
  const xpProgress = progress ? Math.min(100, Math.round((progress.currentXp / skill.xpRequired) * 100)) : 0;

  const getStatusBadge = () => {
    if (!progress || progress.status === 'locked') {
      return <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Locked</span>;
    }
    if (progress.status === 'mastered') {
      return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Mastered</span>;
    }
    if (progress.status === 'completed') {
      return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Completed</span>;
    }
    if (progress.status === 'in_progress') {
      return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">In Progress</span>;
    }
    return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Available</span>;
  };

  const isLocked = !progress || progress.status === 'locked';

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${isLocked ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
            {skill.iconUrl ? (
              <img src={skill.iconUrl} alt="" className="w-6 h-6" />
            ) : (
              <span className="text-gray-400">{'⭐'}</span>
            )}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{skill.name}</h4>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Tier {skill.tier}</span>
              <span>•</span>
              <span>Level {skill.level}</span>
            </div>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{skill.description}</p>

      {/* Mastery & XP Progress */}
      {progress && progress.status !== 'locked' && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span style={{ color: masteryConfig.color }} className="font-medium">
              {masteryConfig.label}
            </span>
            <span className="text-gray-500">
              {progress.currentXp} / {skill.xpRequired} XP
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${xpProgress}%`, backgroundColor: masteryConfig.color }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      {progress && progress.practiceCount > 0 && (
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span>{progress.practiceCount} practices</span>
          <span>{progress.totalPracticeMinutes} min total</span>
        </div>
      )}

      {/* Tutorial/Video Links */}
      {(skill.videoTutorialUrl || skill.articleUrl) && (
        <div className="flex items-center gap-2 mb-3">
          {skill.videoTutorialUrl && (
            <a
              href={skill.videoTutorialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              Watch Tutorial
            </a>
          )}
          {skill.articleUrl && (
            <a
              href={skill.articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              Read Guide
            </a>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t">
        {isLocked ? (
          <button disabled className="flex-1 py-2 text-sm bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed">
            {skill.prerequisites.length > 0 ? 'Complete Prerequisites' : 'Locked'}
          </button>
        ) : !progress || progress.status === 'available' ? (
          <button
            onClick={onStart}
            className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start Learning
          </button>
        ) : (
          <>
            <button
              onClick={onPractice}
              className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Practice
            </button>
            <button
              onClick={onView}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Details
            </button>
          </>
        )}
      </div>
    </div>
  );
}
