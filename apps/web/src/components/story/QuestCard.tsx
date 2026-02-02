import { cn } from '@chorechamp/ui';

interface QuestObjective {
  id: string;
  type: string;
  description: string;
  target: string | number;
  current: number;
  required: number;
  isCompleted: boolean;
}

interface QuestReward {
  xp: number;
  points: number;
  cardPackId: string | null;
  specificCardId: string | null;
  badgeId: string | null;
  petItem: string | null;
  customReward: string | null;
}

interface StoryQuest {
  id: string;
  chapterId: string;
  orderInChapter: number;
  title: string;
  description: string;
  briefing: string;
  debriefing: string;
  objectives: QuestObjective[];
  rewards: QuestReward;
  timeLimit: number | null;
  isOptional: boolean;
  isBonusQuest: boolean;
}

interface QuestProgress {
  questId: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  objectives: QuestObjective[];
  startedAt: Date | null;
  completedAt: Date | null;
  timeSpent: number;
}

interface QuestCardProps {
  quest: StoryQuest;
  progress: QuestProgress;
  onStart?: () => void;
  onContinue?: () => void;
  onView?: () => void;
  className?: string;
}

export function QuestCard({
  quest,
  progress,
  onStart,
  onContinue,
  onView,
  className,
}: QuestCardProps) {
  const isLocked = progress.status === 'locked';
  const isAvailable = progress.status === 'available';
  const isInProgress = progress.status === 'in_progress';
  const isCompleted = progress.status === 'completed';

  const completedObjectives = progress.objectives.filter(o => o.isCompleted).length;
  const totalObjectives = progress.objectives.length;
  const progressPercentage = totalObjectives > 0 ? (completedObjectives / totalObjectives) * 100 : 0;

  return (
    <div
      className={cn(
        'bg-white rounded-xl border-2 p-4 transition-all duration-200',
        isLocked && 'opacity-50 border-gray-200',
        isAvailable && 'border-indigo-200 hover:border-indigo-400 hover:shadow-md',
        isInProgress && 'border-yellow-400 shadow-md',
        isCompleted && 'border-green-400',
        className
      )}
    >
      {/* Quest header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center font-bold text-white',
              isLocked && 'bg-gray-400',
              isAvailable && 'bg-indigo-500',
              isInProgress && 'bg-yellow-500',
              isCompleted && 'bg-green-500'
            )}
          >
            {isCompleted ? '✓' : quest.orderInChapter}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{quest.title}</h3>
            <div className="flex items-center gap-2 text-sm">
              {quest.isOptional && (
                <span className="text-purple-600 font-medium">Optional</span>
              )}
              {quest.isBonusQuest && (
                <span className="text-yellow-600 font-medium">⭐ Bonus</span>
              )}
              {quest.timeLimit && (
                <span className="text-gray-500">⏱️ {quest.timeLimit}min limit</span>
              )}
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div
          className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            isLocked && 'bg-gray-100 text-gray-500',
            isAvailable && 'bg-indigo-100 text-indigo-700',
            isInProgress && 'bg-yellow-100 text-yellow-700',
            isCompleted && 'bg-green-100 text-green-700'
          )}
        >
          {isLocked && '🔒 Locked'}
          {isAvailable && '✨ Available'}
          {isInProgress && '▶️ In Progress'}
          {isCompleted && '✓ Complete'}
        </div>
      </div>

      {/* Quest description */}
      <p className="text-sm text-gray-600 mb-4">{quest.description}</p>

      {/* Objectives */}
      {(isInProgress || isCompleted) && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Objectives</h4>
          <div className="space-y-2">
            {progress.objectives.map((objective) => (
              <div
                key={objective.id}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg text-sm',
                  objective.isCompleted ? 'bg-green-50' : 'bg-gray-50'
                )}
              >
                <span
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-xs',
                    objective.isCompleted ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                  )}
                >
                  {objective.isCompleted ? '✓' : '○'}
                </span>
                <span className={objective.isCompleted ? 'text-green-700' : 'text-gray-700'}>
                  {objective.description}
                </span>
                {!objective.isCompleted && objective.required > 1 && (
                  <span className="ml-auto text-gray-500">
                    {objective.current}/{objective.required}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {isInProgress && (
            <div className="mt-3">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1 text-right">
                {completedObjectives}/{totalObjectives} objectives
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rewards */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Rewards</h4>
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="flex items-center gap-1 text-purple-600">
            <span>✨</span>
            {quest.rewards.xp} XP
          </span>
          <span className="flex items-center gap-1 text-yellow-600">
            <span>🪙</span>
            {quest.rewards.points} pts
          </span>
          {quest.rewards.cardPackId && (
            <span className="flex items-center gap-1 text-blue-600">
              <span>🎴</span>
              Card Pack
            </span>
          )}
          {quest.rewards.badgeId && (
            <span className="flex items-center gap-1 text-orange-600">
              <span>🏅</span>
              Badge
            </span>
          )}
          {quest.rewards.petItem && (
            <span className="flex items-center gap-1 text-pink-600">
              <span>🎁</span>
              Pet Item
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {isAvailable && onStart && (
          <button
            onClick={onStart}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-colors"
          >
            Start Quest
          </button>
        )}
        {isInProgress && onContinue && (
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-lg font-medium hover:from-yellow-500 hover:to-yellow-600 transition-colors"
          >
            Continue Quest
          </button>
        )}
        {isCompleted && onView && (
          <button
            onClick={onView}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            View Details
          </button>
        )}
        {isLocked && (
          <div className="flex-1 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg font-medium text-center cursor-not-allowed">
            Complete previous quest first
          </div>
        )}
      </div>

      {/* Time spent for completed quests */}
      {isCompleted && progress.timeSpent > 0 && (
        <div className="mt-2 text-center text-sm text-gray-500">
          Completed in {progress.timeSpent} minutes
        </div>
      )}
    </div>
  );
}

interface QuestListProps {
  quests: Array<{ quest: StoryQuest; progress: QuestProgress }>;
  onStartQuest: (questId: string) => void;
  onContinueQuest: (questId: string) => void;
  className?: string;
}

export function QuestList({
  quests,
  onStartQuest,
  onContinueQuest,
  className,
}: QuestListProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {quests.map(({ quest, progress }) => (
        <QuestCard
          key={quest.id}
          quest={quest}
          progress={progress}
          onStart={() => onStartQuest(quest.id)}
          onContinue={() => onContinueQuest(quest.id)}
        />
      ))}
    </div>
  );
}
