import { MentorshipRelation } from '@chorechamp/types';

interface MentorshipCardProps {
  mentorship: MentorshipRelation;
  memberNames: { mentor: string; mentee: string };
  skillName: string;
  isMentor?: boolean;
  onAccept?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function MentorshipCard({
  mentorship,
  memberNames,
  skillName,
  isMentor = false,
  onAccept,
  onComplete,
  onCancel,
}: MentorshipCardProps) {
  const getStatusColor = () => {
    switch (mentorship.status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'active': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'cancelled': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-xl">{isMentor ? '👨‍🏫' : '👨‍🎓'}</span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              {isMentor ? `Teaching ${memberNames.mentee}` : `Learning from ${memberNames.mentor}`}
            </h4>
            <p className="text-sm text-gray-500">{skillName}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor()}`}>
          {mentorship.status.charAt(0).toUpperCase() + mentorship.status.slice(1)}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div>
          <div className="text-lg font-semibold text-gray-900">{mentorship.sessionsCompleted}</div>
          <div className="text-xs text-gray-500">Sessions</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">{mentorship.totalSessionMinutes}</div>
          <div className="text-xs text-gray-500">Minutes</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-purple-600">
            +{isMentor ? mentorship.mentorXpEarned : mentorship.menteeXpEarned}
          </div>
          <div className="text-xs text-gray-500">XP Earned</div>
        </div>
      </div>

      {/* Actions */}
      {mentorship.status === 'pending' && isMentor && onAccept && (
        <div className="flex gap-2 pt-3 border-t">
          <button
            onClick={onAccept}
            className="flex-1 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Accept
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Decline
          </button>
        </div>
      )}

      {mentorship.status === 'active' && (
        <div className="flex gap-2 pt-3 border-t">
          {isMentor && onComplete && (
            <button
              onClick={onComplete}
              className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Mark Complete
            </button>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
            >
              End Mentorship
            </button>
          )}
        </div>
      )}

      {mentorship.notes && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-sm text-gray-600">{mentorship.notes}</p>
        </div>
      )}
    </div>
  );
}
