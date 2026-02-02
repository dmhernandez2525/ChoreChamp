import type { Subject } from '@chorechamp/types';

interface SubjectCardProps {
  subject: Subject;
  assignmentCount?: number;
  upcomingDueCount?: number;
  onEdit?: (subject: Subject) => void;
  onArchive?: (subjectId: string) => void;
  onClick?: (subjectId: string) => void;
}

export function SubjectCard({
  subject,
  assignmentCount = 0,
  upcomingDueCount = 0,
  onEdit,
  onArchive,
  onClick,
}: SubjectCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-md p-4 border-l-4 cursor-pointer hover:shadow-lg transition-shadow ${
        subject.isArchived ? 'opacity-60' : ''
      }`}
      style={{ borderLeftColor: subject.color }}
      onClick={() => onClick?.(subject.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: subject.color }}
          >
            {subject.shortName || subject.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{subject.name}</h3>
            {subject.teacherName && (
              <p className="text-sm text-gray-500">{subject.teacherName}</p>
            )}
          </div>
        </div>

        {subject.isArchived && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
            Archived
          </span>
        )}
      </div>

      {/* Schedule and room */}
      {(subject.schedule || subject.roomNumber) && (
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-600">
          {subject.schedule && (
            <span className="flex items-center gap-1">
              <span>📅</span> {subject.schedule}
            </span>
          )}
          {subject.roomNumber && (
            <span className="flex items-center gap-1">
              <span>🚪</span> Room {subject.roomNumber}
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-gray-50 rounded">
          <p className="text-lg font-bold text-gray-900">{assignmentCount}</p>
          <p className="text-xs text-gray-500">Assignments</p>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded">
          <p className="text-lg font-bold text-orange-600">{upcomingDueCount}</p>
          <p className="text-xs text-gray-500">Due Soon</p>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded">
          <p className="text-lg font-bold text-blue-600">{subject.currentGrade || '-'}</p>
          <p className="text-xs text-gray-500">Grade</p>
        </div>
      </div>

      {/* Target grade */}
      {subject.targetGrade && (
        <div className="mt-3 text-sm text-gray-600">
          Target: <span className="font-medium">{subject.targetGrade}</span>
        </div>
      )}

      {/* Actions */}
      {(onEdit || onArchive) && (
        <div
          className="mt-4 pt-4 border-t border-gray-100 flex gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <button
              onClick={() => onEdit(subject)}
              className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            >
              Edit
            </button>
          )}
          {onArchive && !subject.isArchived && (
            <button
              onClick={() => onArchive(subject.id)}
              className="px-3 py-2 bg-red-50 text-red-700 rounded text-sm hover:bg-red-100"
            >
              Archive
            </button>
          )}
        </div>
      )}
    </div>
  );
}
