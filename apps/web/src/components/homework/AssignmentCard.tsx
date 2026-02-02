import type { Assignment, AssignmentPriority, AssignmentStatus } from '@chorechamp/types';

interface AssignmentCardProps {
  assignment: Assignment & {
    subject?: { id: string; name: string; color: string } | null;
  };
  onStatusChange?: (assignmentId: string, status: AssignmentStatus) => void;
  onEdit?: (assignment: Assignment) => void;
  onClick?: (assignmentId: string) => void;
}

const priorityConfig: Record<AssignmentPriority, { label: string; color: string; bg: string }> = {
  low: { label: 'Low', color: 'text-gray-600', bg: 'bg-gray-100' },
  medium: { label: 'Medium', color: 'text-blue-600', bg: 'bg-blue-100' },
  high: { label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
  urgent: { label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100' },
};

const statusConfig: Record<AssignmentStatus, { label: string; color: string; bg: string }> = {
  not_started: { label: 'Not Started', color: 'text-gray-600', bg: 'bg-gray-100' },
  in_progress: { label: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-100' },
  completed: { label: 'Completed', color: 'text-green-600', bg: 'bg-green-100' },
  overdue: { label: 'Overdue', color: 'text-red-600', bg: 'bg-red-100' },
  submitted: { label: 'Submitted', color: 'text-purple-600', bg: 'bg-purple-100' },
};

const typeIcons: Record<string, string> = {
  homework: '📝',
  quiz: '📋',
  test: '📊',
  project: '🎯',
  essay: '✍️',
  reading: '📖',
  worksheet: '📄',
  other: '📌',
};

export function AssignmentCard({
  assignment,
  onStatusChange,
  onEdit,
  onClick,
}: AssignmentCardProps) {
  const priority = priorityConfig[assignment.priority];
  const status = statusConfig[assignment.status];

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  };

  const formatMinutes = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const isOverdue = new Date(assignment.dueDate) < new Date() &&
    assignment.status !== 'completed' && assignment.status !== 'submitted';

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow ${
        isOverdue ? 'border-l-4 border-red-500' : ''
      }`}
      onClick={() => onClick?.(assignment.id)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{typeIcons[assignment.assignmentType]}</span>
            <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
          </div>

          {assignment.subject && (
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: assignment.subject.color }}
              />
              <span className="text-sm text-gray-600">{assignment.subject.name}</span>
            </div>
          )}

          {assignment.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {assignment.description}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${status.bg} ${status.color}`}>
            {status.label}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${priority.bg} ${priority.color}`}>
            {priority.label}
          </span>
        </div>
      </div>

      {/* Due date and time estimate */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
          <span>📅</span> {formatDate(assignment.dueDate)}
        </span>
        {assignment.estimatedMinutes && (
          <span className="flex items-center gap-1 text-gray-600">
            <span>⏱️</span> Est. {formatMinutes(assignment.estimatedMinutes)}
          </span>
        )}
        {assignment.actualMinutes && (
          <span className="flex items-center gap-1 text-blue-600">
            <span>✓</span> Actual: {formatMinutes(assignment.actualMinutes)}
          </span>
        )}
      </div>

      {/* Grade if available */}
      {(assignment.grade || assignment.earnedPoints !== null) && (
        <div className="mt-3 flex items-center gap-4 text-sm">
          {assignment.grade && (
            <span className="font-medium text-green-600">Grade: {assignment.grade}</span>
          )}
          {assignment.earnedPoints !== null && assignment.maxPoints && (
            <span className="text-gray-600">
              {assignment.earnedPoints}/{assignment.maxPoints} points
            </span>
          )}
        </div>
      )}

      {/* Quick actions */}
      {onStatusChange && assignment.status !== 'completed' && assignment.status !== 'submitted' && (
        <div
          className="mt-4 pt-4 border-t border-gray-100 flex gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {assignment.status === 'not_started' && (
            <button
              onClick={() => onStatusChange(assignment.id, 'in_progress')}
              className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100"
            >
              Start Working
            </button>
          )}
          {assignment.status === 'in_progress' && (
            <>
              <button
                onClick={() => onStatusChange(assignment.id, 'completed')}
                className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded text-sm hover:bg-green-100"
              >
                Mark Complete
              </button>
              <button
                onClick={() => onStatusChange(assignment.id, 'submitted')}
                className="flex-1 px-3 py-2 bg-purple-50 text-purple-700 rounded text-sm hover:bg-purple-100"
              >
                Mark Submitted
              </button>
            </>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(assignment)}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            >
              Edit
            </button>
          )}
        </div>
      )}
    </div>
  );
}
