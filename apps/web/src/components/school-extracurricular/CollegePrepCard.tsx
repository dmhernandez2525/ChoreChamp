import type { CollegePrepActivity } from '@chorechamp/types';

interface CollegePrepCardProps {
  activity: CollegePrepActivity;
  onUpdateStatus?: (id: string, status: 'not_started' | 'in_progress' | 'completed') => void;
  onEdit?: (activity: CollegePrepActivity) => void;
  onDelete?: (id: string) => void;
}

const ACTIVITY_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  test_prep: { label: 'Test Prep', icon: '\uD83D\uDCDD', color: '#3b82f6' },
  college_visit: { label: 'College Visit', icon: '\uD83C\uDFDB', color: '#22c55e' },
  application: { label: 'Application', icon: '\uD83D\uDCC4', color: '#f59e0b' },
  essay: { label: 'Essay', icon: '\u270D\uFE0F', color: '#8b5cf6' },
  recommendation: { label: 'Recommendation', icon: '\uD83D\uDCE7', color: '#ec4899' },
  interview: { label: 'Interview', icon: '\uD83D\uDCAC', color: '#ef4444' },
  scholarship: { label: 'Scholarship', icon: '\uD83D\uDCB0', color: '#10b981' },
  other: { label: 'Other', icon: '\uD83D\uDCC5', color: '#6b7280' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'High', color: 'bg-red-100 text-red-700' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  not_started: { label: 'Not Started', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  in_progress: { label: 'In Progress', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  completed: { label: 'Completed', color: 'text-green-600', bgColor: 'bg-green-100' },
};

export function CollegePrepCard({ activity, onUpdateStatus, onEdit, onDelete }: CollegePrepCardProps) {
  const typeConfig = ACTIVITY_TYPE_CONFIG[activity.activityType] || ACTIVITY_TYPE_CONFIG.other;
  const priorityConfig = PRIORITY_CONFIG[activity.priority] || PRIORITY_CONFIG.low;
  const statusConfig = STATUS_CONFIG[activity.status] || STATUS_CONFIG.not_started;

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = activity.dueDate && new Date(activity.dueDate) < new Date() && activity.status !== 'completed';

  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${
      isOverdue ? 'border-red-300' : 'border-gray-200'
    }`}>
      <div
        className="px-4 py-2 flex items-center space-x-3"
        style={{ backgroundColor: `${typeConfig.color}15` }}
      >
        <span className="text-xl">{typeConfig.icon}</span>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{activity.title}</h4>
          {activity.relatedCollege && (
            <p className="text-xs text-gray-600">{activity.relatedCollege}</p>
          )}
        </div>
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
        >
          {typeConfig.label}
        </span>
      </div>

      <div className="p-4">
        {activity.description && (
          <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityConfig.color}`}>
            {priorityConfig.label} Priority
          </span>
        </div>

        {activity.dueDate && (
          <div className={`flex items-center space-x-2 text-sm mb-3 ${
            isOverdue ? 'text-red-600' : 'text-gray-600'
          }`}>
            <span>&#128197;</span>
            <span>
              Due: {formatDate(activity.dueDate)}
              {isOverdue && <span className="ml-1 font-medium">(Overdue!)</span>}
            </span>
          </div>
        )}

        {activity.completedAt && (
          <div className="flex items-center space-x-2 text-sm text-green-600 mb-3">
            <span>\u2713</span>
            <span>Completed: {formatDate(activity.completedAt)}</span>
          </div>
        )}

        {activity.attachments && activity.attachments.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Attachments</p>
            <div className="flex flex-wrap gap-1">
              {activity.attachments.map((attachment, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700">
                  &#128206; {attachment.split('/').pop()}
                </span>
              ))}
            </div>
          </div>
        )}

        {activity.notes && (
          <p className="text-xs text-gray-500 italic mb-3">{activity.notes}</p>
        )}

        {onUpdateStatus && activity.status !== 'completed' && (
          <div className="flex space-x-2 mb-3">
            {activity.status === 'not_started' && (
              <button
                onClick={() => onUpdateStatus(activity.id, 'in_progress')}
                className="px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 rounded text-blue-600"
              >
                Start
              </button>
            )}
            <button
              onClick={() => onUpdateStatus(activity.id, 'completed')}
              className="px-3 py-1 text-sm bg-green-50 hover:bg-green-100 rounded text-green-600"
            >
              Complete
            </button>
          </div>
        )}

        {(onEdit || onDelete) && (
          <div className="flex justify-end space-x-2 pt-3 border-t">
            {onEdit && (
              <button
                onClick={() => onEdit(activity)}
                className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(activity.id)}
                className="px-2 py-0.5 text-xs bg-red-50 hover:bg-red-100 rounded text-red-600"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
