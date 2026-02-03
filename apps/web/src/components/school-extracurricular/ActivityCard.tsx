import type { ExtracurricularActivity } from '@chorechamp/types';

interface ActivityCardProps {
  activity: ExtracurricularActivity;
  onEdit?: (activity: ExtracurricularActivity) => void;
  onDelete?: (id: string) => void;
  onViewSchedule?: (activity: ExtracurricularActivity) => void;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  sports: { label: 'Sports', icon: '\u26BD', color: '#22c55e' },
  music: { label: 'Music', icon: '\uD83C\uDFB5', color: '#8b5cf6' },
  arts: { label: 'Arts', icon: '\uD83C\uDFA8', color: '#ec4899' },
  academic: { label: 'Academic', icon: '\uD83D\uDCDA', color: '#3b82f6' },
  volunteer: { label: 'Volunteer', icon: '\u2764\uFE0F', color: '#ef4444' },
  club: { label: 'Club', icon: '\uD83D\uDC65', color: '#f59e0b' },
  religious: { label: 'Religious', icon: '\u2728', color: '#6366f1' },
  other: { label: 'Other', icon: '\uD83D\uDCCC', color: '#6b7280' },
};

const COMMITMENT_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Low Commitment', color: 'bg-green-100 text-green-800' },
  medium: { label: 'Medium Commitment', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'High Commitment', color: 'bg-orange-100 text-orange-800' },
  competitive: { label: 'Competitive', color: 'bg-red-100 text-red-800' },
};

const SEASON_LABELS: Record<string, string> = {
  fall: 'Fall',
  winter: 'Winter',
  spring: 'Spring',
  summer: 'Summer',
  year_round: 'Year Round',
};

export function ActivityCard({ activity, onEdit, onDelete, onViewSchedule }: ActivityCardProps) {
  const categoryConfig = CATEGORY_CONFIG[activity.category] || CATEGORY_CONFIG.other;
  const commitmentConfig = COMMITMENT_CONFIG[activity.commitmentLevel] || COMMITMENT_CONFIG.low;

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: `${categoryConfig.color}15` }}
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{categoryConfig.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{activity.name}</h3>
            {activity.organization && (
              <p className="text-sm text-gray-600">{activity.organization}</p>
            )}
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          activity.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {activity.isActive ? 'Active' : 'Inactive'}
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <span
            className="px-2 py-1 rounded text-xs font-medium"
            style={{ backgroundColor: `${categoryConfig.color}20`, color: categoryConfig.color }}
          >
            {categoryConfig.label}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${commitmentConfig.color}`}>
            {commitmentConfig.label}
          </span>
          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
            {SEASON_LABELS[activity.season]}
          </span>
        </div>

        {activity.description && (
          <p className="text-sm text-gray-600 mb-4">{activity.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500">Weekly Hours</p>
            <p className="font-semibold text-lg">{activity.weeklyHours} hrs</p>
          </div>
          {activity.choreAdjustmentPercent > 0 && (
            <div>
              <p className="text-xs text-gray-500">Chore Reduction</p>
              <p className="font-semibold text-lg text-green-600">-{activity.choreAdjustmentPercent}%</p>
            </div>
          )}
        </div>

        {(activity.seasonStartDate || activity.seasonEndDate) && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <span>&#128197;</span>
            <span>
              {formatDate(activity.seasonStartDate)} - {formatDate(activity.seasonEndDate) || 'Ongoing'}
            </span>
          </div>
        )}

        {activity.coachName && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <span>&#128100;</span>
            <span>
              Coach: {activity.coachName}
              {activity.coachContact && ` (${activity.coachContact})`}
            </span>
          </div>
        )}

        {activity.location && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <span>&#128205;</span>
            <span>{activity.location}</span>
          </div>
        )}

        {activity.equipmentNeeded && activity.equipmentNeeded.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Equipment Needed</p>
            <div className="flex flex-wrap gap-1">
              {activity.equipmentNeeded.map((item, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {activity.cost !== null && activity.cost !== undefined && activity.cost > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <span>&#128176;</span>
            <span>Cost: ${activity.cost}</span>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4 border-t">
          {onViewSchedule && (
            <button
              onClick={() => onViewSchedule(activity)}
              className="px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 rounded text-blue-600"
            >
              Schedule
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(activity)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(activity.id)}
              className="px-3 py-1 text-sm bg-red-50 hover:bg-red-100 rounded text-red-600"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
