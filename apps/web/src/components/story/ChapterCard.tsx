import { cn } from '@chorechamp/ui';

interface ChapterReward {
  xp: number;
  points: number;
  cardPackId: string | null;
  exclusiveCardId: string | null;
  characterUnlock: string | null;
  badgeId: string | null;
  title: string | null;
}

interface StoryChapter {
  id: string;
  number: number;
  title: string;
  description: string;
  artwork: string;
  theme: string;
  difficulty: 'easy' | 'medium' | 'hard';
  requiredLevel: number;
  rewards: ChapterReward;
  estimatedDuration: number;
}

interface ChapterProgress {
  chapterId: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  questsCompleted: number;
  totalQuests: number;
  completionPercentage: number;
  starsEarned: number;
}

interface ChapterCardProps {
  chapter: StoryChapter;
  progress: ChapterProgress;
  memberLevel: number;
  onClick?: () => void;
  className?: string;
}

const themeIcons: Record<string, string> = {
  bedroom: '🛏️',
  kitchen: '🍳',
  bathroom: '🚿',
  living_room: '🛋️',
  outdoor: '🌳',
  garage: '🚗',
  whole_house: '🏠',
};

const difficultyConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  easy: { label: 'Easy', color: 'text-green-600', bgColor: 'bg-green-100' },
  medium: { label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  hard: { label: 'Hard', color: 'text-red-600', bgColor: 'bg-red-100' },
};

export function ChapterCard({
  chapter,
  progress,
  memberLevel,
  onClick,
  className,
}: ChapterCardProps) {
  const isLocked = progress.status === 'locked';
  const isCompleted = progress.status === 'completed';
  const isInProgress = progress.status === 'in_progress';
  const levelLocked = memberLevel < chapter.requiredLevel;
  const themeIcon = themeIcons[chapter.theme] || '📍';
  const difficulty = difficultyConfig[chapter.difficulty];

  return (
    <div
      onClick={!isLocked ? onClick : undefined}
      className={cn(
        'relative overflow-hidden rounded-2xl transition-all duration-300',
        !isLocked && 'cursor-pointer hover:scale-[1.02] hover:shadow-xl',
        isLocked && 'opacity-60 cursor-not-allowed',
        isCompleted && 'ring-2 ring-green-500',
        isInProgress && 'ring-2 ring-yellow-500',
        className
      )}
    >
      {/* Chapter artwork/background */}
      <div className="relative aspect-video">
        {chapter.artwork ? (
          <img
            src={chapter.artwork}
            alt={chapter.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-8xl">{themeIcon}</span>
          </div>
        )}

        {/* Overlay for locked chapters */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <span className="text-4xl mb-2 block">🔒</span>
              {levelLocked ? (
                <span className="text-sm">Requires Level {chapter.requiredLevel}</span>
              ) : (
                <span className="text-sm">Complete previous chapter first</span>
              )}
            </div>
          </div>
        )}

        {/* Completed overlay */}
        {isCompleted && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            ✓ Complete
          </div>
        )}

        {/* In progress badge */}
        {isInProgress && (
          <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
            In Progress
          </div>
        )}

        {/* Chapter number */}
        <div className="absolute top-4 left-4 bg-white/90 text-gray-900 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
          {chapter.number}
        </div>

        {/* Stars earned */}
        {isCompleted && progress.starsEarned > 0 && (
          <div className="absolute bottom-4 right-4 bg-black/60 text-yellow-400 px-3 py-1 rounded-full flex items-center gap-1">
            {[1, 2, 3].map((star) => (
              <span
                key={star}
                className={star <= progress.starsEarned ? 'text-yellow-400' : 'text-gray-500'}
              >
                ⭐
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Chapter info */}
      <div className="bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg text-gray-900">{chapter.title}</h3>
          <span className={cn('text-2xl')}>{themeIcon}</span>
        </div>

        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{chapter.description}</p>

        {/* Progress bar for in-progress chapters */}
        {isInProgress && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{progress.questsCompleted}/{progress.totalQuests} quests</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                style={{ width: `${progress.completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 text-sm">
          <span className={cn('px-2 py-1 rounded-full', difficulty.bgColor, difficulty.color)}>
            {difficulty.label}
          </span>
          <span className="text-gray-400">~{chapter.estimatedDuration}min</span>
          <span className="text-gray-400">Lvl {chapter.requiredLevel}+</span>
        </div>

        {/* Rewards preview */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <span className="text-purple-500">✨</span>
              {chapter.rewards.xp} XP
            </span>
            <span className="flex items-center gap-1">
              <span className="text-yellow-500">🪙</span>
              {chapter.rewards.points} pts
            </span>
            {chapter.rewards.cardPackId && (
              <span className="flex items-center gap-1">
                <span>🎴</span>
                Pack
              </span>
            )}
            {chapter.rewards.title && (
              <span className="flex items-center gap-1">
                <span>🏷️</span>
                Title
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ChapterListProps {
  chapters: Array<{ chapter: StoryChapter; progress: ChapterProgress }>;
  memberLevel: number;
  onSelectChapter: (chapterId: string) => void;
  className?: string;
}

export function ChapterList({
  chapters,
  memberLevel,
  onSelectChapter,
  className,
}: ChapterListProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {chapters.map(({ chapter, progress }) => (
        <ChapterCard
          key={chapter.id}
          chapter={chapter}
          progress={progress}
          memberLevel={memberLevel}
          onClick={() => onSelectChapter(chapter.id)}
        />
      ))}
    </div>
  );
}
