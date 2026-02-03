import type { ActivityEvent } from '@chorechamp/types';

interface EventCardProps {
  event: ActivityEvent;
  activityName?: string;
  onEdit?: (event: ActivityEvent) => void;
  onDelete?: (id: string) => void;
}

const EVENT_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  practice: { label: 'Practice', icon: '\uD83C\uDFCB\uFE0F', color: '#22c55e' },
  game: { label: 'Game', icon: '\uD83C\uDFC6', color: '#f59e0b' },
  competition: { label: 'Competition', icon: '\uD83E\uDD47', color: '#ef4444' },
  performance: { label: 'Performance', icon: '\uD83C\uDFAD', color: '#8b5cf6' },
  meeting: { label: 'Meeting', icon: '\uD83D\uDCAC', color: '#3b82f6' },
  class: { label: 'Class', icon: '\uD83D\uDCDD', color: '#6366f1' },
  volunteer: { label: 'Volunteer', icon: '\u2764\uFE0F', color: '#ec4899' },
  other: { label: 'Other', icon: '\uD83D\uDCC5', color: '#6b7280' },
};

export function EventCard({ event, activityName, onEdit, onDelete }: EventCardProps) {
  const eventConfig = EVENT_CONFIG[event.eventType] || EVENT_CONFIG.other;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isPast = new Date(event.eventDate) < new Date();

  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${
      isPast ? 'opacity-60' : ''
    }`}>
      <div
        className="px-4 py-2 flex items-center space-x-3"
        style={{ backgroundColor: `${eventConfig.color}15` }}
      >
        <span className="text-xl">{eventConfig.icon}</span>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{event.title}</h4>
          {activityName && (
            <p className="text-xs text-gray-600">{activityName}</p>
          )}
        </div>
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{ backgroundColor: `${eventConfig.color}20`, color: eventConfig.color }}
        >
          {eventConfig.label}
        </span>
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-sm">
            <span>&#128197;</span>
            <span className="font-medium">{formatDate(event.eventDate)}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>&#128337;</span>
            <span>
              {formatTime(event.startTime)}
              {event.endTime && ` - ${formatTime(event.endTime)}`}
            </span>
          </div>
        </div>

        {event.location && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <span>&#128205;</span>
            <span>{event.location}</span>
          </div>
        )}

        {event.opponent && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <span>&#9878;</span>
            <span>
              vs {event.opponent}
              {event.isHomeGame !== null && (
                <span className="ml-1 text-xs text-gray-500">
                  ({event.isHomeGame ? 'Home' : 'Away'})
                </span>
              )}
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          {event.attendanceRequired && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
              Required
            </span>
          )}
          {event.choreExemption && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
              Chore Exempt
            </span>
          )}
          {event.reminderSent && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
              Reminder Sent
            </span>
          )}
        </div>

        {event.notes && (
          <p className="text-xs text-gray-500 mt-2 italic">{event.notes}</p>
        )}

        {(onEdit || onDelete) && (
          <div className="flex justify-end space-x-2 mt-3 pt-2 border-t">
            {onEdit && (
              <button
                onClick={() => onEdit(event)}
                className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(event.id)}
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
