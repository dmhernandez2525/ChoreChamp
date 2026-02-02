import { AcademicGoal } from '@chorechamp/types';

interface AcademicGoalCardProps {
  goal: AcademicGoal;
  onEdit?: () => void;
  onDelete?: () => void;
}

const goalTypeLabels: Record<string, { label: string; icon: string }> = {
  gpa: { label: 'GPA Goal', icon: '4.0' },
  grade: { label: 'Grade Goal', icon: 'A' },
  attendance: { label: 'Attendance Goal', icon: '%' },
  improvement: { label: 'Improvement Goal', icon: '+' },
  honor_roll: { label: 'Honor Roll', icon: '*' },
};

export function AcademicGoalCard({ goal, onEdit, onDelete }: AcademicGoalCardProps) {
  const typeInfo = goalTypeLabels[goal.goalType] || { label: 'Goal', icon: '?' };
  const progressPercentage = Math.min(100, Math.round((goal.currentProgress / goal.targetValue) * 100));

  const getProgressColor = () => {
    if (goal.isAchieved) return 'bg-green-500';
    if (progressPercentage >= 75) return 'bg-blue-500';
    if (progressPercentage >= 50) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getTargetDisplay = () => {
    switch (goal.goalType) {
      case 'gpa':
        return `${goal.targetValue.toFixed(2)} GPA`;
      case 'grade':
        return goal.targetGrade || 'A';
      case 'attendance':
        return `${goal.targetValue}%`;
      case 'improvement':
        return `+${goal.targetValue} points`;
      case 'honor_roll':
        return 'Honor Roll';
      default:
        return goal.targetValue.toString();
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-5 ${goal.isAchieved ? 'ring-2 ring-green-400' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
            goal.isAchieved ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {typeInfo.icon}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{typeInfo.label}</h4>
            {goal.subjectName && (
              <p className="text-sm text-gray-500">{goal.subjectName}</p>
            )}
          </div>
        </div>
        {goal.isAchieved && (
          <span className="text-green-600 text-2xl">&#10003;</span>
        )}
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">
            {goal.goalType === 'gpa' ? goal.currentProgress.toFixed(2) : goal.currentProgress} / {getTargetDisplay()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${getProgressColor()}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1 text-gray-500">
          <span>{progressPercentage}% complete</span>
          {goal.deadline && (
            <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t">
        <div className="text-sm">
          <span className="text-gray-500">{goal.periodType}</span>
          <span className="mx-1 text-gray-300">|</span>
          <span className="text-gray-500">{goal.schoolYear}</span>
        </div>
        {goal.bonusOnAchievement > 0 && (
          <span className={`text-sm ${goal.isAchieved ? 'text-green-600' : 'text-gray-500'}`}>
            {goal.isAchieved ? 'Earned' : 'Reward'}: +{goal.bonusOnAchievement} pts
          </span>
        )}
      </div>

      {(onEdit || onDelete) && !goal.isAchieved && (
        <div className="flex gap-2 mt-3 pt-3 border-t">
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
